-- ============================================================
-- SECURITY MODULE FIXES: Identity verification, visitor lookup,
-- blacklist alerts, vehicle logs, event attendees
-- ============================================================

-- ============================================================
-- 1. FIX: Security can read user/student profiles for verification
--    (users_select already allows institution-scoped reads,
--     but add explicit column-level view for Security)
-- ============================================================
CREATE OR REPLACE FUNCTION verify_person_at_gate(
    p_identifier TEXT
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    role VARCHAR,
    photo_url TEXT,
    is_active BOOLEAN,
    student_roll VARCHAR,
    department_name TEXT,
    semester INTEGER,
    person_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Try matching by email, phone, roll_number, or user id
    RETURN QUERY
    SELECT
        u.id,
        u.name AS full_name,
        u.role,
        u.avatar_url AS photo_url,
        u.is_active,
        s.roll_number,
        d.name,
        s.semester,
        CASE WHEN s.id IS NOT NULL THEN 'student'
             WHEN st.id IS NOT NULL THEN 'staff'
             ELSE 'user'
        END::TEXT
    FROM users u
    LEFT JOIN students s ON s.user_id = u.id
    LEFT JOIN staff st ON st.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE u.institution_id = get_auth_institution_id()
    AND (
        u.id::TEXT = p_identifier
        OR u.email = p_identifier
        OR u.phone = p_identifier
        OR s.roll_number = p_identifier
        OR LOWER(u.name) LIKE LOWER('%' || p_identifier || '%')
        OR st.employee_id = p_identifier
    )
    LIMIT 5;
END;
$$;

-- ============================================================
-- 2. FIX: Security can look up ALL visitor passes (not just own)
-- ============================================================
-- The existing hostel_visitors_select policy allows institution-wide reads.
-- But visitor_logs (gate entry/exit) needs broader read for Security.
-- Add a view for today's approved visitors

CREATE OR REPLACE FUNCTION get_approved_visitors_today()
RETURNS TABLE (
    id UUID,
    visitor_name TEXT,
    visitor_phone TEXT,
    relation TEXT,
    visit_purpose TEXT,
    student_name TEXT,
    student_roll VARCHAR,
    room_number VARCHAR,
    approval_status VARCHAR,
    expected_time TIMESTAMP WITH TIME ZONE,
    approved_by_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        hv.id,
        hv.visitor_name,
        hv.visitor_phone,
        hv.relation,
        hv.visit_purpose,
        su.name,
        s.roll_number,
        hr.room_number,
        hv.approval_status,
        hv.expected_time,
        abu.name
    FROM hostel_visitors hv
    LEFT JOIN students s ON hv.student_id = s.id
    LEFT JOIN users su ON s.user_id = su.id
    LEFT JOIN hostel_allocations ha ON ha.student_id = s.id AND ha.is_current = true
    LEFT JOIN hostel_rooms hr ON ha.room_id = hr.id
    LEFT JOIN staff ab ON hv.approved_by = ab.id
    LEFT JOIN users abu ON ab.user_id = abu.id
    WHERE hv.institution_id = get_auth_institution_id()
    AND (
        hv.approval_status = 'approved'
        OR hv.expected_time::DATE = CURRENT_DATE
        OR hv.created_at::DATE = CURRENT_DATE
    )
    ORDER BY hv.created_at DESC;
END;
$$;

-- ============================================================
-- 3. BLACKLIST / SUSPENDED STUDENT ALERT
-- ============================================================
CREATE TABLE IF NOT EXISTS access_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    person_type VARCHAR(20) NOT NULL CHECK (person_type IN ('student', 'staff', 'visitor')),
    person_id UUID NOT NULL,
    restriction_type VARCHAR(30) NOT NULL CHECK (restriction_type IN (
        'suspended', 'expelled', 'banned', 'no_campus_access', 'disciplinary', 'other'
    )),
    reason TEXT NOT NULL,
    restricted_by UUID REFERENCES users(id),
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE access_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Security can view active restrictions" ON access_restrictions
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security', 'Warden')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Admin can manage restrictions" ON access_restrictions
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND institution_id = get_auth_institution_id()
    );

-- RPC: Check if a person is restricted
CREATE OR REPLACE FUNCTION check_person_restricted(p_person_id UUID)
RETURNS TABLE (
    is_restricted BOOLEAN,
    restriction_type VARCHAR,
    reason TEXT,
    valid_until DATE,
    restricted_by_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        true,
        ar.restriction_type,
        ar.reason,
        ar.valid_until,
        u.name
    FROM access_restrictions ar
    LEFT JOIN users u ON ar.restricted_by = u.id
    WHERE ar.person_id = p_person_id
    AND ar.is_active = true
    AND ar.institution_id = get_auth_institution_id()
    AND (ar.valid_until IS NULL OR ar.valid_until >= CURRENT_DATE)
    LIMIT 1;

    -- If no rows, person is not restricted
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::VARCHAR, NULL::TEXT, NULL::DATE, NULL::TEXT;
    END IF;
END;
$$;

-- RPC: Scan at gate — returns identity + restriction status + visitor status
CREATE OR REPLACE FUNCTION gate_scan_lookup(p_identifier TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_person RECORD;
    v_restricted RECORD;
    v_visitor RECORD;
    v_result JSON;
BEGIN
    -- Step 1: Look up person
    SELECT * INTO v_person
    FROM verify_person_at_gate(p_identifier)
    LIMIT 1;

    IF v_person IS NULL THEN
        RETURN json_build_object(
            'success', true,
            'found', false,
            'message', 'Person not found in system.'
        );
    END IF;

    -- Step 2: Check blacklist
    SELECT * INTO v_restricted
    FROM check_person_restricted(v_person.user_id)
    LIMIT 1;

    -- Step 3: Check if visitor with approved pass
    IF v_person.person_type = 'user' THEN
        SELECT hv.id, hv.visitor_name, hv.approval_status INTO v_visitor
        FROM hostel_visitors hv
        WHERE hv.visitor_name ILIKE '%' || p_identifier || '%'
        OR hv.visitor_phone = p_identifier
        AND hv.institution_id = get_auth_institution_id()
        AND hv.approval_status = 'approved'
        LIMIT 1;
    END IF;

    RETURN json_build_object(
        'success', true,
        'found', true,
        'person', json_build_object(
            'user_id', v_person.user_id,
            'full_name', v_person.full_name,
            'role', v_person.role,
            'photo_url', v_person.photo_url,
            'is_active', v_person.is_active,
            'student_roll', v_person.student_roll,
            'department', v_person.department_name,
            'semester', v_person.semester,
            'person_type', v_person.person_type
        ),
        'restriction', json_build_object(
            'is_restricted', COALESCE(v_restricted.is_restricted, false),
            'type', v_restricted.restriction_type,
            'reason', v_restricted.reason,
            'valid_until', v_restricted.valid_until,
            'restricted_by', v_restricted.restricted_by_name
        ),
        'visitor_pass', CASE WHEN v_visitor IS NOT NULL THEN
            json_build_object(
                'id', v_visitor.id,
                'visitor_name', v_visitor.visitor_name,
                'approval_status', v_visitor.approval_status
            )
        ELSE NULL END
    );
END;
$$;

-- ============================================================
-- 4. VEHICLE ENTRY/EXIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(30) DEFAULT 'two_wheeler' CHECK (vehicle_type IN (
        'two_wheeler', 'four_wheeler', 'bus', 'delivery', 'emergency', 'other'
    )),
    driver_name VARCHAR(200),
    driver_phone VARCHAR(20),
    purpose TEXT,
    person_id UUID REFERENCES users(id),
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP WITH TIME ZONE,
    entered_by UUID REFERENCES users(id),
    exited_by UUID REFERENCES users(id),
    gate_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE vehicle_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Security can manage vehicle logs" ON vehicle_logs
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security', 'Warden')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Admin can view all vehicle logs" ON vehicle_logs
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND institution_id = get_auth_institution_id()
    );

-- RPC: Vehicle entry
CREATE OR REPLACE FUNCTION vehicle_entry(
    p_vehicle_number VARCHAR,
    p_vehicle_type VARCHAR,
    p_driver_name VARCHAR,
    p_driver_phone VARCHAR,
    p_purpose TEXT,
    p_gate_number VARCHAR DEFAULT '1'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO vehicle_logs (
        institution_id, vehicle_number, vehicle_type, driver_name,
        driver_phone, purpose, entered_by, gate_number
    ) VALUES (
        get_auth_institution_id(), p_vehicle_number, p_vehicle_type,
        p_driver_name, p_driver_phone, p_purpose,
        auth.uid(),
        p_gate_number
    ) RETURNING id INTO v_log_id;

    RETURN json_build_object('success', true, 'log_id', v_log_id, 'message', 'Vehicle entry logged.');
END;
$$;

-- RPC: Vehicle exit
CREATE OR REPLACE FUNCTION vehicle_exit(p_log_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE vehicle_logs
    SET exit_time = NOW(),
        exited_by = auth.uid()
    WHERE id = p_log_id AND exit_time IS NULL;

    IF FOUND THEN
        RETURN json_build_object('success', true, 'message', 'Vehicle exit logged.');
    ELSE
        RETURN json_build_object('success', false, 'error', 'Log not found or already exited.');
    END IF;
END;
$$;

-- ============================================================
-- 5. TODAY'S EVENT ATTENDEE LIST
-- ============================================================
CREATE OR REPLACE FUNCTION get_todays_event_attendees()
RETURNS TABLE (
    event_id UUID,
    event_title TEXT,
    event_date DATE,
    registration_id UUID,
    user_id UUID,
    full_name TEXT,
    email TEXT,
    registration_status VARCHAR,
    check_in_time TIMESTAMP WITH TIME ZONE,
    ticket_code VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.title::TEXT,
        e.event_date,
        er.id,
        er.user_id,
        u.name AS full_name,
        u.email,
        er.status,
        er.check_in_time,
        er.ticket_code
    FROM events e
    JOIN event_registrations er ON er.event_id = e.id
    JOIN users u ON er.user_id = u.id
    WHERE e.institution_id = get_auth_institution_id()
    AND e.event_date = CURRENT_DATE
    ORDER BY e.title, u.name;
END;
$$;
