-- 0006 — Row Level Security. Every table scoped to business membership.
-- Immutable tables (determinations, examinations, rtw_records, events) get
-- SELECT + INSERT policies only; the absence of UPDATE/DELETE policies denies
-- those actions for authenticated, and 0007 adds triggers that also block
-- service_role. config_versions is global and admin-write-only.

-- ---- Tenant-RLS helper functions -------------------------------------------
-- Defined here (not 0001) because `language sql` bodies are validated at
-- creation time and these reference tables from 0002/0004. SECURITY DEFINER so
-- a policy can read business_members without recursing through its own RLS.
create or replace function public.is_member_of(target_business uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from business_members m
    where m.business_id = target_business
      and m.profile_id = auth.uid()
  );
$$;

create or replace function public.employee_business(target_employee uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select e.business_id from employees e where e.id = target_employee;
$$;

create or replace function public.document_business(target_document uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select d.business_id from documents d where d.id = target_document;
$$;

-- ---- Privilege grants (RLS then restricts within these) --------------------
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant all on all tables in schema public to service_role;

grant execute on function public.is_member_of(uuid) to anon, authenticated, service_role;
grant execute on function public.employee_business(uuid) to anon, authenticated, service_role;
grant execute on function public.document_business(uuid) to anon, authenticated, service_role;

-- ---- Enable RLS on everything ----------------------------------------------
alter table profiles            enable row level security;
alter table businesses          enable row level security;
alter table business_members    enable row level security;
alter table employees           enable row level security;
alter table config_versions     enable row level security;
alter table evidence            enable row level security;
alter table determinations      enable row level security;
alter table documents           enable row level security;
alter table examinations        enable row level security;
alter table obligations         enable row level security;
alter table rtw_records         enable row level security;
alter table assistant_threads   enable row level security;
alter table assistant_messages  enable row level security;
alter table events              enable row level security;

-- ---- profiles ---------------------------------------------------------------
create policy profiles_select on profiles for select using (id = auth.uid());
create policy profiles_insert on profiles for insert with check (id = auth.uid());
create policy profiles_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- ---- businesses -------------------------------------------------------------
-- Creation goes through a SECURITY DEFINER onboarding RPC (Prompt 3) / service
-- role so a business and its owner-membership are created atomically; there is
-- deliberately no authenticated INSERT policy here.
create policy businesses_select on businesses for select using (is_member_of(id));
create policy businesses_update on businesses for update using (is_member_of(id)) with check (is_member_of(id));

-- ---- business_members -------------------------------------------------------
create policy members_select on business_members for select
  using (profile_id = auth.uid() or is_member_of(business_id));

-- ---- employees --------------------------------------------------------------
-- No DELETE policy: employees are marked 'left', never hard-deleted (protects
-- the immutable determinations/rtw_records that reference them).
create policy employees_select on employees for select using (is_member_of(business_id));
create policy employees_insert on employees for insert with check (is_member_of(business_id));
create policy employees_update on employees for update using (is_member_of(business_id)) with check (is_member_of(business_id));

-- ---- config_versions (global, read-only to tenants; drafts hidden) ----------
create policy config_select on config_versions for select using (status <> 'draft');

-- ---- evidence ---------------------------------------------------------------
create policy evidence_select on evidence for select using (is_member_of(business_id));
create policy evidence_insert on evidence for insert with check (is_member_of(business_id));

-- ---- determinations (immutable) ---------------------------------------------
create policy determinations_select on determinations for select
  using (is_member_of(employee_business(employee_id)));
create policy determinations_insert on determinations for insert
  with check (is_member_of(employee_business(employee_id)));

-- ---- documents --------------------------------------------------------------
create policy documents_select on documents for select using (is_member_of(business_id));
create policy documents_insert on documents for insert with check (is_member_of(business_id));
create policy documents_update on documents for update using (is_member_of(business_id)) with check (is_member_of(business_id));

-- ---- examinations (immutable) -----------------------------------------------
create policy examinations_select on examinations for select
  using (is_member_of(document_business(document_id)));
create policy examinations_insert on examinations for insert
  with check (is_member_of(document_business(document_id)));

-- ---- obligations ------------------------------------------------------------
create policy obligations_select on obligations for select using (is_member_of(business_id));
create policy obligations_insert on obligations for insert with check (is_member_of(business_id));
create policy obligations_update on obligations for update using (is_member_of(business_id)) with check (is_member_of(business_id));

-- ---- rtw_records (immutable) ------------------------------------------------
create policy rtw_select on rtw_records for select
  using (is_member_of(employee_business(employee_id)));
create policy rtw_insert on rtw_records for insert
  with check (is_member_of(employee_business(employee_id)));

-- ---- assistant_threads ------------------------------------------------------
create policy threads_select on assistant_threads for select using (is_member_of(business_id));
create policy threads_insert on assistant_threads for insert with check (is_member_of(business_id));
create policy threads_update on assistant_threads for update using (is_member_of(business_id)) with check (is_member_of(business_id));

-- ---- assistant_messages -----------------------------------------------------
create policy messages_select on assistant_messages for select
  using (is_member_of((select t.business_id from assistant_threads t where t.id = thread_id)));
create policy messages_insert on assistant_messages for insert
  with check (is_member_of((select t.business_id from assistant_threads t where t.id = thread_id)));

-- ---- events (immutable, append-only) ----------------------------------------
create policy events_select on events for select using (is_member_of(business_id));
create policy events_insert on events for insert with check (is_member_of(business_id));
