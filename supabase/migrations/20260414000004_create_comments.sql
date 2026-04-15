-- Migration: create_comments

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid not null references public.users(id) on delete cascade,
  content    text not null,
  likes_count integer not null default 0,
  is_ai      boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comments_post_id_idx on public.comments (post_id);

alter table public.comments enable row level security;

create policy "comments: public read" on public.comments for select using (true);
create policy "comments: owner insert" on public.comments for insert with check (auth.uid() = author_id);
create policy "comments: owner update" on public.comments for update using (auth.uid() = author_id);
create policy "comments: owner delete" on public.comments for delete using (auth.uid() = author_id);

create trigger comments_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();
