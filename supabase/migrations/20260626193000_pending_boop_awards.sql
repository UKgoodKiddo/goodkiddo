create table if not exists public.pending_boop_awards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles (id) on delete cascade,
  amount integer not null check (amount > 0),
  reason text not null check (char_length(trim(reason)) >= 1),
  awarded_by uuid not null references auth.users (id) on delete restrict,
  source_type text not null default 'manual' check (
    source_type in ('manual', 'task_approval', 'nfc_award')
  ),
  created_at timestamptz not null default timezone('utc', now()),
  claimed_at timestamptz,
  claimed_booper_uid text
);

create index if not exists pending_boop_awards_family_id_idx
  on public.pending_boop_awards (family_id, created_at desc);

create index if not exists pending_boop_awards_child_profile_id_idx
  on public.pending_boop_awards (child_profile_id, claimed_at, created_at desc);

alter table public.pending_boop_awards enable row level security;

create policy "parents manage pending boop awards in family"
on public.pending_boop_awards
for all
using (public.is_parent_of_family(family_id))
with check (public.is_parent_of_family(family_id));

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

  insert into public.pending_boop_awards (
    family_id,
    child_profile_id,
    amount,
    reason,
    awarded_by,
    source_type
  )
  values (
    completion_record.family_id,
    completion_record.child_profile_id,
    completion_record.boop_reward,
    concat('Task approved: ', completion_record.title),
    auth.uid(),
    'task_approval'
  );
end;
$$;

create or replace function public.claim_pending_boop_awards(
  target_family_id uuid,
  target_child_profile_id uuid,
  target_booper_uid text
)
returns table (
  claimed_count integer,
  claimed_total integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  inventory_record record;
begin
  select id
  into inventory_record
  from public.booper_inventory
  where family_id = target_family_id
    and child_profile_id = target_child_profile_id
    and status = 'assigned'
    and uid = upper(trim(target_booper_uid))
  for update;

  if not found then
    raise exception 'Assigned Booper not found for this child';
  end if;

  return query
  with pending_rows as (
    select *
    from public.pending_boop_awards
    where family_id = target_family_id
      and child_profile_id = target_child_profile_id
      and claimed_at is null
    for update
  ),
  inserted_rows as (
    insert into public.boop_transactions (
      family_id,
      child_profile_id,
      amount,
      reason,
      created_by
    )
    select
      pending.family_id,
      pending.child_profile_id,
      pending.amount,
      pending.reason,
      pending.awarded_by
    from pending_rows pending
    returning amount
  ),
  inserted_summary as (
    select count(*) as inserted_count
    from inserted_rows
  ),
  updated_rows as (
    update public.pending_boop_awards
    set
      claimed_at = timezone('utc', now()),
      claimed_booper_uid = upper(trim(target_booper_uid))
    where id in (select id from pending_rows)
    returning amount
  )
  select
    count(*)::integer as claimed_count,
    coalesce(sum(amount), 0)::integer as claimed_total
  from updated_rows;
end;
$$;
