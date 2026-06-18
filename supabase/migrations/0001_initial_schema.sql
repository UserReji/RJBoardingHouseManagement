-- ============================================================================
-- RJ BoardHouse — initial schema migration
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- Paste everything below, click "Run". Re-running is safe (uses IF NOT EXISTS
-- where possible and OR REPLACE / DROP+CREATE for policies).
-- ============================================================================

-- Enable required extensions -------------------------------------------------
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. users (auth-linked profiles for tenants; admins are hardcoded so they
--    don't need a row here, but the FKs still allow admin inserts if desired)
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
  created_at               timestamptz not null default now()
);

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

-- Now wire users.room_id → rooms.id (had to defer because rooms didn't exist yet)
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
-- 14. Auto-create a public.users row whenever someone signs up
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role, registration_status, full_name)
  values (
    new.id,
    new.email,
    'tenant',
    'pending',
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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
--     the SQL layer via your admin hardcoded login (which bypasses Supabase
--     auth). Tenants can only see/edit their own rows.
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
create policy "users_insert_self" on public.users for insert with check (auth.uid() = id);
create policy "users_update_own"  on public.users for update using (auth.uid() = id);

-- rooms, room_photos, settings — readable by any signed-in user --------------
drop policy if exists "rooms_read_all"      on public.rooms;
drop policy if exists "room_photos_read_all" on public.room_photos;
drop policy if exists "settings_read_all"   on public.settings;
create policy "rooms_read_all"      on public.rooms      for select using (auth.role() = 'authenticated');
create policy "room_photos_read_all" on public.room_photos for select using (auth.role() = 'authenticated');
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
  for insert with check (auth.uid() = user_id);
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
-- 18. Auto-update updated_at columns
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

-- ============================================================================
-- Done. Verify with:
--   select tablename from pg_tables where schemaname = 'public' order by 1;
-- You should see: bill_photos, concern_photos, concern_replies, concerns,
--   meter_readings, payments, room_photos, rooms, settings, tenant_bills,
--   tenant_contracts, users.
-- ============================================================================