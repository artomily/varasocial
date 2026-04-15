-- Migration: create_notifications

create type public.notification_type as enum ('like', 'repost', 'reply', 'follow', 'reward');

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  actor_id   uuid not null references public.users(id) on delete cascade,
  type       public.notification_type not null,
  post_id    uuid references public.posts(id) on delete cascade,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications: owner read"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications: system insert"
  on public.notifications for insert
  with check (true);

create policy "notifications: owner update"
  on public.notifications for update
  using (auth.uid() = user_id);
