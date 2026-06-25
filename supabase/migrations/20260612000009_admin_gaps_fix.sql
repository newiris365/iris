-- ============================================================
-- ADMIN GAPS FIX: Admission docs, Timetable auto-gen, HOD fix,
-- Defaulter report, Academic calendar
-- ============================================================

-- ============================================================
-- 1. STUDENT ADMISSION: Document uploads + admission workflow
-- ============================================================
CREATE TABLE IF NOT EXISTS student_admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    applicant_name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    roll_number VARCHAR(50),
    department_id UUID REFERENCES departments(id),
    admission_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    semester INTEGER DEFAULT 1,
    batch_year VARCHAR(10),
    application_number VARCHAR(50) UNIQUE,
    admission_status VARCHAR(30) DEFAULT 'applied' CHECK (admission_status IN (
        'applied', 'documents_pending', 'under_review', 'approved', 'enrolled', 'rejected', 'waitlisted'
    )),
    guardian_name VARCHAR(200),
    guardian_phone VARCHAR(20),
    dob DATE,
    gender VARCHAR(20),
    address TEXT,
    category VARCHAR(50),
    blood_group VARCHAR(10),
    aadhaar_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admission_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id UUID NOT NULL REFERENCES student_admissions(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        '10th_marksheet', '12th_marksheet', 'aadhaar', 'photo', 'migration_cert',
        'caste_cert', 'income_cert', 'medical_cert', 'tc', 'other'
    )),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_kb INTEGER,
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admission_workflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id UUID NOT NULL REFERENCES student_admissions(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_by UUID REFERENCES users(id),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE student_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_workflow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage admissions" ON student_admissions
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Admin can manage admission documents" ON admission_documents
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
    );

CREATE POLICY "Admin can manage admission workflow" ON admission_workflow
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
    );

-- RPC: Bulk import students from CSV data
CREATE OR REPLACE FUNCTION bulk_admit_students(
    p_students JSONB,
    p_institution_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entry JSONB;
    v_count INTEGER := 0;
    v_errors INTEGER := 0;
    v_error_list JSONB := '[]'::JSONB;
    v_dept_id UUID;
    v_user_id UUID;
    v_student_id UUID;
    v_email VARCHAR;
    v_roll VARCHAR;
    v_name VARCHAR;
BEGIN
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_students)
    LOOP
        v_name := v_entry->>'name';
        v_email := v_entry->>'email';
        v_roll := v_entry->>'roll_number';
        v_dept_id := (v_entry->>'department_id')::UUID;

        BEGIN
            -- Create user
            INSERT INTO users (institution_id, name, email, phone, role, is_active)
            VALUES (p_institution_id, v_name, v_email, v_entry->>'phone', 'Student', true)
            RETURNING id INTO v_user_id;

            -- Create student profile
            INSERT INTO students (user_id, institution_id, department_id, roll_number, semester, batch_year, dob, gender, guardian_name, guardian_phone, fingerprint_id)
            VALUES (
                v_user_id, p_institution_id, v_dept_id, v_roll,
                COALESCE((v_entry->>'semester')::INTEGER, 1),
                COALESCE(v_entry->>'batch_year', EXTRACT(YEAR FROM CURRENT_DATE)::TEXT),
                (v_entry->>'dob')::DATE,
                v_entry->>'gender',
                v_entry->>'guardian_name',
                v_entry->>'guardian_phone',
                v_entry->>'fingerprint_id'
            )
            RETURNING id INTO v_student_id;

            v_count := v_count + 1;
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
            v_error_list := v_error_list || jsonb_build_object(
                'row', v_count + v_errors,
                'roll', v_roll,
                'error', SQLERRM
            );
        END;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'imported', v_count,
        'errors', v_errors,
        'error_details', v_error_list
    );
END;
$$;

