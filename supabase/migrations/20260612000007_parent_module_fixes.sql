-- ============================================================
-- PARENT MODULE: RLS fixes, daily digest, wallet top-up, visitor auth
-- ============================================================

-- ============================================================
-- 1. FIX: parent_student_links column consistency
-- ============================================================
-- The table uses student_id but some RPCs reference child_student_id.
-- Ensure column is student_id (the original definition).

-- ============================================================
-- 2. ADD: RLS policies for Parent role across core tables
-- ============================================================

-- Students: Parents can view linked children
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view linked children'
    AND tablename = 'students'
  ) THEN
    CREATE POLICY "Parents can view linked children" ON students
      FOR SELECT USING (
        id IN (
          SELECT student_id FROM parent_student_links
          WHERE parent_user_id = auth.uid() AND verified = true
        )
      );
  END IF;
END $$;

-- Attendance: Parents can view linked children's attendance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view linked child attendance'
    AND tablename = 'attendance'
  ) THEN
    CREATE POLICY "Parents can view linked child attendance" ON attendance
      FOR SELECT USING (
        student_id IN (
          SELECT student_id FROM parent_student_links
          WHERE parent_user_id = auth.uid() AND verified = true
        )
      );
  END IF;
END $$;

-- Student fees: Parents can view linked children's fees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view linked child fees'
    AND tablename = 'student_fees'
  ) THEN
    CREATE POLICY "Parents can view linked child fees" ON student_fees
      FOR SELECT USING (
        student_id IN (
          SELECT student_id FROM parent_student_links
          WHERE parent_user_id = auth.uid() AND verified = true
        )
      );
  END IF;
END $$;

-- Exam results: Parents can view linked children's results
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view linked child results'
    AND tablename = 'exam_results'
  ) THEN
    CREATE POLICY "Parents can view linked child results" ON exam_results
      FOR SELECT USING (
        student_id IN (
          SELECT student_id FROM parent_student_links
          WHERE parent_user_id = auth.uid() AND verified = true
        )
      );
  END IF;
END $$;

-- Notices: Parents can view notices from linked children's institution
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view institution notices'
    AND tablename = 'notices'
  ) THEN
    CREATE POLICY "Parents can view institution notices" ON notices
      FOR SELECT USING (
        institution_id IN (
          SELECT s.institution_id FROM parent_student_links psl
          JOIN students s ON psl.student_id = s.id
          WHERE psl.parent_user_id = auth.uid() AND psl.verified = true
        )
      );
  END IF;
END $$;

-- Gate logs: Parents can view linked children's gate logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view linked child gate logs'
    AND tablename = 'gate_logs'
  ) THEN
    CREATE POLICY "Parents can view linked child gate logs" ON gate_logs
      FOR SELECT USING (
        person_id IN (
          SELECT s.user_id FROM parent_student_links psl
          JOIN students s ON psl.student_id = s.id
          WHERE psl.parent_user_id = auth.uid() AND psl.verified = true
        )
      );
  END IF;
END $$;

-- Bus subscriptions: Parents can view linked children's bus subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view linked child bus subscriptions'
    AND tablename = 'transport_subscriptions'
  ) THEN
    CREATE POLICY "Parents can view linked child bus subscriptions" ON transport_subscriptions
      FOR SELECT USING (
        student_id IN (
          SELECT student_id FROM parent_student_links
          WHERE parent_user_id = auth.uid() AND verified = true
        )
      );
  END IF;
END $$;

-- Wallet transactions: Parents can view linked children's transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view linked child wallet tx'
    AND tablename = 'wallet_transactions'
  ) THEN
    CREATE POLICY "Parents can view linked child wallet tx" ON wallet_transactions
      FOR SELECT USING (
        student_id IN (
          SELECT student_id FROM parent_student_links
          WHERE parent_user_id = auth.uid() AND verified = true
        )
      );
  END IF;
END $$;

-- Parents can INSERT wallet transactions (for top-up)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can top-up linked child wallet'
    AND tablename = 'wallet_transactions'
  ) THEN
    CREATE POLICY "Parents can top-up linked child wallet" ON wallet_transactions
      FOR INSERT WITH CHECK (
        student_id IN (
          SELECT student_id FROM parent_student_links
          WHERE parent_user_id = auth.uid() AND verified = true
        )
        AND type = 'parent_topup'
      );
  END IF;
END $$;

-- Hostel allocations: Parents can view linked children's allocation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view linked child hostel'
    AND tablename = 'hostel_allocations'
  ) THEN
    CREATE POLICY "Parents can view linked child hostel" ON hostel_allocations
      FOR SELECT USING (
        student_id IN (
          SELECT student_id FROM parent_student_links
          WHERE parent_user_id = auth.uid() AND verified = true
        )
      );
  END IF;
END $$;

