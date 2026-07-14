"""
@ai-restriction
Primary Owner: Talha
Umer: Do not modify this module unless the task explicitly touches AI validation.
Mohsin: Do not use this file for REST/database runtime logic.
Talha: Own the Groq client, prompt repair loop, and structured generation helpers here.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any, AsyncIterator, TypeVar

from dotenv import load_dotenv
from pydantic import BaseModel, ValidationError

load_dotenv()

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
DEFAULT_MAX_REPAIRS = 2

T = TypeVar("T", bound=BaseModel)


class StructuredOutputError(RuntimeError):
    pass


@dataclass(slots=True)
class GroqChatResult:
    raw_text: str
    status_code: int


def chunk_text(text: str, *, chunk_size: int = 32) -> list[str]:
    cleaned = " ".join(text.split())
    if not cleaned:
        return []
    chunks: list[str] = []
    current = ""
    for word in cleaned.split(" "):
        candidate = f"{current} {word}".strip()
        if current and len(candidate) > chunk_size:
            chunks.append(current)
            current = word
        else:
            current = candidate
    if current:
        chunks.append(current)
    return chunks


def _extract_json(raw: str) -> str:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end >= start:
        return text[start : end + 1]
    return text


def _format_errors(exc: ValidationError | ValueError) -> str:
    if isinstance(exc, ValidationError):
        return exc.json()
    return str(exc)


async def log_llm_failure(
    task: str,
    model: str,
    error: str,
    raw_output: str,
    *,
    prompt_version: str | None = None,
    user_id: str | None = None,
) -> None:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        return
    try:
        import asyncpg
    except ImportError:
        return
    try:
        conn = await asyncpg.connect(database_url)
    except Exception:
        return
    try:
        await conn.execute(
            """
            insert into llm_failures (task, prompt_version, model, error, raw_output, user_id)
            values ($1, $2, $3, $4, $5, $6)
            """,
            task,
            prompt_version,
            model,
            error,
            raw_output,
            user_id,
        )
    except Exception:
        return
    finally:
        await conn.close()


def _groq_chat_sync(
    messages: list[dict[str, Any]],
    *,
    model: str = DEFAULT_GROQ_MODEL,
    temperature: float = 0.3,
    timeout: float = 60.0,
    json_mode: bool = False,
) -> GroqChatResult:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is required to call Groq")

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
        
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        GROQ_API_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}", 
            "Content-Type": "application/json",
            "User-Agent": "Buslingo/1.0"
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            response_body = response.read().decode("utf-8")
            status_code = getattr(response, "status", 200)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Groq request failed with status {exc.code}: {body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Groq request failed: {exc.reason}") from exc

    parsed = json.loads(response_body)
    try:
        raw_text = parsed["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"Unexpected Groq response shape: {response_body}") from exc
    return GroqChatResult(raw_text=raw_text, status_code=status_code)


async def groq_chat(
    messages: list[dict[str, Any]],
    *,
    model: str = DEFAULT_GROQ_MODEL,
    temperature: float = 0.3,
    timeout: float = 60.0,
    json_mode: bool = False,
) -> str:
    result = await asyncio.to_thread(
        _groq_chat_sync,
        messages,
        model=model,
        temperature=temperature,
        timeout=timeout,
        json_mode=json_mode,
    )
    return result.raw_text


async def groq_chat_stream(
    messages: list[dict[str, Any]],
    *,
    model: str = DEFAULT_GROQ_MODEL,
    temperature: float = 0.3,
    timeout: float = 60.0,
) -> AsyncIterator[str]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is required to call Groq")

    payload = {"model": model, "messages": messages, "temperature": temperature, "stream": True}
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        GROQ_API_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}", 
            "Content-Type": "application/json",
            "User-Agent": "Buslingo/1.0"
        },
        method="POST",
    )

    loop = asyncio.get_running_loop()
    queue: asyncio.Queue[str | None] = asyncio.Queue()
    error_holder: dict[str, str] = {}

    def _reader() -> None:
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                for raw_line in response:
                    line = raw_line.decode("utf-8", errors="replace").strip()
                    if not line or not line.startswith("data:"):
                        continue
                    data_line = line.removeprefix("data:").strip()
                    if data_line == "[DONE]":
                        loop.call_soon_threadsafe(queue.put_nowait, None)
                        return
                    try:
                        parsed = json.loads(data_line)
                    except json.JSONDecodeError:
                        continue
                    choices = parsed.get("choices") or []
                    if not choices:
                        continue
                    delta = choices[0].get("delta") or {}
                    chunk = delta.get("content")
                    if chunk:
                        loop.call_soon_threadsafe(queue.put_nowait, str(chunk))
        except Exception as exc:
            error_holder["error"] = str(exc)
            loop.call_soon_threadsafe(queue.put_nowait, None)

    reader_task = asyncio.create_task(asyncio.to_thread(_reader))
    try:
        while True:
            chunk = await queue.get()
            if chunk is None:
                if error_holder:
                    raise RuntimeError(error_holder["error"])
                break
            yield chunk
    finally:
        await reader_task


async def generate_validated(
    messages: list[dict[str, Any]],
    schema: type[T],
    task: str,
    model: str = DEFAULT_GROQ_MODEL,
    max_repairs: int = DEFAULT_MAX_REPAIRS,
) -> T:
    convo = list(messages)
    for _attempt in range(max_repairs + 1):
        raw = await groq_chat(convo, model=model, json_mode=True)
        text = _extract_json(raw)
        try:
            return schema.model_validate_json(text)
        except (ValidationError, ValueError) as exc:
            await log_llm_failure(task, model, str(exc)[:2000], raw[:4000])
            convo = convo + [
                {"role": "assistant", "content": raw},
                {
                    "role": "user",
                    "content": (
                        "Your JSON failed validation with these errors:\n"
                        f"{_format_errors(exc)}\n"
                        "Return the corrected, complete JSON object ONLY. No commentary."
                    ),
                },
            ]
    raise StructuredOutputError(task)

