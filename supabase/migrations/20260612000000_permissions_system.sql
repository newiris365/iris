-- IRIS 365 Permissions System
-- Feature toggles per institution + Role-based module permissions

-- ============================================================
-- 1. INSTITUTION FEATURES (Feature Toggles)
-- ============================================================
CREATE TABLE IF NOT EXISTS institution_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  feature_key VARCHAR(50) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(institution_id, feature_key)
);

CREATE INDEX idx_institution_features_inst ON institution_features(institution_id);
CREATE INDEX idx_institution_features_key ON institution_features(feature_key);

-- ============================================================
-- 2. MODULE PERMISSIONS (Role-Based Access Control)
-- ============================================================
CREATE TABLE IF NOT EXISTS module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  can_read BOOLEAN NOT NULL DEFAULT true,
  can_write BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(institution_id, role, module)
);

CREATE INDEX idx_module_permissions_inst ON module_permissions(institution_id);
CREATE INDEX idx_module_permissions_role ON module_permissions(role);

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================
ALTER TABLE institution_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_permissions ENABLE ROW LEVEL SECURITY;

-- SuperAdmin can see all, others see their own institution
DROP POLICY IF EXISTS "institution_features_select" ON institution_features;
CREATE POLICY "institution_features_select" ON institution_features
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

DROP POLICY IF EXISTS "institution_features_insert" ON institution_features;
CREATE POLICY "institution_features_insert" ON institution_features
  FOR INSERT WITH CHECK (
    get_auth_user_role() = 'Admin'
    AND institution_id = get_auth_institution_id()
  );

DROP POLICY IF EXISTS "institution_features_update" ON institution_features;
CREATE POLICY "institution_features_update" ON institution_features
  FOR UPDATE USING (
    get_auth_user_role() = 'Admin'
    AND institution_id = get_auth_institution_id()
  );

DROP POLICY IF EXISTS "institution_features_delete" ON institution_features;
CREATE POLICY "institution_features_delete" ON institution_features
  FOR DELETE USING (
    get_auth_user_role() = 'SuperAdmin'
  );

DROP POLICY IF EXISTS "module_permissions_select" ON module_permissions;
CREATE POLICY "module_permissions_select" ON module_permissions
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

DROP POLICY IF EXISTS "module_permissions_insert" ON module_permissions;
CREATE POLICY "module_permissions_insert" ON module_permissions
  FOR INSERT WITH CHECK (
    get_auth_user_role() = 'SuperAdmin'
    OR get_auth_user_role() = 'Admin'
  );

DROP POLICY IF EXISTS "module_permissions_update" ON module_permissions;
CREATE POLICY "module_permissions_update" ON module_permissions
  FOR UPDATE USING (
    get_auth_user_role() = 'SuperAdmin'
    OR get_auth_user_role() = 'Admin'
  );

DROP POLICY IF EXISTS "module_permissions_delete" ON module_permissions;
CREATE POLICY "module_permissions_delete" ON module_permissions
  FOR DELETE USING (
    get_auth_user_role() = 'SuperAdmin'
  );


-- ============================================================
-- 4. SEED DATA: All features enabled for existing institutions
-- ============================================================
INSERT INTO institution_features (institution_id, feature_key, enabled)
SELECT i.id, f.feature_key, true
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard'),
  ('admissions'),
  ('students'),
  ('attendance'),
  ('timetable'),
  ('fees'),
  ('exams'),
  ('canteen'),
  ('hostel'),
  ('library'),
  ('placements'),
  ('hr'),
  ('gate'),
  ('gym'),
  ('transit'),
  ('events'),
  ('notices'),
  ('idcards'),
  ('ai_concierge'),
  ('obe'),
  ('naac'),
  ('faculty_development'),
  ('achievements'),
  ('director'),
  ('parent_portal')
) AS f(feature_key)
ON CONFLICT (institution_id, feature_key) DO NOTHING;

-- ============================================================
-- 5. SEED DATA: Default role permissions per institution
-- ============================================================
-- Admin: full CRUD on all modules
INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Admin', m.module, true, true, true
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard'), ('admissions'), ('students'), ('attendance'), ('timetable'),
  ('fees'), ('exams'), ('canteen'), ('hostel'), ('library'), ('placements'),
  ('hr'), ('gate'), ('gym'), ('transit'), ('events'), ('notices'), ('idcards'),
  ('ai_concierge'), ('obe'), ('naac'), ('faculty_development'), ('achievements'),
  ('director'), ('parent_portal')
) AS m(module)
ON CONFLICT (institution_id, role, module) DO NOTHING;

