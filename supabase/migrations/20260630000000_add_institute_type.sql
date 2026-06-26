-- Migration: Add multi-institute-type support (College + School)

-- 1. Add institute_type to institutions
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS institute_type VARCHAR(50) DEFAULT 'college';

-- Update existing institutions to default to 'college'
UPDATE institutions SET institute_type = 'college' WHERE institute_type IS NULL;

-- 2. Create school_attendance table
CREATE TABLE IF NOT EXISTS school_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL, -- Present, Absent, Half-Day, Leave
    marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_school_attendance_student_date UNIQUE (student_id, date, academic_year)
);

-- 3. Enable RLS on school_attendance
ALTER TABLE school_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_attendance_select" ON school_attendance
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "school_attendance_insert" ON school_attendance
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff', 'Teacher')
  );

CREATE POLICY "school_attendance_update" ON school_attendance
  FOR UPDATE USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff', 'Teacher')
  );

-- 4. Re-create get_parent_child_info to return institute_type
CREATE OR REPLACE FUNCTION get_parent_child_info()
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    roll_number VARCHAR,
    course VARCHAR,
    department_name TEXT,
    semester INTEGER,
    year INTEGER,
    guardian_phone VARCHAR,
    wallet_balance NUMERIC,
    institution_id UUID,
    institute_type VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, u.full_name, s.roll_number, s.course, d.name,
           s.semester, s.year, s.guardian_phone, s.wallet_balance, s.institution_id,
           COALESCE(i.institute_type, 'college')::VARCHAR
    FROM parent_student_links psl
    JOIN students s ON psl.student_id = s.id
    JOIN users u ON s.user_id = u.id
    JOIN institutions i ON s.institution_id = i.id
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE psl.parent_user_id = auth.uid()
      AND psl.verified = true
    ORDER BY psl.is_primary DESC NULLS LAST
    LIMIT 1;
END;
$$;

-- 5. Re-create get_parent_daily_summary to support school_attendance if institute_type is school
CREATE OR REPLACE FUNCTION get_parent_daily_summary(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    student_name TEXT,
    attendance_present BIGINT,
    attendance_total BIGINT,
    attendance_pct NUMERIC,
    canteen_spend NUMERIC,
    bus_boarded BOOLEAN,
    bus_time TIME,
    gate_in TIME,
    gate_out TIME,
    pending_fees NUMERIC,
    wallet_balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_inst_type VARCHAR;
BEGIN
    -- Get linked child and institution type
    SELECT psl.student_id, COALESCE(i.institute_type, 'college') INTO v_student_id, v_inst_type
    FROM parent_student_links psl
    JOIN students s ON psl.student_id = s.id
    JOIN institutions i ON s.institution_id = i.id
    WHERE psl.parent_user_id = auth.uid() AND psl.verified = true
    ORDER BY psl.is_primary DESC NULLS LAST LIMIT 1;

    IF v_student_id IS NULL THEN RETURN; END IF;

    IF v_inst_type = 'school' THEN
        -- Query from school_attendance
        RETURN QUERY
        SELECT
            u.full_name,
            COUNT(sa.id) FILTER (WHERE sa.status IN ('Present', 'Leave', 'Half-Day'))::BIGINT,
            COUNT(sa.id)::BIGINT,
            CASE WHEN COUNT(sa.id) = 0 THEN 100.0
                 -- Treat Half-Day as 0.5 present, Present and Leave as 1
                 ELSE ROUND((
                     COUNT(sa.id) FILTER (WHERE sa.status IN ('Present', 'Leave'))::NUMERIC + 
                     0.5 * COUNT(sa.id) FILTER (WHERE sa.status = 'Half-Day')::NUMERIC
                 ) / COUNT(sa.id)::NUMERIC * 100, 1)
            END,
            COALESCE((SELECT SUM(co.total_amount) FROM canteen_orders co WHERE co.student_id = v_student_id AND co.created_at::DATE = p_date), 0),
            EXISTS(SELECT 1 FROM bus_tracking bt WHERE bt.student_id = v_student_id AND bt.boarded_at::DATE = p_date),
            (SELECT bt.boarded_at::TIME FROM bus_tracking bt WHERE bt.student_id = v_student_id AND bt.boarded_at::DATE = p_date LIMIT 1),
            (SELECT gl.timestamp::TIME FROM gate_logs gl WHERE gl.person_id = v_student_id AND gl.direction = 'in' AND gl.timestamp::DATE = p_date LIMIT 1),
            (SELECT gl.timestamp::TIME FROM gate_logs gl WHERE gl.person_id = v_student_id AND gl.direction = 'out' AND gl.timestamp::DATE = p_date ORDER BY gl.timestamp DESC LIMIT 1),
            (SELECT COALESCE(SUM(sf.amount - COALESCE(sf.paid_amount, 0)), 0) FROM student_fees sf WHERE sf.student_id = v_student_id AND sf.payment_status IN ('pending', 'partial')),
            (SELECT COALESCE(s.wallet_balance, 0) FROM students s WHERE s.id = v_student_id)
        FROM school_attendance sa
        JOIN students s ON sa.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE sa.student_id = v_student_id AND sa.date = p_date
        GROUP BY u.full_name;
    ELSE
        -- Query from college attendance
        RETURN QUERY
        SELECT
            u.full_name,
            COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::BIGINT,
            COUNT(a.id)::BIGINT,
            CASE WHEN COUNT(a.id) = 0 THEN 100.0
                 ELSE ROUND(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC / COUNT(a.id)::NUMERIC * 100, 1)
            END,
            COALESCE((SELECT SUM(co.total_amount) FROM canteen_orders co WHERE co.student_id = v_student_id AND co.created_at::DATE = p_date), 0),
            EXISTS(SELECT 1 FROM bus_tracking bt WHERE bt.student_id = v_student_id AND bt.boarded_at::DATE = p_date),
            (SELECT bt.boarded_at::TIME FROM bus_tracking bt WHERE bt.student_id = v_student_id AND bt.boarded_at::DATE = p_date LIMIT 1),
            (SELECT gl.timestamp::TIME FROM gate_logs gl WHERE gl.person_id = v_student_id AND gl.direction = 'in' AND gl.timestamp::DATE = p_date LIMIT 1),
            (SELECT gl.timestamp::TIME FROM gate_logs gl WHERE gl.person_id = v_student_id AND gl.direction = 'out' AND gl.timestamp::DATE = p_date ORDER BY gl.timestamp DESC LIMIT 1),
            (SELECT COALESCE(SUM(sf.amount - COALESCE(sf.paid_amount, 0)), 0) FROM student_fees sf WHERE sf.student_id = v_student_id AND sf.payment_status IN ('pending', 'partial')),
            (SELECT COALESCE(s.wallet_balance, 0) FROM students s WHERE s.id = v_student_id)
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE a.student_id = v_student_id AND a.date = p_date
        GROUP BY u.full_name;
    END IF;
END;
$$;
