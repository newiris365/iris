-- ============================================================
-- HIGH PRIORITY FEATURES: Attendance Warnings, Fee Escalation, Parent OTP
-- ============================================================

-- ============================================================
-- 1. ATTENDANCE SHORTAGE WARNING SYSTEM
-- ============================================================

-- Track which warnings have been sent to avoid duplicate alerts
CREATE TABLE IF NOT EXISTS attendance_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    warning_type VARCHAR(20) NOT NULL CHECK (warning_type IN ('warning_80', 'critical_75', 'final_60')),
    attendance_pct DECIMAL(5,2) NOT NULL,
    total_classes INTEGER NOT NULL DEFAULT 0,
    attended_classes INTEGER NOT NULL DEFAULT 0,
    sent_to_student BOOLEAN NOT NULL DEFAULT false,
    sent_to_parent BOOLEAN NOT NULL DEFAULT false,
    sent_to_hod BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    warning_date DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT unique_warning_per_student_type UNIQUE (student_id, warning_type, warning_date)
);

-- Log of all attendance warning runs (audit trail)
CREATE TABLE IF NOT EXISTS attendance_warning_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    students_checked INTEGER NOT NULL DEFAULT 0,
    warnings_sent INTEGER NOT NULL DEFAULT 0,
    critical_sent INTEGER NOT NULL DEFAULT 0,
    errors INTEGER NOT NULL DEFAULT 0,
    run_duration_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE attendance_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_warning_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin/Director can view attendance warnings" ON attendance_warnings
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Students can view their own attendance warnings" ON attendance_warnings
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "Parents can view linked child warnings" ON attendance_warnings
    FOR SELECT USING (
        student_id IN (
            SELECT student_id FROM parent_student_links
            WHERE parent_user_id = auth.uid() AND verified = true
        )
    );

CREATE POLICY "System can insert attendance warnings" ON attendance_warnings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin/Director can view warning logs" ON attendance_warning_logs
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "System can insert warning logs" ON attendance_warning_logs
    FOR INSERT WITH CHECK (true);

