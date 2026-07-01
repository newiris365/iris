import { Router } from 'express';
import {
  getNaacCriteria,
  updateNaacMetric,
  uploadNaacDocument,
  getNaacDashboard,
  syncFromModules,
  aiDraftNarrative,
  ssrGenerate,
  getScoreEstimate
} from '../controllers/obe';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to protect all routes
router.use(authMiddleware);

// ──── CRITERIA & METRICS ───────────────────────────────────────
router.get('/criteria', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD']), getNaacCriteria);
router.put('/metrics/:id', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator']), updateNaacMetric);

// ──── EVIDENCE DOCUMENTS ───────────────────────────────────────
router.post('/documents/upload', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD', 'Teacher']), uploadNaacDocument);

// ──── DASHBOARD & SCORE ESTIMATE ──────────────────────────────
router.get('/dashboard', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD']), getNaacDashboard);
router.get('/score/estimate', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator']), getScoreEstimate);

// ──── AUTO-SYNC POPULATORS ─────────────────────────────────────
router.post('/sync-from-modules', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator']), syncFromModules);

// ──── AI NARRATIVES ────────────────────────────────────────────
router.post('/ai/draft-narrative/:criterionId', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator']), aiDraftNarrative);

// ──── SSR DOCUMENT COMPILERS ───────────────────────────────────
router.get('/ssr/generate', ssrGenerate); // Allow public download or auth via query param if needed (can be triggered by a button in browser)

export default router;
