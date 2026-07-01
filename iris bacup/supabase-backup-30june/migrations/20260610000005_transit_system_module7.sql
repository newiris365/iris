-- ============================================================
-- MODULE 7: IRIS Transit — Extended Schema & New Tables
-- ============================================================

-- 1. CREATE ai_route_suggestions TABLE
CREATE TABLE IF NOT EXISTS ai_route_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  analysis_date DATE DEFAULT CURRENT_DATE,
  suggestions JSONB DEFAULT '[]'::jsonb,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. CREATE carbon_footprint TABLE
CREATE TABLE IF NOT EXISTS carbon_footprint (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  co2_saved_kg DECIMAL DEFAULT 0,
  students_using_bus INTEGER DEFAULT 0,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(institution_id, month)
);

-- 3. CREATE sos_alerts TABLE
CREATE TABLE IF NOT EXISTS sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  alert_type TEXT DEFAULT 'parent',
  lat DECIMAL,
  lng DECIMAL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  resolved_at TIMESTAMPTZ,
  incident_details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. CREATE parking_slots TABLE
CREATE TABLE IF NOT EXISTS parking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  slot_number TEXT NOT NULL,
  zone TEXT NOT NULL,
  is_occupied BOOLEAN DEFAULT false,
  vehicle_number TEXT,
  last_occupied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(institution_id, zone, slot_number)
);

-- 5. CREATE registered_vehicles TABLE
CREATE TABLE IF NOT EXISTS registered_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('two_wheeler', 'four_wheeler')),
  color TEXT,
  model TEXT,
  verified BOOLEAN DEFAULT false,
  pass_qr TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ai_route_suggestions_institution ON ai_route_suggestions(institution_id);
CREATE INDEX IF NOT EXISTS idx_carbon_footprint_institution ON carbon_footprint(institution_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_institution ON sos_alerts(institution_id);
CREATE INDEX IF NOT EXISTS idx_parking_slots_institution ON parking_slots(institution_id);
CREATE INDEX IF NOT EXISTS idx_registered_vehicles_student ON registered_vehicles(student_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE ai_route_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_footprint ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_vehicles ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_isolation_ai_route_suggestions ON ai_route_suggestions;
CREATE POLICY tenant_isolation_ai_route_suggestions ON ai_route_suggestions
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_carbon_footprint ON carbon_footprint;
CREATE POLICY tenant_isolation_carbon_footprint ON carbon_footprint
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_sos_alerts ON sos_alerts;
CREATE POLICY tenant_isolation_sos_alerts ON sos_alerts
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_parking_slots ON parking_slots;
CREATE POLICY tenant_isolation_parking_slots ON parking_slots
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_registered_vehicles ON registered_vehicles;
CREATE POLICY tenant_isolation_registered_vehicles ON registered_vehicles
  USING (institution_id = get_auth_institution_id());

-- ============================================================
-- SEED DATA
-- ============================================================
-- Seed Parking Slots
INSERT INTO parking_slots (institution_id, slot_number, zone, is_occupied)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'A-01', 'Zone A', false),
  ('a0000000-0000-0000-0000-000000000001', 'A-02', 'Zone A', true),
  ('a0000000-0000-0000-0000-000000000001', 'A-03', 'Zone A', false),
  ('a0000000-0000-0000-0000-000000000001', 'B-01', 'Zone B', false),
  ('a0000000-0000-0000-0000-000000000001', 'B-02', 'Zone B', false),
  ('a0000000-0000-0000-0000-000000000001', 'V-01', 'Visitor', false),
  ('a0000000-0000-0000-0000-000000000001', 'V-02', 'Visitor', true)
ON CONFLICT (institution_id, zone, slot_number) DO NOTHING;

-- Seed CO2 foot print data
INSERT INTO carbon_footprint (institution_id, month, co2_saved_kg, students_using_bus, certificate_url)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '2026-04', 1240.50, 120, 'https://supabase.co/storage/v1/object/public/certificates/monthly-co2-2026-04.pdf'),
  ('a0000000-0000-0000-0000-000000000001', '2026-05', 1355.20, 134, 'https://supabase.co/storage/v1/object/public/certificates/monthly-co2-2026-05.pdf')
ON CONFLICT (institution_id, month) DO NOTHING;
