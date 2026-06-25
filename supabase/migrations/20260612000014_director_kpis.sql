-- =========================================================================
-- DIRECTOR DASHBOARD KPIs & ANALYTICS
-- Migration: 20260612000014
-- Real-time campus pulse, fee recovery, attendance trends,
-- complaint SLA, NAAC export, system anomaly detection
-- =========================================================================

-- =========================================================================
-- 1. SYSTEM ANOMALY DETECTION TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS system_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  anomaly_type VARCHAR(50) NOT NULL, -- geo_fence_violation, duplicate_attendance, rapid_wallet_txn, new_device_login, dual_presence, unusual_hours, bulk_action
  severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  module VARCHAR(50) NOT NULL, -- attendance, wallet, gate, auth, canteen
  person_id UUID,
  person_type VARCHAR(20), -- student, staff, teacher
  person_name TEXT,
  metadata JSONB DEFAULT '{}', -- { lat, long, device_id, amount, old_value, new_value }
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_anomalies_institution ON system_anomalies(institution_id);
CREATE INDEX IF NOT EXISTS idx_system_anomalies_type ON system_anomalies(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_system_anomalies_created ON system_anomalies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_anomalies_unresolved ON system_anomalies(institution_id, is_resolved) WHERE NOT is_resolved;

-- =========================================================================
-- 2. NAAC ACCREDITATION SNAPSHOTS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS naac_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  data JSONB NOT NULL, -- Full NAAC metrics blob
  generated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, snapshot_date)
);

-- =========================================================================
-- 3. DIRECTOR KPI RPCs
-- =========================================================================

-- 3a. Campus Pulse: 10 real KPIs in one call
CREATE OR REPLACE FUNCTION get_campus_pulse()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inst_id UUID;
  v_result JSON;
  v_today DATE := CURRENT_DATE;
  v_this_month_start DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_attendance_pct NUMERIC := 0;
  v_total_students INT := 0;
  v_fee_billed NUMERIC := 0;
  v_fee_collected NUMERIC := 0;
  v_fee_outstanding NUMERIC := 0;
  v_hostel_occupied INT := 0;
  v_hostel_capacity INT := 0;
  v_complaints_open INT := 0;
  v_gate_entries_today INT := 0;
  v_canteen_revenue NUMERIC := 0;
  v_bus_routes_active INT := 0;
  v_security_incidents INT := 0;
  v_departments JSONB := '[]'::JSONB;
  v_fee_by_dept JSONB := '[]'::JSONB;
