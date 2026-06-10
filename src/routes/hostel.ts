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
  generateAllotmentLetterPdf
} from '../controllers/hostel';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Protect all routes
router.use(authMiddleware);

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
router.post('/visitors', requireRole(['Security', 'Staff', 'Warden', 'Admin']), registerVisitor);
router.post('/visitors/:id/approve', requireRole(['Student', 'Warden', 'Staff', 'Admin']), approveVisitor);
router.post('/visitors/:id/checkout', requireRole(['Security', 'Staff', 'Warden', 'Admin']), checkoutVisitor);
router.get('/visitors', listVisitors);
router.get('/visitors/inside', listInsideVisitors);

// ========== 4. COMPLAINTS ==========
router.get('/complaints', listComplaints);
router.post('/complaints', raiseComplaint);
router.put('/complaints/:id/assign', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), assignComplaint);
router.put('/complaints/:id/status', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), updateComplaintStatus);
router.post('/complaints/:id/rate', requireRole(['Student']), rateComplaintResolution);

// ========== 5. LEAVE REQUESTS ==========
router.post('/leave-requests', requireRole(['Student']), applyLeave);
router.get('/leave-requests/student/:studentId', listStudentLeaves);
router.get('/leave-requests', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), listAllLeaves);
router.put('/leave-requests/:id/approve', requireRole(['Warden', 'Staff', 'Admin', 'SuperAdmin']), approveLeave);

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

export default router;
