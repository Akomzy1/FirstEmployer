-- 0009 — per-user onboarding draft state (save-and-resume, FR-8.6).
-- The onboarding flow persists step + answers here BEFORE a business exists
-- (the gap-check path only creates the business at the end). Once the business
-- is created, its own journey_state takes over and this is cleared.
-- profiles already has select/insert/update policies scoped to id = auth.uid(),
-- so the authenticated client can persist this directly under RLS.

alter table profiles add column onboarding_state jsonb not null default '{}'::jsonb;
