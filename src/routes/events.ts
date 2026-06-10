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
  generateEventReportPdf
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

// ========== 2. REGISTRATIONS & TICKETING ==========
router.post('/events/:id/register', registerForEvent);
router.get('/events/:id/registrations', requireRole(['Admin', 'SuperAdmin', 'Staff']), getEventRegistrations);
router.get('/events/my-registrations/:studentId', getMyRegistrations);
router.post('/events/:id/checkin', requireRole(['Staff', 'Security', 'Admin', 'SuperAdmin']), checkinEventTicket);

// ========== 3. RAZORPAY PAID TICKETS ==========
router.post('/events/tickets/initiate', initiateTicketPayment);
router.post('/events/tickets/verify', verifyTicketPayment);

// ========== 4. VOLUNTEERS ==========
router.post('/events/:id/volunteers', requireRole(['Admin', 'SuperAdmin', 'Staff']), addVolunteer);
router.get('/events/:id/volunteers', getEventVolunteers);
router.delete('/events/:id/volunteers/:volunteerId', requireRole(['Admin', 'SuperAdmin', 'Staff']), removeVolunteer);

// ========== 5. SPONSORS ==========
router.post('/events/:id/sponsors', requireRole(['Admin', 'SuperAdmin']), addSponsor);
router.get('/events/:id/sponsors', getEventSponsors);

// ========== 6. BUDGET ==========
router.post('/events/:id/budget', requireRole(['Admin', 'SuperAdmin', 'Staff']), addBudgetItem);
router.get('/events/:id/budget', requireRole(['Admin', 'SuperAdmin', 'Staff']), getEventBudget);
router.put('/events/:id/budget/:itemId/approve', requireRole(['Admin', 'SuperAdmin']), approveBudgetItem);

// ========== 7. PHOTOS ==========
router.post('/events/:id/photos', requireRole(['Admin', 'SuperAdmin', 'Staff']), addEventPhoto);
router.get('/events/:id/photos', getEventPhotos);
router.delete('/events/:id/photos/:photoId', requireRole(['Admin', 'SuperAdmin', 'Staff']), deleteEventPhoto);

// ========== 8. FEEDBACK ==========
router.post('/events/:id/feedback', submitFeedback);
router.get('/events/:id/feedback', getEventFeedback);

// ========== 9. ANNOUNCEMENTS ==========
router.post('/events/:id/announcements', requireRole(['Admin', 'SuperAdmin', 'Staff']), createAnnouncement);
router.get('/events/:id/announcements', getEventAnnouncements);

// ========== 10. REPORTS ==========
router.get('/events/:id/report/pdf', generateEventReportPdf);

export default router;
