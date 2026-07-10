-- ============================================================================
-- FirstEmployer — PENDING MIGRATIONS BUNDLE (post-P03 objects)
-- Paste into the Supabase SQL editor and Run once. SAFE TO RE-RUN: every
-- statement is idempotent (if-not-exists / or-replace / guarded types /
-- drop-then-create policies; the seed upserts config and 'do nothing's rows).
-- Contains: 0011 (billing + deletion fn), 0012 (marketing_leads),
--           0013 (feedback, monitor_findings, publish fn), refreshed seed.
-- Verify afterwards: node scripts/db/verify.mjs
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- supabase/migrations/0011_billing_and_deletion.sql (idempotent form)
-- ────────────────────────────────────────────────────────────────────────────
-- 0011 — billing columns + account deletion honouring statutory retention (P12).

-- Stripe references on the business (nullable until first checkout).
alter table businesses add column if not exists stripe_customer_id text;
alter table businesses add column if not exists stripe_subscription_id text;
create index if not exists businesses_stripe_customer_idx on businesses(stripe_customer_id);

-- ============================================================
-- Account deletion with statutory retention (skill gotcha #3).
-- Never a hard cascade delete: the owner is anonymised and everything we are
-- FREE to delete goes; records under a statutory retention class survive,
-- locked away, and the immutable evidence tables (determinations,
-- examinations, rtw_records, events) are append-only by trigger and stay.
--
-- Returns the storage paths of purged evidence so the caller can delete the
-- underlying files from the bucket (storage lives outside Postgres).
-- SECURITY DEFINER: called by the account owner via RPC.
-- ============================================================
create or replace function public.delete_account_with_retention(p_business_id uuid)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  purged_paths text[];
begin
  -- Caller must be a member of the business (defence in depth over RLS).
  if not public.is_member_of(p_business_id) then
    raise exception 'not a member of this business';
  end if;

  -- 1) Collect the file paths of deletable (standard-retention) evidence.
  select coalesce(array_agg(file_path), '{}') into purged_paths
  from evidence
  where business_id = p_business_id
    and retention_class = 'standard'
    and file_path is not null;

  -- 2) Purge what we are free to delete.
  delete from evidence
  where business_id = p_business_id and retention_class = 'standard';

  delete from assistant_messages
  where thread_id in (select id from assistant_threads where business_id = p_business_id);
  delete from assistant_threads where business_id = p_business_id;

  delete from obligations where business_id = p_business_id;

  -- Bare drafts go. Anything ever examined stays: deleting it would cascade
  -- into the immutable examinations table (append-only by trigger), and the
  -- examination history is part of the retained audit trail anyway. Approved
  -- statements are employment records within the limitation window and stay.
  delete from documents
  where business_id = p_business_id
    and status in ('draft', 'examining')
    and id not in (select document_id from examinations);

  -- 3) Anonymise the OWNER (the person leaving). Worker identities on retained
  --    statutory records are deliberately kept — a statutory excuse must
  --    identify who was checked.
  update profiles set full_name = 'Deleted user'
  where id in (select profile_id from business_members where business_id = p_business_id);

  -- 4) Close the account: subscription off, journey state cleared.
  update businesses
  set subscription_state = 'canceled',
      journey_state = '{}'::jsonb,
      stripe_subscription_id = null
  where id = p_business_id;

  return purged_paths;
end;
$$;

