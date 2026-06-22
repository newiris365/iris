-- =========================================================================
-- PERMISSION AUDIT LOGGING MODULE
-- =========================================================================

CREATE TABLE IF NOT EXISTS permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  module VARCHAR(100) NOT NULL,
  action VARCHAR(20) NOT NULL,
  path VARCHAR(255),
  ip_address VARCHAR(50),
  user_agent VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Director can view permission audit logs"
  ON permission_audit_log FOR SELECT
  USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
    AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_institution ON permission_audit_log(institution_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_user ON permission_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_created_at ON permission_audit_log(created_at);
