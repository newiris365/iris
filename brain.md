# IRIS 365 — Project Brain

> A single reference document for anyone (human or AI agent) picking up work on IRIS 365. Written from a fresh read of the codebase at `newiris365/iris` (main branch, as of July 2026). This is a working-memory doc, not marketing copy — it names real gaps and risks alongside what exists.

---

## 1. What This Project Is

**IRIS 365** is an AI-powered, multi-tenant **Campus Operating System** for Indian higher-education institutions — colleges affiliated with bodies like RTU, AKTU, and MJPRU, mostly tier-2/tier-3 in scope. It is built and owned by **SIN Education and Technology Pvt. Ltd.**, based in Jodhpur, Rajasthan.

It is not a single app — it's a suite of ~20 operational modules (attendance, fees, hostel, canteen, library, transit, gate security, placements, admissions, HR, OBE/NAAC accreditation, AI concierge, etc.) unified under one auth system, one multi-tenant database, and 25 distinct role-based portals (see §5 for the full list).

Current maturity: **v0.9 — feature-complete prototype**, actively being hardened toward v1.0 production readiness. It runs on sandbox/mock auth bypass accounts today; real Supabase Auth, real Razorpay payments, and real-device GPS are mid-migration.

### Recent Hardening Updates (July 2026)
- **Authentication & OAuth**: Patched the PKCE verifier cookie mismatch in Google OAuth flow by implementing direct fetch exchange.
- **Hostel Module**: Corrected the allotment certificate download link trigger.
- **AI Concierge**: Added dynamic role-scoped mock responses for offline/key-less modes and sanitized message history structures.
- **Transit & SOS**: Fixed server compilation syntax errors on getMySubscription, resolved trailing query parenthesis errors, and restricted the parent SOS trigger portal and links strictly to the `'Parent'` role.
- **SuperAdmin & Settings**: Synchronized PATCH updates for `type` and `institute_type` fields in the institutions table.
- **HOD Portal & Student Counts**: Added HOD permissions to timetable auto-generation, added `/faculty/students` filtering to return the department-scoped 12 students list, and granted HOD permissions on the `/employees` endpoint to filter and return the department's 8 teachers list.
- **Admissions Cycle Logs**: Refactored cycle listing to fetch directly from the database by slug.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Backend | Express.js (separate process from Next.js), TypeScript |
| Realtime | Socket.io (server + client), multiple namespaces |
| Database | Supabase (PostgreSQL) with Row Level Security (RLS) + PL/pgSQL RPCs |
| Mobile | React Native + Expo SDK 51, Expo Router, NativeWind, TypeScript |
| Payments | Razorpay |
| Charts/Maps | Recharts, Leaflet / React-Leaflet |
| Notifications | Firebase Admin (FCM), WhatsApp Business API, node-cron for scheduled jobs |
| PDF | pdfkit |
| Auth | JWT (`jsonwebtoken`) with device-fingerprint binding; Supabase Auth migration in progress |
| Hosting | Netlify (frontend + Netlify Functions), backend deployable separately (e.g. Render) |
| Testing | Jest + ts-jest |

**Design system**: dark glassmorphism. Background `#0F0A1E` / `#0D0A1A`, card `#1A1035`, primary accent `#6C2BD9` (secondary accent `#8B5CF6`, text tint `#C4B5FD`), font **Inter** throughout.

---

## 3. Repository Layout

