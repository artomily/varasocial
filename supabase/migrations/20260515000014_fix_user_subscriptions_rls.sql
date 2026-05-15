-- Migration: fix_user_subscriptions_rls
-- user_subscriptions was missed in the wallet_first_schema migration.
-- Replace auth.uid()-based policies with open policies to match the wallet-first identity model.

drop policy if exists "user_subscriptions: owner read"   on public.user_subscriptions;
drop policy if exists "user_subscriptions: owner insert" on public.user_subscriptions;
drop policy if exists "user_subscriptions: owner update" on public.user_subscriptions;

create policy "user_subscriptions: public read"
  on public.user_subscriptions for select
  using (true);

create policy "user_subscriptions: public insert"
  on public.user_subscriptions for insert
  with check (true);

create policy "user_subscriptions: public update"
  on public.user_subscriptions for update
  using (true)
  with check (true);
