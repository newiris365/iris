import { Router } from 'express';
import {
  listBlocks,
  listRooms,
  createBlock,
  createRoom,
  listAllocations,
  allocateRoom,
  vacateRoom,
  requestRoomSwap,
  registerVisitor,
  approveVisitor,
  checkoutVisitor,
  checkinVisitor,
  listVisitors,
  listInsideVisitors,
  listComplaints,
  raiseComplaint,
  assignComplaint,
  updateComplaintStatus,
  rateComplaintResolution,
  applyLeave,
  listStudentLeaves,
  listAllLeaves,
  approveLeave,
  listFees,
  payHostelFee,
  listFeeDefaulters,
  getDashboardOverview,
  listNotices,
  createNotice,
  generateGatePassPdf,
  generateAllotmentLetterPdf,
  saveRoommatePreferences,
  getCompatibilityScores,
  getMatchMatrix,
  logIotReading,
  getIotTrends,
  getIotMonthlyReport,
  getComplaintPredictions,
  getEquipmentLifecycle,
  startRollCall,
  confirmRollCall,
  getRollCallStatus,
  logWellnessCheckin,
  getWellnessTrends,
  getWellnessAlerts,
  getNightlyHeadcount,
  getNightlyHeadcountAlerts,
  getHostelSettings,
  saveHostelSettings,
  markHostelAttendance,
  getDailyHostelAttendance,
  getLatestMessNotice,
  broadcastMessNotice,
  getOverview
} from '../controllers/hostel';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Protect all routes
router.use(authMiddleware);

// ========== 0. OVERVIEW ==========
router.get('/overview', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), getOverview);

// ========== 1. ROOMS & BLOCKS ==========
router.get('/blocks', listBlocks);
router.get('/rooms', listRooms);
router.post('/blocks', requireRole(['Admin', 'SuperAdmin']), createBlock);
router.post('/rooms', requireRole(['Admin', 'SuperAdmin']), createRoom);

// ========== 2. ROOM ALLOCATIONS ==========
router.get('/allocations', listAllocations);
router.post('/allocations', requireRole(['Admin', 'SuperAdmin', 'Warden', 'Staff']), allocateRoom);
router.put('/allocations/:id/vacate', requireRole(['Admin', 'SuperAdmin', 'Warden', 'Staff']), vacateRoom);
router.post('/allocations/:id/swap-request', requireRole(['Student', 'Warden', 'Staff', 'Admin']), requestRoomSwap);

// ========== 3. VISITOR MANAGEMENT ==========
router.post('/visitors', requireRole(['Student', 'Security', 'Staff', 'Warden', 'Admin']), registerVisitor);
router.post('/visitors/:id/approve', requireRole(['Student', 'Warden', 'Staff', 'Admin']), approveVisitor);
router.post('/visitors/:id/checkout', requireRole(['Security', 'Staff', 'Warden', 'Admin']), checkoutVisitor);
router.post('/visitors/:id/checkin', requireRole(['Security', 'Staff', 'Warden', 'Admin']), checkinVisitor);
router.get('/visitors', listVisitors);
router.get('/visitors/inside', listInsideVisitors);

// ========== 4. COMPLAINTS ==========
router.get('/complaints', listComplaints);
router.post('/complaints', raiseComplaint);
router.put('/complaints/:id/assign', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), assignComplaint);
router.put('/complaints/:id/status', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), updateComplaintStatus);
router.post('/complaints/:id/rate', requireRole(['Student']), rateComplaintResolution);

// ========== 5. LEAVE REQUESTS ==========
router.post('/leaves', requireRole(['Student']), applyLeave);
router.get('/leaves/student/:studentId', listStudentLeaves);
router.get('/leaves', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), listAllLeaves);
router.put('/leaves/:id/approve', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), approveLeave);

// ========== 6. HOSTEL FEES ==========
router.get('/fees', listFees);
router.post('/fees/pay', requireRole(['Student']), payHostelFee);
router.get('/fees/defaulters', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), listFeeDefaulters);

// ========== 7. OVERVIEW & NOTICES ==========
router.get('/overview', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), getDashboardOverview);
router.get('/notices', listNotices);
router.post('/notices', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), createNotice);

// ========== 8. PDF RENDERERS ==========
router.get('/visitors/:visitorId/report/pdf', generateGatePassPdf);
router.get('/allocations/:allocationId/report/pdf', generateAllotmentLetterPdf);

// ========== 9. SMART ROOMMATE MATCHING ==========
router.post('/preferences', requireRole(['Student', 'Warden', 'Staff', 'Admin', 'SuperAdmin']), saveRoommatePreferences);
router.get('/preferences/compatibility/:studentId', requireRole(['Student', 'Warden', 'Staff', 'Admin', 'SuperAdmin']), getCompatibilityScores);
router.get('/preferences/match-matrix', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), getMatchMatrix);

// ========== 10. IoT ROOM MONITORING ==========
router.post('/iot/reading', requireRole(['Admin', 'SuperAdmin', 'Warden', 'Staff', 'Security']), logIotReading);
router.get('/iot/trends', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), getIotTrends);
router.get('/iot/report', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), getIotMonthlyReport);

// ========== 11. PREDICTIVE MAINTENANCE ==========
router.get('/maintenance/predict', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), getComplaintPredictions);
router.get('/maintenance/equipment', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), getEquipmentLifecycle);

// ========== 12. DIGITAL NIGHT ROLL CALL ==========
router.post('/rollcall/start', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), startRollCall);
router.post('/rollcall/confirm', requireRole(['Student']), confirmRollCall);
router.get('/rollcall/status/:id', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), getRollCallStatus);

// ========== 13. MENTAL WELLNESS CHECK-IN ==========
router.post('/wellness/checkin', requireRole(['Student']), logWellnessCheckin);
router.get('/wellness/trends', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), getWellnessTrends);
router.get('/wellness/alerts', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), getWellnessAlerts);

// ========== 14. NIGHTLY HEADCOUNT ==========
router.get('/headcount', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), getNightlyHeadcount);
router.get('/headcount/alerts', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), getNightlyHeadcountAlerts);

// ========== 15. SETTINGS, ATTENDANCE & MESS NOTICES ==========
router.get('/settings', getHostelSettings);
router.post('/settings', requireRole(['Warden', 'Admin', 'SuperAdmin']), saveHostelSettings);
router.post('/attendance/mark', requireRole(['Student']), markHostelAttendance);
router.get('/attendance/today', requireRole(['Warden', 'Admin', 'SuperAdmin']), getDailyHostelAttendance);
router.get('/mess-notices/latest', getLatestMessNotice);
router.post('/mess-notices', requireRole(['Warden', 'Admin', 'SuperAdmin']), broadcastMessNotice);

export default router;
