create table if not exists public.super_admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.booper_inventory (
  id uuid primary key default gen_random_uuid(),
  uid text not null unique,
  serial_label text not null,
  batch_name text,
  status text not null default 'in_stock' check (
    status in ('in_stock', 'assigned', 'lost', 'disabled', 'retired')
  ),
  assigned_family_id uuid references public.families (id) on delete set null,
  assigned_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.family_subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null unique references public.families (id) on delete cascade,
  plan_code text not null check (char_length(trim(plan_code)) >= 1),
  status text not null default 'trial' check (
    status in ('trial', 'active', 'past_due', 'cancelled')
  ),
  renewal_date timestamptz,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users (id) on delete cascade,
  action_type text not null,
  target_type text not null,
  target_id text,
  details_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists booper_inventory_assigned_family_id_idx
  on public.booper_inventory (assigned_family_id);

create index if not exists booper_inventory_status_idx
  on public.booper_inventory (status);

create index if not exists boopers_nfc_uid_idx
  on public.boopers (nfc_uid);

create index if not exists family_subscriptions_status_idx
  on public.family_subscriptions (status);

create index if not exists admin_audit_log_admin_user_id_idx
  on public.admin_audit_log (admin_user_id, created_at desc);

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.super_admin_users
    where user_id = auth.uid()
      and active = true
  );
$$;

create or replace function public.touch_family_subscription_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists family_subscriptions_touch_updated_at
on public.family_subscriptions;

create trigger family_subscriptions_touch_updated_at
before update on public.family_subscriptions
for each row
execute function public.touch_family_subscription_updated_at();

alter table public.super_admin_users enable row level security;
alter table public.booper_inventory enable row level security;
alter table public.family_subscriptions enable row level security;
alter table public.admin_audit_log enable row level security;

create policy "super admins read own membership"
on public.super_admin_users
for select
using (user_id = auth.uid());

create policy "super admins manage booper inventory"
on public.booper_inventory
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "super admins manage family subscriptions"
on public.family_subscriptions
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "super admins manage admin audit log"
on public.admin_audit_log
for all
using (public.is_super_admin())
with check (public.is_super_admin());
