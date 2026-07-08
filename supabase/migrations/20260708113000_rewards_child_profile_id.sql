alter table public.rewards
add column if not exists child_profile_id uuid references public.child_profiles (id) on delete set null;

create index if not exists rewards_child_profile_id_idx
on public.rewards (child_profile_id);
