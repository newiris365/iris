const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../supabase/migrations');
const seedFile = path.join(__dirname, '../supabase/seed.sql');
const outputFile = path.join(__dirname, '../supabase_setup.sql');
const outputMinFile = path.join(__dirname, '../supabase_setup_min.sql');

const missingSchemasSql = `
-- ==========================================================
-- SECTION: MANUALLY GATED MISSING SCHEMAS & RLS POLICIES
-- ==========================================================

-- 1. course_registrations
CREATE TABLE IF NOT EXISTS course_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    semester INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    dropped_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, course_id, academic_year)
);

ALTER TABLE course_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS course_registrations_policy ON course_registrations;
CREATE POLICY course_registrations_policy ON course_registrations
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE INDEX IF NOT EXISTS idx_course_registrations_inst ON course_registrations(institution_id);
CREATE INDEX IF NOT EXISTS idx_course_registrations_student ON course_registrations(student_id);

-- 2. daily_attendance_summary
CREATE TABLE IF NOT EXISTS daily_attendance_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    attendance_percent DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (institution_id, date)
);

ALTER TABLE daily_attendance_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS daily_attendance_summary_policy ON daily_attendance_summary;
CREATE POLICY daily_attendance_summary_policy ON daily_attendance_summary
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE INDEX IF NOT EXISTS idx_daily_attendance_summary_inst ON daily_attendance_summary(institution_id);

-- 3. daily_fee_summary
CREATE TABLE IF NOT EXISTS daily_fee_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_collected DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (institution_id, date)
);

ALTER TABLE daily_fee_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS daily_fee_summary_policy ON daily_fee_summary;
CREATE POLICY daily_fee_summary_policy ON daily_fee_summary
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE INDEX IF NOT EXISTS idx_daily_fee_summary_inst ON daily_fee_summary(institution_id);

-- 4. employees
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    employee_id VARCHAR(100) NOT NULL UNIQUE,
    department VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS employees_policy ON employees;
CREATE POLICY employees_policy ON employees
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE INDEX IF NOT EXISTS idx_employees_inst ON employees(institution_id);

-- 5. gate_blacklist
CREATE TABLE IF NOT EXISTS gate_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (institution_id, person_id)
);

ALTER TABLE gate_blacklist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gate_blacklist_policy ON gate_blacklist;
CREATE POLICY gate_blacklist_policy ON gate_blacklist
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE INDEX IF NOT EXISTS idx_gate_blacklist_inst ON gate_blacklist(institution_id);

-- 6. gate_incidents
CREATE TABLE IF NOT EXISTS gate_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    incident_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE gate_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gate_incidents_policy ON gate_incidents;
CREATE POLICY gate_incidents_policy ON gate_incidents
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE INDEX IF NOT EXISTS idx_gate_incidents_inst ON gate_incidents(institution_id);

-- 7. hostel_attendance
CREATE TABLE IF NOT EXISTS hostel_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    checkin_time TIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'leave')),
    qr_code_secret TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, date)
);

ALTER TABLE hostel_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hostel_attendance_policy ON hostel_attendance;
CREATE POLICY hostel_attendance_policy ON hostel_attendance
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE INDEX IF NOT EXISTS idx_hostel_attendance_inst ON hostel_attendance(institution_id);
CREATE INDEX IF NOT EXISTS idx_hostel_attendance_student ON hostel_attendance(student_id);

-- 8. hostel_settings
CREATE TABLE IF NOT EXISTS hostel_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE UNIQUE,
    checkin_start_time VARCHAR(20) NOT NULL DEFAULT '19:00',
    checkin_end_time VARCHAR(20) NOT NULL DEFAULT '21:00',
    qr_code_secret TEXT NOT NULL DEFAULT 'WARDEN_CHECKIN_DEFAULT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE hostel_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hostel_settings_policy ON hostel_settings;
CREATE POLICY hostel_settings_policy ON hostel_settings
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE INDEX IF NOT EXISTS idx_hostel_settings_inst ON hostel_settings(institution_id);

-- 9. mess_notices
CREATE TABLE IF NOT EXISTS mess_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    warden_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE mess_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mess_notices_policy ON mess_notices;
CREATE POLICY mess_notices_policy ON mess_notices
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE INDEX IF NOT EXISTS idx_mess_notices_inst ON mess_notices(institution_id);

-- 10. payment_config
CREATE TABLE IF NOT EXISTS payment_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE UNIQUE,
    enabled_methods TEXT[] NOT NULL DEFAULT '{razorpay}',
    razorpay_key_id VARCHAR(255),
    razorpay_key_secret VARCHAR(255),
    bank_account_number VARCHAR(100),
    bank_name VARCHAR(255),
    bank_ifsc VARCHAR(50),
    bank_holder_name VARCHAR(255),
    upi_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payment_config_policy ON payment_config;
CREATE POLICY payment_config_policy ON payment_config
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE INDEX IF NOT EXISTS idx_payment_config_inst ON payment_config(institution_id);

-- 11. student_fees
CREATE TABLE IF NOT EXISTS student_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
    due_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    late_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS student_fees_policy ON student_fees;
CREATE POLICY student_fees_policy ON student_fees
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
CREATE INDEX IF NOT EXISTS idx_student_fees_inst ON student_fees(institution_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_student ON student_fees(student_id);

-- 12. superadmin_notifications
CREATE TABLE IF NOT EXISTS superadmin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(100) NOT NULL DEFAULT 'General Update',
    target_campus_ids UUID[] DEFAULT '{}',
    sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE superadmin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS superadmin_notifications_policy ON superadmin_notifications;
CREATE POLICY superadmin_notifications_policy ON superadmin_notifications
    FOR ALL USING (get_auth_user_role() IN ('Admin', 'SuperAdmin'));

-- 13. superadmin_notification_reads
CREATE TABLE IF NOT EXISTS superadmin_notification_reads (
    notification_id UUID NOT NULL REFERENCES superadmin_notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id, user_id)
);

ALTER TABLE superadmin_notification_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS superadmin_notification_reads_policy ON superadmin_notification_reads;
CREATE POLICY superadmin_notification_reads_policy ON superadmin_notification_reads
    FOR ALL USING (user_id = auth.uid() OR get_auth_user_role() = 'SuperAdmin');

----------------------------------------------------------
`;