```
src/
├── app/                # Next.js App Router — one folder per portal (see §5)
│   ├── api/             # Next.js API routes (some use service-role Supabase client directly — see risks)
│   └── globals.css
├── components/          # Shared React components (incl. Skeleton loaders)
├── lib/                 # Frontend utilities: api.ts, socket.ts, auth-helpers.ts,
│                         # auth-storage.ts, charts.tsx (dynamic Recharts wrapper),
│                         # exportUtils.ts, razorpay.ts, roleLabels.ts, supabase.ts
├── config/               # Server config: supabase.ts, logger.ts (winston), cron.ts
├── controllers/          # Express route handlers — business logic (see §6 for sizes)
├── routes/                # Express route *definitions* (thin, map to controllers)
├── middleware/           # auth.ts (JWT verify), permissions.ts (RBAC), rateLimit.ts
├── services/              # aiConciergeService.ts, aiInsights.ts, attendanceEngine/,
│                          # fcm.ts, feeReminderScheduler.ts, gateHardware.ts,
│                          # pdfGenerator.ts, whatsapp.ts
├── sockets/               # transitSocket.ts (modular live-GPS handler)
└── server.ts              # Express + Socket.io entry point (377 lines)

supabase/
├── migrations/            # 57 timestamped SQL migration files (see §7)
└── seed.sql               # ~15 seed users across 10 roles

netlify/functions/         # Netlify serverless functions
scripts/                   # Node/PowerShell/Python ops scripts (diagnostics, seeding, report gen)
scratch/                   # Ad-hoc debug scripts — not part of the shipped app
tests/                     # Jest test suite (sprint4/5/6, hardening, middleware, server)
mobile_screens_spec.md     # 1916-line screen-by-screen spec for the React Native app
IRIS365_Implementation_Plan.md     # 940-line detailed build plan
IRIS365_Improvement_Roadmap.md     # 318-line phased hardening roadmap (v1.0 → v2.0)
portal_testing_report.md   # Manual QA notes per portal
supabase_setup.sql / supabase_setup_min.sql   # Full-schema bootstrap SQL (large, ~1MB) — run in Supabase SQL Editor
CHANGELOG.md, CONTRIBUTING.md
"iris bacup"/               # A stray backup folder (misspelled "backup") checked into
                             # the repo root — src-backup-30june and supabase-backup-30june.
                             # Not part of the live app; candidate for removal/.gitignore.
```

**Two servers, one repo, one `npm run dev`**: `concurrently` boots Next.js (port 3000) and the Express API (port 4000) side by side. Next.js proxies `/api/v1/*` to Express via a rewrite in `next.config.mjs` (destination driven by `NEXT_PUBLIC_API_URL`).

---

## 4. Request Lifecycle (how a request actually flows)

```
Browser/Mobile
   → Next.js (Netlify) — proxies /api/v1/* to Express
     → Express: Auth middleware verifies JWT, decodes { user_id, role, institution_id }
       → Fingerprint check: SHA-256(User-Agent + IP/24) compared against JWT claim
         → mismatch → 403
         → match → RBAC check against module_permissions table
           → Controller executes business logic
             → Supabase query/upsert (service role OR anon+RLS depending on route)
               → RLS policy evaluated via get_auth_institution_id() / get_auth_user_role()
                 → Complex/atomic ops go through PL/pgSQL RPCs with FOR UPDATE row locks
               → response bubbles back up → JSON to client
```

**Why the row locking matters**: concurrency-sensitive operations — library book borrow, gym slot booking, hostel room allocation — run through atomic PL/pgSQL procedures (e.g. `book_gym_slot_atomic`) that take an exclusive row lock, check capacity, increment, and release — so two simultaneous requests for the last slot can't both succeed.

---

## 5. Portals (25 role-based portals, all under `src/app/`)

Each portal folder below has its own `layout.tsx` rendering a `PortalShell` with role-specific sidebar navigation.

| # | Role(s) | Route | Core job |
|---|---|---|---|
| 1 | SuperAdmin & Admin | `/admin` | Global config, user directory, feature toggles, analytics CRM |
| 2 | Student | `/student` | ID card, attendance, timetable, fees, gym slots |
| 3 | Teacher / Faculty | `/teacher`, `/faculty` | Attendance marking, schedules, OBE attainment |
| 4 | Parent | `/parent` | Child attendance, term reports, PTM scheduling, messages |
| 5 | Director | `/director` | P&L reports, campus goals, NAAC/NIRF indicators, health scores |
| 6 | Hostel Warden | `/warden` | Room allocation, curfew rollcall, complaints, visitors |
| 7 | Librarian | `/librarian` | Book issue/return, stock index, fines |
| 8 | Canteen Vendor | `/vendor/canteen` | Inventory, live order queue, menu planner, wallet metrics |
| 9 | Company Recruiter | `/company` | Placement drives, interviewer pools, shortlisting |
| 10 | Gate Security | `/gate`, `/security` | RFID/QR entry, visitor passes, blacklist scanning |
| 11 | Applicant | `/applicant` | Admission status, online application, fee gateway, uploads |
| 12 | Driver | `/driver` | Live GPS trip broadcast (bus tracking) |
| 13 | HOD | `/hod` | Department overview, team leaves, appraisal reviews |
| 14 | Principal | `/principal` | Appraisal finalization, increment approval, school-wide oversight |
| 15 | Vice Principal | `/vp` | Operational dashboard, faculty appraisals, academic compliance |
| 16 | TPO | `/tpo` | Training & Placement cell — drives, student placements |
| 17 | IQAC Coordinator | `/iqac` | NAAC/NIRF accreditation data, criteria mapping |
| 18 | Admissions Officer | `/officer` | Admission applications, merit lists, fee verification |
| 19 | HR Staff (self-service) | `/hr/my` | Leave apply, payslips, attendance, self-appraisal, documents, TDS |
| 20 | HR HOD (team mgmt) | `/hr/hod` | Team overview, leave approvals, appraisal reviews |
| 21 | AI Concierge | `/ai` | AI chatbot, smart search, nudge management |
| 22 | Hostel | `/hostel` | Hostel-specific operations (blocks, rooms, complaints) |
| 23 | Library | `/library` | Library-specific operations (books, issues, fines) |
| 24 | Transit | `/transit` | Live bus GPS tracking, route management |
| 25 | Transit (driver view) | `/transit` | Driver trip broadcast (shared with `/driver`) |

