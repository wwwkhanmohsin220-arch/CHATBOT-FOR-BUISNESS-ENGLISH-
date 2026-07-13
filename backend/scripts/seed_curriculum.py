"""
@ai-restriction
Primary Owner: Talha
Seeds the fixed curriculum scaffold (units and lesson_slots) from curriculum.json.
"""

import asyncio
import asyncpg
import json
import os
from pathlib import Path
from dotenv import load_dotenv

_BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(_BACKEND_DIR / ".env")

DB_URL = os.environ["DATABASE_URL"]

async def seed_curriculum():
    print("Connecting to database...")
    conn = await asyncpg.connect(DB_URL, statement_cache_size=0)
    
    curriculum_path = _BACKEND_DIR / "app" / "content" / "curriculum.json"
    with open(curriculum_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    print("Wiping existing units and lesson slots...")
    # Because of foreign keys (lesson_instances), we must delete cascaded or clear instances first
    # reset_db.py already clears instances, so this should be safe.
    await conn.execute("DELETE FROM lesson_slots;")
    await conn.execute("DELETE FROM units;")
    
    print("Seeding curriculum scaffold...")
    for unit in data.get("units", []):
        unit_id = await conn.fetchval(
            """
            INSERT INTO units (position, title) 
            VALUES ($1, $2) 
            RETURNING id
            """,
            unit["position"], unit["title"]
        )
        print(f"Inserted Unit {unit['position']}: {unit['title']}")
        
        for slot in unit.get("slots", []):
            await conn.execute(
                """
                INSERT INTO lesson_slots (unit_id, position, slot_key)
                VALUES ($1, $2, $3)
                """,
                unit_id, slot["position"], slot["slot_key"]
            )
            print(f"  Inserted Slot {slot['position']}: {slot['slot_key']}")
            
    await conn.close()
    print("Curriculum seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed_curriculum())
