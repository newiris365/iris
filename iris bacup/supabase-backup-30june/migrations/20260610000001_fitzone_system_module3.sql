-- ============================================================
-- IRIS 365 — MODULE 3: FITZONE SYSTEM SCHEMA EXPANSIONS
-- ============================================================

-- 1. AI WORKOUT PLANS
CREATE TABLE IF NOT EXISTS ai_workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    goal TEXT NOT NULL,
    plan JSONB NOT NULL,
    week_number INTEGER DEFAULT 1,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_adjusted TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. FITNESS CHALLENGES
CREATE TABLE IF NOT EXISTS fitness_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    challenge_type TEXT NOT NULL, -- steps, plank, weight_loss, etc.
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_value DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL, -- reps, minutes, steps, kg
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CHALLENGE PARTICIPANTS
CREATE TABLE IF NOT EXISTS challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES fitness_challenges(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    current_value DECIMAL(10, 2) DEFAULT 0.0,
    rank INTEGER,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_challenge_student UNIQUE (challenge_id, student_id)
);

-- 4. FITPOINTS LOG
CREATE TABLE IF NOT EXISTS fitpoints_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. VIRTUAL CLASSES
CREATE TABLE IF NOT EXISTS virtual_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES gym_trainers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    duration_minutes INTEGER DEFAULT 30,
    difficulty TEXT DEFAULT 'Beginner', -- Beginner, Intermediate, Advanced
    category TEXT DEFAULT 'General', -- Cardio, HIIT, Strength, Yoga, Stretch
    view_count INTEGER DEFAULT 0,
    is_live BOOLEAN DEFAULT FALSE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. WELLNESS DAILY CHECKINS
CREATE TABLE IF NOT EXISTS wellness_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    mood INTEGER CHECK (mood BETWEEN 1 AND 5),
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
    sleep_hours DECIMAL(4, 2),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_student_date UNIQUE (student_id, date)
);

-- 7. SEARCH INDEXES
CREATE INDEX IF NOT EXISTS idx_ai_workout_plans_student ON ai_workout_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_fitness_challenges_inst ON fitness_challenges(institution_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_student ON challenge_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_fitpoints_log_student ON fitpoints_log(student_id);
CREATE INDEX IF NOT EXISTS idx_virtual_classes_inst ON virtual_classes(institution_id);
CREATE INDEX IF NOT EXISTS idx_wellness_checkins_student_date ON wellness_checkins(student_id, date);

-- 8. ENABLE ROW LEVEL SECURITY
ALTER TABLE ai_workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitpoints_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_checkins ENABLE ROW LEVEL SECURITY;

-- 9. TENANT ISOLATION RLS POLICIES
CREATE POLICY ai_workout_plans_tenant ON ai_workout_plans
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()) OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY fitness_challenges_tenant ON fitness_challenges
    USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY challenge_participants_tenant ON challenge_participants
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()) OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY fitpoints_log_tenant ON fitpoints_log
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()) OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY virtual_classes_tenant ON virtual_classes
    USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

CREATE POLICY wellness_checkins_tenant ON wellness_checkins
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()) OR get_auth_user_role() = 'SuperAdmin');
