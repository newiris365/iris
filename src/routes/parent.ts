import { Router } from 'express';
import {
  getChildToday,
  getChildDailyReport,
  sendParentMessage,
  getParentMessages,
  getConversationThreads,
  getPTMTeachers,
  getPTMSlots,
  bookPTM,
  getParentBookings,
  cancelPTMBooking,
} from '../controllers/parent';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/child/:id/today', getChildToday);
router.get('/child/:id/daily-report/:date', getChildDailyReport);

router.post('/messages', requireRole(['Parent', 'Staff', 'Admin', 'SuperAdmin']), sendParentMessage);
router.get('/messages/threads', requireRole(['Parent', 'Staff', 'Admin', 'SuperAdmin']), getConversationThreads);
router.get('/messages/:teacherId', requireRole(['Parent', 'Staff', 'Admin', 'SuperAdmin']), getParentMessages);

// PTM
router.get('/ptm/teachers', requireRole(['Parent']), getPTMTeachers);
router.get('/ptm/slots/:teacherId', requireRole(['Parent', 'Staff', 'Admin', 'SuperAdmin']), getPTMSlots);
router.post('/ptm/book', requireRole(['Parent']), bookPTM);
router.get('/ptm/bookings', requireRole(['Parent']), getParentBookings);
router.post('/ptm/cancel/:id', requireRole(['Parent']), cancelPTMBooking);

export default router;
