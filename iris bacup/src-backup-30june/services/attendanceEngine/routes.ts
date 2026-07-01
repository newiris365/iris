// ============================================================
// ATTENDANCE ENGINE ROUTES
// ============================================================

import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth';
import {
  validateCheckInEndpoint,
  batchProcessEndpoint,
  studentQueryEndpoint,
  projectionEndpoint,
  getAttendanceAlerts,
} from './controller';

const router = Router();

router.use(authMiddleware);

// ─── SINGLE CHECK-IN VALIDATION ───────────────────────────
router.post('/validate', requireRole(['Student', 'Teacher', 'Staff', 'Admin', 'SuperAdmin']), validateCheckInEndpoint);

// ─── BATCH PROCESSING ──────────────────────────────────────
router.post('/batch', requireRole(['Teacher', 'Staff', 'Admin', 'SuperAdmin']), batchProcessEndpoint);

// ─── STUDENT ATTENDANCE QUERY ──────────────────────────────
router.post('/student-query', requireRole(['Student', 'Teacher', 'Staff', 'Admin', 'SuperAdmin']), studentQueryEndpoint);

// ─── AD-HOC COMPLIANCE PROJECTION ─────────────────────────
router.post('/projection', requireRole(['Student', 'Teacher', 'Staff', 'Admin', 'SuperAdmin']), projectionEndpoint);

// ─── INSTITUTIONAL ALERTS ─────────────────────────────────
router.get('/alerts', requireRole(['Admin', 'SuperAdmin', 'Director', 'Teacher']), getAttendanceAlerts);

export default router;
