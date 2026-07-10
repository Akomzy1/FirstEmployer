-- 0012 — marketing leads (P13): readiness-check and calculator email gates.
-- No tenant: leads arrive before signup. Insert-only for anon/authenticated;
-- reading is service-role only (the marketing team's surface, P14+).

create table marketing_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null,                 -- 'readiness_check' | 'cost_calculator'
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index marketing_leads_email_idx on marketing_leads(email);

alter table marketing_leads enable row level security;

create policy leads_insert_any on marketing_leads
  for insert to anon, authenticated with check (true);
-- no select/update/delete policies: service role only.
