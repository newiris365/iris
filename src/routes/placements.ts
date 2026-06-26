import { Router } from 'express';
import {
  getCompanies,
  createCompany,
  getCompany,
  updateCompany,
  getDrives,
  createDrive,
  getDrive,
  updateDriveStatus,
  getEligibleStudents,
  notifyEligibleStudents,
  applyDrive,
  getStudentApplications,
  updateApplicationStatus,
  TpoBulkShortlist,
  createRound,
  updateRoundResult,
  getDriveRounds,
  createOffer,
  getStudentOffers,
  acceptOffer,
  declineOffer,
  aiResumeScore,
  aiMockInterview,
  aiJdMatch,
  aiCareerGuidance,
  getAnalyticsDashboard,
  getReportsAnnual,
  getReportsNirf,
  getAlumniList,
  bookMentorshipSession,
  registerAlumni,
  updateAlumniProfile,
  getInternships,
  generateInternshipNoc,
  logCompanyVisit,
  getCompanyVisits,
  updateCompanyVisit
} from '../controllers/placements';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to protect all routes
router.use(authMiddleware);

// ──── COMPANIES ────────────────────────────────────────────────
router.get('/companies', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Student', 'Company HR']), getCompanies);
router.post('/companies', requireRole(['Admin', 'SuperAdmin', 'TPO']), createCompany);
router.get('/companies/:id', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Student', 'Company HR']), getCompany);
router.put('/companies/:id', requireRole(['Admin', 'SuperAdmin', 'TPO']), updateCompany);

// ──── PLACEMENT DRIVES ─────────────────────────────────────────
router.get('/drives', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Student', 'Company HR']), getDrives);
router.post('/drives', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Company HR']), createDrive);
router.get('/drives/:id', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Student', 'Company HR']), getDrive);
router.put('/drives/:id/status', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Company HR']), updateDriveStatus);
router.get('/drives/:id/eligible-students', requireRole(['Admin', 'SuperAdmin', 'TPO']), getEligibleStudents);
router.post('/drives/:id/notify-eligible', requireRole(['Admin', 'SuperAdmin', 'TPO']), notifyEligibleStudents);
router.post('/drives/:id/bulk-shortlist', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Company HR']), TpoBulkShortlist);

// ──── APPLICATIONS ─────────────────────────────────────────────
router.post('/drives/:id/apply', requireRole(['Student']), applyDrive);
router.get('/applications/student/:studentId', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Student']), getStudentApplications);
router.put('/applications/:id/status', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Company HR']), updateApplicationStatus);

// ──── INTERVIEW ROUNDS ─────────────────────────────────────────
router.post('/rounds', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Company HR']), createRound);
router.put('/rounds/:id/result', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Company HR']), updateRoundResult);
router.get('/rounds/drive/:driveId', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Student', 'Company HR']), getDriveRounds);

// ──── OFFERS ───────────────────────────────────────────────────
router.post('/offers', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Company HR']), createOffer);
router.get('/offers/student/:studentId', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Student']), getStudentOffers);
router.post('/offers/:id/accept', requireRole(['Student']), acceptOffer);
router.post('/offers/:id/decline', requireRole(['Student']), declineOffer);

// ──── AI PLACEMENT TOOLS ───────────────────────────────────────
router.post('/ai/resume-score', requireRole(['Student', 'Admin', 'TPO']), aiResumeScore);
router.post('/ai/mock-interview', requireRole(['Student']), aiMockInterview);
router.post('/ai/jd-match', requireRole(['Student', 'Admin', 'TPO']), aiJdMatch);
router.post('/ai/career-guidance', requireRole(['Student']), aiCareerGuidance);

// ──── ANALYTICS & REPORTS ──────────────────────────────────────
router.get('/analytics/dashboard', requireRole(['Admin', 'SuperAdmin', 'TPO']), getAnalyticsDashboard);
router.get('/reports/annual', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Student']), getReportsAnnual);
router.get('/reports/nirf', requireRole(['Admin', 'SuperAdmin', 'TPO']), getReportsNirf);

// ──── ALUMNI NETWORK ───────────────────────────────────────────
router.get('/alumni', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Student']), getAlumniList);
router.post('/alumni/register', requireRole(['Admin', 'SuperAdmin', 'TPO']), registerAlumni);
router.put('/alumni/:id', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Alumni']), updateAlumniProfile);
router.post('/alumni/book', requireRole(['Student']), bookMentorshipSession);

// ──── INTERNSHIPS ──────────────────────────────────────────────
router.get('/internships', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Student']), getInternships);
router.get('/internships/:id/noc', requireRole(['Admin', 'SuperAdmin', 'TPO', 'Student']), generateInternshipNoc);

// ──── COMPANY VISITS ──────────────────────────────────────────
router.post('/visits', requireRole(['Admin', 'SuperAdmin', 'TPO']), logCompanyVisit);
router.get('/visits', requireRole(['Admin', 'SuperAdmin', 'TPO']), getCompanyVisits);
router.put('/visits/:id', requireRole(['Admin', 'SuperAdmin', 'TPO']), updateCompanyVisit);

export default router;
