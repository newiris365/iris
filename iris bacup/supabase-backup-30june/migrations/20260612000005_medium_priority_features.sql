-- ============================================================
-- MEDIUM PRIORITY: Exam Seating, Lost & Found, Notice Read Receipts
-- ============================================================

-- ============================================================
-- 1. EXAM HALL SEATING ALLOCATION
-- ============================================================

CREATE TABLE IF NOT EXISTS exam_seating (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    invigilator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_checked_in BOOLEAN NOT NULL DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    qr_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_seat_per_exam UNIQUE (exam_id, room_number, seat_number),
    CONSTRAINT unique_student_per_exam UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS exam_halls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    hall_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 30,
    has_ac BOOLEAN NOT NULL DEFAULT false,
    has_projector BOOLEAN NOT NULL DEFAULT false,
    floor_number INTEGER DEFAULT 1,
    building VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_hall_room UNIQUE (institution_id, room_number)
);

-- Enable RLS
ALTER TABLE exam_seating ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_halls ENABLE ROW LEVEL SECURITY;

-- RLS for exam_seating
CREATE POLICY "Admin/Director can manage exam seating" ON exam_seating
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Teachers can view seating for their exams" ON exam_seating
    FOR SELECT USING (
        get_auth_user_role() = 'Teacher'
        AND institution_id = get_auth_institution_id()
    );

CREATE POLICY "Students can view their own seating" ON exam_seating
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "Parents can view linked child seating" ON exam_seating
    FOR SELECT USING (
        student_id IN (
            SELECT student_id FROM parent_student_links
            WHERE parent_user_id = auth.uid() AND verified = true
        )
    );

-- RLS for exam_halls
CREATE POLICY "Admin can manage exam halls" ON exam_halls
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "Staff can view exam halls" ON exam_halls
    FOR SELECT USING (
        get_auth_user_role() IN ('Teacher', 'Staff', 'Director', 'HOD')
        AND institution_id = get_auth_institution_id()
        AND is_active = true
    );

-- RPC: Auto-allocate seating for an exam
CREATE OR REPLACE FUNCTION auto_allocate_seating(p_exam_id UUID)
RETURNS TABLE (
    total_allocated INTEGER,
    rooms_used INTEGER,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exam RECORD;
    v_hall RECORD;
    v_students UUID[];
    v_seat_counter INTEGER;
    v_total INTEGER := 0;
    v_room_count INTEGER := 0;
BEGIN
    -- Get exam details
    SELECT * INTO v_exam FROM exams WHERE id = p_exam_id;
    IF v_exam IS NULL THEN
        RAISE EXCEPTION 'Exam not found';
    END IF;

    -- Get enrolled students for this exam
    SELECT ARRAY_AGG(s.id ORDER BY s.roll_number) INTO v_students
    FROM students s
    WHERE s.department_id = v_exam.department_id
      AND s.is_active = true
      AND s.year = v_exam.year;

    IF v_students IS NULL OR array_length(v_students, 1) = 0 THEN
        total_allocated := 0;
        rooms_used := 0;
        message := 'No students found for this exam';
        RETURN NEXT;
        RETURN;
    END IF;

    -- Clear existing seating for this exam
    DELETE FROM exam_seating WHERE exam_id = p_exam_id;

    -- Allocate seats room by room
    v_seat_counter := 1;
    FOR v_hall IN
        SELECT * FROM exam_halls
        WHERE institution_id = v_exam.institution_id
          AND is_active = true
        ORDER BY capacity DESC
    LOOP
        EXIT WHEN v_seat_counter > array_length(v_students, 1);

        FOR i IN 1..LEAST(v_hall.capacity, array_length(v_students, 1) - v_seat_counter + 1) LOOP
            INSERT INTO exam_seating (exam_id, institution_id, room_number, seat_number, student_id)
            VALUES (
                p_exam_id,
                v_exam.institution_id,
                v_hall.room_number,
                LPAD(i::TEXT, 3, '0'),
                v_students[v_seat_counter]
            );
            v_seat_counter := v_seat_counter + 1;
            v_total := v_total + 1;
        END LOOP;

        v_room_count := v_room_count + 1;
    END LOOP;

    total_allocated := v_total;
    rooms_used := v_room_count;
    message := 'Allocated ' || v_total || ' students across ' || v_room_count || ' rooms';
    RETURN NEXT;
END;
$$;

-- RPC: Check-in student at exam hall via QR scan
CREATE OR REPLACE FUNCTION checkin_exam_seat(
    p_exam_id UUID,
    p_room_number VARCHAR,
    p_seat_number VARCHAR,
    p_student_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    seat_info JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seat RECORD;
BEGIN
    SELECT * INTO v_seat
    FROM exam_seating
    WHERE exam_id = p_exam_id
      AND room_number = p_room_number
      AND seat_number = p_seat_number;

    IF v_seat IS NULL THEN
        success := false;
        message := 'No seat found for this room/seat combination';
        seat_info := NULL;
        RETURN NEXT;
        RETURN;
    END IF;

    IF v_seat.student_id != p_student_id THEN
        success := false;
        message := 'This seat is assigned to a different student';
        seat_info := NULL;
        RETURN NEXT;
        RETURN;
    END IF;

    UPDATE exam_seating
    SET is_checked_in = true, checked_in_at = NOW()
    WHERE id = v_seat.id;

    success := true;
    message := 'Check-in successful';
    seat_info := to_jsonb(v_seat);
    RETURN NEXT;
END;
$$;


-- ============================================================
-- 2. LOST & FOUND MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS lost_found_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Other' CHECK (category IN (
        'Electronics', 'ID Card', 'Wallet', 'Keys', 'Bag', 'Books', 'Clothing', 'Accessories', 'Other'
    )),
    description TEXT,
    photo_url TEXT,
    location_found VARCHAR(255),
    found_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'returned', 'disposed')),
    claimed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    claimed_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE lost_found_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin/Security can manage lost found items" ON lost_found_items
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Security')
        AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
    );

