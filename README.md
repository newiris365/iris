# IRIS 365 — AI-Powered Campus Operating System

IRIS 365 is a production-ready, multi-tenant campus management SaaS platform designed for Indian educational institutions. Built for **SIN Education and Technology Pvt. Ltd. (Jodhpur, Rajasthan)**, it integrates 10 comprehensive campus operational modules under a unified, high-performance architecture.

---

## 🚀 Key Modules
1. **Campus Core**: Rotating QR & Biometric Smart Attendance, automated Digital ID Cards, Timetable auto-scheduler, Fee structures, and Exam Results.
2. **Canteen (Cashless)**: QR orders, Express Pickup notifications, meal pass subscriptions, and a virtual Campus Wallet.
3. **Hostel Warden Desk**: Block-specific room allocations, maintenance complain registry, and warden authorization controls.
4. **Smart Gate Security**: RFID/QR entry loggers, visitor passes, and security incident logs.
5. **Library+**: Stock ledger, atomic book lending, and overdue fine calculators.
6. **Events Hub**: Public registrations, tickets, coordinator tasks, and volunteer listings.
7. **FitZone (Wellness)**: Gym membership plans, equipment maintenance logs, and fitness slot booking.
8. **Transit GPS Tracker**: Live location mapping, stops timelines, and route mapping.
9. **Director Dashboard**: Comprehensive operational statistics, fee recovery trends, and system anomaly flags.
10. **AI Concierge**: Smart helper for academic queries, timetables, and fee receipts.

---

## 🎨 System Architecture

IRIS 365 features a **unified single-root layout** that avoids dependency duplication and workspace hoisting conflicts.

```
/new iris (root)
├── src/
│   ├── app/                    # Next.js 14 Frontend App Router (Obsidian Dark Theme)
│   ├── lib/                    # Client-side API wrappers & Socket.io connections
│   ├── config/                 # Express backend config (Winston logger, Supabase clients)
│   ├── controllers/            # Express controllers (business logic)
│   ├── middleware/             # Express middlewares (Rate limiting, auth fingerprint check)
│   ├── routes/                 # Express REST endpoint routing
│   └── server.ts               # Express Server & Socket.io setup (Port 4000)
├── supabase/
│   ├── migrations/             # SQL Migrations (Tables, Indexes, hard RLS, atomic RPCs)
│   └── seed.sql                # Mock sandbox dataset with preconfigured test credentials
├── supabase_setup.sql          # Unified Setup Script (ready to paste in Supabase SQL editor)
├── package.json                # Single dependency tree controlling both Next.js & Express
└── tsconfig.json               # Shared TypeScript environment
```

---

## ⚙️ Setup & Installation

### 1. Prerequisite Environment Variables
Create a `.env` file at the root directory (`/new iris/.env`). Refer to [.env.example](file:///c:/Users/khushal/Desktop/new%20iris/.env.example) for structure:

```env
PORT=4000
NODE_ENV=development
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-secret-key
JWT_SECRET=your-jwt-secret-min-32-chars

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-public-key
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

> [!IMPORTANT]
> **Why the Service Role Key is required**: The Express backend uses the `SUPABASE_SERVICE_ROLE_KEY` to initialize an administrative Supabase client. This client is used to securely synchronize users, update system-wide balances, and check statuses by bypassing Row Level Security (RLS) policies on specific endpoints. Do **not** use the public `anon` key for `SUPABASE_SERVICE_ROLE_KEY` in production.

---

### 2. Database Initialization (Supabase Cloud)

We provide a consolidated SQL setup script to initialize your database structure in a single click:

1. Open **[supabase_setup.sql](file:///c:/Users/khushal/Desktop/new%20iris/supabase_setup.sql)** in your editor.
2. Select all (`Ctrl + A`) and copy the contents.
3. Log in to your [Supabase Console](https://supabase.com/dashboard) and navigate to the **SQL Editor** tab of your project.
4. Click **New Query**, paste the code, and click **Run**.

This script automates:
- Building **45 relation tables** and optimized search indexing.
- Creating **atomic database RPCs** (stored procedures) that lock rows during writes to prevent race conditions (e.g., library checkouts, gym reservations, and hostel room booking concurrency).
- Implementing **hardened multi-tenant Row Level Security (RLS)**.
- Seeding mock institution data, courses, timetables, active routes, and users.

---

### 3. Launching the Project Locally

To install dependencies and boot both the Next.js frontend (Port 3000) and Express server (Port 4000) concurrently:

```bash
# 1. Install dependencies
npm install

# 2. Run local development servers
npm run dev
```

---

## 🔒 Advanced Security Implementations

### 1. Stateless Session-Hijacking Protection (Device Fingerprinting)
During login, the Express auth system generates a SHA-256 device fingerprint signature binding:
- The client's **User-Agent** header
- The client's **IP Address (subnet segment)** to avoid logout drops during mobile network carrier switches.

This fingerprint is signed directly inside the JWT payload. On every request, the authorization middleware ([auth.ts](file:///c:/Users/khushal/Desktop/new%20iris/src/middleware/auth.ts)) recalculates the current client's device fingerprint. If it differs from the claim (e.g., token was stolen and replay-attacked on another machine), the session is invalidated immediately (`403 Forbidden`).

### 2. Database Race-Condition Protections (PL/pgSQL RPCs)
High-concurrency updates (such as book checkouts, gym slot bookings, and room allocations) are wrapped inside custom SQL stored procedures with transaction safeguards (`FOR UPDATE` row locks).
If three students try to reserve the last remaining gym slot at the same time:
- The procedure [book_gym_slot_atomic](file:///c:/Users/khushal/Desktop/new%20iris/supabase_setup.sql#L947) updates the capacity check and increments booking atomically.
- Only the first transaction succeeds; the other two fail gracefully on database constraint triggers, avoiding double-allocations.

### 3. Role-Based RLS Hardening
Access parameters are restricted at the database level:
- **Warden Scope Policy**: Wardens can only fetch room details, assign occupants, or view complaints within the blocks they explicitly govern (`auth.uid() = hb.warden_id`).
- **Student Scope Policy**: Students are isolated to reading their own profiles, records, classes, and tickets.
- **Security Scope Policy**: Only users logged in under the `Security` role claim can write entries to gate check-in logs.

---

## 🛠️ Build Commands

Verify compiler status using:

```bash
# Build the Express TypeScript server
npm run build:backend

# Build the Next.js production bundle
npm run build:frontend

# Complete full-stack compiler validation
npm run build
```
