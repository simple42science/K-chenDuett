-- Docker-freier Remote-RLS-Test. Alle Testdaten werden zurückgerollt.
begin;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'remote-a@example.test', '', now(), '{}', '{"display_name":"Remote A"}', now(), now()),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'remote-b@example.test', '', now(), '{}', '{"display_name":"Remote B"}', now(), now()),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'remote-c@example.test', '', now(), '{}', '{"display_name":"Remote C"}', now(), now());

create temporary table remote_test_context (
  key text primary key,
  id uuid not null,
  version integer
);
grant all on table remote_test_context to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);

insert into remote_test_context (key, id)
select 'household_a', public.create_household('Remote Haushalt A');

do $$
begin
  if not exists (select 1 from remote_test_context where key = 'household_a') then
    raise exception 'RLS-Test 1 fehlgeschlagen: Person A konnte keinen Haushalt erstellen';
  end if;
end;
$$;

select public.create_household_invitation(
  (select id from remote_test_context where key = 'household_a'),
  repeat('b', 64),
  now() + interval '1 hour'
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);

do $$
declare
  accepted_household_id uuid;
begin
  accepted_household_id := public.accept_household_invitation(repeat('b', 64));
  if accepted_household_id is distinct from (
    select id from remote_test_context where key = 'household_a'
  ) then
    raise exception 'RLS-Test 2 fehlgeschlagen: Person B trat dem falschen Haushalt bei';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000003', true);

insert into remote_test_context (key, id)
select 'household_c', public.create_household('Remote Haushalt C');

do $$
begin
  if (select id from remote_test_context where key = 'household_a') =
     (select id from remote_test_context where key = 'household_c') then
    raise exception 'RLS-Test 3 fehlgeschlagen: getrennte Haushalte erhielten dieselbe ID';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);

with inserted_item as (
  insert into public.inventory_items (
    household_id, name, category, quantity, unit, storage_location_id
  )
  select
    context.id,
    'Remote Tomaten',
    'Gemüse',
    2,
    'Stück',
    locations.id
  from remote_test_context context
  join public.storage_locations locations on locations.household_id = context.id
  where context.key = 'household_a' and locations.name = 'Kühlschrank'
  returning id, version
)
insert into remote_test_context (key, id, version)
select 'item', id, version from inserted_item;

do $$
begin
  if (select count(*) from public.inventory_items) <> 1 then
    raise exception 'RLS-Test 4 fehlgeschlagen: Person A sieht nicht genau einen Artikel';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);

do $$
begin
  if (select count(*) from public.inventory_items) <> 1 then
    raise exception 'RLS-Test 5 fehlgeschlagen: Person B sieht den gemeinsamen Artikel nicht';
  end if;
end;
$$;

select public.change_inventory_quantity(
  (select id from remote_test_context where key = 'item'),
  -1,
  (select version from remote_test_context where key = 'item')
);

do $$
begin
  if (select quantity from public.inventory_items) <> 1 then
    raise exception 'RLS-Test 6 fehlgeschlagen: Menge wurde nicht atomar reduziert';
  end if;
end;
$$;

select public.undo_inventory_transaction(
  (
    select id
    from public.inventory_transactions
    where action = 'decrease'
    order by created_at desc
    limit 1
  )
);

do $$
begin
  if (select quantity from public.inventory_items) <> 2 then
    raise exception 'RLS-Test 7 fehlgeschlagen: Undo stellte die Menge nicht wieder her';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);

with created as (
  select public.create_inventory_item(
    (select id from remote_test_context where key = 'household_a'),
    'Remote Tomaten',
    'Gemüse',
    3,
    'Stück',
    (
      select id from public.storage_locations
      where household_id = (select id from remote_test_context where key = 'household_a')
        and name = 'Vorratsschrank'
    ),
    current_date + 3,
    null,
    'AP4-Test'
  ) as result
)
insert into remote_test_context (key, id, version)
select 'item_2', (result ->> 'item_id')::uuid, (result ->> 'version')::integer
from created;

do $$
begin
  if (select count(*) from public.inventory_items) <> 2 then
    raise exception 'RLS-Test 10 fehlgeschlagen: RPC erstellte keinen zweiten Artikel';
  end if;
end;
$$;

select public.update_inventory_item(
  (select id from remote_test_context where key = 'item_2'),
  (select version from remote_test_context where key = 'item_2'),
  'Remote Tomaten',
  'Gemüse',
  4,
  'Stück',
  (
    select id from public.storage_locations
    where household_id = (select id from remote_test_context where key = 'household_a')
      and name = 'Vorratsschrank'
  ),
  current_date + 4,
  current_date,
  'Bearbeitet'
);

do $$
begin
  if not exists (
    select 1 from public.inventory_items
    where id = (select id from remote_test_context where key = 'item_2')
      and quantity = 4
      and notes = 'Bearbeitet'
      and opened_on = current_date
  ) then
    raise exception 'RLS-Test 11 fehlgeschlagen: vollständiges Bearbeiten schlug fehl';
  end if;
end;
$$;

select public.merge_inventory_items(
  (select id from remote_test_context where key = 'item_2'),
  (select version from public.inventory_items where id = (select id from remote_test_context where key = 'item_2')),
  (select id from remote_test_context where key = 'item'),
  (select version from public.inventory_items where id = (select id from remote_test_context where key = 'item'))
);

do $$
begin
  if (select count(*) from public.inventory_items) <> 1
    or (select quantity from public.inventory_items) <> 6
    or not exists (select 1 from public.inventory_transactions where action = 'merge') then
    raise exception 'RLS-Test 12 fehlgeschlagen: Zusammenführen war nicht atomar';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000003', true);

do $$
begin
  if (select count(*) from public.inventory_items) <> 0 then
    raise exception 'RLS-Test 8 fehlgeschlagen: Person C sieht fremde Artikel';
  end if;
end;
$$;

do $$
begin
  perform public.create_inventory_item(
    (select id from remote_test_context where key = 'household_a'),
    'Fremder Artikel',
    'Sonstiges',
    1,
    'Stück',
    (
      select id from public.storage_locations
      where household_id = (select id from remote_test_context where key = 'household_a')
      limit 1
    )
  );
  raise exception 'RLS-Test 13 fehlgeschlagen: Person C konnte im fremden Haushalt erstellen';
exception
  when insufficient_privilege then
    if sqlerrm <> 'Zugriff verweigert' then
      raise;
    end if;
end;
$$;

do $$
begin
  perform public.change_inventory_quantity(
    (select id from remote_test_context where key = 'item'),
    -1,
    3
  );
  raise exception 'RLS-Test 9 fehlgeschlagen: Person C konnte einen fremden Artikel ändern';
exception
  when insufficient_privilege then
    if sqlerrm <> 'Zugriff verweigert' then
      raise;
    end if;
end;
$$;

reset role;

do $$
begin
  if (
    select count(*)
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename in ('inventory_items', 'inventory_transactions')
  ) <> 2 then
    raise exception 'RLS-Test 14 fehlgeschlagen: Realtime-Publikation ist unvollständig';
  end if;
end;
$$;

select jsonb_build_object(
  'status', 'ok',
  'assertions', 14,
  'rolled_back', true
) as rls_test_result;

rollback;
