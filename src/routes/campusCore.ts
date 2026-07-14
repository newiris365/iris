import { Router } from 'express';
import { 
  startSession,
  getSessionQr,
  closeSession,
  markAttendanceQr,
  markAttendanceBiometric,
  markAttendanceBulk,
  markSchoolAttendanceBulk,
  getSchoolAttendanceReport,
  getStudentAttendance,
  getAttendanceReport,
  submitRegularize,
  approveRegularize,
  getAttendanceDevices,
  registerAttendanceDevice,
  updateAttendanceDevice,
  getDeviceLogs,
  deviceHeartbeat,
  deviceAttendancePush,
  getAttendanceMethods,
  updateAttendanceMethod,
  batchUpdateAttendanceMethods,
  importAttendanceRecords,
  importStudentProfiles,
  initiateFeePayment,
  payLibraryFine,
  registerForEvent,
  checkGateAccess,
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
  getStudentTimetable,
  getFeeStructures,
  createFeeStructure,
  initiatePayment,
  verifyPayment,
  getStudentFees,
  getFeesReport,
  createConcession,
  cloneFeeStructures,
  processFeeRefund,
  triggerFeeReminders,
  getReminderHistory,
  toggleAutoReminders,
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
  verifyCard,
  getFraudLogs,
  getStudentHealthScore,
  getHealthScoresReport,
  calculateHealthScores,
  assignSubstitute,
  createInstallmentPlan,
  getEligibleScholarships,
  getAttendanceWarnings,
  getAttendanceWarningLogs,
  getFeeDefaulters,
  getFeeEscalationLogs,
  getExamHalls,
  createExamHall,
  getExamSeating,
  allocateSeating,
  getLostFoundItems,
  createLostFoundItem,
  claimLostFoundItem,
  linkParentToChild,
  getNoticeReadStats,
  getAssignments,
  createAssignment,
  getAssignmentSubmissions,
  gradeAssignment,
  getStudyMaterials,
  createStudyMaterial,
  getMyLeaves,
  getDepartmentLeaves,
  getMyCiaMarks,
  getWalletBalance,
  getWalletTransactions,
  getMyBusETA,
  getParentChildInfo,
  getParentDailySummary,
  getParentFeeSummary,
  getParentWallet,
  parentTopupWallet,
  getParentNotifications,
  markParentNotificationRead,
  getParentUnreadCount,
  getChildBusStatus,
  preauthorizeVisitor,
  getParentVisitorPreauths,
  parentApplyLeave,
  getParentLeaveList,
  getCiaAssessments,
  createCiaAssessment,
  getCiaMarks,
  enterCiaMarks,
  getAttendanceShortageReport,
  getPendingLeaves,
  approveLeaveFaculty,
  rejectLeaveFaculty,
  getTeacherTimetable,
  getFacultyStudents,
  getAdmissions,
  createAdmission,
  updateAdmissionStatus,
  uploadAdmissionDocument,
  bulkAdmitStudents,
  detectTimetableConflicts,
  autoGenerateTimetable,
  getTimetableConstraints,
  createTimetableConstraint,
  getConsolidatedDefaulters,
  getAcademicCalendar,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getHolidays,
  createHoliday,
  approveVisitor,
  getUnallocatedStudents,
  checkoutRoom,
  markCurfewCheckin,
  getCurfewStatus,
  getBlockMealSubscriptions,
  approveRoomTransfer,
  completeRoomTransfer,
  getRoomTransferRequests,
  verifyPersonAtGate,
  gateScanLookup,
  getApprovedVisitorsToday,
  checkPersonRestricted,
  createAccessRestriction,
  getAccessRestrictions,
  vehicleEntry,
  vehicleExit,
  getVehicleLogs,
  getTodaysEventAttendees,
  getDriverAssignments,
  getDriverTodayTrip,
  startBusTrip,
  endBusTrip,
  getDriverHeadcount,
  getDriverStopSchedule,
  markStopReached,
  reportBusIncident,
  getVendorOrders,
  updateOrderStatus,
  toggleMenuAvailability,
  updateMenuPrice,
  updateMenuStock,
  getVendorDailySales,
  getPrepList,
  deductWallet,
  creditWallet,
  initiateWalletTopUp,
  getAvailableCourses,
  registerForCourse,
  dropCourse,
  getMyCourses,
  exportCiaMarks,
  enrollInExam,
  getExamEnrollments,
  getMyExamEnrollments,
  cancelEnrollment,
  generateHallTickets,
  getMyHallTickets,
  getHallTicketDetail,
  downloadHallTicketPdf,
  uploadStudentPhoto,
  uploadStudentDocument,
  getStudentDocuments,
  deleteStudentDocument,
  getTimetableVersions,
  saveTimetableVersion,
  rollbackTimetableVersion,
  getExamAnalytics,
  exportGradeSheetPDF,
  applySupplementary,
  getSupplementaryApplications,
  updateSupplementaryStatus,
  applyReEvaluation,
  getReEvaluationApplications,
  updateReEvaluationStatus,
} from '../controllers/campusCore';
import { authMiddleware, requireRole } from '../middleware/auth';
import { requireFeature } from '../middleware/permissions';
import { getAiConfig, saveAiConfig } from '../controllers/aiConfig';

