create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_profile_id uuid,
  title text not null check (char_length(trim(title)) >= 1),
  description text,
  boop_reward integer not null check (boop_reward > 0),
  recurring_type text not null default 'none' check (recurring_type in ('none', 'daily', 'weekly')),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (id, family_id),
  constraint tasks_child_family_fk
    foreign key (child_profile_id, family_id)
    references public.child_profiles (id, family_id)
    on delete set null
);

create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null
);

create index if not exists tasks_family_id_idx
  on public.tasks (family_id, created_at desc);

create index if not exists tasks_child_profile_id_idx
  on public.tasks (child_profile_id);

create index if not exists task_completions_task_id_idx
  on public.task_completions (task_id, submitted_at desc);

create index if not exists task_completions_child_profile_id_idx
  on public.task_completions (child_profile_id, submitted_at desc);

create index if not exists task_completions_status_idx
  on public.task_completions (status, submitted_at desc);

create or replace function public.recalculate_child_boop_balance(target_child_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  earned_total integer;
begin
  select coalesce(sum(amount), 0)
    into earned_total
  from public.boop_transactions
  where child_profile_id = target_child_profile_id;

  update public.child_profiles
  set boop_balance = earned_total
  where id = target_child_profile_id;
end;
$$;

drop trigger if exists sync_child_boop_balance_from_redemptions on public.redemptions;
drop trigger if exists ensure_redeemable_balance_before_redemption on public.redemptions;
drop function if exists public.ensure_redeemable_balance();

create or replace function public.approve_task_completion(target_completion_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  completion_record record;
begin
  select
    tc.id,
    tc.child_profile_id,
    tc.status,
    t.family_id,
    t.title,
    t.boop_reward
  into completion_record
  from public.task_completions tc
  join public.tasks t
    on t.id = tc.task_id
  where tc.id = target_completion_id
  for update of tc;

  if not found then
    raise exception 'Task completion not found';
  end if;

  if not public.is_parent_of_family(completion_record.family_id) then
    raise exception 'Not authorized to review this task completion';
  end if;

  if completion_record.status <> 'pending' then
    raise exception 'This task completion has already been reviewed';
  end if;

  update public.task_completions
  set
    status = 'approved',
    reviewed_at = timezone('utc', now()),
    reviewed_by = auth.uid()
  where id = target_completion_id;

  insert into public.boop_transactions (
    family_id,
    child_profile_id,
    amount,
    reason,
    created_by
  )
  values (
    completion_record.family_id,
    completion_record.child_profile_id,
    completion_record.boop_reward,
    concat('Task approved: ', completion_record.title),
    auth.uid()
  );
end;
$$;

create or replace function public.reject_task_completion(target_completion_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  completion_record record;
begin
  select
    tc.id,
    tc.status,
    t.family_id
  into completion_record
  from public.task_completions tc
  join public.tasks t
    on t.id = tc.task_id
  where tc.id = target_completion_id
  for update of tc;

  if not found then
    raise exception 'Task completion not found';
  end if;

  if not public.is_parent_of_family(completion_record.family_id) then
    raise exception 'Not authorized to review this task completion';
  end if;

  if completion_record.status <> 'pending' then
    raise exception 'This task completion has already been reviewed';
  end if;

  update public.task_completions
  set
    status = 'rejected',
    reviewed_at = timezone('utc', now()),
    reviewed_by = auth.uid()
  where id = target_completion_id;
end;
$$;

create or replace function public.approve_redemption(target_redemption_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  redemption_record record;
  available_balance integer;
begin
  select
    r.id,
    r.family_id,
    r.child_profile_id,
    r.cost_at_redemption,
    r.status,
    reward.title
  into redemption_record
  from public.redemptions r
  join public.rewards reward
    on reward.id = r.reward_id
  where r.id = target_redemption_id
  for update of r;

  if not found then
    raise exception 'Redemption not found';
  end if;

  if not public.is_parent_of_family(redemption_record.family_id) then
    raise exception 'Not authorized to review this redemption';
  end if;

  if redemption_record.status <> 'pending' then
    raise exception 'This redemption has already been reviewed';
  end if;

  select coalesce(sum(amount), 0)
    into available_balance
  from public.boop_transactions
  where child_profile_id = redemption_record.child_profile_id;

  if available_balance < redemption_record.cost_at_redemption then
    raise exception 'Not enough boops available for this redemption';
  end if;

  update public.redemptions
  set status = 'approved'
  where id = target_redemption_id;

  insert into public.boop_transactions (
    family_id,
    child_profile_id,
    amount,
    reason,
    created_by
  )
  values (
    redemption_record.family_id,
    redemption_record.child_profile_id,
    -redemption_record.cost_at_redemption,
    concat('Reward approved: ', redemption_record.title),
    auth.uid()
  );
end;
$$;

create or replace function public.reject_redemption(target_redemption_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  redemption_record record;
begin
  select
    r.id,
    r.status,
    r.family_id
  into redemption_record
  from public.redemptions r
  where r.id = target_redemption_id
  for update of r;

  if not found then
    raise exception 'Redemption not found';
  end if;

  if not public.is_parent_of_family(redemption_record.family_id) then
    raise exception 'Not authorized to review this redemption';
  end if;

  if redemption_record.status <> 'pending' then
    raise exception 'This redemption has already been reviewed';
  end if;

  update public.redemptions
  set status = 'rejected'
  where id = target_redemption_id;
end;
$$;

alter table public.tasks enable row level security;
alter table public.task_completions enable row level security;

create policy "parents manage tasks in family"
on public.tasks
for all
using (public.is_parent_of_family(family_id))
with check (public.is_parent_of_family(family_id));

create policy "parents manage task completions in family"
on public.task_completions
for all
using (
  exists (
    select 1
    from public.tasks t
    where t.id = task_id
      and public.is_parent_of_family(t.family_id)
  )
)
with check (
  exists (
    select 1
    from public.tasks t
    where t.id = task_id
      and public.is_parent_of_family(t.family_id)
  )
);
