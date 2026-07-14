"""
@ai-restriction
Primary Owner: Talha
Lesson compilation wrapper.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from backend.core.database import DatabaseNotConfigured, database
from backend.models.schema import LessonBundle, SlotContext
from backend.prompts.compile import build_compile_messages
from backend.utils.llm import StructuredOutputError, generate_validated, log_llm_failure

CURRICULUM_PATH = Path(__file__).resolve().parents[2] / "app" / "content" / "curriculum.json"
COMPILE_VERSION = os.getenv("COMPILE_VERSION", "compile_v1")


def _read_curriculum() -> dict[str, Any]:
    return json.loads(CURRICULUM_PATH.read_text(encoding="utf-8"))


def _find_slot(slot_key: str) -> dict[str, Any] | None:
    curriculum = _read_curriculum()
    for unit in curriculum.get("units", []):
        for slot in unit.get("slots", []):
            if slot.get("slot_key") == slot_key:
                slot_data = dict(slot)
                slot_data["unit_id"] = unit.get("id")
                slot_data["unit_title"] = unit.get("title")
                slot_data["unit_position"] = unit.get("position")
                return slot_data
    return None


def _slot_context(slot: dict[str, Any]) -> dict[str, Any]:
    context = {
        "slot_key": slot.get("slot_key"),
        "unit_title": slot.get("unit_title"),
        "position": slot.get("position"),
        "objectives": slot.get("objectives", []),
        "concept_tags": slot.get("concept_tags", []),
        "key_vocabulary": slot.get("key_vocabulary", []),
        "grammar_points": slot.get("grammar_points", []),
        "example_phrases": slot.get("example_phrases", []),
    }
    SlotContext.model_validate(
        {
            "objectives": context["objectives"],
            "concept_tags": context["concept_tags"],
            "key_vocabulary": context["key_vocabulary"],
            "grammar_points": context["grammar_points"],
            "example_phrases": context["example_phrases"],
        }
    )
    return context


def _profile_from_row(user_id: str, row: Any | None) -> dict[str, Any]:
    if row:
        return {
            "user_id": user_id,
            "display_name": row.get("display_name") if hasattr(row, "get") else row["display_name"],
            "level": row.get("level") if hasattr(row, "get") else row["level"],
            "coach_voice": row.get("coach_voice") if hasattr(row, "get") else row["coach_voice"],
            "timezone": row.get("timezone") if hasattr(row, "get") else row["timezone"],
            "daily_goal_min": row.get("daily_goal_min") if hasattr(row, "get") else row["daily_goal_min"],
            "weakness_tags": row.get("weakness_tags") if hasattr(row, "get") else row["weakness_tags"],
            "strength_tags": row.get("strength_tags") if hasattr(row, "get") else row["strength_tags"],
        }

    return {
        "user_id": user_id,
        "display_name": None,
        "level": "beginner",
        "coach_voice": "balanced",
        "timezone": "UTC",
        "daily_goal_min": 20,
        "weakness_tags": [],
        "strength_tags": [],
    }


def _fallback_bundle(slot: dict[str, Any], user_profile: dict[str, Any]) -> LessonBundle:
    concept_tags = slot.get("concept_tags") or ["small_talk"]
    primary_tag = concept_tags[0]
    title = slot.get("unit_title") or f"Lesson {slot.get('position', 1)}"
    objectives = slot.get("objectives") or ["Use professional English in a business context"]
    key_vocabulary = slot.get("key_vocabulary") or ["please", "meeting", "team", "thank you"]
    grammar_points = slot.get("grammar_points") or ["Present simple for professional introductions"]
    example_phrases = slot.get("example_phrases") or ["Hello, my name is Alex."]
    display_name = user_profile.get("display_name") or "there"

    return LessonBundle(
        title=title,
        spine=[
            {
                "node_type": "theory",
                "concept_tag": primary_tag,
                "content": {
                    "text": (
                        f"This lesson introduces {title.lower()} using short, professional language. "
                        f"Focus on {', '.join(objectives[:2])}."
                    ),
                    "key_vocabulary": key_vocabulary,
                    "grammar_points": grammar_points,
                    "example_phrase": example_phrases[0],
                },
            },
            {
                "node_type": "mcq",
                "concept_tag": primary_tag,
                "content": {
                    "question": f"Which reply fits a {user_profile.get('level', 'beginner')} learner in a business setting?",
                    "options": ["Hey, what are you doing?", "Hello, I'd like to introduce myself.", "Yo, let's talk later."],
                    "correct_index": 1,
                    "explanations": {"0": "Too casual.", "1": "Correct.", "2": "Too informal."}
                },
            },
            {
                "node_type": "mcq",
                "concept_tag": primary_tag,
                "content": {
                    "question": "How should you start a formal email?",
                    "options": ["Dear [Name],", "Hey there,", "What's up?"],
                    "correct_index": 0,
                    "explanations": {"0": "Professional.", "1": "Too casual.", "2": "Very informal."}
                },
            },
            {
                "node_type": "mcq",
                "concept_tag": primary_tag,
                "content": {
                    "question": "Which of these is a polite way to decline an invitation?",
                    "options": ["I can't.", "No way.", "I'm afraid I won't be able to make it."],
                    "correct_index": 2,
                    "explanations": {"0": "A bit abrupt.", "1": "Rude.", "2": "Polite and professional."}
                },
            },

            {
                "node_type": "writing",
                "concept_tag": primary_tag,
                "content": {
                    "prompt": "Write a short, polite self-introduction for a business meeting.",
                    "success_criteria": ["Uses a professional greeting", "States role or purpose clearly", "Sounds confident but not overly formal"],
                },
            },
            {
                "node_type": "voice",
                "concept_tag": "small_talk",
                "content": {
                    "scenario": f"You are speaking with a new colleague. The learner is {display_name}.",
                    "ai_persona": "A friendly business English coach who keeps the exchange natural.",
                    "objectives": objectives,
                    "opening_line": "Nice to meet you. Could you introduce yourself in one sentence?",
                },
            },

        ],
        branches={
            primary_tag: {
                "content": {
                    "text": "Quick Fix: soften direct requests and keep your tone professional.",
                    "micro_theory": "Start requests with 'I would like to' or 'Could we...?'",
                    "drill_mcq": {
                        "question": "Which phrase is the most professional?",
                        "options": [
                            "I want the report now.",
                            "Could we review the report together?",
                            "Send me that file.",
                        ],
                        "correct_index": 1,
                        "explanations": {
                            "0": "Too direct.",
                            "1": "Correct. It sounds polite and collaborative.",
                            "2": "Too abrupt.",
                        },
                    },
                }
            }
        },
    )


async def _load_user_profile(connection: Any, user_id: str) -> dict[str, Any]:
    row = await connection.fetchrow(
        """
        SELECT user_id, display_name, level, coach_voice, timezone, daily_goal_min, weakness_tags, strength_tags
        FROM user_profiles
        WHERE user_id = $1
        """,
        user_id,
    )
    return _profile_from_row(user_id, row)


async def _persist_compile_metadata(
    connection: Any,
    *,
    instance_id: str,
    slot_key: str,
    bundle: LessonBundle,
    user_profile: dict[str, Any],
) -> None:
    lesson_slot_id = await connection.fetchval(
        "SELECT id FROM lesson_slots WHERE slot_key = $1",
        slot_key,
    )
    if lesson_slot_id is None:
        return

    existing = await connection.fetchrow(
        """
        SELECT id, status
        FROM lesson_instances
        WHERE id = $1
        """,
        instance_id,
    )

    profile_snapshot = {
        "user_id": user_profile["user_id"],
        "display_name": user_profile.get("display_name"),
        "level": user_profile.get("level"),
        "coach_voice": user_profile.get("coach_voice"),
        "timezone": user_profile.get("timezone"),
        "daily_goal_min": user_profile.get("daily_goal_min"),
        "weakness_tags": user_profile.get("weakness_tags", []),
        "strength_tags": user_profile.get("strength_tags", []),
        "compiled_from": "curriculum.json",
        "compile_version": COMPILE_VERSION,
    }

    if existing:
        await connection.execute(
            """
            UPDATE lesson_instances
            SET title = $2,
                compile_version = $3,
                profile_snapshot = $4::jsonb,
                status = CASE WHEN status = 'compiling' THEN 'ready' ELSE status END
            WHERE id = $1
            """,
            instance_id,
            bundle.title,
            COMPILE_VERSION,
            json.dumps(profile_snapshot),
        )

        # Clear any existing nodes/branches if it's a recompile
        await connection.execute("DELETE FROM lesson_nodes WHERE lesson_instance_id = $1", instance_id)
        await connection.execute("DELETE FROM lesson_branches WHERE lesson_instance_id = $1", instance_id)

        # Insert spine nodes
        for index, node in enumerate(bundle.spine):
            await connection.execute(
                """
                INSERT INTO lesson_nodes
                  (lesson_instance_id, position, node_type, concept_tag, content)
                VALUES ($1, $2, $3, $4, $5::jsonb)
                """,
                instance_id,
                index,
                node.node_type,
                node.concept_tag,
                json.dumps(node.content),
            )

        # Insert branches
        for concept_tag, branch in bundle.branches.items():
            await connection.execute(
                """
                INSERT INTO lesson_branches (lesson_instance_id, concept_tag, content)
                VALUES ($1, $2, $3::jsonb)
                ON CONFLICT (lesson_instance_id, concept_tag) DO NOTHING
                """,
                instance_id,
                concept_tag,
                json.dumps(branch.content),
            )


async def _compile_or_fallback(
    *,
    connection,
    slot: dict[str, Any],
    user_profile: dict[str, Any],
) -> LessonBundle:
    try:
        # Blueprint v1 rule: compile from curriculum.json + user profile only.
        # RAG stays a future swap point, but it must not block lesson startup now.
        messages = build_compile_messages(_slot_context(slot), user_profile)
        return await generate_validated(messages, LessonBundle, task="compile", model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"))
    except Exception as exc:
        import traceback
        traceback.print_exc()
        try:
            await log_llm_failure(
                "compile",
                os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                str(exc)[:2000],
                raw_output=json.dumps({"slot_key": slot.get("slot_key"), "user_profile": user_profile})[:4000],
                user_id=user_profile.get("user_id"),
            )
        except Exception:
            pass
        return _fallback_bundle(slot, user_profile)


async def compile_lesson(*, user_id: str, slot_key: str, instance_id: str) -> LessonBundle:
    slot = _find_slot(slot_key)
    if slot is None:
        slot = {
            "slot_key": slot_key,
            "position": 1,
            "unit_title": f"Lesson for {slot_key}",
            "objectives": [
                "Use professional English in a business context",
                "Respond politely and clearly",
            ],
            "concept_tags": ["small_talk"],
            "key_vocabulary": ["meeting", "client", "team", "schedule"],
            "grammar_points": ["Present simple for introductions"],
            "example_phrases": ["Hello, my name is Alex."],
        }

    try:
        pool = await database.pool()
    except DatabaseNotConfigured:
        return _fallback_bundle(slot, {"user_id": user_id, "level": "beginner", "coach_voice": "balanced"})
    except Exception:
        return _fallback_bundle(slot, {"user_id": user_id, "level": "beginner", "coach_voice": "balanced"})

    async with pool.acquire() as connection:
        user_profile = await _load_user_profile(connection, user_id)
        bundle = await _compile_or_fallback(connection=connection, slot=slot, user_profile=user_profile)

        try:
            async with connection.transaction():
                await _persist_compile_metadata(
                    connection,
                    instance_id=instance_id,
                    slot_key=slot_key,
                    bundle=bundle,
                    user_profile=user_profile,
                )
        except Exception:
            # Compilation should still succeed even if metadata persistence fails.
            pass

    return bundle


async def generate_and_inject_dynamic_node(
    instance_id: str,
    node_type: str,
    concept_tag: str,
    current_position: float,
    chat_history: list[dict[str, str]],
) -> None:
    from backend.prompts.compile import build_dynamic_node_messages
    from backend.models.schema import LessonNode

    messages = build_dynamic_node_messages(node_type, concept_tag, chat_history)
    try:
        node = await generate_validated(messages, LessonNode, task="dynamic_node")
    except Exception as exc:
        import traceback
        traceback.print_exc()
        return

    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            injected_position = current_position + 0.5
            await connection.execute(
                """
                INSERT INTO lesson_nodes (lesson_instance_id, position, node_type, is_injected, concept_tag, content)
                VALUES ($1, $2, $3, TRUE, $4, $5::jsonb)
                ON CONFLICT (lesson_instance_id, position) DO NOTHING
                """,
                instance_id,
                injected_position,
                node.node_type,
                node.concept_tag,
                json.dumps(node.content),
            )
    except Exception as exc:
        import traceback
        traceback.print_exc()
