-- ============================================================
-- IRIS 365 — Feature Logic Fixes
-- Late fees, timetable scoping, library fine payment,
-- event capacity enforcement, gate blacklist check
-- ============================================================

-- ============================================================
-- 1. FEE STRUCTURES: Late fee / penalty columns
-- ============================================================

ALTER TABLE fee_structures
  ADD COLUMN IF NOT EXISTS late_fee_per_day DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_penalty DECIMAL(10,2) DEFAULT 0.00;

-- RPC: Calculate penalty for a fee payment
CREATE OR REPLACE FUNCTION calculate_fee_penalty(
  p_fee_structure_id UUID,
  p_payment_date DATE
) RETURNS DECIMAL AS $$
DECLARE
  v_due_date DATE;
  v_late_fee_per_day DECIMAL;
  v_grace_period_days INTEGER;
  v_max_penalty DECIMAL;
  v_days_late INTEGER;
  v_penalty DECIMAL;
BEGIN
  SELECT due_date, late_fee_per_day, grace_period_days, max_penalty
  INTO v_due_date, v_late_fee_per_day, v_grace_period_days, v_max_penalty
  FROM fee_structures WHERE id = p_fee_structure_id;

  IF NOT FOUND THEN RETURN 0; END IF;

  v_days_late := p_payment_date - v_due_date - v_grace_period_days;

  IF v_days_late <= 0 THEN RETURN 0; END IF;

  v_penalty := v_days_late * v_late_fee_per_day;

  IF v_max_penalty > 0 AND v_penalty > v_max_penalty THEN
    v_penalty := v_max_penalty;
  END IF;

  RETURN v_penalty;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Initiate fee payment with penalty calculation
CREATE OR REPLACE FUNCTION initiate_fee_payment(
  p_institution_id UUID,
  p_student_id UUID,
  p_fee_structure_id UUID,
  p_payment_date DATE DEFAULT CURRENT_DATE
) RETURNS JSON AS $$
DECLARE
  v_amount DECIMAL;
  v_penalty DECIMAL;
  v_total DECIMAL;
  v_fee_name VARCHAR;
  v_due_date DATE;
