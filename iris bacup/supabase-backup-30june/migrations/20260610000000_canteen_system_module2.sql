-- Migration: IRIS Canteen System Extensions & Hardening
-- Targets: Supabase (PostgreSQL)

-- 1. CANTEEN COUNTERS
CREATE TABLE IF NOT EXISTS canteen_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    qr_code VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_accepting_orders BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. MEAL PLANS
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    meal_types TEXT[], -- e.g. {'breakfast', 'lunch', 'snacks'}
    duration_days INTEGER NOT NULL DEFAULT 30,
    price DECIMAL(10, 2) NOT NULL,
    meals_included INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ALTER MEAL SUBSCRIPTIONS
ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL;
ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS meals_total INTEGER DEFAULT 30;
ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS meals_used INTEGER DEFAULT 0;
ALTER TABLE meal_subscriptions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- 4. DAILY MEAL SELECTIONS
CREATE TABLE IF NOT EXISTS daily_meal_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES meal_subscriptions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type VARCHAR(50) NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    is_opted_out BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_meal_date UNIQUE (student_id, date, meal_type)
);

-- 5. INVENTORY LOGS
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    item_id UUID REFERENCES canteen_menus(id) ON DELETE CASCADE,
    opening_stock INTEGER NOT NULL DEFAULT 0,
    used INTEGER NOT NULL DEFAULT 0,
    waste INTEGER NOT NULL DEFAULT 0,
    closing_stock INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    logged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. AI MENU PLANS
CREATE TABLE IF NOT EXISTS ai_menu_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    plan JSONB NOT NULL DEFAULT '{}'::jsonb,
    nutritional_summary JSONB DEFAULT '{}'::jsonb,
    generated_by VARCHAR(50) DEFAULT 'ai',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. NUTRITION LOGS
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_calories INTEGER NOT NULL DEFAULT 0,
    protein_g DECIMAL(6, 2) DEFAULT 0.0,
    carbs_g DECIMAL(6, 2) DEFAULT 0.0,
    fat_g DECIMAL(6, 2) DEFAULT 0.0,
    meal_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_nutrition_date UNIQUE (student_id, date)
);

-- 8. HYGIENE CHECKLISTS
CREATE TABLE IF NOT EXISTS hygiene_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    temperature_log JSONB DEFAULT '{}'::jsonb,
    cleanliness_score INTEGER CHECK (cleanliness_score >= 1 AND cleanliness_score <= 100),
    items_checked JSONB NOT NULL DEFAULT '[]'::jsonb,
    passed BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_vendor_hygiene_date UNIQUE (institution_id, date)
);

-- 9. ALTER CANTEEN MENUS
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS protein_g DECIMAL(6, 2) DEFAULT 0.0;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS carbs_g DECIMAL(6, 2) DEFAULT 0.0;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS fat_g DECIMAL(6, 2) DEFAULT 0.0;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER DEFAULT 15;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS daily_stock INTEGER DEFAULT 100;
ALTER TABLE canteen_menus ADD COLUMN IF NOT EXISTS stock_remaining INTEGER DEFAULT 100;
ALTER TABLE canteen_menus DROP COLUMN IF EXISTS allergens;
ALTER TABLE canteen_menus ADD COLUMN allergens TEXT[] DEFAULT '{}'::text[];

-- 10. ALTER CANTEEN ORDERS
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10, 2);
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS counter_id UUID REFERENCES canteen_counters(id) ON DELETE SET NULL;
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS token_number INTEGER;
ALTER TABLE canteen_orders ADD COLUMN IF NOT EXISTS estimated_ready_minutes INTEGER DEFAULT 15;

-- 11. INDEXING
CREATE INDEX IF NOT EXISTS idx_canteen_counters_inst ON canteen_counters(institution_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_inst ON meal_plans(institution_id);
CREATE INDEX IF NOT EXISTS idx_daily_meal_sel_stud ON daily_meal_selections(student_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_date ON inventory_logs(date);
CREATE INDEX IF NOT EXISTS idx_ai_menu_plans_week ON ai_menu_plans(week_start);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_date ON nutrition_logs(date);
CREATE INDEX IF NOT EXISTS idx_hygiene_chk_date ON hygiene_checklists(date);

-- 12. ENABLE ROW LEVEL SECURITY
ALTER TABLE canteen_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_meal_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_menu_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hygiene_checklists ENABLE ROW LEVEL SECURITY;

-- 13. TENANT ISOLATION POLICIES
DROP POLICY IF EXISTS tenant_canteen_counters_policy ON canteen_counters;
CREATE POLICY tenant_canteen_counters_policy ON canteen_counters
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_meal_plans_policy ON meal_plans;
CREATE POLICY tenant_meal_plans_policy ON meal_plans
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_daily_meal_selections_policy ON daily_meal_selections;
CREATE POLICY tenant_daily_meal_selections_policy ON daily_meal_selections
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_inventory_logs_policy ON inventory_logs;
CREATE POLICY tenant_inventory_logs_policy ON inventory_logs
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_ai_menu_plans_policy ON ai_menu_plans;
CREATE POLICY tenant_ai_menu_plans_policy ON ai_menu_plans
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_nutrition_logs_policy ON nutrition_logs;
CREATE POLICY tenant_nutrition_logs_policy ON nutrition_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
              AND (s.institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
        )
    );

DROP POLICY IF EXISTS tenant_hygiene_checklists_policy ON hygiene_checklists;
CREATE POLICY tenant_hygiene_checklists_policy ON hygiene_checklists
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');
