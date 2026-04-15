-- Migration: create_users
-- Users table linked to Supabase Auth

create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text not null unique,
  display_name  text not null,
  avatar_url    text,
  bio           text,
  wallet_address text,
  verified      boolean not null default false,
  followers     integer not null default 0,
  following     integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists users_handle_idx on public.users (lower(handle));

alter table public.users enable row level security;

create policy "users: public read"
  on public.users for select
  using (true);

create policy "users: owner update"
  on public.users for update
  using (auth.uid() = id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();
