import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  listBooks,
  getBook,
  createBook,
  updateBook,
  lookupIsbn,
  importBooks,
  issueBook,
  returnBook,
  renewBook,
  listStudentIssues,
  listOverdueIssues,
  reserveBook,
  deleteReservation,
  listReservationsForBook,
  listEbooks,
  createEbook,
  viewEbook,
  downloadEbook,
  listStudyRooms,
  bookStudyRoom,
  deleteStudyRoomBooking,
  checkinStudyRoomBooking,
  getStudentFines,
  payFine,
  getRecommendations,
  getOverviewStats,
  getReports
} from '../controllers/library';

const router = Router();

// Apply auth middleware to protect all routes
router.use(authMiddleware);

// --- BOOKS CATALOGUE ---
router.get('/books', listBooks);
router.get('/books/:id', getBook);
router.post('/books', requireRole(['Staff', 'Admin', 'SuperAdmin', 'Librarian']), createBook);
router.put('/books/:id', requireRole(['Staff', 'Admin', 'SuperAdmin', 'Librarian']), updateBook);
router.post('/books/isbn-lookup', lookupIsbn);
router.post('/books/import', requireRole(['Staff', 'Admin', 'SuperAdmin', 'Librarian']), importBooks);

// --- BOOK CHECKOUTS / ISSUES ---
router.post('/issues', requireRole(['Staff', 'Admin', 'SuperAdmin', 'Librarian']), issueBook);
router.post('/issues/:id/return', requireRole(['Staff', 'Admin', 'SuperAdmin', 'Librarian']), returnBook);
router.post('/issues/:id/renew', renewBook);
router.get('/issues/student/:studentId', listStudentIssues);
router.get('/issues/overdue', requireRole(['Staff', 'Admin', 'SuperAdmin', 'Librarian']), listOverdueIssues);

// --- RESERVATIONS ---
router.post('/reservations', reserveBook);
router.delete('/reservations/:id', deleteReservation);
router.get('/reservations/book/:bookId', listReservationsForBook);

// --- E-RESOURCE PORTAL ---
router.get('/ebooks', listEbooks);
router.post('/ebooks', requireRole(['Staff', 'Admin', 'SuperAdmin', 'Librarian']), createEbook);
router.post('/ebooks/:id/view', viewEbook);
router.post('/ebooks/:id/download', downloadEbook);

// --- STUDY ROOM BOOKINGS ---
router.get('/study-rooms', listStudyRooms);
router.post('/study-room-bookings', bookStudyRoom);
router.delete('/study-room-bookings/:id', deleteStudyRoomBooking);
router.post('/study-room-bookings/:id/checkin', requireRole(['Staff', 'Admin', 'SuperAdmin', 'Librarian']), checkinStudyRoomBooking);

// --- FINES ---
router.get('/fines/:studentId', getStudentFines);
router.post('/fines/:id/pay', payFine);

// --- AI RECOMMENDATIONS ---
router.get('/recommendations/:studentId', getRecommendations);

// --- ANALYTICS ---
router.get('/analytics/overview', requireRole(['Staff', 'Admin', 'SuperAdmin', 'Librarian']), getOverviewStats);
router.get('/analytics/reports', requireRole(['Staff', 'Admin', 'SuperAdmin', 'Librarian']), getReports);

export default router;
