import { Router } from 'express';
import { 
  allocateRoom, 
  getRooms, 
  raiseComplaint, 
  updateComplaint, 
  getComplaints, 
  logGateActivity, 
  getGateLogs, 
  getInsideCount 
} from '../controllers/hostelGate';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to protect all routes
router.use(authMiddleware);

// Hostel endpoints
router.get('/hostel/rooms', getRooms);
router.post('/hostel/allocate', requireRole(['Warden', 'Admin', 'SuperAdmin']), allocateRoom);
router.get('/hostel/complaints', getComplaints);
router.post('/hostel/complaints', requireRole(['Student', 'Staff', 'Admin']), raiseComplaint);
router.put('/hostel/complaints/:id', requireRole(['Warden', 'Admin', 'SuperAdmin']), updateComplaint);

// Gate Security endpoints
router.post('/gate/entry', requireRole(['Security', 'Admin', 'SuperAdmin']), logGateActivity);
router.get('/gate/logs', requireRole(['Security', 'Admin', 'SuperAdmin']), getGateLogs);
router.get('/gate/inside-count', getInsideCount);

export default router;
