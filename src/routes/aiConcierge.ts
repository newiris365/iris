import { Router } from 'express';
import {
  chatQuery,
  getConversationHistory,
  getUserSessions,
  submitFeedback,
  whatsappVerify,
  whatsappWebhook,
  getWhatsappSubscribers,
  sendWhatsappBroadcast,
  searchGlobal,
  rebuildSearchIndex,
  getFaqList,
  createFaq,
  updateFaq,
  deleteFaq,
  getFaqSuggestions,
  getLatestDigest,
  generateDigestCron,
  getEscalations,
  resolveEscalation,
  getConciergeStats
} from '../controllers/aiConcierge';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// ========== PUBLIC WHATSAPP WEBHOOKS ==========
router.get('/whatsapp/webhook', whatsappVerify);
router.post('/whatsapp/webhook', whatsappWebhook);

// ========== AUTHENTICATED AI CONCIERGE CHAT ==========
router.post('/chat', authMiddleware, chatQuery);
router.get('/chat/history/:sessionId', authMiddleware, getConversationHistory);
router.get('/sessions', authMiddleware, getUserSessions);
router.post('/chat/:messageId/feedback', authMiddleware, submitFeedback);

// ========== GLOBAL SMART SEARCH ==========
router.get('/search', authMiddleware, searchGlobal);
router.post('/search/index/rebuild', authMiddleware, requireRole(['Admin', 'SuperAdmin']), rebuildSearchIndex);

// ========== FAQ KNOWLEDGE BASE CONFIGS ==========
router.get('/faq', authMiddleware, getFaqList);
router.post('/faq', authMiddleware, requireRole(['Admin', 'SuperAdmin']), createFaq);
router.put('/faq/:id', authMiddleware, requireRole(['Admin', 'SuperAdmin']), updateFaq);
router.delete('/faq/:id', authMiddleware, requireRole(['Admin', 'SuperAdmin']), deleteFaq);
router.get('/faq/suggestions', authMiddleware, requireRole(['Admin', 'SuperAdmin']), getFaqSuggestions);

// ========== AI ESCALATIONS FLOW ==========
router.get('/escalations', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Librarian']), getEscalations);
router.put('/escalations/:id/resolve', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Librarian']), resolveEscalation);

// ========== WHATSAPP BROADCASTS CONFIGS ==========
router.get('/whatsapp/subscribers', authMiddleware, requireRole(['Admin', 'SuperAdmin']), getWhatsappSubscribers);
router.post('/whatsapp/broadcast', authMiddleware, requireRole(['Admin', 'SuperAdmin']), sendWhatsappBroadcast);

// ========== WEEKLY CAMPUS DIGESTS ==========
router.get('/digest/:userId/latest', authMiddleware, getLatestDigest);
router.post('/digest/generate/:userId', authMiddleware, requireRole(['Admin', 'SuperAdmin']), generateDigestCron);

// ========== ADMIN STATS ==========
router.get('/concierge/stats', authMiddleware, requireRole(['Admin', 'SuperAdmin']), getConciergeStats);

export default router;
