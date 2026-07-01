-- ============================================================
-- BROKEN FIXES: Gym membership, Hostel roommates, Timetable batch, Fee penalties
-- ============================================================

-- ============================================================
-- 1. FIX: Gym booking RPC - add active membership check
-- ============================================================
CREATE OR REPLACE FUNCTION book_gym_slot_atomic(
  p_institution_id UUID,
  p_slot_id UUID,
  p_student_id UUID
) RETURNS JSON AS $$
DECLARE
  v_booking_id UUID;
  v_slot_date DATE;
  v_start_time TIME;
  v_end_time TIME;
  v_has_membership BOOLEAN;
BEGIN
  -- CHECK: Student must have an active gym membership
  SELECT EXISTS (
    SELECT 1 FROM gym_memberships gm
    WHERE gm.student_id = p_student_id
      AND gm.institution_id = p_institution_id
      AND gm.status = 'Active'
      AND gm.end_date >= CURRENT_DATE
      AND (gm.is_frozen IS NOT TRUE OR gm.frozen_until < CURRENT_DATE)
  ) INTO v_has_membership;

  IF NOT v_has_membership THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No active gym membership found. Please purchase a membership before booking slots.'
    );
  END IF;

  -- Check if student already booked this slot
  IF EXISTS (
    SELECT 1 FROM gym_bookings
    WHERE student_id = p_student_id AND slot_id = p_slot_id AND status = 'Booked'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Student already has an active booking for this gym slot. Duplicate booking denied.'
    );
  END IF;

  UPDATE gym_slots
    SET booked_count = booked_count + 1
    WHERE id = p_slot_id
      AND booked_count < capacity
      AND institution_id = p_institution_id
    RETURNING date, start_time, end_time INTO v_slot_date, v_start_time, v_end_time;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Gym slot is fully booked or does not exist.'
    );
  END IF;

  INSERT INTO gym_bookings (institution_id, slot_id, student_id, booking_date, status)
    VALUES (p_institution_id, p_slot_id, p_student_id, CURRENT_DATE, 'Booked')
    RETURNING id INTO v_booking_id;

  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'slot_date', v_slot_date,
    'start_time', v_start_time,
    'end_time', v_end_time
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 2. FIX: Timetable - add semester + batch_year columns
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timetable' AND column_name = 'semester'
  ) THEN
    ALTER TABLE timetable ADD COLUMN semester INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timetable' AND column_name = 'batch_year'
  ) THEN
    ALTER TABLE timetable ADD COLUMN batch_year VARCHAR(10) DEFAULT '';
  END IF;
END $$;

-- RPC: Get student timetable filtered by their semester/batch
CREATE OR REPLACE FUNCTION get_student_timetable_filtered(p_student_id UUID)
RETURNS TABLE (
    id UUID,
    day_of_week VARCHAR,
    time_slot VARCHAR,
    subject VARCHAR,
    teacher_name TEXT,
    room VARCHAR,
    semester INTEGER,
    batch_year VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student RECORD;
BEGIN
  SELECT s.department_id, s.semester, s.batch_year INTO v_student
  FROM students s WHERE s.id = p_student_id;

  IF v_student IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT t.id, t.day_of_week, t.time_slot, t.subject,
         u.full_name AS teacher_name, t.room, t.semester, t.batch_year
  FROM timetable t
  LEFT JOIN staff st ON t.teacher_id = st.id
  LEFT JOIN users u ON st.user_id = u.id
  WHERE t.department_id = v_student.department_id
    AND (t.semester = v_student.semester OR t.semester IS NULL OR t.semester = 0)
    AND (t.batch_year = v_student.batch_year OR t.batch_year = '' OR t.batch_year IS NULL)
  ORDER BY
    CASE t.day_of_week
      WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
      WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
      ELSE 7
    END,
    t.time_slot;
END;
$$;


-- ============================================================
-- 3. FIX: Fee structures - add late fee columns (if not already added)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fee_structures' AND column_name = 'late_fee_per_day'
  ) THEN
    ALTER TABLE fee_structures ADD COLUMN late_fee_per_day NUMERIC(8,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fee_structures' AND column_name = 'grace_period_days'
  ) THEN
    ALTER TABLE fee_structures ADD COLUMN grace_period_days INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fee_structures' AND column_name = 'max_penalty'
  ) THEN
    ALTER TABLE fee_structures ADD COLUMN max_penalty NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- RPC: Calculate late fee penalty for a given student fee
