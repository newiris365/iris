-- ==========================================================
-- SUPABASE MIGRATION: SECURITY AUDIT HARDENING & FIXES
-- ==========================================================

-- 1. Table schema constraints corrections
ALTER TABLE public.users ALTER COLUMN email SET NOT NULL;
ALTER TABLE public.hostel_rooms DROP CONSTRAINT IF EXISTS check_occupied_non_negative;
ALTER TABLE public.hostel_rooms ADD CONSTRAINT check_occupied_non_negative CHECK (occupied >= 0);
ALTER TABLE public.canteen_wallets DROP CONSTRAINT IF EXISTS check_balance_non_negative;
ALTER TABLE public.canteen_wallets ADD CONSTRAINT check_balance_non_negative CHECK (balance >= 0.00);

-- 2. Partial unique indexes to prevent duplicate active state allocations
CREATE UNIQUE INDEX IF NOT EXISTS idx_hostel_allocations_active_student ON hostel_allocations(student_id) WHERE (is_current = TRUE);
CREATE UNIQUE INDEX IF NOT EXISTS idx_book_issues_active_student_book ON book_issues(student_id, book_id) WHERE (status = 'Issued');
CREATE UNIQUE INDEX IF NOT EXISTS idx_gym_bookings_active_student_slot ON gym_bookings(student_id, slot_id) WHERE (status = 'Booked');

-- 3. Composite performance optimization index for live bus tracking queries
CREATE INDEX IF NOT EXISTS idx_bus_tracking_composite ON bus_tracking(bus_id, timestamp DESC);

-- 4. Partial index on unread notifications counts
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE (is_read = FALSE);

-- 5. Harden RLS Isolation functions to fetch from public.users table directly
CREATE OR REPLACE FUNCTION get_auth_institution_id()
RETURNS UUID AS $$
DECLARE
    inst_id UUID;
BEGIN
    SELECT institution_id INTO inst_id 
    FROM public.users 
    WHERE email = auth.jwt() ->> 'email' OR id = (auth.jwt() ->> 'sub')::UUID;
    RETURN inst_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS VARCHAR AS $$
DECLARE
    u_role VARCHAR;
BEGIN
    SELECT role INTO u_role 
    FROM public.users 
    WHERE email = auth.jwt() ->> 'email' OR id = (auth.jwt() ->> 'sub')::UUID;
    RETURN u_role;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add duplicate prevention checks to room allocation RPC
CREATE OR REPLACE FUNCTION allocate_room(
  p_institution_id UUID,
  p_room_id UUID,
  p_student_id UUID,
  p_date DATE
) RETURNS JSON AS $$
DECLARE
  v_allocation_id UUID;
  v_room_number VARCHAR;
  v_block_name VARCHAR;
BEGIN
  -- Check if student already has an active allocation
  IF EXISTS (
    SELECT 1 FROM hostel_allocations 
    WHERE student_id = p_student_id AND is_current = TRUE
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Student already has an active hostel allocation.'
    );
  END IF;

  UPDATE hostel_rooms
    SET occupied = occupied + 1
    WHERE id = p_room_id
      AND occupied < capacity
      AND institution_id = p_institution_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Room is at full capacity or does not exist. Allocation denied.'
    );
  END IF;

  SELECT hr.room_number, hb.name INTO v_room_number, v_block_name
    FROM hostel_rooms hr
    JOIN hostel_blocks hb ON hr.block_id = hb.id
    WHERE hr.id = p_room_id;

  INSERT INTO hostel_allocations (institution_id, room_id, student_id, allotted_date, is_current)
    VALUES (p_institution_id, p_room_id, p_student_id, p_date, TRUE)
    RETURNING id INTO v_allocation_id;

  RETURN json_build_object(
    'success', true,
    'allocation_id', v_allocation_id,
    'room_number', v_room_number,
    'block_name', v_block_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add duplicate borrowing prevention to book issue RPC
CREATE OR REPLACE FUNCTION issue_book_atomic(
  p_institution_id UUID,
  p_book_id UUID,
  p_student_id UUID,
  p_issue_date DATE,
  p_due_date DATE
) RETURNS JSON AS $$
DECLARE
  v_issue_id UUID;
  v_title VARCHAR;
  v_copies_remaining INTEGER;
BEGIN
  -- Check if student already has this book issued and unreturned
  IF EXISTS (
    SELECT 1 FROM book_issues 
    WHERE student_id = p_student_id AND book_id = p_book_id AND status = 'Issued'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Student already has an active issue of this book. Duplicate issue denied.'
    );
  END IF;

  UPDATE books
    SET copies_available = copies_available - 1
    WHERE id = p_book_id
      AND copies_available > 0
      AND institution_id = p_institution_id
    RETURNING copies_available, title INTO v_copies_remaining, v_title;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No copies available or book not found in catalogue.'
    );
  END IF;

  INSERT INTO book_issues (institution_id, book_id, student_id, issue_date, due_date, status)
    VALUES (p_institution_id, p_book_id, p_student_id, p_issue_date, p_due_date, 'Issued')
    RETURNING id INTO v_issue_id;

  RETURN json_build_object(
    'success', true,
    'issue_id', v_issue_id,
    'book_title', v_title,
    'copies_remaining', v_copies_remaining
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Add duplicate booking check to gym slot booking RPC
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
BEGIN
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

-- 9. Atomic canteen wallet ordering stored procedure
CREATE OR REPLACE FUNCTION place_canteen_order_atomic(
  p_student_id UUID,
  p_institution_id UUID,
  p_total_amount DECIMAL,
  p_items JSONB,
  p_payment_method VARCHAR,
  p_special_instructions TEXT,
  p_offer_id UUID,
  p_discount_amount DECIMAL,
  p_order_number VARCHAR
) RETURNS JSON AS $$
DECLARE
  v_wallet_id UUID;
  v_wallet_balance DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
  v_order_id UUID;
BEGIN
  -- If payment method is Wallet, perform atomic balance check and debit
  IF p_payment_method = 'Wallet' THEN
    -- Lock wallet row to prevent concurrent race condition modifications
    SELECT id, balance INTO v_wallet_id, v_wallet_balance
    FROM canteen_wallets
    WHERE student_id = p_student_id AND institution_id = p_institution_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Canteen wallet not found for this student.'
      );
    END IF;

    IF v_wallet_balance < p_total_amount THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Insufficient wallet balance for canteen order.'
      );
    END IF;

    v_new_balance := v_wallet_balance - p_total_amount;

    -- Update balance
    UPDATE canteen_wallets
    SET balance = v_new_balance, last_updated = NOW()
    WHERE id = v_wallet_id;

    -- Insert wallet transaction
    INSERT INTO wallet_transactions (institution_id, wallet_id, student_id, type, amount, reference_type, description, balance_after)
    VALUES (p_institution_id, v_wallet_id, p_student_id, 'debit', p_total_amount, 'order_payment', 'Order payment for canteen items', v_new_balance);

  END IF;

  -- Insert order
  INSERT INTO canteen_orders (
    institution_id, student_id, items, total_amount, status, payment_method, special_instructions, offer_id, discount_amount, order_number, order_time
  ) VALUES (
    p_institution_id, p_student_id, p_items, p_total_amount, 'Received', p_payment_method, p_special_instructions, p_offer_id, p_discount_amount, p_order_number, NOW()
  ) RETURNING id INTO v_order_id;

  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', p_order_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Transit coordinate data logs cleanup helper
CREATE OR REPLACE FUNCTION cleanup_old_bus_tracking_data()
RETURNS VOID AS $$
BEGIN
  DELETE FROM bus_tracking
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
