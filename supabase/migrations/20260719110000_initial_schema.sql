-- KüchenDuett: initiales Schema, RLS und atomare Haushalts-/Inventaraktionen.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.normalize_name(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(regexp_replace(trim(value), '\s+', ' ', 'g'));
$$;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index household_members_user_id_idx
  on public.household_members(user_id);

create table public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  invited_by uuid references auth.users(id) on delete set null default auth.uid(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index household_invitations_household_id_idx
  on public.household_invitations(household_id);

create table public.storage_locations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, household_id)
);

create unique index storage_locations_household_name_idx
  on public.storage_locations(household_id, public.normalize_name(name));

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  normalized_name text not null,
  category text not null default 'Sonstiges' check (char_length(trim(category)) between 1 and 60),
  quantity numeric(12, 3) not null check (quantity >= 0),
  unit text not null check (
    unit in ('g', 'kg', 'ml', 'l', 'Stück', 'Packung', 'Dose', 'Glas', 'Bund', 'Portion', 'sonstige')
  ),
  storage_location_id uuid not null,
  expires_on date,
  opened_on date,
  notes text check (notes is null or char_length(notes) <= 1000),
  status text not null default 'active' check (status in ('active', 'consumed')),
  consumed_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_items_location_household_fk
    foreign key (storage_location_id, household_id)
    references public.storage_locations(id, household_id)
    on delete restrict,
  constraint inventory_items_status_quantity_check check (
    (status = 'active' and quantity > 0 and consumed_at is null)
    or (status = 'consumed' and quantity = 0 and consumed_at is not null)
  )
);

create index inventory_items_household_status_idx
  on public.inventory_items(household_id, status);
create index inventory_items_household_expiry_idx
  on public.inventory_items(household_id, expires_on) where status = 'active';
create index inventory_items_household_name_idx
  on public.inventory_items(household_id, normalized_name);

create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  item_id uuid references public.inventory_items(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (
    action in ('create', 'update', 'increase', 'decrease', 'consume', 'delete', 'restore', 'merge')
  ),
  item_name text not null,
  quantity_before numeric(12, 3),
  quantity_after numeric(12, 3),
  unit text,
  before_state jsonb,
  after_state jsonb,
  reversible_until timestamptz,
  reversed_by_transaction_id uuid references public.inventory_transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index inventory_transactions_household_created_idx
  on public.inventory_transactions(household_id, created_at desc);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  category text not null default 'Standard',
  capabilities text[] not null default '{}',
  is_active boolean not null default true,
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index equipment_household_name_idx
  on public.equipment(household_id, public.normalize_name(name));

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade,
  source text not null default 'household' check (source in ('curated', 'household')),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text not null default '',
  servings smallint not null default 2 check (servings between 1 and 24),
  effort_level text not null check (effort_level in ('low', 'medium', 'high')),
  active_minutes smallint not null check (active_minutes >= 0),
  total_minutes smallint not null check (total_minutes >= active_minutes),
  meal_types text[] not null default '{}',
  diet_tags text[] not null default '{}',
  equipment_requirements text[] not null default '{}',
  steps jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array'),
  leftover_tips text not null default '',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (source = 'curated' and household_id is null)
    or (source = 'household' and household_id is not null)
  )
);

create index recipes_household_id_idx on public.recipes(household_id);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  normalized_name text not null,
  quantity numeric(12, 3) check (quantity is null or quantity > 0),
  unit text,
  is_optional boolean not null default false,
  sort_order integer not null default 0
);

create index recipe_ingredients_recipe_id_idx
  on public.recipe_ingredients(recipe_id);
create index recipe_ingredients_name_idx
  on public.recipe_ingredients(normalized_name);

