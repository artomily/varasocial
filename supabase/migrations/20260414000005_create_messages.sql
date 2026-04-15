-- Migration: create_messages

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  text        text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists messages_sender_idx on public.messages (sender_id);
create index if not exists messages_receiver_idx on public.messages (receiver_id);
create index if not exists messages_conversation_idx on public.messages (
  least(sender_id, receiver_id),
  greatest(sender_id, receiver_id),
  created_at desc
);

alter table public.messages enable row level security;

create policy "messages: participant read"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "messages: owner insert"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "messages: receiver update"
  on public.messages for update
  using (auth.uid() = receiver_id);
