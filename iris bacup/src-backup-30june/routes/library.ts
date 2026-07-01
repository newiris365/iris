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
  getReports,
  aiResearchTopic,
  aiSummarizeBook,
  aiCompareBooks,
  setReadingGoal,
  logReadingProgress,
  getReadingStats,
  getGoalsLeaderboard,
  listNewspapers,
  createNewspaper,
  bookmarkNewspaperArticle,
  createBookClub,
  listBookClubs,
  joinBookClub,
  listClubDiscussions,
  postClubDiscussion,
  respondToDiscussion,
  issueClubCertificate,
  createInterlibraryRequest,
  listInterlibraryRequests,
  updateInterlibraryRequestStatus,
  processReservationQueue
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

// Alias: /search -> books listing with ?search= query parameter
router.get('/search', listBooks);

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

// --- AI RESEARCH ASSISTANT ---
router.post('/ai/research', aiResearchTopic);
router.post('/ai/summarize', aiSummarizeBook);
router.post('/ai/compare', aiCompareBooks);

// --- READING PROGRESS & GOALS ---
router.post('/goals', setReadingGoal);
router.post('/goals/progress', logReadingProgress);
router.get('/goals/stats/:studentId', getReadingStats);
router.get('/goals/leaderboard', getGoalsLeaderboard);

// --- DIGITAL NEWSPAPER PORTAL ---
router.get('/newspapers', listNewspapers);
router.post('/newspapers', requireRole(['Staff', 'Admin', 'SuperAdmin', 'Librarian']), createNewspaper);
router.post('/newspapers/:id/bookmark', bookmarkNewspaperArticle);

// --- BOOK CLUB MODULE ---
router.post('/book-clubs', requireRole(['Staff', 'Admin', 'SuperAdmin', 'Librarian']), createBookClub);
router.get('/book-clubs', listBookClubs);
router.post('/book-clubs/:id/join', joinBookClub);
router.get('/book-clubs/:id/discussions', listClubDiscussions);
router.post('/book-clubs/:id/discussion', postClubDiscussion);
router.post('/book-clubs/discussions/respond', respondToDiscussion);
router.post('/book-clubs/:id/certificate', issueClubCertificate);

// --- INTERLIBRARY LOANS ---
router.post('/interlibrary/request', createInterlibraryRequest);
router.get('/interlibrary/requests', listInterlibraryRequests);
router.put('/interlibrary/requests/:id/status', requireRole(['Staff', 'Admin', 'SuperAdmin', 'Librarian']), updateInterlibraryRequestStatus);

// --- RESERVATIONS FIFO QUEUE ---
router.post('/reservations/queue/process', requireRole(['Staff', 'Admin', 'SuperAdmin', 'Librarian']), processReservationQueue);

export default router;
