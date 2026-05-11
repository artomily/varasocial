-- Migration: add_mode_turu
-- Adds AI clone / "mode turu" (sleep mode) columns to users.
-- When is_turu is enabled, the AI clone service auto-replies to incoming comments.

alter table public.users
  add column if not exists is_turu        boolean not null default false,
  add column if not exists persona        text,
  add column if not exists operator_wallet text;

comment on column public.users.is_turu         is 'When true, the AI clone auto-replies to comments on this user''s posts.';
comment on column public.users.persona         is 'Free-text description of the user''s character/style used for AI persona prompting.';
comment on column public.users.operator_wallet is 'Wallet address used for on-chain operator verification.';
