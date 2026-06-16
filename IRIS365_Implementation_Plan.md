# IRIS 365 — Implementation Plan

**Generated from:** `iris365_improvement_roadmap.md` + codebase audit (2026-06-16)
**Purpose:** Exact file-level, line-level implementation steps for each phase

---

## Table of Contents

1. [Pre-Flight Checklist](#pre-flight-checklist)
2. [Sprint 1: Auth Migration](#sprint-1-auth-migration)
3. [Sprint 2: Payment Integration](#sprint-2-payment-integration)
4. [Sprint 3: QR Attendance + Deploy](#sprint-3-qr-attendance--deploy)
5. [Sprint 4: Security Hardening](#sprint-4-security-hardening)
6. [Sprint 5: Refresh Tokens + Validation](#sprint-5-refresh-tokens--validation)
7. [Sprint 6: Real-time + Push](#sprint-6-real-time--push)
8. [Sprint 7-8: Mobile App](#sprint-7-8-mobile-app)
9. [Sprint 9-10: AI & Analytics](#sprint-9-10-ai--analytics)
10. [Architecture Decision Record](#architecture-decision-record)

---

## Pre-Flight Checklist

Before starting any sprint, resolve these blockers:

### Environment
- [ ] Get real `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard → Settings → API (currently using anon key)
- [ ] Get real `SUPABASE_JWT_SECRET` from Supabase Dashboard → Settings → API → JWT Secret
- [ ] Create Razorpay test account, get `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- [ ] Set all env vars in Netlify Dashboard → Site → Environment Variables

### Architecture Decision Required
- [ ] **Deploy Express separately or consolidate into Next.js?**
  - Option A: Deploy Express on Railway/Render, set `NEXT_PUBLIC_API_URL=https://backend.onrender.com/api/v1`
  - Option B: Convert Express routes to Next.js API routes (remove Express dependency)
  - **Recommended:** Option A — less risk, Express already works, Netlify rewrites handle proxy

---

## Sprint 1: Auth Migration

**Goal:** Replace sandbox mock auth with real Supabase Auth

### Step 1.1: Create Supabase Auth Client Helper

**New file:** `src/lib/supabase-browser.ts`

```typescript
// Browser-side Supabase client using NEXT_PUBLIC env vars
import { createClient } from '@supabase/supabase-js'

export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Step 1.2: Modify Login Page

**File:** `src/app/login/page.tsx`

| Line Range | Change | Why |
|:---|:---|:---|
| 185 | Change `useState(true)` → `useState(false)` | Default to online mode, not offline bypass |
| 229-271 | Wrap entire sandbox bypass block in `if (process.env.NODE_ENV !== 'production')` | Prevent mock login in production |
| 287-301 | Same `NODE_ENV` guard around `handleQuickLogin` offline path | Prevent mock bypass in production |
| 436-470 | Conditionally render quick-login buttons only in dev | Development-only feature |

**Critical change — Real Supabase Auth login (replace lines 201-227):**

```typescript
// Current: calls POST /api/v1/auth/login (Express backend)
// New: call supabaseBrowser.auth.signInWithPassword() directly

import { supabaseBrowser } from '../../../lib/supabase-browser'

const onSubmit = async (data: { email: string; password: string }) => {
  const { data: authData, error } = await supabaseBrowser.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })
  
  if (error) {
    setSubmitError(error.message)
    return
  }
  
  // Store Supabase access token (NOT your self-signed JWT)
  localStorage.setItem('iris_jwt_token', authData.session.access_token)
  
  // Fetch user profile from your users table
  const { data: profile } = await supabaseBrowser
    .from('users')
    .select('id, name, email, role, institution_id, institutions(name, plan_tier)')
    .eq('email', data.email)
    .single()
  
  localStorage.setItem('iris_user_profile', JSON.stringify({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    institution_id: profile.institution_id,
    institution_name: profile.institutions?.name,
    plan_tier: profile.institutions?.plan_tier,
  }))
  
  window.location.href = getRedirectPath(profile.role)
}
```

### Step 1.3: Update Express Backend Auth

**File:** `src/controllers/auth.ts`

| Line Range | Change |
|:---|:---|
| 47-105 | Delete or `if (NODE_ENV !== 'production')` guard the sandbox bypass block |
| 108-130 | Keep the real Supabase Auth path (`supabaseAdmin.auth.signInWithPassword()`) — this is correct |
| 174 | Change JWT expiry from `'24h'` to `'15m'` (short-lived access token) |
| 174 | After signing the JWT, also return Supabase's `refresh_token` in the response |

**JWT payload stays the same** — the middleware already handles it correctly:

```typescript
// Lines 165-174 (keep as-is, these are correct)
const tokenClaims = {
  id: userProfile.id,
  institution_id: userProfile.institution_id,
  role: normalizedRole,
  email: userProfile.email,
  fingerprint: fingerprintHash
};
const token = jwt.sign(tokenClaims, JWT_SECRET, { expiresIn: '15m' }); // Changed from '24h'
```

### Step 1.4: Update Express Backend JWT Verification

**File:** `src/middleware/auth.ts`

| Line | Change |
|:---|:---|
| 58 | Current: `jwt.verify(token, JWT_SECRET)` — this verifies YOUR self-signed JWT. **Keep as-is** since the backend still issues its own JWTs after Supabase Auth. |
| 86-87 | Keep case-insensitive role matching — already correct |

### Step 1.5: Update Settings API JWT Handling

**File:** `src/app/api/settings/route.ts`

| Line Range | Change |
|:---|:---|
| 24-33 | Delete the `mock-sandbox-jwt-token-value` special case |
| 23-43 | After base64 decoding, add proper JWT signature verification using `jsonwebtoken` + `SUPABASE_JWT_SECRET` |
| 46-77 | Keep the `resolveUserContext` function — it correctly handles Supabase JWTs by looking up the user in the `users` table |

**Add JWT verification to `decodeJWT`:**

```typescript
import jwt from 'jsonwebtoken'

function decodeJWT(token: string): Record<string, any> | null {
  try {
    // Verify signature using Supabase JWT secret
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET!)
    return decoded as Record<string, any>
  } catch {
    // Fallback: try base64 decode (for self-signed backend JWTs)
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        return JSON.parse(Buffer.from(parts[1], 'base64').toString())
      }
    } catch {}
    return null
  }
}
```

### Step 1.6: Remove localStorage Token Pattern (59 files)

**Files affected:** All files with `localStorage.getItem('iris_jwt_token')` (59 grep matches)

**Strategy:** Create a token accessor utility and replace all direct localStorage calls:

**New file:** `src/lib/auth-storage.ts`

```typescript
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('iris_jwt_token')
}

export function setAuthToken(token: string): void {
  localStorage.setItem('iris_jwt_token', token)
}

export function clearAuthToken(): void {
  localStorage.removeItem('iris_jwt_token')
  localStorage.removeItem('iris_user_profile')
}
```

Then replace all `localStorage.getItem('iris_jwt_token')` with `getAuthToken()` across the 59 files. This is a mechanical find-and-replace.

### Step 1.7: Verify All 10 Role Login Paths

Test each sandbox email with real Supabase Auth:

| Email | Expected Role | Test |
|:---|:---|:---|
| `siddharth@sin.education` | SuperAdmin | Login → /admin/global |
| `director@siet.edu.in` | Admin | Login → /admin/dashboard |
| `khushal@gmail.com` | Student | Login → /student/dashboard |
| `teacher@sin.education` | Teacher | Login → /teacher/dashboard |
| `hod@sin.education` | HOD | Login → /hod/dashboard |
| `warden@siet.edu.in` | Warden | Login → /warden/dashboard |
| `security@siet.edu.in` | Security | Login → /gate/dashboard |
| `rajesh.driver@siet.edu.in` | Driver | Login → /driver/dashboard |
| `madanlal@gmail.com` | Parent | Login → /parent/dashboard |
| `canteen@siet.edu.in` | Vendor | Login → /vendor/dashboard |
| `librarian@sin.education` | Librarian | Login → /library/dashboard |

**Prerequisite:** These users must exist in Supabase Auth (create via Supabase Dashboard → Auth → Users) with `password123`.

---

## Sprint 2: Payment Integration

**Goal:** Real Razorpay checkout for student fees, parent fees, and IRIS Balance top-up

### Step 2.1: Create Shared Razorpay Client

**New file:** `src/lib/razorpay.ts`

```typescript
import Razorpay from 'razorpay'

let razorpayInstance: Razorpay | null = null

export function getRazorpayClient(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  
  if (!keyId || !keySecret || keyId.includes('your_key')) {
    return null // No real keys configured
  }
  
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret })
  }
  
  return razorpayInstance
}

export function isMockOrderId(orderId: string): boolean {
  return orderId.startsWith('order_mock_') || orderId.startsWith('order_rzp_')
}
```

### Step 2.2: Fix `initiatePayment` in campusCore.ts

**File:** `src/controllers/campusCore.ts` — Lines 1573-1590

**Current (mock):**
```typescript
// Line 1580: generates fake order
const order_id = `order_rzp_${Math.random().toString(36).substring(2, 12)}`
```

**Replace with:**
```typescript
import { getRazorpayClient } from '../lib/razorpay'

// Inside initiatePayment function (line 1573):
const razorpay = getRazorpayClient()

if (!razorpay) {
  // Mock mode: no real keys
  const order_id = `order_mock_${Math.random().toString(36).substring(2, 12)}`
  return { success: true, order_id, amount: amount * 100, currency: 'INR' }
}

// Real Razorpay order creation
const order = await razorpay.orders.create({
  amount: amount * 100, // Razorpay expects paise
  currency: 'INR',
  receipt: `fee_${student_id}_${Date.now()}`,
})

return {
  success: true,
  order_id: order.id,
  amount: order.amount,
  currency: order.currency,
  key_id: process.env.RAZORPAY_KEY_ID, // Frontend needs this for checkout.js
}
```

### Step 2.3: Fix `verifyPayment` in campusCore.ts

**File:** `src/controllers/campusCore.ts` — Lines 1592-1632

**Current issue:** Uses inconsistent mock order prefix detection (`order_mock_` vs `order_rzp_`).

**Replace lines 1598-1608 with:**
```typescript
import { isMockOrderId } from '../lib/razorpay'
import crypto from 'crypto'

const secret = process.env.RAZORPAY_KEY_SECRET
if (secret && !isMockOrderId(razorpay_order_id)) {
  // Real Razorpay signature verification
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')
  
  if (expectedSignature !== razorpay_signature) {
    return { success: false, error: 'Payment verification failed' }
  }
}
```

### Step 2.4: Add Razorpay SDK to Student Fees Page

**File:** `src/app/student/fees/page.tsx` — Lines 120-174

**Add Razorpay SDK loading (add near top of component):**

```typescript
useEffect(() => {
  const script = document.createElement('script')
  script.src = 'https://checkout.razorpay.com/v1/checkout.js'
  script.async = true
  document.body.appendChild(script)
  return () => { document.body.removeChild(script) }
}, [])
```

**Fix hardcoded student ID (lines 123, 143, 164, 167):**

```typescript
// Current: student_id: 'b0000000-0000-0000-0000-000000000006'
// Replace with:
const profile = JSON.parse(localStorage.getItem('iris_user_profile') || '{}')
const studentId = profile.id // Or fetch from /auth/me endpoint
```

**Fix Razorpay checkout (lines 161-173):**

```typescript
// Current mock: alert() simulator
// Replace with real checkout:
if (response.order_id && response.key_id && window.Razorpay) {
  const rzp = new (window as any).Razorpay({
    key: response.key_id,
    amount: response.amount,
    currency: response.currency,
    name: 'IRIS 365',
    description: 'Fee Payment',
    order_id: response.order_id,
    handler: async (response: any) => {
      // Verify payment on backend
      const verifyRes = await apiPost('/core/fees/payment/verify', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        student_id: studentId,
        fee_structure_id: structure.id,
        amount_paid: structure.amount,
      })
      if (verifyRes.success) {
        alert('Payment successful!')
        loadFees() // Refresh fee list
      }
    },
    prefill: { email: profile.email },
    theme: { color: '#7C3AED' },
  })
  rzp.open()
}
```

### Step 2.5: Add Razorpay SDK to Parent Fees Page

**File:** `src/app/parent/fees/page.tsx` — Lines 103-145

Same pattern as Step 2.4: add SDK loading, replace mock checkout with real Razorpay checkout.

### Step 2.6: Fix Wallet Top-Up (IRIS Balance)

**File:** `src/app/student/wallet/page.tsx` — Lines 69-125

**Issues found:**
1. **Client-side order ID generation** (line 77) — must create order server-side
2. **Missing backend endpoint** — `POST /core/wallet/credit` has no handler

**New backend endpoint needed:**

**File:** `src/controllers/campusCore.ts` — Add new function:

```typescript
export const creditWallet = async (req: Request, res: Response) => {
  const { amount, razorpay_order_id, razorpay_payment_id } = req.body
  
  // Verify Razorpay payment server-side
  const razorpay = getRazorpayClient()
  if (razorpay && razorpay_order_id && !isMockOrderId(razorpay_order_id)) {
    // Verify the payment exists and is captured
    try {
      const payment = await razorpay.payments.fetch(razorpay_payment_id)
      if (payment.status !== 'captured') {
        return res.status(400).json({ success: false, error: 'Payment not captured' })
      }
    } catch (err) {
      return res.status(400).json({ success: false, error: 'Payment verification failed' })
    }
  }
  
  // Credit wallet
  const userId = req.user.id
  const { data: student } = await supabaseAdmin
    .from('students')
    .select('id, wallet_balance')
    .eq('user_id', userId)
    .single()
  
  const newBalance = (student.wallet_balance || 0) + amount
  await supabaseAdmin
    .from('students')
    .update({ wallet_balance: newBalance })
    .eq('id', student.id)
  
  // Record transaction
  await supabaseAdmin.from('wallet_transactions').insert({
    student_id: student.id,
    type: 'credit',
    amount,
    description: 'IRIS Balance Top-up via Razorpay',
  })
  
  return res.json({ success: true, balance: newBalance })
}
```

**Register route in `src/routes/campusCore.ts`:**
```typescript
router.post('/wallet/credit', authMiddleware, requireRole(['Student']), creditWallet)
```

**Fix frontend wallet page to use server-side order creation:**

```typescript
// Current line 77: generates order client-side
// Replace with:
const orderRes = await apiPost('/core/wallet/credit/initiate', { amount })
// Then use orderRes.order_id in Razorpay checkout
```

### Step 2.7: Standardize Mock Order ID Prefixes

**Files to update:**

| File | Current Prefix | New Prefix |
|:---|:---|:---|
| `src/controllers/campusCore.ts:1580` | `order_rzp_` | `order_mock_` |
| `src/controllers/canteen.ts` | `order_mock_` | `order_mock_` (keep) |
| `src/controllers/events.ts` | `order_mock_` | `order_mock_` (keep) |
| `src/controllers/fitzone.ts` | `rzp_order_` | `order_mock_` |
| `src/controllers/admissions.ts` | `order_mock_` | `order_mock_` (keep) |

Update the `isMockOrderId()` check in each controller's `verifyPayment` to use the shared utility.

---

## Sprint 3: QR Attendance + Deploy

### Step 3.1: Rotating QR Token Cron Job

**New file:** `src/services/qrCron.ts`

```typescript
// Generates a new QR token every 30 seconds
// Stored in Supabase table: qr_tokens

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function rotateQRTokens(institutionId: string) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 30000) // 30 seconds
  
  // Delete expired tokens
  await supabase
    .from('qr_tokens')
    .delete()
    .lt('expires_at', new Date().toISOString())
  
  // Insert new token
  await supabase.from('qr_tokens').insert({
    institution_id: institutionId,
    token,
    expires_at: expiresAt.toISOString(),
  })
  
  return token
}
```

**Deploy as Netlify scheduled function:**

**New file:** `netlify/functions/qr-rotate.mjs`

```javascript
import { rotateQRTokens } from '../../dist/services/qrCron.js'

