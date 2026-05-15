-- Seed default subscription plans
insert into public.subscription_plans (id, slug, title, price, billing_cycle, benefits, featured, active)
values (
  '00000000-0000-0000-0000-000000000001',
  'blue',
  'Blue Check',
  0.05,
  'monthly',
  '["Blue check verification","VaraAI feed scoring","Mode Sleep AI agent","Ad-free experience","Creator earnings eligibility"]'::jsonb,
  true,
  true
)
on conflict (slug) do nothing;
