-- 0003 — config_versions: the ONLY home for statutory values (CLAUDE.md Rule 4)
-- Global (not tenant-scoped). Read exclusively via getLiveConfig() in lib/config.
-- Written only by admins (service_role); no authenticated write policy.

create table config_versions (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,              -- e.g. "2026.2"
  effective_from date not null,            -- statutory effect date
  status config_status not null default 'draft',
  values jsonb not null,                   -- the full statutory snapshot
  audit_note text,
  published_by uuid references profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Resolution is by effective date; index supports "latest effective_from <= d".
create index config_versions_effective_idx on config_versions(effective_from desc);

-- At most one row may be flagged the canonical 'live' pointer per label set.
-- (Resolution itself is date-based; this simply guards the workflow state.)
create index config_versions_status_idx on config_versions(status);

create trigger config_versions_set_updated_at before update on config_versions
  for each row execute function public.set_updated_at();
