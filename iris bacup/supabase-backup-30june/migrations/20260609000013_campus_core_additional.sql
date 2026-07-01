-- Migration: IRIS Campus Core Additional Tables & RLS HARDENING
-- Targets: Supabase (PostgreSQL)

-- 1. ATTENDANCE FRAUD LOGS
CREATE TABLE IF NOT EXISTS attendance_fraud_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    fraud_type VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    flagged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TIMETABLE SUBSTITUTE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS substitute_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_id UUID REFERENCES timetable(id) ON DELETE CASCADE,
    original_teacher_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    substitute_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. FEE INSTALLMENT PLANS
CREATE TABLE IF NOT EXISTS installment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    installments JSONB NOT NULL, -- e.g. [{"due_date": "...", "amount": ...}]
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. STUDENT HEALTH & DROPOUT SCORES
CREATE TABLE IF NOT EXISTS student_health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 100,
    risk_level VARCHAR(30) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    attendance_score INTEGER DEFAULT 100,
    fee_score INTEGER DEFAULT 100,
    academic_score INTEGER DEFAULT 100,
    engagement_score INTEGER DEFAULT 100,
    factors JSONB DEFAULT '{}'::jsonb,
    recommendation TEXT,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PARENT DAILY REPORTS
CREATE TABLE IF NOT EXISTS parent_daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    attendance_status VARCHAR(50),
    current_period TEXT,
    meals_today TEXT,
    gate_in_time TIMESTAMP WITH TIME ZONE,
    gate_out_time TIMESTAMP WITH TIME ZONE,
    canteen_spend DECIMAL(10, 2) DEFAULT 0.00,
    notices_count INTEGER DEFAULT 0,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_date_report UNIQUE (student_id, date)
);

-- 6. SCHOLARSHIP CRITERIA
CREATE TABLE IF NOT EXISTS scholarship_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    min_attendance DECIMAL(5, 2) NOT NULL DEFAULT 75.00,
    min_marks DECIMAL(5, 2) NOT NULL DEFAULT 60.00,
    income_limit DECIMAL(12, 2),
    discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_fraud_logs_student ON attendance_fraud_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_substitute_timetable ON substitute_assignments(timetable_id);
CREATE INDEX IF NOT EXISTS idx_installment_student ON installment_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_student ON student_health_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_student ON parent_daily_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_inst ON scholarship_criteria(institution_id);

-- Enable RLS on all tables
ALTER TABLE attendance_fraud_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitute_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_criteria ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_attendance_fraud_logs_policy ON attendance_fraud_logs;
CREATE POLICY tenant_attendance_fraud_logs_policy ON attendance_fraud_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
              AND (s.institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
        )
    );

DROP POLICY IF EXISTS tenant_substitute_assignments_policy ON substitute_assignments;
CREATE POLICY tenant_substitute_assignments_policy ON substitute_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM timetable t
            WHERE t.id = timetable_id
              AND (t.institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
        )
    );

DROP POLICY IF EXISTS tenant_installment_plans_policy ON installment_plans;
CREATE POLICY tenant_installment_plans_policy ON installment_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
              AND (s.institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
        )
    );

DROP POLICY IF EXISTS tenant_student_health_scores_policy ON student_health_scores;
CREATE POLICY tenant_student_health_scores_policy ON student_health_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
              AND (s.institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
        )
    );

DROP POLICY IF EXISTS tenant_parent_daily_reports_policy ON parent_daily_reports;
CREATE POLICY tenant_parent_daily_reports_policy ON parent_daily_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
              AND (s.institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
        )
    );

DROP POLICY IF EXISTS tenant_scholarship_criteria_policy ON scholarship_criteria;
CREATE POLICY tenant_scholarship_criteria_policy ON scholarship_criteria
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );
