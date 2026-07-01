// ============================================================
// ATTENDANCE ENGINE - PUBLIC API
// ============================================================

export { processBatchSession, processStudentQuery, validateCheckIn, resolveConfig, calculateComplianceProjection } from './engine';
export type {
  InstitutionConfig,
  CheckInRequest,
  SessionInput,
  AttendanceRecord,
  StudentAttendanceSummary,
  ComplianceProjection,
  SessionProcessingResult,
  AnomalyFlag,
  BatchInput,
  BatchResult,
  StudentQuery,
  StudentQueryResult,
  AttendanceStatus,
  ComplianceStatus,
  ValidationOutcome,
} from './types';
