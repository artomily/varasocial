-- Migration: create_monetization

create table if not exists public.vara_rewards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  post_id     uuid references public.posts(id) on delete set null,
  amount      numeric(12, 4) not null,
  reason      text,
  created_at  timestamptz not null default now()
);

create index if not exists vara_rewards_user_id_idx on public.vara_rewards (user_id);

create table if not exists public.creator_subscriptions (
  subscriber_id uuid not null references public.users(id) on delete cascade,
  creator_id    uuid not null references public.users(id) on delete cascade,
  tier          smallint not null default 1,
  created_at    timestamptz not null default now(),
  primary key (subscriber_id, creator_id),
  check (subscriber_id <> creator_id)
);

alter table public.vara_rewards enable row level security;
alter table public.creator_subscriptions enable row level security;

create policy "vara_rewards: owner read"
  on public.vara_rewards for select
  using (auth.uid() = user_id);

create policy "vara_rewards: system insert"
  on public.vara_rewards for insert
  with check (true);

create policy "creator_subscriptions: public read"
  on public.creator_subscriptions for select
  using (true);

create policy "creator_subscriptions: owner insert"
  on public.creator_subscriptions for insert
  with check (auth.uid() = subscriber_id);

create policy "creator_subscriptions: owner delete"
  on public.creator_subscriptions for delete
  using (auth.uid() = subscriber_id);
