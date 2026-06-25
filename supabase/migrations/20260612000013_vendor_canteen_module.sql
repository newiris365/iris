-- ============================================================
-- VENDOR / CANTEEN STAFF MODULE: KOT, Menu Mgmt, Sales, Pre-orders
-- ============================================================

-- ============================================================
-- 1. ORDER STATUS TRACKING: Add status history table
-- ============================================================
CREATE TABLE IF NOT EXISTS canteen_order_status_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES canteen_orders(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE canteen_order_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendor can manage order status logs" ON canteen_order_status_log
    FOR ALL USING (
        get_auth_user_role() IN ('SuperAdmin', 'Admin', 'Vendor')
        AND institution_id = get_auth_institution_id()
    );

-- RPC: Update order status (KOT workflow)
CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id UUID,
    p_new_status VARCHAR,
    p_notes TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_status VARCHAR;
    v_order RECORD;
BEGIN
    SELECT status INTO v_old_status FROM canteen_orders WHERE id = p_order_id;
    IF v_old_status IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Order not found.');
    END IF;

    UPDATE canteen_orders
    SET status = p_new_status
    WHERE id = p_order_id;

    INSERT INTO canteen_order_status_log (institution_id, order_id, old_status, new_status, changed_by, notes)
    VALUES (
        (SELECT institution_id FROM canteen_orders WHERE id = p_order_id),
        p_order_id, v_old_status, p_new_status, auth.uid(), p_notes
    );

    RETURN json_build_object('success', true, 'old_status', v_old_status, 'new_status', p_new_status);
END;
$$;

-- ============================================================
-- 2. ATOMIC WALLET DEDUCTION for canteen orders
-- ============================================================
CREATE OR REPLACE FUNCTION place_canteen_order_atomic(
    p_student_id UUID,
    p_items JSONB,
    p_total_amount DECIMAL,
    p_special_instructions TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet RECORD;
    v_order_id UUID;
    v_order_number VARCHAR;
    v_item JSONB;
    v_stock_ok BOOLEAN := true;
BEGIN
    -- Get student's wallet with lock
    SELECT * INTO v_wallet
    FROM canteen_wallets
    WHERE student_id = p_student_id
    FOR UPDATE;

    IF v_wallet IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No canteen wallet found.');
    END IF;

    IF v_wallet.balance < p_total_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient wallet balance. Current: ₹' || v_wallet.balance || ', Required: ₹' || p_total_amount);
    END IF;

    -- Check stock for all items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM canteen_menus
            WHERE id = (v_item->>'item_id')::UUID
            AND is_available = true
            AND stock_remaining > 0
        ) THEN
            v_stock_ok := false;
            EXIT;
        END IF;
    END LOOP;

    IF NOT v_stock_ok THEN
        RETURN json_build_object('success', false, 'error', 'One or more items are out of stock.');
    END IF;

    -- Deduct wallet atomically
    UPDATE canteen_wallets
    SET balance = balance - p_total_amount,
        last_updated = NOW()
    WHERE id = v_wallet.id;

    -- Create order
    v_order_number := 'ORD' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');

    INSERT INTO canteen_orders (
        institution_id, student_id, items, total_amount, final_amount,
        status, payment_status, special_instructions, order_number, order_time
    ) VALUES (
        (SELECT institution_id FROM students WHERE id = p_student_id),
        p_student_id, p_items, p_total_amount, p_total_amount,
        'placed', 'paid', p_special_instructions, v_order_number, NOW()
    ) RETURNING id INTO v_order_id;

    -- Deduct stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        UPDATE canteen_menus
        SET stock_remaining = GREATEST(stock_remaining - COALESCE((v_item->>'quantity')::INTEGER, 1), 0)
        WHERE id = (v_item->>'item_id')::UUID;
    END LOOP;

    -- Log wallet transaction
    INSERT INTO wallet_transactions (institution_id, student_id, amount, type, status, description)
    VALUES (
        (SELECT institution_id FROM students WHERE id = p_student_id),
        p_student_id, -p_total_amount, 'canteen_order', 'completed',
        'Canteen order ' || v_order_number
    );

    RETURN json_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'amount_deducted', p_total_amount,
        'remaining_balance', v_wallet.balance - p_total_amount
    );
END;
$$;

