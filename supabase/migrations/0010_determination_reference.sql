-- 0010 — determination reference sequence + minting function.
-- References are FE-DET-YYYY-NNNN, globally unique. A SECURITY DEFINER function
-- mints them from a sequence so concurrent determinations never collide, and so
-- the numeric run can't be inferred/forged per-tenant.

create sequence if not exists determination_ref_seq;

create or replace function public.mint_determination_reference()
returns text
language sql
security definer
set search_path = public
as $$
  select 'FE-DET-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('determination_ref_seq')::text, 4, '0');
$$;

grant execute on function public.mint_determination_reference() to authenticated;
