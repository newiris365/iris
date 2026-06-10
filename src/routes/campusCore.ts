import { Router } from 'express';
import { 
  startSession,
  getSessionQr,
  markAttendanceQr,
  markAttendanceBiometric,
  markAttendanceBulk,
  getStudentAttendance,
  getAttendanceReport,
  submitRegularize,
  approveRegularize,
  getStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  importStudents,
  getTimetable,
  addTimetableBlock,
  updateTimetableBlock,
  deleteTimetableBlock,
  autoGenerateTimetable,
  getStudentTimetable,
  getFeeStructures,
  createFeeStructure,
  initiatePayment,
  verifyPayment,
  getStudentFees,
  getFeesReport,
  createConcession,
  triggerFeeReminders,
  getNotices,
  createNotice,
  publishNotice,
  readNotice,
  getNoticeAnalytics,
  getExams,
  createExam,
  enterResults,
  getResults,
  publishResults,
  getMarksheetMetadata,
  getCardTemplate,
  saveCardTemplate,
  generateCard,
  generateBulkCards,
  verifyCard
} from '../controllers/campusCore';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to protect all routes (except public ID verify)
router.get('/idcards/verify/:studentId', verifyCard); // public check

router.use(authMiddleware);

// =========================================================================
// 1. ATTENDANCE ROUTERS
// =========================================================================
router.post('/attendance/session/start', requireRole(['Staff', 'Admin', 'SuperAdmin']), startSession);
router.get('/attendance/session/:id/qr', requireRole(['Staff', 'Admin', 'SuperAdmin']), getSessionQr);
router.post('/attendance/mark/qr', requireRole(['Student']), markAttendanceQr);
router.post('/attendance/mark/biometric', markAttendanceBiometric); // Biometric device endpoint (auth bypassed or header checked)
router.post('/attendance/mark/bulk', requireRole(['Staff', 'Admin', 'SuperAdmin']), markAttendanceBulk);
router.get('/attendance/student/:id', getStudentAttendance);
router.get('/attendance/report/:departmentId', requireRole(['Staff', 'Admin', 'SuperAdmin']), getAttendanceReport);
router.post('/attendance/regularize', requireRole(['Student']), submitRegularize);
router.put('/attendance/regularize/:id/approve', requireRole(['Staff', 'Admin', 'SuperAdmin']), approveRegularize);

// =========================================================================
// 2. STUDENTS CRUD ROUTERS
// =========================================================================
router.get('/students', getStudents);
router.post('/students', requireRole(['Admin', 'SuperAdmin']), createStudent);
router.get('/students/:id', getStudentById);
router.put('/students/:id', requireRole(['Admin', 'SuperAdmin']), updateStudent);
router.delete('/students/:id', requireRole(['Admin', 'SuperAdmin']), deleteStudent);
router.post('/students/import', requireRole(['Admin', 'SuperAdmin']), importStudents);

// =========================================================================
// 3. TIMETABLE ROUTERS
// =========================================================================
router.get('/timetable/:departmentId', getTimetable);
router.post('/timetable', requireRole(['Admin', 'SuperAdmin']), addTimetableBlock);
router.put('/timetable/:id', requireRole(['Admin', 'SuperAdmin']), updateTimetableBlock);
router.delete('/timetable/:id', requireRole(['Admin', 'SuperAdmin']), deleteTimetableBlock);
router.post('/timetable/auto-generate', requireRole(['Admin', 'SuperAdmin']), autoGenerateTimetable);
router.get('/timetable/student/:studentId', getStudentTimetable);

// =========================================================================
// 4. FEES ROUTERS
// =========================================================================
router.get('/fees/structures', getFeeStructures);
router.post('/fees/structures', requireRole(['Admin', 'SuperAdmin']), createFeeStructure);
router.post('/fees/payment/initiate', requireRole(['Student', 'Parent']), initiatePayment);
router.post('/fees/payment/verify', requireRole(['Student', 'Parent']), verifyPayment);
router.get('/fees/student/:studentId', getStudentFees);
router.get('/fees/report', requireRole(['Admin', 'SuperAdmin']), getFeesReport);
router.post('/fees/concession', requireRole(['Admin', 'SuperAdmin']), createConcession);
router.post('/fees/reminder/trigger', requireRole(['Admin', 'SuperAdmin']), triggerFeeReminders);

// =========================================================================
// 5. NOTICES ROUTERS
// =========================================================================
router.get('/notices', getNotices);
router.post('/notices', requireRole(['Staff', 'Admin', 'SuperAdmin']), createNotice);
router.put('/notices/:id/publish', requireRole(['Staff', 'Admin', 'SuperAdmin']), publishNotice);
router.post('/notices/:id/read', readNotice);
router.get('/notices/analytics/:id', requireRole(['Staff', 'Admin', 'SuperAdmin']), getNoticeAnalytics);

// =========================================================================
// 6. EXAM & RESULTS ROUTERS
// =========================================================================
router.get('/exams', getExams);
router.post('/exams', requireRole(['Staff', 'Admin', 'SuperAdmin']), createExam);
router.post('/exams/:id/results', requireRole(['Staff', 'Admin', 'SuperAdmin']), enterResults);
router.get('/exams/:id/results', getResults);
router.post('/exams/:id/publish', requireRole(['Staff', 'Admin', 'SuperAdmin']), publishResults);
router.get('/exams/marksheet/:studentId/:examId', getMarksheetMetadata);

// =========================================================================
// 7. ID CARDS ROUTERS
// =========================================================================
router.get('/idcards/template', getCardTemplate);
router.post('/idcards/template', requireRole(['Admin', 'SuperAdmin']), saveCardTemplate);
router.post('/idcards/generate/:studentId', requireRole(['Admin', 'SuperAdmin']), generateCard);
router.post('/idcards/generate/bulk', requireRole(['Admin', 'SuperAdmin']), generateBulkCards);

export default router;
