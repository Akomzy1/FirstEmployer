-- 0004 — compliance tables: evidence, determinations, documents,
-- examinations, obligations, rtw_records.
-- determinations / examinations / rtw_records are IMMUTABLE (append-only).
-- Immutability triggers are attached in 0007.

-- evidence: unified store for uploaded artefacts. retention_class governs
-- deletion on account closure (skill gotcha #3).
create table evidence (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  type text not null,
  file_path text,                       -- private storage bucket key
  meta jsonb not null default '{}'::jsonb,
  retention_class retention_class not null default 'standard',
  created_at timestamptz not null default now()
);
create index evidence_business_idx on evidence(business_id);

-- determinations: immutable employment-status verdicts (FR-1.4).
-- Reasoning is template-assembled from factors, never LLM-written.
create table determinations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  answers jsonb not null,
  verdict determination_verdict not null,
  confidence_band confidence_band not null,
  factors jsonb not null default '[]'::jsonb,
  rules_version text not null,
  reference text not null unique,       -- FE-DET-YYYY-NNNN
  pdf_path text,
  created_at timestamptz not null default now()
);
create index determinations_employee_idx on determinations(employee_id);

-- documents: version-chained artefacts. supersedes points at the prior version.
create table documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  employee_id uuid references employees(id) on delete set null,
  type document_type not null,
  status document_status not null default 'draft',
  version integer not null default 1,
  supersedes uuid references documents(id),
  content_path text,
  questionnaire jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index documents_business_idx on documents(business_id);
create index documents_employee_idx on documents(employee_id);

create trigger documents_set_updated_at before update on documents
  for each row execute function public.set_updated_at();

-- examinations: immutable examiner verdicts (FR-3.4/3.5/3.7). One row per
-- attempt. checklist_hash + versions are the VerificationSeal content.
create table examinations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  attempt integer not null,
  verdict examination_verdict not null,
  checks jsonb not null default '[]'::jsonb,   -- 13 checks: {id,name,status,detail,statutoryRef}
  defects jsonb not null default '[]'::jsonb,  -- {clauseRef,issue,statutoryBasis,suggestedFix}
  generator_version text not null,
  examiner_version text not null,
  config_version text not null,                -- config label live at exam time
  checklist_hash text not null,
  created_at timestamptz not null default now(),
  unique (document_id, attempt)
);
create index examinations_document_idx on examinations(document_id);

-- obligations: the dashboard's engine (FR-5.1). Mutable state machine; rows are
-- re-derived and their state advances. due_date drives DeadlineChip grading.
create table obligations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  employee_id uuid references employees(id) on delete cascade,
  type obligation_type not null,
  state obligation_state not null default 'not_started',
  due_date date,
  source text,                          -- what created/updates this obligation
  evidence_id uuid references evidence(id) on delete set null,
  document_id uuid references documents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index obligations_business_idx on obligations(business_id);
create index obligations_employee_idx on obligations(employee_id);
create index obligations_due_idx on obligations(due_date);

create trigger obligations_set_updated_at before update on obligations
  for each row execute function public.set_updated_at();

-- rtw_records: immutable statutory-excuse evidence (FR-4.3). Re-checks create a
-- new row and link via supersedes; nothing is ever overwritten.
create table rtw_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  route rtw_route not null,
  checked_by text,
  checked_at timestamptz not null default now(),
  result rtw_result not null,
  evidence_id uuid references evidence(id) on delete set null,
  evidence_paths jsonb not null default '[]'::jsonb,
  expiry_date date,
  follow_up_due date,
  supersedes uuid references rtw_records(id),
  created_at timestamptz not null default now()
);
create index rtw_records_employee_idx on rtw_records(employee_id);
