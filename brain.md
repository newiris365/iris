  # IRIS 365 — Brain (Compressed)
  Campus OS | SIN Education, Jodhpur | v0.9 → v1.0 (production hardening)

  ## STACK
  Next.js(Netlify) | Express+Node(TS) | Supabase(PG+RLS) | Socket.io | React Native+Expo | Razorpay | Anthropic/OpenAI

  ## ROLES (11)
  SuperAdmin, Admin, Student, Teacher, Parent, Director, HostelWarden, Librarian, CanteenVendor, Recruiter, GateSecurity, Applicant

  ## MODULES
  Attendance(QR rotating+biometric+geo-fence) | Fees(Razorpay+installments) | Transit(GPS Socket.io) | Gate(RFID+biometric) | OBE/NAAC(AQAR upload) | AI Concierge(LLM) | Hostel | Library | Canteen(queue ticker) | Placement

  ## RULES (always enforce)
  - All DB queries scoped with `institution_id` (multi-tenant RLS)
  - Resource bookings (gym/library/hostel) → atomic PL/pgSQL + `FOR UPDATE`
  - TypeScript strict — no `any`
  - API routes: `/api/{role}/{resource}`
  - Socket.io rooms: `{institution_id}:{module}`
  - No mock/sandbox code in production paths
  - JWT + SHA-256 fingerprint (User-Agent + IP subnet) in token claims

  ## v1.0 TODO
  Supabase native auth | Razorpay webhook verify | FCM push | Cron jobs | Remove sandbox bypasses

  ## ACTIVE BUGS (fix on test-changes branch, do not commit)

  ### 🔴 CRITICAL
  - BUG-01 [AUTH] API calls returning `Authorization token required. Access Denied.`
    → JWT token not being sent in request headers
    → Fix: ensure all API requests send `Authorization: Bearer <token>` globally via fetch wrapper/axios instance

  - BUG-02 [HOSTEL] Allotment Certificate Download not working
    → Download button on /hostel page does nothing
    → Fix: find certificate download handler, fix API call + file generation/download

  - BUG-03 [AI] IRIS Concierge chatbot not replying
    → Messages sent but no response from LLM
    → Fix: check Anthropic/OpenAI API call in concierge route, fix token/auth/response parsing

  ### 🟡 UI / LOGIC
  - BUG-04 [SOS] "Is your child missing?" SOS block showing on Student dashboard
    → Should only appear on Parent dashboard
    → Fix: add role check — render SOS block only when role === 'Parent'

  - BUG-05 [SUPERADMIN] Institute type College → School conversion not working
    → SuperAdmin settings mein institute type change save nahi ho raha
    → Fix: find institute type update handler, fix API call or DB update

  - BUG-06 [DATA] Student count mismatch — SuperAdmin shows 18 total but HOD shows 12 students + 8 teachers = 20
    → Fix: check count query in SuperAdmin dashboard, ensure it counts only students not all users

  - BUG-07 [TIMETABLE] Timetable Auto-Generator — Department dropdown empty, data not loading
    → Fix: check departments fetch API in timetable generator, fix query or missing institution_id scope

  - BUG-08 [ADMISSIONS] Admission Cycles "Configured Cycles logs" section empty
    → Data exists (Fall 2026, Spring 2027 visible in screenshot) but section appears empty on load
    → Fix: check cycles fetch on component mount, fix API call or state update
    BUG-09 [TRANSIT] "Browse Available Routes" button → 404 error
    → /transit/routes page exist nahi karta ya route missing hai
    → Fix: create the missing routes page OR fix the navigation link to correct path

  BUG-10 [TRANSIT] No Active Bus Subscription — user ko subscription buy karne ka option nahi
    → "No Active Bus Subscription" state mein buy/subscribe button ya flow missing hai
    → Fix: add subscription purchase flow on transit page when user has no active subscription
    BUG-11 [AUTH] Google OAuth - Authentication Failed
    → Error: "invalid request: both auth code and code verifier should be non-empty"
    → PKCE flow broken — code_verifier not being passed/stored correctly during OAuth callback
    → Fix: ensure code_verifier is stored in localStorage/sessionStorage before OAuth redirect
    and retrieved correctly in /auth/callback/route.ts
    BUG-16 [CHATBOT] IRIS Concierge giving Student-specific responses (attendance %) to SuperAdmin role
    → Chatbot should respond based on logged-in user's actual role
    → SuperAdmin should get institution-wide stats, not personal student attendance
    → Fix: check role in aiConciergeService.ts and customize response context based on user.role