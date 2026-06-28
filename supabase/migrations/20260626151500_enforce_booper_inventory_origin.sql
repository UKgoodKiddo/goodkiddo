update public.booper_inventory as inventory
set child_profile_id = booper.child_profile_id
from public.boopers as booper
where inventory.uid = booper.nfc_uid
  and inventory.family_id = booper.family_id
  and booper.child_profile_id is not null
  and inventory.child_profile_id is distinct from booper.child_profile_id;

delete from public.boopers as booper
where not exists (
  select 1
  from public.booper_inventory as inventory
  where inventory.uid = booper.nfc_uid
    and inventory.family_id = booper.family_id
);

update public.boopers as booper
set
  child_profile_id = inventory.child_profile_id,
  label = 'Booper ' || inventory.batch_number || ' #' || right(inventory.uid, 6),
  status = case
    when inventory.status = 'lost' then 'lost'
    when inventory.status in ('disabled', 'retired') then 'disabled'
    else 'active'
  end
from public.booper_inventory as inventory
where inventory.uid = booper.nfc_uid
  and inventory.family_id = booper.family_id;

delete from public.boopers as newer
using public.boopers as older
where newer.nfc_uid = older.nfc_uid
  and newer.id::text > older.id::text;

create unique index if not exists boopers_nfc_uid_uidx
  on public.boopers (nfc_uid);
