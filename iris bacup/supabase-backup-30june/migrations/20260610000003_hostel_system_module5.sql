-- ============================================================
-- MODULE 5: IRIS Hostel — Extended Schema & New Tables
-- ============================================================

-- 1. CREATE roommate_preferences TABLE
CREATE TABLE IF NOT EXISTS roommate_preferences (
  student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  sleep_schedule INTEGER NOT NULL CHECK (sleep_schedule BETWEEN 1 AND 5),
  study_habits INTEGER NOT NULL CHECK (study_habits BETWEEN 1 AND 5),
  cleanliness INTEGER NOT NULL CHECK (cleanliness BETWEEN 1 AND 5),
  noise_tolerance INTEGER NOT NULL CHECK (noise_tolerance BETWEEN 1 AND 5),
  compatibility_score DECIMAL(5, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. CREATE iot_readings TABLE
CREATE TABLE IF NOT EXISTS iot_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  room_id UUID REFERENCES hostel_rooms(id) ON DELETE CASCADE,
  meter_type VARCHAR(50) NOT NULL CHECK (meter_type IN ('electricity', 'water')),
  reading_value DECIMAL(12, 4) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREATE night_rollcalls TABLE
CREATE TABLE IF NOT EXISTS night_rollcalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  block_id UUID REFERENCES hostel_blocks(id) ON DELETE CASCADE,
  floor INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  guard_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  records JSONB DEFAULT '{}'::jsonb
);

-- 4. CREATE wellness_checkins_hostel TABLE
CREATE TABLE IF NOT EXISTS wellness_checkins_hostel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  notes TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_roommate_preferences_institution ON roommate_preferences(institution_id);
CREATE INDEX IF NOT EXISTS idx_iot_readings_room ON iot_readings(room_id);
CREATE INDEX IF NOT EXISTS idx_iot_readings_timestamp ON iot_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_night_rollcalls_block_floor ON night_rollcalls(block_id, floor);
CREATE INDEX IF NOT EXISTS idx_night_rollcalls_date ON night_rollcalls(date);
CREATE INDEX IF NOT EXISTS idx_wellness_checkins_student ON wellness_checkins_hostel(student_id);
CREATE INDEX IF NOT EXISTS idx_wellness_checkins_date ON wellness_checkins_hostel(date);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE roommate_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE night_rollcalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_checkins_hostel ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_isolation_roommate_preferences ON roommate_preferences;
CREATE POLICY tenant_isolation_roommate_preferences ON roommate_preferences
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_iot_readings ON iot_readings;
CREATE POLICY tenant_isolation_iot_readings ON iot_readings
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_night_rollcalls ON night_rollcalls;
CREATE POLICY tenant_isolation_night_rollcalls ON night_rollcalls
  USING (institution_id = get_auth_institution_id());

DROP POLICY IF EXISTS tenant_isolation_wellness_checkins ON wellness_checkins_hostel;
CREATE POLICY tenant_isolation_wellness_checkins ON wellness_checkins_hostel
  USING (institution_id = get_auth_institution_id());
