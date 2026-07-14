-- Migration: Create missing tables from core schema setup
-- Academic Calendar, Bus Tracking Archive, Employees, Gate Blacklist, Gate Incidents

-- ============================================================
-- 1. ACADEMIC CALENDAR
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    event_type VARCHAR(40) NOT NULL CHECK (event_type IN (
        'semester_start', 'semester_end', 'exam_start', 'exam_end',
        'holiday', 'result_date', 'fee_due', 'admission_start',
        'admission_end', 'counseling', 'orientation', 'vacation',
        'internal_exam', 'project_submission', 'other'
    )),
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    semester INTEGER,
    batch_year VARCHAR(10),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule VARCHAR(100),
    color VARCHAR(20) DEFAULT '#6C2BD9',
    is_published BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE academic_calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage academic calendar" ON academic_calendar;
CREATE POLICY "Admin can manage academic calendar" ON academic_calendar
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

DROP POLICY IF EXISTS "Everyone can view academic calendar" ON academic_calendar;
CREATE POLICY "Everyone can view academic calendar" ON academic_calendar
    FOR SELECT USING (
        is_published = true
        AND institution_id = get_auth_institution_id()
    );

-- ============================================================
-- 2. BUS TRACKING ARCHIVE
-- ============================================================
CREATE TABLE IF NOT EXISTS bus_tracking_archive (LIKE bus_tracking INCLUDING ALL);

-- ============================================================
-- 3. EMPLOYEES
-- ============================================================
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

-- ============================================================
-- 4. GATE BLACKLIST
-- ============================================================
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

-- ============================================================
-- 5. GATE INCIDENTS
-- ============================================================
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