const router = Router();

// Apply auth middleware to protect all routes (except public ID verify)
router.get('/idcards/verify/:studentId', verifyCard); // public check

router.use(authMiddleware);

// Apply feature toggle gates
router.use('/attendance', requireFeature('attendance'));
router.use('/students', requireFeature('students'));
router.use('/timetable', requireFeature('timetable'));
router.use('/classes', requireFeature('timetable'));
router.use('/fees', requireFeature('fees'));
router.use('/notices', requireFeature('notices'));
router.use('/exams', requireFeature('exams'));
router.use('/idcards', requireFeature('idcards'));
router.use('/assignments', requireFeature('students'));
router.use('/study-materials', requireFeature('students'));
router.use('/leaves', requireFeature('students'));
router.use('/wallet', requireFeature('fees'));
router.use('/transit', requireFeature('transit'));
router.use('/parent', requireFeature('parent_portal'));
router.use('/parent-link-child', requireFeature('parent_portal'));
router.use('/admissions', requireFeature('admissions'));
router.use('/calendar', requireFeature('timetable'));
router.use('/hostel', requireFeature('hostel'));
router.use('/gate', requireFeature('gate'));
router.use('/events', requireFeature('events'));
router.use('/library', requireFeature('library'));
router.use('/import/attendance', requireFeature('attendance'));
router.use('/import/students', requireFeature('students'));
router.use('/faculty/attendance', requireFeature('attendance'));
router.use('/faculty/leaves', requireFeature('students'));
router.use('/faculty/timetable', requireFeature('timetable'));
router.use('/faculty/cia', requireFeature('exams'));
router.use('/student/cia', requireFeature('exams'));
router.use('/exam-halls', requireFeature('exams'));
router.use('/exam-seating', requireFeature('exams'));
router.use('/reports/defaulters', requireFeature('fees'));

// =========================================================================
// 1. ATTENDANCE ROUTERS
// =========================================================================
router.post('/attendance/session/start', requireRole(['Staff', 'Teacher', 'Admin', 'SuperAdmin']), startSession);
router.get('/attendance/session/:id/qr', requireRole(['Staff', 'Teacher', 'Admin', 'SuperAdmin']), getSessionQr);
router.put('/attendance/session/:id/close', requireRole(['Staff', 'Teacher', 'Admin', 'SuperAdmin']), closeSession);
router.post('/attendance/mark/qr', requireRole(['Student']), markAttendanceQr);
router.post('/attendance/mark/biometric', markAttendanceBiometric);
router.post('/attendance/mark/bulk', requireRole(['Staff', 'Admin', 'SuperAdmin']), markAttendanceBulk);
router.post('/attendance/school/mark', requireRole(['Staff', 'Teacher', 'Admin', 'SuperAdmin']), markSchoolAttendanceBulk);
router.get('/attendance/school/report', requireRole(['Staff', 'Teacher', 'Admin', 'SuperAdmin']), getSchoolAttendanceReport);
router.get('/attendance/student/:id', getStudentAttendance);
router.get('/attendance/report/:departmentId', requireRole(['Staff', 'Admin', 'SuperAdmin']), getAttendanceReport);
router.post('/attendance/regularize', requireRole(['Student']), submitRegularize);
router.put('/attendance/regularize/:id/approve', requireRole(['Staff', 'Admin', 'SuperAdmin']), approveRegularize);
router.get('/attendance/fraud-logs', requireRole(['Staff', 'Admin', 'SuperAdmin']), getFraudLogs);

