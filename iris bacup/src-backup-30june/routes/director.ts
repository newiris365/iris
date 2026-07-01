import { Router } from 'express';
import {
  getOverview,
  getLiveKPIs,
  getAnalytics,
  getModules,
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
  generateAndDownloadPDFReport,
  getReportsSchedule,
  getStudentFullProfile,
  getGoals,
  createOrUpdateGoal,
  getGoalsHistory,
  getBoardReports,
  generateBoardReport,
  emailBoardReport,
  getFinancialPL,
  saveFinancialCosts,
  getCompetitorBenchmarks,
  getStudentJourneyScores,
  assignCounselorIntervention,
  getCampusPulse,
  getFeeRecoveryTracking,
  getAttendanceTrends,
  getComplaintSLA,
  getNAACData,
  getSystemAnomalies,
  resolveAnomaly,
} from '../controllers/director';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware + restrict all routes to Director/SuperAdmin/Admin
router.use(authMiddleware);
router.use(requireRole(['Director', 'SuperAdmin', 'Admin']));

// --- LIVE KPIs & OVERVIEWS ---
router.get('/overview', getOverview);
router.get('/analytics', getAnalytics);
router.get('/modules', getModules);
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
router.post('/report/pdf', generateAndDownloadPDFReport);
router.get('/reports/:id/download', downloadReportPDF);
router.get('/reports/schedule', getReportsSchedule);

// --- GLOBAL CROSS SEARCH DETAILS ---
router.get('/student/:id/full-profile', getStudentFullProfile);

// --- MODULE 9: STRATEGIC GOALS ---
router.get('/goals', getGoals);
router.post('/goals', createOrUpdateGoal);
router.get('/goals/history', getGoalsHistory);

// --- MODULE 9: BOARD REPORTS (PowerPoint) ---
router.get('/board-reports', getBoardReports);
router.post('/board-reports/generate', generateBoardReport);
router.post('/board-reports/email', emailBoardReport);

// --- MODULE 9: REAL-TIME FINANCIAL P&L ---
router.get('/financial-pl', getFinancialPL);
router.post('/financial-pl/costs', saveFinancialCosts);

// --- MODULE 9: COMPETITOR BENCHMARKS ---
router.get('/competitor-benchmarks', getCompetitorBenchmarks);

// --- MODULE 9: STUDENT JOURNEY ANALYTICS ---
router.get('/student-journey', getStudentJourneyScores);
router.post('/student-journey/intervention', assignCounselorIntervention);

// --- CAMPUS PULSE & KPIs (Migration 20260612000014) ---
router.get('/campus-pulse', getCampusPulse);
router.get('/fee-recovery', getFeeRecoveryTracking);
router.get('/attendance-trends', getAttendanceTrends);
router.get('/complaint-sla', getComplaintSLA);
router.get('/naac-data', getNAACData);
router.get('/anomalies', getSystemAnomalies);
router.put('/anomalies/:id/resolve', resolveAnomaly);

export default router;
