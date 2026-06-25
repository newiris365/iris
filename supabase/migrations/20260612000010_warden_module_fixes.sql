-- ============================================================
-- WARDEN MODULE FIXES: Visitor approval, unallocated students,
-- checkout workflow, curfew check-in, mess view, room transfers
-- ============================================================

-- ============================================================
-- 1. WARDEN VISITOR APPROVAL: Add approval workflow columns
-- ============================================================
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected', 'expired'));
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS visit_purpose TEXT;
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS expected_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE hostel_visitors ADD COLUMN IF NOT EXISTS block_id UUID REFERENCES hostel_blocks(id);

-- RPC: Warden approves visitor for their block
CREATE OR REPLACE FUNCTION approve_hostel_visitor(
    p_visitor_id UUID,
    p_warden_id UUID,
    p_approve BOOLEAN,
    p_remarks TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_visitor RECORD;
    v_block_id UUID;
    v_room RECORD;
    v_warden_block UUID;
BEGIN
    -- Get visitor details
    SELECT * INTO v_visitor FROM hostel_visitors WHERE id = p_visitor_id;
    IF v_visitor IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Visitor not found.');
    END IF;

    -- Get warden's block
    SELECT hb.id INTO v_warden_block
    FROM hostel_blocks hb
    WHERE hb.warden_id = p_warden_id
    AND hb.institution_id = v_visitor.institution_id
    LIMIT 1;

    IF v_warden_block IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Warden not assigned to any block.');
    END IF;

    -- Verify visitor's student is in warden's block
    IF v_visitor.student_id IS NOT NULL THEN
        SELECT hr.block_id INTO v_block_id
        FROM hostel_allocations ha
        JOIN hostel_rooms hr ON ha.room_id = hr.id
        WHERE ha.student_id = v_visitor.student_id
        AND ha.is_current = true
        AND hr.block_id = v_warden_block;

        IF v_block_id IS NULL THEN
            RETURN json_build_object('success', false, 'error', 'Student not in your block.');
        END IF;
    END IF;

    -- Update approval
    UPDATE hostel_visitors
    SET approval_status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
        is_approved = p_approve,
        approved_by = (SELECT id FROM staff WHERE user_id = p_warden_id LIMIT 1),
        approved_at = NOW()
    WHERE id = p_visitor_id;

    RETURN json_build_object('success', true, 'approved', p_approve);
END;
$$;

-- ============================================================
-- 2. UNALLOCATED STUDENTS VIEW
-- ============================================================
CREATE OR REPLACE VIEW unallocated_students AS
SELECT
    s.id AS student_id,
    u.name AS full_name,
    s.roll_number,
    s.department_id,
    d.name AS department_name,
    s.semester,
    s.batch_year,
    s.created_at AS admission_date
FROM students s
JOIN users u ON s.user_id = u.id
LEFT JOIN departments d ON s.department_id = d.id
WHERE u.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM hostel_allocations ha
    WHERE ha.student_id = s.id
    AND ha.is_current = true
)
ORDER BY u.name;

