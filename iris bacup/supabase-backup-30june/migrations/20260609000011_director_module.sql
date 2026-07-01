-- Migration: Module 9 (Director Dashboard Module)
-- Target: Supabase / PostgreSQL

-- 1. Create tables
CREATE TABLE IF NOT EXISTS director_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info','warning','critical')) DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  module TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  alert_type TEXT UNIQUE NOT NULL,
  threshold_value DECIMAL,
  comparison TEXT CHECK (comparison IN ('lt','gt','eq')),
  is_enabled BOOLEAN DEFAULT true,
  notify_via TEXT[] DEFAULT '{push,email}'
);

CREATE TABLE IF NOT EXISTS director_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  report_date DATE NOT NULL,
  data JSONB NOT NULL,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  emailed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  insight_type TEXT,
  title TEXT,
  description TEXT,
  severity TEXT,
  affected_entities JSONB,
  data_points JSONB,
  recommendation TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  is_dismissed BOOLEAN DEFAULT false
);

-- 2. Materialized Views
-- Join attendance with attendance_sessions as attendance table does not have department_id
DROP MATERIALIZED VIEW IF EXISTS daily_attendance_summary;
CREATE MATERIALIZED VIEW daily_attendance_summary AS
SELECT 
  a.institution_id,
  a.date,
  s.department_id,
  COUNT(*) as total_students,
  COUNT(CASE WHEN LOWER(a.status) = 'present' THEN 1 END) as present_count,
  ROUND(COUNT(CASE WHEN LOWER(a.status) = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as attendance_percent
FROM attendance a
JOIN attendance_sessions s ON a.session_id = s.id
GROUP BY a.institution_id, a.date, s.department_id;

-- Fee Summary Materialized view
-- Select successful Completed payments (since status is Completed in schema)
DROP MATERIALIZED VIEW IF EXISTS daily_fee_summary;
CREATE MATERIALIZED VIEW daily_fee_summary AS
SELECT
  institution_id,
  payment_date as date,
  COUNT(*) as payments_count,
  SUM(amount_paid) as total_collected,
  COUNT(DISTINCT student_id) as unique_payers
FROM fee_payments
WHERE status = 'Completed'
GROUP BY institution_id, payment_date;

-- Unique Indexes required for view refresh CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_attendance_summary ON daily_attendance_summary (institution_id, date, department_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_fee_summary ON daily_fee_summary (institution_id, date);

-- 3. Materialized View Refresh Helper function
CREATE OR REPLACE FUNCTION refresh_director_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_attendance_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_fee_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable RLS
ALTER TABLE director_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE director_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- 5. Create multi-tenant policies
DROP POLICY IF EXISTS tenant_director_alerts_policy ON director_alerts;
CREATE POLICY tenant_director_alerts_policy ON director_alerts
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_alert_thresholds_policy ON alert_thresholds;
CREATE POLICY tenant_alert_thresholds_policy ON alert_thresholds
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_director_reports_policy ON director_reports;
CREATE POLICY tenant_director_reports_policy ON director_reports
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

DROP POLICY IF EXISTS tenant_ai_insights_policy ON ai_insights;
CREATE POLICY tenant_ai_insights_policy ON ai_insights
    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');

-- 6. Seed Default Threshold Settings
-- Maps to institution SIET
INSERT INTO alert_thresholds (institution_id, alert_type, threshold_value, comparison, is_enabled)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'attendance_low', 75.0, 'lt', true),
  ('a0000000-0000-0000-0000-000000000001', 'fee_target_missed', 80.0, 'lt', true),
  ('a0000000-0000-0000-0000-000000000001', 'complaint_overdue', 5, 'gt', true),
  ('a0000000-0000-0000-0000-000000000001', 'bus_stopped', 10, 'gt', true),
  ('a0000000-0000-0000-0000-000000000001', 'hostel_complaint_surge', 5, 'gt', true),
  ('a0000000-0000-0000-0000-000000000001', 'exam_result_pending', 7, 'gt', true),
  ('a0000000-0000-0000-0000-000000000001', 'library_overdue_surge', 20, 'gt', true)
ON CONFLICT (alert_type) DO UPDATE
SET threshold_value = EXCLUDED.threshold_value, comparison = EXCLUDED.comparison;
