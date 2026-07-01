// ============================================================
// CORE ATTENDANCE PROCESSING ENGINE
// Deterministic processing against institutional compliance rules
// ============================================================

import {
  InstitutionConfig,
  DEFAULT_CONFIG,
  CheckInRequest,
  SessionInput,
  AttendanceRecord,
  AttendanceStatus,
  ValidationOutcome,
  StudentAttendanceSummary,
  ComplianceProjection,
  SessionProcessingResult,
  AnomalyFlag,
  BatchInput,
  BatchResult,
  StudentQuery,
  StudentQueryResult,
  StudentRosterEntry,
} from './types';

// ─── DISTANCE CALCULATION (Haversine) ──────────────────────
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── TIME DIFFERENCE CALCULATOR ────────────────────────────
function minutesBetween(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 60000;
}

// ─── CONFIG RESOLVER ───────────────────────────────────────
export function resolveConfig(partial?: Partial<InstitutionConfig>): InstitutionConfig {
  return { ...DEFAULT_CONFIG, ...partial };
}

// ============================================================
// 1. SINGLE CHECK-IN VALIDATOR
// Enforces grace period, late window, absent threshold, anti-proxy
// ============================================================
export function validateCheckIn(
  request: CheckInRequest,
  session: SessionInput,
  config: InstitutionConfig,
  previousDeviceIds: Set<string> = new Set()
): { record: AttendanceRecord; anomaly?: AnomalyFlag } {
  const now = new Date(request.timestamp);
  const sessionStart = new Date(session.start_time);
  const minutesAfterStart = minutesBetween(session.start_time, request.timestamp);

  // ── SESSION INACTIVE CHECK ──────────────────────────────
  if (!session.is_active) {
    return {
      record: {
        student_id: request.student_id,
        session_id: request.session_id,
        status: 'A',
        effective_weight: 0,
        validation_outcome: 'session_inactive',
        proxy_flag: false,
        check_in_time: request.timestamp,
        minutes_after_start: minutesAfterStart,
        method: request.method,
      },
    };
  }

  // ── ANTI-PROXY: GEO VALIDATION ─────────────────────────
  if (config.anti_proxy_enabled && session.expected_lat != null && session.expected_lng != null && request.latitude != null && request.longitude != null) {
    const distance = haversineDistance(request.latitude, request.longitude, session.expected_lat, session.expected_lng);
    const maxRadius = session.max_geo_radius_meters || config.max_geo_accuracy_meters;

    if (distance > maxRadius) {
      return {
        record: {
          student_id: request.student_id,
          session_id: request.session_id,
          status: 'A',
          effective_weight: 0,
          validation_outcome: 'proxy_alert',
          proxy_flag: true,
          proxy_reason: `Geo-coordinates outside allowed radius. Distance: ${Math.round(distance)}m, Max: ${maxRadius}m`,
          check_in_time: request.timestamp,
          minutes_after_start: minutesAfterStart,
          method: request.method,
        },
        anomaly: {
          type: 'geo_violation',
          severity: 'high',
          student_id: request.student_id,
          session_id: request.session_id,
          description: `Proxy attempt detected. Student at ${distance.toFixed(0)}m from session venue.`,
          timestamp: request.timestamp,
          metadata: { distance, maxRadius, lat: request.latitude, lng: request.longitude },
        },
      };
    }
  }

  // ── ANTI-PROXY: DEVICE MISMATCH ────────────────────────
  if (config.anti_proxy_enabled && request.device_id && previousDeviceIds.size > 0) {
    if (!previousDeviceIds.has(request.device_id)) {
      if (previousDeviceIds.size >= config.max_device_id_mismatches) {
        return {
          record: {
            student_id: request.student_id,
            session_id: request.session_id,
            status: 'A',
            effective_weight: 0,
            validation_outcome: 'proxy_alert',
            proxy_flag: true,
            proxy_reason: `Device ID mismatch. Previous devices: ${previousDeviceIds.size}, Current: unknown`,
            check_in_time: request.timestamp,
            minutes_after_start: minutesAfterStart,
            method: request.method,
          },
          anomaly: {
            type: 'device_mismatch',
            severity: 'critical',
            student_id: request.student_id,
            session_id: request.session_id,
            description: `Repeated device changes detected (${previousDeviceIds.size} different devices). Potential proxy.`,
            timestamp: request.timestamp,
            metadata: { device_count: previousDeviceIds.size, current_device: request.device_id },
          },
        };
      }
      // Log as low severity but allow
    }
  }

  // ── GRACE PERIOD: 0–10 minutes → PRESENT ───────────────
  if (minutesAfterStart <= config.grace_period_minutes) {
    return {
      record: {
        student_id: request.student_id,
        session_id: request.session_id,
        status: 'P',
        effective_weight: 1.0,
        validation_outcome: 'grace_period',
        proxy_flag: false,
        check_in_time: request.timestamp,
        minutes_after_start: minutesAfterStart,
        method: request.method,
      },
    };
  }

  // ── LATE WINDOW: 11–20 minutes → LATE PRESENT ─────────
  if (minutesAfterStart <= config.late_window_minutes) {
    return {
      record: {
        student_id: request.student_id,
        session_id: request.session_id,
        status: 'L',
        effective_weight: config.late_present_weight,
        validation_outcome: 'late_present',
        proxy_flag: false,
        check_in_time: request.timestamp,
        minutes_after_start: minutesAfterStart,
        method: request.method,
      },
    };
  }

  // ── ABSENT THRESHOLD: >20 minutes → REJECTED ───────────
  return {
    record: {
      student_id: request.student_id,
      session_id: request.session_id,
      status: 'A',
      effective_weight: 0,
      validation_outcome: 'absent_rejected',
      proxy_flag: false,
      check_in_time: request.timestamp,
      minutes_after_start: minutesAfterStart,
      method: request.method,
    },
  };
}