Also present: `src/app/auth`, `login`, `verify`, `profile`, `dashboard`, `menu-board`, `order`, `gallery`, `mobile` (mobile-web variant) — supporting/shared surfaces rather than distinct role portals.

**Note on naming**: Some portals share routes (e.g. `/teacher` and `/faculty` serve overlapping roles; `/gate` and `/security` are two entry points to the same security portal). The count of 25 reflects distinct `layout.tsx` portal shells, not unique URL prefixes.

---

## 6. Modules & Where the Logic Lives

Each module = a route group (Express) + controller + Supabase tables + one or more portal UIs. Controller line counts below are a rough proxy for module complexity/maturity — the biggest files are where most of the real business logic (and most of the risk) concentrates.

| Module | Route prefix | Controller | ~LOC | Key tables |
|---|---|---|---|---|
| Core (students, attendance, timetable, fees, exams, notices, ID cards) | `/api/v1/core` | `campusCore.ts` | **6,944** | `users`, `students`, `attendance*`, `timetables`, `fee_*`, `exams`, `exam_results`, `notices`, `idcard_templates` |
| Hostel | `/api/v1/hostel` | `hostel.ts` | 2,594 | `hostel_blocks`, `hostel_rooms`, `hostel_complaints`, `hostel_visitors` |
| Gate / Security | `/api/v1/gate` | `gate.ts` | 2,300 | `gate_entries`, `gate_visitors`, `gate_blacklist` |
| Events | `/api/v1/events` | `events.ts` | 2,223 | `events`, `event_registrations` |
| Library | `/api/v1/lib-events` | `library.ts`, `libraryEvents.ts` | 2,125 + 289 | `library_books`, `library_issues`, `library_fines` |
| AI Concierge | `/api/v1/ai` | `aiConcierge.ts`, `aiConfig.ts` | 2,087 + 117 | `ai_conversations`, `ai_query_logs` |
| Transit (live bus GPS) | `/api/v1/transit` | `transit.ts` | 2,032 | `transit_routes`, `transit_buses`, `transit_stops` |
| Director Console | `/api/v1/director` | `director.ts` | 1,880 | `student_health_scores`, `student_journeys` |
| FitZone Gym | `/api/v1/fitzone` | `fitzone.ts` | 1,792 | `gym_equipment`, `gym_trainers`, `gym_bookings` |
| Canteen | `/api/v1/canteen` | `canteen.ts` | 1,731 | `canteen_menu`, `canteen_orders`, `canteen_wallet` |
| Admissions | `/api/v1/admissions` | `admissions.ts` | 1,524 | `admissions_applications`, `admissions_merit_lists` |
| Placements | `/api/v1/placements` | `placements.ts` | 1,206 | `placement_drives`, `placement_applications` |
| HR Management | `/api/v1/hr` | `hr.ts` | 968 | `hr_departments`, `hr_payroll`, `hr_leaves` |
| OBE Maps | `/api/v1/obe` | `obe.ts` | 965 | `obe_program_outcomes`, `obe_course_outcomes` |
| Auth | `/api/v1/auth` | `auth.ts` | 424 | — |
| User Management | (part of core/admin) | `userManagement.ts` | 331 | `users` |
| Parent | `/api/v1/parent` | `parent.ts` | 310 | (spans core + hostel + fee tables) |
| Hostel Gate (crossover) | — | `hostelGate.ts` | 307 | — |
| WhatsApp Config | — | `whatsappConfig.ts` | 153 | `notice_reads` delivery channel config |
| Grievances | (verify prefix in routes/grievances.ts) | `grievances.ts` | 112 | — |
| AI Config | — | `aiConfig.ts` | 117 | — |
| Notifications | — | `notifications.ts` | 45 | `device_tokens` |
| NAAC Scorecard | `/api/v1/naac` | route-only (no dedicated controller file found — verify `routes/naac.ts`) | — | `naac_criteria`, `naac_evidence` |
| Permissions | `/api/v1/permissions` | route-only | — | `institution_features`, `module_permissions` |

