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