BEGIN
  SELECT u.institution_id INTO v_inst_id
  FROM users u
  WHERE u.id = auth.uid();

  IF v_inst_id IS NULL THEN
    SELECT id INTO v_inst_id FROM institutions LIMIT 1;
  END IF;

  -- 1. Today's attendance %
  SELECT COALESCE(
    ROUND(100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(*), 0), 1), 0
  ) INTO v_attendance_pct
  FROM attendance a
  WHERE a.institution_id = v_inst_id
    AND a.date = v_today;

  -- 2. Total active students
  SELECT COUNT(*) INTO v_total_students
  FROM students s
  WHERE s.institution_id = v_inst_id AND s.is_active = TRUE;

  -- 3. Fee collection this month
  SELECT
    COALESCE(SUM(fs.amount), 0),
    COALESCE(SUM(fp.amount_paid), 0),
    COALESCE(SUM(fs.amount), 0) - COALESCE(SUM(fp.amount_paid), 0)
  INTO v_fee_billed, v_fee_collected, v_fee_outstanding
  FROM fee_structures fs
  LEFT JOIN student_fees sf ON sf.fee_structure_id = fs.id AND sf.institution_id = v_inst_id
  LEFT JOIN fee_payments fp ON fp.student_id = sf.student_id AND fp.fee_structure_id = sf.fee_structure_id AND fp.status = 'completed'
    AND fp.payment_date >= v_this_month_start
  WHERE fs.institution_id = v_inst_id;

  -- 4. Hostel occupancy
  SELECT
    COALESCE(SUM(hr.occupied), 0),
    COALESCE(SUM(hr.capacity), 0)
  INTO v_hostel_occupied, v_hostel_capacity
  FROM hostel_blocks hb
  JOIN hostel_rooms hr ON hr.block_id = hb.id
  WHERE hb.institution_id = v_inst_id;

  -- 5. Open complaints
  SELECT COUNT(*) INTO v_complaints_open
  FROM hostel_complaints hc
  WHERE hc.institution_id = v_inst_id
    AND hc.status NOT IN ('resolved', 'closed');

  -- 6. Gate entries today
  SELECT COUNT(*) INTO v_gate_entries_today
  FROM gate_entries ge
  WHERE ge.institution_id = v_inst_id
    AND ge.timestamp::DATE = v_today;

  -- 7. Canteen revenue today
  SELECT COALESCE(SUM(co.total_amount), 0) INTO v_canteen_revenue
  FROM canteen_orders co
  WHERE co.institution_id = v_inst_id
    AND co.order_time::DATE = v_today
    AND co.status != 'cancelled';

  -- 8. Active bus routes
  SELECT COUNT(DISTINCT bt.route_id) INTO v_bus_routes_active
  FROM bus_trips bt
  WHERE bt.institution_id = v_inst_id
    AND bt.trip_date = v_today
    AND bt.status IN ('in_progress', 'scheduled');

  -- 9. Security incidents today
  SELECT COUNT(*) INTO v_security_incidents
  FROM security_incidents si
  WHERE si.institution_id = v_inst_id
    AND si.created_at::DATE = v_today;

  -- 10. Department breakdown
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'name', d.name,
      'student_count', dept_stats.cnt,
      'attendance_pct', dept_stats.att_pct
    )
  ), '[]'::JSONB) INTO v_departments
  FROM (
    SELECT
      s.department_id,
      COUNT(*) as cnt,
      COALESCE(ROUND(100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(a.id), 0), 1), 0) as att_pct
    FROM students s
    LEFT JOIN attendance a ON a.student_id = s.id AND a.date = v_today
    WHERE s.institution_id = v_inst_id AND s.is_active = TRUE
    GROUP BY s.department_id
  ) dept_stats
  JOIN departments d ON d.id = dept_stats.department_id;

  -- Fee by department
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'department', d.name,
      'billed', COALESCE(dept_fees.billed, 0),
      'collected', COALESCE(dept_fees.collected, 0),
      'outstanding', COALESCE(dept_fees.billed, 0) - COALESCE(dept_fees.collected, 0)
    )
  ), '[]'::JSONB) INTO v_fee_by_dept
  FROM (
    SELECT
      s.department_id,
      SUM(sf.amount) as billed,
      SUM(COALESCE(fp.amount_paid, 0)) as collected
    FROM students s
    JOIN student_fees sf ON sf.student_id = s.id
    LEFT JOIN fee_payments fp ON fp.student_id = sf.student_id AND fp.fee_structure_id = sf.fee_structure_id AND fp.status = 'completed'
    WHERE s.institution_id = v_inst_id AND s.is_active = TRUE
    GROUP BY s.department_id
  ) dept_fees
  JOIN departments d ON d.id = dept_fees.department_id;

  v_result := json_build_object(
    'attendance_pct', v_attendance_pct,
    'total_students', v_total_students,
    'fee_billed', v_fee_billed,
    'fee_collected', v_fee_collected,
    'fee_outstanding', v_fee_outstanding,
    'hostel_occupied', v_hostel_occupied,
    'hostel_capacity', v_hostel_capacity,
    'hostel_occupancy_pct', CASE WHEN v_hostel_capacity > 0 THEN ROUND(100.0 * v_hostel_occupied / v_hostel_capacity, 1) ELSE 0 END,
    'complaints_open', v_complaints_open,
    'gate_entries_today', v_gate_entries_today,
    'canteen_revenue', v_canteen_revenue,
    'bus_routes_active', v_bus_routes_active,
    'security_incidents', v_security_incidents,
    'departments', v_departments,
    'fee_by_department', v_fee_by_dept,
    'snapshot_date', v_today,
    'snapshot_time', NOW()
  );

  RETURN v_result;
END;
$$;

