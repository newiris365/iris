-- Migration: Module 8 (Gate Security Module)
-- Target: Supabase / PostgreSQL

-- 1. Drop old incidents table to overwrite with detailed version
DROP TABLE IF EXISTS security_incidents CASCADE;

-- 2. Create tables
CREATE TABLE IF NOT EXISTS gate_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  person_id uuid,
  person_type TEXT CHECK (person_type IN ('student','staff','visitor')),
  person_name TEXT,
  entry_method TEXT CHECK (entry_method IN ('qr','biometric','rfid','manual','visitor_pass')),
  direction TEXT CHECK (direction IN ('in','out')),
  gate_number TEXT DEFAULT 'main',
  timestamp TIMESTAMPTZ DEFAULT now(),
  authorized_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  photo_url TEXT
);

CREATE TABLE IF NOT EXISTS rfid_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  card_uid TEXT UNIQUE NOT NULL,
  person_id uuid NOT NULL,
  person_type TEXT CHECK (person_type IN ('student','staff')),
  issued_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT
);

CREATE TABLE IF NOT EXISTS visitor_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  visitor_email TEXT,
  visitor_id_type TEXT,
  visitor_id_number TEXT,
  visitor_photo_url TEXT,
  host_id uuid,
  host_type TEXT CHECK (host_type IN ('student','staff')),
  host_name TEXT,
  purpose TEXT NOT NULL,
  pass_number TEXT UNIQUE,
  qr_code TEXT UNIQUE,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  reported_by uuid REFERENCES users(id) ON DELETE SET NULL,
  incident_type TEXT, -- theft, trespass, damage, overstay, other
  description TEXT NOT NULL,
  location TEXT,
  severity TEXT CHECK (severity IN ('low','medium','high','critical')) DEFAULT 'low',
  photo_urls TEXT[],
  status TEXT DEFAULT 'open', -- open, investigating, resolved
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blacklisted_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  id_number TEXT,
  photo_url TEXT,
  reason TEXT,
  added_by uuid REFERENCES users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS gate_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  guard_id uuid REFERENCES users(id) ON DELETE CASCADE,
  shift_start TIMESTAMPTZ,
  shift_end TIMESTAMPTZ,
  gate_number TEXT DEFAULT 'main',
  handover_notes TEXT
);

CREATE TABLE IF NOT EXISTS campus_occupancy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT now(),
  students_inside INTEGER DEFAULT 0,
  staff_inside INTEGER DEFAULT 0,
  visitors_inside INTEGER DEFAULT 0
);

-- 3. Enable RLS
ALTER TABLE gate_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfid_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklisted_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_occupancy ENABLE ROW LEVEL SECURITY;

-- 4. Create Isolation Policies (using auth helper)
DROP POLICY IF EXISTS tenant_gate_entries_policy ON gate_entries;
CREATE POLICY tenant_gate_entries_policy ON gate_entries
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_rfid_cards_policy ON rfid_cards;
CREATE POLICY tenant_rfid_cards_policy ON rfid_cards
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_visitor_passes_policy ON visitor_passes;
CREATE POLICY tenant_visitor_passes_policy ON visitor_passes
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_security_incidents_policy ON security_incidents;
CREATE POLICY tenant_security_incidents_policy ON security_incidents
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_blacklisted_visitors_policy ON blacklisted_visitors;
CREATE POLICY tenant_blacklisted_visitors_policy ON blacklisted_visitors
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_gate_shifts_policy ON gate_shifts;
CREATE POLICY tenant_gate_shifts_policy ON gate_shifts
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_campus_occupancy_policy ON campus_occupancy;
CREATE POLICY tenant_campus_occupancy_policy ON campus_occupancy
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

-- 5. Seed Mock Gate Data
-- A. Register RFID cards
INSERT INTO rfid_cards (id, institution_id, card_uid, person_id, person_type, expiry_date, is_active, is_blocked)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'RFID_KHUSHAL_123',
  'b0000000-0000-0000-0000-000000000006', -- Student Khushal User ID
  'student',
  CURRENT_DATE + INTERVAL '4 years',
  true,
  false
) ON CONFLICT (card_uid) DO NOTHING;

INSERT INTO rfid_cards (id, institution_id, card_uid, person_id, person_type, expiry_date, is_active, is_blocked)
VALUES (
  'e0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'RFID_STAFF_101',
  'b0000000-0000-0000-0000-000000000002', -- Admin/Staff User ID
  'staff',
  CURRENT_DATE + INTERVAL '5 years',
  true,
  false
) ON CONFLICT (card_uid) DO NOTHING;

-- B. Pre-allocate campus occupancy initial records
INSERT INTO campus_occupancy (id, institution_id, timestamp, students_inside, staff_inside, visitors_inside)
VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  now() - INTERVAL '1 hour',
  45,
  12,
  2
) ON CONFLICT (id) DO NOTHING;

-- C. Blacklist mock entries
INSERT INTO blacklisted_visitors (id, institution_id, name, phone, id_number, reason, added_by)
VALUES (
  '60000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Suresh Singhania',
  '+919876543222',
  'Aadhaar: 228844991100',
  'Suspicious activity near hostel block last semester',
  'b0000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;

-- D. Visitor passes seeds
INSERT INTO visitor_passes (id, institution_id, visitor_name, visitor_phone, host_id, host_type, host_name, purpose, pass_number, qr_code, valid_from, valid_until, is_used)
VALUES (
  '70000000-0000-0000-0000-000000001001',
  'a0000000-0000-0000-0000-000000000001',
  'Alok Kumar',
  '+919829123499',
  'b0000000-0000-0000-0000-000000000006', -- Host: Khushal
  'student',
  'Khushal Gehlot',
  'Project Collaboration & Laptop handover',
  'VP-98102',
  'VP-QR-98102',
  now() - INTERVAL '30 minutes',
  now() + INTERVAL '3 hours 30 minutes',
  true
) ON CONFLICT (id) DO NOTHING;

-- E. Seed some activity gate logs
INSERT INTO gate_entries (id, institution_id, person_id, person_type, person_name, entry_method, direction, gate_number, timestamp, reason)
VALUES (
  '80000000-0000-0000-0000-000000005001',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000006',
  'student',
  'Khushal Gehlot',
  'rfid',
  'in',
  'main',
  now() - INTERVAL '45 minutes',
  'Regular check-in'
) ON CONFLICT (id) DO NOTHING;
