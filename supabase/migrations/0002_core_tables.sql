-- 0002 — core tenant tables: profiles, businesses, membership, employees

-- profiles: 1:1 extension of auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  -- On account deletion we anonymise rather than hard-delete where statutory
  -- retention applies (skill gotcha #3). This flag records that state.
  anonymised boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- businesses: the tenant. type drives checklist instantiation (FR-2.1).
create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type business_type not null,
  sector text,
  postcode text,
  tier tier not null default 'starter',
  subscription_state subscription_state not null default 'trialing',
  trial_ends_at timestamptz,
  stripe_customer_id text,
  -- Server-side journey persistence (FR-8.6 save-and-resume). Per-flow state
  -- lives here so a killed tab resumes exactly where it left off.
  journey_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Membership scopes every tenant RLS check. A first-time employer is a single
-- owner today; the table generalises to Growth-tier team members and future
-- accountant read-only shares without reworking policies.
create table business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique (business_id, profile_id)
);
create index business_members_profile_idx on business_members(profile_id);
create index business_members_business_idx on business_members(business_id);

-- employees: age band is DERIVED from dob in rules code, never stored
-- (CLAUDE.md §5). is_apprentice matters for the wage floor (Liam gotcha).
create table employees (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  full_name text not null,
  dob date,
  is_apprentice boolean not null default false,
  apprenticeship_start date,
  start_date date,
  pay_amount numeric(10,2),
  pay_period pay_period,
  weekly_hours numeric(6,2),
  status employee_status not null default 'prospective',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index employees_business_idx on employees(business_id);

create trigger profiles_set_updated_at before update on profiles
  for each row execute function public.set_updated_at();
create trigger businesses_set_updated_at before update on businesses
  for each row execute function public.set_updated_at();
create trigger employees_set_updated_at before update on employees
  for each row execute function public.set_updated_at();