export default async (request, context) => {
  const institutionId = 'a0000000-0000-0000-0000-000000000001'
  await rotateQRTokens(institutionId)
  return new Response('QR rotated', { status: 200 })
}

export const config = {
  schedule: '@every 30s' // Netlify scheduled functions
}
```

### Step 3.2: Geo-fence Validation

**File:** `src/controllers/campusCore.ts` — Find the QR scan attendance function

Add latitude/longitude validation:

```typescript
// After QR token validation, before marking attendance:
if (latitude && longitude) {
  const campus = await getCampusLocation(institutionId)
  const distance = haversineDistance(
    { lat: latitude, lng: longitude },
    { lat: campus.latitude, lng: campus.longitude }
  )
  if (distance > 200) { // 200 meter radius
    return res.status(400).json({ success: false, error: 'Outside campus geo-fence' })
  }
}
```

### Step 3.3: Production Deployment

1. **Set Netlify env vars:**
   - `SUPABASE_SERVICE_ROLE_KEY` = real service role key
   - `SUPABASE_URL` = `https://rfjwbhtskyntpowibub.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_URL` = same
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = real anon key
   - `RAZORPAY_KEY_ID` = test key
   - `RAZORPAY_KEY_SECRET` = test secret
   - `JWT_SECRET` = 32+ char secret
   - `NEXT_PUBLIC_API_URL` = Express backend URL

