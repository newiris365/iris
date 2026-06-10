import { Router } from 'express';
import {
  entryQR,
  entryBiometric,
  entryRfid,
  entryManual,
  getLogs,
  getLiveOccupancy,
  getPersonHistory,
  createVisitor,
  approveVisitor,
  rejectVisitor,
  exitVisitor,
  getVisitorsInside,
  getVisitors,
  registerRfid,
  blockRfid,
  getRfidDetails,
  createIncident,
  getIncidents,
  updateIncidentStatus,
  getBlacklist,
  createBlacklist,
  deleteBlacklist,
  checkBlacklist,
  getDailyReport,
  getPersonMovement,
  getIncidentsReport,
  getOccupantsInside
} from '../controllers/gate';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to protect all endpoints
router.use(authMiddleware);

// --- ENTRY/EXIT CONTROLS ---
router.post('/entry', entryQR);
router.post('/entry/biometric', requireRole(['Security', 'Admin', 'SuperAdmin']), entryBiometric);
router.post('/entry/rfid', entryRfid);
router.post('/entry/manual', requireRole(['Security', 'Admin', 'SuperAdmin']), entryManual);
router.get('/logs', getLogs);
router.get('/occupancy/live', getLiveOccupancy);
router.get('/person/:id/history', getPersonHistory);

// --- VISITOR MANAGEMENT ---
router.post('/visitors', requireRole(['Security', 'Admin', 'SuperAdmin']), createVisitor);
router.post('/visitors/:id/approve', requireRole(['Student', 'Staff', 'Admin', 'SuperAdmin']), approveVisitor);
router.post('/visitors/:id/reject', requireRole(['Student', 'Staff', 'Admin', 'SuperAdmin']), rejectVisitor);
router.post('/visitors/:id/exit', requireRole(['Security', 'Admin', 'SuperAdmin']), exitVisitor);
router.get('/visitors/inside', requireRole(['Security', 'Admin', 'SuperAdmin']), getVisitorsInside);
router.get('/occupants/inside', requireRole(['Security', 'Admin', 'SuperAdmin']), getOccupantsInside);
router.get('/visitors', requireRole(['Security', 'Admin', 'SuperAdmin']), getVisitors);

// --- RFID CARDS REGISTRY ---
router.post('/rfid/register', requireRole(['Admin', 'SuperAdmin']), registerRfid);
router.put('/rfid/:id/block', requireRole(['Security', 'Admin', 'SuperAdmin']), blockRfid);
router.get('/rfid/:cardUid', getRfidDetails);

// --- SECURITY INCIDENTS ---
router.post('/incidents', requireRole(['Security', 'Admin', 'SuperAdmin']), createIncident);
router.get('/incidents', requireRole(['Security', 'Admin', 'SuperAdmin']), getIncidents);
router.put('/incidents/:id/status', requireRole(['Security', 'Admin', 'SuperAdmin']), updateIncidentStatus);

// --- BLACKLIST MANAGEMENT ---
router.get('/blacklist', requireRole(['Security', 'Admin', 'SuperAdmin']), getBlacklist);
router.post('/blacklist', requireRole(['Security', 'Admin', 'SuperAdmin']), createBlacklist);
router.delete('/blacklist/:id', requireRole(['Security', 'Admin', 'SuperAdmin']), deleteBlacklist);
router.post('/blacklist/check', requireRole(['Security', 'Admin', 'SuperAdmin']), checkBlacklist);

// --- REPORT COMPILERS ---
router.get('/reports/daily', requireRole(['Admin', 'SuperAdmin']), getDailyReport);
router.get('/reports/movement/:personId', requireRole(['Admin', 'SuperAdmin']), getPersonMovement);
router.get('/reports/incidents', requireRole(['Admin', 'SuperAdmin']), getIncidentsReport);

export default router;