-- 3b. Fee Recovery Tracking
CREATE OR REPLACE FUNCTION get_fee_recovery_tracking(
  p_semester INT DEFAULT NULL,
  p_department_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inst_id UUID;
  v_result JSON;
BEGIN
  SELECT u.institution_id INTO v_inst_id
  FROM users u WHERE u.id = auth.uid();
  IF v_inst_id IS NULL THEN SELECT id INTO v_inst_id FROM institutions LIMIT 1; END IF;

  SELECT json_build_object(
    'summary', (
      SELECT json_build_object(
        'total_billed', COALESCE(SUM(sf.amount), 0),
        'total_collected', COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0),
        'total_outstanding', COALESCE(SUM(sf.amount), 0) - COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0),
        'collection_rate', CASE WHEN SUM(sf.amount) > 0
          THEN ROUND(100.0 * COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) / SUM(sf.amount), 1)
          ELSE 0 END,
        'total_students', COUNT(DISTINCT sf.student_id),
        'fully_paid_count', COUNT(DISTINCT sf.student_id) FILTER (
          WHERE COALESCE((SELECT SUM(amount_paid) FROM fee_payments WHERE student_id = sf.student_id AND fee_structure_id = sf.fee_structure_id AND status = 'completed'), 0) >= sf.amount
        ),
        'partial_paid_count', COUNT(DISTINCT sf.student_id) FILTER (
          WHERE COALESCE((SELECT SUM(amount_paid) FROM fee_payments WHERE student_id = sf.student_id AND fee_structure_id = sf.fee_structure_id AND status = 'completed'), 0) > 0
            AND COALESCE((SELECT SUM(amount_paid) FROM fee_payments WHERE student_id = sf.student_id AND fee_structure_id = sf.fee_structure_id AND status = 'completed'), 0) < sf.amount
        ),
        'unpaid_count', COUNT(DISTINCT sf.student_id) FILTER (
          WHERE COALESCE((SELECT SUM(amount_paid) FROM fee_payments WHERE student_id = sf.student_id AND fee_structure_id = sf.fee_structure_id AND status = 'completed'), 0) = 0
        )
      )
      FROM student_fees sf
      LEFT JOIN fee_payments fp ON fp.student_id = sf.student_id AND fp.fee_structure_id = sf.fee_structure_id
      JOIN students s ON s.id = sf.student_id AND s.institution_id = v_inst_id
      WHERE sf.institution_id = v_inst_id
        AND (p_semester IS NULL OR s.semester = p_semester)
        AND (p_department_id IS NULL OR s.department_id = p_department_id)
    ),
    'by_department', (
      SELECT COALESCE(jsonb_agg(row_to_json(d)), '[]'::JSONB)
      FROM (
        SELECT
          dep.name as department_name,
          COALESCE(SUM(sf.amount), 0) as billed,
          COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) as collected,
          COALESCE(SUM(sf.amount), 0) - COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) as outstanding,
          CASE WHEN SUM(sf.amount) > 0
            THEN ROUND(100.0 * COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) / SUM(sf.amount), 1)
            ELSE 0 END as collection_rate
        FROM students s
        JOIN departments dep ON dep.id = s.department_id
        LEFT JOIN student_fees sf ON sf.student_id = s.id
        LEFT JOIN fee_payments fp ON fp.student_id = sf.student_id AND fp.fee_structure_id = sf.fee_structure_id
        WHERE s.institution_id = v_inst_id AND s.is_active = TRUE
          AND (p_semester IS NULL OR s.semester = p_semester)
        GROUP BY dep.id, dep.name
        ORDER BY outstanding DESC
      ) d
    ),
    'by_fee_type', (
      SELECT COALESCE(jsonb_agg(row_to_json(ft)), '[]'::JSONB)
      FROM (
        SELECT
          fs.name as fee_name,
          COALESCE(SUM(sf.amount), 0) as billed,
          COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) as collected,
          COALESCE(SUM(sf.amount), 0) - COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) as outstanding
        FROM fee_structures fs
        LEFT JOIN student_fees sf ON sf.fee_structure_id = fs.id
        LEFT JOIN fee_payments fp ON fp.student_id = sf.student_id AND fp.fee_structure_id = sf.fee_structure_id
        WHERE fs.institution_id = v_inst_id
        GROUP BY fs.id, fs.name
        ORDER BY outstanding DESC
      ) ft
    ),
    'top_defaulters', (
      SELECT COALESCE(jsonb_agg(row_to_json(def)), '[]'::JSONB)
      FROM (
        SELECT
          s.id as student_id,
          u.name as student_name,
          s.roll_number,
          dep.name as department_name,
          s.semester,
          COALESCE(SUM(sf.amount), 0) as total_due,
          COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) as total_paid,
          COALESCE(SUM(sf.amount), 0) - COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) as overdue_amount,
          COALESCE(guardian.guardian_name, '') as guardian_name,
          COALESCE(guardian.guardian_phone, '') as guardian_phone
        FROM students s
        JOIN users u ON u.id = s.user_id
        JOIN departments dep ON dep.id = s.department_id
        LEFT JOIN student_fees sf ON sf.student_id = s.id
        LEFT JOIN fee_payments fp ON fp.student_id = sf.student_id AND fp.fee_structure_id = sf.fee_structure_id
        LEFT JOIN LATERAL (
          SELECT s2.guardian_name, s2.guardian_phone
          FROM students s2 WHERE s2.id = s.id
        ) guardian ON TRUE
        WHERE s.institution_id = v_inst_id AND s.is_active = TRUE
        GROUP BY s.id, u.name, s.roll_number, dep.name, s.semester, guardian.guardian_name, guardian.guardian_phone
        HAVING COALESCE(SUM(sf.amount), 0) - COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) > 0
        ORDER BY overdue_amount DESC
        LIMIT 20
      ) def
    ),
    'monthly_trend', (
      SELECT COALESCE(jsonb_agg(row_to_json(mt)), '[]'::JSONB)
      FROM (
        SELECT
          DATE_TRUNC('month', fp.payment_date)::DATE as month,
          SUM(fp.amount_paid) as collected
        FROM fee_payments fp
        WHERE fp.institution_id = v_inst_id AND fp.status = 'completed'
          AND fp.payment_date >= (CURRENT_DATE - INTERVAL '12 months')
        GROUP BY DATE_TRUNC('month', fp.payment_date)
        ORDER BY month
      ) mt
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 3c. Attendance Trends (department-wise, weekly/monthly)
CREATE OR REPLACE FUNCTION get_attendance_trends(
  p_period VARCHAR DEFAULT 'weekly', -- weekly, monthly
  p_department_id UUID DEFAULT NULL,
  p_weeks INT DEFAULT 12
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inst_id UUID;
  v_result JSON;
  v_start_date DATE;
BEGIN
  SELECT u.institution_id INTO v_inst_id
  FROM users u WHERE u.id = auth.uid();
  IF v_inst_id IS NULL THEN SELECT id INTO v_inst_id FROM institutions LIMIT 1; END IF;

  IF p_period = 'weekly' THEN
    v_start_date := CURRENT_DATE - (p_weeks * 7);
  ELSE
    v_start_date := CURRENT_DATE - (p_weeks * 30);
  END IF;

  SELECT json_build_object(
    'overall_trend', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::JSONB)
      FROM (
        SELECT
          CASE WHEN p_period = 'weekly'
            THEN DATE_TRUNC('week', a.date)::DATE
            ELSE DATE_TRUNC('month', a.date)::DATE
          END as period_start,
          COUNT(*) as total_classes,
          COUNT(*) FILTER (WHERE a.status = 'present') as present_count,
          ROUND(100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(*), 0), 1) as attendance_pct
        FROM attendance a
        WHERE a.institution_id = v_inst_id
          AND a.date >= v_start_date
        GROUP BY period_start
        ORDER BY period_start
      ) t
    ),
    'by_department', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'department', dept_trend.department_name,
          'trend', dept_trend.trend
        )
      ), '[]'::JSONB)
      FROM (
        SELECT
          d.name as department_name,
          COALESCE(jsonb_agg(
            jsonb_build_object(
              'period', dept_data.period_start,
              'attendance_pct', dept_data.attendance_pct
            ) ORDER BY dept_data.period_start
          ), '[]'::JSONB) as trend
        FROM departments d
        CROSS JOIN LATERAL (
          SELECT
            CASE WHEN p_period = 'weekly'
              THEN DATE_TRUNC('week', a.date)::DATE
              ELSE DATE_TRUNC('month', a.date)::DATE
            END as period_start,
            ROUND(100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(*), 0), 1) as attendance_pct
          FROM attendance a
          JOIN students s ON s.id = a.student_id
          WHERE s.institution_id = v_inst_id
            AND s.department_id = d.id
            AND a.date >= v_start_date
            AND (p_department_id IS NULL OR s.department_id = p_department_id)
          GROUP BY period_start
        ) dept_data
        WHERE d.institution_id = v_inst_id
        GROUP BY d.id, d.name
        ORDER BY d.name
      ) dept_trend
    ),
    'department_summary', (
      SELECT COALESCE(jsonb_agg(row_to_json(ds)), '[]'::JSONB)
      FROM (
        SELECT
          d.name as department_name,
          d.id as department_id,
          COUNT(DISTINCT s.id) as student_count,
          COUNT(a.id) as total_records,
          COUNT(a.id) FILTER (WHERE a.status = 'present') as present_count,
          ROUND(100.0 * COUNT(a.id) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(a.id), 0), 1) as overall_pct,
          ROUND(100.0 * COUNT(a.id) FILTER (WHERE a.status = 'present' AND a.date >= CURRENT_DATE - 7) / NULLIF(COUNT(a.id) FILTER (WHERE a.date >= CURRENT_DATE - 7), 0), 1) as last_7d_pct,
          ROUND(100.0 * COUNT(a.id) FILTER (WHERE a.status = 'present' AND a.date >= CURRENT_DATE - 30) / NULLIF(COUNT(a.id) FILTER (WHERE a.date >= CURRENT_DATE - 30), 0), 1) as last_30d_pct
        FROM departments d
        LEFT JOIN students s ON s.department_id = d.id AND s.institution_id = v_inst_id AND s.is_active = TRUE
        LEFT JOIN attendance a ON a.student_id = s.id AND a.date >= v_start_date
        WHERE d.institution_id = v_inst_id
        GROUP BY d.id, d.name
        ORDER BY overall_pct ASC
      ) ds
    ),
    'declining_departments', (
      SELECT COALESCE(jsonb_agg(row_to_json(dd)), '[]'::JSONB)
      FROM (
        SELECT
          d.name as department_name,
          recent.recent_pct,
          older.older_pct,
          ROUND(recent.recent_pct - older.older_pct, 1) as change_pct
        FROM departments d
        JOIN LATERAL (
          SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(*), 0), 1) as recent_pct
          FROM attendance a
          JOIN students s ON s.id = a.student_id
          WHERE s.department_id = d.id AND s.institution_id = v_inst_id
            AND a.date >= CURRENT_DATE - 14
        ) recent ON TRUE
        JOIN LATERAL (
          SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(*), 0), 1) as older_pct
          FROM attendance a
          JOIN students s ON s.id = a.student_id
          WHERE s.department_id = d.id AND s.institution_id = v_inst_id
            AND a.date >= CURRENT_DATE - 28 AND a.date < CURRENT_DATE - 14
        ) older ON TRUE
        WHERE d.institution_id = v_inst_id
          AND (recent.recent_pct - older.older_pct) < -5
        ORDER BY (recent.recent_pct - older.older_pct) ASC
      ) dd
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 3d. Complaint SLA Monitoring
CREATE OR REPLACE FUNCTION get_complaint_sla_monitoring()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inst_id UUID;
  v_result JSON;
