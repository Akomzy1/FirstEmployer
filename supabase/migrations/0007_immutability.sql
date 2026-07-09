-- 0007 — hard immutability for evidence tables (CLAUDE.md Rule 5).
-- These triggers block UPDATE and DELETE for EVERY role, including service_role
-- and the table owner — a guarantee RLS alone cannot make. Inserts are allowed;
-- corrections happen by appending a new row (rtw re-checks, document versions).

create trigger determinations_immutable
  before update or delete on determinations
  for each row execute function public.forbid_mutation();

create trigger examinations_immutable
  before update or delete on examinations
  for each row execute function public.forbid_mutation();

create trigger rtw_records_immutable
  before update or delete on rtw_records
  for each row execute function public.forbid_mutation();

create trigger events_immutable
  before update or delete on events
  for each row execute function public.forbid_mutation();
