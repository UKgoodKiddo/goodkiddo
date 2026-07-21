create table if not exists public.child_achievements (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_profile_id uuid not null,
  achievement_id text not null check (
    achievement_id in (
      'boop-pop-pirates',
      'creative-cove',
      'beach-bay',
      'feelings-forest',
      'school-streetwise',
      'play-park',
      'homely-helper',
      'garden-grove',
      'kiddo-explorer-super-boop'
    )
  ),
  unlocked_at timestamptz not null default timezone('utc', now()),
  constraint child_achievements_child_family_fk
    foreign key (child_profile_id, family_id)
    references public.child_profiles (id, family_id)
    on delete cascade,
  unique (child_profile_id, achievement_id)
);

create index if not exists child_achievements_family_id_idx
  on public.child_achievements (family_id, unlocked_at desc);

create index if not exists child_achievements_child_profile_id_idx
  on public.child_achievements (child_profile_id, unlocked_at desc);

alter table public.child_achievements enable row level security;

create policy "parents manage child achievements in family"
on public.child_achievements
for all
using (public.is_parent_of_family(family_id))
with check (public.is_parent_of_family(family_id));

create or replace function public.award_child_achievement(
  target_child_profile_id uuid,
  target_achievement_id text
)
returns table (
  achievement_id text,
  unlocked_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_family_id uuid;
  standard_unlock_count integer;
begin
  if target_achievement_id not in (
    'boop-pop-pirates',
    'creative-cove',
    'beach-bay',
    'feelings-forest',
    'school-streetwise',
    'play-park',
    'homely-helper',
    'garden-grove',
    'kiddo-explorer-super-boop'
  ) then
    raise exception 'Unknown achievement id';
  end if;

  select cp.family_id
    into target_family_id
  from public.child_profiles cp
  join public.families f
    on f.id = cp.family_id
  where cp.id = target_child_profile_id
    and f.parent_user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Not authorized to award this achievement';
  end if;

  insert into public.child_achievements (
    family_id,
    child_profile_id,
    achievement_id
  )
  values (
    target_family_id,
    target_child_profile_id,
    target_achievement_id
  )
  on conflict (child_profile_id, achievement_id) do nothing;

  if target_achievement_id <> 'kiddo-explorer-super-boop' then
    select count(*)::integer
      into standard_unlock_count
    from public.child_achievements
    where child_profile_id = target_child_profile_id
      and achievement_id in (
        'boop-pop-pirates',
        'creative-cove',
        'beach-bay',
        'feelings-forest',
        'school-streetwise',
        'play-park',
        'homely-helper',
        'garden-grove'
      );

    if standard_unlock_count = 8 then
      insert into public.child_achievements (
        family_id,
        child_profile_id,
        achievement_id
      )
      values (
        target_family_id,
        target_child_profile_id,
        'kiddo-explorer-super-boop'
      )
      on conflict (child_profile_id, achievement_id) do nothing;
    end if;
  end if;

  return query
  select ca.achievement_id, ca.unlocked_at
  from public.child_achievements ca
  where ca.child_profile_id = target_child_profile_id
    and (
      ca.achievement_id = target_achievement_id
      or (
        target_achievement_id <> 'kiddo-explorer-super-boop'
        and ca.achievement_id = 'kiddo-explorer-super-boop'
      )
    );
end;
$$;