BEGIN
  SELECT u.institution_id INTO v_inst_id
  FROM users u WHERE u.id = auth.uid();
  IF v_inst_id IS NULL THEN SELECT id INTO v_inst_id FROM institutions LIMIT 1; END IF;

  SELECT json_build_object(
    'summary', (
      SELECT json_build_object(
        'total_complaints', COUNT(*),
        'open', COUNT(*) FILTER (WHERE hc.status = 'open'),
        'in_progress', COUNT(*) FILTER (WHERE hc.status = 'in_progress'),
        'resolved', COUNT(*) FILTER (WHERE hc.status = 'resolved'),
        'closed', COUNT(*) FILTER (WHERE hc.status = 'closed'),
        'avg_resolution_hours', ROUND(AVG(EXTRACT(EPOCH FROM (hc.resolved_at - hc.created_at)) / 3600) FILTER (WHERE hc.resolved_at IS NOT NULL), 1),
        'overdue_3days', COUNT(*) FILTER (WHERE hc.status NOT IN ('resolved', 'closed') AND hc.created_at < NOW() - INTERVAL '3 days'),
        'overdue_7days', COUNT(*) FILTER (WHERE hc.status NOT IN ('resolved', 'closed') AND hc.created_at < NOW() - INTERVAL '7 days')
      )
      FROM hostel_complaints hc
      WHERE hc.institution_id = v_inst_id
    ),
    'by_category', (
      SELECT COALESCE(jsonb_agg(row_to_json(cat)), '[]'::JSONB)
      FROM (
        SELECT
          hc.category,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE hc.status IN ('open', 'in_progress')) as pending,
          ROUND(AVG(EXTRACT(EPOCH FROM (hc.resolved_at - hc.created_at)) / 3600) FILTER (WHERE hc.resolved_at IS NOT NULL), 1) as avg_resolution_hours
        FROM hostel_complaints hc
        WHERE hc.institution_id = v_inst_id
        GROUP BY hc.category
        ORDER BY pending DESC
      ) cat
    ),
    'by_block', (
      SELECT COALESCE(jsonb_agg(row_to_json(blk)), '[]'::JSONB)
      FROM (
        SELECT
          hb.name as block_name,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE hc.status IN ('open', 'in_progress')) as pending,
          ROUND(AVG(EXTRACT(EPOCH FROM (hc.resolved_at - hc.created_at)) / 3600) FILTER (WHERE hc.resolved_at IS NOT NULL), 1) as avg_resolution_hours
        FROM hostel_complaints hc
        JOIN hostel_rooms hr ON hr.id = hc.room_id
        JOIN hostel_blocks hb ON hb.id = hr.block_id
        WHERE hc.institution_id = v_inst_id
        GROUP BY hb.id, hb.name
        ORDER BY pending DESC
      ) blk
    ),
    'sla_breaches', (
      SELECT COALESCE(jsonb_agg(row_to_json(slb)), '[]'::JSONB)
      FROM (
        SELECT
          hc.id,
          hc.category,
          hc.description,
          hc.status,
          hc.created_at,
          hc.assigned_to,
          EXTRACT(EPOCH FROM (NOW() - hc.created_at)) / 3600 as hours_open,
          CASE
            WHEN hc.created_at < NOW() - INTERVAL '7 days' THEN 'critical'
            WHEN hc.created_at < NOW() - INTERVAL '3 days' THEN 'warning'
            ELSE 'normal'
          END as sla_status
        FROM hostel_complaints hc
        WHERE hc.institution_id = v_inst_id
          AND hc.status NOT IN ('resolved', 'closed')
          AND hc.created_at < NOW() - INTERVAL '3 days'
        ORDER BY hc.created_at ASC
        LIMIT 50
      ) slb
    ),
    'repeat_rooms', (
      SELECT COALESCE(jsonb_agg(row_to_json(rr)), '[]'::JSONB)
      FROM (
        SELECT
          hc.room_id,
          hr.room_number,
          hb.name as block_name,
          COUNT(*) as complaint_count,
          MAX(hc.created_at) as last_complaint
        FROM hostel_complaints hc
        JOIN hostel_rooms hr ON hr.id = hc.room_id
        JOIN hostel_blocks hb ON hb.id = hr.block_id
        WHERE hc.institution_id = v_inst_id
        GROUP BY hc.room_id, hr.room_number, hb.name
        HAVING COUNT(*) >= 3
        ORDER BY complaint_count DESC
      ) rr
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 3e. NAAC Accreditation Data Export
CREATE OR REPLACE FUNCTION get_naac_accreditation_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inst_id UUID;
  v_result JSON;
  v_academic_year VARCHAR;
  v_student_count INT;
  v_teacher_count INT;
  v_staff_count INT;
BEGIN
  SELECT u.institution_id INTO v_inst_id
  FROM users u WHERE u.id = auth.uid();
  IF v_inst_id IS NULL THEN SELECT id INTO v_inst_id FROM institutions LIMIT 1; END IF;

  v_academic_year := CASE
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 7
    THEN EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR || '-' || (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::VARCHAR
    ELSE (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::VARCHAR || '-' || EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR
  END;

  SELECT COUNT(*) INTO v_student_count FROM students WHERE institution_id = v_inst_id AND is_active = TRUE;
  SELECT COUNT(*) INTO v_teacher_count FROM users WHERE institution_id = v_inst_id AND role = 'Teacher' AND is_active = TRUE;
  SELECT COUNT(*) INTO v_staff_count FROM users WHERE institution_id = v_inst_id AND role IN ('Staff', 'Admin') AND is_active = TRUE;

  SELECT json_build_object(
    'academic_year', v_academic_year,
    'generated_at', NOW(),

    -- Criterion 1: Curricular Aspects
    'curricular_aspects', json_build_object(
      'total_programs', (SELECT COUNT(DISTINCT department_id) FROM students WHERE institution_id = v_inst_id),
      'student_teacher_ratio', CASE WHEN v_teacher_count > 0 THEN ROUND(v_student_count::NUMERIC / v_teacher_count, 1) ELSE 0 END,
      'student_staff_ratio', CASE WHEN v_staff_count > 0 THEN ROUND(v_student_count::NUMERIC / v_staff_count, 1) ELSE 0 END
    ),

    -- Criterion 2: Teaching-Learning
    'teaching_learning', json_build_object(
      'total_students', v_student_count,
      'total_teachers', v_teacher_count,
      'attendance_summary', (
        SELECT json_build_object(
          'avg_attendance_pct', ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'present') / NULLIF(COUNT(*), 0), 1),
          'total_sessions', COUNT(*),
          'data_from', MIN(date),
          'data_to', MAX(date)
        )
        FROM attendance WHERE institution_id = v_inst_id
      ),
      'exam_results', (
        SELECT json_build_object(
          'total_exams', COUNT(DISTINCT exam_id),
          'total_results', COUNT(*),
          'pass_count', COUNT(*) FILTER (WHERE status = 'pass'),
          'pass_rate', ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'pass') / NULLIF(COUNT(*), 0), 1)
        )
        FROM exam_results WHERE institution_id = v_inst_id
      )
    ),

    -- Criterion 3: Research & Innovation
    'research_innovation', json_build_object(
      'total_events', (SELECT COUNT(*) FROM events WHERE institution_id = v_inst_id AND category = 'academic'),
      'total_workshops', (SELECT COUNT(*) FROM events WHERE institution_id = v_inst_id AND category = 'workshop')
    ),

    -- Criterion 4: Infrastructure
    'infrastructure', json_build_object(
      'hostel_blocks', (SELECT COUNT(*) FROM hostel_blocks WHERE institution_id = v_inst_id),
      'hostel_capacity', (SELECT COALESCE(SUM(capacity), 0) FROM hostel_rooms WHERE block_id IN (SELECT id FROM hostel_blocks WHERE institution_id = v_inst_id)),
      'hostel_occupied', (SELECT COALESCE(SUM(occupied), 0) FROM hostel_rooms WHERE block_id IN (SELECT id FROM hostel_blocks WHERE institution_id = v_inst_id)),
      'bus_routes', (SELECT COUNT(DISTINCT route_id) FROM bus_trips WHERE institution_id = v_inst_id),
      'library_books', (SELECT COUNT(*) FROM books WHERE institution_id = v_inst_id)
    ),

    -- Criterion 5: Student Support
    'student_support', json_build_object(
      'total_complaints', (SELECT COUNT(*) FROM hostel_complaints WHERE institution_id = v_inst_id),
      'resolved_complaints', (SELECT COUNT(*) FROM hostel_complaints WHERE institution_id = v_inst_id AND status IN ('resolved', 'closed')),
      'resolution_rate', (
        SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) / NULLIF(COUNT(*), 0), 1)
        FROM hostel_complaints WHERE institution_id = v_inst_id
      ),
      'fee_collection_rate', (
        SELECT CASE WHEN SUM(sf.amount) > 0
          THEN ROUND(100.0 * COALESCE(SUM(fp.amount_paid) FILTER (WHERE fp.status = 'completed'), 0) / SUM(sf.amount), 1)
          ELSE 0 END
        FROM student_fees sf
        LEFT JOIN fee_payments fp ON fp.student_id = sf.student_id AND fp.fee_structure_id = sf.fee_structure_id
        WHERE sf.institution_id = v_inst_id
      )
    ),

    -- Criterion 6: Governance
    'governance', json_build_object(
      'total_users', (SELECT COUNT(*) FROM users WHERE institution_id = v_inst_id AND is_active = TRUE),
      'roles_breakdown', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('role', role, 'count', cnt)), '[]'::JSONB)
        FROM (
          SELECT role, COUNT(*) as cnt
          FROM users WHERE institution_id = v_inst_id AND is_active = TRUE
          GROUP BY role
        ) r
      )
    ),

    -- Department-wise summary
    'department_wise', (
      SELECT COALESCE(jsonb_agg(row_to_json(dep)), '[]'::JSONB)
      FROM (
        SELECT
          d.name as department_name,
          COUNT(DISTINCT s.id) as students,
          COUNT(DISTINCT CASE WHEN u.role = 'Teacher' THEN u.id END) as teachers,
          ROUND(100.0 * COUNT(a.id) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(a.id), 0), 1) as attendance_pct
        FROM departments d
        LEFT JOIN students s ON s.department_id = d.id AND s.institution_id = v_inst_id AND s.is_active = TRUE
        LEFT JOIN users u ON u.institution_id = v_inst_id AND u.role = 'Teacher' AND u.is_active = TRUE
        LEFT JOIN attendance a ON a.student_id = s.id
        WHERE d.institution_id = v_inst_id
        GROUP BY d.id, d.name
      ) dep
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 3f. System Anomaly Detection
CREATE OR REPLACE FUNCTION detect_system_anomalies()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inst_id UUID;
  v_result JSON;
  v_anomaly_count INT := 0;
