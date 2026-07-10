-- 0011 — billing columns + account deletion honouring statutory retention (P12).

-- Stripe references on the business (nullable until first checkout).
alter table businesses add column if not exists stripe_customer_id text;
alter table businesses add column if not exists stripe_subscription_id text;
create index if not exists businesses_stripe_customer_idx on businesses(stripe_customer_id);

-- ============================================================
-- Account deletion with statutory retention (skill gotcha #3).
-- Never a hard cascade delete: the owner is anonymised and everything we are
-- FREE to delete goes; records under a statutory retention class survive,
-- locked away, and the immutable evidence tables (determinations,
-- examinations, rtw_records, events) are append-only by trigger and stay.
--
-- Returns the storage paths of purged evidence so the caller can delete the
-- underlying files from the bucket (storage lives outside Postgres).
-- SECURITY DEFINER: called by the account owner via RPC.
-- ============================================================
create or replace function public.delete_account_with_retention(p_business_id uuid)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  purged_paths text[];
begin
  -- Caller must be a member of the business (defence in depth over RLS).
  if not public.is_member_of(p_business_id) then
    raise exception 'not a member of this business';
  end if;

  -- 1) Collect the file paths of deletable (standard-retention) evidence.
  select coalesce(array_agg(file_path), '{}') into purged_paths
  from evidence
  where business_id = p_business_id
    and retention_class = 'standard'
    and file_path is not null;

  -- 2) Purge what we are free to delete.
  delete from evidence
  where business_id = p_business_id and retention_class = 'standard';

  delete from assistant_messages
  where thread_id in (select id from assistant_threads where business_id = p_business_id);
  delete from assistant_threads where business_id = p_business_id;

  delete from obligations where business_id = p_business_id;

  -- Bare drafts go. Anything ever examined stays: deleting it would cascade
  -- into the immutable examinations table (append-only by trigger), and the
  -- examination history is part of the retained audit trail anyway. Approved
  -- statements are employment records within the limitation window and stay.
  delete from documents
  where business_id = p_business_id
    and status in ('draft', 'examining')
    and id not in (select document_id from examinations);

  -- 3) Anonymise the OWNER (the person leaving). Worker identities on retained
  --    statutory records are deliberately kept — a statutory excuse must
  --    identify who was checked.
  update profiles set full_name = 'Deleted user'
  where id in (select profile_id from business_members where business_id = p_business_id);

  -- 4) Close the account: subscription off, journey state cleared.
  update businesses
  set subscription_state = 'canceled',
      journey_state = '{}'::jsonb,
      stripe_subscription_id = null
  where id = p_business_id;

  return purged_paths;
end;
$$;

grant execute on function public.delete_account_with_retention(uuid) to authenticated;
