-- Migration: count_triggers
-- Auto-maintain likes_count, reposts_count, replies_count on posts
-- via triggers on likes, reposts, and comments tables.

-- ── LIKES ────────────────────────────────────────────────────────────────────

create or replace function public.fn_likes_count()
returns trigger language plpgsql security definer as $$
begin
  if (TG_OP = 'INSERT') then
    update public.posts
      set likes_count = likes_count + 1
      where id = NEW.post_id;
  elsif (TG_OP = 'DELETE') then
    update public.posts
      set likes_count = greatest(0, likes_count - 1)
      where id = OLD.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_likes_count on public.likes;
create trigger trg_likes_count
  after insert or delete on public.likes
  for each row execute function public.fn_likes_count();

-- ── REPOSTS ──────────────────────────────────────────────────────────────────

create or replace function public.fn_reposts_count()
returns trigger language plpgsql security definer as $$
begin
  if (TG_OP = 'INSERT') then
    update public.posts
      set reposts_count = reposts_count + 1
      where id = NEW.post_id;
  elsif (TG_OP = 'DELETE') then
    update public.posts
      set reposts_count = greatest(0, reposts_count - 1)
      where id = OLD.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_reposts_count on public.reposts;
create trigger trg_reposts_count
  after insert or delete on public.reposts
  for each row execute function public.fn_reposts_count();

-- ── COMMENTS / REPLIES ───────────────────────────────────────────────────────

create or replace function public.fn_replies_count()
returns trigger language plpgsql security definer as $$
begin
  if (TG_OP = 'INSERT') then
    update public.posts
      set replies_count = replies_count + 1
      where id = NEW.post_id;
  elsif (TG_OP = 'DELETE') then
    update public.posts
      set replies_count = greatest(0, replies_count - 1)
      where id = OLD.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_replies_count on public.comments;
create trigger trg_replies_count
  after insert or delete on public.comments
  for each row execute function public.fn_replies_count();

-- ── BACKFILL existing data ────────────────────────────────────────────────────
-- Recompute counters from actual rows in case any actions happened before
-- these triggers were installed.

update public.posts p
  set likes_count = (
    select count(*) from public.likes l where l.post_id = p.id
  );

update public.posts p
  set reposts_count = (
    select count(*) from public.reposts r where r.post_id = p.id
  );

update public.posts p
  set replies_count = (
    select count(*) from public.comments c where c.post_id = p.id
  );