// =========================================================================
// 1b. ATTENDANCE METHODS (enable/disable per institution)
// =========================================================================
router.get('/attendance/methods', requireRole(['Admin', 'SuperAdmin', 'Director', 'HOD']), getAttendanceMethods);
router.put('/attendance/method', requireRole(['Admin', 'SuperAdmin', 'Director']), updateAttendanceMethod);
router.post('/attendance/methods/batch', requireRole(['Admin', 'SuperAdmin']), batchUpdateAttendanceMethods);

// =========================================================================
// 1c. BIOMETRIC / RFID DEVICE MANAGEMENT
// =========================================================================
router.get('/attendance/devices', requireRole(['Admin', 'SuperAdmin']), getAttendanceDevices);
router.post('/attendance/device', requireRole(['Admin', 'SuperAdmin']), registerAttendanceDevice);
router.put('/attendance/device/:id', requireRole(['Admin', 'SuperAdmin']), updateAttendanceDevice);
router.get('/attendance/device-logs', requireRole(['Admin', 'SuperAdmin']), getDeviceLogs);

// Device-to-server endpoints (authenticated by API key, not JWT)
router.post('/attendance/device/heartbeat', deviceHeartbeat);
router.post('/attendance/device/push', deviceAttendancePush);

// =========================================================================
// 2. STUDENTS CRUD ROUTERS
// =========================================================================
router.get('/students', getStudents);
router.post('/students', requireRole(['Admin', 'SuperAdmin']), createStudent);
router.get('/students/health-scores/report', requireRole(['Staff', 'Admin', 'SuperAdmin']), getHealthScoresReport);
router.post('/students/health-scores/calculate', requireRole(['Staff', 'Admin', 'SuperAdmin']), calculateHealthScores);
router.get('/students/:id/health-score', getStudentHealthScore);
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
router.get('/timetable/student/:studentId', getStudentTimetable);
router.post('/timetable/substitute', requireRole(['Admin', 'SuperAdmin']), assignSubstitute);

// Alias: /classes -> timetable lookup by department (supports ?department= query)
router.get('/classes', getTimetable);

// =========================================================================
// 4. FEES ROUTERS
// =========================================================================
router.get('/fees/structures', getFeeStructures);
router.post('/fees/structures', requireRole(['Admin', 'SuperAdmin']), createFeeStructure);
router.post('/fees/structures/clone', requireRole(['Admin', 'SuperAdmin']), cloneFeeStructures);
router.post('/fees/payment/initiate', requireRole(['Student', 'Parent']), initiatePayment);
router.post('/fees/payment/verify', requireRole(['Student', 'Parent']), verifyPayment);
router.post('/fees/refund', requireRole(['Admin', 'SuperAdmin']), processFeeRefund);
router.get('/fees/student/:studentId', getStudentFees);
router.get('/fees/report', requireRole(['Admin', 'SuperAdmin']), getFeesReport);
router.post('/fees/concession', requireRole(['Admin', 'SuperAdmin']), createConcession);
router.post('/fees/reminder/trigger', requireRole(['Admin', 'SuperAdmin']), triggerFeeReminders);
router.get('/fees/reminder/history', requireRole(['Admin', 'SuperAdmin']), getReminderHistory);
router.post('/fees/reminder/schedule', requireRole(['Admin', 'SuperAdmin']), toggleAutoReminders);
router.post('/fees/installment-plan', requireRole(['Admin', 'SuperAdmin']), createInstallmentPlan);
router.get('/fees/scholarship/eligible', requireRole(['Admin', 'SuperAdmin']), getEligibleScholarships);

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
router.get('/idcards/generate/:studentId', requireRole(['Admin', 'SuperAdmin', 'Student']), generateCard);
router.post('/idcards/generate/:studentId', requireRole(['Admin', 'SuperAdmin']), generateCard);
router.post('/idcards/generate/bulk', requireRole(['Admin', 'SuperAdmin']), generateBulkCards);

