import { Router } from 'express';
import {
  getInstitutionAdmissions,
  getOpenPrograms,
  registerApplicant,
  verifyOTP,
  getPublicMeritList,
  getMyApplication,
  updatePersonalDetails,
  selectPrograms,
  uploadAcademicRecord,
  uploadDocument,
  submitApplication,
  initiatePayment,
  verifyPayment,
  getApplications,
  verifyDocument,
  rejectDocument,
  aiAssistVerify,
  autoShortlist,
  calculateMeritScores,
  generateMeritList,
  publishMeritList,
  predictAdmissionClaude,
  generateOffersBulk,
  acceptOffer,
  declineOffer,
  createCounselingSession,
  assignCounselingSlot,
  counselingCheckin,
  getLeads,
  createLead,
  updateLead,
  sendBulkMessage,
  convertToStudent,
  getAnalyticsDashboard,
  getAnalyticsFunnel,
  getReports
} from '../controllers/admissions';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// ============================================================
// PUBLIC ROUTINGS (NO AUTH)
// ============================================================
router.get('/:slug', getInstitutionAdmissions);
router.get('/:slug/programs', getOpenPrograms);
router.post('/register', registerApplicant);
router.post('/verify-otp', verifyOTP);
router.get('/merit-list/:round', getPublicMeritList);

// ============================================================
// APPLICANT ROUTINGS (AUTH REQUIRED: ROLE='Applicant')
// ============================================================
router.get('/application/my', authMiddleware, requireRole(['Applicant']), getMyApplication);
router.put('/application/personal', authMiddleware, requireRole(['Applicant']), updatePersonalDetails);
router.post('/application/programs', authMiddleware, requireRole(['Applicant']), selectPrograms);
router.post('/application/academic', authMiddleware, requireRole(['Applicant']), uploadAcademicRecord);
router.post('/documents/upload', authMiddleware, requireRole(['Applicant']), uploadDocument);
router.post('/application/submit', authMiddleware, requireRole(['Applicant']), submitApplication);

// PAYMENT TRIGGERS
router.post('/fees/pay/initiate', authMiddleware, requireRole(['Applicant']), initiatePayment);
router.post('/fees/pay/verify', authMiddleware, requireRole(['Applicant']), verifyPayment);

// OFFER TRIGGERS (BY APPLICANT)
router.post('/offers/:id/accept', authMiddleware, requireRole(['Applicant']), acceptOffer);
router.post('/offers/:id/decline', authMiddleware, requireRole(['Applicant']), declineOffer);

// ============================================================
// OFFICERS & ADMINS ROUTINGS
// ============================================================
router.get('/applications', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), getApplications);
router.post('/documents/:id/verify', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), verifyDocument);
router.post('/documents/:id/reject', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), rejectDocument);
router.post('/documents/:id/ai-verify', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), aiAssistVerify);
router.post('/shortlist/auto', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), autoShortlist);
router.post('/merit/calculate', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), calculateMeritScores);
router.post('/merit-lists/generate', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), generateMeritList);
router.put('/merit-lists/:id/publish', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), publishMeritList);
router.get('/merit/predict', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), predictAdmissionClaude);
router.post('/offers/generate-bulk', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), generateOffersBulk);

// COUNSELING MAPPING
router.post('/counseling/sessions', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), createCounselingSession);
router.post('/counseling/slots', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), assignCounselingSlot);
router.put('/counseling/slots/:id/checkin', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), counselingCheckin);

// ANALYTICS & AUDITS
router.get('/analytics/dashboard', authMiddleware, requireRole(['Admin', 'SuperAdmin']), getAnalyticsDashboard);
router.get('/analytics/funnel', authMiddleware, requireRole(['Admin', 'SuperAdmin']), getAnalyticsFunnel);
router.get('/reports/:type', authMiddleware, requireRole(['Admin', 'SuperAdmin']), getReports);

// CONVERT TRIGGER
router.post('/convert/:applicantId', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), convertToStudent);

// ============================================================
// CRM ROUTINGS
// ============================================================
router.get('/crm/leads', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), getLeads);
router.post('/crm/leads', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), createLead);
router.put('/crm/leads/:id', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), updateLead);
router.post('/crm/bulk-message', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), sendBulkMessage);

export default router;
