-- ============================================================
-- MODULE 9: IRIS Director Dashboard — Extended Schema
-- ============================================================

-- 1. CREATE strategic_goals TABLE
CREATE TABLE IF NOT EXISTS strategic_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  target_value DECIMAL NOT NULL,
  current_value DECIMAL NOT NULL DEFAULT 0.0,
  deadline DATE NOT NULL,
  unit TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'achieved', 'missed')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. CREATE board_reports TABLE
CREATE TABLE IF NOT EXISTS board_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  year INTEGER NOT NULL,
  pptx_url TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  sent_to TEXT[] DEFAULT '{}'::text[]
);

-- 3. CREATE financial_pl TABLE
CREATE TABLE IF NOT EXISTS financial_pl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  revenue_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  cost_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  net_surplus DECIMAL NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_monthly_pl UNIQUE (institution_id, month, year)
);

-- 4. CREATE competitor_benchmarks TABLE
CREATE TABLE IF NOT EXISTS competitor_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  our_value DECIMAL NOT NULL,
  industry_avg DECIMAL NOT NULL,
  top_performer DECIMAL NOT NULL,
  percentile DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. CREATE student_journey_scores TABLE
CREATE TABLE IF NOT EXISTS student_journey_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  engagement_score DECIMAL NOT NULL DEFAULT 0.0,
  academic_score DECIMAL NOT NULL DEFAULT 0.0,
  social_score DECIMAL NOT NULL DEFAULT 0.0,
  facility_score DECIMAL NOT NULL DEFAULT 0.0,
  overall_score DECIMAL NOT NULL DEFAULT 0.0,
  intervention_status VARCHAR(50) DEFAULT 'none' CHECK (intervention_status IN ('none', 'pending_counselor', 'counselor_assigned', 'resolved')),
  calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_strategic_goals_inst ON strategic_goals(institution_id);
CREATE INDEX IF NOT EXISTS idx_board_reports_inst ON board_reports(institution_id);
CREATE INDEX IF NOT EXISTS idx_financial_pl_inst ON financial_pl(institution_id);
CREATE INDEX IF NOT EXISTS idx_competitor_benchmarks_inst ON competitor_benchmarks(institution_id);
CREATE INDEX IF NOT EXISTS idx_student_journey_scores_student ON student_journey_scores(student_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE strategic_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_pl ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_journey_scores ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_isolation_strategic_goals ON strategic_goals;
CREATE POLICY tenant_isolation_strategic_goals ON strategic_goals
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_isolation_board_reports ON board_reports;
CREATE POLICY tenant_isolation_board_reports ON board_reports
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_isolation_financial_pl ON financial_pl;
CREATE POLICY tenant_isolation_financial_pl ON financial_pl
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_isolation_competitor_benchmarks ON competitor_benchmarks;
CREATE POLICY tenant_isolation_competitor_benchmarks ON competitor_benchmarks
  FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_isolation_student_journey_scores ON student_journey_scores;
CREATE POLICY tenant_isolation_student_journey_scores ON student_journey_scores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_id
      AND (s.institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin')
    )
  );

-- ============================================================
-- SEED MOCK DATA
-- ============================================================

-- Seed Strategic Goals
INSERT INTO strategic_goals (id, institution_id, metric_name, target_value, current_value, deadline, unit, status)
VALUES
  ('81000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Attendance Rate', 85.00, 82.00, '2026-12-31', '%', 'on_track'),
  ('81000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Fee Collection', 15000000.00, 14200000.00, '2026-12-31', '₹', 'on_track'),
  ('81000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Pass Rate', 90.00, 88.00, '2026-12-31', '%', 'on_track'),
  ('81000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Annual Fee Target Large', 25000000.00, 11000000.00, '2026-12-31', '₹', 'at_risk')
ON CONFLICT (id) DO NOTHING;

-- Seed Competitor Benchmarks
INSERT INTO competitor_benchmarks (id, institution_id, metric, our_value, industry_avg, top_performer, percentile)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Attendance Rate', 82.00, 78.50, 92.00, 74.00),
  ('b1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Fee Collection Rate', 78.00, 72.00, 95.00, 82.00),
  ('b1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Module Adoption (Canteen)', 92.00, 80.00, 98.00, 88.00),
  ('b1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Module Adoption (FitZone)', 64.00, 50.00, 85.00, 70.00),
  ('b1000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Module Adoption (Library+)', 72.00, 60.00, 90.00, 75.00),
  ('b1000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Module Adoption (Transit)', 58.00, 65.00, 88.00, 42.00)
ON CONFLICT (id) DO NOTHING;

-- Seed Financial P&L
INSERT INTO financial_pl (id, institution_id, month, year, revenue_breakdown, cost_breakdown, net_surplus)
VALUES
  ('71000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 1, 2026, '{"fees": 4500000, "canteen": 125000, "events": 85000, "gym": 45000, "hostel": 650000}', '{"staff": 1200000, "maintenance": 300000, "utilities": 150000}', 3755000.00),
  ('71000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 2, 2026, '{"fees": 4800000, "canteen": 130000, "events": 90000, "gym": 48000, "hostel": 650000}', '{"staff": 1200000, "maintenance": 280000, "utilities": 145000}', 4093000.00),
  ('71000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 3, 2026, '{"fees": 5200000, "canteen": 145000, "events": 120000, "gym": 52000, "hostel": 680000}', '{"staff": 1250000, "maintenance": 310000, "utilities": 160000}', 4477000.00),
  ('71000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 4, 2026, '{"fees": 3900000, "canteen": 110000, "events": 50000, "gym": 40000, "hostel": 620000}', '{"staff": 1200000, "maintenance": 250000, "utilities": 135000}', 3135000.00),
  ('71000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 5, 2026, '{"fees": 4100000, "canteen": 115000, "events": 60000, "gym": 42000, "hostel": 620000}', '{"staff": 1200000, "maintenance": 260000, "utilities": 140000}', 3337000.00)
ON CONFLICT (id) DO NOTHING;

-- Seed Student Journey Scores for existing students dynamically
DO $$
DECLARE
  stud RECORD;
BEGIN
  FOR stud IN SELECT id FROM students LOOP
    INSERT INTO student_journey_scores (student_id, engagement_score, academic_score, social_score, facility_score, overall_score, intervention_status)
    VALUES (
      stud.id,
      50 + FLOOR(RANDOM() * 45), -- 50 to 95
      60 + FLOOR(RANDOM() * 38), -- 60 to 98
      45 + FLOOR(RANDOM() * 50), -- 45 to 95
      55 + FLOOR(RANDOM() * 40), -- 55 to 95
      60 + FLOOR(RANDOM() * 30), -- 60 to 90
      'none'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
