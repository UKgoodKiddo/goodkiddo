alter table public.family_subscriptions
  add column if not exists subscription_status text,
  add column if not exists subscription_plan text,
  add column if not exists subscription_provider text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_current_period_end timestamptz,
  add column if not exists booper_pack_included boolean not null default false,
  add column if not exists booper_pack_status text;

update public.family_subscriptions
set
  subscription_plan = coalesce(subscription_plan, plan_code),
  subscription_status = coalesce(subscription_status, status, 'inactive'),
  subscription_provider = coalesce(
    subscription_provider,
    case
      when provider_customer_id is not null or provider_subscription_id is not null then 'stripe'
      when plan_code is not null then 'manual'
      else null
    end
  ),
  stripe_customer_id = coalesce(stripe_customer_id, provider_customer_id),
  stripe_subscription_id = coalesce(stripe_subscription_id, provider_subscription_id),
  subscription_current_period_end = coalesce(subscription_current_period_end, renewal_date)
where
  subscription_plan is null
  or subscription_status is null
  or subscription_provider is null
  or stripe_customer_id is null
  or stripe_subscription_id is null
  or subscription_current_period_end is null;

update public.family_subscriptions
set subscription_status = 'inactive'
where subscription_status is null;

alter table public.family_subscriptions
  alter column subscription_status set not null;

alter table public.family_subscriptions
  add constraint family_subscriptions_subscription_provider_check
  check (
    subscription_provider is null
    or subscription_provider in ('stripe', 'manual')
  );

alter table public.family_subscriptions
  add constraint family_subscriptions_booper_pack_status_check
  check (
    booper_pack_status is null
    or booper_pack_status in ('pending', 'packed', 'shipped', 'delivered')
  );

create index if not exists family_subscriptions_subscription_status_idx
  on public.family_subscriptions (subscription_status);

create index if not exists family_subscriptions_subscription_plan_idx
  on public.family_subscriptions (subscription_plan);

create index if not exists family_subscriptions_stripe_customer_id_idx
  on public.family_subscriptions (stripe_customer_id);

create index if not exists family_subscriptions_stripe_subscription_id_idx
  on public.family_subscriptions (stripe_subscription_id);
