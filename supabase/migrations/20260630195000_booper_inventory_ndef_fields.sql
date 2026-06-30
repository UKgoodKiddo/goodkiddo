alter table public.booper_inventory
  add column if not exists ndef_url text,
  add column if not exists ndef_text text;