**Note on `campusCore.ts`**: at ~6,900 lines it is by far the largest and most load-bearing file in the backend — it owns students, attendance (QR/biometric/manual + rotating tokens + geofence), timetable, fees/Razorpay, exams, notices, and ID cards all in one controller. Any refactor effort should treat this file as the highest-priority split candidate (e.g. into `attendanceController.ts`, `feesController.ts`, `examsController.ts`, etc.) before it grows further.

**Socket.io namespaces** (defined in `server.ts`): `/transit` (live driver GPS, via `src/sockets/transitSocket.ts`), `/notifications`, `/gate`, `/canteen`, `/director`, `/events-live`. All Socket.io connections require a valid JWT in the handshake (`socket.handshake.auth.token`), verified against the same `JWT_SECRET` as HTTP.

---

## 7. Database

- **57 migration files** under `supabase/migrations/`, timestamp-prefixed, spanning from the original schema through incremental fixes: faculty module, admin gap fixes, warden/security/driver/vendor-canteen module fixes, director KPIs, WhatsApp API config, permission audit log, sprint4/5/6 schema additions, live bus tracking, device tokens, subscription period, AI API keys, institute type, parent messages & PTM (most recent, 2026-07-01).
- Two big bootstrap files also exist at repo root: `supabase_setup.sql` (~1.1MB) and `supabase_setup_min.sql` (~1MB) — full-schema dumps meant to be pasted into the Supabase SQL Editor for a fresh setup, as an alternative to replaying all 57 migrations in order.
- **Multi-tenancy** is enforced via RLS using two helper functions read from `auth.jwt()`: `get_auth_institution_id()` and `get_auth_user_role()`.
- **Service role bypasses RLS.** This is intentional for cron jobs and admin seeding scripts, but per the roadmap it is *also* currently used in some user-facing `src/app/api/` Next.js routes — a known, tracked security gap (see §9).
- `supabase/seed.sql`: ~15 seed users across 10 roles for local/dev environments. Notable absences: no `HR Admin`, `Company HR`, `TPO`, `IQAC Coordinator`, `Admissions Officer`, `Director`, `Principal`, `HOD`, or `Vice Principal` seed users — these roles exist in `ROLE_CASING_MAP` and backend routes but lack dev seed data.
- A one-off fix script (`fix_missing_institution_columns.sql`) lives at repo root — sign of at least one manual hotfix applied outside the normal migration sequence; worth folding into a proper migration if not already done.

---

## 8. Auth & Security Model (current state, not aspirational)

