import asyncio, os, sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv('backend/.env')

async def test():
    import asyncpg
    url = os.getenv('DATABASE_URL')
    conn = await asyncpg.connect(url, statement_cache_size=0)
    
    # Check user_profiles
    rows = await conn.fetch("SELECT user_id, display_name, level FROM user_profiles")
    print('user_profiles:', [(str(r['user_id']), r['display_name'], r['level']) for r in rows])
    
    # Check lesson_instances
    rows = await conn.fetch("SELECT id, user_id, status, title FROM lesson_instances LIMIT 5")
    print('lesson_instances:', [(str(r['id']), str(r['user_id']), r['status'], r['title']) for r in rows])
    
    # Check units
    rows = await conn.fetch("SELECT id, position, title FROM units ORDER BY position")
    print('units:', [(r['id'], r['position'], r['title']) for r in rows])
    
    # Check lesson_slots
    rows = await conn.fetch("SELECT id, slot_key, unit_id, position FROM lesson_slots ORDER BY position LIMIT 5")
    print('slots:', [(r['id'], r['slot_key'], r['unit_id'], r['position']) for r in rows])
    
    await conn.close()

asyncio.run(test())