-- Staff/Teacher: read + write on academic modules, read on others
INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Staff', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('students', true), ('attendance', true), ('timetable', true),
  ('exams', true), ('notices', true), ('obe', true), ('library', true),
  ('canteen', false), ('hostel', false), ('placements', false), ('hr', false),
  ('gate', false), ('gym', false), ('transit', false), ('events', false),
  ('idcards', false), ('ai_concierge', false), ('naac', false),
  ('admissions', false), ('faculty_development', true), ('achievements', false),
  ('director', false), ('parent_portal', false), ('fees', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;

INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Teacher', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('students', true), ('attendance', true), ('timetable', true),
  ('exams', true), ('obe', true), ('gym', true), ('library', true),
  ('canteen', false), ('hostel', false), ('placements', false), ('hr', false),
  ('gate', false), ('transit', false), ('events', false), ('notices', false),
  ('idcards', false), ('ai_concierge', false), ('naac', false),
  ('admissions', false), ('faculty_development', false), ('achievements', false),
  ('director', false), ('parent_portal', false), ('fees', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;

-- Student: read on most modules, write on limited
INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Student', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('attendance', true), ('timetable', true), ('fees', true),
  ('exams', true), ('canteen', true), ('hostel', true), ('library', true),
  ('placements', true), ('events', true), ('notices', true), ('idcards', true),
  ('gym', true), ('transit', true), ('ai_concierge', true),
  ('students', false), ('admissions', false), ('hr', false), ('gate', false),
  ('obe', false), ('naac', false), ('faculty_development', false),
  ('achievements', false), ('director', false), ('parent_portal', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;

-- Warden: read + write on hostel/gate, read on others
INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Warden', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('hostel', true), ('gate', true), ('notices', true),
  ('students', true), ('attendance', true),
  ('canteen', false), ('library', false), ('placements', false), ('hr', false),
  ('gym', false), ('transit', false), ('events', false), ('idcards', false),
  ('ai_concierge', false), ('obe', false), ('naac', false),
  ('admissions', false), ('faculty_development', false), ('achievements', false),
  ('director', false), ('parent_portal', false), ('fees', false), ('timetable', false),
  ('exams', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;

-- Parent: read-only on child-related modules
INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Parent', m.module, true, false, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard'), ('attendance'), ('fees'), ('exams'), ('notices'), ('hostel')
) AS m(module)
ON CONFLICT (institution_id, role, module) DO NOTHING;

-- Security: read + write on gate, read on transit
INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Security', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('gate', true), ('transit', true), ('notices', true),
  ('canteen', false), ('hostel', false), ('library', false), ('placements', false),
  ('hr', false), ('gym', false), ('events', false), ('idcards', false),
  ('ai_concierge', false), ('obe', false), ('naac', false),
  ('admissions', false), ('faculty_development', false), ('achievements', false),
  ('director', false), ('parent_portal', false), ('fees', false), ('timetable', false),
  ('students', false), ('attendance', false), ('exams', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;

-- Vendor: read + write on canteen only
INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Vendor', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('canteen', true),
  ('admissions', false), ('students', false), ('attendance', false), ('timetable', false),
  ('fees', false), ('exams', false), ('hostel', false), ('library', false),
  ('placements', false), ('hr', false), ('gate', false), ('gym', false),
  ('transit', false), ('events', false), ('notices', false), ('idcards', false),
  ('ai_concierge', false), ('obe', false), ('naac', false),
  ('faculty_development', false), ('achievements', false), ('director', false),
  ('parent_portal', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;

-- Driver: read + write on transit, read on dashboard
INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'Driver', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('transit', true),
  ('admissions', false), ('students', false), ('attendance', false), ('timetable', false),
  ('fees', false), ('exams', false), ('canteen', false), ('hostel', false),
  ('library', false), ('placements', false), ('hr', false), ('gate', false),
  ('gym', false), ('events', false), ('notices', false), ('idcards', false),
  ('ai_concierge', false), ('obe', false), ('naac', false),
  ('faculty_development', false), ('achievements', false), ('director', false),
  ('parent_portal', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;

-- ============================================================
-- 6. UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_permissions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_institution_features_updated ON institution_features;
CREATE TRIGGER trigger_institution_features_updated
  BEFORE UPDATE ON institution_features
  FOR EACH ROW EXECUTE FUNCTION update_permissions_timestamp();

DROP TRIGGER IF EXISTS trigger_module_permissions_updated ON module_permissions;
CREATE TRIGGER trigger_module_permissions_updated
  BEFORE UPDATE ON module_permissions
  FOR EACH ROW EXECUTE FUNCTION update_permissions_timestamp();