-- RPC: Get unallocated students for warden's institution
CREATE OR REPLACE FUNCTION get_unallocated_students()
RETURNS TABLE (
    student_id UUID,
    full_name TEXT,
    roll_number VARCHAR,
    department_name TEXT,
    semester INTEGER,
    batch_year VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT us.student_id, us.full_name, us.roll_number,
           us.department_name, us.semester, us.batch_year
    FROM unallocated_students us
    WHERE us.student_id IS NOT NULL;
END;
$$;

-- ============================================================
-- 3. HOSTEL CHECKOUT / ROOM VACATING WORKFLOW
-- ============================================================
CREATE OR REPLACE FUNCTION checkout_hostel_room(
    p_allocation_id UUID,
    p_warden_id UUID,
    p_reason TEXT DEFAULT '',
    p_deposit_action VARCHAR(20) DEFAULT 'refunded'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_allocation RECORD;
    v_block_id UUID;
    v_warden_block UUID;
BEGIN
    SELECT * INTO v_allocation FROM hostel_allocations WHERE id = p_allocation_id;
    IF v_allocation IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Allocation not found.');
    END IF;

    IF v_allocation.is_current = false THEN
        RETURN json_build_object('success', false, 'error', 'Allocation already closed.');
    END IF;

    -- Get warden's block
    SELECT hb.id INTO v_warden_block
    FROM hostel_blocks hb
    WHERE hb.warden_id = p_warden_id
    LIMIT 1;

    -- Verify room is in warden's block
    SELECT hr.block_id INTO v_block_id
    FROM hostel_rooms hr
    WHERE hr.id = v_allocation.room_id;

    IF v_warden_block IS NOT NULL AND v_block_id != v_warden_block THEN
        RETURN json_build_object('success', false, 'error', 'Room not in your block.');
    END IF;

    -- Close allocation
    UPDATE hostel_allocations
    SET is_current = false,
        vacated_date = CURRENT_DATE,
        vacating_reason = p_reason,
        deposit_status = CASE WHEN p_deposit_action = 'refunded' THEN 'refunded'
                              WHEN p_deposit_action = 'forfeited' THEN 'paid'
                              ELSE deposit_status END
    WHERE id = p_allocation_id;

    -- Update room occupied count
    UPDATE hostel_rooms
    SET occupied = GREATEST(occupied - 1, 0)
    WHERE id = v_allocation.room_id;

    RETURN json_build_object('success', true, 'message', 'Room vacated successfully.');
END;
$$;

-- ============================================================
-- 4. NIGHTLY CURFEW / HEADCOUNT CHECK-IN
-- ============================================================
CREATE TABLE IF NOT EXISTS curfew_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    block_id UUID NOT NULL REFERENCES hostel_blocks(id) ON DELETE CASCADE,
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    is_present BOOLEAN DEFAULT false,
    marked_by UUID REFERENCES users(id),
    remarks TEXT,
    marked_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (block_id, check_date, student_id)
);

CREATE TABLE IF NOT EXISTS curfew_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    block_id UUID NOT NULL REFERENCES hostel_blocks(id) ON DELETE CASCADE,
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,
    absent_student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    alert_sent_to_parent BOOLEAN DEFAULT false,
    alert_sent_at TIMESTAMP WITH TIME ZONE,
    warden_notified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE curfew_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE curfew_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Warden can manage curfew in their block" ON curfew_checkins
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Warden')
        AND (
            get_auth_user_role() != 'Warden'
            OR block_id IN (
                SELECT hb.id FROM hostel_blocks hb
                WHERE hb.warden_id = auth.uid()
            )
        )
    );

CREATE POLICY "Warden can view curfew alerts" ON curfew_alerts
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Warden')
    );

CREATE POLICY "System can insert curfew alerts" ON curfew_alerts
    FOR INSERT WITH CHECK (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Warden')
    );

-- RPC: Mark curfew check-in for a block
CREATE OR REPLACE FUNCTION mark_curfew_checkin(
    p_block_id UUID,
    p_warden_id UUID,
    pcheck_date DATE DEFAULT CURRENT_DATE,
    p_students JSONB DEFAULT '[]'::JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_warden_block UUID;
    v_entry JSONB;
    v_present_count INTEGER := 0;
    v_absent_count INTEGER := 0;
    v_student RECORD;
BEGIN
    -- Verify warden owns this block
    SELECT hb.id INTO v_warden_block
    FROM hostel_blocks hb
    WHERE hb.id = p_block_id AND hb.warden_id = p_warden_id;

    IF v_warden_block IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Block not assigned to you.');
    END IF;

    -- Mark each student
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_students)
    LOOP
        INSERT INTO curfew_checkins (institution_id, block_id, check_date, student_id, is_present, marked_by, marked_at)
        VALUES (
            (SELECT institution_id FROM hostel_blocks WHERE id = p_block_id),
            p_block_id,
            pcheck_date,
            (v_entry->>'student_id')::UUID,
            (v_entry->>'is_present')::BOOLEAN,
            p_warden_id,
            NOW()
        )
        ON CONFLICT (block_id, check_date, student_id)
        DO UPDATE SET
            is_present = EXCLUDED.is_present,
            marked_by = EXCLUDED.marked_by,
            marked_at = NOW();

        IF (v_entry->>'is_present')::BOOLEAN THEN
            v_present_count := v_present_count + 1;
        ELSE
            v_absent_count := v_absent_count + 1;

            -- Create alert for absent student
            INSERT INTO curfew_alerts (institution_id, block_id, check_date, absent_student_id)
            VALUES (
                (SELECT institution_id FROM hostel_blocks WHERE id = p_block_id),
                p_block_id,
                pcheck_date,
                (v_entry->>'student_id')::UUID
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'present', v_present_count,
        'absent', v_absent_count
    );
