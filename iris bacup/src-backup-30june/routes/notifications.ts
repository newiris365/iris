import { Router } from 'express';
import { registerDevice } from '../controllers/notifications';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/register-device', registerDevice);

export default router;