-- ============================================================
-- 3. ADD: Hostel visitor pre-authorization
-- ============================================================
CREATE TABLE IF NOT EXISTS hostel_visitor_preauth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visitor_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20),
    visit_date DATE NOT NULL,
    visit_time TIME,
    purpose TEXT,
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('approved', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE hostel_visitor_preauth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage own visitor preauth" ON hostel_visitor_preauth
    FOR ALL USING (
        parent_user_id = auth.uid()
    );

CREATE POLICY "Students can view own visitor preauth" ON hostel_visitor_preauth
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Warden/Security can view all preauth" ON hostel_visitor_preauth
    FOR SELECT USING (
        get_auth_user_role() IN ('Warden', 'Security', 'Admin')
        AND institution_id = get_auth_institution_id()
    );

-- RPC: Pre-authorize a visit
CREATE OR REPLACE FUNCTION preauthorize_visitor(
    p_student_id UUID,
    p_visitor_name VARCHAR,
    p_visitor_phone VARCHAR,
    p_visit_date DATE,
    p_visit_time TIME,
    p_purpose TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_preauth_id UUID;
    v_parent_id UUID;
    v_institution_id UUID;
BEGIN
    -- Verify parent is linked to this student
    SELECT psl.parent_user_id, s.institution_id INTO v_parent_id, v_institution_id
    FROM parent_student_links psl
    JOIN students s ON psl.student_id = s.id
    WHERE psl.parent_user_id = auth.uid()
      AND psl.student_id = p_student_id
      AND psl.verified = true;

    IF v_parent_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authorized to pre-approve visits for this student.');
    END IF;

    INSERT INTO hostel_visitor_preauth (institution_id, student_id, parent_user_id, visitor_name, visitor_phone, visit_date, visit_time, purpose)
    VALUES (v_institution_id, p_student_id, v_parent_id, p_visitor_name, p_visitor_phone, p_visit_date, p_visit_time, p_purpose)
    RETURNING id INTO v_preauth_id;

    RETURN json_build_object('success', true, 'preauth_id', v_preauth_id);
END;
$$;

-- ============================================================
-- 4. ADD: Exam result notification for parents
-- ============================================================
CREATE TABLE IF NOT EXISTS parent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'daily_digest', 'attendance_alert', 'fee_reminder', 'exam_result',
        'wallet_topup', 'visitor_approved', 'bus_boarded', 'hostel_complaint'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_via_whatsapp BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own notifications" ON parent_notifications
    FOR SELECT USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can mark own notifications read" ON parent_notifications
    FOR UPDATE USING (parent_user_id = auth.uid());

CREATE POLICY "System can insert parent notifications" ON parent_notifications
    FOR INSERT WITH CHECK (true);

-- ============================================================
-- 5. RPC: Get parent's child info (replaces hardcoded mock)
-- ============================================================
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
    institution_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, u.name, s.roll_number, s.course, d.name,
           s.semester, s.year, s.guardian_phone, s.wallet_balance, s.institution_id
    FROM parent_student_links psl
    JOIN students s ON psl.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE psl.parent_user_id = auth.uid()
      AND psl.verified = true
    ORDER BY psl.is_primary DESC NULLS LAST
    LIMIT 1;
END;
$$;

-- ============================================================
-- 6. RPC: Get parent child daily summary
-- ============================================================
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
    v_user_id UUID;
BEGIN
    -- Get linked child
    SELECT psl.student_id, s.user_id INTO v_student_id, v_user_id
    FROM parent_student_links psl
    JOIN students s ON psl.student_id = s.id
    WHERE psl.parent_user_id = auth.uid() AND psl.verified = true
    ORDER BY psl.is_primary DESC NULLS LAST LIMIT 1;

    IF v_student_id IS NULL THEN RETURN; END IF;

    RETURN QUERY
    SELECT
        u.name,
        COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::BIGINT,
        COUNT(a.id)::BIGINT,
        CASE WHEN COUNT(a.id) = 0 THEN 100.0
             ELSE ROUND(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC / COUNT(a.id)::NUMERIC * 100, 1)
        END,
        COALESCE((SELECT SUM(co.total_amount) FROM canteen_orders co WHERE co.student_id = v_student_id AND co.created_at::DATE = p_date), 0),
        EXISTS(SELECT 1 FROM bus_tracking bt WHERE bt.student_id = v_student_id AND bt.boarded_at::DATE = p_date),
        (SELECT bt.boarded_at::TIME FROM bus_tracking bt WHERE bt.student_id = v_student_id AND bt.boarded_at::DATE = p_date LIMIT 1),
        (SELECT gl.in_time::TIME FROM gate_logs gl WHERE gl.person_id = v_user_id AND gl.in_time::DATE = p_date LIMIT 1),
        (SELECT gl.out_time::TIME FROM gate_logs gl WHERE gl.person_id = v_user_id AND gl.out_time::DATE = p_date ORDER BY gl.out_time DESC LIMIT 1),
        (SELECT COALESCE(SUM(sf.amount - COALESCE(sf.paid_amount, 0)), 0) FROM student_fees sf WHERE sf.student_id = v_student_id AND sf.payment_status IN ('pending', 'partial')),
        (SELECT COALESCE(s.wallet_balance, 0) FROM students s WHERE s.id = v_student_id)
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE a.student_id = v_student_id AND a.date = p_date
    GROUP BY u.name;
END;
$$;

-- ============================================================
-- 7. RPC: Parent top-up child wallet
-- ============================================================
CREATE OR REPLACE FUNCTION parent_topup_child_wallet(
    p_student_id UUID,
    p_amount NUMERIC,
    p_description TEXT DEFAULT 'Parent wallet top-up'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_authorized BOOLEAN;
    v_tx_id UUID;
    v_new_balance NUMERIC;
BEGIN
    -- Verify parent is linked
    SELECT EXISTS (
        SELECT 1 FROM parent_student_links
        WHERE parent_user_id = auth.uid()
          AND student_id = p_student_id
          AND verified = true
    ) INTO v_authorized;

    IF NOT v_authorized THEN
        RETURN json_build_object('success', false, 'error', 'Not authorized to top-up this student.');
    END IF;

    IF p_amount <= 0 OR p_amount > 10000 THEN
        RETURN json_build_object('success', false, 'error', 'Amount must be between ₹1 and ₹10,000.');
    END IF;

    -- Record transaction
    INSERT INTO wallet_transactions (institution_id, student_id, amount, type, status, description)
    SELECT s.institution_id, p_student_id, p_amount, 'parent_topup', 'completed', p_description
    FROM students s WHERE s.id = p_student_id
    RETURNING id INTO v_tx_id;

    -- Update balance
    UPDATE students SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount WHERE id = p_student_id
    RETURNING wallet_balance INTO v_new_balance;

    -- Create parent notification
    INSERT INTO parent_notifications (parent_user_id, student_id, notification_type, title, message, metadata)
    VALUES (
        auth.uid(), p_student_id, 'wallet_topup',
        'Wallet Top-Up Successful',
        '₹' || p_amount || ' has been added to your child''s campus wallet.',
        json_build_object('amount', p_amount, 'transaction_id', v_tx_id)
    );

    RETURN json_build_object('success', true, 'transaction_id', v_tx_id, 'new_balance', v_new_balance);
END;
$$;

-- ============================================================
-- 8. RPC: Get parent notification unread count
-- ============================================================
CREATE OR REPLACE FUNCTION get_parent_unread_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (SELECT COUNT(*)::BIGINT FROM parent_notifications
            WHERE parent_user_id = auth.uid() AND is_read = false);
END;
$$;

-- ============================================================
-- 9. RPC: Get child's bus status (is child on the bus?)
-- ============================================================
CREATE OR REPLACE FUNCTION get_child_bus_status()
RETURNS TABLE (
    is_on_bus BOOLEAN,
    bus_name VARCHAR,
    route_name VARCHAR,
    last_stop VARCHAR,
    eta_minutes INTEGER,
    latitude NUMERIC,
    longitude NUMERIC,
    last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_user_id UUID;
    v_subscription RECORD;
    v_bus_record RECORD;
    v_bus_loc RECORD;
BEGIN
    SELECT psl.student_id, s.user_id INTO v_student_id, v_user_id
    FROM parent_student_links psl
    JOIN students s ON psl.student_id = s.id
    WHERE psl.parent_user_id = auth.uid() AND psl.verified = true
    ORDER BY psl.is_primary DESC NULLS LAST LIMIT 1;

    IF v_student_id IS NULL THEN RETURN; END IF;

    -- Check if student has active bus subscription
    SELECT bs.route_id, bs.stop_name INTO v_subscription
    FROM transport_subscriptions bs
    WHERE bs.student_id = v_student_id AND bs.status = 'active'
    LIMIT 1;

    IF v_subscription IS NULL THEN
        is_on_bus := false;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Check gate log for boarding today (i.e. went out today)
    IF NOT EXISTS (
        SELECT 1 FROM gate_logs
        WHERE person_id = v_user_id
          AND out_time::DATE = CURRENT_DATE
    ) THEN
        is_on_bus := false;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Get bus assigned to this route
    SELECT b.id, b.name INTO v_bus_record
    FROM buses b
    WHERE b.route_id = v_subscription.route_id
    LIMIT 1;

    IF v_bus_record IS NULL THEN
        is_on_bus := false;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Get bus location
    SELECT bt.latitude, bt.longitude, bt.speed, bt.timestamp
    INTO v_bus_loc
    FROM bus_tracking bt
    WHERE bt.bus_id = v_bus_record.id
    ORDER BY bt.timestamp DESC LIMIT 1;

    IF v_bus_loc IS NULL THEN
        is_on_bus := false;
        RETURN NEXT;
        RETURN;
    END IF;

    is_on_bus := true;
    bus_name := v_bus_record.name;
    route_name := (SELECT name FROM bus_routes WHERE id = v_subscription.route_id);
    latitude := v_bus_loc.latitude;
    longitude := v_bus_loc.longitude;
    last_updated := v_bus_loc.timestamp;
    eta_minutes := 0; -- Would calculate from Haversine
    last_stop := '';
    RETURN NEXT;
END;
$$;