2. **Run Supabase migrations** against production:
   ```bash
   # In Supabase SQL Editor, run:
   # 1. supabase_setup.sql (full schema)
   # 2. All files in supabase/migrations/ in order
   ```

3. **Create Supabase Auth users** for all sandbox roles

4. **Deploy Express backend** separately (Railway/Render/VPS)

---

## Sprint 4: Security Hardening

### Step 4.1: Audit All API Routes for Service Role Usage

**Run this grep:**
```bash
grep -rn "SUPABASE_SERVICE_ROLE_KEY\|supabaseAdmin\|createClient.*service" src/app/api/
```

**Files found and fix for each:**

| File | Current | Fix |
|:---|:---|:---|
| `src/app/api/settings/route.ts:5` | Uses `SUPABASE_SERVICE_ROLE_KEY` | Replace with anon key + RLS |
| `src/app/api/superadmin-notifications/route.ts:5` | Uses `SUPABASE_SERVICE_ROLE_KEY` | Replace with anon key + RLS |
| `src/app/api/core/payment-config/route.ts:5` | Uses `SUPABASE_SERVICE_ROLE_KEY` | Replace with anon key + RLS |
| `src/app/api/core/wallet/deduct/route.ts:5` | Uses `SUPABASE_SERVICE_ROLE_KEY` | Replace with anon key + RLS |

