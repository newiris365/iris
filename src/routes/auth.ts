import { Router } from 'express';
import { login, getMe } from '../controllers/auth';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public login endpoint
router.post('/login', login);

// Protected token validation endpoint
router.get('/me', authMiddleware, getMe);

export default router;
