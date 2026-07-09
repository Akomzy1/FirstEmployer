-- 0008 — onboarding RPC: create a business and its owner membership atomically.
-- There is deliberately no authenticated INSERT policy on businesses /
-- business_members (see DECISIONS.md P02); creation goes through this
-- SECURITY DEFINER function so a business always has exactly one owner row and a
-- user can never insert a membership into someone else's business.

create or replace function public.create_business_with_owner(
  p_name text,
  p_type business_type,
  p_sector text default null,
  p_tier tier default 'starter',
  p_journey jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_business_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;

  -- Ensure the caller has a profile row (first sign-in).
  insert into profiles (id) values (v_uid) on conflict (id) do nothing;

  insert into businesses (name, type, sector, tier, subscription_state, trial_ends_at, journey_state)
  values (p_name, p_type, p_sector, p_tier, 'trialing', now() + interval '7 days', coalesce(p_journey, '{}'::jsonb))
  returning id into v_business_id;

  insert into business_members (business_id, profile_id, role)
  values (v_business_id, v_uid, 'owner');

  insert into events (business_id, actor_kind, actor_id, action, entity, entity_id)
  values (v_business_id, 'user', v_uid, 'business.created', 'business', v_business_id);

  return v_business_id;
end;
$$;

grant execute on function public.create_business_with_owner(text, business_type, text, tier, jsonb)
  to authenticated;
