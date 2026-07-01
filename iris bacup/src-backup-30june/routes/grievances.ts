import { Router } from 'express';
import {
  submitGrievance,
  getMyGrievances,
  getAllGrievances,
  updateGrievanceStatus,
  appealGrievance,
} from '../controllers/grievances';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', requireRole(['Student', 'Teacher', 'Staff']), submitGrievance);
router.get('/my', requireRole(['Student', 'Teacher', 'Staff']), getMyGrievances);
router.get('/all', requireRole(['Admin', 'SuperAdmin', 'Director']), getAllGrievances);
router.put('/:id/status', requireRole(['Admin', 'SuperAdmin', 'Director']), updateGrievanceStatus);
router.post('/:id/appeal', requireRole(['Student', 'Teacher', 'Staff']), appealGrievance);

export default router;