-- ============================================================
-- 2. TIMETABLE: Auto-generation + conflict detection
-- ============================================================
CREATE TABLE IF NOT EXISTS timetable_constraints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    constraint_type VARCHAR(30) NOT NULL CHECK (constraint_type IN (
        'teacher_unavailable', 'room_unavailable', 'batch_unavailable',
        'max_daily_hours', 'no_back_to_back_lab', 'preferred_slot'
    )),
    teacher_id UUID REFERENCES staff(id),
    room VARCHAR(100),
    day_of_week VARCHAR(20),
    time_slot VARCHAR(20),
    max_hours_per_day INTEGER DEFAULT 6,
    priority INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timetable_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    department_id UUID REFERENCES departments(id),
    semester INTEGER,
    batch_year VARCHAR(10),
    slots JSONB NOT NULL DEFAULT '[]'::JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE timetable_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage timetable constraints" ON timetable_constraints
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Admin can manage timetable templates" ON timetable_templates
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

-- RPC: Detect timetable conflicts
CREATE OR REPLACE FUNCTION detect_timetable_conflicts(
    p_institution_id UUID,
    pSlots JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_slot JSONB;
    v_conflicts JSONB := '[]'::JSONB;
    v_existing RECORD;
    v_teacher_conflict BOOLEAN;
    v_room_conflict BOOLEAN;
    v_batch_conflict BOOLEAN;
BEGIN
    FOR v_slot IN SELECT * FROM jsonb_array_elements(pSlots)
    LOOP
        v_teacher_conflict := false;
        v_room_conflict := false;
        v_batch_conflict := false;

        -- Check teacher conflict
        IF v_slot->>'teacher_id' IS NOT NULL THEN
            SELECT * INTO v_existing
            FROM timetable t
            WHERE t.institution_id = p_institution_id
            AND t.teacher_id = (v_slot->>'teacher_id')::UUID
            AND t.day_of_week = v_slot->>'day_of_week'
            AND t.time_slot = v_slot->>'time_slot'
            AND t.id != COALESCE((v_slot->>'id')::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
            LIMIT 1;

            IF FOUND THEN
                v_teacher_conflict := true;
                v_conflicts := v_conflicts || jsonb_build_object(
                    'type', 'teacher',
                    'slot', v_slot,
                    'conflict_with', jsonb_build_object('subject', v_existing.subject, 'room', v_existing.room)
                );
            END IF;
        END IF;

        -- Check room conflict
        IF v_slot->>'room' IS NOT NULL AND v_slot->>'room' != '' THEN
            SELECT * INTO v_existing
            FROM timetable t
            WHERE t.institution_id = p_institution_id
            AND t.room = v_slot->>'room'
            AND t.day_of_week = v_slot->>'day_of_week'
            AND t.time_slot = v_slot->>'time_slot'
            AND t.id != COALESCE((v_slot->>'id')::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
            LIMIT 1;

            IF FOUND THEN
                v_room_conflict := true;
                v_conflicts := v_conflicts || jsonb_build_object(
                    'type', 'room',
                    'slot', v_slot,
                    'conflict_with', jsonb_build_object('subject', v_existing.subject, 'teacher_id', v_existing.teacher_id)
                );
            END IF;
        END IF;

        -- Check batch conflict
        IF v_slot->>'batch_year' IS NOT NULL AND v_slot->>'batch_year' != '' THEN
            SELECT * INTO v_existing
            FROM timetable t
            WHERE t.institution_id = p_institution_id
            AND t.batch_year = v_slot->>'batch_year'
            AND t.semester = (v_slot->>'semester')::INTEGER
            AND t.day_of_week = v_slot->>'day_of_week'
            AND t.time_slot = v_slot->>'time_slot'
            AND t.id != COALESCE((v_slot->>'id')::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
            LIMIT 1;

            IF FOUND THEN
                v_batch_conflict := true;
                v_conflicts := v_conflicts || jsonb_build_object(
                    'type', 'batch',
                    'slot', v_slot,
                    'conflict_with', jsonb_build_object('subject', v_existing.subject, 'room', v_existing.room)
                );
            END IF;
        END IF;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'conflicts', v_conflicts,
        'has_conflicts', jsonb_array_length(v_conflicts) > 0
    );
END;
$$;

-- RPC: Auto-generate timetable for a department/semester
CREATE OR REPLACE FUNCTION auto_generate_timetable(
    p_institution_id UUID,
    p_department_id UUID,
    p_semester INTEGER,
    p_batch_year VARCHAR(10),
    p_subjects JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subject JSONB;
    v_days TEXT[] := ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    v_slots TEXT[] := ARRAY['09:00','10:00','11:00','12:00','14:00','15:00','16:00'];
    v_slot_idx INTEGER := 1;
    v_day_idx INTEGER := 1;
    v_subject_name VARCHAR;
    v_hours_per_week INTEGER;
    v_teacher UUID;
    v_room VARCHAR;
    v_inserted INTEGER := 0;
    v_conflicts JSONB := '[]'::JSONB;
BEGIN
    FOR v_subject IN SELECT * FROM jsonb_array_elements(p_subjects)
    LOOP
        v_subject_name := v_subject->>'name';
        v_hours_per_week := COALESCE((v_subject->>'hours_per_week')::INTEGER, 3);
        v_teacher := (v_subject->>'teacher_id')::UUID;
        v_room := COALESCE(v_subject->>'room', '');

        -- Simple round-robin allocation
        WHILE v_hours_per_week > 0 LOOP
            IF v_slot_idx > array_length(v_slots, 1) THEN
                v_slot_idx := 1;
                v_day_idx := v_day_idx + 1;
            END IF;
            IF v_day_idx > array_length(v_days) THEN
                EXIT; -- No more slots available
            END IF;

            -- Check for conflict before inserting
            IF NOT EXISTS (
                SELECT 1 FROM timetable t
                WHERE t.institution_id = p_institution_id
                AND t.teacher_id = v_teacher
                AND t.day_of_week = v_days[v_day_idx]
                AND t.time_slot = v_slots[v_slot_idx]
            ) AND NOT EXISTS (
                SELECT 1 FROM timetable t
                WHERE t.institution_id = p_institution_id
                AND t.room = v_room
                AND t.room != ''
                AND t.day_of_week = v_days[v_day_idx]
                AND t.time_slot = v_slots[v_slot_idx]
            ) THEN
                INSERT INTO timetable (institution_id, department_id, teacher_id, subject, room, day_of_week, time_slot, semester, batch_year)
                VALUES (p_institution_id, p_department_id, v_teacher, v_subject_name, v_room, v_days[v_day_idx], v_slots[v_slot_idx], p_semester, p_batch_year);
                v_inserted := v_inserted + 1;
                v_hours_per_week := v_hours_per_week - 1;
            ELSE
                v_conflicts := v_conflicts || jsonb_build_object(
                    'subject', v_subject_name,
                    'day', v_days[v_day_idx],
                    'slot', v_slots[v_slot_idx],
                    'reason', 'teacher_or_room_unavailable'
                );
            END IF;

            v_slot_idx := v_slot_idx + 1;
        END LOOP;

        -- Reset for next subject
        v_slot_idx := 1;
        v_day_idx := 1;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'slots_inserted', v_inserted,
        'conflicts', v_conflicts,
        'conflict_count', jsonb_array_length(v_conflicts)
    );
END;
$$;

-- ============================================================
-- 3. NOTICE FIX: Add HOD to users.role CHECK + target_audience
-- ============================================================
-- No CHECK constraint on users.role, so HOD is already valid as a string.
-- The issue is the schema comment doesn't list it. No SQL change needed.
-- But let's ensure notices.target_audience accepts 'Faculty' as alias.

-- ============================================================
-- 4. CONSOLIDATED DEFAULTER REPORT
-- ============================================================
CREATE OR REPLACE FUNCTION get_consolidated_defaulters(
    p_institution_id UUID,
    p_attendance_threshold NUMERIC DEFAULT 75,
    p_fee_overdue_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    roll_number VARCHAR,
    department_name TEXT,
    attendance_pct NUMERIC,
    attendance_status TEXT,
    total_fee_due NUMERIC,
    total_paid NUMERIC,
    overdue_amount NUMERIC,
    days_overdue INTEGER,
    risk_level TEXT,
    combined_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH att AS (
        SELECT
            a.student_id,
            ROUND(
                COUNT(a.id) FILTER (WHERE a.status IN ('present','late'))::NUMERIC /
                NULLIF(COUNT(a.id), 0) * 100, 1
            ) AS pct
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE s.institution_id = p_institution_id
        GROUP BY a.student_id
    ),
    fees AS (
        SELECT
            sf.student_id,
            COALESCE(SUM(sf.amount), 0) AS total_due,
            COALESCE(SUM(sf.amount_paid), 0) AS paid,
            COALESCE(SUM(sf.amount - sf.amount_paid), 0) AS overdue,
            MAX(CASE WHEN sf.due_date < CURRENT_DATE THEN CURRENT_DATE - sf.due_date ELSE 0 END) AS max_days_overdue
        FROM student_fees sf
        JOIN students s ON sf.student_id = s.id
        WHERE s.institution_id = p_institution_id
        GROUP BY sf.student_id
    )
    SELECT
        s.id,
        u.name,
        s.roll_number,
        d.name,
        COALESCE(att.pct, 100),
        CASE
            WHEN att.pct IS NULL THEN 'No Data'
            WHEN att.pct < 60 THEN 'CRITICAL'
            WHEN att.pct < p_attendance_threshold THEN 'AT RISK'
            ELSE 'SAFE'
        END,
        COALESCE(fees.total_due, 0),
        COALESCE(fees.paid, 0),
        COALESCE(fees.overdue, 0),
        COALESCE(fees.max_days_overdue, 0)::INTEGER,
        CASE
            WHEN (COALESCE(att.pct, 100) < 60 AND COALESCE(fees.overdue, 0) > 0) THEN 'HIGH'
            WHEN (COALESCE(att.pct, 100) < p_attendance_threshold AND COALESCE(fees.overdue, 0) > 0) THEN 'MEDIUM'
            WHEN COALESCE(att.pct, 100) < 60 THEN 'MEDIUM'
            WHEN COALESCE(fees.overdue, 0) > 0 THEN 'LOW'
            ELSE 'NONE'
        END,
        ROUND(
            (CASE WHEN att.pct < 100 THEN (100 - COALESCE(att.pct, 100)) ELSE 0 END) * 0.6
            + (LEAST(COALESCE(fees.overdue, 0) / 10000.0, 10) * 10) * 0.4
        , 1)
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN att ON att.student_id = s.id
    LEFT JOIN fees ON fees.student_id = s.id
    WHERE s.is_active = true
    AND s.institution_id = p_institution_id
    AND (
        COALESCE(att.pct, 100) < p_attendance_threshold
        OR COALESCE(fees.overdue, 0) > 0
    )
    ORDER BY combined_score DESC;
END;
$$;

-- ============================================================
-- 5. ACADEMIC CALENDAR
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

CREATE TABLE IF NOT EXISTS academic_calendar_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    is_optional BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE academic_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_calendar_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage academic calendar" ON academic_calendar
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Everyone can view academic calendar" ON academic_calendar
    FOR SELECT USING (
        is_published = true
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Admin can manage holidays" ON academic_calendar_holidays
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Everyone can view holidays" ON academic_calendar_holidays
    FOR SELECT USING (
        institution_id = get_auth_institution_id()
    );

-- RPC: Get upcoming academic events
CREATE OR REPLACE FUNCTION get_academic_calendar_upcoming(
    p_institution_id UUID,
    p_from_date DATE DEFAULT CURRENT_DATE,
    p_months_ahead INTEGER DEFAULT 6
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    event_type VARCHAR,
    description TEXT,
    start_date DATE,
    end_date DATE,
    semester INTEGER,
    batch_year VARCHAR,
    color VARCHAR,
    days_until INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT ac.id, ac.title, ac.event_type, ac.description,
           ac.start_date, ac.end_date, ac.semester, ac.batch_year, ac.color,
           (ac.start_date - p_from_date)::INTEGER
    FROM academic_calendar ac
    WHERE ac.institution_id = p_institution_id
    AND ac.is_published = true
    AND ac.start_date BETWEEN p_from_date AND (p_from_date + (p_months_ahead || ' months')::INTERVAL)
    ORDER BY ac.start_date;
END;
$$;

-- RPC: Check if a date is a holiday
CREATE OR REPLACE FUNCTION is_academic_holiday(
    p_institution_id UUID,
    p_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM academic_calendar_holidays
    WHERE institution_id = p_institution_id
    AND date = p_date;

    IF v_count > 0 THEN RETURN true; END IF;

    -- Also check academic_calendar for holidays
    SELECT COUNT(*) INTO v_count
    FROM academic_calendar
    WHERE institution_id = p_institution_id
    AND event_type = 'holiday'
    AND p_date BETWEEN start_date AND COALESCE(end_date, start_date);

    RETURN v_count > 0;
END;
$$;