// =========================================================================
// 8. DATA IMPORT ROUTERS
// =========================================================================
router.post('/import/attendance', requireRole(['Admin', 'SuperAdmin', 'Director']), importAttendanceRecords);
router.post('/import/students', requireRole(['Admin', 'SuperAdmin', 'Director', 'HOD']), importStudentProfiles);

// =========================================================================
// 9. FEATURE LOGIC FIX ROUTERS
// =========================================================================
router.post('/fees/pay', requireRole(['Student']), initiateFeePayment);
router.post('/library/fines/pay', requireRole(['Student']), payLibraryFine);
router.post('/events/register', requireRole(['Student']), registerForEvent);
router.post('/gate/check', requireRole(['Security', 'Admin', 'SuperAdmin']), checkGateAccess);

// =========================================================================
// 10. ATTENDANCE WARNINGS ROUTERS
// =========================================================================
router.get('/attendance/warnings', requireRole(['Admin', 'SuperAdmin', 'Director']), getAttendanceWarnings);
router.get('/attendance/warning-logs', requireRole(['Admin', 'SuperAdmin']), getAttendanceWarningLogs);

// =========================================================================
// 11. FEE DEFAULTER ESCALATION ROUTERS
// =========================================================================
router.get('/fees/defaulters', requireRole(['Admin', 'SuperAdmin', 'Director', 'HOD']), getFeeDefaulters);
router.get('/fees/escalation-logs', requireRole(['Admin', 'SuperAdmin']), getFeeEscalationLogs);

// =========================================================================
// 12. EXAM HALLS & SEATING ROUTERS
// =========================================================================
router.get('/exam-halls', requireRole(['Admin', 'SuperAdmin', 'Teacher']), getExamHalls);
router.post('/exam-halls', requireRole(['Admin', 'SuperAdmin']), createExamHall);
router.get('/exam-seating', requireRole(['Admin', 'SuperAdmin', 'Teacher']), getExamSeating);
router.post('/exam-seating/allocate', requireRole(['Admin', 'SuperAdmin']), allocateSeating);

// =========================================================================
// 13. LOST & FOUND ROUTERS
// =========================================================================
router.get('/lost-found', requireRole(['Admin', 'SuperAdmin', 'Security', 'Student']), getLostFoundItems);
router.post('/lost-found', requireRole(['Admin', 'SuperAdmin', 'Security']), createLostFoundItem);
router.post('/lost-found/:id/claim', requireRole(['Student']), claimLostFoundItem);

// =========================================================================
// 14. PARENT LINK ROUTER
// =========================================================================
router.post('/parent-link-child', requireRole(['Parent']), linkParentToChild);

// =========================================================================
// 15. NOTICE READ RECEIPTS ROUTERS
// =========================================================================
router.get('/notices/:id/read-stats', requireRole(['Admin', 'SuperAdmin', 'Director']), getNoticeReadStats);

// =========================================================================
// 16. ASSIGNMENT SUBMISSION ROUTERS
// =========================================================================
router.get('/assignments', getAssignments);
router.post('/assignments', requireRole(['Admin', 'SuperAdmin', 'Teacher']), createAssignment);
router.get('/assignments/:id/submissions', requireRole(['Admin', 'SuperAdmin', 'Teacher']), getAssignmentSubmissions);
router.put('/assignments/submissions/:id/grade', requireRole(['Admin', 'SuperAdmin', 'Teacher']), gradeAssignment);

// =========================================================================
// 17. STUDY MATERIAL ROUTERS
// =========================================================================
router.get('/study-materials', getStudyMaterials);
router.post('/study-materials', requireRole(['Admin', 'SuperAdmin', 'Teacher']), createStudyMaterial);

// =========================================================================
// 18. LEAVE APPLICATION ROUTERS
// =========================================================================
router.get('/leaves/my', requireRole(['Student']), getMyLeaves);
router.get('/leaves/department', requireRole(['Admin', 'SuperAdmin', 'Teacher', 'HOD']), getDepartmentLeaves);

// =========================================================================
// 19. WALLET ROUTERS
// =========================================================================
router.get('/wallet/balance', requireRole(['Student']), getWalletBalance);
router.get('/wallet/transactions', requireRole(['Student']), getWalletTransactions);

// =========================================================================
// 20. BUS ETA ROUTER
// =========================================================================
router.get('/transit/eta', requireRole(['Student']), getMyBusETA);

