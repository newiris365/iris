// ============================================================
// ATTENDANCE ENGINE API CONTROLLER
// HTTP endpoints for attendance processing engine
// ============================================================

import { Request, Response } from 'express';
import { z } from 'zod';
// @ts-nocheck
import { supabaseAdmin } from '../../config/supabase';
import {
  processBatchSession,
  processStudentQuery,
  validateCheckIn,
  resolveConfig,
  calculateComplianceProjection,
} from './engine';
import {
  BatchInput,
  CheckInRequest,
  SessionInput,
  InstitutionConfig,
  StudentQuery,
} from './types';

// ─── ZOD SCHEMAS ───────────────────────────────────────────
const checkInSchema = z.object({
  student_id: z.string().uuid(),
  session_id: z.string().uuid(),
  timestamp: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  geo_accuracy_meters: z.number().optional(),
  device_id: z.string().optional(),
  method: z.enum(['qr', 'biometric', 'rfid', 'manual', 'gps']),
});

const batchSchema = z.object({
  institution_id: z.string().uuid(),
  session: z.object({
    session_id: z.string().uuid(),
    subject: z.string(),
    department_id: z.string().uuid(),
    semester: z.number().int().positive(),
    start_time: z.string(),
    end_time: z.string().optional(),
    expected_lat: z.number().optional(),
    expected_lng: z.number().optional(),
    max_geo_radius_meters: z.number().optional(),
    is_active: z.boolean(),
    qr_token_hash: z.string().optional(),
  }),
  roster: z.array(z.object({
    student_id: z.string().uuid(),
    roll_number: z.string(),
    student_name: z.string(),
    department_id: z.string().uuid(),
    semester: z.number().int().positive(),
  })),
  check_ins: z.array(z.object({
    student_id: z.string().uuid(),
    session_id: z.string().uuid(),
    timestamp: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    geo_accuracy_meters: z.number().optional(),
    device_id: z.string().optional(),
    method: z.enum(['qr', 'biometric', 'rfid', 'manual', 'gps']),
  })),
  config: z.object({
    minimum_attendance_pct: z.number().optional(),
    grace_period_minutes: z.number().optional(),
    late_window_minutes: z.number().optional(),
    late_present_weight: z.number().optional(),
    exempt_includes_denominator: z.boolean().optional(),
    anti_proxy_enabled: z.boolean().optional(),
    max_geo_accuracy_meters: z.number().optional(),
  }).optional(),
});

const studentQuerySchema = z.object({
  student_id: z.string().uuid(),
  department_id: z.string().uuid().optional(),
  semester: z.number().int().positive().optional(),
  subject: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

// ============================================================
// 1. VALIDATE SINGLE CHECK-IN
// POST /api/v1/attendance-engine/validate
// ============================================================
export async function validateCheckInEndpoint(req: Request, res: Response) {
  try {
    const parse = checkInSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        execution_status: 'validation_failed',
        failure_reason: parse.error.errors[0].message,
      });
    }

    const { data: session, error: sessionErr } = await supabaseAdmin
      .from('attendance_sessions')
      .select('*')
      .eq('id', parse.data.session_id)
      .maybeSingle();

    if (sessionErr || !session) {
      return res.status(404).json({
        execution_status: 'validation_failed',
        failure_reason: 'Session not found.',
      });
    }

    const sessionInput: SessionInput = {
      session_id: session.id,
      subject: session.subject,
      department_id: session.department_id,
      semester: session.semester || 1,
      start_time: session.start_time || session.created_at,
      end_time: session.end_time,
      expected_lat: session.latitude,
      expected_lng: session.longitude,
      max_geo_radius_meters: session.max_radius_meters,
      is_active: session.is_active,
      qr_token_hash: session.qr_token_hash,
    };

    const { data: institutionConfig } = await supabaseAdmin
      .from('attendance_methods')
      .select('config')
      .eq('institution_id', session.institution_id)
      .eq('method_key', parse.data.method)
      .maybeSingle();

    const config = resolveConfig({
      ...(institutionConfig?.config || {}),
      institution_id: session.institution_id,
    });

    // Get device history for anti-proxy
    const { data: prevLogs } = await supabaseAdmin
      .from('attendance')
      .select('device_id')
      .eq('student_id', parse.data.student_id)
      .not('device_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    const deviceHistory = new Set((prevLogs || []).map((l: any) => l.device_id).filter(Boolean));

    const { record, anomaly } = validateCheckIn(parse.data, sessionInput, config, deviceHistory);

    return res.status(200).json({
      execution_status: record.validation_outcome === 'proxy_alert' ? 'validation_failed' : 'success',
      failure_reason: record.proxy_flag ? record.proxy_reason : undefined,
      record,
      anomaly,
    });
  } catch (err: any) {
    return res.status(500).json({
      execution_status: 'validation_failed',
      failure_reason: err.message,
    });
  }
}

