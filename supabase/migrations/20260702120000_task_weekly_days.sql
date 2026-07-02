alter table public.tasks
add column if not exists weekly_days text[] null;