1. **JWT with device fingerprinting**: tokens carry a SHA-256 hash of `User-Agent + IP/24` subnet, checked against the request. Explicitly documented as defense-in-depth, *not* a substitute for short-lived tokens + refresh rotation.
2. **Server startup hard-fails** if `JWT_SECRET` is missing or under 32 characters (`CRITICAL SECURITY VIOLATION` thrown in `server.ts`) — good practice, keep this.
3. **Sandbox auth bypass is live in production code today.** Test accounts (all password `password123`) work even when the backend is unreachable — e.g. `siddharth@sin.education` (SuperAdmin), `khushal@gmail.com` (Student, mock sandbox), `rajesh.driver@siet.edu.in` (Driver), etc. This is intentional for demos but is explicitly flagged in the roadmap as something to strip out for v1.0 (`src/app/login/page.tsx:230-271`).
4. **RBAC**: `module_permissions` table drives `can_read` / `can_write` / `can_delete` per role per module, enforced by `src/middleware/permissions.ts`.
5. **Known, tracked issues** (from the roadmap, don't re-discover these — go read `IRIS365_Improvement_Roadmap.md` §6/§7 for the live bug tracker and tech-debt register before starting security work):
   - Service-role Supabase client used directly in some Next.js API routes (bypasses RLS) — planned removal in v1.1.
   - Case-sensitive JWT role matching bug in `src/middleware/auth.ts`.
   - No refresh token rotation yet.
   - `.env` has had an anon key mistakenly placed in the `SUPABASE_SERVICE_ROLE_KEY` slot in at least one past state — always verify `.env` values, don't assume the slot name matches the key type.
   - Razorpay keys are placeholders in most environments; canteen/events/admissions payment flows will fail at runtime until real keys are set.

---

## 9. Known Gaps & Fragile Areas (read before touching)

This section exists because past deep audits of this codebase found that several features are **cosmetically complete but functionally broken**. Don't assume a screen that renders correctly means the underlying flow works end-to-end.

- **Driver GPS**: was simulated/fake in the driver screen; migration to real `expo-location`-based device GPS + Socket.io + `react-native-maps` is an active, in-progress workstream (see `20260625000000_live_bus_tracking.sql`). Verify current state before assuming it's finished.
- **Canteen orders**: historically didn't reliably reach "delivered" status — check the order state machine in `canteen.ts` if working in this area.
- **Parent dashboard**: has previously shown mock data instead of live queries — verify live wiring before trusting what's on screen.
- **Gym purchase flow**: previously didn't complete end-to-end (`fitzone.ts` + Razorpay wiring) — `campusCore.ts:1572` (student fee payment) is flagged as still using a mock Razorpay call as of the last roadmap update.
- **Hardcoded `localhost` URLs** were breaking production API calls — reportedly fixed (`next.config.mjs` now reads `NEXT_PUBLIC_API_URL`), but worth spot-checking if a new environment misbehaves.
- **`src/app/api/` routes using the service-role key** — treat any new API route under `src/app/api/` as needing an explicit decision: scoped anon+JWT client (correct for user-facing reads/writes) vs. service role (only for genuinely server-side/admin operations).
- **The "iris bacup" folder** at repo root (`iris bacup/src-backup-30june`, `iris bacup/supabase-backup-30june`) is a manually-created backup checked into version control. It's large (11MB) and not part of the running app — flag for removal or `.gitignore` rather than treating it as live source when searching the repo.
- **`scratch/`** contains ad-hoc one-off debug/diagnostic scripts (table checks, migration consolidation helpers, RPC listing) — useful for reference on how to query things, not part of the shipped product.
- **HR portal (`src/app/hr/`)**: exists with 10 pages across staff self-service (`/hr/my/*`) and HOD team management (`/hr/hod/*`), but has integration gaps: (a) `HR Admin` role has no entry in the login redirect map — users with this role fall through to `/dashboard`; (b) `HR Admin` is missing from the admin permissions UI `ALL_ROLES` array; (c) `HR Admin` and `Company HR` are not seeded in `module_permissions` table. Backend routes at `/api/v1/hr` correctly gate on `requireRole(['HR Admin', ...])` but the frontend plumbing is incomplete.

---

## 10. Mobile App

- React Native + Expo SDK 51, TypeScript, Expo Router, NativeWind.
- Hardware integrations: `expo-camera` (QR scanning), `expo-location` (geofencing / live GPS), `expo-local-authentication` (biometrics).
- Full screen-by-screen spec lives in `mobile_screens_spec.md` (1,916 lines) — treat this as the source of truth for expected mobile UX before building or changing a mobile screen.
- Primary scope per README: student and parent portals (though driver GPS work implies at least a driver-facing mobile surface too — confirm current scope before assuming).

---

## 11. Environment Variables (what breaks without them)

| Variable | Required | If missing |
|---|---|---|
| `JWT_SECRET` (32+ chars) | **Yes** | Server crashes on boot |
| `SUPABASE_URL` | Yes | Boots but all DB ops fail |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Boots but admin/service ops fail |
| `SUPABASE_ANON_KEY` | Yes | Anon client returns placeholder |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (frontend) | Frontend Supabase calls fail silently |
| `NEXT_PUBLIC_API_URL` | Yes (Netlify frontend) | API calls fail with "Connection failed" |
| `PORT` | No | Defaults to 4000 |
| `RAZORPAY_KEY_ID` / `KEY_SECRET` | No | Canteen/events/admissions payments fail at runtime |
| `ANTHROPIC_API_KEY` | No | AI Concierge / smart features fail at runtime |

Local dev: `npm install && npm run dev` → Next.js on 3000, Express on 4000, concurrently.

---

## 12. Conventions (for anyone/anything writing code here)

- **Frontend**: App Router, `"use client"` on client components, Tailwind for styling.
- **Backend**: strict routes → controllers → (services/lib) layering. Keep route files thin.
- **Dynamic imports required** (`next/dynamic`, `{ ssr: false }`) for anything touching `window`: Leaflet, Recharts, Framer Motion. This was a real bug class here before — don't reintroduce it.
- **Data fetching**: prefer `Promise.all` for independent fetches on a page; sequential waterfalls were a fixed performance issue.
- **Sockets**: use the shared singleton in `src/lib/socket.ts` (`getSocket(namespace)`), not ad-hoc `io()` calls per component — duplicate connections was a fixed bug.
- **Naming**: camelCase for utility files, PascalCase for React components.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`), e.g. `feat(canteen): add order tracking via WebSocket`.
- **Branching**: `main` (stable) ← `dev` (integration) ← `feature/*` / `fix/*`.
- **Before opening a PR**: `npx tsc --noEmit`, then `npm run build:frontend && npm run build:backend`.
- **Domain-specific product constraints to respect in any new feature**:
  - 75% UGC-mandated attendance minimum is a hard product driver for the attendance module — don't build attendance logic without accounting for it.
  - WhatsApp is the preferred notification channel over push for this user base (tier-2/tier-3 Indian college staff/parents) — FCM push is secondary, not primary.
  - Hindi-language UI is preferred by tier-2/tier-3 college staff for admin-facing screens — factor this into any new admin-facing UI work, not just student-facing.

---

## 13. Competitive Context

A prior competitive audit against **DigiCampus** (a rival Indian campus ERP) identified 22 feature gaps in IRIS 365, four flagged critical: **Admissions, Placements, OBE/NAAC accreditation support, and HR Management**. All four now have dedicated modules/controllers in this codebase (see §6), and Admissions/Placements/HR also have dedicated portals (`/applicant`, `/company`, `/hr`). Actual feature depth/parity per module should be re-verified against the original gap list rather than assumed closed — the HR portal in particular has integration gaps noted in §9.

---

## 14. Roadmap Snapshot

| Version | Scope |
|---|---|
| **v0.9 (current)** | Feature-complete prototype, sandbox auth bypass, mock data fallbacks in places |
| **v1.0** | Real Supabase Auth (kill sandbox bypass), Razorpay webhook integration, FCM push, rotating QR cron deployed |
| **v1.1** | Remove service-role key from all user-facing routes, refresh token rotation, API key rotation for device integrations |
| **v1.2** | Realtime + mobile hardening (per `IRIS365_Improvement_Roadmap.md` §4) |
| **v2.0** | AI & analytics expansion (per roadmap §5) |

For granular task-level detail (hour estimates, file-level task lists, bug tracker, tech-debt register, priority matrix), the authoritative source is **`IRIS365_Improvement_Roadmap.md`** — read it directly rather than relying on this summary when planning v1.0/v1.1 work.

---

## 15. Where to Look for What

| Need to... | Go to |
|---|---|
| Understand full module/table/route map | `README.md` (Key Modules table) |
| Plan a v1.0/v1.1 hardening task | `IRIS365_Improvement_Roadmap.md` |
| Understand original build sequencing/architecture decisions | `IRIS365_Implementation_Plan.md` |
| Build/modify a mobile screen | `mobile_screens_spec.md` |
| Check what's been manually QA'd per portal | `portal_testing_report.md` |
| See recent shipped fixes/features | `CHANGELOG.md` |
| Set up a dev environment or follow commit/branch conventions | `CONTRIBUTING.md` |
| Bootstrap a fresh Supabase DB | `supabase_setup.sql` or replay `supabase/migrations/` in order |
| Find seed/test accounts | `README.md` Test Credentials table + `supabase/seed.sql` |

---

*This document was generated by reading the live repository structure, README, CHANGELOG, CONTRIBUTING guide, roadmap, and source tree — not by reading any pre-existing `brain.md` in the repo, per instruction. If a prior `brain.md` exists with additional institutional knowledge (decisions, war stories, rejected approaches), diff against it before overwriting.*