create table public.favorite_recipes (
  household_id uuid not null references public.households(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (household_id, recipe_id)
);

-- Shared trigger helpers ------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger households_touch_updated_at
  before update on public.households
  for each row execute function public.touch_updated_at();
create trigger storage_locations_touch_updated_at
  before update on public.storage_locations
  for each row execute function public.touch_updated_at();
create trigger equipment_touch_updated_at
  before update on public.equipment
  for each row execute function public.touch_updated_at();
create trigger recipes_touch_updated_at
  before update on public.recipes
  for each row execute function public.touch_updated_at();

create or replace function public.normalize_recipe_ingredient()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := trim(new.name);
  new.normalized_name := public.normalize_name(new.name);
  return new;
end;
$$;

create trigger recipe_ingredients_normalize
  before insert or update of name on public.recipe_ingredients
  for each row execute function public.normalize_recipe_ingredient();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'KüchenDuett-Mitglied'
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- RLS helper functions --------------------------------------------------------

create or replace function public.is_household_member(
  target_household_id uuid,
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = target_household_id
      and user_id = target_user_id
  );
$$;

create or replace function public.users_share_household(
  first_user_id uuid,
  second_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members first_membership
    join public.household_members second_membership
      on second_membership.household_id = first_membership.household_id
    where first_membership.user_id = first_user_id
      and second_membership.user_id = second_user_id
  );
$$;

create or replace function public.can_read_recipe(target_recipe_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.recipes
    where id = target_recipe_id
      and (
        household_id is null
        or public.is_household_member(household_id, target_user_id)
      )
  );
$$;

create or replace function public.can_manage_recipe(target_recipe_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.recipes
    where id = target_recipe_id
      and household_id is not null
      and public.is_household_member(household_id, target_user_id)
  );
$$;

-- Household operations -------------------------------------------------------

create or replace function public.create_household(household_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_household_id uuid;
begin
  if current_user_id is null then
    raise exception 'Anmeldung erforderlich' using errcode = '42501';
  end if;

  if char_length(trim(household_name)) not between 1 and 80 then
    raise exception 'Der Haushaltsname muss 1 bis 80 Zeichen lang sein' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.household_members where user_id = current_user_id
  ) then
    raise exception 'Dieses Konto gehört bereits zu einem Haushalt' using errcode = '23505';
  end if;

  insert into public.households (name, created_by)
  values (trim(household_name), current_user_id)
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id)
  values (new_household_id, current_user_id);

  insert into public.storage_locations (household_id, name, sort_order)
  values
    (new_household_id, 'Kühlschrank', 10),
    (new_household_id, 'Tiefkühler', 20),
    (new_household_id, 'Vorratsschrank', 30),
    (new_household_id, 'Küchenschrank', 40),
    (new_household_id, 'Keller', 50),
    (new_household_id, 'Sonstiger Lagerort', 60);

  insert into public.equipment (household_id, name, category, capabilities)
  values
    (new_household_id, 'Herd', 'Standard', array['kochen', 'braten']),
    (new_household_id, 'Backofen', 'Standard', array['backen']),
    (new_household_id, 'Kochtöpfe', 'Standard', array['kochen']),
    (new_household_id, 'Bratpfannen', 'Standard', array['braten']),
    (new_household_id, 'Backbleche', 'Standard', array['backen']),
    (new_household_id, 'Auflaufformen', 'Standard', array['backen']),
    (new_household_id, 'Schüsseln', 'Standard', array['vorbereiten']),
    (new_household_id, 'Messer', 'Standard', array['schneiden']),
    (new_household_id, 'Schneidebretter', 'Standard', array['schneiden']),
    (new_household_id, 'Sieb', 'Standard', array['abgiessen']),
    (new_household_id, 'Küchenwaage', 'Standard', array['wiegen']),
    (new_household_id, 'Messbecher', 'Standard', array['messen']),
    (new_household_id, 'Handmixer', 'Standard', array['mixen']),
    (new_household_id, 'Panasonic SD-YR2550 Brotbackmaschine', 'Spezialgerät', array['brot-backen', 'teig-zubereiten']),
    (new_household_id, 'Kleiner Reiskocher', 'Spezialgerät', array['reis-garen']),
    (new_household_id, 'Tefal Ultracompact Sandwichmaker', 'Spezialgerät', array['sandwich-toast']);

  return new_household_id;
end;
$$;

