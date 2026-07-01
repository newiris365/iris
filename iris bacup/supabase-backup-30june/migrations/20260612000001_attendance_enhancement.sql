-- IRIS 365 Attendance Enhancement Migration
-- QR Token rotation, Biometric/RFID device management, Attendance method activation

-- ============================================================
-- 1. QR TOKENS TABLE (for rotating QR codes)
-- ============================================================
CREATE TABLE IF NOT EXISTS qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rotated_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_qr_tokens_session ON qr_tokens(session_id);
CREATE INDEX idx_qr_tokens_hash ON qr_tokens(token_hash);
CREATE INDEX idx_qr_tokens_active ON qr_tokens(is_active, expires_at);

-- ============================================================
-- 2. ATTENDANCE SESSIONS: Add is_active, closed_at, auto_close fields
-- ============================================================
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS qr_rotate_interval INT DEFAULT 5; -- minutes
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS geo_lat DOUBLE PRECISION;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS geo_lng DOUBLE PRECISION;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS geo_radius INT DEFAULT 200; -- meters

-- ============================================================
-- 3. BIOMETRIC / RFID DEVICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  device_name VARCHAR(100) NOT NULL,
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('biometric', 'rfid', 'hybrid')),
  device_serial VARCHAR(100) NOT NULL,
  api_key VARCHAR(128) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_heartbeat TIMESTAMPTZ,
  firmware_version VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(institution_id, device_serial)
);

CREATE INDEX idx_attendance_devices_inst ON attendance_devices(institution_id);

-- ============================================================
-- 4. DEVICE ATTENDANCE LOGS (raw log from biometric/RFID devices)
-- ============================================================
CREATE TABLE IF NOT EXISTS device_attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES attendance_devices(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE SET NULL,
  identifier_type VARCHAR(20) NOT NULL CHECK (identifier_type IN ('fingerprint', 'rfid_card', 'face', 'pin')),
  identifier_value VARCHAR(200) NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  matched BOOLEAN NOT NULL DEFAULT false,
  match_confidence DECIMAL(5,2),
  raw_payload JSONB DEFAULT '{}'::jsonb,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_logs_device ON device_attendance_logs(device_id);
CREATE INDEX idx_device_logs_student ON device_attendance_logs(student_id);

-- ============================================================
-- 5. ATTENDANCE METHODS CONFIGURATION (per institution)
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  method_key VARCHAR(20) NOT NULL CHECK (method_key IN ('qr', 'biometric', 'rfid', 'manual')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  -- QR config: { rotate_interval_minutes, geo_radius, geo_lat, geo_lng }
  -- Biometric config: { require_session, auto_match }
  -- RFID config: { require_session, allowed_device_ids }
  -- Manual config: { allowed_roles }
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(institution_id, method_key)
);

CREATE INDEX idx_attendance_methods_inst ON attendance_methods(institution_id);

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================
ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qr_tokens_select" ON qr_tokens FOR SELECT USING (
  institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
);
CREATE POLICY "qr_tokens_insert" ON qr_tokens FOR INSERT WITH CHECK (
  get_auth_user_role() IN ('Admin', 'Staff', 'SuperAdmin')
);
CREATE POLICY "qr_tokens_update" ON qr_tokens FOR UPDATE USING (
  institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
);

CREATE POLICY "attendance_devices_select" ON attendance_devices FOR SELECT USING (
  institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
);
CREATE POLICY "attendance_devices_insert" ON attendance_devices FOR INSERT WITH CHECK (
  get_auth_user_role() IN ('Admin', 'SuperAdmin')
);
CREATE POLICY "attendance_devices_update" ON attendance_devices FOR UPDATE USING (
  institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
);

CREATE POLICY "device_logs_select" ON device_attendance_logs FOR SELECT USING (
  institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
);
CREATE POLICY "device_logs_insert" ON device_attendance_logs FOR INSERT WITH CHECK (
  institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
);

CREATE POLICY "attendance_methods_select" ON attendance_methods FOR SELECT USING (
  institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
);
CREATE POLICY "attendance_methods_insert" ON attendance_methods FOR INSERT WITH CHECK (
  get_auth_user_role() IN ('Admin', 'SuperAdmin')
);
CREATE POLICY "attendance_methods_update" ON attendance_methods FOR UPDATE USING (
  get_auth_user_role() IN ('Admin', 'SuperAdmin')
  OR (get_auth_user_role() = 'Director' AND institution_id = get_auth_institution_id())
);

-- ============================================================
-- 7. SEED: Default attendance methods for existing institutions
-- ============================================================
INSERT INTO attendance_methods (institution_id, method_key, is_enabled, config)
SELECT i.id, m.method_key, m.enabled, m.config::jsonb
FROM institutions i
CROSS JOIN (VALUES
  ('qr', true, '{"rotate_interval_minutes": 5, "geo_radius": 200}'),
  ('biometric', true, '{"require_session": true, "auto_match": true}'),
  ('rfid', true, '{"require_session": true, "allowed_device_ids": []}'),
  ('manual', true, '{"allowed_roles": ["Admin", "Staff", "SuperAdmin"]}')
) AS m(method_key, enabled, config)
ON CONFLICT (institution_id, method_key) DO NOTHING;

-- ============================================================
-- 8. UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_device_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_attendance_devices_updated
  BEFORE UPDATE ON attendance_devices
  FOR EACH ROW EXECUTE FUNCTION update_device_timestamp();

CREATE TRIGGER trigger_attendance_methods_updated
  BEFORE UPDATE ON attendance_methods
  FOR EACH ROW EXECUTE FUNCTION update_device_timestamp();
