-- Migration: create_posts

create type public.truth_level as enum ('valid', 'suspicious', 'hoax');

create table if not exists public.posts (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references public.users(id) on delete cascade,
  content         text not null,
  media           jsonb,
  parent_id       uuid references public.posts(id) on delete set null,
  truth_score     smallint not null default 50 check (truth_score between 0 and 100),
  truth_level     public.truth_level not null default 'suspicious',
  virality_score  smallint not null default 0 check (virality_score between 0 and 100),
  vara_reward     numeric(12, 4),
  likes_count     integer not null default 0,
  reposts_count   integer not null default 0,
  replies_count   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists posts_author_id_idx on public.posts (author_id);
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_truth_level_idx on public.posts (truth_level);

alter table public.posts enable row level security;

create policy "posts: public read"
  on public.posts for select
  using (true);

create policy "posts: owner insert"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "posts: owner update"
  on public.posts for update
  using (auth.uid() = author_id);

create policy "posts: owner delete"
  on public.posts for delete
  using (auth.uid() = author_id);

create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();