CREATE OR REPLACE FUNCTION calculate_late_fee(p_student_fee_id UUID)
RETURNS TABLE (
    original_amount NUMERIC,
    days_overdue INTEGER,
    late_fee_per_day NUMERIC,
    days_after_grace INTEGER,
    total_late_fee NUMERIC,
    total_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sf RECORD;
  v_fs RECORD;
  v_days_overdue INTEGER;
  v_days_after_grace INTEGER;
  v_late_fee NUMERIC;
BEGIN
  SELECT sf.*, fs.late_fee_per_day, fs.grace_period_days, fs.max_penalty, fs.amount AS fs_amount
  INTO v_sf
  FROM student_fees sf
  JOIN fee_structures fs ON sf.fee_id = fs.id
  WHERE sf.id = p_student_fee_id;

  IF v_sf IS NULL THEN RETURN; END IF;

  v_days_overdue := GREATEST(0, (CURRENT_DATE - v_sf.due_date)::INTEGER);
  v_days_after_grace := GREATEST(0, v_days_overdue - COALESCE(v_sf.grace_period_days, 0));
  v_late_fee := v_days_after_grace * COALESCE(v_sf.late_fee_per_day, 0);

  -- Apply max penalty cap
  IF COALESCE(v_sf.max_penalty, 0) > 0 THEN
    v_late_fee := LEAST(v_late_fee, v_sf.max_penalty);
  END IF;

  original_amount := v_sf.amount;
  days_overdue := v_days_overdue;
  late_fee_per_day := COALESCE(v_sf.late_fee_per_day, 0);
  days_after_grace := v_days_after_grace;
  total_late_fee := v_late_fee;
  total_amount := v_sf.amount + v_late_fee;
  RETURN NEXT;
END;
$$;


-- ============================================================
-- 4. ADD: Canteen - is_special_daily flag + allergen search
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'canteen_menus' AND column_name = 'is_daily_special'
  ) THEN
    ALTER TABLE canteen_menus ADD COLUMN is_daily_special BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- RPC: Get today's menu with allergen filter
