# IRIS 365 — Improvement Roadmap & Implementation Plan

**Last Updated:** 2026-06-16
**Current Version:** v0.9 (feature-complete prototype)
**Target:** v1.0 Production Hardening → v1.1 Security → v2.0 Scale

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Phase 1: Production Auth & Payment (v1.0)](#2-phase-1-production-auth--payment-v10)
3. [Phase 2: Security Hardening (v1.1)](#3-phase-2-security-hardening-v11)
4. [Phase 3: Real-time & Mobile (v1.2)](#4-phase-3-real-time--mobile-v12)
5. [Phase 4: AI & Analytics (v2.0)](#5-phase-4-ai--analytics-v20)
6. [Bug Tracker](#6-bug-tracker)
7. [Technical Debt Register](#7-technical-debt-register)
8. [Implementation Priority Matrix](#8-implementation-priority-matrix)

---

## 1. Current State Assessment

### What Works (Tested 2026-06-16)
| Area | Status | Notes |
|:---|:---|:---|
| Frontend Pages (34 routes) | 100% rendering | Dark theme UI, skeleton loaders |
| Backend APIs (20 endpoints) | 100% responding | Mock fallback when DB offline |
| Sandbox Auth Bypass | Working | 10+ pre-seeded accounts |
| Build Pipeline | Passing | Next.js + TypeScript clean |
| CI/CD | Configured | `.github/workflows/ci.yml` |

### Known Issues
| Issue | Severity | Location | Status |
|:---|:---|:---|:---|
| Supabase env var mismatch in API routes (`SUPABASE_URL` vs `NEXT_PUBLIC_SUPABASE_URL`) | **Critical** | `superadmin-notifications`, `payment-config`, `wallet/deduct` routes | **Fixed** (2026-06-16) |
| Settings API `decodeJWT` fails for real Supabase tokens (no `institution_id` in JWT) | **Critical** | `src/app/api/settings/route.ts` | **Fixed** (2026-06-16) |
| Feature Toggles tab shows "Failed to load" | **High** | `src/app/admin/global/page.tsx` | **Fixed** — dependent on settings API fix |
| `.env` has anon key in `SUPABASE_SERVICE_ROLE_KEY` slot | **High** | `.env` line 5 | Needs real service role key for production |
| Service role used in user-facing Next.js API routes (bypasses RLS) | **High** | All `src/app/api/` routes | Planned for v1.1 |
| Razorpay keys are placeholders | **Medium** | `.env` lines 9-10 | Needs real test/live keys |
| `campusCore.ts` student fee payment uses mock Razorpay | **Medium** | `src/controllers/campusCore.ts:1572` | Needs real integration |
| No refresh token rotation | **Medium** | Auth middleware | Planned for v1.1 |
| No FCM push notifications | **Medium** | Global | Planned for v1.2 |
| No real-time Socket.io in production | **Low** | Global | Planned for v1.2 |

---

## 2. Phase 1: Production Auth & Payment (v1.0)

**Goal:** Replace sandbox mock auth with real Supabase Auth, enable real Razorpay payments, deploy rotating QR attendance.

### 1.1 Supabase Auth Migration
| Task | Priority | Files | Est. Hours | Dependencies |
|:---|:---|:---|:---|:---|
| Replace `mock-sandbox-jwt-token-value` with Supabase `signInWithPassword()` | P0 | `src/app/login/page.tsx`, `src/middleware/auth.ts` | 8h | Supabase project setup |
| Remove sandbox bypass logic from login flow | P0 | `src/app/login/page.tsx:230-271` | 2h | 1.1a |
| Implement refresh token rotation | P0 | `src/middleware/auth.ts`, `src/lib/api.ts` | 6h | 1.1a |
| Add `getSession()` / `getUser()` helpers for SSR pages | P1 | `src/lib/supabase-ssr.ts` (new) | 4h | 1.1a |
| Migrate PortalShell to use real JWT for `my_permissions` | P1 | `src/components/PortalShell.tsx:80` | 2h | 1.1a |
| Update all `localStorage.getItem('iris_jwt_token')` calls to use httpOnly cookies | P1 | 59 files (grep matches) | 8h | 1.1a, 1.1d |
| Test all 10+ role login paths with real Supabase Auth | P0 | Manual testing | 4h | 1.1a-f |

### 1.2 Razorpay Real Integration
| Task | Priority | Files | Est. Hours | Dependencies |
|:---|:---|:---|:---|:---|
| Configure Razorpay test keys in `.env` / Netlify | P0 | `.env`, Netlify dashboard | 1h | Razorpay account |
| Implement real Razorpay checkout in student fees | P0 | `src/controllers/campusCore.ts:1572` | 6h | 1.2a |
| Add Razorpay webhook endpoint for payment verification | P0 | `src/app/api/webhooks/razorpay/route.ts` (new) | 4h | 1.2a |
| Integrate real Razorpay in parent fee payment | P1 | `src/app/parent/fees/page.tsx` | 3h | 1.2a-c |
| Integrate real Razorpay in IRIS Balance top-up | P1 | `src/app/student/wallet/page.tsx` | 3h | 1.2a-c |
| Add payment receipt PDF generation | P2 | `src/lib/pdf.ts` (new) | 4h | 1.2b |
| Test full payment flow with Razorpay test cards | P0 | Manual testing | 3h | 1.2a-f |

### 1.3 Rotating QR Attendance
| Task | Priority | Files | Est. Hours | Dependencies |
|:---|:---|:---|:---|:---|
| Deploy QR token cron job (rotate every 30s) | P0 | `src/services/qrCron.ts`, `netlify/functions/` | 4h | Supabase RPC |
| Add geo-fence validation on QR scan | P1 | `src/controllers/campusCore.ts` | 3h | 1.3a |
| Implement biometric fallback (WebAuthn) | P2 | `src/app/student/attendance/page.tsx` | 8h | Browser API support |

### 1.4 Deploy & Verify
| Task | Priority | Files | Est. Hours |
|:---|:---|:---|:---|
| Set all production env vars in Netlify | P0 | Netlify dashboard | 1h |
| Run full Supabase migrations against production DB | P0 | `supabase_setup.sql` + `supabase/migrations/` | 2h |
| Seed production institution data | P0 | `supabase/seed.sql` | 1h |
| Smoke test all 34 frontend routes | P0 | Browser testing | 4h |
| Smoke test all 20 backend API endpoints | P0 | Postman/curl | 2h |

**Phase 1 Total: ~71 hours**

---

## 3. Phase 2: Security Hardening (v1.1)

**Goal:** Remove service role from user-facing routes, add refresh tokens, API key rotation for device integrations.

### 2.1 Remove Service Role from User-Facing Routes
| Task | Priority | Files | Est. Hours |
|:---|:---|:---|:---|
| Audit all `src/app/api/` routes for `SUPABASE_SERVICE_ROLE_KEY` usage | P0 | All API routes | 4h |
| Replace service role client with scoped JWT client in settings API | P0 | `src/app/api/settings/route.ts` | 6h |
| Replace service role in superadmin notifications API | P0 | `src/app/api/superadmin-notifications/route.ts` | 2h |
| Replace service role in payment config API | P0 | `src/app/api/core/payment-config/route.ts` | 2h |
| Replace service role in wallet deduct API | P0 | `src/app/api/core/wallet/deduct/route.ts` | 2h |
| Verify all RLS policies work with anon key | P0 | Supabase SQL Editor | 4h |
| Create `supabase/functions/` for server-side operations requiring service role | P1 | `supabase/functions/` (new) | 8h |

### 2.2 Refresh Token Rotation
| Task | Priority | Files | Est. Hours |
|:---|:---|:---|:---|
| Implement `/api/v1/auth/refresh` endpoint | P0 | `src/routes/auth.ts` | 4h |
| Add token expiry tracking (15min access, 7d refresh) | P0 | `src/middleware/auth.ts` | 3h |
| Add automatic token refresh in `apiGet` / `apiPost` | P0 | `src/lib/api.ts` | 4h |
| Add session invalidation on password change | P1 | `src/routes/auth.ts` | 2h |
| Add concurrent session limiting per user | P2 | `src/routes/auth.ts`, Supabase | 4h |

### 2.3 Device Integration API Keys
| Task | Priority | Files | Est. Hours |
|:---|:---|:---|:---|
| Create `api_keys` table for device integrations | P1 | `supabase_setup.sql` | 2h |
| Implement API key middleware for IoT endpoints | P1 | `src/middleware/apiKey.ts` (new) | 4h |
| Add key rotation UI in Admin Settings | P2 | `src/app/admin/settings/page.tsx` | 4h |

### 2.4 Security Audit
| Task | Priority | Files | Est. Hours |
|:---|:---|:---|:---|
| Fix case-sensitive JWT role matching (known issue) | P0 | `src/middleware/auth.ts` | 2h |
| Add CSP headers to Next.js config | P1 | `next.config.mjs`, `netlify.toml` | 2h |
| Add rate limiting to all API routes (not just auth) | P1 | `src/middleware/rateLimit.ts` | 3h |
| Sanitize all error messages (no stack traces in prod) | P1 | All controllers | 2h |
| Add input validation with Zod on all POST routes | P2 | All route handlers | 12h |

**Phase 2 Total: ~73 hours**

---

## 4. Phase 3: Real-time & Mobile (v1.2)

**Goal:** FCM push notifications, Socket.io in production, React Native mobile app.

### 4.1 FCM Push Notifications
| Task | Priority | Files | Est. Hours |
|:---|:---|:---|:---|
| Configure Firebase project and FCM server keys | P0 | Firebase console | 2h |
| Create `device_tokens` table for FCM registration | P0 | `supabase_setup.sql` | 2h |
| Implement `/api/v1/notifications/register-device` | P0 | `src/routes/notifications.ts` (new) | 3h |
| Send FCM on notice creation | P1 | `src/controllers/noticeController.ts` | 3h |
| Send FCM on attendance alert (defaulter warning) | P1 | `src/controllers/attendanceController.ts` | 2h |
| Add notification preferences per user | P2 | `src/app/student/settings/page.tsx` | 4h |

### 4.2 Socket.io Production Deployment
| Task | Priority | Files | Est. Hours |
|:---|:---|:---|:---|
| Deploy Socket.io with Netlify Functions (WebSocket support) | P0 | `netlify.toml`, `netlify/functions/socket.mjs` | 6h |
| Connect transit GPS tracking to Socket.io | P1 | `src/controllers/transitController.ts` | 3h |
| Connect canteen order queue to Socket.io | P1 | `src/controllers/canteenController.ts` | 2h |
| Connect gate alerts to Socket.io | P1 | `src/controllers/gateController.ts` | 2h |
| Connect live event check-ins to Socket.io | P1 | `src/controllers/events.ts` | 2h |

### 4.3 React Native Mobile App
| Task | Priority | Files | Est. Hours |
|:---|:---|:---|:---|
| Initialize Expo project with navigation | P0 | `mobile/` (new directory) | 8h |
| Implement student portal screens (14 screens) | P0 | `mobile_screens_spec.md` | 40h |
| Implement parent portal screens | P1 | `mobile_screens_spec.md` | 16h |
| Add biometric auth (expo-local-authentication) | P1 | Mobile app | 4h |
| Add QR scanner for attendance (expo-camera) | P1 | Mobile app | 3h |
| Add geo-fencing for attendance (expo-location) | P1 | Mobile app | 4h |
| Configure EAS Build for Android/iOS | P0 | `eas.json` | 4h |
| Submit to Google Play Store | P0 | Play Console | 8h |

**Phase 3 Total: ~113 hours**

---

## 5. Phase 4: AI & Analytics (v2.0)

**Goal:** Production AI concierge, predictive analytics, NAAC/NIRF automation.

### 5.1 AI Concierge Production
| Task | Priority | Files | Est. Hours |
|:---|:---|:---|:---|
| Replace mock AI with real LLM (Claude/GPT-4) | P0 | `src/controllers/aiController.ts` | 12h |
| Add FAQ knowledge base from institution data | P1 | `src/services/aiKnowledgeBase.ts` (new) | 8h |
| Add escalation workflow (AI → Admin → Director) | P1 | `src/controllers/aiController.ts` | 4h |
| WhatsApp integration for AI responses | P1 | `src/services/whatsappService.ts` | 6h |
| Add conversation analytics dashboard | P2 | `src/app/admin/ai/analytics/page.tsx` | 6h |

### 5.2 Predictive Analytics
| Task | Priority | Files | Est. Hours |
|:---|:---|:---|:---|
| Student dropout prediction model | P1 | `src/services/predictiveModel.ts` (new) | 12h |
| Attendance pattern anomaly detection | P1 | `src/services/anomalyDetection.ts` (new) | 8h |
| Fee default prediction | P2 | `src/services/predictiveModel.ts` | 6h |
| Placement success probability | P2 | `src/services/predictiveModel.ts` | 6h |

### 5.3 NAAC/NIRF Automation
| Task | Priority | Files | Est. Hours |
|:---|:---|:---|:---|
| Auto-generate AQAR reports from attendance/exam data | P1 | `src/services/naacAutomation.ts` (new) | 12h |
| NIRF data export (JSON format) | P1 | `src/services/nirfExport.ts` (new) | 8h |
| Evidence auto-collection from module data | P2 | `src/services/evidenceCollector.ts` (new) | 8h |
| Criterion-wise scoring dashboard | P1 | `src/app/iqac/dashboard/page.tsx` | 6h |

**Phase 4 Total: ~96 hours**

---

## 6. Bug Tracker

### Critical (Blocking Production)
| # | Bug | Reported | Fix Status | PR |
|:--|:---|:---|:---|:---|
| B-001 | Settings API returns "Missing institution context" for real Supabase JWTs | 2026-06-16 | **Fixed** | — |
| B-002 | API routes use wrong env var `SUPABASE_URL` (should fallback to `NEXT_PUBLIC_SUPABASE_URL`) | 2026-06-16 | **Fixed** | — |
| B-003 | Feature Toggles tab "Failed to load" (dependent on B-001) | 2026-06-16 | **Fixed** | — |

### High (Affecting Functionality)
| # | Bug | Reported | Fix Status | Notes |
|:--|:---|:---|:---|:---|
| B-004 | `.env` has anon key in `SUPABASE_SERVICE_ROLE_KEY` slot | 2026-06-16 | Open | Needs real service role key |
| B-005 | Case-sensitive JWT role matching causes 403 for wrong-case roles | 2026-06-14 | Open | `src/middleware/auth.ts` |
| B-006 | Service role used in user-facing Next.js API routes (bypasses RLS) | 2026-06-16 | Open | Planned v1.1 |

### Medium (Cosmetic/UX)
| # | Bug | Reported | Fix Status | Notes |
|:--|:---|:---|:---|:---|
| B-007 | No loading states on some admin pages | 2026-06-14 | Partial | Skeletons added to 4 pages, rest pending |
| B-008 | Student fee payment uses mock Razorpay | 2026-06-16 | Open | Planned v1.0 |

---

## 7. Technical Debt Register

| ID | Debt | Impact | Priority | Estimated Effort |
|:--|:---|:---|:---|:---|
| TD-001 | 59 files still use `localStorage.getItem('iris_jwt_token')` instead of httpOnly cookies | XSS vulnerability | P1 | 8h |
| TD-002 | No input validation (Zod) on POST route handlers | Injection risk | P2 | 12h |
| TD-003 | No CSP headers on Next.js | XSS/injection risk | P1 | 2h |
| TD-004 | No rate limiting on non-auth API routes | DDoS risk | P1 | 3h |
| TD-005 | No concurrent session limiting | Session hijack risk | P2 | 4h |
| TD-006 | React Native mobile app not initialized | No mobile distribution | P0 | 8h (init) |
| TD-007 | No E2E test suite | Regression risk | P1 | 16h |
| TD-008 | No monitoring/alerting (Sentry, Datadog) | No production observability | P1 | 4h |
| TD-009 | Socket.io not deployed in production | No real-time features | P1 | 6h |
| TD-010 | No refresh token implementation | Session expiry issues | P0 | 7h |
| TD-011 | `supabase_setup.sql` has grown to 3200+ lines (monolith) | Migration complexity | P2 | 8h (split) |
| TD-012 | No database backup/restore automation | Data loss risk | P1 | 3h |

---

## 8. Implementation Priority Matrix

```
                    HIGH IMPACT
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    │  ★ v1.0 Auth      │  ★ v1.1 Security  │
    │  ★ v1.0 Payment   │  ★ v1.0 QR cron   │
    │  ★ B-001,B-002    │  ★ TD-010 Refresh │
    │                   │  ★ TD-003 CSP     │
    │                   │                   │
    ├───────────────────┼───────────────────┤
    │                   │                   │
    │  ◆ v1.2 FCM       │  ◇ v2.0 AI        │
    │  ◆ v1.2 Socket.io │  ◇ v2.0 NAAC auto │
    │  ◆ v1.2 Mobile    │  ◇ v2.0 Predictive│
    │  ◆ TD-007 E2E     │  ◇ TD-011 Split   │
    │                   │                   │
    └───────────────────┼───────────────────┘
                        │
                   LOW IMPACT
    LOW URGENCY ────────┼──────── HIGH URGENCY
```

### Sprint Plan (Recommended)

| Sprint | Duration | Focus | Deliverables |
|:---|:---|:---|:---|
| **Sprint 1** | Week 1 | Auth Migration | Real Supabase Auth, remove sandbox bypass, httpOnly cookies |
| **Sprint 2** | Week 2 | Payment Integration | Razorpay real checkout, webhooks, receipt PDFs |
| **Sprint 3** | Week 3 | QR Attendance + Env | Rotating QR cron, geo-fence, production env vars |
| **Sprint 4** | Week 4 | Security Hardening | Remove service role from API routes, RLS audit, CSP headers |
| **Sprint 5** | Week 5 | Refresh Tokens + Rate Limiting | Token rotation, rate limiting, input validation |
| **Sprint 6** | Week 6 | FCM + Socket.io | Push notifications, real-time WebSocket deployment |
| **Sprint 7-8** | Weeks 7-8 | Mobile App MVP | Expo project, student/parent portal screens |
| **Sprint 9-10** | Weeks 9-10 | AI & Analytics | Production AI concierge, predictive models |

### Quick Wins (< 2 hours each)
- [ ] Set real `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- [ ] Set real Razorpay test keys in `.env`
- [ ] Fix case-sensitive JWT role matching
- [ ] Add CSP headers to `next.config.mjs`
- [ ] Add `Cache-Control` headers to remaining GET endpoints

---

## Appendix: File Reference

### Key Files Modified in Recent Sessions
| File | Changes | Date |
|:---|:---|:---|
| `src/app/api/settings/route.ts` | Added `resolveUserContext()` for Supabase JWT support | 2026-06-16 |
| `src/app/api/superadmin-notifications/route.ts` | Fixed env var fallback (`NEXT_PUBLIC_SUPABASE_URL`) | 2026-06-16 |
| `src/app/api/core/payment-config/route.ts` | Fixed env var fallback | 2026-06-16 |
| `src/app/api/core/wallet/deduct/route.ts` | Fixed env var fallback | 2026-06-16 |
| `src/app/admin/global/page.tsx` | KPI cards, notifications tab, plan pricing editor | 2026-06-16 |
| `src/app/admin/global/CampusDetailPanel.tsx` | New campus drill-down analytics | 2026-06-16 |
| `src/app/admin/notifications/page.tsx` | New admin notification inbox | 2026-06-16 |
| `src/app/admin/payment-settings/page.tsx` | New payment gateway config page | 2026-06-16 |
| `src/app/student/fees/page.tsx` | Multi-method payment with IRIS Balance | 2026-06-16 |
| `src/app/student/wallet/page.tsx` | Renamed to IRIS Balance with top-up | 2026-06-16 |
| `src/app/parent/fees/page.tsx` | Parent fee payment with multi-method | 2026-06-16 |
| `src/components/PortalShell.tsx` | Added notification bell with unread count | 2026-06-16 |
| `.env` | Added RAZORPAY_KEY_ID/SECRET placeholders | 2026-06-16 |
