alter table public.families
add column if not exists parent_pin text not null default '0000';

update public.families
set parent_pin = '0000'
where parent_pin is null
   or parent_pin !~ '^\d{4}$';

alter table public.families
drop constraint if exists families_parent_pin_format;

alter table public.families
add constraint families_parent_pin_format
check (parent_pin ~ '^\d{4}$');
