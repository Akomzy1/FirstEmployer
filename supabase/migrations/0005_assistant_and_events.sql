-- 0005 — AI assistant threads/messages and the append-only audit log

-- assistant_threads: one conversation per row (Module 6).
create table assistant_threads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assistant_threads_business_idx on assistant_threads(business_id);

create trigger assistant_threads_set_updated_at before update on assistant_threads
  for each row execute function public.set_updated_at();

-- assistant_messages: every answer carries grounding_refs so the UI can render
-- source chips; an ungrounded statutory claim must signpost, not improvise.
create table assistant_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references assistant_threads(id) on delete cascade,
  role text not null,                   -- 'user' | 'assistant'
  content text not null,
  grounding_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index assistant_messages_thread_idx on assistant_messages(thread_id);

-- events: append-only audit log (CLAUDE.md Rule 5). Immutable (trigger in 0007).
create table events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  actor_kind event_actor_kind not null default 'system',
  actor_id uuid,
  action text not null,
  entity text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);
create index events_business_idx on events(business_id);
create index events_at_idx on events(at desc);
