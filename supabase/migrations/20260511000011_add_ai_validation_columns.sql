-- Migration: add_ai_validation_columns
-- Adds columns required by the AI validator server (ai-agent/ai-validator).
--
-- ad_campaigns:
--   route_hash  — bytes32 hex (UUID encoded) submitted on-chain via requestAdPlacement()
--   ai_status   — tracks AI moderation lifecycle: processing | approved | rejected
--   ai_report   — reason string returned by the LLM
--   tx_hash     — on-chain tx hash of processAdValidation() call
--   status also updated to 'active' on approval or 'rejected' on rejection by server
--
-- users:
--   ai_status   — tracks subscription validation lifecycle
--   ai_report   — reason string returned by the LLM
--   tx_hash     — on-chain tx hash of processValidation() call

alter table public.ad_campaigns
  add column if not exists route_hash  text,
  add column if not exists ai_status   text,
  add column if not exists ai_report   text,
  add column if not exists tx_hash     text;

create index if not exists ad_campaigns_route_hash_idx
  on public.ad_campaigns (route_hash)
  where route_hash is not null;

create index if not exists ad_campaigns_ai_status_idx
  on public.ad_campaigns (ai_status)
  where ai_status is not null;

alter table public.users
  add column if not exists ai_status  text,
  add column if not exists ai_report  text,
  add column if not exists tx_hash    text;
