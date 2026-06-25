-- ============================================================
-- FACULTY MODULE: Department check, CIA marks, timetable fix
-- ============================================================

-- ============================================================
-- 1. ADD: CIA / Internal Marks tables
-- ============================================================
CREATE TABLE IF NOT EXISTS cia_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    assessment_type VARCHAR(30) NOT NULL CHECK (assessment_type IN (
        'CIA_1', 'CIA_2', 'CIA_3', 'Assignment', 'Quiz', 'Presentation', 'Lab', 'Attendance_Marks', 'Other'
    )),
    subject VARCHAR(150),
    max_marks INTEGER NOT NULL DEFAULT 30,
    weightage_pct DECIMAL(5,2) DEFAULT 0,
    semester INTEGER,
    batch_year VARCHAR(10),
    date DATE,
    deadline TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cia_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES cia_assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(8,2) NOT NULL DEFAULT 0,
    remarks TEXT,
    entered_by UUID REFERENCES users(id),
    entered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_cia_mark_per_student UNIQUE (assessment_id, student_id)
);

-- RLS
ALTER TABLE cia_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cia_marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Faculty can manage own CIA assessments" ON cia_assessments
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Teacher', 'Staff')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Students can view published CIA assessments" ON cia_assessments
    FOR SELECT USING (
        is_published = true
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Faculty can manage own CIA marks" ON cia_marks
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Teacher', 'Staff')
        AND (
            get_auth_user_role() = 'SuperAdmin' 
            OR assessment_id IN (
                SELECT id FROM cia_assessments WHERE institution_id = get_auth_institution_id()
            )
        )
    );

CREATE POLICY "Students can view own CIA marks" ON cia_marks
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "Parents can view linked child CIA marks" ON cia_marks
    FOR SELECT USING (
        student_id IN (
            SELECT student_id FROM parent_student_links
            WHERE parent_user_id = auth.uid() AND verified = true
        )
    );

-- RPC: Get students with attendance shortage for a specific subject/department
CREATE OR REPLACE FUNCTION get_class_attendance_shortage(
    p_department_id UUID,
    p_subject VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    roll_number VARCHAR,
    total_classes BIGINT,
    attended_classes BIGINT,
    attendance_pct NUMERIC,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        u.full_name,
        s.roll_number,
        COUNT(a.id)::BIGINT,
        COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::BIGINT,
        CASE WHEN COUNT(a.id) = 0 THEN 100.0
             ELSE ROUND(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC / COUNT(a.id)::NUMERIC * 100, 1)
        END,
        CASE
            WHEN COUNT(a.id) = 0 THEN 'No Data'
            WHEN COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC / COUNT(a.id)::NUMERIC * 100 < 60 THEN 'CRITICAL'
            WHEN COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC / COUNT(a.id)::NUMERIC * 100 < 75 THEN 'AT RISK'
            ELSE 'SAFE'
        END
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN attendance a ON a.student_id = s.id
        AND (p_subject IS NULL OR a.session_id IN (
            SELECT id FROM attendance_sessions WHERE subject = p_subject
        ))
    WHERE s.department_id = p_department_id
      AND s.is_active = true
    GROUP BY s.id, u.full_name, s.roll_number
    ORDER BY attendance_pct ASC;
END;
$$;

-- RPC: Bulk enter CIA marks
CREATE OR REPLACE FUNCTION bulk_enter_cia_marks(
    p_assessment_id UUID,
    p_marks JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entry JSONB;
    v_count INTEGER := 0;
    v_assessment RECORD;
BEGIN
    -- Verify assessment exists
    SELECT * INTO v_assessment FROM cia_assessments WHERE id = p_assessment_id;
    IF v_assessment IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Assessment not found.');
    END IF;

    -- Iterate over marks entries
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_marks)
    LOOP
        INSERT INTO cia_marks (assessment_id, student_id, marks_obtained, remarks, entered_by)
        VALUES (
            p_assessment_id,
            (v_entry->>'student_id')::UUID,
            (v_entry->>'marks_obtained')::DECIMAL,
            COALESCE(v_entry->>'remarks', ''),
            auth.uid()
        )
        ON CONFLICT (assessment_id, student_id)
        DO UPDATE SET
            marks_obtained = EXCLUDED.marks_obtained,
            remarks = EXCLUDED.remarks,
            entered_by = auth.uid(),
            entered_at = NOW();
        v_count := v_count + 1;
    END LOOP;

    RETURN json_build_object('success', true, 'marks_entered', v_count);
END;
$$;

-- RPC: Get CIA summary for a student
CREATE OR REPLACE FUNCTION get_student_cia_summary(p_student_id UUID)
RETURNS TABLE (
    assessment_name VARCHAR,
    assessment_type VARCHAR,
    subject VARCHAR,
    max_marks INTEGER,
    marks_obtained DECIMAL,
    percentage NUMERIC,
    date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT ca.name, ca.assessment_type, ca.subject, ca.max_marks,
           cm.marks_obtained,
           CASE WHEN ca.max_marks > 0 THEN ROUND(cm.marks_obtained / ca.max_marks::NUMERIC * 100, 1) ELSE 0 END,
           ca.date
    FROM cia_assessments ca
    LEFT JOIN cia_marks cm ON cm.assessment_id = ca.id AND cm.student_id = p_student_id
    WHERE ca.is_published = true
    ORDER BY ca.date DESC, ca.name;
END;
$$;

-- RPC: Get timetable filtered by teacher_id
CREATE OR REPLACE FUNCTION get_teacher_timetable(p_teacher_id UUID)
RETURNS TABLE (
    id UUID,
    day_of_week VARCHAR,
    time_slot VARCHAR,
    subject VARCHAR,
    room VARCHAR,
    department_name TEXT,
    semester INTEGER,
    batch_year VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff_id UUID;
BEGIN
    -- Get staff record for this teacher
    SELECT st.id INTO v_staff_id FROM staff st WHERE st.user_id = p_teacher_id;

    IF v_staff_id IS NULL THEN RETURN; END IF;

    RETURN QUERY
    SELECT t.id, t.day_of_week, t.time_slot, t.subject, t.room,
           d.name, t.semester, t.batch_year
    FROM timetable t
    LEFT JOIN departments d ON t.department_id = d.id
    WHERE t.teacher_id = v_staff_id
    ORDER BY
        CASE t.day_of_week
            WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
            ELSE 7
        END,
        t.time_slot;
END;
$$;
