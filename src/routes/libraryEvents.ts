import { Router } from 'express';
import { 
  issueBook, 
  returnBook, 
  getBookRecommendations, 
  registerEvent, 
  checkinTicket 
} from '../controllers/libraryEvents';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to protect all routes
router.use(authMiddleware);

// Library endpoints
router.post('/library/issue', requireRole(['Staff', 'Admin', 'SuperAdmin']), issueBook);
router.post('/library/return/:issueId', requireRole(['Staff', 'Admin', 'SuperAdmin']), returnBook);
router.get('/library/recommendations/:studentId', getBookRecommendations);

// Events endpoints
router.post('/events/:id/register', registerEvent);
router.post('/events/:id/checkin', requireRole(['Staff', 'Security', 'Admin', 'SuperAdmin']), checkinTicket);

export default router;
