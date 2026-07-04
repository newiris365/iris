import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  listClassSections,
  createClassSection,
  updateClassSection,
  deleteClassSection,
  listTeachers,
  setupSchema,
} from '../controllers/school';

const router = Router();

router.use(authMiddleware);

router.get('/classes', requireRole(['Admin', 'SuperAdmin', 'Director', 'Principal', 'Teacher']), listClassSections);
router.post('/classes', requireRole(['Admin', 'SuperAdmin', 'Director', 'Principal']), createClassSection);
router.put('/classes/:id', requireRole(['Admin', 'SuperAdmin', 'Director', 'Principal']), updateClassSection);
router.delete('/classes/:id', requireRole(['Admin', 'SuperAdmin', 'Director', 'Principal']), deleteClassSection);

router.get('/teachers', requireRole(['Admin', 'SuperAdmin', 'Director', 'Principal', 'Teacher']), listTeachers);

router.post('/setup/schema', requireRole(['Admin', 'SuperAdmin']), setupSchema);

export default router;
