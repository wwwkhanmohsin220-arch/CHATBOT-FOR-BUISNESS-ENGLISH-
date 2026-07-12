-- ============ IDENTITY ============
create table user_profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  display_name   text,
  level          text not null default 'beginner'
                 check (level in ('beginner','intermediate','advanced')),
  coach_voice    text not null default 'balanced'
                 check (coach_voice in ('encouraging','direct_professional','balanced')),
  timezone       text not null default 'UTC',
  daily_goal_min int  not null default 20,
  weakness_tags  jsonb not null default '[]',
  strength_tags  jsonb not null default '[]',
  created_at     timestamptz default now()
);

-- ============ FIXED SCAFFOLD (seeded from curriculum.json by scripts/seed.py) ============
create table units (
  id serial primary key,
  position int unique not null,
  title text not null
);
create table lesson_slots (
  id serial primary key,
  unit_id int not null references units(id),
  position int not null,
  slot_key text unique not null,          -- 'u1l1' → lookup key into curriculum.json
  unique (unit_id, position)
);

-- ============ PER-USER GENERATED CONTENT ============
create table lesson_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  lesson_slot_id int not null references lesson_slots(id),
  title text,
  status text not null default 'compiling'
         check (status in ('compiling','ready','in_progress','completed','failed')),
  current_node_index numeric not null default 0,   -- ★ THE RESUME CURSOR ★
  compile_version text,                            -- e.g. 'compile_v1' + model name
  profile_snapshot jsonb,                          -- profile used at compile time (debugging gold)
  started_at timestamptz, completed_at timestamptz,
  created_at timestamptz default now(),
  unique (user_id, lesson_slot_id)                 -- ★ double-compile guard ★
);

create table lesson_nodes (
  id uuid primary key default gen_random_uuid(),
  lesson_instance_id uuid not null references lesson_instances(id) on delete cascade,
  position numeric not null,        -- numeric, not int: injected fix between 2 and 3 = 2.5
  node_type text not null check (node_type in
    ('theory','mcq','voice','writing','targeted_fix')),
  is_injected bool not null default false,
  concept_tag text,
  content jsonb not null,           -- full compiled payload incl. all distractor explanations
  status text not null default 'pending'
         check (status in ('pending','completed','skipped')),
  unique (lesson_instance_id, position)
);

create table lesson_branches (      -- pre-compiled remediation, invisible until injected
  id uuid primary key default gen_random_uuid(),
  lesson_instance_id uuid not null references lesson_instances(id) on delete cascade,
  concept_tag text not null,
  content jsonb not null,
  consumed bool not null default false,
  unique (lesson_instance_id, concept_tag)   -- ★ double-injection guard ★
);

create table node_attempts (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references lesson_nodes(id),
  user_id uuid not null,
  attempt_no int not null,
  payload jsonb,                    -- {"answer_index":2} / {"draft":"..."} / {"transcript":[...]}
  result jsonb,                     -- {"correct":false} / full rubric / voice scores
  duration_sec int,
  created_at timestamptz default now(),
  unique (node_id, attempt_no)      -- ★ duplicate-submit guard ★
);

-- ============ STATS: EVENT-SOURCED RADAR ============
create table stat_events (          -- append-only; axes derived, always recomputable
  id bigserial primary key,
  user_id uuid not null,
  axis text not null check (axis in
    ('writing','listening','grammar','vocabulary','tone','fluency')),
  score numeric not null check (score between 0 and 100),
  source_node_id uuid,
  concept_tag text,
  created_at timestamptz default now()
);
create table user_stats (           -- materialized EMA per axis, updated in-transaction
  user_id uuid not null,
  axis text not null,
  value numeric not null default 50,
  sample_count int not null default 0,
  updated_at timestamptz default now(),
  primary key (user_id, axis)
);
-- EMA update rule, applied in Python inside the attempt transaction:
--   new_value = old_value * 0.85 + event_score * 0.15
-- Smooth, recency-biased, and one row per axis — the radar endpoint is a 6-row SELECT.

create table activity_days (        -- streaks + weekly calendar + daily-goal minutes
  user_id uuid not null, day date not null,
  minutes int not null default 0, xp int not null default 0,
  primary key (user_id, day)
);
create table xp_events (
  id bigserial primary key,
  user_id uuid not null, amount int not null, reason text,
  idempotency_key text unique not null,    -- ★ e.g. 'xp:lesson:{instance_id}' ★
  created_at timestamptz default now()
);

-- ============ SRS (SuperMemo-2) ============
create table vocab_terms (          -- global content, generated once by seed script
  id serial primary key,
  term text unique not null,
  phonetic text, definition text,
  context_sentences jsonb,          -- {"beginner":"...","intermediate":"...","advanced":"..."}
  concept_tags text[]
);
create table srs_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  term_id int not null references vocab_terms(id),
  ease_factor numeric not null default 2.5,
  interval_days int not null default 0,
  repetitions int not null default 0,
  due_at date not null default current_date,
  lapses int not null default 0,
  unique (user_id, term_id)
);
create index on srs_cards (user_id, due_at);
create table srs_reviews (
  id bigserial primary key,
  card_id uuid not null references srs_cards(id),
  rating int not null check (rating in (0,1)),   -- 0 Still Learning, 1 Got It
  interval_before int, interval_after int,
  reviewed_at timestamptz default now()
);

-- ============ OBSERVABILITY ============
create table llm_failures (
  id bigserial primary key,
  task text not null,               -- 'compile' | 'grade' | 'voice_turn' | 'summary'
  prompt_version text, model text,
  error text, raw_output text,
  user_id uuid, created_at timestamptz default now()
);

-- ============ RAG PIPELINE (pgvector) ============
create extension if not exists vector;

create table document_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references document_sources(id) on delete cascade,
  content text not null,
  embedding vector(384),            -- all-MiniLM-L6-v2
  concept_tags text[] default '{}', -- For hybrid filtering
  created_at timestamptz default now()
);

-- HNSW index for ultra-fast semantic search
create index on document_chunks using hnsw (embedding vector_cosine_ops);


