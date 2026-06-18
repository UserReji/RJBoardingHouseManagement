# RJ BoardHouse Management System

A mobile-first Next.js 15 application for managing boarding house operations, tenant registrations, billing, and maintenance concerns.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Hardcoded Admin
- **File Storage**: Supabase Storage
- **Styling**: Tailwind CSS v4
- **Email**: Resend.com
- **Deployment**: Vercel (ready)
- **Language**: TypeScript

## Project Structure

```
app/
├── (public pages)
├── login/              # Tenant & Admin login (admin login also sets adminSession cookie)
├── register/           # Tenant registration (multi-step form)
├── admin/              # Admin dashboard & management (server components, service-role)
│   ├── layout.tsx      # Admin navigation & auth guard
│   ├── dashboard/      # Overview, stats, quick actions
│   ├── rooms/          # Room management & details
│   ├── tenants/        # Tenant management & inline approve/reject
│   ├── bills/          # Billing, create, mark-paid, breakdown
│   ├── payments/       # GCash verification queue (auto-flip bill to paid)
│   ├── concerns/       # Concern management with reply thread
│   └── settings/       # System settings (rates, GCash QR)
├── tenant/             # Tenant dashboard & management (client, RLS-bound)
│   ├── layout.tsx      # Tenant navigation & auth guard
│   ├── dashboard/      # Summary, current bill, quick actions
│   ├── bills/          # Bill history & GCash payment
│   ├── payments/       # Payment history
│   ├── concerns/       # Post & reply to concerns
│   └── profile/        # View personal & contract info
├── api/
│   ├── admin/          # Server-side admin actions (require adminSession cookie + service-role)
│   │   ├── login/      # Sets the admin cookie
│   │   ├── logout/
│   │   ├── tenants/    # approve, reject, unassign-room
│   │   ├── bills/      # create, mark-paid, mark-unpaid
│   │   ├── payments/   # verify/reject (auto-flips bill status)
│   │   ├── concerns/   # reply, status
│   │   └── rooms/      # update
│   └── tenant/
│       └── concerns/   # reply
lib/
├── supabase.ts         # Browser Supabase client + admin credential check
├── supabase.server.ts  # Server client (anon + cookies) for tenant pages
├── supabase.admin.ts   # Service-role client for admin server actions
├── session.ts          # Session management & route guards
├── types.ts            # TypeScript domain types
├── validators.ts       # Zod validation schemas
└── components/
    └── SidebarDrawer.tsx  # Shared desktop sidebar + mobile drawer
supabase/
└── migrations/
    └── 0001_initial_schema.sql  # Run once in SQL Editor
```

## Getting Started

### 1. Clone & Install

```bash
cd "Boarding House Management System - Next"
npm install
```

### 2. Set Up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your **Project URL** and **Anon Key**
3. Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required for admin pages (room/tenant/bill/concern management).
# Get it from Supabase Dashboard → Project Settings → API → service_role (secret).
# Never expose this to the browser — it is only used by server components and
# route handlers. The admin layout verifies the adminSession cookie before
# any server-side call, so the key alone is not enough to do damage.
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Create Database Schema

Run the migration in Supabase SQL Editor:

1. Open the file `supabase/migrations/0001_initial_schema.sql` in this repo
2. In Supabase Dashboard → SQL Editor → New query
3. Paste the entire contents and click **Run**

It creates 12 tables, the `public-assets` storage bucket, a trigger that auto-creates a `users` row on signup, and row-level security policies.

