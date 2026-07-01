import { Router } from 'express';
import {
  getChildToday,
  getChildDailyReport,
  sendParentMessage,
  getParentMessages,
  bookPTM,
  getPTMSlots
} from '../controllers/parent';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to protect all routes
router.use(authMiddleware);

// Schedule & daily report tracking
router.get('/child/:id/today', getChildToday);
router.get('/child/:id/daily-report/:date', getChildDailyReport);

// Messaging with teachers (both parent & teacher roles can access)
router.post('/messages', requireRole(['Parent', 'Staff', 'Admin', 'SuperAdmin']), sendParentMessage);
router.get('/messages/:teacherId', requireRole(['Parent', 'Staff', 'Admin', 'SuperAdmin']), getParentMessages);

// Parent-Teacher Meetings (PTM) booking
router.post('/ptm/book', requireRole(['Parent']), bookPTM);
router.get('/ptm/slots/:teacherId', requireRole(['Parent', 'Staff', 'Admin', 'SuperAdmin']), getPTMSlots);

export default router;