// =========================================================================
// 21. PARENT MODULE ROUTERS
// =========================================================================
router.get('/parent/child-info', requireRole(['Parent']), getParentChildInfo);
router.get('/parent/daily-summary', requireRole(['Parent']), getParentDailySummary);
router.get('/parent/fee-summary', requireRole(['Parent']), getParentFeeSummary);
router.get('/parent/wallet', requireRole(['Parent']), getParentWallet);
router.post('/parent/wallet/topup', requireRole(['Parent']), parentTopupWallet);
router.get('/parent/notifications', requireRole(['Parent']), getParentNotifications);
router.put('/parent/notifications/:id/read', requireRole(['Parent']), markParentNotificationRead);
router.get('/parent/notifications/unread-count', requireRole(['Parent']), getParentUnreadCount);
router.get('/parent/child/bus-status', requireRole(['Parent']), getChildBusStatus);
router.post('/parent/visitor/preauthorize', requireRole(['Parent']), preauthorizeVisitor);
router.get('/parent/visitor/preauths', requireRole(['Parent']), getParentVisitorPreauths);
router.post('/parent/leave/apply', requireRole(['Parent']), parentApplyLeave);
router.get('/parent/leave/list', requireRole(['Parent']), getParentLeaveList);

// =========================================================================
// 22. FACULTY MODULE ROUTERS
// =========================================================================
router.get('/student/cia/marks', requireRole(['Student']), getMyCiaMarks);
router.get('/faculty/cia/assessments', requireRole(['Teacher', 'Staff', 'Admin', 'SuperAdmin']), getCiaAssessments);
router.post('/faculty/cia/assessments', requireRole(['Teacher', 'Staff', 'Admin', 'SuperAdmin']), createCiaAssessment);
router.get('/faculty/cia/marks/:assessmentId', requireRole(['Teacher', 'Staff', 'Admin', 'SuperAdmin']), getCiaMarks);
router.post('/faculty/cia/marks', requireRole(['Teacher', 'Staff', 'Admin', 'SuperAdmin']), enterCiaMarks);
router.get('/faculty/attendance/shortage', requireRole(['Teacher', 'Staff', 'Admin', 'SuperAdmin']), getAttendanceShortageReport);
router.get('/faculty/leaves/pending', requireRole(['Teacher', 'Staff', 'Admin', 'SuperAdmin']), getPendingLeaves);
router.put('/faculty/leaves/:id/approve', requireRole(['Teacher', 'Staff', 'Admin', 'SuperAdmin']), approveLeaveFaculty);
router.put('/faculty/leaves/:id/reject', requireRole(['Teacher', 'Staff', 'Admin', 'SuperAdmin']), rejectLeaveFaculty);
router.get('/faculty/timetable', requireRole(['Teacher', 'Staff']), getTeacherTimetable);
router.get('/faculty/students', requireRole(['Teacher', 'Staff', 'HOD', 'Admin', 'SuperAdmin']), getFacultyStudents);

// =========================================================================
// 23. ADMISSION WORKFLOW ROUTERS
// =========================================================================
router.get('/admissions/list', requireRole(['Admin', 'SuperAdmin', 'Director']), getAdmissions);
router.post('/admissions/new', requireRole(['Admin', 'SuperAdmin', 'Director']), createAdmission);
router.put('/admissions/:id/status', requireRole(['Admin', 'SuperAdmin', 'Director']), updateAdmissionStatus);
router.post('/admissions/documents', requireRole(['Admin', 'SuperAdmin', 'Director']), uploadAdmissionDocument);
router.post('/admissions/bulk', requireRole(['Admin', 'SuperAdmin']), bulkAdmitStudents);

// =========================================================================
// 24. TIMETABLE AUTO-GENERATION ROUTERS
// =========================================================================
router.post('/timetable/detect-conflicts', requireRole(['Admin', 'SuperAdmin', 'HOD']), detectTimetableConflicts);
router.post('/timetable/auto-generate', requireRole(['Admin', 'SuperAdmin', 'HOD']), autoGenerateTimetable);
router.get('/timetable/constraints', requireRole(['Admin', 'SuperAdmin', 'HOD']), getTimetableConstraints);
router.post('/timetable/constraints', requireRole(['Admin', 'SuperAdmin', 'HOD']), createTimetableConstraint);

