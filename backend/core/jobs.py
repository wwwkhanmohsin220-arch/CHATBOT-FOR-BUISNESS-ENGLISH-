"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify background job orchestration.
Talha: Do not modify compile hooks unless coordinating backend integration.
"""

from __future__ import annotations

import importlib
from typing import Any

async def _maybe_run_talha_compile(user_id: str, slot_key: str, instance_id: str) -> None:
    try:
        compiler_module = importlib.import_module("backend.app.ai.compiler")
    except Exception:
        return

    compile_lesson = getattr(compiler_module, "compile_lesson", None)
    if compile_lesson is None:
        return

    maybe_result = compile_lesson(user_id=user_id, slot_key=slot_key, instance_id=instance_id)
    if hasattr(maybe_result, "__await__"):
        await maybe_result


async def compile_lesson_background(user_id: str, slot_key: str, instance_id: str) -> None:
    await _maybe_run_talha_compile(user_id=user_id, slot_key=slot_key, instance_id=instance_id)


async def compile_cold_start_background(user_id: str, slot_key: str, instance_id: str) -> None:
    await _maybe_run_talha_compile(user_id=user_id, slot_key=slot_key, instance_id=instance_id)
