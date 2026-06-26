-- =========================================================================
-- SPRINT 5 DATABASE SCHEMA & SECURITY POLICIES
-- =========================================================================

-- 1. GATE LOCKDOWN STATUS TABLE
CREATE TABLE IF NOT EXISTS gate_lockdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  is_locked_down BOOLEAN DEFAULT FALSE NOT NULL,
  reason TEXT,
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  locked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE gate_lockdown ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Security can manage gate lockdown"
  ON gate_lockdown FOR ALL
  USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
    AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
  );

CREATE POLICY "Everyone authenticated can view gate lockdown"
  ON gate_lockdown FOR SELECT
  USING (
    institution_id = get_auth_institution_id()
  );

CREATE INDEX IF NOT EXISTS idx_gate_lockdown_institution ON gate_lockdown(institution_id);