END;
$$;

-- RPC: Get curfew status for a block on a date
CREATE OR REPLACE FUNCTION get_curfew_status(
    p_block_id UUID,
    pcheck_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    roll_number VARCHAR,
    room_number VARCHAR,
    is_present BOOLEAN,
    marked_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        u.name,
        s.roll_number,
        hr.room_number,
        COALESCE(cc.is_present, false),
        cc.marked_at
    FROM hostel_allocations ha
    JOIN hostel_rooms hr ON ha.room_id = hr.id
    JOIN students s ON ha.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN curfew_checkins cc
        ON cc.student_id = s.id
        AND cc.block_id = p_block_id
        AND cc.check_date = pcheck_date
    WHERE hr.block_id = p_block_id
    AND ha.is_current = true
    ORDER BY hr.room_number, u.name;
END;
$$;

-- ============================================================
-- 5. MESS / MEAL SUBSCRIPTION VIEW PER BLOCK
-- ============================================================
CREATE OR REPLACE FUNCTION get_block_meal_subscriptions(p_block_id UUID)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    roll_number VARCHAR,
    room_number VARCHAR,
    plan_name VARCHAR,
    meals_total INTEGER,
    meals_used INTEGER,
    meals_remaining INTEGER,
    subscription_status VARCHAR,
    start_date DATE,
    end_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        u.name,
        s.roll_number,
        hr.room_number,
        mp.name,
        ms.meals_total,
        ms.meals_used,
        (ms.meals_total - ms.meals_used),
        ms.status,
        ms.start_date,
        ms.end_date
    FROM hostel_allocations ha
    JOIN hostel_rooms hr ON ha.room_id = hr.id
    JOIN students s ON ha.student_id = s.id
    JOIN users u ON s.user_id = u.id
    JOIN meal_subscriptions ms ON ms.student_id = s.id
    LEFT JOIN meal_plans mp ON ms.plan_id = mp.id
    WHERE hr.block_id = p_block_id
    AND ha.is_current = true
    AND ms.status = 'active'
    ORDER BY u.name;
END;
$$;

-- ============================================================
-- 6. ROOM TRANSFER REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS room_transfer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    current_room_id UUID REFERENCES hostel_rooms(id),
    requested_room_id UUID REFERENCES hostel_rooms(id),
    reason TEXT NOT NULL,
    reason_category VARCHAR(30) DEFAULT 'other' CHECK (reason_category IN (
        'roommate_conflict', 'health', 'proximity', 'noise', 'maintenance', 'other'
    )),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'warden_approved', 'admin_approved', 'rejected', 'completed'
    )),
    warden_id UUID REFERENCES users(id),
    warden_remarks TEXT,
    warden_approved_at TIMESTAMP WITH TIME ZONE,
    admin_id UUID REFERENCES users(id),
    admin_remarks TEXT,
    admin_approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE room_transfer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own transfer requests" ON room_transfer_requests
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "Students can create transfer requests" ON room_transfer_requests
    FOR INSERT WITH CHECK (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Warden can manage transfers in their block" ON room_transfer_requests
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Warden')
        AND (
            get_auth_user_role() != 'Warden'
            OR current_room_id IN (
                SELECT hr.id FROM hostel_rooms hr
                JOIN hostel_blocks hb ON hr.block_id = hb.id
                WHERE hb.warden_id = auth.uid()
            )
        )
    );

