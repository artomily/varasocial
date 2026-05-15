-- ============================================================
-- AI Validator — Database Migration
-- Run this against your Supabase project (SQL Editor or CLI).
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXISTS).
-- ============================================================

-- ── ad_campaigns ─────────────────────────────────────────────
-- route_hash : bytes32 hex string from 0G blockchain event (column already exists).
-- ai_status  : lifecycle state managed by the AI Validator service.
-- ai_report  : short reason returned by the LLM when content is rejected.
-- tx_hash    : on-chain proof of the operator's processAdValidation() call.

ALTER TABLE public.ad_campaigns
  ADD COLUMN IF NOT EXISTS ai_status  TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ai_report  TEXT,
  ADD COLUMN IF NOT EXISTS tx_hash    TEXT;

ALTER TABLE public.ad_campaigns
  ADD CONSTRAINT IF NOT EXISTS ad_campaigns_ai_status_check
    CHECK (ai_status IN ('pending', 'processing', 'approved', 'rejected'));

-- route_hash already exists; add unique index if missing.
CREATE UNIQUE INDEX IF NOT EXISTS ad_campaigns_route_hash_idx
  ON public.ad_campaigns (route_hash)
  WHERE route_hash IS NOT NULL;

-- ── posts ─────────────────────────────────────────────────────
-- Posts are only READ as input for subscription (blue-check) validation.
-- The AI decision is stored on the 'users' table, not per-post.
-- No additional columns needed here.

-- ── users (subscription / blue-check validation result) ──────
-- ai_status  : result of the subscription content review.
-- ai_report  : reason if subscription was rejected.
-- tx_hash    : on-chain proof of the operator's processValidation() call.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS ai_status  TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ai_report  TEXT,
  ADD COLUMN IF NOT EXISTS tx_hash    TEXT;

ALTER TABLE public.users
  ADD CONSTRAINT IF NOT EXISTS users_ai_status_check
    CHECK (ai_status IN ('pending', 'processing', 'approved', 'rejected'));