// =========================================================================
// 25. CONSOLIDATED DEFAULTER REPORT
// =========================================================================
router.get('/reports/defaulters', requireRole(['Admin', 'SuperAdmin', 'Director', 'HOD']), getConsolidatedDefaulters);

// =========================================================================
// 26. ACADEMIC CALENDAR ROUTERS
// =========================================================================
router.get('/calendar', requireRole(['Admin', 'SuperAdmin', 'Director', 'Teacher', 'Staff', 'Student']), getAcademicCalendar);
router.post('/calendar', requireRole(['Admin', 'SuperAdmin', 'Director']), createCalendarEvent);
router.put('/calendar/:id', requireRole(['Admin', 'SuperAdmin', 'Director']), updateCalendarEvent);
router.delete('/calendar/:id', requireRole(['Admin', 'SuperAdmin', 'Director']), deleteCalendarEvent);
router.get('/calendar/holidays', requireRole(['Admin', 'SuperAdmin', 'Director', 'Teacher', 'Staff', 'Student']), getHolidays);
router.post('/calendar/holidays', requireRole(['Admin', 'SuperAdmin', 'Director']), createHoliday);

// =========================================================================
// 27. WARDEN MODULE ROUTERS
// =========================================================================
router.put('/hostel/visitors/:id/approve', requireRole(['Warden', 'Admin', 'SuperAdmin']), approveVisitor);
router.get('/hostel/unallocated-students', requireRole(['Warden', 'Admin', 'SuperAdmin']), getUnallocatedStudents);
router.put('/hostel/allocations/:id/checkout', requireRole(['Warden', 'Admin', 'SuperAdmin']), checkoutRoom);
router.post('/hostel/curfew/mark', requireRole(['Warden', 'Admin', 'SuperAdmin']), markCurfewCheckin);
router.get('/hostel/curfew/status', requireRole(['Warden', 'Admin', 'SuperAdmin']), getCurfewStatus);
router.get('/hostel/meal-subscriptions', requireRole(['Warden', 'Admin', 'SuperAdmin']), getBlockMealSubscriptions);
router.get('/hostel/transfers', requireRole(['Warden', 'Admin', 'SuperAdmin', 'Student']), getRoomTransferRequests);
router.put('/hostel/transfers/:id/approve', requireRole(['Warden', 'Admin', 'SuperAdmin']), approveRoomTransfer);
router.put('/hostel/transfers/:id/complete', requireRole(['Admin', 'SuperAdmin']), completeRoomTransfer);

// =========================================================================
// 28. SECURITY MODULE ROUTERS
// =========================================================================
router.get('/gate/verify/:identifier', requireRole(['Security', 'Admin', 'SuperAdmin', 'Warden']), verifyPersonAtGate);
router.get('/gate/scan/:identifier', requireRole(['Security', 'Admin', 'SuperAdmin']), gateScanLookup);
router.get('/gate/visitors-today', requireRole(['Security', 'Admin', 'SuperAdmin', 'Warden']), getApprovedVisitorsToday);
router.get('/gate/restricted/:personId', requireRole(['Security', 'Admin', 'SuperAdmin']), checkPersonRestricted);
router.get('/gate/restrictions', requireRole(['Security', 'Admin', 'SuperAdmin']), getAccessRestrictions);
router.post('/gate/restrictions', requireRole(['Admin', 'SuperAdmin']), createAccessRestriction);
router.post('/gate/vehicle/entry', requireRole(['Security', 'Admin', 'SuperAdmin']), vehicleEntry);
router.put('/gate/vehicle/:id/exit', requireRole(['Security', 'Admin', 'SuperAdmin']), vehicleExit);
router.get('/gate/vehicle-logs', requireRole(['Security', 'Admin', 'SuperAdmin']), getVehicleLogs);
router.get('/gate/event-attendees', requireRole(['Security', 'Admin', 'SuperAdmin']), getTodaysEventAttendees);