**Pattern for each:**

```typescript
// Current:
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Replace with: create scoped client using user's JWT
function createScopedClient(authToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${authToken}` } } }
  )
}

// Then in handler:
const token = req.headers.get('authorization')?.replace('Bearer ', '') || ''
const supabase = createScopedClient(token)
```

### Step 4.2: Verify RLS Policies

Run these queries in Supabase SQL Editor to verify each table is protected:

```sql
-- Test as anon (no auth):
SELECT * FROM institution_features; -- Should return 0 rows
SELECT * FROM users; -- Should return 0 rows
SELECT * FROM fee_payments; -- Should return 0 rows

-- Test as authenticated user:
-- (Login as Student, get JWT, use it in Supabase SQL Editor with SET ROLE)
```

### Step 4.3: Add CSP Headers

**File:** `netlify.toml` — Add after `[build]` section:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://checkout.razorpay.com"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(self)"
```

### Step 4.4: Fix Hardcoded JWT_SECRET Fallback

**File:** `src/controllers/campusCore.ts` — Line 10

```typescript
// Current:
const JWT_SECRET = process.env.JWT_SECRET || 'iris-365-super-secret-key-for-jwt-signing'

// Replace with:
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('CRITICAL: JWT_SECRET must be set and >= 32 chars')
}
```