```sql
-- Create users table (extends Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'tenant')),
  registration_status TEXT NOT NULL DEFAULT 'pending' CHECK (registration_status IN ('pending', 'approved', 'rejected')),
  full_name TEXT,
  birthday DATE,
  sex TEXT,
  permanent_address TEXT,
  contact_number TEXT,
  emergency_contact_name TEXT,
  emergency_contact_number TEXT,
  valid_id_type TEXT,
  valid_id_number TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number INTEGER NOT NULL UNIQUE CHECK (room_number BETWEEN 1 AND 8),
  price NUMERIC NOT NULL DEFAULT 2500,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create room_photos table
CREATE TABLE room_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create tenant_contracts table
CREATE TABLE tenant_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id),
  term_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent NUMERIC NOT NULL,
  security_deposit_months NUMERIC,
  advance_payment_months NUMERIC,
  contract_status TEXT NOT NULL DEFAULT 'active' CHECK (contract_status IN ('active', 'ended')),
  agreed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create meter_readings table
CREATE TABLE meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id),
  tenant_id UUID NOT NULL REFERENCES users(id),
  reading_value NUMERIC NOT NULL,
  reading_date DATE NOT NULL,
  photo_url TEXT,
  is_initial BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create bills table
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id),
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  room_rent NUMERIC NOT NULL,
  extra_occupant_days INTEGER DEFAULT 0,
  extra_occupant_rate INTEGER DEFAULT 25,
  extra_occupant_charge NUMERIC DEFAULT 0,
  prev_reading_id UUID REFERENCES meter_readings(id),
  curr_reading_id UUID NOT NULL REFERENCES meter_readings(id),
  kwh_consumed NUMERIC NOT NULL,
  kwh_rate NUMERIC NOT NULL,
  electricity_charge NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create bill_photos table
CREATE TABLE bill_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id),
  tenant_id UUID NOT NULL REFERENCES users(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'gcash')),
  gcash_screenshot_url TEXT,
  gcash_reference_note TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (payment_status IN ('pending_verification', 'verified', 'rejected')),
  admin_note TEXT,
  paid_at TIMESTAMP,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create concerns table
CREATE TABLE concerns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create concern_photos table
CREATE TABLE concern_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concern_id UUID NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create concern_replies table
CREATE TABLE concern_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concern_id UUID NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'tenant')),
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default rooms
INSERT INTO rooms (room_number, price) VALUES
(1, 3500),
(2, 2500),
(3, 2500),
(4, 2500),
(5, 2500),
(6, 2500),
(7, 2500),
(8, 2500);
```

### 4. (Optional) Disable email confirmation for testing

In Supabase → **Authentication → Providers → Email** → turn OFF "Confirm email" while you're developing. Tenants can sign up and log in immediately. Turn it back on for production.

### 5. Set Up Resend (Email)

1. Create account at [resend.com](https://resend.com)
2. Generate API key
3. Add to `.env.local`:

```env
RESEND_API_KEY=your-resend-key
```

### 6. Supabase Storage

The migration already creates the `public-assets` bucket (public). It's used for:
- GCash QR (uploaded from Admin → Settings)
- Tenant concern photos
- GCash payment screenshots

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Login Credentials

### Admin

- **Email**: `admin1@boardhouse.local`
- **Password**: `rjboardinghouse042791`

### Tenant (After Registration)

- Use your registered email and password
- Admin must approve your registration first

## Key Features

✅ **Mobile-first design** — Optimized for phones and tablets  
✅ **Tenant registration** — Multi-step form with bio data + rules agreement  
✅ **Admin approval flow** — Pending registrations, approve/reject, contract issuance  
✅ **Contract management** — Tenant agreement & digital signature  
✅ **Meter readings** — Track electricity consumption with photos  
✅ **Billing** — Auto-compute rent + electricity + extra occupants  
✅ **GCash payments** — Upload screenshot, admin verifies, email notifications  
✅ **Concerns** — Tenants post issues, admin replies in thread  
✅ **Admin dashboard** — Occupancy, collections, pending approvals at a glance  
✅ **Role-based access** — Admin vs Tenant pages fully protected  

## Development Workflow

1. **Create a branch**: `git checkout -b feature/feature-name`
2. **Make changes** to `.tsx` pages or `lib/` utilities
3. **Test on mobile** using Chrome DevTools device emulation
4. **Commit** with clear messages: `git commit -m "feat: add bill creation"`
5. **Push & create PR** for review

## Testing Checklist

- [ ] Landing page loads and displays room prices
- [ ] Tenant registration completes with validation
- [ ] Admin login works with hardcoded credentials
- [ ] Admin dashboard shows stats and quick actions
- [ ] Tenant dashboard shows room info and latest bill
- [ ] Can view bills and submit GCash payment
- [ ] Can post concerns with photos
- [ ] Admin can verify GCash payments
- [ ] Mobile navigation works on small screens
- [ ] All forms show validation errors
- [ ] Toast notifications appear for actions

## Deployment to Vercel

```bash
git push origin main
# Vercel auto-deploys on push
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

## Next Steps

1. **Database & Supabase**: Run migrations, enable storage, configure RLS policies
2. **API Routes**: Build handlers for form submissions, file uploads, email triggers
3. **Resend Integration**: Create email templates for registration, bills, payment verification
4. **Detail Pages**: Implement room editing, tenant contract, bill creation
5. **Mobile Polish**: Test all pages on real devices, adjust spacing & font sizes
6. **Deployment**: Configure Vercel, set secrets, test production build

## Support & Issues

For issues or questions:
1. Check the terminal for error messages
2. Review [Next.js docs](https://nextjs.org/docs)
3. Check [Supabase docs](https://supabase.com/docs)
4. Contact the development team

---

Built with ❤️ for RJ BoardHouse Management
"# RJBoardingHouseManagement" 