BEGIN
  SELECT u.institution_id INTO v_inst_id
  FROM users u WHERE u.id = auth.uid();
  IF v_inst_id IS NULL THEN SELECT id INTO v_inst_id FROM institutions LIMIT 1; END IF;

  -- Detect duplicate attendance (same student, same session, multiple marks)
  INSERT INTO system_anomalies (institution_id, anomaly_type, severity, title, description, module, person_id, person_type, person_name, metadata)
  SELECT
    v_inst_id,
    'duplicate_attendance',
    'high',
    'Duplicate Attendance Detected',
    'Student ' || u.name || ' has ' || COUNT(*) || ' attendance records for the same session on ' || a.date,
    'attendance',
    a.student_id,
    'student',
    u.name,
    jsonb_build_object('date', a.date, 'session_id', a.session_id, 'count', COUNT(*))
  FROM attendance a
  JOIN students s ON s.id = a.student_id
  JOIN users u ON u.id = s.user_id
  WHERE a.institution_id = v_inst_id
    AND a.date >= CURRENT_DATE - 1
  GROUP BY a.student_id, a.session_id, a.date, u.name
  HAVING COUNT(*) > 1
  ON CONFLICT DO NOTHING;

  -- Detect wallet rapid transactions (>3 in 5 minutes)
  INSERT INTO system_anomalies (institution_id, anomaly_type, severity, title, description, module, person_id, person_type, person_name, metadata)
  SELECT
    v_inst_id,
    'rapid_wallet_txn',
    'medium',
    'Rapid Wallet Transactions',
    u.name || ' made ' || COUNT(*) || ' wallet transactions within 5 minutes',
    'wallet',
    wt.student_id,
    'student',
    u.name,
    jsonb_build_object('transaction_count', COUNT(*), 'time_window', '5 minutes', 'total_amount', SUM(wt.amount))
  FROM wallet_transactions wt
  JOIN students s ON s.id = wt.student_id
  JOIN users u ON u.id = s.user_id
  WHERE wt.institution_id = v_inst_id
    AND wt.created_at >= NOW() - INTERVAL '1 hour'
  GROUP BY wt.student_id, u.name, DATE_TRUNC('minute', wt.created_at)
  HAVING COUNT(*) >= 3
  ON CONFLICT DO NOTHING;

  -- Detect unusual hours attendance (marked before 6AM or after 10PM)
  INSERT INTO system_anomalies (institution_id, anomaly_type, severity, title, description, module, person_id, person_type, person_name, metadata)
  SELECT
    v_inst_id,
    'unusual_hours',
    'medium',
    'Attendance Marked at Unusual Hours',
    'Attendance for ' || u.name || ' was marked at ' || TO_CHAR(a.created_at, 'HH24:MI'),
    'attendance',
    a.student_id,
    'student',
    u.name,
    jsonb_build_object('marked_at', a.created_at, 'method', a.method)
  FROM attendance a
  JOIN students s ON s.id = a.student_id
  JOIN users u ON u.id = s.user_id
  WHERE a.institution_id = v_inst_id
    AND a.created_at >= NOW() - INTERVAL '24 hours'
    AND (EXTRACT(HOUR FROM a.created_at) < 6 OR EXTRACT(HOUR FROM a.created_at) > 22)
  ON CONFLICT DO NOTHING;

  -- Detect geo-fence violations (attendance marked >1km from institution)
  INSERT INTO system_anomalies (institution_id, anomaly_type, severity, title, description, module, person_id, person_type, person_name, metadata)
  SELECT
    v_inst_id,
    'geo_fence_violation',
    'high',
    'Attendance Outside Geo-Fence',
    u.name || ' marked attendance from ' || ROUND(a.lat::NUMERIC, 4) || ', ' || ROUND(a.long::NUMERIC, 4),
    'attendance',
    a.student_id,
    'student',
    u.name,
    jsonb_build_object('lat', a.lat, 'long', a.long, 'method', a.method)
  FROM attendance a
  JOIN students s ON s.id = a.student_id
  JOIN users u ON u.id = s.user_id
  WHERE a.institution_id = v_inst_id
    AND a.created_at >= NOW() - INTERVAL '24 hours'
    AND a.lat IS NOT NULL AND a.long IS NOT NULL
    AND (a.lat = 0 OR a.long = 0)
  ON CONFLICT DO NOTHING;

  -- Get unresolved anomaly count
  SELECT COUNT(*) INTO v_anomaly_count
  FROM system_anomalies
  WHERE institution_id = v_inst_id AND NOT is_resolved;

  SELECT json_build_object(
    'total_unresolved', v_anomaly_count,
    'by_type', (
      SELECT COALESCE(jsonb_agg(row_to_json(at)), '[]'::JSONB)
      FROM (
        SELECT anomaly_type, severity, COUNT(*) as count
        FROM system_anomalies
        WHERE institution_id = v_inst_id AND NOT is_resolved
        GROUP BY anomaly_type, severity
        ORDER BY count DESC
      ) at
    ),
    'recent', (
      SELECT COALESCE(jsonb_agg(row_to_json(ra)), '[]'::JSONB)
      FROM (
        SELECT id, anomaly_type, severity, title, description, module, person_name, metadata, created_at
        FROM system_anomalies
        WHERE institution_id = v_inst_id AND NOT is_resolved
        ORDER BY created_at DESC
        LIMIT 20
      ) ra
    ),
    'stats', (
      SELECT json_build_object(
        'total_all_time', COUNT(*),
        'resolved', COUNT(*) FILTER (WHERE is_resolved),
        'critical', COUNT(*) FILTER (WHERE severity = 'critical' AND NOT is_resolved),
        'high', COUNT(*) FILTER (WHERE severity = 'high' AND NOT is_resolved),
        'medium', COUNT(*) FILTER (WHERE severity = 'medium' AND NOT is_resolved),
        'low', COUNT(*) FILTER (WHERE severity = 'low' AND NOT is_resolved)
      )
      FROM system_anomalies WHERE institution_id = v_inst_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 3g. Resolve an anomaly
CREATE OR REPLACE FUNCTION resolve_anomaly(
  p_anomaly_id UUID,
  p_resolution_notes TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE system_anomalies
  SET is_resolved = TRUE,
      resolved_by = auth.uid(),
      resolved_at = NOW(),
      resolution_notes = p_resolution_notes
  WHERE id = p_anomaly_id;

  RETURN json_build_object('success', TRUE);
END;
$$;

-- =========================================================================
-- 4. RLS POLICIES
-- =========================================================================
ALTER TABLE system_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE naac_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Director/Admin can view anomalies"
  ON system_anomalies FOR SELECT
  USING (institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()));

CREATE POLICY "System can insert anomalies"
  ON system_anomalies FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Director/Admin can update anomalies"
  ON system_anomalies FOR UPDATE
  USING (institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Director/Admin can view NAAC snapshots"
  ON naac_snapshots FOR SELECT
  USING (institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Director/Admin can insert NAAC snapshots"
  ON naac_snapshots FOR INSERT
  WITH CHECK (institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()));

-- =========================================================================
-- 5. MATERIALIZED VIEW REFRESH FUNCTION
-- =========================================================================
CREATE OR REPLACE FUNCTION refresh_director_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_attendance_summary;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_fee_summary;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;