CREATE OR REPLACE FUNCTION get_canteen_menu_filtered(
  p_category VARCHAR DEFAULT NULL,
  p_veg_only BOOLEAN DEFAULT FALSE,
  p_exclude_allergens TEXT[] DEFAULT NULL,
  p_search VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    item_name VARCHAR,
    category VARCHAR,
    price DECIMAL,
    image_url TEXT,
    is_available BOOLEAN,
    is_veg BOOLEAN,
    is_daily_special BOOLEAN,
    description TEXT,
    calories INTEGER,
    prep_time_mins INTEGER,
    spice_level INTEGER,
    rating_avg DECIMAL,
    allergens TEXT[],
    stock_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT cm.id, cm.item_name, cm.category, cm.price, cm.image_url,
         cm.is_available, cm.is_veg, cm.is_daily_special,
         cm.description, cm.calories, cm.prep_time_mins,
         cm.spice_level, cm.rating_avg, cm.allergens, cm.stock_remaining
  FROM canteen_menus cm
  WHERE cm.is_available = true
    AND (p_category IS NULL OR cm.category = p_category)
    AND (p_veg_only = FALSE OR cm.is_veg = TRUE)
    AND (p_search IS NULL OR cm.item_name ILIKE '%' || p_search || '%')
    AND (p_exclude_allergens IS NULL OR NOT cm.allergens && p_exclude_allergens)
  ORDER BY cm.is_daily_special DESC, cm.sort_order ASC, cm.rating_avg DESC;
END;
$$;


-- ============================================================
-- 5. ADD: Hostel roommates - dedicated RPC (no data leak)
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_roommates(p_student_id UUID)
RETURNS TABLE (
    student_name TEXT,
    roll_number VARCHAR,
    room_number VARCHAR,
    block_name VARCHAR,
    floor_number INTEGER,
    bed_number VARCHAR,
    course VARCHAR,
    department_name TEXT,
    phone VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_allocation RECORD;
BEGIN
  -- Get current allocation for this student
  SELECT ha.room_id INTO v_allocation
  FROM hostel_allocations ha
  WHERE ha.student_id = p_student_id AND ha.is_current = TRUE;

  IF v_allocation IS NULL THEN RETURN; END IF;

  -- Return only students in the same room
  RETURN QUERY
  SELECT u.full_name AS student_name, s.roll_number,
         hr.room_number, hb.name AS block_name, hr.floor_number,
         ha2.bed_number, s.course, d.name AS department_name, u.phone
  FROM hostel_allocations ha2
  JOIN students s ON ha2.student_id = s.id
  JOIN users u ON s.user_id = u.id
  JOIN hostel_rooms hr ON ha2.room_id = hr.id
  JOIN hostel_blocks hb ON hr.block_id = hb.id
  LEFT JOIN departments d ON s.department_id = d.id
  WHERE ha2.room_id = v_allocation.room_id
    AND ha2.is_current = TRUE
    AND ha2.student_id != p_student_id;
END;
$$;


-- ============================================================
-- 6. ADD: Assignment submission module
-- ============================================================
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(150),
    total_marks INTEGER DEFAULT 100,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'jpg', 'jpeg', 'png'],
    max_file_size_mb INTEGER DEFAULT 10,
    semester INTEGER,
    batch_year VARCHAR(10),
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size_kb INTEGER,
    file_type VARCHAR(10),
    marks_obtained INTEGER,
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned')),
    CONSTRAINT unique_submission_per_assignment UNIQUE (assignment_id, student_id)
);

-- RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff/Admin can manage assignments" ON assignments
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Teacher', 'Staff')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Students can view published assignments" ON assignments
    FOR SELECT USING (
        is_published = true
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Students can view/insert own submissions" ON assignment_submissions
    FOR ALL USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff/Admin can view submissions" ON assignment_submissions
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Teacher', 'Staff')
        AND assignment_id IN (SELECT id FROM assignments WHERE institution_id = get_auth_institution_id())
    );