-- RPC: Calculate attendance percentage for a student
CREATE OR REPLACE FUNCTION get_student_attendance_pct(p_student_id UUID)
RETURNS TABLE (
    total_classes BIGINT,
    attended_classes BIGINT,
    attendance_pct NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_classes,
        COUNT(*) FILTER (WHERE a.status IN ('present', 'late'))::BIGINT AS attended_classes,
        CASE
            WHEN COUNT(*) = 0 THEN 100.00
            ELSE ROUND((COUNT(*) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
        END AS attendance_pct
    FROM attendance a
    WHERE a.student_id = p_student_id
      AND a.date >= (CURRENT_DATE - INTERVAL '120 days');
END;
$$;

-- RPC: Get attendance summary for all active students in an institution
CREATE OR REPLACE FUNCTION get_institution_attendance_summary()
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    roll_number VARCHAR,
    guardian_name VARCHAR,
    guardian_phone VARCHAR,
    department_name TEXT,
    total_classes BIGINT,
    attended_classes BIGINT,
    attendance_pct NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id AS student_id,
        u.full_name AS student_name,
        s.roll_number,
        s.guardian_name,
        s.guardian_phone,
        d.name AS department_name,
        COUNT(a.id)::BIGINT AS total_classes,
        COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::BIGINT AS attended_classes,
        CASE
            WHEN COUNT(a.id) = 0 THEN 100.00
            ELSE ROUND(
                (COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC
                / NULLIF(COUNT(a.id), 0)::NUMERIC) * 100, 2
            )
        END AS attendance_pct
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN attendance a ON a.student_id = s.id
        AND a.date >= (CURRENT_DATE - INTERVAL '120 days')
    WHERE s.is_active = true
      AND s.institution_id = get_auth_institution_id()
    GROUP BY s.id, u.full_name, s.roll_number, s.guardian_name, s.guardian_phone, d.name
    HAVING
        CASE
            WHEN COUNT(a.id) = 0 THEN 100.00
            ELSE ROUND(
                (COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC
                / NULLIF(COUNT(a.id), 0)::NUMERIC) * 100, 2
            )
        END < 80
    ORDER BY attendance_pct ASC;
END;
$$;


-- ============================================================
-- 2. FEE DEFAULTER AUTO-ESCALATION
-- ============================================================

-- Track escalation stages and notifications sent
CREATE TABLE IF NOT EXISTS fee_escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    fee_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
    student_fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
    escalation_stage VARCHAR(30) NOT NULL CHECK (escalation_stage IN (
        'reminder_7day',      -- 7 days before due date
        'reminder_1day',      -- 1 day before due date
        'due_today',          -- Due date today
        'overdue_7day',       -- 7 days overdue
        'overdue_30day',      -- 30 days overdue - formal notice
        'escalated_to_admin'  -- Director flagged
    )),
    amount_overdue NUMERIC(10,2) NOT NULL DEFAULT 0,
    days_overdue INTEGER NOT NULL DEFAULT 0,
    sent_to_student BOOLEAN NOT NULL DEFAULT false,
    sent_to_parent BOOLEAN NOT NULL DEFAULT false,
    sent_to_hod BOOLEAN NOT NULL DEFAULT false,
    sent_to_director BOOLEAN NOT NULL DEFAULT false,
    notice_generated BOOLEAN NOT NULL DEFAULT false,
    notice_file_url TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_escalation_per_student_stage UNIQUE (student_fee_id, escalation_stage)
);

-- Track all escalation runs
CREATE TABLE IF NOT EXISTS fee_escalation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    fees_checked INTEGER NOT NULL DEFAULT 0,
    reminders_sent INTEGER NOT NULL DEFAULT 0,
    escalations_sent INTEGER NOT NULL DEFAULT 0,
    notices_generated INTEGER NOT NULL DEFAULT 0,
    errors INTEGER NOT NULL DEFAULT 0,
    run_duration_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE fee_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_escalation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fee_escalations
CREATE POLICY "Admin/Director can view fee escalations" ON fee_escalations
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director', 'HOD')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Students can view their own fee escalations" ON fee_escalations
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "Parents can view linked child escalations" ON fee_escalations
    FOR SELECT USING (
        student_id IN (
            SELECT student_id FROM parent_student_links
            WHERE parent_user_id = auth.uid() AND verified = true
        )
    );

CREATE POLICY "System can insert fee escalations" ON fee_escalations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update fee escalations" ON fee_escalations
    FOR UPDATE USING (true);

CREATE POLICY "Admin/Director can view escalation logs" ON fee_escalation_logs
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "System can insert escalation logs" ON fee_escalation_logs
    FOR INSERT WITH CHECK (true);

-- RPC: Get fee defaulters for an institution (students with overdue fees)
CREATE OR REPLACE FUNCTION get_fee_defaulters()
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    roll_number VARCHAR,
    guardian_name VARCHAR,
    guardian_phone VARCHAR,
    department_name TEXT,
    fee_id UUID,
    fee_name VARCHAR,
    amount_due NUMERIC,
    amount_paid NUMERIC,
    amount_overdue NUMERIC,
    due_date DATE,
    days_overdue INTEGER,
    late_fee NUMERIC,
    total_due NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id AS student_id,
        u.full_name AS student_name,
        s.roll_number,
        s.guardian_name,
        s.guardian_phone,
        d.name AS department_name,
        sf.fee_id,
        fs.name AS fee_name,
        sf.amount AS amount_due,
        sf.paid_amount AS amount_paid,
        (sf.amount - sf.paid_amount) AS amount_overdue,
        sf.due_date,
        (CURRENT_DATE - sf.due_date)::INTEGER AS days_overdue,
        calculate_fee_penalty(sf.fee_id, CURRENT_DATE) AS late_fee,
        (sf.amount - sf.paid_amount + calculate_fee_penalty(sf.fee_id, CURRENT_DATE)) AS total_due
    FROM student_fees sf
    JOIN fee_structures fs ON sf.fee_id = fs.id
    JOIN students s ON sf.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE sf.payment_status IN ('pending', 'partial')
      AND sf.due_date <= CURRENT_DATE
      AND s.is_active = true
      AND s.institution_id = get_auth_institution_id()
    ORDER BY (sf.due_date - CURRENT_DATE) DESC, sf.amount DESC;
END;
$$;


-- ============================================================
-- 3. PARENT → CHILD VERIFIED LINK SYSTEM (OTP)
-- ============================================================

-- OTP tokens for parent registration and child linking
CREATE TABLE IF NOT EXISTS parent_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(30) NOT NULL CHECK (purpose IN ('register', 'link_child', 'verify_change')),
    metadata JSONB DEFAULT '{}',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    is_used BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Parent profiles (separate from users table for portal-specific data)
CREATE TABLE IF NOT EXISTS parent_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    occupation VARCHAR(100),
    relationship VARCHAR(50) DEFAULT 'Guardian',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_parent_profile UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE parent_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parent_otps (no user access - system only)
CREATE POLICY "System can manage parent OTPs" ON parent_otps
    FOR ALL USING (true);

-- RLS Policies for parent_profiles
CREATE POLICY "Parents can view their own profile" ON parent_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can view parent profiles in institution" ON parent_profiles
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "System can insert parent profiles" ON parent_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update parent profiles" ON parent_profiles
    FOR UPDATE USING (true);

-- RPC: Generate and store OTP for parent
CREATE OR REPLACE FUNCTION generate_parent_otp(
    p_phone VARCHAR,
    p_purpose VARCHAR,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
    otp_id UUID,
    otp_code VARCHAR,
    expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_otp VARCHAR(6);
    v_id UUID;
    v_expires TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate 6-digit OTP
    v_otp := LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0');
    v_expires := NOW() + INTERVAL '10 minutes';

    -- Invalidate any existing OTPs for this phone+purpose
    UPDATE parent_otps
    SET is_used = true
    WHERE phone = p_phone
      AND purpose = p_purpose
      AND is_used = false;

    -- Insert new OTP
    INSERT INTO parent_otps (phone, otp_code, purpose, metadata, expires_at)
    VALUES (p_phone, v_otp, p_purpose, p_metadata, v_expires)
    RETURNING id INTO v_id;

    otp_id := v_id;
    otp_code := v_otp;
    expires_at := v_expires;
    RETURN NEXT;
END;
$$;

-- RPC: Verify parent OTP
CREATE OR REPLACE FUNCTION verify_parent_otp(
    p_phone VARCHAR,
    p_otp VARCHAR,
    p_purpose VARCHAR
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_otp_record RECORD;
BEGIN
    -- Find valid OTP
    SELECT * INTO v_otp_record
    FROM parent_otps
    WHERE phone = p_phone
      AND purpose = p_purpose
      AND is_used = false
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_otp_record IS NULL THEN
        success := false;
        message := 'No valid OTP found. Please request a new code.';
        metadata := '{}';
        RETURN NEXT;
        RETURN;
    END IF;

    -- Check attempts
    IF v_otp_record.attempts >= v_otp_record.max_attempts THEN
        UPDATE parent_otps SET is_used = true WHERE id = v_otp_record.id;
        success := false;
        message := 'Maximum attempts exceeded. Please request a new code.';
        metadata := '{}';
        RETURN NEXT;
        RETURN;
    END IF;

    -- Increment attempts
    UPDATE parent_otps SET attempts = attempts + 1 WHERE id = v_otp_record.id;

    -- Check OTP
    IF v_otp_record.otp_code != p_otp THEN
        success := false;
        message := 'Incorrect verification code. Please try again.';
        metadata := '{}';
        RETURN NEXT;
        RETURN;
    END IF;

    -- Mark as used
    UPDATE parent_otps SET is_used = true WHERE id = v_otp_record.id;

    success := true;
    message := 'Verification successful.';
    metadata := v_otp_record.metadata;
    RETURN NEXT;
END;
$$;

-- RPC: Link parent to child via roll number verification
CREATE OR REPLACE FUNCTION link_parent_to_child(
    p_roll_number VARCHAR,
    p_child_dob DATE
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    student_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student RECORD;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    -- Find student by roll number
    SELECT s.id, s.user_id, s.dob, s.institution_id, u.full_name
    INTO v_student
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.roll_number = p_roll_number
      AND s.is_active = true;

    IF v_student IS NULL THEN
        success := false;
        message := 'No active student found with this roll number.';
        student_id := NULL;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Verify DOB matches (additional security layer)
    IF v_student.dob != p_child_dob THEN
        success := false;
        message := 'Date of birth does not match our records.';
        student_id := NULL;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Check if already linked
    IF EXISTS (
        SELECT 1 FROM parent_student_links
        WHERE parent_user_id = v_user_id
          AND student_id = v_student.id
          AND verified = true
    ) THEN
        success := false;
        message := 'This student is already linked to your account.';
        student_id := v_student.id;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Create or update link
    INSERT INTO parent_student_links (parent_user_id, student_id, verified, relationship)
    VALUES (v_user_id, v_student.id, true, 'Guardian')
    ON CONFLICT (parent_user_id, student_id)
    DO UPDATE SET verified = true;

    -- Update parent profile if exists
    UPDATE parent_profiles SET is_verified = true, verified_at = NOW()
    WHERE user_id = v_user_id;

    success := true;
    message := 'Successfully linked to student ' || v_student.full_name;
    student_id := v_student.id;
    RETURN NEXT;
END;
$$;
