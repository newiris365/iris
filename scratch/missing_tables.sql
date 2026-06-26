-- ==========================================================
-- SECTION: AUTOMATICALLY GENERATED MISSING SCHEMAS
-- ==========================================================

CREATE TABLE IF NOT EXISTS course_registrations (
    academic_year TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    dropped_at TIMESTAMP WITH TIME ZONE,
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE,
    semester INTEGER,
    status VARCHAR(100),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE course_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS course_registrations_policy ON course_registrations;
CREATE POLICY course_registrations_policy ON course_registrations
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE INDEX IF NOT EXISTS idx_course_registrations_inst ON course_registrations(institution_id);

----------------------------------------------------------

CREATE TABLE IF NOT EXISTS daily_attendance_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_percent TEXT,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE daily_attendance_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS daily_attendance_summary_policy ON daily_attendance_summary;
CREATE POLICY daily_attendance_summary_policy ON daily_attendance_summary
    FOR ALL USING (true);

----------------------------------------------------------

CREATE TABLE IF NOT EXISTS daily_fee_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_collected DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE daily_fee_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS daily_fee_summary_policy ON daily_fee_summary;
CREATE POLICY daily_fee_summary_policy ON daily_fee_summary
    FOR ALL USING (true);

----------------------------------------------------------

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    avatar_url TEXT,
    department TEXT,
    designation TEXT,
    employee_id UUID,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS employees_policy ON employees;
CREATE POLICY employees_policy ON employees
    FOR ALL USING (true);

----------------------------------------------------------

CREATE TABLE IF NOT EXISTS gate_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE gate_blacklist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gate_blacklist_policy ON gate_blacklist;
CREATE POLICY gate_blacklist_policy ON gate_blacklist
    FOR ALL USING (true);

----------------------------------------------------------

CREATE TABLE IF NOT EXISTS gate_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT,
    incident_type VARCHAR(100),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    location VARCHAR(100),
    status VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE gate_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gate_incidents_policy ON gate_incidents;
CREATE POLICY gate_incidents_policy ON gate_incidents
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE INDEX IF NOT EXISTS idx_gate_incidents_inst ON gate_incidents(institution_id);

----------------------------------------------------------

CREATE TABLE IF NOT EXISTS hostel_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkin_time TEXT,
    date DATE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE hostel_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hostel_attendance_policy ON hostel_attendance;
CREATE POLICY hostel_attendance_policy ON hostel_attendance
    FOR ALL USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()) OR get_auth_user_role() = 'SuperAdmin');
CREATE INDEX IF NOT EXISTS idx_hostel_attendance_student ON hostel_attendance(student_id);

----------------------------------------------------------

CREATE TABLE IF NOT EXISTS hostel_settings (
    checkin_end_time TEXT,
    checkin_start_time TEXT,
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    qr_code_secret TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE hostel_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hostel_settings_policy ON hostel_settings;
CREATE POLICY hostel_settings_policy ON hostel_settings
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE INDEX IF NOT EXISTS idx_hostel_settings_inst ON hostel_settings(institution_id);

----------------------------------------------------------

CREATE TABLE IF NOT EXISTS mess_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posted_at TIMESTAMP WITH TIME ZONE,
    warden_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE mess_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mess_notices_policy ON mess_notices;
CREATE POLICY mess_notices_policy ON mess_notices
    FOR ALL USING (true);

----------------------------------------------------------

CREATE TABLE IF NOT EXISTS payment_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payment_config_policy ON payment_config;
CREATE POLICY payment_config_policy ON payment_config
    FOR ALL USING (true);

----------------------------------------------------------

CREATE TABLE IF NOT EXISTS student_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(12, 2),
    late_fee DECIMAL(12, 2),
    paid_amount DECIMAL(12, 2),
    total_amount DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS student_fees_policy ON student_fees;
CREATE POLICY student_fees_policy ON student_fees
    FOR ALL USING (true);

----------------------------------------------------------

CREATE TABLE IF NOT EXISTS superadmin_notification_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_read BOOLEAN DEFAULT TRUE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE superadmin_notification_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS superadmin_notification_reads_policy ON superadmin_notification_reads;
CREATE POLICY superadmin_notification_reads_policy ON superadmin_notification_reads
    FOR ALL USING (true);

----------------------------------------------------------

CREATE TABLE IF NOT EXISTS superadmin_notifications (
    body TEXT,
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    sent_by TEXT,
    target_campus_ids TEXT,
    title VARCHAR(255),
    type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE superadmin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS superadmin_notifications_policy ON superadmin_notifications;
CREATE POLICY superadmin_notifications_policy ON superadmin_notifications
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE INDEX IF NOT EXISTS idx_superadmin_notifications_inst ON superadmin_notifications(institution_id);

----------------------------------------------------------