// =========================================================================
// 29. DRIVER MODULE ROUTERS
// =========================================================================
router.get('/driver/assignments', requireRole(['Driver']), getDriverAssignments);
router.get('/driver/today-trip', requireRole(['Driver']), getDriverTodayTrip);
router.post('/driver/trip/start', requireRole(['Driver']), startBusTrip);
router.put('/driver/trip/:id/end', requireRole(['Driver']), endBusTrip);
router.get('/driver/headcount', requireRole(['Driver']), getDriverHeadcount);
router.get('/driver/stops', requireRole(['Driver']), getDriverStopSchedule);
router.post('/driver/stops/reach', requireRole(['Driver']), markStopReached);
router.post('/driver/incident', requireRole(['Driver']), reportBusIncident);

// =========================================================================
// 30. VENDOR / CANTEEN MODULE ROUTERS
// =========================================================================
router.get('/vendor/orders', requireRole(['Vendor', 'Admin', 'SuperAdmin']), getVendorOrders);
router.put('/vendor/orders/:id/status', requireRole(['Vendor', 'Admin', 'SuperAdmin']), updateOrderStatus);
router.put('/vendor/menu/:id/availability', requireRole(['Vendor', 'Admin', 'SuperAdmin']), toggleMenuAvailability);
router.put('/vendor/menu/:id/price', requireRole(['Vendor', 'Admin', 'SuperAdmin']), updateMenuPrice);
router.put('/vendor/menu/:id/stock', requireRole(['Vendor', 'Admin', 'SuperAdmin']), updateMenuStock);
router.get('/vendor/sales', requireRole(['Vendor', 'Admin', 'SuperAdmin']), getVendorDailySales);
router.get('/vendor/prep-list', requireRole(['Vendor', 'Admin', 'SuperAdmin']), getPrepList);

// =========================================================================
// 31. WHATSAPP API CONFIGURATION (Admin only)
// =========================================================================
import { getWhatsAppConfig, saveWhatsAppConfig, testWhatsAppMessage, getWhatsAppDeliveryLog } from '../controllers/whatsappConfig';

router.get('/whatsapp/config', requireRole(['Admin', 'SuperAdmin']), getWhatsAppConfig);
router.post('/whatsapp/config', requireRole(['Admin', 'SuperAdmin']), saveWhatsAppConfig);
router.post('/whatsapp/test', requireRole(['Admin', 'SuperAdmin']), testWhatsAppMessage);
router.get('/whatsapp/delivery-log', requireRole(['Admin', 'SuperAdmin']), getWhatsAppDeliveryLog);

// =========================================================================
// 32. USER MANAGEMENT (Admin only)
// =========================================================================
import {
  listUsers, getUserById, createUser, updateUser,
  deactivateUser, reactivateUser, resetUserPassword,
  getUserRoleStats, getDepartments, createDepartment,
  updateDepartment, deleteDepartment
} from '../controllers/userManagement';

router.get('/users', requireRole(['Admin', 'SuperAdmin']), listUsers);
router.get('/users/stats', requireRole(['Admin', 'SuperAdmin']), getUserRoleStats);
router.get('/users/departments', requireRole(['Admin', 'SuperAdmin']), getDepartments);
router.get('/users/:userId', requireRole(['Admin', 'SuperAdmin']), getUserById);
router.post('/users', requireRole(['Admin', 'SuperAdmin']), createUser);
router.put('/users/:userId', requireRole(['Admin', 'SuperAdmin']), updateUser);
router.post('/users/:userId/deactivate', requireRole(['Admin', 'SuperAdmin']), deactivateUser);
router.post('/users/:userId/reactivate', requireRole(['Admin', 'SuperAdmin']), reactivateUser);
router.post('/users/:userId/reset-password', requireRole(['Admin', 'SuperAdmin']), resetUserPassword);

router.get('/departments', requireRole(['Admin', 'SuperAdmin']), getDepartments);
router.post('/departments', requireRole(['Admin', 'SuperAdmin']), createDepartment);
router.put('/departments', requireRole(['Admin', 'SuperAdmin']), updateDepartment);
router.delete('/departments', requireRole(['Admin', 'SuperAdmin']), deleteDepartment);

// =========================================================================
// 27. GENERAL WALLET DEDUCTION
// =========================================================================
router.post('/wallet/deduct', requireRole(['Admin', 'SuperAdmin', 'Student']), deductWallet);
router.post('/wallet/credit', requireRole(['Student']), creditWallet);
router.post('/wallet/topup/initiate', requireRole(['Student']), initiateWalletTopUp);

