// ============================================================
// ATTENDANCE ENGINE TYPE DEFINITIONS
// Core data models for Digiicampus-inspired Attendance Management
// ============================================================

// ─── STATUS TYPES ──────────────────────────────────────────
export type AttendanceStatus = 'P' | 'A' | 'L' | 'E';
export type ComplianceStatus = 'safe' | 'at_risk' | 'critical' | 'defaulted';
export type ValidationOutcome = 'success' | 'grace_period' | 'late_present' | 'absent_rejected' | 'proxy_alert' | 'duplicate_rejected' | 'session_inactive';

// ─── SESSION CONFIGURATION ─────────────────────────────────
export interface InstitutionConfig {
  institution_id: string;
  minimum_attendance_pct: number;          // Default: 75
  grace_period_minutes: number;            // Default: 10
  late_window_minutes: number;             // Default: 20 (11-20 min = late)
  late_present_weight: number;             // Default: 0.5 (partial credit)
  exempt_includes_denominator: boolean;    // Default: true (E counts in both num/denom)
  anti_proxy_enabled: boolean;             // Default: true
  max_geo_accuracy_meters: number;         // Default: 50
  max_device_id_mismatches: number;        // Default: 3 before flag
}

export const DEFAULT_CONFIG: InstitutionConfig = {
  institution_id: '',
  minimum_attendance_pct: 75,
  grace_period_minutes: 10,
  late_window_minutes: 20,
  late_present_weight: 0.5,
  exempt_includes_denominator: true,
  anti_proxy_enabled: true,
  max_geo_accuracy_meters: 50,
  max_device_id_mismatches: 3,
};

// ─── RAW INPUT MODELS ─────────────────────────────────────
export interface CheckInRequest {
  student_id: string;
  session_id: string;
  timestamp: string;                      // ISO 8601
  latitude?: number;
  longitude?: number;
  geo_accuracy_meters?: number;
  device_id?: string;
  method: 'qr' | 'biometric' | 'rfid' | 'manual' | 'gps';
}

export interface SessionInput {
  session_id: string;
  subject: string;
  department_id: string;
  semester: number;
  start_time: string;                     // ISO 8601
  end_time?: string;
  expected_lat?: number;
  expected_lng?: number;
  max_geo_radius_meters?: number;
  is_active: boolean;
  qr_token_hash?: string;
}

export interface StudentRosterEntry {
  student_id: string;
  roll_number: string;
  student_name: string;
  department_id: string;
  semester: number;
}

export interface RawAttendanceRecord {
  student_id: string;
  session_id: string;
  status: AttendanceStatus;
  check_in_time?: string;
  method?: string;
  latitude?: number;
  longitude?: number;
  device_id?: string;
  notes?: string;
}

// ─── PROCESSED OUTPUT MODELS ───────────────────────────────
export interface AttendanceRecord {
  student_id: string;
  session_id: string;
  status: AttendanceStatus;
  effective_weight: number;               // 1.0 for P/E, 0.5 for L, 0 for A
  check_in_time?: string;
  minutes_after_start?: number;
  validation_outcome: ValidationOutcome;
  proxy_flag: boolean;
  proxy_reason?: string;
  method?: string;
}

export interface StudentAttendanceSummary {
  student_id: string;
  roll_number: string;
  student_name: string;
  department_id: string;
  semester: number;
  total_conducted: number;
  total_present: number;
  total_absent: number;
  total_late: number;
  total_exempt: number;
  effective_present: number;              // P(1.0) + L(weight) + E(1.0 or 0)
  effective_denominator: number;          // Conducted + (Exempt if config says so)
  attendance_percentage: number;          // (effective_present / effective_denominator) * 100
  compliance_status: ComplianceStatus;
  classes_to_reach_75: number;            // For at-risk profiles
  safe_to_miss_buffer: number;            // For safe profiles
  session_history: AttendanceRecord[];
}

export interface ComplianceProjection {
  current_pct: number;
  target_pct: number;
  compliance_status: ComplianceStatus;
  classes_needed_to_reach_target: number | null;
  safe_to_miss_buffer: number | null;
  deficit_count: number;                  // How many classes below target
  worst_case_pct_if_all_present: number;
  best_case_pct_if_all_missed: number;
}

export interface SessionProcessingResult {
  session_id: string;
  subject: string;
  total_students: number;
  processed: number;
  accepted: number;
  rejected_late: number;
  rejected_proxy: number;
  rejected_duplicate: number;
  late_present: number;
  exempt: number;
  records: AttendanceRecord[];
  anomalies: AnomalyFlag[];
}

export interface AnomalyFlag {
  type: 'late_spike' | 'proxy_attempt' | 'device_mismatch' | 'geo_violation' | 'pattern_change' | 'mass_late';
  severity: 'low' | 'medium' | 'high' | 'critical';
  student_id?: string;
  session_id?: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ─── BATCH PROCESSING ──────────────────────────────────────
export interface BatchInput {
  institution_id: string;
  session: SessionInput;
  roster: StudentRosterEntry[];
  check_ins: CheckInRequest[];
  config?: Partial<InstitutionConfig>;
}

export interface BatchResult {
  execution_status: 'success' | 'partial_success' | 'validation_failed';
  failure_reason?: string;
  attendance_summary_data: {
    session_id: string;
    subject: string;
    total_students: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    exempt_count: number;
    attendance_pct: number;
  };
  compliance_projections: ComplianceProjection[];
  flagged_anomalies: AnomalyFlag[];
  records: AttendanceRecord[];
  processing_time_ms: number;
}

// ─── QUERY INPUTS ──────────────────────────────────────────
export interface StudentQuery {
  student_id: string;
  institution_id: string;
  department_id?: string;
  semester?: number;
  subject?: string;
  date_from?: string;
  date_to?: string;
}

export interface StudentQueryResult {
  execution_status: 'success' | 'validation_failed';
  failure_reason?: string;
  attendance_summary_data: StudentAttendanceSummary;
  compliance_projection: ComplianceProjection;
  flagged_anomalies: AnomalyFlag[];
}

// ─── ALERT SYSTEM ──────────────────────────────────────────
export interface AttendanceAlert {
  alert_id: string;
  student_id: string;
  institution_id: string;
  alert_type: 'warning_80' | 'critical_75' | 'defaulted_60' | 'proxy_alert' | 'pattern_anomaly';
  current_pct: number;
  classes_to_reach_75: number;
  subject_wise_breakdown?: { subject: string; pct: number }[];
  message: string;
  created_at: string;
  sent_via: ('in_app' | 'whatsapp' | 'email' | 'sms')[];
}
