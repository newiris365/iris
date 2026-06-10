-- IRIS 365 Atomic RPC Functions Migration
-- Fixes race conditions in room allocation, book issue, and book return

-- ============================================
-- 1. ATOMIC ROOM ALLOCATION
-- Prevents overbooking by combining capacity check + increment + insert in one transaction
-- ============================================
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
  -- Atomically increment occupied count only if room has capacity
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

  -- Get room details for response
  SELECT hr.room_number, hb.name INTO v_room_number, v_block_name
    FROM hostel_rooms hr
    JOIN hostel_blocks hb ON hr.block_id = hb.id
    WHERE hr.id = p_room_id;

  -- Insert allocation record
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


-- ============================================
-- 2. ATOMIC BOOK ISSUE
-- Prevents negative stock by combining availability check + decrement + insert
-- ============================================
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
  -- Atomically decrement copies only if stock exists
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

  -- Insert book issue ledger entry
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


-- ============================================
-- 3. ATOMIC BOOK RETURN
-- Prevents lost increments by using FOR UPDATE row lock + single-transaction return
-- ============================================
CREATE OR REPLACE FUNCTION return_book_atomic(
  p_issue_id UUID,
  p_return_date DATE
) RETURNS JSON AS $$
DECLARE
  v_issue RECORD;
  v_fine DECIMAL(8,2) := 0;
  v_days_late INTEGER;
  v_book_title VARCHAR;
BEGIN
  -- Lock the issue row to prevent concurrent returns
  SELECT bi.*, b.title INTO v_issue
    FROM book_issues bi
    JOIN books b ON bi.book_id = b.id
    WHERE bi.id = p_issue_id
    FOR UPDATE OF bi;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Book issue record not found.'
    );
  END IF;

  IF v_issue.status = 'Returned' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Book has already been returned.'
    );
  END IF;

  -- Calculate overdue fine at ₹5 per day
  v_days_late := GREATEST(0, p_return_date - v_issue.due_date);
  v_fine := v_days_late * 5.00;

  -- Update issue record
  UPDATE book_issues
    SET return_date = p_return_date,
        fine_amount = v_fine,
        status = 'Returned'
    WHERE id = p_issue_id;

  -- Atomically increment book copies
  UPDATE books
    SET copies_available = copies_available + 1
    WHERE id = v_issue.book_id;

  RETURN json_build_object(
    'success', true,
    'issue_id', p_issue_id,
    'book_title', v_issue.title,
    'fine_amount', v_fine,
    'days_late', v_days_late
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 4. ATOMIC GYM SLOT BOOKING
-- Prevents overbooking gym slots
-- ============================================
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
  -- Atomically increment booked_count only if capacity available
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

  -- Insert booking record
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


-- ============================================
-- 5. ATOMIC GYM BOOKING CANCELLATION
-- Decrements booked_count safely
-- ============================================
CREATE OR REPLACE FUNCTION cancel_gym_booking_atomic(
  p_booking_id UUID
) RETURNS JSON AS $$
DECLARE
  v_slot_id UUID;
BEGIN
  -- Get and lock the booking
  SELECT slot_id INTO v_slot_id
    FROM gym_bookings
    WHERE id = p_booking_id AND status = 'Booked'
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found or already cancelled.'
    );
  END IF;

  -- Cancel the booking
  UPDATE gym_bookings SET status = 'Cancelled' WHERE id = p_booking_id;

  -- Decrement slot count
  UPDATE gym_slots
    SET booked_count = GREATEST(0, booked_count - 1)
    WHERE id = v_slot_id;

  RETURN json_build_object('success', true, 'message', 'Booking cancelled successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
