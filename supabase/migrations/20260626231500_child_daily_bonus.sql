create table if not exists public.child_daily_checkins (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles (id) on delete cascade,
  checkin_date date not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (child_profile_id, checkin_date)
);

create index if not exists child_daily_checkins_family_id_idx
  on public.child_daily_checkins (family_id, checkin_date desc);

create index if not exists child_daily_checkins_child_profile_id_idx
  on public.child_daily_checkins (child_profile_id, checkin_date desc);

alter table public.child_daily_checkins enable row level security;

create policy "Parents can manage child daily checkins for their family"
on public.child_daily_checkins
for all
using (
  exists (
    select 1
    from public.families
    where families.id = child_daily_checkins.family_id
      and families.parent_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.families
    where families.id = child_daily_checkins.family_id
      and families.parent_user_id = auth.uid()
  )
);

create table if not exists public.child_daily_bonus_awards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles (id) on delete cascade,
  week_start date not null,
  milestone_type text not null check (
    milestone_type in ('five_of_seven', 'seven_of_seven')
  ),
  awarded_amount integer not null check (awarded_amount > 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (child_profile_id, week_start, milestone_type)
);

create index if not exists child_daily_bonus_awards_family_id_idx
  on public.child_daily_bonus_awards (family_id, week_start desc);

create index if not exists child_daily_bonus_awards_child_profile_id_idx
  on public.child_daily_bonus_awards (child_profile_id, week_start desc);

alter table public.child_daily_bonus_awards enable row level security;

create policy "Parents can manage child daily bonus awards for their family"
on public.child_daily_bonus_awards
for all
using (
  exists (
    select 1
    from public.families
    where families.id = child_daily_bonus_awards.family_id
      and families.parent_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.families
    where families.id = child_daily_bonus_awards.family_id
      and families.parent_user_id = auth.uid()
  )
);

alter table public.pending_boop_awards
  drop constraint if exists pending_boop_awards_source_type_check;

alter table public.pending_boop_awards
  add constraint pending_boop_awards_source_type_check
  check (source_type in ('manual', 'task_approval', 'nfc_award', 'daily_bonus'));
