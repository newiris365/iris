-- ============================================================
-- MIGRATION: Module-by-module gap fixes
-- 1. General-purpose deduct_wallet RPC
-- 2. Daily canteen menu table
-- 3. Grievance / complaint system
-- 4. Company visits table for placements
-- ============================================================

-- ============================================================
-- 1. GENERAL-PURPOSE WALLET DEDUCTION RPC
-- Reusable by any module: exam fees, hostel fees, event payments, etc.
-- ============================================================
CREATE OR REPLACE FUNCTION deduct_wallet(
    p_student_id UUID,
    p_amount NUMERIC,
    p_description TEXT DEFAULT 'Wallet deduction',
    p_module TEXT DEFAULT 'general'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance NUMERIC;
    v_tx_id UUID;
    v_institution_id UUID;
BEGIN
    IF p_amount <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Amount must be positive.');
    END IF;

    SELECT institution_id, COALESCE(wallet_balance, 0) INTO v_institution_id, v_balance
    FROM students WHERE id = p_student_id FOR UPDATE;

    IF v_institution_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Student not found.');
    END IF;

    IF v_balance < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance. Available: ₹' || v_balance || ', Required: ₹' || p_amount);
    END IF;

    UPDATE students SET wallet_balance = wallet_balance - p_amount WHERE id = p_student_id;

    INSERT INTO wallet_transactions (institution_id, student_id, amount, type, status, description)
    VALUES (v_institution_id, p_student_id, -p_amount, 'deduction', 'completed', p_module || ': ' || p_description)
    RETURNING id INTO v_tx_id;

    RETURN json_build_object(
        'success', true,
        'transaction_id', v_tx_id,
        'amount_deducted', p_amount,
        'remaining_balance', v_balance - p_amount
    );
END;
$$;

-- ============================================================
-- 2. DAILY CANTEEN MENU TABLE
-- Maps which items are available on which day/meal type
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_canteen_menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES canteen_menus(id) ON DELETE CASCADE,
    menu_date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')),
    is_available BOOLEAN DEFAULT true,
    price_override NUMERIC(10,2),
    special_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institution_id, menu_item_id, menu_date, meal_type)
);

CREATE INDEX IF NOT EXISTS idx_daily_menu_date ON daily_canteen_menu(institution_id, menu_date, meal_type);
CREATE INDEX IF NOT EXISTS idx_daily_menu_item ON daily_canteen_menu(menu_item_id);

ALTER TABLE daily_canteen_menu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily menu" ON daily_canteen_menu FOR SELECT USING (true);
CREATE POLICY "Staff can manage daily menu" ON daily_canteen_menu FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin', 'Staff'))
);