-- ============================================================
-- 3. VENDOR DAILY SALES REPORT
-- ============================================================
CREATE OR REPLACE FUNCTION get_vendor_daily_sales(
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_vendor_id UUID;
    v_institution_id UUID;
    v_result JSON;
BEGIN
    SELECT id, institution_id INTO v_vendor_id, v_institution_id
    FROM users WHERE id = auth.uid();

    SELECT institution_id INTO v_institution_id
    FROM users WHERE id = auth.uid();

    WITH day_orders AS (
        SELECT *
        FROM canteen_orders
        WHERE institution_id = v_institution_id
        AND created_at::DATE = p_date
    ),
    item_stats AS (
        SELECT
            (item->>'name') AS item_name,
            SUM((item->>'quantity')::INTEGER) AS total_qty,
            SUM((item->>'price')::DECIMAL * (item->>'quantity')::INTEGER) AS total_revenue
        FROM day_orders,
             jsonb_array_elements(items) AS item
        GROUP BY (item->>'name')
        ORDER BY total_qty DESC
    )
    SELECT json_build_object(
        'date', p_date,
        'total_orders', (SELECT COUNT(*) FROM day_orders),
        'total_revenue', COALESCE((SELECT SUM(total_amount) FROM day_orders), 0),
        'wallet_orders', (SELECT COUNT(*) FROM day_orders WHERE payment_status = 'paid'),
        'cash_orders', (SELECT COUNT(*) FROM day_orders WHERE payment_status = 'cash'),
        'status_breakdown', (
            SELECT json_object_agg(status, cnt)
            FROM (SELECT status, COUNT(*) AS cnt FROM day_orders GROUP BY status) s
        ),
        'top_items', (
            SELECT json_agg(json_build_object('name', item_name, 'qty', total_qty, 'revenue', total_revenue))
            FROM item_stats LIMIT 10
        ),
        'hourly_breakdown', (
            SELECT json_agg(json_build_object('hour', h, 'orders', COALESCE(cnt, 0)))
            FROM generate_series(8, 20) AS h
            LEFT JOIN (
                SELECT EXTRACT(HOUR FROM created_at)::INTEGER AS hour, COUNT(*) AS cnt
                FROM day_orders GROUP BY 1
            ) hr ON hr.hour = h
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ============================================================
-- 4. PRE-ORDER / MEAL PREP LIST
-- ============================================================
CREATE OR REPLACE FUNCTION get_canteen_prep_list(
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    item_name VARCHAR,
    category VARCHAR,
    total_quantity BIGINT,
    veg_quantity BIGINT,
    nonveg_quantity BIGINT,
    special_instructions TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (item->>'name')::VARCHAR,
        COALESCE(cm.category_id::TEXT, 'Uncategorized'),
        SUM((item->>'quantity')::BIGINT),
        SUM(CASE WHEN cm.is_veg THEN (item->>'quantity')::BIGINT ELSE 0 END),
        SUM(CASE WHEN NOT cm.is_veg THEN (item->>'quantity')::BIGINT ELSE 0 END),
        string_agg(DISTINCT co.special_instructions, '; ')
    FROM canteen_orders co,
         jsonb_array_elements(co.items) AS item
    LEFT JOIN canteen_menus cm ON cm.item_name = (item->>'name')
    WHERE co.institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
    AND co.created_at::DATE = p_date
    AND co.status IN ('placed', 'confirmed', 'preparing')
    GROUP BY (item->>'name'), cm.category_id
    ORDER BY SUM((item->>'quantity')::BIGINT) DESC;
END;
$$;

-- ============================================================
-- 5. MENU AVAILABILITY TOGGLE
-- ============================================================
CREATE OR REPLACE FUNCTION toggle_menu_availability(
    p_menu_id UUID,
    p_is_available BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE canteen_menus
    SET is_available = p_is_available,
        stock_remaining = CASE WHEN p_is_available THEN daily_stock ELSE 0 END
    WHERE id = p_menu_id
    AND institution_id = (SELECT institution_id FROM users WHERE id = auth.uid());

    IF FOUND THEN
        RETURN json_build_object('success', true, 'available', p_is_available);
    ELSE
        RETURN json_build_object('success', false, 'error', 'Menu item not found.');
    END IF;
END;
$$;

-- Update stock
CREATE OR REPLACE FUNCTION update_menu_stock(
    p_menu_id UUID,
    p_new_stock INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE canteen_menus
    SET daily_stock = p_new_stock,
        stock_remaining = p_new_stock
    WHERE id = p_menu_id
    AND institution_id = (SELECT institution_id FROM users WHERE id = auth.uid());

    IF FOUND THEN
        RETURN json_build_object('success', true);
    ELSE
        RETURN json_build_object('success', false, 'error', 'Menu item not found.');
    END IF;
END;
$$;

-- Update price
CREATE OR REPLACE FUNCTION update_menu_price(
    p_menu_id UUID,
    p_new_price DECIMAL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE canteen_menus
    SET price = p_new_price
    WHERE id = p_menu_id
    AND institution_id = (SELECT institution_id FROM users WHERE id = auth.uid());

    IF FOUND THEN
        RETURN json_build_object('success', true);
    ELSE
        RETURN json_build_object('success', false, 'error', 'Menu item not found.');
    END IF;
END;
$$;
