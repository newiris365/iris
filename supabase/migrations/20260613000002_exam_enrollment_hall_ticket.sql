-- =========================================================================
-- EXAM ENROLLMENT & HALL TICKET MODULE
-- =========================================================================

-- 1. EXAM ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS exam_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'enrolled',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_exam_enrollment UNIQUE (exam_id, student_id)
);

ALTER TABLE exam_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Director can manage exam enrollments"
  ON exam_enrollments FOR ALL
  USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
    AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
  );

CREATE POLICY "Teachers can view exam enrollments"
  ON exam_enrollments FOR SELECT
  USING (
    get_auth_user_role() = 'Teacher'
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "Students can view their own enrollments"
  ON exam_enrollments FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Parents can view linked child enrollments"
  ON exam_enrollments FOR SELECT
  USING (
    student_id IN (
      SELECT student_id FROM parent_student_links
      WHERE parent_user_id = auth.uid() AND verified = true
    )
  );

-- 2. HALL TICKETS TABLE
CREATE TABLE IF NOT EXISTS hall_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES exam_enrollments(id) ON DELETE SET NULL,
  ticket_number VARCHAR(50) NOT NULL,
  qr_token VARCHAR(255),
  room_number VARCHAR(50),
  seat_number VARCHAR(10),
  exam_date DATE,
  exam_shift VARCHAR(20) DEFAULT 'Morning',
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_hall_ticket_per_exam UNIQUE (exam_id, student_id),
  CONSTRAINT unique_ticket_number_per_exam UNIQUE (exam_id, ticket_number)
);

ALTER TABLE hall_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Director can manage hall tickets"
  ON hall_tickets FOR ALL
  USING (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Director')
    AND (get_auth_user_role() = 'SuperAdmin' OR institution_id = get_auth_institution_id())
  );

CREATE POLICY "Teachers can view hall tickets"
  ON hall_tickets FOR SELECT
  USING (
    get_auth_user_role() = 'Teacher'
    AND institution_id = get_auth_institution_id()
  );

CREATE POLICY "Students can view their own hall tickets"
  ON hall_tickets FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Parents can view linked child hall tickets"
  ON hall_tickets FOR SELECT
  USING (
    student_id IN (
      SELECT student_id FROM parent_student_links
      WHERE parent_user_id = auth.uid() AND verified = true
    )
  );

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_exam_enrollments_exam ON exam_enrollments(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_enrollments_student ON exam_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_enrollments_institution ON exam_enrollments(institution_id);
CREATE INDEX IF NOT EXISTS idx_hall_tickets_exam ON hall_tickets(exam_id);
CREATE INDEX IF NOT EXISTS idx_hall_tickets_student ON hall_tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_hall_tickets_institution ON hall_tickets(institution_id);

-- 4. RPC: Generate Hall Tickets for an Exam
CREATE OR REPLACE FUNCTION generate_hall_tickets(p_exam_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT, tickets_generated INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_institution_id UUID;
  v_exam RECORD;
  v_enrollment RECORD;
  v_seating RECORD;
  v_ticket_count INTEGER := 0;
  v_ticket_number VARCHAR(50);
  v_counter INTEGER := 1;
BEGIN
  -- Get exam details
  SELECT * INTO v_exam FROM exams WHERE id = p_exam_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Exam not found'::TEXT, 0;
    RETURN;
  END IF;

  v_institution_id := v_exam.institution_id;

  -- Loop through all enrolled students
  FOR v_enrollment IN
    SELECT ee.*, s.roll_number
    FROM exam_enrollments ee
    JOIN students s ON s.id = ee.student_id
    WHERE ee.exam_id = p_exam_id AND ee.status = 'enrolled'
  LOOP
    -- Check if hall ticket already exists
    IF EXISTS (SELECT 1 FROM hall_tickets WHERE exam_id = p_exam_id AND student_id = v_enrollment.student_id) THEN
      v_counter := v_counter + 1;
      CONTINUE;
    END IF;

    -- Try to get seating allocation
    SELECT * INTO v_seating
    FROM exam_seating
    WHERE exam_id = p_exam_id AND student_id = v_enrollment.student_id
    LIMIT 1;

    -- Generate ticket number
    v_ticket_number := 'EXAM-' || UPPER(LEFT(v_exam.name, 3)) || '-' || LPAD(v_counter::TEXT, 4, '0');

    -- Insert hall ticket
    INSERT INTO hall_tickets (
      institution_id, exam_id, student_id, enrollment_id,
      ticket_number, qr_token, room_number, seat_number,
      exam_date, exam_shift
    ) VALUES (
      v_institution_id, p_exam_id, v_enrollment.student_id, v_enrollment.id,
      v_ticket_number, gen_random_uuid()::TEXT,
      COALESCE(v_seating.room_number, 'TBD'),
      COALESCE(v_seating.seat_number, 'TBD'),
      v_exam.start_date,
      CASE WHEN v_counter % 2 = 0 THEN 'Afternoon' ELSE 'Morning' END
    );

    v_ticket_count := v_ticket_count + 1;
    v_counter := v_counter + 1;
  END LOOP;

  RETURN QUERY SELECT TRUE, v_ticket_count || ' hall tickets generated successfully'::TEXT, v_ticket_count;
END;
$$;
