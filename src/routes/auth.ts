import { Router } from 'express';
import { login, getMe, refresh, forgotPassword, logout, parentOtp, parentVerifyOtp, parentLinkChild } from '../controllers/auth';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public login & token management endpoints
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/logout', logout);

// Parent registration/linking endpoints
router.post('/parent-otp', parentOtp);
router.post('/parent-verify-otp', parentVerifyOtp);
router.post('/parent-link-child', authMiddleware, parentLinkChild);

// Protected token validation endpoint
router.get('/me', authMiddleware, getMe);

export default router;