try {
  // Read and sort migration files
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sorting alphabetically matches chronological timestamp order

  console.log(`Found ${files.length} migration files.`);

  let consolidatedSql = `-- ==========================================================\n`;
  consolidatedSql += `-- IRIS 365 Consolidated Database Setup Script\n`;
  consolidatedSql += `-- Platform: Multi-tenant Campus Management System\n`;
  consolidatedSql += `-- Target: Supabase (PostgreSQL) SQL Editor\n`;
  consolidatedSql += `-- Generated at: ${new Date().toISOString()}\n`;
  consolidatedSql += `-- ==========================================================\n\n`;

  // 1. Append migrations
  files.forEach(file => {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    consolidatedSql += `-- ==========================================================\n`;
    consolidatedSql += `-- MIGRATION: ${file}\n`;
    consolidatedSql += `-- ==========================================================\n\n`;
    consolidatedSql += content;
    consolidatedSql += `\n\n`;
    console.log(`Consolidated migration: ${file}`);
  });

  // 2. Append custom missing schemas
  consolidatedSql += missingSchemasSql;
  console.log('Appended 13 missing schemas.');

  // 3. Append seed data if it exists
  if (fs.existsSync(seedFile)) {
    consolidatedSql += `-- ==========================================================\n`;
    consolidatedSql += `-- SECTION: SEED DATA\n`;
    consolidatedSql += `-- ==========================================================\n\n`;
    const seedContent = fs.readFileSync(seedFile, 'utf8');
    consolidatedSql += seedContent;
    console.log('Appended seed data.');
  }

  // Write consolidated script to supabase_setup.sql
  fs.writeFileSync(outputFile, consolidatedSql, 'utf8');
  console.log(`Consolidated SQL written successfully to: ${outputFile}`);

  // Also write to supabase_setup_min.sql to make sure they are in sync
  fs.writeFileSync(outputMinFile, consolidatedSql, 'utf8');
  console.log(`Consolidated SQL also written to: ${outputMinFile}`);

} catch (err) {
  console.error('Failed to consolidate migrations:', err);
}
