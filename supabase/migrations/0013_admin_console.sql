-- 0013 — admin console (P14): feedback, monitor findings, and the publish
-- function (the ONLY write path to config_versions).

-- Flow-completion feedback (FR-8.5). Users insert their own; reading is admin
-- (service role) only.
create table feedback (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete set null,
  flow text not null,                   -- 'status' | 'setup' | 'contracts' | 'rtw' | 'dashboard'
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index feedback_flow_idx on feedback(flow);
alter table feedback enable row level security;
create policy feedback_insert_member on feedback
  for insert to authenticated
  with check (business_id is null or public.is_member_of(business_id));

-- Monitor review queue (P14 §4): manual-entry source changes pending human
-- review. The P1 Monitor agent will write here later; nothing auto-publishes.
create type monitor_state as enum ('pending', 'approved', 'dismissed');
create table monitor_findings (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  url text,
  detected_at timestamptz not null default now(),
  classification text not null default 'relevant',  -- 'relevant' | 'not-relevant'
  diff jsonb not null default '[]'::jsonb,          -- [{type:'add'|'del', text}]
  proposal jsonb not null default '{}'::jsonb,      -- {kind, target, change, note}
  state monitor_state not null default 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  created_config_version_id uuid references config_versions(id)
);
alter table monitor_findings enable row level security;
-- service role only: no policies for anon/authenticated.

-- ============================================================
-- publish_config_version — the only sanctioned write path to config_versions
-- (P14 §3). Requires an audit note; flips the target to live, supersedes the
-- previous live version, and writes the append-only audit event. The caller
-- (admin action, service role) then triggers the uprating re-check job.
-- ============================================================
create or replace function public.publish_config_version(
  p_version_id uuid,
  p_audit_note text,
  p_actor_id uuid,
  p_actor_email text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_label text;
  v_status config_status;
  v_profile uuid;
begin
  if coalesce(length(trim(p_audit_note)), 0) < 10 then
    raise exception 'audit note is required (at least 10 characters)';
  end if;

  select label, status into v_label, v_status from config_versions where id = p_version_id;
  if v_label is null then
    raise exception 'config version not found';
  end if;
  if v_status = 'live' then
    raise exception 'version % is already live', v_label;
  end if;

  -- published_by is a profiles FK; admins without a profile row are recorded
  -- by email in the audit event instead.
  select id into v_profile from profiles where id = p_actor_id;

  -- Supersede the current live version, then promote the target.
  update config_versions set status = 'superseded' where status = 'live';
  update config_versions
  set status = 'live', audit_note = p_audit_note, published_by = v_profile
  where id = p_version_id;

  insert into events (business_id, actor_kind, actor_id, action, entity, entity_id, payload)
  values (null, 'admin', p_actor_id, 'config.published', 'config_version', p_version_id,
          jsonb_build_object('label', v_label, 'audit_note', p_audit_note, 'published_by_email', p_actor_email));
end;
$$;
-- Service role only — no grant to authenticated. Admin actions run with the
-- service client after the allowlist check.

-- Table-level grants (0006's blanket grant predates these tables).
grant select, insert on feedback to authenticated;
grant all on feedback to service_role;
grant all on monitor_findings to service_role;
