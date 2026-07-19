-- AP4: atomic inventory creation, editing, merging and realtime publication.

create or replace function public.create_inventory_item(
  target_household_id uuid,
  item_name text,
  item_category text,
  item_quantity numeric,
  item_unit text,
  target_storage_location_id uuid,
  item_expires_on date default null,
  item_opened_on date default null,
  item_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_item public.inventory_items%rowtype;
  transaction_id uuid := gen_random_uuid();
begin
  if auth.uid() is null
    or not public.is_household_member(target_household_id, auth.uid()) then
    raise exception 'Zugriff verweigert' using errcode = '42501';
  end if;

  if item_quantity <= 0 then
    raise exception 'Die Menge muss grösser als null sein' using errcode = '22023';
  end if;

  perform set_config('app.inventory_transaction_id', transaction_id::text, true);
  perform set_config('app.inventory_action', 'create', true);

  insert into public.inventory_items (
    household_id,
    name,
    category,
    quantity,
    unit,
    storage_location_id,
    expires_on,
    opened_on,
    notes
  ) values (
    target_household_id,
    trim(item_name),
    trim(item_category),
    item_quantity,
    item_unit,
    target_storage_location_id,
    item_expires_on,
    item_opened_on,
    nullif(trim(item_notes), '')
  )
  returning * into created_item;

  return jsonb_build_object(
    'item_id', created_item.id,
    'quantity', created_item.quantity,
    'version', created_item.version,
    'transaction_id', transaction_id,
    'reversible_until', now() + interval '10 seconds'
  );
end;
$$;

create or replace function public.update_inventory_item(
  target_item_id uuid,
  expected_version integer,
  item_name text,
  item_category text,
  item_quantity numeric,
  item_unit text,
  target_storage_location_id uuid,
  item_expires_on date default null,
  item_opened_on date default null,
  item_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.inventory_items%rowtype;
  updated_item public.inventory_items%rowtype;
  transaction_id uuid := gen_random_uuid();
begin
  if auth.uid() is null then
    raise exception 'Anmeldung erforderlich' using errcode = '42501';
  end if;
  if item_quantity <= 0 then
    raise exception 'Die Menge muss grösser als null sein' using errcode = '22023';
  end if;

  select * into item
  from public.inventory_items
  where id = target_item_id
  for update;

  if not found or not public.is_household_member(item.household_id, auth.uid()) then
    raise exception 'Zugriff verweigert' using errcode = '42501';
  end if;
  if item.version <> expected_version then
    raise exception 'Der Bestand wurde zwischenzeitlich geändert' using errcode = '40001';
  end if;

  perform set_config('app.inventory_transaction_id', transaction_id::text, true);
  perform set_config('app.inventory_action', 'update', true);

  update public.inventory_items
  set
    name = trim(item_name),
    category = trim(item_category),
    quantity = item_quantity,
    unit = item_unit,
    storage_location_id = target_storage_location_id,
    expires_on = item_expires_on,
    opened_on = item_opened_on,
    notes = nullif(trim(item_notes), ''),
    status = 'active',
    consumed_at = null
  where id = item.id and version = expected_version
  returning * into updated_item;

  if not found then
    raise exception 'Der Bestand wurde zwischenzeitlich geändert' using errcode = '40001';
  end if;

  return jsonb_build_object(
    'item_id', updated_item.id,
    'quantity', updated_item.quantity,
    'version', updated_item.version,
    'transaction_id', transaction_id,
    'reversible_until', now() + interval '10 seconds'
  );
end;
$$;

create or replace function public.merge_inventory_items(
  source_item_id uuid,
  source_expected_version integer,
  target_item_id uuid,
  target_expected_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_item public.inventory_items%rowtype;
  target_item public.inventory_items%rowtype;
  merged_item public.inventory_items%rowtype;
  transaction_id uuid := gen_random_uuid();
begin
  if auth.uid() is null then
    raise exception 'Anmeldung erforderlich' using errcode = '42501';
  end if;
  if source_item_id = target_item_id then
    raise exception 'Quelle und Ziel müssen verschieden sein' using errcode = '22023';
  end if;

  -- A stable locking order prevents two opposite merge requests from deadlocking.
  perform 1
  from public.inventory_items
  where id in (source_item_id, target_item_id)
  order by id
  for update;

  select * into source_item from public.inventory_items where id = source_item_id;
  select * into target_item from public.inventory_items where id = target_item_id;

  if source_item.id is null
    or target_item.id is null
    or source_item.household_id <> target_item.household_id
    or not public.is_household_member(source_item.household_id, auth.uid()) then
    raise exception 'Zugriff verweigert' using errcode = '42501';
  end if;
  if source_item.version <> source_expected_version
    or target_item.version <> target_expected_version then
    raise exception 'Der Bestand wurde zwischenzeitlich geändert' using errcode = '40001';
  end if;
  if source_item.status <> 'active' or target_item.status <> 'active' then
    raise exception 'Nur aktive Bestände können zusammengeführt werden' using errcode = '22023';
  end if;
  if source_item.normalized_name <> target_item.normalized_name
    or source_item.unit <> target_item.unit then
    raise exception 'Nur gleiche Lebensmittel mit gleicher Einheit können zusammengeführt werden'
      using errcode = '22023';
  end if;

  perform set_config('app.skip_inventory_history', 'true', true);

  update public.inventory_items
  set quantity = target_item.quantity + source_item.quantity
  where id = target_item.id and version = target_expected_version
  returning * into merged_item;

  if not found then
    raise exception 'Der Bestand wurde zwischenzeitlich geändert' using errcode = '40001';
  end if;

  delete from public.inventory_items
  where id = source_item.id and version = source_expected_version;

  if not found then
    raise exception 'Der Bestand wurde zwischenzeitlich geändert' using errcode = '40001';
  end if;

  perform set_config('app.skip_inventory_history', 'false', true);

  insert into public.inventory_transactions (
    id,
    household_id,
    item_id,
    actor_user_id,
    action,
    item_name,
    quantity_before,
    quantity_after,
    unit,
    before_state,
    after_state,
    reversible_until
  ) values (
    transaction_id,
    merged_item.household_id,
    merged_item.id,
    auth.uid(),
    'merge',
    merged_item.name,
    target_item.quantity,
    merged_item.quantity,
    merged_item.unit,
    jsonb_build_object('source', to_jsonb(source_item), 'target', to_jsonb(target_item)),
    to_jsonb(merged_item),
    null
  );

  return jsonb_build_object(
    'item_id', merged_item.id,
    'quantity', merged_item.quantity,
    'version', merged_item.version,
    'transaction_id', transaction_id,
    'reversible_until', null
  );
end;
$$;

revoke all on function public.create_inventory_item(
  uuid, text, text, numeric, text, uuid, date, date, text
) from public;
revoke all on function public.update_inventory_item(
  uuid, integer, text, text, numeric, text, uuid, date, date, text
) from public;
revoke all on function public.merge_inventory_items(
  uuid, integer, uuid, integer
) from public;

grant execute on function public.create_inventory_item(
  uuid, text, text, numeric, text, uuid, date, date, text
) to authenticated;
grant execute on function public.update_inventory_item(
  uuid, integer, text, text, numeric, text, uuid, date, date, text
) to authenticated;
grant execute on function public.merge_inventory_items(
  uuid, integer, uuid, integer
) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'inventory_items'
  ) then
    alter publication supabase_realtime add table public.inventory_items;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'inventory_transactions'
  ) then
    alter publication supabase_realtime add table public.inventory_transactions;
  end if;
end;
$$;
