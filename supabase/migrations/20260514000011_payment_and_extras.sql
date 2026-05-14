-- Migration: payment_and_extras
-- Adds og_tx_hash to user_subscriptions for 0G payment tracking

alter table public.user_subscriptions
  add column if not exists og_tx_hash text;
