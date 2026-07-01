-- ============================================================
-- IRIS 365 — MODULE 2: CANTEEN SYSTEM EXTENSIONS
-- ============================================================
-- Extends existing canteen_menus, canteen_orders, canteen_wallets,
-- meal_subscriptions with additional tables & columns.
-- ============================================================

-- 1. CANTEEN CATEGORIES (menu grouping)
CREATE TABLE IF NOT EXISTS canteen_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT '🍽️',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CANTEEN FEEDBACK (order ratings & reviews)
CREATE TABLE IF NOT EXISTS canteen_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    order_id UUID REFERENCES canteen_orders(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_feedback_per_order UNIQUE (order_id, student_id)
);

-- 3. CANTEEN OFFERS (discount codes & promotions)
CREATE TABLE IF NOT EXISTS canteen_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage', -- percentage, flat
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2),
    usage_limit INTEGER DEFAULT 100,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_offer_code_per_tenant UNIQUE (institution_id, code)
);

-- 4. CANTEEN PRE-ORDERS (scheduled future orders)
CREATE TABLE IF NOT EXISTS canteen_preorders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_slot VARCHAR(50) NOT NULL, -- e.g., "12:00-13:00", "08:00-09:00"
    status VARCHAR(30) DEFAULT 'Scheduled', -- Scheduled, Confirmed, Preparing, Ready, Delivered, Cancelled
    payment_method VARCHAR(50) DEFAULT 'Wallet',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. WALLET TRANSACTIONS (full audit trail)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES canteen_wallets(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- credit, debit
    amount DECIMAL(10, 2) NOT NULL,
    reference_type VARCHAR(50), -- topup, order_payment, refund, subscription
    reference_id UUID, -- order_id, subscription_id, etc.
    description TEXT,
    balance_after DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ADD COLUMNS to existing canteen_menus
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS prep_time_mins INTEGER DEFAULT 10;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT TRUE;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(3, 2) DEFAULT 0;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES canteen_categories(id) ON DELETE SET NULL;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS spice_level INTEGER DEFAULT 1 CHECK (spice_level >= 0 AND spice_level <= 3);

-- 7. ADD COLUMNS to existing canteen_orders
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(20);
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES canteen_offers(id) ON DELETE SET NULL;
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- 8. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_canteen_orders_student ON canteen_orders(student_id);
CREATE INDEX IF NOT EXISTS idx_canteen_orders_status ON canteen_orders(status);
CREATE INDEX IF NOT EXISTS idx_canteen_orders_time ON canteen_orders(order_time DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_student ON wallet_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_canteen_feedback_order ON canteen_feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_canteen_preorders_date ON canteen_preorders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_canteen_menus_category ON canteen_menus(category_id);

-- 9. RLS POLICIES
ALTER TABLE canteen_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen_preorders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY canteen_categories_tenant ON canteen_categories
    USING (institution_id = get_auth_institution_id());

CREATE POLICY canteen_feedback_tenant ON canteen_feedback
    USING (institution_id = get_auth_institution_id());

CREATE POLICY canteen_offers_tenant ON canteen_offers
    USING (institution_id = get_auth_institution_id());

CREATE POLICY canteen_preorders_tenant ON canteen_preorders
    USING (institution_id = get_auth_institution_id());

CREATE POLICY wallet_transactions_tenant ON wallet_transactions
    USING (institution_id = get_auth_institution_id());