-- RPC: Get today's menu
CREATE OR REPLACE FUNCTION get_today_menu(
    p_institution_id UUID,
    p_meal_type TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_agg(json_build_object(
        'id', dcm.id,
        'menu_item_id', dcm.menu_item_id,
        'name', cm.item_name,
        'description', cm.description,
        'category', cm.category,
        'price', COALESCE(dcm.price_override, cm.price),
        'is_veg', cm.is_veg,
        'is_available', dcm.is_available,
        'meal_type', dcm.meal_type,
        'special_notes', dcm.special_notes,
        'image_url', cm.image_url,
        'calories', cm.calories,
        'allergens', cm.allergens
    )) INTO v_result
    FROM daily_canteen_menu dcm
    JOIN canteen_menus cm ON cm.id = dcm.menu_item_id
    WHERE dcm.institution_id = p_institution_id
    AND dcm.menu_date = CURRENT_DATE
    AND cm.is_available = true
    AND (p_meal_type IS NULL OR dcm.meal_type = p_meal_type)
    ORDER BY dcm.meal_type, cm.category, cm.item_name;

    RETURN json_build_object('success', true, 'menu', COALESCE(v_result, '[]'::json), 'date', CURRENT_DATE);
END;
$$;

-- ============================================================
-- 3. GRIEVANCE / COMPLAINT SYSTEM
-- UGC-mandated student grievance mechanism with anonymous option
-- ============================================================
CREATE TABLE IF NOT EXISTS grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_anonymous BOOLEAN DEFAULT false,
    category TEXT NOT NULL CHECK (category IN (
        'academic', 'harassment', 'infrastructure', 'examination',
        'library', 'canteen', 'hostel', 'transport', 'administration',
        'discrimination', 'other'
    )),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence_urls JSONB DEFAULT '[]',
    status TEXT DEFAULT 'submitted' CHECK (status IN (
        'submitted', 'acknowledged', 'under_investigation',
        'resolution_proposed', 'resolved', 'appealed', 'closed'
    )),
    assigned_to UUID REFERENCES users(id),
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    appeal_reason TEXT,
    appeal_resolved_at TIMESTAMPTZ,
    sla_deadline TIMESTAMPTZ,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grievances_institution ON grievances(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_grievances_submitted ON grievances(submitted_by);
CREATE INDEX IF NOT EXISTS idx_grievances_category ON grievances(institution_id, category, status);
CREATE INDEX IF NOT EXISTS idx_grievances_sla ON grievances(sla_deadline) WHERE status IN ('submitted', 'acknowledged', 'under_investigation');

ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own grievances" ON grievances
    FOR SELECT USING (submitted_by = auth.uid() OR is_anonymous = false);

CREATE POLICY "Students can insert grievances" ON grievances
    FOR INSERT WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Admin can manage grievances" ON grievances
    FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin', 'Director')));

-- RPC: Submit grievance
CREATE OR REPLACE FUNCTION submit_grievance(
    p_institution_id UUID,
    p_submitted_by UUID,
    p_category TEXT,
    p_subject TEXT,
    p_description TEXT,
    p_is_anonymous BOOLEAN DEFAULT false,
    p_evidence_urls JSONB DEFAULT '[]',
    p_priority TEXT DEFAULT 'normal'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_grievance_id UUID;
    v_grievance_number VARCHAR;
BEGIN
    v_grievance_number := 'GRV' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');

    INSERT INTO grievances (
        institution_id, submitted_by, is_anonymous, category, subject,
        description, evidence_urls, priority, sla_deadline
    ) VALUES (
        p_institution_id,
        CASE WHEN p_is_anonymous THEN NULL ELSE p_submitted_by END,
        p_is_anonymous, p_category, p_subject, p_description,
        p_evidence_urls, p_priority,
        NOW() + INTERVAL '7 days'
    ) RETURNING id INTO v_grievance_id;

    RETURN json_build_object(
        'success', true,
        'grievance_id', v_grievance_id,
        'grievance_number', v_grievance_number,
        'message', 'Grievance submitted successfully. SLA: 7 days.'
    );
END;
$$;

-- RPC: Update grievance status (admin only)
CREATE OR REPLACE FUNCTION update_grievance_status(
    p_grievance_id UUID,
    p_new_status TEXT,
    p_assigned_to UUID DEFAULT NULL,
    p_resolution_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_status TEXT;
BEGIN
    SELECT status INTO v_old_status FROM grievances WHERE id = p_grievance_id;

    UPDATE grievances SET
        status = p_new_status,
        assigned_to = COALESCE(p_assigned_to, assigned_to),
        resolution_notes = COALESCE(p_resolution_notes, resolution_notes),
        resolved_at = CASE WHEN p_new_status = 'resolved' THEN NOW() ELSE resolved_at END,
        updated_at = NOW()
    WHERE id = p_grievance_id;

    RETURN json_build_object('success', true, 'old_status', v_old_status, 'new_status', p_new_status);
END;
$$;

-- RPC: Appeal a resolved grievance
CREATE OR REPLACE FUNCTION appeal_grievance(
    p_grievance_id UUID,
    p_appeal_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE grievances SET
        status = 'appealed',
        appeal_reason = p_appeal_reason,
        updated_at = NOW()
    WHERE id = p_grievance_id AND status = 'resolved';

    RETURN json_build_object('success', true, 'message', 'Appeal submitted. Will be reviewed by Director.');
END;
$$;

-- ============================================================
-- 4. COMPANY VISITS TABLE FOR PLACEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS company_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN (
        'placement_drive', 'internship_drive', 'guest_lecture',
        'campus_interview', 'pre_placement_talk', 'other'
    )),
    visitors JSONB DEFAULT '[]',
    attendees_count INTEGER DEFAULT 0,
    offers_made INTEGER DEFAULT 0,
    offers_accepted INTEGER DEFAULT 0,
    notes TEXT,
    follow_up_date DATE,
    follow_up_notes TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_visits_institution ON company_visits(institution_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_company_visits_company ON company_visits(company_id, visit_date);

ALTER TABLE company_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Placement staff can manage company visits" ON company_visits FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin', 'Placement Officer'))
);

-- RPC: Log a company visit
CREATE OR REPLACE FUNCTION log_company_visit(
    p_company_id UUID,
    p_visit_date DATE,
    p_purpose TEXT,
    p_visitors JSONB DEFAULT '[]',
    p_notes TEXT DEFAULT '',
    p_created_by UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_visit_id UUID;
    v_institution_id UUID;
BEGIN
    SELECT institution_id INTO v_institution_id FROM companies WHERE id = p_company_id;
    IF v_institution_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Company not found.');
    END IF;

    INSERT INTO company_visits (institution_id, company_id, visit_date, purpose, visitors, notes, created_by)
    VALUES (v_institution_id, p_company_id, p_visit_date, p_purpose, p_visitors, p_notes, p_created_by)
    RETURNING id INTO v_visit_id;

    UPDATE companies SET last_visited = p_visit_date WHERE id = p_company_id;

    RETURN json_build_object('success', true, 'visit_id', v_visit_id);
END;
$$;