// ============================================================
// 2. ATTENDANCE PERCENTAGE CALCULATOR
// Implements: (Total Present + Total Exempt) / Total Conducted * 100
// ============================================================
export function calculateAttendancePercentage(
  totalPresent: number,
  totalAbsent: number,
  totalLate: number,
  totalExempt: number,
  config: InstitutionConfig
): {
  effective_present: number;
  effective_denominator: number;
  percentage: number;
} {
  // Effective present = P(1.0) + L(late_weight) + E(1.0 if exempt counts)
  const effectivePresent = totalPresent + (totalLate * config.late_present_weight) + (config.exempt_includes_denominator ? totalExempt : 0);

  // Denominator = conducted(P+A+L) + (Exempt if config says include in both)
  const effectiveDenominator = totalPresent + totalAbsent + totalLate + (config.exempt_includes_denominator ? totalExempt : 0);

  const percentage = effectiveDenominator > 0 ? (effectivePresent / effectiveDenominator) * 100 : 0;

  return {
    effective_present: effectivePresent,
    effective_denominator: effectiveDenominator,
    percentage: Math.round(percentage * 100) / 100,
  };
}

// ============================================================
// 3. COMPLIANCE PROJECTION CALCULATOR
// For at-risk: classes needed to reach 75%
// For safe: buffer before falling to 74.9%
// ============================================================
export function calculateComplianceProjection(
  effectivePresent: number,
  effectiveDenominator: number,
  config: InstitutionConfig
): ComplianceProjection {
  const currentPct = effectiveDenominator > 0 ? (effectivePresent / effectiveDenominator) * 100 : 0;
  const targetPct = config.minimum_attendance_pct;

  // Classes needed to reach target (ceiling to ensure >= target)
  const classesNeeded = currentPct < targetPct
    ? Math.ceil((targetPct * effectiveDenominator - 100 * effectivePresent) / (100 - targetPct))
    : null;

  // Safe to miss buffer (floor to ensure staying >= target)
  const safeToMiss = currentPct >= targetPct
    ? Math.floor((100 * effectivePresent - targetPct * effectiveDenominator) / targetPct)
    : null;

  const deficit = classesNeeded !== null ? Math.abs(classesNeeded) : 0;
  const worstCase = effectiveDenominator > 0 ? ((effectivePresent + (effectiveDenominator * 0)) / (effectiveDenominator + effectiveDenominator)) * 100 : 0;
  const bestCase = effectiveDenominator > 0 ? ((effectivePresent + effectiveDenominator) / (effectiveDenominator + effectiveDenominator)) * 100 : 100;

  let complianceStatus: 'safe' | 'at_risk' | 'critical' | 'defaulted';
  if (currentPct >= targetPct) complianceStatus = 'safe';
  else if (currentPct >= 60) complianceStatus = 'at_risk';
  else if (currentPct >= 40) complianceStatus = 'critical';
  else complianceStatus = 'defaulted';

  return {
    current_pct: Math.round(currentPct * 100) / 100,
    target_pct: targetPct,
    compliance_status: complianceStatus,
    classes_needed_to_reach_target: classesNeeded,
    safe_to_miss_buffer: safeToMiss,
    deficit_count: deficit,
    worst_case_pct_if_all_present: Math.round(worstCase * 100) / 100,
    best_case_pct_if_all_missed: Math.round(bestCase * 100) / 100,
  };
}

