-- Migration: wallet_only_users
-- Decouple public.users from Supabase Auth because app identity is wallet-first.

alter table public.users
  drop constraint if exists users_id_fkey;

alter table public.users
  alter column id set default gen_random_uuid();

drop policy if exists "users: owner update" on public.users;
create policy "users: public insert"
  on public.users for insert
  with check (true);

create policy "users: public update"
  on public.users for update
  using (true)
  with check (true);