BEGIN
  SELECT amount, name, due_date
  INTO v_amount, v_fee_name, v_due_date
  FROM fee_structures
  WHERE id = p_fee_structure_id AND institution_id = p_institution_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Fee structure not found');
  END IF;

  v_penalty := calculate_fee_penalty(p_fee_structure_id, p_payment_date);
  v_total := v_amount + v_penalty;

  RETURN json_build_object(
    'success', true,
    'fee_name', v_fee_name,
    'base_amount', v_amount,
    'penalty', v_penalty,
    'total_amount', v_total,
    'due_date', v_due_date,
    'payment_date', p_payment_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. TIMETABLE: Add semester + batch_year scoping
-- ============================================================

ALTER TABLE timetable
  ADD COLUMN IF NOT EXISTS semester INTEGER,
  ADD COLUMN IF NOT EXISTS batch_year VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_timetable_semester_batch ON timetable(semester, batch_year);

-- ============================================================
-- 3. LIBRARY FINE PAYMENT PATH
-- ============================================================

CREATE TABLE IF NOT EXISTS library_fine_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  book_issue_id UUID NOT NULL REFERENCES book_issues(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cash', -- cash, wallet, online
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  receipt_number VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lfp_student ON library_fine_payments(student_id);
CREATE INDEX idx_lfp_issue ON library_fine_payments(book_issue_id);

ALTER TABLE library_fine_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lfp_select" ON library_fine_payments
  FOR SELECT USING (
    institution_id = get_auth_institution_id()
    OR get_auth_user_role() = 'SuperAdmin'
  );

CREATE POLICY "lfp_insert" ON library_fine_payments
  FOR INSERT WITH CHECK (
    get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Staff')
    AND institution_id = get_auth_institution_id()
  );

-- RPC: Pay library fine (atomic: insert payment + clear fine on book_issue)
CREATE OR REPLACE FUNCTION pay_library_fine(
  p_institution_id UUID,
  p_student_id UUID,
  p_book_issue_id UUID,
  p_amount DECIMAL,
  p_payment_method VARCHAR DEFAULT 'cash',
  p_recorded_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_fine_amount DECIMAL;
  v_existing_payment DECIMAL;
  v_net_fine DECIMAL;
  v_receipt VARCHAR;
BEGIN
  -- Get the fine amount
  SELECT fine_amount INTO v_fine_amount
  FROM book_issues
  WHERE id = p_book_issue_id AND student_id = p_student_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Book issue not found');
  END IF;

  IF v_fine_amount IS NULL OR v_fine_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'No fine outstanding');
  END IF;

  -- Check existing payments
  SELECT COALESCE(SUM(amount), 0) INTO v_existing_payment
  FROM library_fine_payments
  WHERE book_issue_id = p_book_issue_id AND student_id = p_student_id;

  v_net_fine := v_fine_amount - v_existing_payment;

  IF p_amount > v_net_fine THEN
    p_amount := v_net_fine;
  END IF;

  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Fine already fully paid');
  END IF;

  -- Generate receipt number
  v_receipt := 'LIB-' || to_char(now(), 'YYYYMMDD') || '-' || substring(md5(random()::text), 1, 8);

  -- Insert payment
  INSERT INTO library_fine_payments (institution_id, student_id, book_issue_id, amount, payment_method, recorded_by, receipt_number)
  VALUES (p_institution_id, p_student_id, p_book_issue_id, p_amount, p_payment_method, p_recorded_by, v_receipt);

  -- Update fine_amount on book_issue if fully paid
  IF v_existing_payment + p_amount >= v_fine_amount THEN
    UPDATE book_issues SET fine_amount = 0, fine_paid = true WHERE id = p_book_issue_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'amount_paid', p_amount,
    'remaining_fine', GREATEST(0, v_net_fine - p_amount),
    'receipt_number', v_receipt
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. EVENTS: Atomic registration with capacity check
-- ============================================================

CREATE OR REPLACE FUNCTION register_event_atomic(
  p_institution_id UUID,
  p_event_id UUID,
  p_student_id UUID
) RETURNS JSON AS $$
DECLARE
  v_max_participants INTEGER;
  v_current_count INTEGER;
  v_event_status VARCHAR;
  v_event_name VARCHAR;
  v_registration_id UUID;
BEGIN
  -- Lock the event row
  SELECT max_participants, status, name
  INTO v_max_participants, v_event_status, v_event_name
  FROM events
  WHERE id = p_event_id AND institution_id = p_institution_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Event not found');
  END IF;

  IF v_event_status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'Event is not active (status: ' || v_event_status || ')');
  END IF;

  -- Check if already registered
  IF EXISTS (SELECT 1 FROM event_registrations WHERE event_id = p_event_id AND student_id = p_student_id) THEN
    RETURN json_build_object('success', false, 'error', 'Already registered for this event');
  END IF;

  -- Check capacity (if max_participants is set)
  IF v_max_participants IS NOT NULL AND v_max_participants > 0 THEN
    SELECT COUNT(*) INTO v_current_count
    FROM event_registrations
    WHERE event_id = p_event_id AND payment_status != 'cancelled';

    IF v_current_count >= v_max_participants THEN
      RETURN json_build_object('success', false, 'error', 'Event is full (' || v_max_participants || ' max)', 'current', v_current_count);
    END IF;

    -- Atomically increment
    UPDATE events SET
      max_participants = max_participants  -- no-op to hold lock
    WHERE id = p_event_id AND (
      SELECT COUNT(*) FROM event_registrations
      WHERE event_id = p_event_id AND payment_status != 'cancelled'
    ) < v_max_participants;

    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Event filled up concurrently');
    END IF;
  END IF;

  -- Insert registration
  INSERT INTO event_registrations (institution_id, event_id, student_id, registration_date, payment_status)
  VALUES (p_institution_id, p_event_id, p_student_id, now(), 'pending')
  RETURNING id INTO v_registration_id;

  RETURN json_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'event_name', v_event_name,
    'message', 'Registration successful'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. GATE: Extend to deny blacklisted students/staff
-- ============================================================

-- Add person_type to blacklisted_visitors to also cover students/staff
ALTER TABLE blacklisted_visitors
  ADD COLUMN IF NOT EXISTS person_type VARCHAR(20) DEFAULT 'visitor', -- visitor, student, staff
  ADD COLUMN IF NOT EXISTS person_id UUID; -- FK to students.id or users.id

CREATE INDEX IF NOT EXISTS idx_blacklist_person ON blacklisted_visitors(person_type, person_id);

-- RPC: Check if a person is blacklisted at gate entry
CREATE OR REPLACE FUNCTION check_gate_access(
  p_institution_id UUID,
  p_person_id UUID,
  p_person_type VARCHAR DEFAULT 'student'
) RETURNS JSON AS $$
DECLARE
  v_blocked BOOLEAN := false;
  v_reason TEXT;
  v_record JSON;
BEGIN
  -- Check blacklisted_visitors table
  SELECT true, bv.reason INTO v_blocked, v_reason
  FROM blacklisted_visitors bv
  WHERE bv.institution_id = p_institution_id
  AND bv.is_active = true
  AND (
    (p_person_type = 'visitor' AND bv.id_number = p_person_id::TEXT)
    OR (bv.person_type = p_person_type AND bv.person_id = p_person_id)
  )
  LIMIT 1;

  IF v_blocked THEN
    RETURN json_build_object(
      'success', false,
      'allowed', false,
      'reason', 'BLOCKED: ' || COALESCE(v_reason, 'No reason provided'),
      'alert_level', 'high'
    );
  END IF;

  -- Check if student is deactivated / expelled
  IF p_person_type = 'student' THEN
    SELECT json_build_object('name', u.name, 'status', 'active') INTO v_record
    FROM students s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = p_person_id AND s.institution_id = p_institution_id AND u.is_active = true;

    IF v_record IS NULL THEN
      RETURN json_build_object('success', false, 'allowed', false, 'reason', 'Student account deactivated or not found', 'alert_level', 'medium');
    END IF;
  END IF;

  -- Check if staff is deactivated
  IF p_person_type = 'staff' THEN
    SELECT json_build_object('name', u.name) INTO v_record
    FROM staff st
    JOIN users u ON u.id = st.user_id
    WHERE st.id = p_person_id AND st.institution_id = p_institution_id AND u.is_active = true;

    IF v_record IS NULL THEN
      RETURN json_build_object('success', false, 'allowed', false, 'reason', 'Staff account deactivated or not found', 'alert_level', 'medium');
    END IF;
  END IF;

  RETURN json_build_object('success', true, 'allowed', true, 'alert_level', 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. HOSTEL: Ensure checkout RPC exists (already in code,
--    but add an atomic version for consistency)
-- ============================================================

CREATE OR REPLACE FUNCTION checkout_hostel_atomic(
  p_allocation_id UUID,
  p_vacated_date DATE,
  p_vacating_reason TEXT DEFAULT NULL,
  p_recorded_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_allocation RECORD;
  v_room RECORD;
  v_outstanding_fees DECIMAL;
  v_open_complaints INTEGER;
BEGIN
  -- Lock the allocation row
  SELECT ha.*, hr.id AS room_id_ref, hr.occupied, hr.capacity
  INTO v_allocation
  FROM hostel_allocations ha
  JOIN hostel_rooms hr ON hr.id = ha.room_id
  WHERE ha.id = p_allocation_id AND ha.is_current = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Active allocation not found');
  END IF;

  -- Check outstanding hostel fees
  SELECT COALESCE(SUM(amount - paid_amount), 0) INTO v_outstanding_fees
  FROM hostel_fees
  WHERE student_id = v_allocation.student_id AND paid_amount < amount;

  IF v_outstanding_fees > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Outstanding hostel fees: ₹' || v_outstanding_fees);
  END IF;

  -- Check open complaints
  SELECT COUNT(*) INTO v_open_complaints
  FROM hostel_complaints
  WHERE student_id = v_allocation.student_id
  AND status NOT IN ('resolved', 'closed');

  -- Update allocation
  UPDATE hostel_allocations
  SET is_current = false,
      vacated_date = p_vacated_date,
      vacating_reason = p_vacating_reason
  WHERE id = p_allocation_id;

  -- Decrement room occupied count
  UPDATE hostel_rooms
  SET occupied = GREATEST(0, occupied - 1)
  WHERE id = v_allocation.room_id;

  RETURN json_build_object(
    'success', true,
    'student_id', v_allocation.student_id,
    'room_number', (SELECT room_number FROM hostel_rooms WHERE id = v_allocation.room_id),
    'vacated_date', p_vacated_date,
    'open_complaints', v_open_complaints,
    'message', 'Checkout successful. Room has been vacated.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. SEED: Add HOD role to module_permissions
--    (Duplicate-safe with the security_hardening migration)
-- ============================================================

INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT i.id, 'HOD', m.module, true, m.w, false
FROM institutions i
CROSS JOIN (VALUES
  ('dashboard', true), ('students', true), ('attendance', true), ('timetable', true),
  ('exams', true), ('notices', true), ('obe', true), ('library', true),
  ('fees', false), ('canteen', false), ('hostel', false), ('placements', false),
  ('hr', false), ('gate', false), ('gym', false), ('transit', false),
  ('events', false), ('idcards', false), ('ai_concierge', false), ('naac', false),
  ('admissions', false), ('faculty_development', true), ('achievements', false),
  ('director', false), ('parent_portal', false)
) AS m(module, w)
ON CONFLICT (institution_id, role, module) DO NOTHING;
