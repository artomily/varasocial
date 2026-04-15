-- Migration: create_social_interactions
-- Likes, reposts, follows

create table if not exists public.likes (
  user_id   uuid not null references public.users(id) on delete cascade,
  post_id   uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.reposts (
  user_id   uuid not null references public.users(id) on delete cascade,
  post_id   uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.follows (
  follower_id  uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.likes enable row level security;
alter table public.reposts enable row level security;
alter table public.follows enable row level security;

create policy "likes: public read" on public.likes for select using (true);
create policy "likes: owner insert" on public.likes for insert with check (auth.uid() = user_id);
create policy "likes: owner delete" on public.likes for delete using (auth.uid() = user_id);

create policy "reposts: public read" on public.reposts for select using (true);
create policy "reposts: owner insert" on public.reposts for insert with check (auth.uid() = user_id);
create policy "reposts: owner delete" on public.reposts for delete using (auth.uid() = user_id);

create policy "follows: public read" on public.follows for select using (true);
create policy "follows: owner insert" on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows: owner delete" on public.follows for delete using (auth.uid() = follower_id);
