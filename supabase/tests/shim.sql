-- TEST-ONLY shim for the PGlite harness. NOT a committed migration and never
-- applied to real Supabase — Supabase already provides the auth schema,
-- auth.uid(), and the anon/authenticated/service_role roles. This reproduces
-- just enough of that contract so the real migrations apply and RLS can be
-- exercised locally without Docker.

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key,
  email text
);

-- Mirrors Supabase's auth.uid(): reads the JWT 'sub' claim from a GUC we set
-- per simulated user in the tests.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant select, insert on auth.users to authenticated, service_role;
