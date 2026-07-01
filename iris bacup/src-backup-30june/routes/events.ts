import { Router } from 'express';
import {
  listEvents,
  getEventDetail,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getEventRegistrations,
  getMyRegistrations,
  checkinEventTicket,
  initiateTicketPayment,
  verifyTicketPayment,
  addVolunteer,
  getEventVolunteers,
  removeVolunteer,
  addSponsor,
  getEventSponsors,
  addBudgetItem,
  getEventBudget,
  approveBudgetItem,
  addEventPhoto,
  getEventPhotos,
  deleteEventPhoto,
  submitFeedback,
  getEventFeedback,
  createAnnouncement,
  getEventAnnouncements,
  getEventsAnalytics,
  generateEventReportPdf,
  
  // NEW ENDPOINTS
  generateEventAiPlan,
  finalizeEventAiPlan,
  createPoll,
  activatePoll,
  voteInPoll,
  getPollResults,
  submitQuestion,
  approveQuestion,
  answerQuestion,
  upvoteQuestion,
  submitReaction,
  getLiveDisplayData,
  applyForVolunteer,
  getVolunteerApplications,
  approveVolunteerApplication,
  checkinVolunteer,
  updateSponsorDetails,
  publishEventPhoto,
  generateEventCertificates,
  getEventCertificates,
  verifyCertificate,
  getEventAnalytics
} from '../controllers/events';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to protect all routes
router.use(authMiddleware);

// ========== 1. EVENT CRUD ==========
router.get('/events', listEvents);
router.get('/events/analytics/overview', requireRole(['Admin', 'SuperAdmin', 'Staff']), getEventsAnalytics);
router.get('/events/:id', getEventDetail);
router.post('/events', requireRole(['Admin', 'SuperAdmin', 'Staff']), createEvent);
router.put('/events/:id', requireRole(['Admin', 'SuperAdmin', 'Staff']), updateEvent);
router.delete('/events/:id', requireRole(['Admin', 'SuperAdmin']), deleteEvent);

// ========== 2. AI PLANNING ==========
router.post('/events/ai-plan', requireRole(['Admin', 'SuperAdmin', 'Staff']), generateEventAiPlan);
router.put('/events/:id/ai-plan/finalize', requireRole(['Admin', 'SuperAdmin', 'Staff']), finalizeEventAiPlan);

// ========== 3. REGISTRATIONS & TICKETING ==========
router.post('/events/:id/register', registerForEvent);
router.get('/events/:id/registrations', requireRole(['Admin', 'SuperAdmin', 'Staff']), getEventRegistrations);
router.get('/events/my-registrations/:studentId', getMyRegistrations);
router.post('/events/:id/checkin', requireRole(['Staff', 'Security', 'Admin', 'SuperAdmin']), checkinEventTicket);

// ========== 4. RAZORPAY PAID TICKETS ==========
router.post('/events/tickets/initiate', initiateTicketPayment);
router.post('/events/tickets/verify', verifyTicketPayment);
// Support alternate registration verify path if called
router.post('/events/:id/register/payment/verify', verifyTicketPayment);

// ========== 5. VOLUNTEERS & APPLICATIONS ==========
router.post('/events/:id/volunteers', requireRole(['Admin', 'SuperAdmin', 'Staff']), addVolunteer); // Direct assign
router.post('/events/:id/volunteers/assign', requireRole(['Admin', 'SuperAdmin', 'Staff']), addVolunteer); // Alternate alias
router.get('/events/:id/volunteers', getEventVolunteers);
router.delete('/events/:id/volunteers/:volunteerId', requireRole(['Admin', 'SuperAdmin', 'Staff']), removeVolunteer);

router.post('/events/:id/volunteer/apply', applyForVolunteer);
router.get('/events/:id/volunteer-applications', requireRole(['Admin', 'SuperAdmin', 'Staff']), getVolunteerApplications);
router.put('/events/:id/volunteer-applications/:appId', requireRole(['Admin', 'SuperAdmin', 'Staff']), approveVolunteerApplication);
router.put('/events/:id/volunteers/:volunteerId/checkin', requireRole(['Admin', 'SuperAdmin', 'Staff']), checkinVolunteer);

// ========== 6. SPONSORS CRM ==========
router.post('/events/:id/sponsors', requireRole(['Admin', 'SuperAdmin']), addSponsor);
router.get('/events/:id/sponsors', getEventSponsors);
router.put('/events/:id/sponsors/:sponsorId', requireRole(['Admin', 'SuperAdmin']), updateSponsorDetails);

// ========== 7. BUDGET ==========
router.post('/events/:id/budget', requireRole(['Admin', 'SuperAdmin', 'Staff']), addBudgetItem);
router.get('/events/:id/budget', requireRole(['Admin', 'SuperAdmin', 'Staff']), getEventBudget);
router.put('/events/:id/budget/:itemId/approve', requireRole(['Admin', 'SuperAdmin']), approveBudgetItem);

// ========== 8. PHOTOS ==========
router.post('/events/:id/photos', requireRole(['Admin', 'SuperAdmin', 'Staff']), addEventPhoto);
router.get('/events/:id/photos', getEventPhotos);
router.delete('/events/:id/photos/:photoId', requireRole(['Admin', 'SuperAdmin', 'Staff']), deleteEventPhoto);
router.put('/events/:id/photos/:photoId/publish', requireRole(['Admin', 'SuperAdmin', 'Staff']), publishEventPhoto);

// ========== 9. FEEDBACK ==========
router.post('/events/:id/feedback', submitFeedback);
router.get('/events/:id/feedback', getEventFeedback);

// ========== 10. ANNOUNCEMENTS ==========
router.post('/events/:id/announcements', requireRole(['Admin', 'SuperAdmin', 'Staff']), createAnnouncement);
router.get('/events/:id/announcements', getEventAnnouncements);

// ========== 11. LIVE EXPERIENCE ==========
router.post('/events/:id/polls', requireRole(['Admin', 'SuperAdmin', 'Staff']), createPoll);
router.put('/events/:id/polls/:pollId/activate', requireRole(['Admin', 'SuperAdmin', 'Staff']), activatePoll);
router.post('/events/:id/polls/:pollId/vote', voteInPoll);
router.get('/events/:id/polls/:pollId/results', getPollResults);
router.post('/events/:id/questions', submitQuestion);
router.put('/events/:id/questions/:qId/approve', requireRole(['Admin', 'SuperAdmin', 'Staff']), approveQuestion);
router.put('/events/:id/questions/:qId/answer', requireRole(['Admin', 'SuperAdmin', 'Staff']), answerQuestion);
router.put('/events/:id/questions/:qId/upvote', upvoteQuestion);
router.post('/events/:id/reactions', submitReaction);
router.get('/events/:id/live-display-data', getLiveDisplayData);

// ========== 12. CERTIFICATES ==========
router.post('/events/:id/certificates/generate', requireRole(['Admin', 'SuperAdmin']), generateEventCertificates);
router.get('/events/:id/certificates', getEventCertificates);
router.get('/events/certificates/verify/:code', verifyCertificate);

// ========== 13. REPORTS & ANALYTICS ==========
router.get('/events/:id/analytics', requireRole(['Admin', 'SuperAdmin', 'Staff']), getEventAnalytics);
router.get('/events/:id/report', generateEventReportPdf);
router.get('/events/:id/report/pdf', generateEventReportPdf);

export default router;
