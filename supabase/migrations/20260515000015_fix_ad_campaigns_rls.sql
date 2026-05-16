-- Migration: fix_ad_campaigns_rls
-- The wallet-first migration (20260511000010) fixed RLS on posts/likes/etc.
-- but missed ad_campaigns which still had auth.uid()-based policies.
-- Since there is no Supabase Auth session (wallet-only login), auth.uid()
-- is always NULL → SELECT returns nothing and INSERT is blocked.
--
-- Also bundles the analytics columns from 20260515000014.

-- ── RLS FIX ──────────────────────────────────────────────────────────────────

drop policy if exists "ad_campaigns: owner read"   on public.ad_campaigns;
drop policy if exists "ad_campaigns: owner insert" on public.ad_campaigns;
drop policy if exists "ad_campaigns: owner update" on public.ad_campaigns;
drop policy if exists "ad_campaigns: owner delete" on public.ad_campaigns;

create policy "ad_campaigns: public read"
  on public.ad_campaigns for select
  using (true);

create policy "ad_campaigns: public insert"
  on public.ad_campaigns for insert
  with check (true);

create policy "ad_campaigns: public update"
  on public.ad_campaigns for update
  using (true)
  with check (true);

create policy "ad_campaigns: public delete"
  on public.ad_campaigns for delete
  using (true);

-- ── ANALYTICS COLUMNS (idempotent) ───────────────────────────────────────────

alter table public.ad_campaigns
  add column if not exists impressions integer      not null default 0,
  add column if not exists clicks      integer      not null default 0,
  add column if not exists spent       numeric(12,4) not null default 0;
