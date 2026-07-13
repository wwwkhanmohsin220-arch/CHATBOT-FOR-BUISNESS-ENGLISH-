import os
import asyncio
import asyncpg
from dotenv import load_dotenv

# Load env variables
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(dotenv_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env file")

print(f"Connecting to database: {DATABASE_URL.split('@')[-1]}")

SQL_SCHEMA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "schema.sql")

QNA_EXCHANGES_DDL = """
-- ============ QNA EXCHANGES ============
create table if not exists qna_exchanges (
  id bigserial primary key,
  user_id uuid not null,
  lesson_instance_id uuid not null references lesson_instances(id) on delete cascade,
  node_id uuid,                       -- which node they were on when asking
  question text not null,
  answer text not null,
  scope text not null check (scope in ('core','adjacent','off_topic')),
  related_concept_tag text,
  created_at timestamptz default now()
);

create index if not exists qna_exchanges_lesson_instance_idx on qna_exchanges (lesson_instance_id, related_concept_tag);
"""

RLS_DDL = """
-- ============ ENABLE ROW LEVEL SECURITY ============
alter table user_profiles enable row level security;
alter table lesson_instances enable row level security;
alter table lesson_nodes enable row level security;
alter table lesson_branches enable row level security;
alter table node_attempts enable row level security;
alter table stat_events enable row level security;
alter table user_stats enable row level security;
alter table activity_days enable row level security;
alter table xp_events enable row level security;
alter table srs_cards enable row level security;
alter table srs_reviews enable row level security;
alter table qna_exchanges enable row level security;
alter table llm_failures enable row level security;

-- ============ CREATE RLS POLICIES ============
drop policy if exists user_profiles_policy on user_profiles;
create policy user_profiles_policy on user_profiles for all using (auth.uid() = user_id);

drop policy if exists lesson_instances_policy on lesson_instances;
create policy lesson_instances_policy on lesson_instances for all using (auth.uid() = user_id);

drop policy if exists lesson_nodes_policy on lesson_nodes;
create policy lesson_nodes_policy on lesson_nodes for all using (
    exists (
        select 1 from lesson_instances
        where lesson_instances.id = lesson_nodes.lesson_instance_id
          and lesson_instances.user_id = auth.uid()
    )
);

drop policy if exists lesson_branches_policy on lesson_branches;
create policy lesson_branches_policy on lesson_branches for all using (
    exists (
        select 1 from lesson_instances
        where lesson_instances.id = lesson_branches.lesson_instance_id
          and lesson_instances.user_id = auth.uid()
    )
);

drop policy if exists node_attempts_policy on node_attempts;
create policy node_attempts_policy on node_attempts for all using (auth.uid() = user_id);

drop policy if exists stat_events_policy on stat_events;
create policy stat_events_policy on stat_events for all using (auth.uid() = user_id);

drop policy if exists user_stats_policy on user_stats;
create policy user_stats_policy on user_stats for all using (auth.uid() = user_id);

drop policy if exists activity_days_policy on activity_days;
create policy activity_days_policy on activity_days for all using (auth.uid() = user_id);

drop policy if exists xp_events_policy on xp_events;
create policy xp_events_policy on xp_events for all using (auth.uid() = user_id);

drop policy if exists srs_cards_policy on srs_cards;
create policy srs_cards_policy on srs_cards for all using (auth.uid() = user_id);

drop policy if exists srs_reviews_policy on srs_reviews;
create policy srs_reviews_policy on srs_reviews for all using (
    exists (
        select 1 from srs_cards
        where srs_cards.id = srs_reviews.card_id
          and srs_cards.user_id = auth.uid()
    )
);

drop policy if exists qna_exchanges_policy on qna_exchanges;
create policy qna_exchanges_policy on qna_exchanges for all using (auth.uid() = user_id);

drop policy if exists llm_failures_policy on llm_failures;
create policy llm_failures_policy on llm_failures for all using (auth.uid() = user_id);
"""

def clean_sql(sql: str) -> str:
    cleaned_lines = []
    for line in sql.splitlines():
        if "--" in line:
            # Split on '--' to remove comments
            line = line.split("--")[0]
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines)

async def main():
    # Read schema.sql
    with open(SQL_SCHEMA_FILE, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    # Append QnA Exchanges and RLS DDL
    full_sql = schema_sql + "\n" + QNA_EXCHANGES_DDL + "\n" + RLS_DDL
    
    # Connect and run SQL
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        print("Executing DDL against Supabase statements one by one...")
        cleaned_sql = clean_sql(full_sql)
        # Split by semicolon, filtering out empty strings
        statements = [stmt.strip() for stmt in cleaned_sql.split(";") if stmt.strip()]
        for stmt in statements:
            try:
                # Add semicolon back
                await conn.execute(stmt + ";")
            except Exception as e:
                err_msg = str(e)
                if "already exists" in err_msg or "already a member" in err_msg:
                    # Ignore table/index/extension already exists errors
                    continue
                print(f"Statement failed: {stmt[:100]}...\nError: {e}")
        print("Database schema application process finished successfully!")
    except Exception as e:
        print(f"Error executing schema DDL: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