### Step 4.5: Add Rate Limiting

**File:** `src/server.ts` — Add middleware:

```typescript
import rateLimit from 'express-rate-limit'

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', apiLimiter)
```

### Step 4.6: Sanitize Error Messages

**File:** All controllers in `src/controllers/`

Replace `catch (err) { return res.status(500).json({ error: err.message }) }` with:

```typescript
catch (err) {
  console.error('Error:', err) // Log full error server-side
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message
  return res.status(500).json({ success: false, error: message })
}
```

---

## Sprint 5: Refresh Tokens + Validation

### Step 5.1: Implement Refresh Endpoint

**File:** `src/routes/auth.ts` — Add new route:

```typescript
router.post('/refresh', refreshController)
```

**File:** `src/controllers/auth.ts` — Add new function:

```typescript
export const refresh = async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  
  if (!refresh_token) {
    return res.status(400).json({ success: false, error: 'Refresh token required' })
  }
  
  // Use Supabase to refresh
  const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token })
  
  if (error) {
    return res.status(401).json({ success: false, error: 'Invalid refresh token' })
  }
  
  // Re-issue your own JWT with new Supabase access token
  // ... (same pattern as login, using the user profile)
  
  return res.json({ success: true, token: newJwt, refresh_token: data.session.refresh_token })
}
```

