"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify background job orchestration.
Talha: Do not modify compile hooks unless coordinating backend integration.
"""

from __future__ import annotations

import importlib
from typing import Any

async def _persist_bundle_nodes_and_branches(connection: Any, user_id: str, slot_key: str, instance_id: str, bundle: Any) -> None:
    import json
    
    # Check if we already have nodes for this instance (idempotency guard)
    exists = await connection.fetchval(
        "SELECT 1 FROM lesson_nodes WHERE lesson_instance_id = $1 LIMIT 1",
        instance_id
    )
    if exists:
        return
        
    # Insert spine nodes
    for index, node in enumerate(bundle.spine):
        node_type = node.node_type
        concept_tag = node.concept_tag
        content_json = json.dumps(node.content)
        
        await connection.execute(
            """
            INSERT INTO lesson_nodes (lesson_instance_id, position, node_type, concept_tag, content)
            VALUES ($1, $2, $3, $4, $5::jsonb)
            ON CONFLICT (lesson_instance_id, position) DO NOTHING
            """,
            instance_id,
            float(index),
            node_type,
            concept_tag,
            content_json
        )
    
    # Insert branches
    for concept_tag, branch in bundle.branches.items():
        content_json = json.dumps(branch.content)
        
        await connection.execute(
            """
            INSERT INTO lesson_branches (lesson_instance_id, concept_tag, content)
            VALUES ($1, $2, $3::jsonb)
            ON CONFLICT (lesson_instance_id, concept_tag) DO NOTHING
            """,
            instance_id,
            concept_tag,
            content_json
        )


async def _mark_instance_failed(instance_id: str, error_msg: str) -> None:
    from backend.core.database import database
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            await connection.execute(
                """
                UPDATE lesson_instances
                SET status = 'failed'
                WHERE id = $1
                """,
                instance_id
            )
            await connection.execute(
                """
                INSERT INTO llm_failures (task, error)
                VALUES ($1, $2)
                """,
                "compile_bg_failure",
                error_msg
            )
    except Exception as e:
        print(f"Error marking instance failed: {e}")


async def _run_compile_job(user_id: str, slot_key: str, instance_id: str) -> None:
    try:
        compiler_module = importlib.import_module("backend.app.ai.compiler")
    except Exception as e:
        await _mark_instance_failed(instance_id, f"Could not import compiler module: {e}")
        return

    compile_lesson = getattr(compiler_module, "compile_lesson", None)
    if compile_lesson is None:
        await _mark_instance_failed(instance_id, "compile_lesson function not found in compiler module")
        return

    try:
        maybe_result = compile_lesson(user_id=user_id, slot_key=slot_key, instance_id=instance_id)
        if hasattr(maybe_result, "__await__"):
            bundle = await maybe_result
        else:
            bundle = maybe_result

        from backend.core.database import database
        pool = await database.pool()
        async with pool.acquire() as connection:
            async with connection.transaction():
                await _persist_bundle_nodes_and_branches(connection, user_id, slot_key, instance_id, bundle)
                await connection.execute(
                    """
                    UPDATE lesson_instances
                    SET status = 'ready'
                    WHERE id = $1 AND status = 'compiling'
                    """,
                    instance_id
                )
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        await _mark_instance_failed(instance_id, f"Error in compile job: {e}\n{tb}")


async def compile_lesson_background(user_id: str, slot_key: str, instance_id: str) -> None:
    await _run_compile_job(user_id=user_id, slot_key=slot_key, instance_id=instance_id)


async def compile_cold_start_background(user_id: str, slot_key: str, instance_id: str) -> None:
    await _run_compile_job(user_id=user_id, slot_key=slot_key, instance_id=instance_id)
