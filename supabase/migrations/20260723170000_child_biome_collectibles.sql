create table if not exists public.child_biome_collectibles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_profile_id uuid not null,
  biome_id text not null check (
    biome_id in (
      'boop-pop-pirates'
    )
  ),
  collectible_id text not null,
  collected_at timestamptz not null default timezone('utc', now()),
  constraint child_biome_collectibles_child_family_fk
    foreign key (child_profile_id, family_id)
    references public.child_profiles (id, family_id)
    on delete cascade,
  unique (child_profile_id, biome_id, collectible_id)
);

create index if not exists child_biome_collectibles_family_idx
  on public.child_biome_collectibles (family_id, biome_id, collected_at desc);

create index if not exists child_biome_collectibles_child_idx
  on public.child_biome_collectibles (child_profile_id, biome_id, collected_at desc);

alter table public.child_biome_collectibles enable row level security;

create policy "parents manage child biome collectibles in family"
on public.child_biome_collectibles
for all
using (public.is_parent_of_family(family_id))
with check (public.is_parent_of_family(family_id));