-- RPC: Warden approves room transfer
CREATE OR REPLACE FUNCTION approve_room_transfer(
    p_request_id UUID,
    p_warden_id UUID,
    p_approve BOOLEAN,
    p_remarks TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request RECORD;
    v_warden_block UUID;
    v_new_room RECORD;
BEGIN
    SELECT * INTO v_request FROM room_transfer_requests WHERE id = p_request_id;
    IF v_request IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Request not found.');
    END IF;

    IF v_request.status != 'pending' THEN
        RETURN json_build_object('success', false, 'error', 'Request already processed.');
    END IF;

    -- Verify warden's block
    SELECT hb.id INTO v_warden_block
    FROM hostel_blocks hb
    WHERE hb.warden_id = p_warden_id
    LIMIT 1;

    -- Verify current room is in warden's block
    IF v_warden_block IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM hostel_rooms hr
            WHERE hr.id = v_request.current_room_id
            AND hr.block_id = v_warden_block
        ) THEN
            RETURN json_build_object('success', false, 'error', 'Current room not in your block.');
        END IF;
    END IF;

    IF p_approve THEN
        -- Check requested room has capacity
        IF v_request.requested_room_id IS NOT NULL THEN
            SELECT * INTO v_new_room FROM hostel_rooms WHERE id = v_request.requested_room_id;
            IF v_new_room IS NULL THEN
                RETURN json_build_object('success', false, 'error', 'Requested room not found.');
            END IF;
            IF v_new_room.occupied >= v_new_room.capacity THEN
                RETURN json_build_object('success', false, 'error', 'Requested room is full.');
            END IF;
        END IF;

        UPDATE room_transfer_requests
        SET status = 'warden_approved',
            warden_id = p_warden_id,
            warden_remarks = p_remarks,
            warden_approved_at = NOW()
        WHERE id = p_request_id;
    ELSE
        UPDATE room_transfer_requests
        SET status = 'rejected',
            warden_id = p_warden_id,
            warden_remarks = p_remarks,
            warden_approved_at = NOW()
        WHERE id = p_request_id;
    END IF;

    RETURN json_build_object('success', true, 'approved', p_approve);
END;
$$;

-- RPC: Complete room transfer (move student to new room)
CREATE OR REPLACE FUNCTION complete_room_transfer(p_request_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request RECORD;
    v_old_room_id UUID;
BEGIN
    SELECT * INTO v_request FROM room_transfer_requests WHERE id = p_request_id;
    IF v_request IS NULL OR v_request.status != 'warden_approved' THEN
        RETURN json_build_object('success', false, 'error', 'Request not ready for completion.');
    END IF;

    IF v_request.requested_room_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No target room specified.');
    END IF;

    -- Get old room
    SELECT room_id INTO v_old_room_id
    FROM hostel_allocations
    WHERE student_id = v_request.student_id AND is_current = true;

    -- Update allocation
    UPDATE hostel_allocations
    SET room_id = v_request.requested_room_id
    WHERE student_id = v_request.student_id AND is_current = true;

    -- Update old room count
    IF v_old_room_id IS NOT NULL THEN
        UPDATE hostel_rooms SET occupied = GREATEST(occupied - 1, 0) WHERE id = v_old_room_id;
    END IF;

    -- Update new room count
    UPDATE hostel_rooms SET occupied = occupied + 1 WHERE id = v_request.requested_room_id;

    -- Mark transfer complete
    UPDATE room_transfer_requests SET status = 'completed' WHERE id = p_request_id;

    RETURN json_build_object('success', true, 'message', 'Room transfer completed.');
END;
$$;
