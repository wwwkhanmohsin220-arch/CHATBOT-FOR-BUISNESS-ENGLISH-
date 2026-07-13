"""
@ai-restriction
Primary Owner: Talha
Seeds mock fixtures (stats, XP, SRS) so that the frontend Dashboard has data to render.
"""

import asyncio
import asyncpg
import os
import datetime
from pathlib import Path
from dotenv import load_dotenv

_BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(_BACKEND_DIR / ".env")

DB_URL = os.environ["DATABASE_URL"]
USER_ID = os.environ.get("BUSLINGO_DEMO_USER_ID", "997dffe0-3ab9-4f56-9972-c086dca223d3")

async def seed_fixtures():
    print("Connecting to database...")
    conn = await asyncpg.connect(DB_URL, statement_cache_size=0)
    
    print("Wiping old fixtures for demo user...")
    await conn.execute("DELETE FROM activity_days WHERE user_id = $1", USER_ID)
    await conn.execute("DELETE FROM xp_events WHERE user_id = $1", USER_ID)
    await conn.execute("DELETE FROM srs_reviews WHERE card_id IN (SELECT id FROM srs_cards WHERE user_id = $1)", USER_ID)
    await conn.execute("DELETE FROM srs_cards WHERE user_id = $1", USER_ID)
    await conn.execute("DELETE FROM user_stats WHERE user_id = $1", USER_ID)
    await conn.execute("DELETE FROM user_profiles WHERE user_id = $1", USER_ID)
    
    print("Seeding user_profile...")
    await conn.execute("""
        INSERT INTO user_profiles (user_id, display_name, level, coach_voice)
        VALUES ($1, 'Demo User', 'intermediate', 'balanced')
        ON CONFLICT (user_id) DO NOTHING
    """, USER_ID)
    
    print("Seeding user_stats (Radar Chart)...")
    await conn.execute("""
        INSERT INTO user_stats (user_id, axis, value)
        VALUES 
        ($1, 'vocabulary', 65),
        ($1, 'grammar', 72),
        ($1, 'listening', 80),
        ($1, 'speaking', 45),
        ($1, 'writing', 60),
        ($1, 'tone', 85)
        ON CONFLICT (user_id, axis) DO NOTHING
    """, USER_ID)
    
    print("Seeding activity_days (Streaks)...")
    today = datetime.date.today()
    for i in range(5):
        day = today - datetime.timedelta(days=i)
        await conn.execute("""
            INSERT INTO activity_days (user_id, day, minutes, xp)
            VALUES ($1, $2, 25, 150)
            ON CONFLICT (user_id, day) DO NOTHING
        """, USER_ID, day)
        
    print("Seeding vocab_terms and srs_cards...")
    term_id_1 = await conn.fetchval("""
        INSERT INTO vocab_terms (term, phonetic, definition)
        VALUES ('mitigate', '/ˈmɪtɪɡeɪt/', 'Make less severe, serious, or painful.')
        ON CONFLICT (term) DO UPDATE SET term = EXCLUDED.term
        RETURNING id
    """)
    term_id_2 = await conn.fetchval("""
        INSERT INTO vocab_terms (term, phonetic, definition)
        VALUES ('leverage', '/ˈliːvərɪdʒ/', 'Use (something) to maximum advantage.')
        ON CONFLICT (term) DO UPDATE SET term = EXCLUDED.term
        RETURNING id
    """)
    
    if term_id_1:
        await conn.execute("""
            INSERT INTO srs_cards (user_id, term_id, interval_days, repetitions, due_at)
            VALUES ($1, $2, 1, 1, $3)
            ON CONFLICT (user_id, term_id) DO NOTHING
        """, USER_ID, term_id_1, today)
        
    if term_id_2:
        await conn.execute("""
            INSERT INTO srs_cards (user_id, term_id, interval_days, repetitions, due_at)
            VALUES ($1, $2, 0, 0, $3)
            ON CONFLICT (user_id, term_id) DO NOTHING
        """, USER_ID, term_id_2, today)
        
    await conn.close()
    print("Fixtures seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed_fixtures())
