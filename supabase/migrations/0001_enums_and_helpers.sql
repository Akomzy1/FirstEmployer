-- 0001 — shared enums and helper functions
-- FirstEmployer schema foundation. Applies cleanly to Supabase Postgres and to
-- the PGlite test harness (which pre-loads an auth shim; see supabase/tests/).
-- gen_random_uuid() is built into Postgres core (>= 13), so no extension is
-- required for UUID defaults.

-- ============================================================
-- Shared enums (domain vocabulary — CLAUDE.md §5)
-- ============================================================
create type business_type as enum ('sole_trader', 'limited');
create type tier as enum ('starter', 'launch', 'growth');
create type subscription_state as enum ('trialing', 'active', 'past_due', 'canceled');

create type pay_period as enum ('hourly', 'weekly', 'four_weekly', 'monthly', 'annual');
create type employee_status as enum ('prospective', 'active', 'left');

create type determination_verdict as enum ('employee', 'worker', 'self_employed');
create type confidence_band as enum ('clear', 'leaning', 'ambiguous');

create type config_status as enum ('draft', 'scheduled', 'live', 'superseded');

create type document_type as enum (
  'employment_contract',   -- written statement of particulars
  'offer_letter',
  'new_starter_checklist',
  'variation_letter',      -- uprating / pay-change consolidated statement
  'status_determination',  -- determination PDF (mirrored as a document artefact)
  'rtw_statutory_excuse'
);
create type document_status as enum ('draft', 'examining', 'approved', 'human_review', 'superseded');

create type examination_verdict as enum ('pass', 'fail');

create type obligation_type as enum (
  'employment_status',
  'written_statement',
  'hmrc_paye',
  'payroll',
  'pension_enrolment',
  'pension_declaration',
  'el_insurance',
  'right_to_work',
  'minimum_wage',
  'ico_registration',
  'health_safety',
  'record_keeping'
);
create type obligation_state as enum ('not_started', 'in_progress', 'blocked', 'complete', 'at_risk', 'overdue');

create type rtw_route as enum ('manual', 'share_code', 'employer_checking_service');
create type rtw_result as enum ('pass', 'follow_up_required', 'fail');

-- retention_class governs deletion behaviour on account closure (skill gotcha #3):
-- statutory-retention rows survive owner anonymisation.
create type retention_class as enum (
  'standard',              -- deletable with the account
  'rtw_employment_plus_2y',
  'holiday_pay_6y'
);

create type event_actor_kind as enum ('user', 'system', 'admin', 'examiner', 'generator');

-- ============================================================
-- Helper: updated_at maintenance (mutable tables only)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- Helper: hard immutability (evidence tables — CLAUDE.md Rule 5)
-- Blocks UPDATE and DELETE for EVERY role, including the table owner and
-- service_role. RLS alone cannot stop service_role; this trigger can.
-- ============================================================
create or replace function public.forbid_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Row is immutable: % on % is not permitted (append-only evidence table)',
    tg_op, tg_table_name
    using errcode = 'restrict_violation';
  return null;
end;
$$;

-- Note: the tenant-RLS helper functions (is_member_of, employee_business,
-- document_business) reference tables created in later migrations, and
-- `language sql` bodies are validated at creation time, so they are defined in
-- 0006 alongside the policies that use them.
