-- Add analytics tracking columns to ad_campaigns
alter table public.ad_campaigns
  add column if not exists impressions integer not null default 0,
  add column if not exists clicks      integer not null default 0,
  add column if not exists spent       numeric(12, 4) not null default 0;