### Step 5.2: Auto-Refresh in Frontend

**File:** `src/lib/api.ts` — Modify `apiGet` and `apiPost`:

```typescript
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<ApiResponse> {
  const token = getAuthToken()
  
  let response = await fetch(url, { ...options, headers: { ...headers, Authorization: `Bearer ${token}` } })
  
  // If 401, try refresh
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('iris_refresh_token')
    if (refreshToken) {
      const refreshRes = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      
      if (refreshRes.ok) {
        const { token: newToken, refresh_token: newRefresh } = await refreshRes.json()
        setAuthToken(newToken)
        localStorage.setItem('iris_refresh_token', newRefresh)
        
        // Retry original request
        response = await fetch(url, { ...options, headers: { ...headers, Authorization: `Bearer ${newToken}` } })
      } else {
        clearAuthToken()
        window.location.href = '/login'
      }
    }
  }
  
  return response.json()
}
```

### Step 5.3: Add Zod Validation

**New file:** `src/lib/validators.ts`

```typescript
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const feePaymentSchema = z.object({
  student_id: z.string().uuid(),
  fee_structure_id: z.string().uuid(),
  amount: z.number().positive(),
})

// ... add validators for all POST endpoints
```

Apply to all route handlers: `const parsed = schema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: parsed.error.issues })`

---

## Sprint 6: Real-time + Push

### Step 6.1: FCM Setup

1. Create Firebase project at https://console.firebase.google.com
2. Add Android/iOS apps in project settings
3. Get server key from Cloud Messaging tab
4. Set `FCM_SERVER_KEY` in Netlify env vars

### Step 6.2: Device Token Registration

**New table:** Add to `supabase_setup.sql`:

```sql
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL, -- 'web', 'android', 'ios'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Step 6.3: Socket.io Production

**File:** `netlify.toml` — Add WebSocket support:

```toml
[[redirects]]
  from = "/socket.io/*"
  to = "/.netlify/functions/socket/:splat"
  status = 200
```

---

## Sprint 7-8: Mobile App

### Step 7.1: Initialize Expo Project

```bash
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
npx expo install expo-router expo-camera expo-location expo-local-authentication
```

### Step 7.2: Follow `mobile_screens_spec.md`

The spec at `C:\Users\khushal\Desktop\new iris\mobile_screens_spec.md` (1916 lines) has full screen-by-screen specs. Implement screens in this order:

1. Login + Splash (Day 1-2)
2. Student Dashboard (Day 3)
3. Attendance + QR Scanner (Day 4-5)
4. Fees + Payment (Day 6-7)
5. Timetable (Day 8)
6. Library (Day 9)
7. Canteen (Day 10)
8. Notifications (Day 11)
9. Profile + Settings (Day 12)
10. Parent Dashboard (Day 13-14)

---

## Sprint 9-10: AI & Analytics

### Step 9.1: Real AI Concierge

**File:** `src/controllers/aiController.ts`

Replace mock responses with real LLM calls:

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const chat = async (req: Request, res: Response) => {
  const { message, conversationId } = req.body
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: 'You are IRIS, an AI assistant for campus management. Be helpful and concise.',
    messages: [{ role: 'user', content: message }],
  })
  
  return res.json({ success: true, reply: response.content[0].text })
}
```

