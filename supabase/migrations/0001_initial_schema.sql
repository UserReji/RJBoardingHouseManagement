-- ============================================================================
-- RJ BoardHouse — complete application schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- Paste this entire file into Supabase SQL Editor and click Run.
-- This consolidated schema is safe to re-run when applying schema updates.
-- ============================================================================

-- Enable required extensions -------------------------------------------------
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. users (auth-linked tenant profiles; admin login is server-side)
-- ============================================================================
create table if not exists public.users (
  id                       uuid primary key references auth.users(id) on delete cascade,
  email                    text not null unique,
  role                     text not null check (role in ('admin', 'tenant')),
  registration_status      text not null default 'pending'
                             check (registration_status in ('pending', 'approved', 'rejected')),
  full_name                text not null,
  birthday                 date,
  sex                      text check (sex in ('Male', 'Female', 'Other')),
  permanent_address        text,
  contact_number           text,
  emergency_contact_name   text,
  emergency_contact_number text,
  valid_id_type            text,
  valid_id_number          text,
  room_id                  uuid,                              -- assigned room (set after approval)
  email_confirmed_at       timestamptz,
  account_status           text not null default 'active' check (account_status in ('active', 'archived')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table public.users add column if not exists updated_at timestamptz not null default now();
alter table public.users add column if not exists email_confirmed_at timestamptz;
alter table public.users add column if not exists account_status text not null default 'active' check (account_status in ('active', 'archived'));

-- Sync confirmation status for profiles created by the previous schema version.
update public.users u
set email_confirmed_at = a.email_confirmed_at
from auth.users a
where a.id = u.id;

-- ============================================================================
-- 2. rooms
-- ============================================================================
create table if not exists public.rooms (
  id            uuid primary key default gen_random_uuid(),
  room_number   int  not null unique,
  price         numeric(10,2) not null,                      -- legacy field (kept for back-compat)
  monthly_rent  numeric(10,2) not null,
  status        text not null default 'vacant'
                  check (status in ('vacant', 'occupied')),
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Now wire users.room_id → rooms.id (had to defer because rooms didn't exist yet).
-- Drop first so re-running the migration doesn't fail with "constraint already exists".
alter table public.users
  drop constraint if exists users_room_id_fkey;

alter table public.users
  add constraint users_room_id_fkey
  foreign key (room_id) references public.rooms(id) on delete set null;

-- ============================================================================
-- 3. room_photos (optional, used by RoomPhoto type)
-- ============================================================================
create table if not exists public.room_photos (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.rooms(id) on delete cascade,
  photo_url  text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 4. tenant_contracts (optional but referenced by types.ts)
-- ============================================================================
create table if not exists public.tenant_contracts (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references public.users(id) on delete cascade,
  room_id                  uuid not null references public.rooms(id) on delete restrict,
  term_months              int  not null check (term_months > 0),
  start_date               date not null,
  end_date                 date not null,
  monthly_rent             numeric(10,2) not null,
  security_deposit_months  numeric(4,2) not null default 0,
  advance_payment_months   numeric(4,2) not null default 0,
  contract_status          text not null default 'active'
                             check (contract_status in ('active', 'ended')),
  agreed_at                timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ============================================================================
-- 5. meter_readings
-- ============================================================================
create table if not exists public.meter_readings (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid not null references public.rooms(id) on delete cascade,
  tenant_id      uuid references public.users(id) on delete set null,
  reading_value  numeric(10,2) not null,
  reading_date   date not null,
  photo_url      text,
  is_initial     boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ============================================================================
-- 6. tenant_bills
--   NOTE: queries in the codebase use `user_id`, not `tenant_id`.
-- ============================================================================
create table if not exists public.tenant_bills (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.users(id) on delete cascade,
  room_id                uuid not null references public.rooms(id) on delete restrict,
  billing_period_start   date not null,
  billing_period_end     date not null,
  room_rent              numeric(10,2) not null default 0,
  extra_occupant_days    int  not null default 0,
  extra_occupant_rate    numeric(5,2) not null default 0,
  extra_occupant_charge  numeric(10,2) not null default 0,
  prev_reading_id        uuid references public.meter_readings(id) on delete set null,
  curr_reading_id        uuid references public.meter_readings(id) on delete set null,
  kwh_consumed           numeric(10,2) not null default 0,
  kwh_rate               numeric(10,2) not null default 0,
  electricity_charge     numeric(10,2) not null default 0,
  total_amount           numeric(10,2) not null default 0,
  status                 text not null default 'unpaid'
                           check (status in ('unpaid', 'partially_paid', 'paid')),
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ============================================================================
-- 7. bill_photos
-- ============================================================================
create table if not exists public.bill_photos (
  id         uuid primary key default gen_random_uuid(),
  bill_id    uuid not null references public.tenant_bills(id) on delete cascade,
  photo_url  text not null,
  caption    text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 8. payments
--   NOTE: queries use `user_id`, `method`, `status`, `screenshot_url`.
-- ============================================================================
create table if not exists public.payments (
  id                    uuid primary key default gen_random_uuid(),
  bill_id               uuid not null references public.tenant_bills(id) on delete cascade,
  user_id               uuid not null references public.users(id) on delete cascade,
  amount                numeric(10,2) not null,
  method                text not null check (method in ('cash', 'gcash')),
  screenshot_url        text,
  gcash_reference_note  text,
  status                text not null default 'pending_verification'
                          check (status in ('pending_verification', 'verified', 'rejected')),
  admin_note            text,
  paid_at               timestamptz,
  verified_at           timestamptz,
  created_at            timestamptz not null default now()
);

-- ============================================================================
-- 9. concerns
-- ============================================================================
create table if not exists public.concerns (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  title       text not null,
  body        text not null,
  status      text not null default 'open'
                check (status in ('open', 'in_progress', 'resolved')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================================
-- 10. concern_photos
-- ============================================================================
create table if not exists public.concern_photos (
  id         uuid primary key default gen_random_uuid(),
  concern_id uuid not null references public.concerns(id) on delete cascade,
  photo_url  text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 11. concern_replies
-- ============================================================================
create table if not exists public.concern_replies (
  id          uuid primary key default gen_random_uuid(),
  concern_id  uuid not null references public.concerns(id) on delete cascade,
  sender_role text not null check (sender_role in ('admin', 'tenant')),
  body        text not null,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- 12. settings (single-row app config)
-- ============================================================================
create table if not exists public.settings (
  id                    int  primary key default 1 check (id = 1),
  kwh_rate              numeric(10,2) not null default 2,
  extra_occupant_rate  numeric(5,2)  not null default 25,
  gcash_qr_url          text,
  updated_at            timestamptz not null default now()
);

insert into public.settings (id, kwh_rate, extra_occupant_rate)
values (1, 2, 25)
on conflict (id) do nothing;

-- ============================================================================
-- 13. Seed rooms (matches the landing page: 1 large @ 3500, 7 standard @ 2500)
-- ============================================================================
insert into public.rooms (room_number, price, monthly_rent, status) values
  (1, 3500, 3500, 'vacant'),
  (2, 2500, 2500, 'vacant'),
  (3, 2500, 2500, 'vacant'),
  (4, 2500, 2500, 'vacant'),
  (5, 2500, 2500, 'vacant'),
  (6, 2500, 2500, 'vacant'),
  (7, 2500, 2500, 'vacant'),
  (8, 2500, 2500, 'vacant')
on conflict (room_number) do nothing;

-- ============================================================================
-- 14. Create/sync tenant profiles only after email confirmation
-- Unconfirmed accounts stay in auth.users but are not tenant records visible to admins.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is null then
    update public.users
    set email_confirmed_at = null
    where id = new.id;
    return new;
  end if;

  insert into public.users (
    id, email, role, registration_status, full_name, email_confirmed_at,
    birthday, sex, permanent_address, contact_number,
    emergency_contact_name, emergency_contact_number, valid_id_type, valid_id_number
  )
  values (
    new.id, new.email, 'tenant', 'pending',
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    new.email_confirmed_at,
    nullif(new.raw_user_meta_data->>'birthday', '')::date,
    nullif(new.raw_user_meta_data->>'sex', ''),
    nullif(new.raw_user_meta_data->>'permanent_address', ''),
    nullif(new.raw_user_meta_data->>'contact_number', ''),
    nullif(new.raw_user_meta_data->>'emergency_contact_name', ''),
    nullif(new.raw_user_meta_data->>'emergency_contact_number', ''),
    nullif(new.raw_user_meta_data->>'valid_id_type', ''),
    nullif(new.raw_user_meta_data->>'valid_id_number', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.users.full_name),
    email_confirmed_at = excluded.email_confirmed_at,
    birthday = coalesce(excluded.birthday, public.users.birthday),
    sex = coalesce(excluded.sex, public.users.sex),
    permanent_address = coalesce(excluded.permanent_address, public.users.permanent_address),
    contact_number = coalesce(excluded.contact_number, public.users.contact_number),
    emergency_contact_name = coalesce(excluded.emergency_contact_name, public.users.emergency_contact_name),
    emergency_contact_number = coalesce(excluded.emergency_contact_number, public.users.emergency_contact_number),
    valid_id_type = coalesce(excluded.valid_id_type, public.users.valid_id_type),
    valid_id_number = coalesce(excluded.valid_id_number, public.users.valid_id_number);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function public.handle_new_user();

-- Atomically assign, move, or unassign a tenant while keeping room status in sync.
create or replace function public.admin_set_tenant_room(
  p_tenant_id uuid,
  p_room_id uuid,
  p_approve boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_room_id uuid;
  confirmed_at timestamptz;
  current_account_status text;
begin
  select room_id, email_confirmed_at, account_status
    into previous_room_id, confirmed_at, current_account_status
    from public.users
    where id = p_tenant_id and role = 'tenant'
    for update;
  if not found then
    raise exception 'Tenant profile not found' using errcode = 'P0002';
  end if;
  if confirmed_at is null then
    raise exception 'Tenant email must be confirmed before room assignment' using errcode = '42501';
  end if;
  if current_account_status = 'archived' then
    raise exception 'Restore the tenant account before assigning a room' using errcode = '42501';
  end if;

  if p_room_id is not null and p_room_id is distinct from previous_room_id then
    perform 1 from public.rooms where id = p_room_id for update;
    if not found then
      raise exception 'Room not found' using errcode = 'P0002';
    end if;
    if exists (select 1 from public.users where room_id = p_room_id and id <> p_tenant_id and email_confirmed_at is not null and account_status = 'active') then
      raise exception 'Room is already assigned' using errcode = '23505';
    end if;
  end if;

  update public.users
    set room_id = p_room_id,
        registration_status = case when p_approve then 'approved' else registration_status end
    where id = p_tenant_id;

  if previous_room_id is not null and previous_room_id is distinct from p_room_id then
    update public.tenant_contracts
      set contract_status = 'ended',
          end_date = greatest(start_date, least(end_date, current_date))
      where tenant_id = p_tenant_id
        and room_id = previous_room_id
        and contract_status = 'active';

    update public.rooms
      set status = case
        when exists (select 1 from public.users where room_id = previous_room_id and email_confirmed_at is not null and account_status = 'active') then 'occupied'
        else 'vacant'
      end
      where id = previous_room_id;
  end if;

  if p_room_id is not null then
    update public.rooms set status = 'occupied' where id = p_room_id;
  end if;
end;
$$;

revoke all on function public.admin_set_tenant_room(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_set_tenant_room(uuid, uuid, boolean) to service_role;

-- Create a new active contract for an approved tenant's current room.
create or replace function public.admin_create_tenant_contract(
  p_tenant_id uuid,
  p_term_months integer,
  p_start_date date,
  p_end_date date,
  p_monthly_rent numeric,
  p_security_deposit_months numeric,
  p_advance_payment_months numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_room_id uuid;
  confirmed_at timestamptz;
  account_state text;
  registration_state text;
  contract_id uuid;
begin
  select room_id, email_confirmed_at, account_status, registration_status
    into current_room_id, confirmed_at, account_state, registration_state
    from public.users
    where id = p_tenant_id and role = 'tenant'
    for update;
  if not found then raise exception 'Tenant profile not found' using errcode = 'P0002'; end if;
  if confirmed_at is null then raise exception 'Tenant email must be confirmed first' using errcode = '42501'; end if;
  if current_room_id is null then raise exception 'Assign a room before creating a contract' using errcode = '22023'; end if;
  if account_state = 'archived' then raise exception 'Restore this account before creating a contract' using errcode = '42501'; end if;
  if registration_state <> 'approved' then raise exception 'Approve the tenant before creating a contract' using errcode = '42501'; end if;
  if p_term_months < 1 or p_start_date is null or p_end_date <= p_start_date or p_monthly_rent <= 0
     or p_security_deposit_months < 0 or p_advance_payment_months < 0 then
    raise exception 'Invalid contract details' using errcode = '22023';
  end if;

  update public.tenant_contracts
    set contract_status = 'ended',
        end_date = greatest(start_date, least(end_date, current_date))
    where tenant_id = p_tenant_id and contract_status = 'active';

  insert into public.tenant_contracts (
    tenant_id, room_id, term_months, start_date, end_date, monthly_rent,
    security_deposit_months, advance_payment_months, contract_status
  ) values (
    p_tenant_id, current_room_id, p_term_months, p_start_date, p_end_date, p_monthly_rent,
    p_security_deposit_months, p_advance_payment_months, 'active'
  ) returning id into contract_id;
  return contract_id;
end;
$$;

revoke all on function public.admin_create_tenant_contract(uuid, integer, date, date, numeric, numeric, numeric) from public, anon, authenticated;
grant execute on function public.admin_create_tenant_contract(uuid, integer, date, date, numeric, numeric, numeric) to service_role;

-- Soft-delete tenant accounts so their billing and payment history stays intact.
create or replace function public.admin_archive_tenant(p_tenant_id uuid, p_archived boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_room_id uuid;
  confirmed_at timestamptz;
begin
  select room_id, email_confirmed_at
    into previous_room_id, confirmed_at
    from public.users
    where id = p_tenant_id and role = 'tenant'
    for update;
  if not found then raise exception 'Tenant profile not found' using errcode = 'P0002'; end if;
  if confirmed_at is null then raise exception 'Tenant email must be confirmed first' using errcode = '42501'; end if;

  update public.users
    set account_status = case when p_archived then 'archived' else 'active' end,
        room_id = case when p_archived then null else room_id end
    where id = p_tenant_id;

  if p_archived and previous_room_id is not null then
    update public.tenant_contracts
      set contract_status = 'ended',
          end_date = greatest(start_date, least(end_date, current_date))
      where tenant_id = p_tenant_id and room_id = previous_room_id and contract_status = 'active';
    update public.rooms
      set status = case
        when exists (select 1 from public.users where room_id = previous_room_id and email_confirmed_at is not null and account_status = 'active') then 'occupied'
        else 'vacant'
      end
      where id = previous_room_id;
  end if;
end;
$$;

revoke all on function public.admin_archive_tenant(uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_archive_tenant(uuid, boolean) to service_role;


-- Backfill only confirmed Auth accounts. Existing unconfirmed profiles receive a null
-- email_confirmed_at above and are excluded by the admin tenant queries.
insert into public.users (
  id, email, role, registration_status, full_name, email_confirmed_at,
  birthday, sex, permanent_address, contact_number,
  emergency_contact_name, emergency_contact_number, valid_id_type, valid_id_number
)
select
  a.id, a.email, 'tenant', 'pending',
  coalesce(nullif(a.raw_user_meta_data->>'full_name', ''), split_part(a.email, '@', 1)),
  a.email_confirmed_at,
  nullif(a.raw_user_meta_data->>'birthday', '')::date,
  nullif(a.raw_user_meta_data->>'sex', ''),
  nullif(a.raw_user_meta_data->>'permanent_address', ''),
  nullif(a.raw_user_meta_data->>'contact_number', ''),
  nullif(a.raw_user_meta_data->>'emergency_contact_name', ''),
  nullif(a.raw_user_meta_data->>'emergency_contact_number', ''),
  nullif(a.raw_user_meta_data->>'valid_id_type', ''),
  nullif(a.raw_user_meta_data->>'valid_id_number', '')
from auth.users a
where a.email is not null
  and a.email_confirmed_at is not null
on conflict (id) do nothing;

-- ============================================================================
-- 15. Helpful indexes
-- ============================================================================
create index if not exists idx_users_role_status       on public.users(role, registration_status);
create index if not exists idx_users_room              on public.users(room_id);
create index if not exists idx_bills_user               on public.tenant_bills(user_id);
create index if not exists idx_bills_status             on public.tenant_bills(status);
create index if not exists idx_payments_user            on public.payments(user_id);
create index if not exists idx_payments_bill            on public.payments(bill_id);
create index if not exists idx_payments_status          on public.payments(status);
create index if not exists idx_concerns_user            on public.concerns(user_id);
create index if not exists idx_concerns_status          on public.concerns(status);
create index if not exists idx_concern_replies_concern  on public.concern_replies(concern_id);
create index if not exists idx_meter_readings_room      on public.meter_readings(room_id, reading_date desc);

-- ============================================================================
-- 16. Row Level Security — open inside the app; admin enforcement happens at
--     the server-side admin client (which bypasses RLS). Tenant policies are
--     limited to their own rows and actions.
-- ============================================================================
alter table public.users           enable row level security;
alter table public.rooms           enable row level security;
alter table public.room_photos     enable row level security;
alter table public.tenant_contracts enable row level security;
alter table public.meter_readings  enable row level security;
alter table public.tenant_bills    enable row level security;
alter table public.bill_photos     enable row level security;
alter table public.payments        enable row level security;
alter table public.concerns        enable row level security;
alter table public.concern_photos  enable row level security;
alter table public.concern_replies enable row level security;
alter table public.settings        enable row level security;

-- users ---------------------------------------------------------------------
drop policy if exists "users_select_own"      on public.users;
drop policy if exists "users_insert_self"     on public.users;
drop policy if exists "users_update_own"      on public.users;
create policy "users_select_own"  on public.users for select using (auth.uid() = id);
-- Profile creation runs in the trusted auth trigger. Client users cannot assign
-- themselves a role, approve themselves, or change protected profile fields.

-- rooms, room_photos, settings — readable by any signed-in user --------------
drop policy if exists "rooms_read_all"      on public.rooms;
drop policy if exists "room_photos_read_all" on public.room_photos;
drop policy if exists "settings_read_all"   on public.settings;
-- Public room listings power the landing page; these fields contain no tenant data.
create policy "rooms_read_all"      on public.rooms      for select using (true);
create policy "room_photos_read_all" on public.room_photos for select using (true);
create policy "settings_read_all"   on public.settings   for select using (auth.role() = 'authenticated');

-- contracts, meter_readings, bills, payments, concerns, replies — own rows --
drop policy if exists "contracts_own_rw"   on public.tenant_contracts;
drop policy if exists "readings_own_r"     on public.meter_readings;
drop policy if exists "bills_own_r"        on public.tenant_bills;
drop policy if exists "bill_photos_own_r"  on public.bill_photos;
drop policy if exists "payments_own_r"     on public.payments;
drop policy if exists "payments_own_w"     on public.payments;
drop policy if exists "concerns_own_rw"    on public.concerns;
drop policy if exists "concern_photos_own_rw" on public.concern_photos;
drop policy if exists "concern_replies_own_r" on public.concern_replies;
drop policy if exists "concern_replies_own_w" on public.concern_replies;

create policy "contracts_own_rw" on public.tenant_contracts
  for all using (auth.uid() = tenant_id) with check (auth.uid() = tenant_id);
create policy "readings_own_r" on public.meter_readings
  for select using (auth.uid() = tenant_id);
create policy "bills_own_r" on public.tenant_bills
  for select using (auth.uid() = user_id);
create policy "bill_photos_own_r" on public.bill_photos
  for select using (exists (select 1 from public.tenant_bills b
                            where b.id = bill_photos.bill_id and b.user_id = auth.uid()));
create policy "payments_own_r" on public.payments
  for select using (auth.uid() = user_id);
create policy "payments_own_w" on public.payments
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.tenant_bills b
                where b.id = payments.bill_id and b.user_id = auth.uid())
  );
create policy "concerns_own_rw" on public.concerns
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "concern_photos_own_rw" on public.concern_photos
  for all using (exists (select 1 from public.concerns c
                         where c.id = concern_photos.concern_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.concerns c
                      where c.id = concern_photos.concern_id and c.user_id = auth.uid()));
create policy "concern_replies_own_r" on public.concern_replies
  for select using (exists (select 1 from public.concerns c
                            where c.id = concern_replies.concern_id and c.user_id = auth.uid()));
create policy "concern_replies_own_w" on public.concern_replies
  for insert with check (
    sender_role = 'tenant'
    and exists (select 1 from public.concerns c
                where c.id = concern_replies.concern_id and c.user_id = auth.uid())
  );

-- ============================================================================
-- 17. Storage bucket for QR / concern / bill photos
--     (Settings page uploads here at path "gcash-qr/qr.*", tenants upload
--      "concerns/<userId>/<file>" for their concern photos.)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public_assets_read"   on storage.objects;
drop policy if exists "public_assets_insert" on storage.objects;
drop policy if exists "public_assets_update" on storage.objects;
create policy "public_assets_read"   on storage.objects for select using (bucket_id = 'public-assets');
create policy "public_assets_insert" on storage.objects for insert with check (bucket_id = 'public-assets' and auth.role() = 'authenticated');
create policy "public_assets_update" on storage.objects for update using (bucket_id = 'public-assets' and auth.role() = 'authenticated');

-- ============================================================================
-- 18. Auto-update updated_at columns and utility billing schema
-- ============================================================================
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists set_updated_at_rooms       on public.rooms;
drop trigger if exists set_updated_at_users       on public.users;
drop trigger if exists set_updated_at_contracts   on public.tenant_contracts;
drop trigger if exists set_updated_at_bills       on public.tenant_bills;
drop trigger if exists set_updated_at_concerns    on public.concerns;
drop trigger if exists set_updated_at_settings    on public.settings;

create trigger set_updated_at_rooms     before update on public.rooms
  for each row execute function public.tg_set_updated_at();
create trigger set_updated_at_users     before update on public.users
  for each row execute function public.tg_set_updated_at();
create trigger set_updated_at_contracts before update on public.tenant_contracts
  for each row execute function public.tg_set_updated_at();
create trigger set_updated_at_bills     before update on public.tenant_bills
  for each row execute function public.tg_set_updated_at();
create trigger set_updated_at_concerns  before update on public.concerns
  for each row execute function public.tg_set_updated_at();
create trigger set_updated_at_settings  before update on public.settings
  for each row execute function public.tg_set_updated_at();

-- Monthly utilities billing batches and itemized bill snapshots.
alter table public.rooms add column if not exists occupant_count integer not null default 1 check (occupant_count >= 0);
alter table public.tenant_bills add column if not exists billing_batch_id uuid;
alter table public.tenant_bills add column if not exists water_charge numeric(10,2) not null default 0;
alter table public.tenant_bills add column if not exists water_rate_per_person numeric(10,2) not null default 0;
alter table public.tenant_bills add column if not exists occupant_count integer not null default 1;
alter table public.tenant_bills add column if not exists published_at timestamptz;
alter table public.tenant_bills add column if not exists amount_paid numeric(10,2) not null default 0;

-- Record owner-received cash and update its bill balance in one transaction.
create or replace function public.admin_record_cash_payment(p_bill_id uuid, p_amount numeric)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  tenant_id uuid;
  bill_total numeric;
  paid_so_far numeric;
  remaining numeric;
  payment_id uuid;
  payment_time timestamptz := now();
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero' using errcode = '22023';
  end if;
  select user_id, total_amount, amount_paid
    into tenant_id, bill_total, paid_so_far
    from public.tenant_bills
    where id = p_bill_id
    for update;
  if not found then raise exception 'Bill not found' using errcode = 'P0002'; end if;
  remaining := greatest(0, bill_total - coalesce(paid_so_far, 0));
  if p_amount > remaining then
    raise exception 'Payment exceeds the remaining balance' using errcode = '22023';
  end if;

  insert into public.payments (bill_id, user_id, amount, method, status, paid_at, verified_at)
    values (p_bill_id, tenant_id, p_amount, 'cash', 'verified', payment_time, payment_time)
    returning id into payment_id;
  update public.tenant_bills
    set amount_paid = coalesce(paid_so_far, 0) + p_amount,
        status = case when coalesce(paid_so_far, 0) + p_amount >= bill_total then 'paid' else 'partially_paid' end,
        paid_at = case when coalesce(paid_so_far, 0) + p_amount >= bill_total then payment_time else null end
    where id = p_bill_id;
  return payment_id;
end;
$$;

revoke all on function public.admin_record_cash_payment(uuid, numeric) from public, anon, authenticated;
grant execute on function public.admin_record_cash_payment(uuid, numeric) to service_role;

create table if not exists public.billing_batches (
  id uuid primary key default gen_random_uuid(),
  billing_period_start date not null,
  billing_period_end date not null,
  due_date date,
  status text not null default 'draft' check (status in ('draft', 'published')),
  electricity_total numeric(10,2) not null default 0,
  electricity_invoice_url text,
  total_kwh numeric(10,2) not null default 0,
  water_utility_amount numeric(10,2) not null default 0,
  water_utility_paid_amount numeric(10,2) not null default 0,
  water_paid_at date,
  water_rate_per_person numeric(10,2) not null default 20 check (water_rate_per_person between 20 and 200 and mod(water_rate_per_person, 20) = 0),
  water_invoice_url text,
  notes text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.tenant_bills drop constraint if exists tenant_bills_billing_batch_id_fkey;
alter table public.tenant_bills add constraint tenant_bills_billing_batch_id_fkey foreign key (billing_batch_id) references public.billing_batches(id) on delete set null;

create table if not exists public.bill_line_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.tenant_bills(id) on delete cascade,
  label text not null,
  amount numeric(10,2) not null,
  item_type text not null check (item_type in ('charge', 'credit')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_batch_rooms (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.billing_batches(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete restrict,
  occupant_count integer not null default 1 check (occupant_count >= 0),
  previous_kwh numeric(10,2) not null default 0,
  current_kwh numeric(10,2) not null default 0,
  consumed_kwh numeric(10,2) not null default 0 check (consumed_kwh >= 0),
  meter_photo_url text,
  electricity_charge numeric(10,2) not null default 0,
  water_charge numeric(10,2) not null default 0,
  unique (batch_id, room_id)
);

create index if not exists idx_billing_batches_period on public.billing_batches(billing_period_start desc);
create index if not exists idx_bills_batch on public.tenant_bills(billing_batch_id);
create index if not exists idx_bill_line_items_bill on public.bill_line_items(bill_id, sort_order);
create index if not exists idx_batch_rooms_batch on public.billing_batch_rooms(batch_id);

alter table public.billing_batches enable row level security;
alter table public.billing_batch_rooms enable row level security;
alter table public.bill_line_items enable row level security;

drop policy if exists "bill_line_items_own_read" on public.bill_line_items;
create policy "bill_line_items_own_read" on public.bill_line_items for select to authenticated
  using (exists (select 1 from public.tenant_bills b where b.id = bill_id and b.user_id = auth.uid()));
alter table public.tenant_bills add column if not exists electricity_invoice_url text;
alter table public.tenant_bills add column if not exists meter_photo_url text;
alter table public.tenant_bills add column if not exists credit_balance numeric(10,2) not null default 0;
alter table public.users add column if not exists billing_credit numeric(10,2) not null default 0;
insert into storage.buckets (id, name, public) values ('owner-private', 'owner-private', false) on conflict (id) do nothing;
alter table public.tenant_bills add column if not exists paid_at timestamptz;
alter table public.bill_line_items add column if not exists adjustment_note text;
update public.rooms set occupant_count = 2 where room_number = 1 and occupant_count = 1;

-- ============================================================================
-- Done. Verify with:
--   select tablename from pg_tables where schemaname = 'public' order by 1;
-- You should see billing_batches, billing_batch_rooms, bill_line_items, and
--   the original application tables listed above.
-- ============================================================================
