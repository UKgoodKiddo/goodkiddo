create extension if not exists "pgcrypto";

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null unique references auth.users (id) on delete cascade,
  family_name text not null check (char_length(trim(family_name)) >= 2),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) >= 1),
  avatar_url text,
  boop_balance integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (id, family_id)
);

create table if not exists public.boopers (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_profile_id uuid,
  nfc_uid text not null,
  label text not null,
  status text not null default 'active' check (status in ('active', 'lost', 'disabled')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (family_id, nfc_uid),
  constraint boopers_child_family_fk
    foreign key (child_profile_id, family_id)
    references public.child_profiles (id, family_id)
    on delete set null
);

create table if not exists public.boop_transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_profile_id uuid not null,
  amount integer not null check (amount <> 0),
  reason text not null default '',
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint boop_transactions_child_family_fk
    foreign key (child_profile_id, family_id)
    references public.child_profiles (id, family_id)
    on delete cascade
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  title text not null check (char_length(trim(title)) >= 1),
  cost integer not null check (cost > 0),
  description text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (id, family_id)
);

create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_profile_id uuid not null,
  reward_id uuid not null,
  cost_at_redemption integer not null check (cost_at_redemption > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  created_at timestamptz not null default timezone('utc', now()),
  constraint redemptions_child_family_fk
    foreign key (child_profile_id, family_id)
    references public.child_profiles (id, family_id)
    on delete cascade,
  constraint redemptions_reward_family_fk
    foreign key (reward_id, family_id)
    references public.rewards (id, family_id)
    on delete cascade
);

create table if not exists public.device_child_mode (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_profile_id uuid not null,
  device_label text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint device_child_mode_child_family_fk
    foreign key (child_profile_id, family_id)
    references public.child_profiles (id, family_id)
    on delete cascade
);

create index if not exists child_profiles_family_id_idx
  on public.child_profiles (family_id);

create index if not exists boopers_family_id_idx
  on public.boopers (family_id);

create index if not exists boopers_child_profile_id_idx
  on public.boopers (child_profile_id);

create index if not exists boop_transactions_family_id_idx
  on public.boop_transactions (family_id, created_at desc);

create index if not exists boop_transactions_child_profile_id_idx
  on public.boop_transactions (child_profile_id);

create index if not exists rewards_family_id_idx
  on public.rewards (family_id);

create index if not exists redemptions_family_id_idx
  on public.redemptions (family_id, created_at desc);

create index if not exists redemptions_child_profile_id_idx
  on public.redemptions (child_profile_id);

create index if not exists device_child_mode_family_id_idx
  on public.device_child_mode (family_id, created_at desc);

create or replace function public.is_parent_of_family(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.families
    where id = target_family_id
      and parent_user_id = auth.uid()
  );
$$;

create or replace function public.recalculate_child_boop_balance(target_child_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  earned_total integer;
  reserved_total integer;
begin
  select coalesce(sum(amount), 0)
    into earned_total
  from public.boop_transactions
  where child_profile_id = target_child_profile_id;

  select coalesce(sum(cost_at_redemption), 0)
    into reserved_total
  from public.redemptions
  where child_profile_id = target_child_profile_id
    and status in ('pending', 'approved', 'completed');

  update public.child_profiles
  set boop_balance = earned_total - reserved_total
  where id = target_child_profile_id;
end;
$$;

create or replace function public.sync_child_boop_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_child_boop_balance(old.child_profile_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.child_profile_id <> new.child_profile_id then
    perform public.recalculate_child_boop_balance(old.child_profile_id);
  end if;

  perform public.recalculate_child_boop_balance(new.child_profile_id);
  return new;
end;
$$;

create or replace function public.ensure_redeemable_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  available_balance integer;
begin
  if new.status not in ('pending', 'approved', 'completed') then
    return new;
  end if;

  select coalesce(sum(amount), 0)
    - coalesce((
      select sum(cost_at_redemption)
      from public.redemptions
      where child_profile_id = new.child_profile_id
        and status in ('pending', 'approved', 'completed')
        and id <> coalesce(new.id, gen_random_uuid())
    ), 0)
    into available_balance
  from public.boop_transactions
  where child_profile_id = new.child_profile_id;

  if available_balance < new.cost_at_redemption then
    raise exception 'Not enough boops available for this redemption';
  end if;

  return new;
end;
$$;

create trigger sync_child_boop_balance_from_transactions
after insert or update or delete on public.boop_transactions
for each row
execute function public.sync_child_boop_balance();

create trigger sync_child_boop_balance_from_redemptions
after insert or update or delete on public.redemptions
for each row
execute function public.sync_child_boop_balance();

create trigger ensure_redeemable_balance_before_redemption
before insert or update on public.redemptions
for each row
execute function public.ensure_redeemable_balance();

alter table public.families enable row level security;
alter table public.child_profiles enable row level security;
alter table public.boopers enable row level security;
alter table public.boop_transactions enable row level security;
alter table public.rewards enable row level security;
alter table public.redemptions enable row level security;
alter table public.device_child_mode enable row level security;

create policy "parents manage their family"
on public.families
for all
using (parent_user_id = auth.uid())
with check (parent_user_id = auth.uid());

create policy "parents manage child profiles in family"
on public.child_profiles
for all
using (public.is_parent_of_family(family_id))
with check (public.is_parent_of_family(family_id));

create policy "parents manage boopers in family"
on public.boopers
for all
using (public.is_parent_of_family(family_id))
with check (public.is_parent_of_family(family_id));

create policy "parents manage boop transactions in family"
on public.boop_transactions
for all
using (public.is_parent_of_family(family_id))
with check (public.is_parent_of_family(family_id) and created_by = auth.uid());

create policy "parents manage rewards in family"
on public.rewards
for all
using (public.is_parent_of_family(family_id))
with check (public.is_parent_of_family(family_id));

create policy "parents manage redemptions in family"
on public.redemptions
for all
using (public.is_parent_of_family(family_id))
with check (public.is_parent_of_family(family_id));

create policy "parents manage device child mode in family"
on public.device_child_mode
for all
using (public.is_parent_of_family(family_id))
with check (public.is_parent_of_family(family_id));