-- RPC: Submit assignment
CREATE OR REPLACE FUNCTION submit_assignment(
    p_assignment_id UUID,
    p_file_url TEXT,
    p_file_name VARCHAR,
    p_file_size_kb INTEGER,
    p_file_type VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_assignment RECORD;
    v_submission_id UUID;
BEGIN
    SELECT id INTO v_student_id FROM students WHERE user_id = auth.uid();
    IF v_student_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Student profile not found.');
    END IF;

    SELECT * INTO v_assignment FROM assignments WHERE id = p_assignment_id AND is_published = true;
    IF v_assignment IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Assignment not found or not published.');
    END IF;

    IF v_assignment.deadline < NOW() THEN
        RETURN json_build_object('success', false, 'error', 'Submission deadline has passed.');
    END IF;

    -- Upsert (allow resubmission before deadline)
    INSERT INTO assignment_submissions (assignment_id, student_id, file_url, file_name, file_size_kb, file_type, status)
    VALUES (p_assignment_id, v_student_id, p_file_url, p_file_name, p_file_size_kb, p_file_type, 'submitted')
    ON CONFLICT (assignment_id, student_id)
    DO UPDATE SET file_url = EXCLUDED.file_url, file_name = EXCLUDED.file_name,
                  file_size_kb = EXCLUDED.file_size_kb, file_type = EXCLUDED.file_type,
                  submitted_at = NOW(), status = 'submitted', marks_obtained = NULL, feedback = NULL
    RETURNING id INTO v_submission_id;

    RETURN json_build_object('success', true, 'submission_id', v_submission_id);
END;
$$;


-- ============================================================
-- 7. ADD: Study material / notes module
-- ============================================================
CREATE TABLE IF NOT EXISTS study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(150),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(10),
    file_size_kb INTEGER,
    category VARCHAR(50) DEFAULT 'Notes' CHECK (category IN ('Notes', 'Lab Manual', 'Textbook', 'Video', 'PPT', 'Question Bank', 'Syllabus', 'Other')),
    semester INTEGER,
    batch_year VARCHAR(10),
    download_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff/Admin can manage study materials" ON study_materials
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Teacher', 'Staff')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Students can view published materials" ON study_materials
    FOR SELECT USING (
        is_published = true
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Students can view materials for their dept/semester" ON study_materials
    FOR SELECT USING (
        is_published = true
        AND (department_id IS NULL OR department_id IN (
            SELECT department_id FROM students WHERE user_id = auth.uid()
        ))
        AND (semester IS NULL OR semester IN (
            SELECT semester FROM students WHERE user_id = auth.uid()
        ))
    );


-- ============================================================
-- 8. ADD: Leave application module
-- ============================================================
CREATE TABLE IF NOT EXISTS student_leave_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    leave_type VARCHAR(30) NOT NULL CHECK (leave_type IN ('medical', 'od', 'personal', 'half_day', 'emergency')),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'faculty_approved', 'hod_approved', 'rejected')),
    faculty_remarks TEXT,
    faculty_approved_at TIMESTAMP WITH TIME ZONE,
    hod_remarks TEXT,
    hod_approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE student_leave_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view/insert own leaves" ON student_leave_applications
    FOR ALL USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "Faculty/HOD/Admin can view leaves" ON student_leave_applications
    FOR SELECT USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Teacher', 'HOD', 'Staff')
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Faculty/HOD can update leave status" ON student_leave_applications
    FOR UPDATE USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Teacher', 'HOD')
    );

