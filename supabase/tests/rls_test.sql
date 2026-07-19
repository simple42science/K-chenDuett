begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(11);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.test', '', now(), '{}', '{"display_name":"Person A"}', now(), now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.test', '', now(), '{}', '{"display_name":"Person B"}', now(), now()),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c@example.test', '', now(), '{}', '{"display_name":"Person C"}', now(), now());

create temporary table test_context (
  key text primary key,
  id uuid not null,
  version integer
);
grant all on table test_context to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
insert into test_context (key, id)
select 'household_a', public.create_household('Haushalt A');
select extensions.ok((select id is not null from test_context where key = 'household_a'), 'Person A erstellt Haushalt A');

select public.create_household_invitation(
  (select id from test_context where key = 'household_a'),
  repeat('a', 64),
  now() + interval '1 hour'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select extensions.is(
  public.accept_household_invitation(repeat('a', 64)),
  (select id from test_context where key = 'household_a'),
  'Person B nimmt die Einladung in Haushalt A an'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
insert into test_context (key, id)
select 'household_c', public.create_household('Haushalt C');
select extensions.isnt(
  (select id from test_context where key = 'household_a'),
  (select id from test_context where key = 'household_c'),
  'Person C besitzt einen getrennten Haushalt'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
with inserted_item as (
  insert into public.inventory_items (
    household_id, name, category, quantity, unit, storage_location_id
  )
  select
    context.id,
    'Tomaten',
    'Gemüse',
    2,
    'Stück',
    locations.id
  from test_context context
  join public.storage_locations locations on locations.household_id = context.id
  where context.key = 'household_a' and locations.name = 'Kühlschrank'
  returning id, version
)
insert into test_context (key, id, version)
select 'item', id, version from inserted_item;

select extensions.is((select count(*) from public.inventory_items), 1::bigint, 'Person A sieht den Artikel');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select extensions.is((select count(*) from public.inventory_items), 1::bigint, 'Person B sieht den gemeinsamen Artikel');
select extensions.lives_ok(
  format(
    'select public.change_inventory_quantity(%L, -1, %s)',
    (select id from test_context where key = 'item'),
    (select version from test_context where key = 'item')
  ),
  'Person B darf die gemeinsame Menge reduzieren'
);
select extensions.is((select quantity from public.inventory_items), 1::numeric, 'Die Menge wurde atomar reduziert');
select extensions.lives_ok(
  format(
    'select public.undo_inventory_transaction(%L)',
    (
      select id
      from public.inventory_transactions
      where action = 'decrease'
      order by created_at desc
      limit 1
    )
  ),
  'Person B kann die eigene Mengenänderung sofort rückgängig machen'
);
select extensions.is((select quantity from public.inventory_items), 2::numeric, 'Undo stellt die vorherige Menge wieder her');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select extensions.is((select count(*) from public.inventory_items), 0::bigint, 'Person C sieht keine Artikel aus Haushalt A');
select extensions.throws_ok(
  format(
    'select public.change_inventory_quantity(%L, -1, 2)',
    (select id from test_context where key = 'item')
  ),
  '42501',
  'Zugriff verweigert',
  'Person C kann den fremden Artikel nicht ändern'
);

select * from extensions.finish();
rollback;
