-- Migration: ads_onboarding_storage

alter table public.users
  add column if not exists wallet_connected_at timestamptz,
  add column if not exists username_set_at timestamptz;

create unique index if not exists users_wallet_address_unique_idx
  on public.users (lower(wallet_address))
  where wallet_address is not null;

create table if not exists public.subscription_plans (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  price         numeric(12, 4) not null default 0,
  billing_cycle text not null default 'monthly',
  benefits      jsonb not null default '[]'::jsonb,
  featured      boolean not null default false,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  user_id     uuid primary key references public.users(id) on delete cascade,
  plan_id     uuid not null references public.subscription_plans(id) on delete restrict,
  status      text not null default 'active',
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.user_ad_preferences (
  user_id                 uuid primary key references public.users(id) on delete cascade,
  hide_ads                boolean not null default false,
  filter_ai_ads           boolean not null default false,
  sponsored_feed_interval  integer not null default 7,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create table if not exists public.ad_campaigns (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.users(id) on delete cascade,
  title       text not null,
  objective   text not null,
  budget      numeric(12, 4) not null default 0,
  placements  jsonb not null default '[]'::jsonb,
  status      text not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.post_storage_routes (
  post_id          uuid primary key references public.posts(id) on delete cascade,
  storage_provider text not null default '0g',
  storage_route    text not null,
  preview_url      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.user_ad_preferences enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.post_storage_routes enable row level security;

create policy "subscription_plans: public read"
  on public.subscription_plans for select
  using (true);

create policy "user_subscriptions: owner read"
  on public.user_subscriptions for select
  using (auth.uid() = user_id);

create policy "user_subscriptions: owner insert"
  on public.user_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "user_subscriptions: owner update"
  on public.user_subscriptions for update
  using (auth.uid() = user_id);

create policy "user_ad_preferences: owner read"
  on public.user_ad_preferences for select
  using (auth.uid() = user_id);

create policy "user_ad_preferences: owner insert"
  on public.user_ad_preferences for insert
  with check (auth.uid() = user_id);

create policy "user_ad_preferences: owner update"
  on public.user_ad_preferences for update
  using (auth.uid() = user_id);

create policy "ad_campaigns: owner read"
  on public.ad_campaigns for select
  using (auth.uid() = owner_id);

create policy "ad_campaigns: owner insert"
  on public.ad_campaigns for insert
  with check (auth.uid() = owner_id);

create policy "ad_campaigns: owner update"
  on public.ad_campaigns for update
  using (auth.uid() = owner_id);

create policy "ad_campaigns: owner delete"
  on public.ad_campaigns for delete
  using (auth.uid() = owner_id);

create policy "post_storage_routes: public read"
  on public.post_storage_routes for select
  using (true);

create policy "post_storage_routes: owner insert"
  on public.post_storage_routes for insert
  with check (true);

create policy "post_storage_routes: owner update"
  on public.post_storage_routes for update
  using (true);

create trigger subscription_plans_updated_at
  before update on public.subscription_plans
  for each row execute function public.set_updated_at();

create trigger user_subscriptions_updated_at
  before update on public.user_subscriptions
  for each row execute function public.set_updated_at();

create trigger user_ad_preferences_updated_at
  before update on public.user_ad_preferences
  for each row execute function public.set_updated_at();

create trigger ad_campaigns_updated_at
  before update on public.ad_campaigns
  for each row execute function public.set_updated_at();

create trigger post_storage_routes_updated_at
  before update on public.post_storage_routes
  for each row execute function public.set_updated_at();