-- RPC: Submit leave application
CREATE OR REPLACE FUNCTION submit_leave_application(
    p_leave_type VARCHAR,
    p_from_date DATE,
    p_to_date DATE,
    p_reason TEXT,
    p_attachment_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_leave_id UUID;
BEGIN
    SELECT id INTO v_student_id FROM students WHERE user_id = auth.uid();
    IF v_student_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Student profile not found.');
    END IF;

    IF p_to_date < p_from_date THEN
        RETURN json_build_object('success', false, 'error', 'End date cannot be before start date.');
    END IF;

    INSERT INTO student_leave_applications (institution_id, student_id, leave_type, from_date, to_date, reason, attachment_url)
    SELECT s.institution_id, v_student_id, p_leave_type, p_from_date, p_to_date, p_reason, p_attachment_url
    FROM students s WHERE s.id = v_student_id
    RETURNING id INTO v_leave_id;

    RETURN json_build_object('success', true, 'leave_id', v_leave_id);
END;
$$;

-- RPC: Approve leave (faculty or HOD)
CREATE OR REPLACE FUNCTION approve_leave(
    p_leave_id UUID,
    p_approver_role VARCHAR,
    p_remarks TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_leave RECORD;
    v_new_status VARCHAR;
BEGIN
    SELECT * INTO v_leave FROM student_leave_applications WHERE id = p_leave_id;
    IF v_leave IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Leave application not found.');
    END IF;

    IF p_approver_role = 'Teacher' OR p_approver_role = 'Staff' THEN
        IF v_leave.status != 'pending' THEN
            RETURN json_build_object('success', false, 'error', 'Leave already processed.');
        END IF;
        v_new_status := 'faculty_approved';
        UPDATE student_leave_applications SET status = v_new_status, faculty_remarks = p_remarks, faculty_approved_at = NOW() WHERE id = p_leave_id;
    ELSIF p_approver_role = 'HOD' OR p_approver_role = 'Admin' THEN
        IF v_leave.status != 'faculty_approved' THEN
            RETURN json_build_object('success', false, 'error', 'Leave must be faculty-approved before HOD approval.');
        END IF;
        v_new_status := 'hod_approved';
        UPDATE student_leave_applications SET status = v_new_status, hod_remarks = p_remarks, hod_approved_at = NOW() WHERE id = p_leave_id;

        -- Auto-mark attendance as excused for approved leave days
        UPDATE attendance SET status = 'excused', notes = 'Leave approved'
        WHERE student_id = v_leave.student_id
          AND date BETWEEN v_leave.from_date AND v_leave.to_date;
    ELSE
        RETURN json_build_object('success', false, 'error', 'Invalid approver role.');
    END IF;

    RETURN json_build_object('success', true, 'new_status', v_new_status);
END;
$$;

-- RPC: Reject leave
CREATE OR REPLACE FUNCTION reject_leave(
    p_leave_id UUID,
    p_remarks TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE student_leave_applications SET status = 'rejected', hod_remarks = p_remarks, hod_approved_at = NOW()
    WHERE id = p_leave_id AND status IN ('pending', 'faculty_approved');

    IF FOUND THEN
        RETURN json_build_object('success', true, 'new_status', 'rejected');
    ELSE
        RETURN json_build_object('success', false, 'error', 'Leave not found or already processed.');
    END IF;
END;
$$;


-- ============================================================
-- 9. ADD: Campus wallet top-up via Razorpay
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('topup', 'deduction', 'refund', 'parent_topup')),
    payment_method VARCHAR(30) DEFAULT 'razorpay',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallet_transactions' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE wallet_transactions ADD COLUMN payment_method VARCHAR(30) DEFAULT 'razorpay';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallet_transactions' AND column_name = 'razorpay_order_id'
  ) THEN
    ALTER TABLE wallet_transactions ADD COLUMN razorpay_order_id VARCHAR(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallet_transactions' AND column_name = 'razorpay_payment_id'
  ) THEN
    ALTER TABLE wallet_transactions ADD COLUMN razorpay_payment_id VARCHAR(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallet_transactions' AND column_name = 'status'
  ) THEN
    ALTER TABLE wallet_transactions ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
  END IF;
END $$;


ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own wallet transactions" ON wallet_transactions
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "System can insert wallet transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update wallet transactions" ON wallet_transactions
    FOR UPDATE USING (true);

-- RPC: Credit wallet after successful payment
CREATE OR REPLACE FUNCTION credit_wallet(
    p_student_id UUID,
    p_amount NUMERIC,
    p_razorpay_order_id VARCHAR,
    p_razorpay_payment_id VARCHAR,
    p_description TEXT DEFAULT 'Wallet top-up'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tx_id UUID;
    v_student RECORD;
BEGIN
    SELECT * INTO v_student FROM students WHERE id = p_student_id;
    IF v_student IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Student not found.');
    END IF;

    INSERT INTO wallet_transactions (institution_id, student_id, amount, type, razorpay_order_id, razorpay_payment_id, status, description)
    VALUES (v_student.institution_id, p_student_id, p_amount, 'topup', p_razorpay_order_id, p_razorpay_payment_id, 'completed', p_description)
    RETURNING id INTO v_tx_id;

    -- Update student wallet balance (students table needs wallet_balance column)
    UPDATE students SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount WHERE id = p_student_id;

    RETURN json_build_object('success', true, 'transaction_id', v_tx_id, 'new_balance', (SELECT wallet_balance FROM students WHERE id = p_student_id));
END;
$$;

-- Add wallet_balance column to students if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'wallet_balance'
  ) THEN
    ALTER TABLE students ADD COLUMN wallet_balance NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;


-- ============================================================
-- 10. ADD: Bus ETA endpoint for student's stop
-- ============================================================
CREATE OR REPLACE FUNCTION get_bus_eta_for_student(p_student_id UUID)
RETURNS TABLE (
    bus_id UUID,
    bus_name VARCHAR,
    route_name VARCHAR,
    stop_name VARCHAR,
    stop_index INTEGER,
    distance_km NUMERIC,
    eta_minutes INTEGER,
    latitude NUMERIC,
    longitude NUMERIC,
    last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription RECORD;
    v_bus RECORD;
    v_bus_id UUID;
    v_stop_index INTEGER;
    v_distance NUMERIC;
    v_velocity NUMERIC;
BEGIN
    -- Get student's bus subscription
    SELECT bs.route_id, bs.stop_name, br.stops
    INTO v_subscription
    FROM transport_subscriptions bs
    JOIN bus_routes br ON bs.route_id = br.id
    WHERE bs.student_id = p_student_id AND bs.status = 'active'
    LIMIT 1;

    IF v_subscription IS NULL THEN RETURN; END IF;

    -- Get bus assigned to this route
    SELECT b.id INTO v_bus_id
    FROM buses b
    WHERE b.route_id = v_subscription.route_id
    LIMIT 1;

    IF v_bus_id IS NULL THEN RETURN; END IF;

    -- Get latest bus location
    SELECT bl.bus_id, bl.latitude, bl.longitude, bl.speed, bl.recorded_at
    INTO v_bus
    FROM bus_tracking bl
    WHERE bl.bus_id = v_bus_id
    ORDER BY bl.recorded_at DESC
    LIMIT 1;

    IF v_bus IS NULL THEN RETURN; END IF;

    -- Find stop_index from JSONB stops array
    SELECT (pos - 1)::INTEGER INTO v_stop_index
    FROM jsonb_array_elements(v_subscription.stops) WITH ORDINALITY AS arr(elem, pos)
    WHERE elem->>'name' = v_subscription.stop_name
    LIMIT 1;

    IF v_stop_index IS NULL THEN RETURN; END IF;

    -- Calculate distance to student's stop using Haversine
    IF v_subscription.stops IS NOT NULL AND jsonb_array_length(v_subscription.stops) > 0 THEN
        DECLARE
            v_stop_lat NUMERIC;
            v_stop_lon NUMERIC;
        BEGIN
            v_stop_lat := (v_subscription.stops->v_stop_index->>'latitude')::NUMERIC;
            v_stop_lon := (v_subscription.stops->v_stop_index->>'longitude')::NUMERIC;

            v_distance := (
                6371 * acos(
                    cos(radians(v_bus.latitude)) * cos(radians(v_stop_lat)) *
                    cos(radians(v_stop_lon) - radians(v_bus.longitude)) +
                    sin(radians(v_bus.latitude)) * sin(radians(v_stop_lat))
                )
            );

            v_velocity := CASE WHEN v_bus.speed > 5 THEN v_bus.speed ELSE 25 END;

            bus_id := v_bus.bus_id;
            bus_name := (SELECT name FROM buses WHERE id = v_bus.bus_id);
            route_name := (SELECT route_name FROM bus_routes WHERE id = v_subscription.route_id);
            stop_name := v_subscription.stop_name;
            stop_index := v_stop_index;
            distance_km := ROUND(v_distance, 2);
            eta_minutes := ROUND((v_distance / v_velocity) * 60);
            latitude := v_bus.latitude;
            longitude := v_bus.longitude;
            last_updated := v_bus.recorded_at;
            RETURN NEXT;
        END;
    END IF;
END;
$$;