grant execute on function public.delete_account_with_retention(uuid) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- supabase/migrations/0012_marketing_leads.sql (idempotent form)
-- ────────────────────────────────────────────────────────────────────────────
-- 0012 — marketing leads (P13): readiness-check and calculator email gates.
-- No tenant: leads arrive before signup. Insert-only for anon/authenticated;
-- reading is service-role only (the marketing team's surface, P14+).

create table if not exists marketing_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null,                 -- 'readiness_check' | 'cost_calculator'
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists marketing_leads_email_idx on marketing_leads(email);

alter table marketing_leads enable row level security;

drop policy if exists leads_insert_any on marketing_leads;
create policy leads_insert_any on marketing_leads
  for insert to anon, authenticated with check (true);
-- no select/update/delete policies: service role only.

-- Table-level grants (0006's blanket grant predates this table).
grant insert on marketing_leads to anon, authenticated;
grant all on marketing_leads to service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- supabase/migrations/0013_admin_console.sql (idempotent form)
-- ────────────────────────────────────────────────────────────────────────────
-- 0013 — admin console (P14): feedback, monitor findings, and the publish
-- function (the ONLY write path to config_versions).

-- Flow-completion feedback (FR-8.5). Users insert their own; reading is admin
-- (service role) only.
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete set null,
  flow text not null,                   -- 'status' | 'setup' | 'contracts' | 'rtw' | 'dashboard'
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists feedback_flow_idx on feedback(flow);
alter table feedback enable row level security;
drop policy if exists feedback_insert_member on feedback;
create policy feedback_insert_member on feedback
  for insert to authenticated
  with check (business_id is null or public.is_member_of(business_id));

-- Monitor review queue (P14 §4): manual-entry source changes pending human
-- review. The P1 Monitor agent will write here later; nothing auto-publishes.
do $mig$ begin
  create type monitor_state as enum ('pending', 'approved', 'dismissed');
exception when duplicate_object then null; end $mig$;
create table if not exists monitor_findings (
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

-- ────────────────────────────────────────────────────────────────────────────
-- supabase/seed.sql (idempotent: config upsert carries the new ni block)
-- ────────────────────────────────────────────────────────────────────────────
-- GENERATED by scripts/gen-seed.mjs — do not edit by hand.
-- Source of statutory values: lib/config/versions.json
-- Regenerate: pnpm gen:seed

-- ===== Statutory configuration versions =====
insert into config_versions (label, effective_from, status, values, audit_note)
values ('2026.1', '2025-04-01', 'superseded', '{"minimum_wage":{"nlw_21_plus":12.21,"nmw_18_20":10,"nmw_16_17":7.55,"apprentice":7.55},"holiday":{"statutory_weeks":5.6,"pay_record_retention_years":6},"pension":{"ae_earnings_trigger":10000,"qualifying_band_lower":6240,"qualifying_band_upper":50270,"min_total_contribution_pct":8,"min_employer_contribution_pct":3,"declaration_of_compliance_months":5},"insurance":{"el_min_cover":5000000,"el_penalty_per_day":2500,"el_certificate_display_penalty":1000},"paye":{"lel_weekly":123},"ssp":{"day_one":false},"right_to_work":{"penalty_first_breach":45000,"penalty_repeat_breach":60000},"employment_penalties":{"tpr_auto_enrolment_fixed":400,"written_statement_tribunal_weeks":4,"pay_record_retention_years":3},"ni":{"employer_rate_pct":15,"secondary_threshold_annual":5000,"employment_allowance":10500}}'::jsonb, 'April 2025 statutory rates (2025/26 regime). Retained deliberately as the canonical uprating fixture: the 2026.1 -> 2026.2 transition (NLW 12.21 -> 12.71) drives the J4 golden suite.')
on conflict (label) do update set effective_from = excluded.effective_from, status = excluded.status, values = excluded.values, audit_note = excluded.audit_note;

insert into config_versions (label, effective_from, status, values, audit_note)
values ('2026.2', '2026-04-01', 'live', '{"minimum_wage":{"nlw_21_plus":12.71,"nmw_18_20":10.85,"nmw_16_17":8,"apprentice":8},"holiday":{"statutory_weeks":5.6,"pay_record_retention_years":6},"pension":{"ae_earnings_trigger":10000,"qualifying_band_lower":6240,"qualifying_band_upper":50270,"min_total_contribution_pct":8,"min_employer_contribution_pct":3,"declaration_of_compliance_months":5},"insurance":{"el_min_cover":5000000,"el_penalty_per_day":2500,"el_certificate_display_penalty":1000},"paye":{"lel_weekly":123},"ssp":{"day_one":true},"right_to_work":{"penalty_first_breach":45000,"penalty_repeat_breach":60000},"employment_penalties":{"tpr_auto_enrolment_fixed":400,"written_statement_tribunal_weeks":4,"pay_record_retention_years":3},"ni":{"employer_rate_pct":15,"secondary_threshold_annual":5000,"employment_allowance":10500}}'::jsonb, 'April 2026 statutory rates. NLW rises to 12.71; 18-20 to 10.85; 16-17/apprentice to 8.00. Day-one SSP begins (ERA 2025). AE thresholds held at 2025/26 levels.')
on conflict (label) do update set effective_from = excluded.effective_from, status = excluded.status, values = excluded.values, audit_note = excluded.audit_note;

-- ===== Demo tenant 1: canonical scenario =====
-- Dave Okonkwo · DO Plumbing & Heating Ltd (limited, Walsall)
-- hiring Liam Carter, apprentice plumber, £8.00/hr, 40 hrs/wk, start 2026-08-03.
insert into auth.users (id, email) values ('00000000-0000-4000-8000-000000000001', 'dave@doplumbing.example') on conflict (id) do nothing;
insert into profiles (id, full_name) values ('00000000-0000-4000-8000-000000000001', 'Dave Okonkwo') on conflict (id) do nothing;
insert into businesses (id, name, type, sector, postcode, tier, subscription_state)
values ('00000000-0000-4000-8000-0000000000b1', 'DO Plumbing & Heating Ltd', 'limited', 'Trades', 'WS1 1AA', 'launch', 'trialing') on conflict (id) do nothing;
insert into business_members (id, business_id, profile_id, role) values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-000000000001', 'owner') on conflict (id) do nothing;
insert into employees (id, business_id, full_name, dob, is_apprentice, apprenticeship_start, start_date, pay_amount, pay_period, weekly_hours, status)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000b1', 'Liam Carter', '1999-05-14', true, '2026-08-03', '2026-08-03', 8.00, 'hourly', 40, 'prospective') on conflict (id) do nothing;

-- ===== Demo tenant 2: isolation fixture for the RLS cross-tenant test =====
insert into auth.users (id, email) values ('00000000-0000-4000-8000-000000000002', 'sarah@brightlights.example') on conflict (id) do nothing;
insert into profiles (id, full_name) values ('00000000-0000-4000-8000-000000000002', 'Sarah Bright') on conflict (id) do nothing;
insert into businesses (id, name, type, sector, postcode, tier, subscription_state)
values ('00000000-0000-4000-8000-0000000000b2', 'Bright Lights Salon', 'sole_trader', 'Hair & Beauty', 'B1 2BB', 'starter', 'trialing') on conflict (id) do nothing;
insert into business_members (id, business_id, profile_id, role) values ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-000000000002', 'owner') on conflict (id) do nothing;
insert into employees (id, business_id, full_name, dob, is_apprentice, start_date, pay_amount, pay_period, weekly_hours, status)
values ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000b2', 'Priya Shah', '2003-02-20', false, '2026-05-01', 12.71, 'hourly', 30, 'active') on conflict (id) do nothing;
