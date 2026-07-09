-- Storage setup for the evidence vault. Applied to the hosted project only
-- (Supabase-specific storage schema; NOT a numbered migration, so the PGlite
-- harness skips it). Apply with: node scripts/db/apply-sql.mjs supabase/storage-setup.sql
--
-- Private bucket. Object paths are `<business_id>/<...>`; RLS scopes access to
-- business members via the first path segment, reusing public.is_member_of.

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

drop policy if exists "evidence_member_select" on storage.objects;
drop policy if exists "evidence_member_insert" on storage.objects;

create policy "evidence_member_select" on storage.objects
  for select using (
    bucket_id = 'evidence'
    and public.is_member_of(((storage.foldername(name))[1])::uuid)
  );

create policy "evidence_member_insert" on storage.objects
  for insert with check (
    bucket_id = 'evidence'
    and public.is_member_of(((storage.foldername(name))[1])::uuid)
  );