create or replace function public.create_household_invitation(
  target_household_id uuid,
  invitation_token_hash text,
  invitation_expires_at timestamptz default (now() + interval '1 day')
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_id uuid;
begin
  if auth.uid() is null
    or not public.is_household_member(target_household_id, auth.uid()) then
    raise exception 'Zugriff verweigert' using errcode = '42501';
  end if;

  if (select count(*) from public.household_members where household_id = target_household_id) >= 2 then
    raise exception 'Der Haushalt hat bereits zwei Mitglieder' using errcode = '23514';
  end if;

  if lower(invitation_token_hash) !~ '^[a-f0-9]{64}$' then
    raise exception 'Ungültiger Token-Hash' using errcode = '22023';
  end if;

  if invitation_expires_at <= now() or invitation_expires_at > now() + interval '7 days' then
    raise exception 'Ungültige Einladungsdauer' using errcode = '22023';
  end if;

  delete from public.household_invitations
  where household_id = target_household_id and accepted_at is null;

  insert into public.household_invitations (
    household_id, token_hash, invited_by, expires_at
  ) values (
    target_household_id, lower(invitation_token_hash), auth.uid(), invitation_expires_at
  ) returning id into invitation_id;

  return invitation_id;
end;
$$;

create or replace function public.accept_household_invitation(invitation_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  invitation public.household_invitations%rowtype;
begin
  if current_user_id is null then
    raise exception 'Anmeldung erforderlich' using errcode = '42501';
  end if;

  if exists (select 1 from public.household_members where user_id = current_user_id) then
    raise exception 'Dieses Konto gehört bereits zu einem Haushalt' using errcode = '23505';
  end if;

  select * into invitation
  from public.household_invitations
  where token_hash = lower(invitation_token_hash)
  for update;

  if not found or invitation.accepted_at is not null or invitation.expires_at <= now() then
    raise exception 'Einladung ist ungültig oder abgelaufen' using errcode = '22023';
  end if;

  perform 1 from public.households where id = invitation.household_id for update;

  if (select count(*) from public.household_members where household_id = invitation.household_id) >= 2 then
    raise exception 'Der Haushalt hat bereits zwei Mitglieder' using errcode = '23514';
  end if;

  insert into public.household_members (household_id, user_id)
  values (invitation.household_id, current_user_id);

  update public.household_invitations
  set accepted_at = now()
  where id = invitation.id;

  return invitation.household_id;
end;
$$;

create or replace function public.leave_household(target_household_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
    or not public.is_household_member(target_household_id, auth.uid()) then
    raise exception 'Zugriff verweigert' using errcode = '42501';
  end if;

  if (select count(*) from public.household_members where household_id = target_household_id) <= 1 then
    raise exception 'Das letzte Mitglied muss den Haushalt löschen' using errcode = '23514';
  end if;

  delete from public.household_members
  where household_id = target_household_id and user_id = auth.uid();
end;
$$;

create or replace function public.delete_household(
  target_household_id uuid,
  confirmation_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  stored_name text;
begin
  if auth.uid() is null
    or not public.is_household_member(target_household_id, auth.uid()) then
    raise exception 'Zugriff verweigert' using errcode = '42501';
  end if;

  select name into stored_name from public.households where id = target_household_id for update;
  if confirmation_name is distinct from stored_name then
    raise exception 'Der Bestätigungsname stimmt nicht überein' using errcode = '22023';
  end if;

  perform set_config('app.skip_inventory_history', 'true', true);
  delete from public.households where id = target_household_id;
end;
$$;

-- Inventory logging and operations ------------------------------------------

create or replace function public.prepare_inventory_item()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := trim(new.name);
  new.normalized_name := public.normalize_name(new.name);

  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
    new.updated_by := coalesce(new.updated_by, auth.uid());
    new.created_at := coalesce(new.created_at, now());
    new.updated_at := coalesce(new.updated_at, now());
    new.version := greatest(coalesce(new.version, 1), 1);
  else
    if new.id <> old.id or new.household_id <> old.household_id then
      raise exception 'ID und Haushalt dürfen nicht geändert werden' using errcode = '22023';
    end if;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.updated_by := auth.uid();
    new.updated_at := now();
    new.version := old.version + 1;
  end if;

  return new;
end;
$$;

create trigger inventory_items_prepare
  before insert or update on public.inventory_items
  for each row execute function public.prepare_inventory_item();

create or replace function public.log_inventory_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  transaction_id uuid;
  requested_id text;
  action_name text;
  old_state jsonb;
  new_state jsonb;
  actor_id uuid;
  changed_household_id uuid;
  changed_item_id uuid;
  changed_name text;
  changed_unit text;
  old_quantity numeric(12, 3);
  new_quantity numeric(12, 3);
begin
  if current_setting('app.skip_inventory_history', true) = 'true' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  requested_id := current_setting('app.inventory_transaction_id', true);
  transaction_id := case
    when requested_id is not null and requested_id <> '' then requested_id::uuid
    else gen_random_uuid()
  end;

  if tg_op = 'INSERT' then
    old_state := null;
    new_state := to_jsonb(new);
    actor_id := coalesce(auth.uid(), new.updated_by, new.created_by);
    changed_household_id := new.household_id;
    changed_item_id := new.id;
    changed_name := new.name;
    changed_unit := new.unit;
    old_quantity := null;
    new_quantity := new.quantity;
  elsif tg_op = 'DELETE' then
    old_state := to_jsonb(old);
    new_state := null;
    actor_id := coalesce(auth.uid(), old.updated_by, old.created_by);
    changed_household_id := old.household_id;
    changed_item_id := null;
    changed_name := old.name;
    changed_unit := old.unit;
    old_quantity := old.quantity;
    new_quantity := null;
  else
    old_state := to_jsonb(old);
    new_state := to_jsonb(new);
    actor_id := coalesce(auth.uid(), new.updated_by, old.updated_by, new.created_by, old.created_by);
    changed_household_id := new.household_id;
    changed_item_id := new.id;
    changed_name := new.name;
    changed_unit := new.unit;
    old_quantity := old.quantity;
    new_quantity := new.quantity;
  end if;
  action_name := nullif(current_setting('app.inventory_action', true), '');

  if action_name is null then
    action_name := case
      when tg_op = 'INSERT' then 'create'
      when tg_op = 'DELETE' then 'delete'
      when old.status = 'active' and new.status = 'consumed' then 'consume'
      when new.quantity > old.quantity then 'increase'
      when new.quantity < old.quantity then 'decrease'
      else 'update'
    end;
  end if;

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
    changed_household_id,
    changed_item_id,
    actor_id,
    action_name,
    changed_name,
    old_quantity,
    new_quantity,
    changed_unit,
    old_state,
    new_state,
    case
      when action_name in ('create', 'update', 'increase', 'decrease', 'consume', 'delete')
        then now() + interval '10 seconds'
      else null
    end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger inventory_items_log_change
  after insert or update or delete on public.inventory_items
  for each row execute function public.log_inventory_change();

create or replace function public.change_inventory_quantity(
  target_item_id uuid,
  quantity_delta numeric,
  expected_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.inventory_items%rowtype;
  new_quantity numeric(12, 3);
  action_name text;
  transaction_id uuid := gen_random_uuid();
begin
  if auth.uid() is null then
    raise exception 'Anmeldung erforderlich' using errcode = '42501';
  end if;
  if quantity_delta = 0 then
    raise exception 'Die Mengenänderung darf nicht null sein' using errcode = '22023';
  end if;

  select * into item from public.inventory_items where id = target_item_id for update;
  if not found or not public.is_household_member(item.household_id, auth.uid()) then
    raise exception 'Zugriff verweigert' using errcode = '42501';
  end if;
  if item.version <> expected_version then
    raise exception 'Der Bestand wurde zwischenzeitlich geändert' using errcode = '40001';
  end if;

  new_quantity := item.quantity + quantity_delta;
  if new_quantity < 0 then
    raise exception 'Die Menge darf nicht negativ werden' using errcode = '22003';
  end if;

  action_name := case
    when new_quantity = 0 then 'consume'
    when quantity_delta > 0 then 'increase'
    else 'decrease'
  end;
  perform set_config('app.inventory_transaction_id', transaction_id::text, true);
  perform set_config('app.inventory_action', action_name, true);

  update public.inventory_items
  set
    quantity = new_quantity,
    status = case when new_quantity = 0 then 'consumed' else 'active' end,
    consumed_at = case when new_quantity = 0 then now() else null end
  where id = item.id and version = expected_version;

  if not found then
    raise exception 'Der Bestand wurde zwischenzeitlich geändert' using errcode = '40001';
  end if;

  return jsonb_build_object(
    'item_id', item.id,
    'quantity', new_quantity,
    'version', expected_version + 1,
    'transaction_id', transaction_id,
    'reversible_until', now() + interval '10 seconds'
  );
end;
$$;

create or replace function public.delete_inventory_item(
  target_item_id uuid,
  expected_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.inventory_items%rowtype;
  transaction_id uuid := gen_random_uuid();
begin
  if auth.uid() is null then
    raise exception 'Anmeldung erforderlich' using errcode = '42501';
  end if;

  select * into item from public.inventory_items where id = target_item_id for update;
  if not found or not public.is_household_member(item.household_id, auth.uid()) then
    raise exception 'Zugriff verweigert' using errcode = '42501';
  end if;
  if item.version <> expected_version then
    raise exception 'Der Bestand wurde zwischenzeitlich geändert' using errcode = '40001';
  end if;

  perform set_config('app.inventory_transaction_id', transaction_id::text, true);
  perform set_config('app.inventory_action', 'delete', true);
  delete from public.inventory_items where id = item.id and version = expected_version;

  if not found then
    raise exception 'Der Bestand wurde zwischenzeitlich geändert' using errcode = '40001';
  end if;

  return jsonb_build_object(
    'item_id', item.id,
    'transaction_id', transaction_id,
    'reversible_until', now() + interval '10 seconds'
  );
end;
$$;

create or replace function public.undo_inventory_transaction(target_transaction_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  original public.inventory_transactions%rowtype;
  undo_transaction_id uuid := gen_random_uuid();
  expected_current_version integer;
  affected_rows integer;
begin
  if auth.uid() is null then
    raise exception 'Anmeldung erforderlich' using errcode = '42501';
  end if;

  select * into original
  from public.inventory_transactions
  where id = target_transaction_id
  for update;

  if not found
    or original.actor_user_id is distinct from auth.uid()
    or not public.is_household_member(original.household_id, auth.uid()) then
    raise exception 'Zugriff verweigert' using errcode = '42501';
  end if;
  if original.reversible_until is null or original.reversible_until < now() then
    raise exception 'Das Rückgängig-Zeitfenster ist abgelaufen' using errcode = '22023';
  end if;
  if original.reversed_by_transaction_id is not null then
    raise exception 'Diese Änderung wurde bereits rückgängig gemacht' using errcode = '23505';
  end if;

  perform set_config('app.inventory_transaction_id', undo_transaction_id::text, true);
  perform set_config('app.inventory_action', 'restore', true);

  if original.action = 'create' then
    expected_current_version := (original.after_state ->> 'version')::integer;
    delete from public.inventory_items
    where id = (original.after_state ->> 'id')::uuid
      and version = expected_current_version;
    get diagnostics affected_rows = row_count;
  elsif original.action = 'delete' then
    insert into public.inventory_items (
      id, household_id, name, normalized_name, category, quantity, unit,
      storage_location_id, expires_on, opened_on, notes, status, consumed_at,
      version, created_by, updated_by, created_at, updated_at
    ) values (
      (original.before_state ->> 'id')::uuid,
      (original.before_state ->> 'household_id')::uuid,
      original.before_state ->> 'name',
      original.before_state ->> 'normalized_name',
      original.before_state ->> 'category',
      (original.before_state ->> 'quantity')::numeric,
      original.before_state ->> 'unit',
      (original.before_state ->> 'storage_location_id')::uuid,
      (original.before_state ->> 'expires_on')::date,
      (original.before_state ->> 'opened_on')::date,
      original.before_state ->> 'notes',
      original.before_state ->> 'status',
      (original.before_state ->> 'consumed_at')::timestamptz,
      (original.before_state ->> 'version')::integer + 1,
      (original.before_state ->> 'created_by')::uuid,
      auth.uid(),
      (original.before_state ->> 'created_at')::timestamptz,
      now()
    ) on conflict (id) do nothing;
    get diagnostics affected_rows = row_count;
  else
    expected_current_version := (original.after_state ->> 'version')::integer;
    update public.inventory_items
    set
      name = original.before_state ->> 'name',
      category = original.before_state ->> 'category',
      quantity = (original.before_state ->> 'quantity')::numeric,
      unit = original.before_state ->> 'unit',
      storage_location_id = (original.before_state ->> 'storage_location_id')::uuid,
      expires_on = (original.before_state ->> 'expires_on')::date,
      opened_on = (original.before_state ->> 'opened_on')::date,
      notes = original.before_state ->> 'notes',
      status = original.before_state ->> 'status',
      consumed_at = (original.before_state ->> 'consumed_at')::timestamptz
    where id = (original.before_state ->> 'id')::uuid
      and version = expected_current_version;
    get diagnostics affected_rows = row_count;
  end if;

  if affected_rows <> 1 then
    raise exception 'Der Bestand wurde zwischenzeitlich geändert' using errcode = '40001';
  end if;

  update public.inventory_transactions
  set reversed_by_transaction_id = undo_transaction_id
  where id = original.id;

  return jsonb_build_object(
    'original_transaction_id', original.id,
    'transaction_id', undo_transaction_id,
    'restored', true
  );
end;
$$;

-- Row Level Security ---------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security;
alter table public.storage_locations enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.equipment enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.favorite_recipes enable row level security;

create policy profiles_select_shared
  on public.profiles for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.users_share_household(user_id, (select auth.uid()))
  );
create policy profiles_insert_own
  on public.profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy profiles_update_own
  on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy households_select_member
  on public.households for select to authenticated
  using (public.is_household_member(id, (select auth.uid())));
create policy households_update_member
  on public.households for update to authenticated
  using (public.is_household_member(id, (select auth.uid())))
  with check (public.is_household_member(id, (select auth.uid())));

create policy household_members_select_member
  on public.household_members for select to authenticated
  using (public.is_household_member(household_id, (select auth.uid())));

create policy household_invitations_select_member
  on public.household_invitations for select to authenticated
  using (public.is_household_member(household_id, (select auth.uid())));

create policy storage_locations_select_member
  on public.storage_locations for select to authenticated
  using (public.is_household_member(household_id, (select auth.uid())));
create policy storage_locations_insert_member
  on public.storage_locations for insert to authenticated
  with check (public.is_household_member(household_id, (select auth.uid())));
create policy storage_locations_update_member
  on public.storage_locations for update to authenticated
  using (public.is_household_member(household_id, (select auth.uid())))
  with check (public.is_household_member(household_id, (select auth.uid())));
create policy storage_locations_delete_member
  on public.storage_locations for delete to authenticated
  using (public.is_household_member(household_id, (select auth.uid())));

create policy inventory_items_select_member
  on public.inventory_items for select to authenticated
  using (public.is_household_member(household_id, (select auth.uid())));
create policy inventory_items_insert_member
  on public.inventory_items for insert to authenticated
  with check (public.is_household_member(household_id, (select auth.uid())));
create policy inventory_items_update_member
  on public.inventory_items for update to authenticated
  using (public.is_household_member(household_id, (select auth.uid())))
  with check (public.is_household_member(household_id, (select auth.uid())));

create policy inventory_transactions_select_member
  on public.inventory_transactions for select to authenticated
  using (public.is_household_member(household_id, (select auth.uid())));

create policy equipment_select_member
  on public.equipment for select to authenticated
  using (public.is_household_member(household_id, (select auth.uid())));
create policy equipment_insert_member
  on public.equipment for insert to authenticated
  with check (public.is_household_member(household_id, (select auth.uid())));
create policy equipment_update_member
  on public.equipment for update to authenticated
  using (public.is_household_member(household_id, (select auth.uid())))
  with check (public.is_household_member(household_id, (select auth.uid())));
create policy equipment_delete_member
  on public.equipment for delete to authenticated
  using (public.is_household_member(household_id, (select auth.uid())));

create policy recipes_select_visible
  on public.recipes for select to authenticated
  using (household_id is null or public.is_household_member(household_id, (select auth.uid())));
create policy recipes_insert_member
  on public.recipes for insert to authenticated
  with check (
    household_id is not null
    and source = 'household'
    and public.is_household_member(household_id, (select auth.uid()))
  );
create policy recipes_update_member
  on public.recipes for update to authenticated
  using (
    household_id is not null
    and public.is_household_member(household_id, (select auth.uid()))
  )
  with check (
    household_id is not null
    and source = 'household'
    and public.is_household_member(household_id, (select auth.uid()))
  );
create policy recipes_delete_member
  on public.recipes for delete to authenticated
  using (
    household_id is not null
    and public.is_household_member(household_id, (select auth.uid()))
  );

create policy recipe_ingredients_select_visible
  on public.recipe_ingredients for select to authenticated
  using (public.can_read_recipe(recipe_id, (select auth.uid())));
create policy recipe_ingredients_insert_member
  on public.recipe_ingredients for insert to authenticated
  with check (public.can_manage_recipe(recipe_id, (select auth.uid())));
create policy recipe_ingredients_update_member
  on public.recipe_ingredients for update to authenticated
  using (public.can_manage_recipe(recipe_id, (select auth.uid())))
  with check (public.can_manage_recipe(recipe_id, (select auth.uid())));
create policy recipe_ingredients_delete_member
  on public.recipe_ingredients for delete to authenticated
  using (public.can_manage_recipe(recipe_id, (select auth.uid())));

create policy favorite_recipes_select_member
  on public.favorite_recipes for select to authenticated
  using (public.is_household_member(household_id, (select auth.uid())));
create policy favorite_recipes_insert_member
  on public.favorite_recipes for insert to authenticated
  with check (
    public.is_household_member(household_id, (select auth.uid()))
    and public.can_read_recipe(recipe_id, (select auth.uid()))
  );
create policy favorite_recipes_delete_member
  on public.favorite_recipes for delete to authenticated
  using (public.is_household_member(household_id, (select auth.uid())));

-- Explicit API grants. Anon receives no application-table privileges. --------

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.households from anon, authenticated;
revoke all on table public.household_members from anon, authenticated;
revoke all on table public.household_invitations from anon, authenticated;
revoke all on table public.storage_locations from anon, authenticated;
revoke all on table public.inventory_items from anon, authenticated;
revoke all on table public.inventory_transactions from anon, authenticated;
revoke all on table public.equipment from anon, authenticated;
revoke all on table public.recipes from anon, authenticated;
revoke all on table public.recipe_ingredients from anon, authenticated;
revoke all on table public.favorite_recipes from anon, authenticated;

grant select on table public.profiles to authenticated;
grant insert (user_id, display_name), update (display_name) on table public.profiles to authenticated;
grant select, update (name) on table public.households to authenticated;
grant select on table public.household_members to authenticated;
grant select on table public.household_invitations to authenticated;
grant select, delete on table public.storage_locations to authenticated;
grant insert (household_id, name, sort_order, is_active),
  update (name, sort_order, is_active) on table public.storage_locations to authenticated;
grant select on table public.inventory_items to authenticated;
grant insert (
  household_id, name, category, quantity, unit, storage_location_id,
  expires_on, opened_on, notes
) on table public.inventory_items to authenticated;
grant update (
  name, category, storage_location_id, expires_on, opened_on, notes
) on table public.inventory_items to authenticated;
grant select on table public.inventory_transactions to authenticated;
grant select, delete on table public.equipment to authenticated;
grant insert (household_id, name, category, capabilities, is_active, notes),
  update (name, category, capabilities, is_active, notes) on table public.equipment to authenticated;
grant select, delete on table public.recipes to authenticated;
grant insert (
  household_id, source, title, description, servings, effort_level,
  active_minutes, total_minutes, meal_types, diet_tags,
  equipment_requirements, steps, leftover_tips
), update (
  title, description, servings, effort_level, active_minutes, total_minutes,
  meal_types, diet_tags, equipment_requirements, steps, leftover_tips
) on table public.recipes to authenticated;
grant select, insert, update, delete on table public.recipe_ingredients to authenticated;
grant select, delete on table public.favorite_recipes to authenticated;
grant insert (household_id, recipe_id) on table public.favorite_recipes to authenticated;

revoke all on function public.is_household_member(uuid, uuid) from public;
revoke all on function public.users_share_household(uuid, uuid) from public;
revoke all on function public.can_read_recipe(uuid, uuid) from public;
revoke all on function public.can_manage_recipe(uuid, uuid) from public;
revoke all on function public.create_household(text) from public;
revoke all on function public.create_household_invitation(uuid, text, timestamptz) from public;
revoke all on function public.accept_household_invitation(text) from public;
revoke all on function public.leave_household(uuid) from public;
revoke all on function public.delete_household(uuid, text) from public;
revoke all on function public.change_inventory_quantity(uuid, numeric, integer) from public;
revoke all on function public.delete_inventory_item(uuid, integer) from public;
revoke all on function public.undo_inventory_transaction(uuid) from public;

grant execute on function public.is_household_member(uuid, uuid) to authenticated;
grant execute on function public.users_share_household(uuid, uuid) to authenticated;
grant execute on function public.can_read_recipe(uuid, uuid) to authenticated;
grant execute on function public.can_manage_recipe(uuid, uuid) to authenticated;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.create_household_invitation(uuid, text, timestamptz) to authenticated;
grant execute on function public.accept_household_invitation(text) to authenticated;
grant execute on function public.leave_household(uuid) to authenticated;
grant execute on function public.delete_household(uuid, text) to authenticated;
grant execute on function public.change_inventory_quantity(uuid, numeric, integer) to authenticated;
grant execute on function public.delete_inventory_item(uuid, integer) to authenticated;
grant execute on function public.undo_inventory_transaction(uuid) to authenticated;

revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.log_inventory_change() from public;
