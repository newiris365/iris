import { Router } from 'express';
import {
  getPrograms,
  createProgram,
  getCourses,
  createCourse,
  createCourseOutcome,
  createCoPoMapping,
  createAssessment,
  marksEntry,
  marksImport,
  getCoAttainment,
  getPoAttainment,
  aiSuggestCOs,
  aiGapAnalysis,
  createFacultyDevelopment,
  getFacultyDevelopment,
  createPublication,
  getPublicationsStats,
  getSurveys,
  createSurvey,
  activateSurvey,
  submitSurveyResponse,
  getSurveyAnalytics,
  createStudentAchievement,
  getStudentAchievementsStats
} from '../controllers/obe';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to protect all routes
router.use(authMiddleware);

// ──── PROGRAMS & COURSES ───────────────────────────────────────
router.get('/programs', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD', 'Teacher', 'Student']), getPrograms);
router.post('/programs', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD']), createProgram);
router.get('/courses/:programId', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD', 'Teacher', 'Student']), getCourses);
router.post('/courses', requireRole(['Admin', 'SuperAdmin', 'HOD']), createCourse);

// ──── OUTCOMES & CO-PO MAPPING ──────────────────────────────────
router.post('/course-outcomes', requireRole(['Admin', 'SuperAdmin', 'HOD', 'Teacher']), createCourseOutcome);
router.post('/co-po-mapping', requireRole(['Admin', 'SuperAdmin', 'HOD', 'Teacher']), createCoPoMapping);

// ──── ASSESSMENTS & MARKS ───────────────────────────────────────
router.post('/assessments', requireRole(['Admin', 'SuperAdmin', 'HOD', 'Teacher']), createAssessment);
router.post('/marks/entry', requireRole(['Admin', 'SuperAdmin', 'HOD', 'Teacher']), marksEntry);
router.post('/marks/import', requireRole(['Admin', 'SuperAdmin', 'HOD', 'Teacher']), marksImport);

// ──── ATTAINMENTS ──────────────────────────────────────────────
router.get('/co-attainment/:courseId', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD', 'Teacher']), getCoAttainment);
router.get('/po-attainment/:programId', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD', 'Teacher']), getPoAttainment);

// ──── AI TOOLS ──────────────────────────────────────────────────
router.post('/ai/suggest-cos', requireRole(['Admin', 'SuperAdmin', 'HOD', 'Teacher']), aiSuggestCOs);
router.post('/ai/gap-analysis', requireRole(['Admin', 'SuperAdmin', 'HOD']), aiGapAnalysis);

// ──── FACULTY DEVELOPMENT & RESEARCH ───────────────────────────
router.post('/faculty-development', requireRole(['Admin', 'SuperAdmin', 'HOD', 'Teacher']), createFacultyDevelopment);
router.get('/faculty-development/:staffId', requireRole(['Admin', 'SuperAdmin', 'HOD', 'Teacher']), getFacultyDevelopment);
router.post('/publications', requireRole(['Admin', 'SuperAdmin', 'HOD', 'Teacher']), createPublication);
router.get('/publications/stats', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD', 'Teacher']), getPublicationsStats);

// ──── FEEDBACK & SURVEYS ───────────────────────────────────────
router.get('/surveys', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD', 'Teacher']), getSurveys);
router.post('/surveys', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator']), createSurvey);
router.put('/surveys/:id/activate', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator']), activateSurvey);
router.post('/surveys/:id/respond', requireRole(['Student', 'Parent', 'Alumni', 'Teacher', 'Admin']), submitSurveyResponse);
router.get('/surveys/:id/analytics', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD']), getSurveyAnalytics);

// ──── STUDENT ACHIEVEMENTS ─────────────────────────────────────
router.post('/student-achievements', requireRole(['Admin', 'SuperAdmin', 'Teacher', 'Student']), createStudentAchievement);
router.get('/student-achievements/stats', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD', 'Teacher']), getStudentAchievementsStats);

export default router;