CREATE POLICY "All users can view available lost found items" ON lost_found_items
    FOR SELECT USING (
        institution_id = get_auth_institution_id()
    );

CREATE POLICY "Students can claim items" ON lost_found_items
    FOR UPDATE USING (
        get_auth_user_role() = 'Student'
        AND institution_id = get_auth_institution_id()
    );

-- RPC: Claim a lost found item
CREATE OR REPLACE FUNCTION claim_lost_found_item(p_item_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
BEGIN
    SELECT * INTO v_item FROM lost_found_items WHERE id = p_item_id;

    IF v_item IS NULL THEN
        success := false;
        message := 'Item not found';
        RETURN NEXT;
        RETURN;
    END IF;

    IF v_item.status != 'available' THEN
        success := false;
        message := 'This item is no longer available';
        RETURN NEXT;
        RETURN;
    END IF;

    UPDATE lost_found_items
    SET status = 'claimed',
        claimed_by = auth.uid(),
        claimed_at = NOW()
    WHERE id = p_item_id;

    success := true;
    message := 'Item claimed. Please collect from the security desk.';
    RETURN NEXT;
END;
$$;


-- ============================================================
-- 3. NOTICE READ RECEIPTS ENHANCEMENT
-- ============================================================

-- Add status column to notices if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notices' AND column_name = 'status'
    ) THEN
        ALTER TABLE notices ADD COLUMN status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'));
    END IF;
END $$;

-- RPC: Get notice read receipt stats
CREATE OR REPLACE FUNCTION get_notice_read_stats(p_notice_id UUID)
RETURNS TABLE (
    notice_id UUID,
    total_target_users BIGINT,
    total_read BIGINT,
    read_percentage NUMERIC,
    unread_users JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notice RECORD;
    v_target_audience VARCHAR;
    v_total_users BIGINT;
    v_total_read BIGINT;
    v_unread JSONB;
BEGIN
    -- Get notice details
    SELECT * INTO v_notice FROM notices WHERE id = p_notice_id;

    IF v_notice IS NULL THEN
        RAISE EXCEPTION 'Notice not found';
    END IF;

    -- Count target users based on audience
    SELECT COUNT(*) INTO v_total_users
    FROM users u
    JOIN students s ON s.user_id = u.id
    WHERE s.institution_id = v_notice.institution_id
      AND s.is_active = true
      AND (
          v_notice.target_audience = 'All'
          OR (v_notice.target_audience = 'Students')
          OR (v_notice.target_audience = 'Staff' AND u.role IN ('Teacher', 'Staff', 'HOD'))
          OR (v_notice.target_audience = 'HOD' AND u.role = 'HOD')
      );

    -- Count users who have read it
    SELECT COUNT(DISTINCT nr.user_id) INTO v_total_read
    FROM notice_reads nr
    WHERE nr.notice_id = p_notice_id;

    -- Get unread users
    SELECT COALESCE(
        json_agg(json_build_object(
            'user_id', u.id,
            'name', u.full_name,
            'email', u.email
        )),
        '[]'::JSON
    ) INTO v_unread
    FROM users u
    JOIN students s ON s.user_id = u.id
    WHERE s.institution_id = v_notice.institution_id
      AND s.is_active = true
      AND u.id NOT IN (
          SELECT user_id FROM notice_reads WHERE notice_id = p_notice_id
      )
      AND (
          v_notice.target_audience = 'All'
          OR (v_notice.target_audience = 'Students')
          OR (v_notice.target_audience = 'Staff' AND u.role IN ('Teacher', 'Staff', 'HOD'))
          OR (v_notice.target_audience = 'HOD' AND u.role = 'HOD')
      )
    LIMIT 50;

    notice_id := p_notice_id;
    total_target_users := v_total_users;
    total_read := v_total_read;
    read_percentage := CASE WHEN v_total_users = 0 THEN 0 ELSE ROUND((v_total_read::NUMERIC / v_total_users::NUMERIC) * 100, 1) END;
    unread_users := v_unread;
    RETURN NEXT;
END;
$$;

-- RPC: Re-notify users who haven't read a notice
CREATE OR REPLACE FUNCTION get_unread_notice_recipients(p_notice_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name VARCHAR,
    email VARCHAR,
    phone VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notice RECORD;
BEGIN
    SELECT * INTO v_notice FROM notices WHERE id = p_notice_id;

    IF v_notice IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT u.id, u.full_name, u.email, s.guardian_phone AS phone
    FROM users u
    JOIN students s ON s.user_id = u.id
    WHERE s.institution_id = v_notice.institution_id
      AND s.is_active = true
      AND u.id NOT IN (
          SELECT user_id FROM notice_reads WHERE notice_id = p_notice_id
      )
      AND (
          v_notice.target_audience = 'All'
          OR (v_notice.target_audience = 'Students')
          OR (v_notice.target_audience = 'Staff' AND u.role IN ('Teacher', 'Staff', 'HOD'))
          OR (v_notice.target_audience = 'HOD' AND u.role = 'HOD')
      );
END;
$$;
