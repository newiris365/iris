-- Migration: Campus Core Features Extension
-- Targets: Supabase (PostgreSQL)

-- Add fingerprint support to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS fingerprint_id VARCHAR(100) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_students_fingerprint ON students(fingerprint_id);

-- 1. FEE CONCESSIONS & SCHOLARSHIPS
CREATE TABLE IF NOT EXISTS fee_concessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    concession_type VARCHAR(100) NOT NULL, -- Scholarship, Merit, Need-based, Sports
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    reason TEXT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. NOTICE READS
CREATE TABLE IF NOT EXISTS notice_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_notice_user_read UNIQUE (notice_id, user_id)
);

-- 3. ID CARD TEMPLATES
CREATE TABLE IF NOT EXISTS id_card_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    template_json JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ATTENDANCE REGULARIZATIONS
CREATE TABLE IF NOT EXISTS attendance_regularizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reason TEXT NOT NULL,
    proof_url TEXT,
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE fee_concessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE id_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_regularizations ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies
DROP POLICY IF EXISTS tenant_fee_concessions_policy ON fee_concessions;
CREATE POLICY tenant_fee_concessions_policy ON fee_concessions
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

DROP POLICY IF EXISTS tenant_notice_reads_policy ON notice_reads;
CREATE POLICY tenant_notice_reads_policy ON notice_reads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM notices n
            WHERE n.id = notice_id
              AND (n.institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
        )
    );

DROP POLICY IF EXISTS tenant_id_card_templates_policy ON id_card_templates;
CREATE POLICY tenant_id_card_templates_policy ON id_card_templates
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );

DROP POLICY IF EXISTS tenant_attendance_regularizations_policy ON attendance_regularizations;
CREATE POLICY tenant_attendance_regularizations_policy ON attendance_regularizations
    FOR ALL USING (
        institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin'
    );
