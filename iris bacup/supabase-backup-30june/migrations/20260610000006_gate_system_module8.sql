-- ============================================================
-- MODULE 8: IRIS Smart Gate — Extended Schema & New Tables
-- ============================================================

-- 1. CREATE parking_logs TABLE
CREATE TABLE IF NOT EXISTS parking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  in_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  out_time TIMESTAMPTZ,
  slot_number TEXT,
  pass_qr TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. CREATE emergency_muster TABLE
CREATE TABLE IF NOT EXISTS emergency_muster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  trigger_type TEXT CHECK (trigger_type IN ('fire', 'earthquake', 'drill', 'other')),
  trigger_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREATE muster_responses TABLE
CREATE TABLE IF NOT EXISTS muster_responses (
  muster_id UUID REFERENCES emergency_muster(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'unaccounted' CHECK (status IN ('safe', 'unaccounted')),
  marked_safe_at TIMESTAMPTZ,
  location TEXT,
  PRIMARY KEY (muster_id, student_id)
);

-- 4. CREATE contractor_profiles TABLE
CREATE TABLE IF NOT EXISTS contractor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact TEXT,
  id_proof_url TEXT,
  work_types TEXT[] DEFAULT '{}'::text[],
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. CREATE work_permits TABLE
CREATE TABLE IF NOT EXISTS work_permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  scope TEXT NOT NULL,
  location TEXT NOT NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  entry_pass_qr TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. CREATE intercom_calls TABLE
CREATE TABLE IF NOT EXISTS intercom_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  called_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  answered BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT false,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_parking_logs_institution ON parking_logs(institution_id);
CREATE INDEX IF NOT EXISTS idx_emergency_muster_institution ON emergency_muster(institution_id);
CREATE INDEX IF NOT EXISTS idx_muster_responses_student ON muster_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_institution ON contractor_profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_work_permits_contractor ON work_permits(contractor_id);
CREATE INDEX IF NOT EXISTS idx_intercom_calls_host ON intercom_calls(host_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE parking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_muster ENABLE ROW LEVEL SECURITY;
ALTER TABLE muster_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE intercom_calls ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_isolation_parking_logs ON parking_logs;
CREATE POLICY tenant_isolation_parking_logs ON parking_logs
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_emergency_muster ON emergency_muster;
CREATE POLICY tenant_isolation_emergency_muster ON emergency_muster
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_muster_responses ON muster_responses;
CREATE POLICY tenant_isolation_muster_responses ON muster_responses
  USING (
    EXISTS (
      SELECT 1 FROM emergency_muster
      WHERE emergency_muster.id = muster_responses.muster_id
      AND emergency_muster.institution_id = get_auth_institution_id()
    )
  );

DROP POLICY IF EXISTS tenant_isolation_contractor_profiles ON contractor_profiles;
CREATE POLICY tenant_isolation_contractor_profiles ON contractor_profiles
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_work_permits ON work_permits;
CREATE POLICY tenant_isolation_work_permits ON work_permits
  USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles
      WHERE contractor_profiles.id = work_permits.contractor_id
      AND contractor_profiles.institution_id = get_auth_institution_id()
    )
  );

DROP POLICY IF EXISTS tenant_isolation_intercom_calls ON intercom_calls;
CREATE POLICY tenant_isolation_intercom_calls ON intercom_calls
  USING (institution_id = get_auth_institution_id());

-- ============================================================
-- SEED MOCK DATA
-- ============================================================
-- Seed Contractor Profiles
INSERT INTO contractor_profiles (id, institution_id, company_name, contact, work_types, is_approved)
VALUES
  ('c5000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Apex Plumbing Services', '+91 99887 76655', ARRAY['Plumbing', 'Drainage'], true),
  ('c5000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'VoltTech Electricals', '+91 99887 76656', ARRAY['Electricals', 'Wiring', 'AC Service'], true)
ON CONFLICT (id) DO NOTHING;