// ============================================================
// 4. ANOMALY DETECTOR
// Identifies late spikes, pattern changes, mass late events
// ============================================================
export function detectAnomalies(
  records: AttendanceRecord[],
  session: SessionInput,
  historicalLateRate: number = 0.1
): AnomalyFlag[] {
  const anomalies: AnomalyFlag[] = [];
  const now = new Date().toISOString();

  const lateRecords = records.filter(r => r.status === 'L');
  const proxyRecords = records.filter(r => r.proxy_flag);

  // Mass late detection: >30% of class arriving late
  if (records.length > 5 && lateRecords.length / records.length > 0.3) {
    anomalies.push({
      type: 'mass_late',
      severity: 'medium',
      session_id: session.session_id,
      description: `Mass late event: ${lateRecords.length}/${records.length} students (${Math.round((lateRecords.length / records.length) * 100)}%) arrived late.`,
      timestamp: now,
      metadata: { late_count: lateRecords.length, total: records.length },
    });
  }

  // Proxy attempts
  proxyRecords.forEach(r => {
    anomalies.push({
      type: 'proxy_attempt',
      severity: 'critical',
      student_id: r.student_id,
      session_id: session.session_id,
      description: `Proxy attempt blocked: ${r.proxy_reason}`,
      timestamp: now,
    });
  });

  // Late spike per student (if a student is late >3 times in recent sessions)
  const studentLateCount: Record<string, number> = {};
  lateRecords.forEach(r => {
    studentLateCount[r.student_id] = (studentLateCount[r.student_id] || 0) + 1;
  });

  Object.entries(studentLateCount).forEach(([studentId, count]) => {
    if (count > 3) {
      anomalies.push({
        type: 'late_spike',
        severity: 'low',
        student_id: studentId,
        session_id: session.session_id,
        description: `Student has ${count} late entries in recent sessions.`,
        timestamp: now,
        metadata: { late_count: count },
      });
    }
  });

  return anomalies;
}

// ============================================================
// 5. BATCH PROCESSOR
// Processes an entire class session in one call
// ============================================================
export function processBatchSession(input: BatchInput): BatchResult {
  const startTime = Date.now();
  const config = resolveConfig(input.config);

  const result: BatchResult = {
    execution_status: 'success',
    attendance_summary_data: {
      session_id: input.session.session_id,
      subject: input.session.subject,
      total_students: input.roster.length,
      present_count: 0,
      absent_count: 0,
      late_count: 0,
      exempt_count: 0,
      attendance_pct: 0,
    },
    compliance_projections: [],
    flagged_anomalies: [],
    records: [],
    processing_time_ms: 0,
  };

  // Build check-in map (latest per student)
  const checkInMap: Record<string, CheckInRequest> = {};
  input.check_ins.forEach(ci => {
    const existing = checkInMap[ci.student_id];
    if (!existing || new Date(ci.timestamp) > new Date(existing.timestamp)) {
      checkInMap[ci.student_id] = ci;
    }
  });

  // Track device IDs per student for anti-proxy
  const deviceHistory: Record<string, Set<string>> = {};

  // Process each student on roster
  for (const student of input.roster) {
    const checkIn = checkInMap[student.student_id];

    if (!checkIn) {
      // No check-in → ABSENT
      result.records.push({
        student_id: student.student_id,
        session_id: input.session.session_id,
        status: 'A',
        effective_weight: 0,
        validation_outcome: 'absent_rejected',
        proxy_flag: false,
        check_in_time: undefined,
        minutes_after_start: undefined,
      });
      result.attendance_summary_data.absent_count++;
      continue;
    }

    // Build device history for anti-proxy
    if (!deviceHistory[student.student_id]) {
      deviceHistory[student.student_id] = new Set();
    }
    if (checkIn.device_id) {
      deviceHistory[student.student_id].add(checkIn.device_id);
    }

    const { record, anomaly } = validateCheckIn(checkIn, input.session, config, deviceHistory[student.student_id]);

    result.records.push(record);

    // Count by status
    switch (record.status) {
      case 'P': result.attendance_summary_data.present_count++; break;
      case 'L': result.attendance_summary_data.late_count++; break;
      case 'E': result.attendance_summary_data.exempt_count++; break;
      case 'A': result.attendance_summary_data.absent_count++; break;
    }

    if (anomaly) result.flagged_anomalies.push(anomaly);
  }

  // Calculate attendance percentage
  const { percentage } = calculateAttendancePercentage(
    result.attendance_summary_data.present_count,
    result.attendance_summary_data.absent_count,
    result.attendance_summary_data.late_count,
    result.attendance_summary_data.exempt_count,
    config
  );
  result.attendance_summary_data.attendance_pct = percentage;

  // Generate per-student compliance projections
  for (const student of input.roster) {
    const studentRecords = result.records.filter(r => r.student_id === student.student_id);
    const present = studentRecords.filter(r => r.status === 'P').length;
    const absent = studentRecords.filter(r => r.status === 'A').length;
    const late = studentRecords.filter(r => r.status === 'L').length;
    const exempt = studentRecords.filter(r => r.status === 'E').length;

    const { effective_present, effective_denominator } = calculateAttendancePercentage(present, absent, late, exempt, config);
    const projection = calculateComplianceProjection(effective_present, effective_denominator, config);

    result.compliance_projections.push(projection);
  }

  // Detect anomalies across the session
  const sessionAnomalies = detectAnomalies(result.records, input.session);
  result.flagged_anomalies.push(...sessionAnomalies);

  result.processing_time_ms = Date.now() - startTime;
  return result;
}

