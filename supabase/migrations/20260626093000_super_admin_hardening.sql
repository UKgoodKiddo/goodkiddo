do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'super_admin_users'
      and column_name = 'user_id'
  ) then
    alter table public.super_admin_users
      add column if not exists id uuid;

    update public.super_admin_users
    set id = gen_random_uuid()
    where id is null;

    alter table public.super_admin_users
      alter column id set default gen_random_uuid();

    alter table public.super_admin_users
      add column if not exists role text;

    update public.super_admin_users
    set role = 'super_admin'
    where role is null or trim(role) = '';

    begin
      alter table public.super_admin_users
        drop constraint if exists super_admin_users_pkey;
    exception
      when undefined_object then null;
    end;

    alter table public.super_admin_users
      add constraint super_admin_users_pkey primary key (id);

    alter table public.super_admin_users
      alter column role set not null;

    alter table public.super_admin_users
      alter column role set default 'super_admin';
  end if;
end $$;

create unique index if not exists super_admin_users_user_id_uidx
  on public.super_admin_users (user_id);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'booper_inventory'
      and column_name = 'assigned_family_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'booper_inventory'
      and column_name = 'family_id'
  ) then
    alter table public.booper_inventory
      rename column assigned_family_id to family_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'booper_inventory'
      and column_name = 'batch_name'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'booper_inventory'
      and column_name = 'batch_number'
  ) then
    alter table public.booper_inventory
      rename column batch_name to batch_number;
  end if;
end $$;

alter table public.booper_inventory
  add column if not exists batch_number text,
  add column if not exists child_profile_id uuid references public.child_profiles (id) on delete set null,
  add column if not exists family_id uuid references public.families (id) on delete set null,
  add column if not exists imported_by uuid references auth.users (id) on delete set null,
  add column if not exists imported_at timestamptz,
  add column if not exists notes text;

update public.booper_inventory
set status = 'available'
where status = 'in_stock';

update public.booper_inventory
set imported_at = coalesce(imported_at, created_at, timezone('utc', now()));

update public.booper_inventory
set batch_number = coalesce(nullif(trim(batch_number), ''), 'legacy-import');

alter table public.booper_inventory
  alter column imported_at set default timezone('utc', now()),
  alter column imported_at set not null,
  alter column batch_number set not null;

alter table public.booper_inventory
  drop constraint if exists booper_inventory_status_check;

alter table public.booper_inventory
  add constraint booper_inventory_status_check
  check (status in ('available', 'assigned', 'lost', 'disabled', 'retired'));

create index if not exists booper_inventory_family_id_idx
  on public.booper_inventory (family_id);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'admin_audit_log'
  ) then
    insert into public.audit_logs (id, actor_user_id, action, target_type, target_id, metadata, created_at)
    select
      id,
      admin_user_id,
      action_type,
      target_type,
      target_id,
      details_json,
      created_at
    from public.admin_audit_log
    on conflict (id) do nothing;
  end if;
end $$;

create index if not exists audit_logs_actor_user_id_idx
  on public.audit_logs (actor_user_id, created_at desc);

alter table public.audit_logs enable row level security;

create policy "super admins manage audit logs"
on public.audit_logs
for all
using (public.is_super_admin())
with check (public.is_super_admin());