// =========================================================================
// 28. COURSE REGISTRATION
// =========================================================================
router.get('/courses/available', requireRole(['Student']), getAvailableCourses);
router.get('/courses/my', requireRole(['Student']), getMyCourses);
router.post('/courses/register', requireRole(['Student']), registerForCourse);
router.post('/courses/drop', requireRole(['Student']), dropCourse);

// =========================================================================
// 29. CIA UNIVERSITY PORTAL EXPORT
// =========================================================================
router.get('/cia/export', requireRole(['Admin', 'SuperAdmin', 'Teacher', 'Staff']), exportCiaMarks);

// =========================================================================
// 33. EXAM ENROLLMENT & HALL TICKET ROUTERS
// =========================================================================
router.post('/exams/:id/enroll', requireRole(['Student']), enrollInExam);
router.get('/exams/:id/enrollments', requireRole(['Admin', 'SuperAdmin', 'Teacher']), getExamEnrollments);
router.get('/exams/my-enrollments', requireRole(['Student']), getMyExamEnrollments);
router.delete('/exams/enrollment/:id', requireRole(['Student']), cancelEnrollment);
router.post('/hall-tickets/generate', requireRole(['Admin', 'SuperAdmin']), generateHallTickets);
router.get('/hall-tickets/my', requireRole(['Student']), getMyHallTickets);
router.get('/hall-tickets/:id', getHallTicketDetail);
router.get('/hall-tickets/:id/pdf', downloadHallTicketPdf);

// =========================================================================
// 34. STUDENT DOCUMENTS & PROFILE PHOTO ROUTERS
// =========================================================================
router.post('/students/:id/photo', requireRole(['Admin', 'SuperAdmin', 'Student', 'HOD']), uploadStudentPhoto);
router.post('/students/:id/documents', requireRole(['Admin', 'SuperAdmin', 'Staff', 'Teacher', 'HOD']), uploadStudentDocument);
router.get('/students/:id/documents', getStudentDocuments);
router.delete('/students/:id/documents/:docId', requireRole(['Admin', 'SuperAdmin', 'Staff', 'HOD']), deleteStudentDocument);

// =========================================================================
// 35. TIMETABLE HISTORY & ROLLBACK ROUTERS
// =========================================================================
router.get('/timetable/history/versions', requireRole(['Admin', 'SuperAdmin', 'Director', 'HOD']), getTimetableVersions);
router.post('/timetable/history/save', requireRole(['Admin', 'SuperAdmin']), saveTimetableVersion);
router.post('/timetable/history/rollback', requireRole(['Admin', 'SuperAdmin']), rollbackTimetableVersion);

// =========================================================================
// 36. EXAM ANALYTICS, SUPPLEMENTARY & RE-EVALUATION ROUTERS
// =========================================================================
router.get('/exams/:id/analytics', requireRole(['Admin', 'SuperAdmin', 'Director', 'Teacher', 'HOD']), getExamAnalytics);
router.get('/exams/gradesheet/:studentId/:examId/pdf', requireRole(['Admin', 'SuperAdmin', 'Director', 'Teacher', 'HOD', 'Student', 'Parent']), exportGradeSheetPDF);
router.post('/exams/supplementary/apply', requireRole(['Student']), applySupplementary);
router.get('/exams/supplementary/applications', requireRole(['Admin', 'SuperAdmin', 'Director', 'Staff', 'Teacher', 'HOD']), getSupplementaryApplications);
router.put('/exams/supplementary/applications/:id/status', requireRole(['Admin', 'SuperAdmin', 'Staff', 'HOD']), updateSupplementaryStatus);
router.post('/exams/re-evaluation/apply', requireRole(['Student']), applyReEvaluation);
router.get('/exams/re-evaluation/applications', requireRole(['Admin', 'SuperAdmin', 'Director', 'Staff', 'Teacher', 'HOD']), getReEvaluationApplications);
router.put('/exams/re-evaluation/applications/:id/status', requireRole(['Admin', 'SuperAdmin', 'Staff', 'HOD']), updateReEvaluationStatus);

// =========================================================================
// 37. AI API CONFIGURATION (Admin only)
// =========================================================================
router.get('/ai/config', requireRole(['Admin', 'SuperAdmin']), getAiConfig);
router.post('/ai/config', requireRole(['Admin', 'SuperAdmin']), saveAiConfig);

export default router;
