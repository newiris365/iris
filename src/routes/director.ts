import { Router } from 'express';
import {
  getOverview,
  getLiveKPIs,
  getActivityFeed,
  getAnalyticsAttendance,
  getAnalyticsFees,
  getAnalyticsModules,
  getAnalyticsUtilization,
  getAnalyticsCorrelation,
  getAlerts,
  readAlert,
  resolveAlert,
  getThresholds,
  updateThreshold,
  getInsights,
  generateInsights,
  dismissInsight,
  getDropoutRisk,
  getFeeRisk,
  getReports,
  generateReportOnDemand,
  downloadReportPDF,
  getReportsSchedule,
  getStudentFullProfile
} from '../controllers/director';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware + restrict all routes to Director/SuperAdmin only
router.use(authMiddleware);
router.use(requireRole(['Director', 'SuperAdmin']));

// --- LIVE KPIs & OVERVIEWS ---
router.get('/overview', getOverview);
router.get('/kpis/live', getLiveKPIs);
router.get('/activity-feed', getActivityFeed);

// --- ANALYTICS HUB ---
router.get('/analytics/attendance', getAnalyticsAttendance);
router.get('/analytics/fees', getAnalyticsFees);
router.get('/analytics/modules', getAnalyticsModules);
router.get('/analytics/utilization', getAnalyticsUtilization);
router.get('/analytics/correlation', getAnalyticsCorrelation);

// --- ALERTS SYSTEM ---
router.get('/alerts', getAlerts);
router.put('/alerts/:id/read', readAlert);
router.put('/alerts/:id/resolve', resolveAlert);
router.get('/alerts/thresholds', getThresholds);
router.put('/alerts/thresholds/:type', updateThreshold);

// --- AI PREDICTORS ---
router.get('/insights', getInsights);
router.post('/insights/generate', generateInsights);
router.put('/insights/:id/dismiss', dismissInsight);
router.get('/insights/dropout-risk', getDropoutRisk);
router.get('/insights/fee-risk', getFeeRisk);

// --- PDF COMPILERS ---
router.get('/reports', getReports);
router.post('/reports/generate', generateReportOnDemand);
router.get('/reports/:id/download', downloadReportPDF);
router.get('/reports/schedule', getReportsSchedule);

// --- GLOBAL CROSS SEARCH DETAILS ---
router.get('/student/:id/full-profile', getStudentFullProfile);

export default router;