// ============================================================
// 2. BATCH PROCESS SESSION
// POST /api/v1/attendance-engine/batch
// ============================================================
export async function batchProcessEndpoint(req: Request, res: Response) {
  try {
    const parse = batchSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        execution_status: 'validation_failed',
        failure_reason: parse.error.errors[0].message,
      });
    }

    const input: BatchInput = {
      institution_id: parse.data.institution_id,
      session: parse.data.session,
      roster: parse.data.roster,
      check_ins: parse.data.check_ins,
      config: parse.data.config,
    };

    const result = processBatchSession(input);

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      execution_status: 'validation_failed',
      failure_reason: err.message,
    });
  }
}

// ============================================================
// 3. STUDENT ATTENDANCE QUERY
// POST /api/v1/attendance-engine/student-query
// ============================================================
export async function studentQueryEndpoint(req: Request, res: Response) {
  try {
    const parse = studentQuerySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        execution_status: 'validation_failed',
        failure_reason: parse.error.errors[0].message,
      });
    }

    const { data: student, error: studentErr } = await supabaseAdmin
      .from('students')
      .select('id, roll_number, department_id, semester, users(full_name)')
      .eq('id', parse.data.student_id)
      .maybeSingle();

    if (studentErr || !student) {
      return res.status(404).json({
        execution_status: 'validation_failed',
        failure_reason: 'Student not found.',
      });
    }

    // Fetch attendance records
    let query = supabaseAdmin
      .from('attendance')
      .select('*, attendance_sessions(subject, department_id, semester)')
      .eq('student_id', parse.data.student_id);

    if (parse.data.department_id) {
      query = query.eq('attendance_sessions.department_id', parse.data.department_id);
    }
    if (parse.data.date_from) {
      query = query.gte('created_at', parse.data.date_from);
    }
    if (parse.data.date_to) {
      query = query.lte('created_at', parse.data.date_to);
    }

    const { data: rawRecords, error: recordsErr } = await query;
    if (recordsErr) throw recordsErr;

    // Transform raw DB records into AttendanceRecord format
    const records = (rawRecords || []).map((r: any) => ({
      student_id: r.student_id,
      session_id: r.session_id,
      status: r.status,
      effective_weight: r.status === 'P' ? 1.0 : r.status === 'L' ? 0.5 : r.status === 'E' ? 1.0 : 0,
      check_in_time: r.check_in_time,
      minutes_after_start: r.minutes_after_start,
      validation_outcome: r.method || 'manual',
      proxy_flag: false,
      method: r.method,
    }));

    const { data: configData } = await supabaseAdmin
      .from('attendance_methods')
      .select('config')
      .eq('institution_id', student.department_id)
      .maybeSingle();

    const config = resolveConfig(configData?.config || {});

    const result = processStudentQuery(
      parse.data.student_id,
      records,
      config,
      {
        roll_number: student.roll_number,
        student_name: (student as any).users?.full_name || '',
        department_id: student.department_id,
        semester: student.semester,
      }
    );

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      execution_status: 'validation_failed',
      failure_reason: err.message,
    });
  }
}

