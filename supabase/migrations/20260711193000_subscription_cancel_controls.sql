alter table public.family_subscriptions
  add column if not exists subscription_cancel_at_period_end boolean not null default false;
