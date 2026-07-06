create or replace function public.normalize_uid(uid_value text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(trim(coalesce(uid_value, '')), '[:\s]+', '', 'g'));
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
    and public.normalize_uid(uid) = public.normalize_uid(target_booper_uid)
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
  updated_rows as (
    update public.pending_boop_awards
    set
      claimed_at = timezone('utc', now()),
      claimed_booper_uid = public.normalize_uid(target_booper_uid)
    where id in (select id from pending_rows)
    returning amount
  )
  select
    count(*)::integer as claimed_count,
    coalesce(sum(amount), 0)::integer as claimed_total
  from updated_rows;
end;
$$;