// ============================================================
// 4. COMPLIANCE PROJECTION (AD-HOC CALC)
// POST /api/v1/attendance-engine/projection
// ============================================================
export async function projectionEndpoint(req: Request, res: Response) {
  try {
    const { present, absent, late, exempt, config: cfg } = req.body;

    if (present == null || absent == null) {
      return res.status(400).json({
        execution_status: 'validation_failed',
        failure_reason: 'present and absent counts required.',
      });
    }

    const config = resolveConfig(cfg || {});
    const effectivePresent = present + (late || 0) * config.late_present_weight + (config.exempt_includes_denominator ? (exempt || 0) : 0);
    const effectiveDenominator = present + (absent || 0) + (late || 0) + (config.exempt_includes_denominator ? (exempt || 0) : 0);

    const projection = calculateComplianceProjection(effectivePresent, effectiveDenominator, config);

    return res.status(200).json({
      execution_status: 'success',
      attendance_summary_data: {
        total_present: present,
        total_absent: absent,
        total_late: late || 0,
        total_exempt: exempt || 0,
        effective_present: effectivePresent,
        effective_denominator: effectiveDenominator,
        attendance_pct: projection.current_pct,
      },
      compliance_projection: projection,
    });
  } catch (err: any) {
    return res.status(500).json({
      execution_status: 'validation_failed',
      failure_reason: err.message,
    });
  }
}

// ============================================================
// 5. INSTITUTIONAL ALERTS
// GET /api/v1/attendance-engine/alerts
// ============================================================
export async function getAttendanceAlerts(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    const { department_id, semester, threshold } = req.query;

    const minThreshold = Number(threshold) || 75;

    let studentQuery = supabaseAdmin
      .from('students')
      .select('id, roll_number, department_id, semester, users(full_name)')
      .eq('institution_id', institutionId);

    if (department_id) studentQuery = studentQuery.eq('department_id', department_id);
    if (semester) studentQuery = studentQuery.eq('semester', Number(semester));

    const { data: students } = await studentQuery;
    if (!students || students.length === 0) {
      return res.status(200).json({ success: true, alerts: [] });
    }

    const studentIds = students.map((s: any) => s.id);

    // Fetch attendance records for all students
    const { data: records } = await supabaseAdmin
      .from('attendance')
      .select('student_id, status')
      .in('student_id', studentIds);

    const alerts: any[] = [];

    for (const student of students) {
      const studentRecords = (records || []).filter((r: any) => r.student_id === student.id);
      const present = studentRecords.filter((r: any) => r.status === 'P').length;
      const absent = studentRecords.filter((r: any) => r.status === 'A').length;
      const late = studentRecords.filter((r: any) => r.status === 'L').length;
      const exempt = studentRecords.filter((r: any) => r.status === 'E').length;

      const effectivePresent = present + late * 0.5 + exempt;
      const effectiveDenominator = present + absent + late + exempt;
      const pct = effectiveDenominator > 0 ? (effectivePresent / effectiveDenominator) * 100 : 100;

      if (pct < minThreshold) {
        const classesNeeded = Math.ceil((minThreshold * effectiveDenominator - 100 * effectivePresent) / (100 - minThreshold));
        const studentName = (student as any).users?.full_name || student.roll_number;
        alerts.push({
          student_id: student.id,
          roll_number: student.roll_number,
          student_name: studentName,
          department_id: student.department_id,
          semester: student.semester,
          current_pct: Math.round(pct * 100) / 100,
          compliance_status: pct >= 60 ? 'at_risk' : 'critical',
          classes_to_reach_75: classesNeeded,
          message: pct >= 60
            ? `At risk: ${studentName} at ${pct.toFixed(1)}%. Needs ${classesNeeded} consecutive present(s) to reach 75%.`
            : `Critical: ${studentName} at ${pct.toFixed(1)}%. Immediate intervention required.`,
        });
      }
    }

    return res.status(200).json({
      success: true,
      total_students: students.length,
      flagged_count: alerts.length,
      threshold: minThreshold,
      alerts: alerts.sort((a: any, b: any) => a.current_pct - b.current_pct),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
