-- Migration: wallet_first_schema
-- Comprehensive cleanup:
--   1. Fully decouple users table from Supabase Auth
--   2. Drop unused denormalized followers/following columns
--   3. Fix ALL RLS policies (replace auth.uid() with open — wallet-first app)
--   4. Add route_hash to posts and ad_campaigns for 0G storage

-- ── USERS TABLE ──────────────────────────────────────────────────────────────

alter table public.users
  drop constraint if exists users_id_fkey;

alter table public.users
  alter column id set default gen_random_uuid();

alter table public.users
  drop column if exists followers,
  drop column if exists following;

-- Ensure wallet_address unique index exists
create unique index if not exists users_wallet_address_unique_idx
  on public.users (lower(wallet_address))
  where wallet_address is not null;

-- Drop all old user policies and replace with open (wallet-first)
drop policy if exists "users: owner update"   on public.users;
drop policy if exists "users: public insert"  on public.users;
drop policy if exists "users: public update"  on public.users;

create policy "users: public insert"
  on public.users for insert
  with check (true);

create policy "users: public update"
  on public.users for update
  using (true)
  with check (true);

-- ── POSTS TABLE ──────────────────────────────────────────────────────────────

alter table public.posts
  add column if not exists route_hash text;

drop policy if exists "posts: owner insert" on public.posts;
drop policy if exists "posts: owner update" on public.posts;
drop policy if exists "posts: owner delete" on public.posts;

create policy "posts: public insert"
  on public.posts for insert
  with check (true);

create policy "posts: public update"
  on public.posts for update
  using (true)
  with check (true);

create policy "posts: public delete"
  on public.posts for delete
  using (true);

-- ── LIKES ────────────────────────────────────────────────────────────────────

drop policy if exists "likes: owner insert" on public.likes;
drop policy if exists "likes: owner delete" on public.likes;

create policy "likes: public insert" on public.likes for insert with check (true);
create policy "likes: public delete" on public.likes for delete using (true);

-- ── REPOSTS ──────────────────────────────────────────────────────────────────

drop policy if exists "reposts: owner insert" on public.reposts;
drop policy if exists "reposts: owner delete" on public.reposts;

create policy "reposts: public insert" on public.reposts for insert with check (true);
create policy "reposts: public delete" on public.reposts for delete using (true);

-- ── FOLLOWS ──────────────────────────────────────────────────────────────────

drop policy if exists "follows: owner insert" on public.follows;
drop policy if exists "follows: owner delete" on public.follows;

create policy "follows: public insert" on public.follows for insert with check (true);
create policy "follows: public delete" on public.follows for delete using (true);

-- ── COMMENTS ─────────────────────────────────────────────────────────────────

drop policy if exists "comments: owner insert" on public.comments;
drop policy if exists "comments: owner update" on public.comments;
drop policy if exists "comments: owner delete" on public.comments;

create policy "comments: public insert" on public.comments for insert with check (true);
create policy "comments: public update" on public.comments for update using (true) with check (true);
create policy "comments: public delete" on public.comments for delete using (true);

-- ── MESSAGES ─────────────────────────────────────────────────────────────────

drop policy if exists "messages: participant read"  on public.messages;
drop policy if exists "messages: owner insert"      on public.messages;
drop policy if exists "messages: receiver update"   on public.messages;

create policy "messages: public read"   on public.messages for select using (true);
create policy "messages: public insert" on public.messages for insert with check (true);
create policy "messages: public update" on public.messages for update using (true) with check (true);

-- ── NOTIFICATIONS ────────────────────────────────────────────────────────────

drop policy if exists "notifications: owner read"   on public.notifications;
drop policy if exists "notifications: owner update" on public.notifications;

create policy "notifications: public read"   on public.notifications for select using (true);
create policy "notifications: public update" on public.notifications for update using (true) with check (true);

-- ── AD CAMPAIGNS ─────────────────────────────────────────────────────────────

alter table public.ad_campaigns
  add column if not exists route_hash text;

-- ── VARA REWARDS ─────────────────────────────────────────────────────────────

drop policy if exists "vara_rewards: owner read" on public.vara_rewards;

create policy "vara_rewards: public read"
  on public.vara_rewards for select
  using (true);

-- ── CREATOR SUBSCRIPTIONS ────────────────────────────────────────────────────

drop policy if exists "creator_subscriptions: owner insert" on public.creator_subscriptions;
drop policy if exists "creator_subscriptions: owner delete" on public.creator_subscriptions;

create policy "creator_subscriptions: public insert"
  on public.creator_subscriptions for insert
  with check (true);

create policy "creator_subscriptions: public delete"
  on public.creator_subscriptions for delete
  using (true);