### Step 9.2: Predictive Analytics

**New file:** `src/services/predictiveModel.ts`

Use simple statistical models (no ML framework needed initially):

```typescript
export function predictDropoutRisk(student: any): number {
  // Factors: attendance rate, fee payment timeliness, exam scores
  const attendanceScore = student.attendance_pct / 100
  const feeScore = student.fees_paid_pct / 100
  const examScore = student.avg_exam_score / 100
  
  // Weighted risk score (0-1, higher = more risk)
  const risk = 1 - (attendanceScore * 0.4 + feeScore * 0.3 + examScore * 0.3)
  return Math.round(risk * 100) / 100
}
```

---

## Architecture Decision Record

### Decision: Where to deploy the Express backend?

| Option | Pros | Cons |
|:---|:---|:---|
| **A. Separate service (Railway/Render)** | Minimal code changes, Express already works, independent scaling | Two deployments to manage, CORS setup needed |
| **B. Consolidate into Next.js API routes** | Single deployment, no CORS, simpler ops | Major refactor (all controllers → API routes), 4800+ lines to migrate |
| **C. Netlify Functions** | Serverless, scales to zero | Cold starts, 10s timeout limit (Express routes may exceed) |

**Recommendation:** Option A — Deploy Express on Railway, set `NEXT_PUBLIC_API_URL=https://your-app.railway.app/api/v1`. The Netlify frontend already proxies via `next.config.mjs` rewrites. This requires zero code changes.

### Decision: JWT strategy

| Option | Pros | Cons |
|:---|:---|:---|
| **A. Self-signed JWTs (current)** | Full control, works with RBAC middleware | RLS bypassed, two token systems |
| **B. Pass Supabase tokens through** | RLS works natively, single token system | Fingerprint binding lost, less control |
| **C. Hybrid: self-signed + Supabase for RLS** | Best of both | More complexity |

**Recommendation:** Option C — Keep self-signed JWTs for API auth (they carry `institution_id`, `role`, `fingerprint`). Use `supabaseAdmin` (service role) for all DB queries. This is already how the codebase works. RLS is a safety net, not the primary auth mechanism.

---

## Summary: Sprint-by-Sprint Deliverables

| Sprint | Hours | Files Changed | New Files | Key Milestone |
|:---|:---|:---|:---|:---|
| **1** | 34h | `login/page.tsx`, `auth.ts`, `auth.ts (middleware)`, `settings/route.ts`, 59 token files | `supabase-browser.ts`, `auth-storage.ts` | Real Supabase Auth, no sandbox bypass |
| **2** | 24h | `campusCore.ts`, `student/fees/page.tsx`, `parent/fees/page.tsx`, `student/wallet/page.tsx` | `razorpay.ts` | Real Razorpay payments |
| **3** | 17h | `campusCore.ts`, `netlify.toml` | `qrCron.ts`, `qr-rotate.mjs` | Rotating QR attendance |
| **4** | 17h | 4 API routes, all controllers, `netlify.toml` | — | RLS enforced, CSP headers |
| **5** | 17h | `auth.ts`, `api.ts`, all POST routes | `validators.ts` | Refresh tokens, input validation |
| **6** | 21h | `netlify.toml`, controllers | `device_tokens` table | Push notifications, Socket.io |
| **7-8** | 92h | — | `mobile/` directory | Expo mobile app MVP |
| **9-10** | 40h | `aiController.ts` | `predictiveModel.ts`, `naacAutomation.ts` | Production AI, analytics |