// ============================================================
// 6. STUDENT QUERY PROCESSOR
// Returns full attendance profile for a student
// ============================================================
export function processStudentQuery(
  studentId: string,
  allRecords: AttendanceRecord[],
  config: InstitutionConfig,
  studentInfo: { roll_number: string; student_name: string; department_id: string; semester: number }
): StudentQueryResult {
  const studentRecords = allRecords.filter(r => r.student_id === studentId);

  if (studentRecords.length === 0) {
    return {
      execution_status: 'validation_failed',
      failure_reason: 'No attendance records found for this student.',
      attendance_summary_data: {
        student_id: studentId,
        ...studentInfo,
        total_conducted: 0,
        total_present: 0,
        total_absent: 0,
        total_late: 0,
        total_exempt: 0,
        effective_present: 0,
        effective_denominator: 0,
        attendance_percentage: 0,
        compliance_status: 'safe',
        classes_to_reach_75: 0,
        safe_to_miss_buffer: 0,
        session_history: [],
      },
      compliance_projection: {
        current_pct: 0,
        target_pct: config.minimum_attendance_pct,
        compliance_status: 'safe',
        classes_needed_to_reach_target: null,
        safe_to_miss_buffer: null,
        deficit_count: 0,
        worst_case_pct_if_all_present: 0,
        best_case_pct_if_all_missed: 0,
      },
      flagged_anomalies: [],
    };
  }

  const totalPresent = studentRecords.filter(r => r.status === 'P').length;
  const totalAbsent = studentRecords.filter(r => r.status === 'A').length;
  const totalLate = studentRecords.filter(r => r.status === 'L').length;
  const totalExempt = studentRecords.filter(r => r.status === 'E').length;

  const { effective_present, effective_denominator, percentage } = calculateAttendancePercentage(
    totalPresent, totalAbsent, totalLate, totalExempt, config
  );

  const projection = calculateComplianceProjection(effective_present, effective_denominator, config);

  // Build summary
  const summary: StudentAttendanceSummary = {
    student_id: studentId,
    ...studentInfo,
    total_conducted: totalPresent + totalAbsent + totalLate,
    total_present: totalPresent,
    total_absent: totalAbsent,
    total_late: totalLate,
    total_exempt: totalExempt,
    effective_present: effective_present,
    effective_denominator: effective_denominator,
    attendance_percentage: percentage,
    compliance_status: projection.compliance_status,
    classes_to_reach_75: projection.classes_needed_to_reach_target || 0,
    safe_to_miss_buffer: projection.safe_to_miss_buffer || 0,
    session_history: studentRecords,
  };

  // Detect per-student anomalies
  const anomalies: AnomalyFlag[] = [];
  const proxyAttempts = studentRecords.filter(r => r.proxy_flag);
  if (proxyAttempts.length > 0) {
    anomalies.push({
      type: 'proxy_attempt',
      severity: 'critical',
      student_id: studentId,
      description: `${proxyAttempts.length} proxy attempt(s) detected in history.`,
      timestamp: new Date().toISOString(),
    });
  }

  const recentLate = studentRecords.slice(-10).filter(r => r.status === 'L').length;
  if (recentLate >= 3) {
    anomalies.push({
      type: 'late_spike',
      severity: 'medium',
      student_id: studentId,
      description: `Late ${recentLate} of last 10 sessions. Pattern anomaly.`,
      timestamp: new Date().toISOString(),
      metadata: { recent_late_count: recentLate },
    });
  }

  return {
    execution_status: 'success',
    attendance_summary_data: summary,
    compliance_projection: projection,
    flagged_anomalies: anomalies,
  };
}
