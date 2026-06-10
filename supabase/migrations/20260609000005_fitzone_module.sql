-- ============================================================
-- IRIS 365 — MODULE 3: FITZONE SYSTEM EXTENSIONS
-- ============================================================

-- 1. GYM TRAINERS
CREATE TABLE IF NOT EXISTS gym_trainers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specializations TEXT[],
    bio TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. GYM MEMBERSHIP PLANS
CREATE TABLE IF NOT EXISTS gym_membership_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    duration_months INTEGER,
    price DECIMAL(10, 2),
    features TEXT[],
    max_sessions_per_week INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ADJUST GYM SLOTS
ALTER TABLE gym_slots DROP CONSTRAINT IF EXISTS gym_slots_trainer_id_fkey;
ALTER TABLE gym_slots ADD COLUMN IF NOT EXISTS slot_type TEXT DEFAULT 'general';
ALTER TABLE gym_slots ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;
-- Ensure trainer_id type matches gym_trainers(id) type
ALTER TABLE gym_slots ALTER COLUMN trainer_id TYPE UUID;
-- We can add constraint on gym_slots.trainer_id after table definitions
ALTER TABLE gym_slots ADD CONSTRAINT gym_slots_trainer_id_gym_trainers_fkey FOREIGN KEY (trainer_id) REFERENCES gym_trainers(id) ON DELETE SET NULL;

-- 4. ADJUST GYM BOOKINGS
ALTER TABLE gym_bookings ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE gym_bookings ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE;
-- Alter booking_date type to TIMESTAMP WITH TIME ZONE if it isn't
ALTER TABLE gym_bookings ALTER COLUMN booking_date TYPE TIMESTAMP WITH TIME ZONE;
-- We alter status to support both camelcase and lowercase values to avoid breaking previous atomic functions
ALTER TABLE gym_bookings DROP CONSTRAINT IF EXISTS gym_bookings_status_check;
ALTER TABLE gym_bookings ADD CONSTRAINT gym_bookings_status_check CHECK (status IN ('booked', 'checked_in', 'no_show', 'cancelled', 'Booked', 'Checked_in', 'No_show', 'Cancelled'));

-- 5. ADJUST GYM MEMBERSHIPS
ALTER TABLE gym_memberships ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES gym_membership_plans(id) ON DELETE SET NULL;
ALTER TABLE gym_memberships ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE gym_memberships ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE gym_memberships ADD COLUMN IF NOT EXISTS frozen_from DATE;
ALTER TABLE gym_memberships ADD COLUMN IF NOT EXISTS frozen_until DATE;

-- 6. GYM EQUIPMENT
CREATE TABLE IF NOT EXISTS gym_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 1,
    condition TEXT DEFAULT 'good', -- excellent, good, fair, maintenance
    purchase_date DATE,
    last_serviced DATE,
    next_service DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. EQUIPMENT USAGE LOGS
CREATE TABLE IF NOT EXISTS equipment_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID REFERENCES gym_equipment(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. EQUIPMENT MAINTENANCE LOGS
CREATE TABLE IF NOT EXISTS equipment_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID REFERENCES gym_equipment(id) ON DELETE CASCADE,
    maintenance_type TEXT,
    performed_by TEXT,
    date DATE DEFAULT CURRENT_DATE,
    cost DECIMAL(10, 2),
    notes TEXT,
    next_due DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. FITNESS METRICS
CREATE TABLE IF NOT EXISTS fitness_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES gym_trainers(id) ON DELETE SET NULL,
    date DATE DEFAULT CURRENT_DATE,
    weight_kg DECIMAL(5, 2),
    height_cm DECIMAL(5, 2),
    bmi DECIMAL(5, 2),
    body_fat_percent DECIMAL(5, 2),
    chest_cm DECIMAL(5, 2),
    waist_cm DECIMAL(5, 2),
    hips_cm DECIMAL(5, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. WORKOUT SESSIONS
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES gym_bookings(id) ON DELETE SET NULL,
    date DATE DEFAULT CURRENT_DATE,
    duration_minutes INTEGER,
    exercises JSONB, -- list of exercises with sets, reps, weight
    calories_burned INTEGER DEFAULT 0,
    trainer_notes TEXT,
    self_rating INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. TRAINER SESSIONS
CREATE TABLE IF NOT EXISTS trainer_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID REFERENCES gym_trainers(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 60,
    session_type TEXT, -- personal_training, assessment, onboarding
    status TEXT DEFAULT 'scheduled', -- scheduled, accepted, rejected, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. INDEXES
CREATE INDEX IF NOT EXISTS idx_gym_trainers_inst ON gym_trainers(institution_id);
CREATE INDEX IF NOT EXISTS idx_gym_trainers_user ON gym_trainers(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_membership_plans_inst ON gym_membership_plans(institution_id);
CREATE INDEX IF NOT EXISTS idx_gym_slots_date ON gym_slots(date);
CREATE INDEX IF NOT EXISTS idx_gym_bookings_student ON gym_bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_gym_bookings_slot ON gym_bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_gym_memberships_student ON gym_memberships(student_id);
CREATE INDEX IF NOT EXISTS idx_gym_equipment_inst ON gym_equipment(institution_id);
CREATE INDEX IF NOT EXISTS idx_equipment_usage_logs_equip ON equipment_usage_logs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_usage_logs_student ON equipment_usage_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maint_logs_equip ON equipment_maintenance_logs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_fitness_metrics_student ON fitness_metrics(student_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_student ON workout_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_trainer_sessions_trainer ON trainer_sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_sessions_student ON trainer_sessions(student_id);

-- 13. ENABLE ROW LEVEL SECURITY
ALTER TABLE gym_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_sessions ENABLE ROW LEVEL SECURITY;

-- 14. TENANT ISOLATION RLS POLICIES
CREATE POLICY gym_trainers_tenant ON gym_trainers
    USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY gym_membership_plans_tenant ON gym_membership_plans
    USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY gym_equipment_tenant ON gym_equipment
    USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY equipment_usage_logs_tenant ON equipment_usage_logs
    USING (
        equipment_id IN (SELECT id FROM gym_equipment WHERE institution_id = get_auth_institution_id())
        OR get_auth_user_role() = 'SuperAdmin'
    );

CREATE POLICY equipment_maintenance_logs_tenant ON equipment_maintenance_logs
    USING (
        equipment_id IN (SELECT id FROM gym_equipment WHERE institution_id = get_auth_institution_id())
        OR get_auth_user_role() = 'SuperAdmin'
    );

CREATE POLICY fitness_metrics_tenant ON fitness_metrics
    USING (
        student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id())
        OR get_auth_user_role() = 'SuperAdmin'
    );

CREATE POLICY workout_sessions_tenant ON workout_sessions
    USING (
        student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id())
        OR get_auth_user_role() = 'SuperAdmin'
    );

CREATE POLICY trainer_sessions_tenant ON trainer_sessions
    USING (
        trainer_id IN (SELECT id FROM gym_trainers WHERE institution_id = get_auth_institution_id())
        OR student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id())
        OR get_auth_user_role() = 'SuperAdmin'
    );
