import { Router } from 'express';
import {
  getGymSlots,
  createGymSlot,
  updateGymSlot,
  deleteGymSlot,
  bookGymSlot,
  getStudentBookings,
  cancelGymBooking,
  checkinGymBooking,
  getSlotBookings,
  getMembershipPlans,
  createMembershipPlan,
  initiateMembershipPurchase,
  verifyMembershipPurchase,
  getStudentMembership,
  freezeMembership,
  unfreezeMembership,
  getTrainers,
  createTrainer,
  requestTrainerSession,
  updateTrainerSessionStatus,
  getTrainerSessions,
  getEquipment,
  createEquipment,
  updateEquipment,
  logEquipmentMaintenance,
  getMaintenanceDue,
  getEquipmentMaintenanceLogs,
  logEquipmentUsage,
  logFitnessMetrics,
  getFitnessMetrics,
  logWorkout,
  getStudentWorkouts,
  generateFitnessReportPdf,
  generateAiWorkoutPlan,
  getActiveAiPlan,
  adjustAiPlan,
  logWellnessCheckin,
  getWellnessStats,
  getChallenges,
  createChallenge,
  joinChallenge,
  logChallengeProgress,
  getChallengeLeaderboard,
  getVirtualClasses,
  createVirtualClass,
  streamVirtualClass,
  getStudentFitPoints,
  getFitPointsLeaderboard
} from '../controllers/fitzone';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to protect all routes
router.use(authMiddleware);

// ========== 1. GYM SLOTS & BOOKINGS ==========
router.get('/gym/slots', getGymSlots);
router.post('/gym/slots', requireRole(['Admin', 'SuperAdmin']), createGymSlot);
router.put('/gym/slots/:id', requireRole(['Admin', 'SuperAdmin']), updateGymSlot);
router.delete('/gym/slots/:id', requireRole(['Admin', 'SuperAdmin']), deleteGymSlot);

router.post('/gym/bookings', requireRole(['Student']), bookGymSlot);
router.get('/gym/bookings/student/:studentId', getStudentBookings);
router.post('/gym/bookings/:id/cancel', cancelGymBooking);
router.post('/gym/bookings/:id/checkin', requireRole(['Staff', 'Gym Trainer', 'Admin', 'SuperAdmin']), checkinGymBooking);
router.get('/gym/bookings/slot/:slotId', requireRole(['Staff', 'Gym Trainer', 'Admin', 'SuperAdmin']), getSlotBookings);

// ========== 2. MEMBERSHIPS & PLANS ==========
router.get('/gym/membership-plans', getMembershipPlans);
router.post('/gym/membership-plans', requireRole(['Admin', 'SuperAdmin']), createMembershipPlan);

router.post('/gym/memberships/purchase/initiate', requireRole(['Student']), initiateMembershipPurchase);
router.post('/gym/memberships/purchase/verify', requireRole(['Student']), verifyMembershipPurchase);
router.get('/gym/memberships/:studentId', getStudentMembership);
router.post('/gym/memberships/:id/freeze', freezeMembership);
router.post('/gym/memberships/:id/unfreeze', unfreezeMembership);

// ========== 3. TRAINER PLANS & SESSIONS ==========
router.get('/gym/trainers', getTrainers);
router.post('/gym/trainers', requireRole(['Admin', 'SuperAdmin']), createTrainer);

router.post('/gym/trainer-sessions/request', requireRole(['Student']), requestTrainerSession);
router.put('/gym/trainer-sessions/:id/status', requireRole(['Staff', 'Gym Trainer', 'Admin', 'SuperAdmin']), updateTrainerSessionStatus);
router.get('/gym/trainer-sessions/:trainerId', getTrainerSessions);

// ========== 4. EQUIPMENT INVENTORY ==========
router.get('/gym/equipment', getEquipment);
router.post('/gym/equipment', requireRole(['Admin', 'SuperAdmin']), createEquipment);
router.put('/gym/equipment/:id', requireRole(['Admin', 'SuperAdmin']), updateEquipment);
router.post('/gym/equipment/:id/maintenance', requireRole(['Admin', 'SuperAdmin']), logEquipmentMaintenance);
router.get('/gym/equipment/maintenance-due', requireRole(['Admin', 'SuperAdmin']), getMaintenanceDue);
router.get('/gym/equipment/:id/maintenance-logs', requireRole(['Admin', 'SuperAdmin']), getEquipmentMaintenanceLogs);
router.post('/gym/equipment/usage', logEquipmentUsage);

// ========== 5. FITNESS & PROGRESS TRACKING ==========
router.post('/gym/metrics', requireRole(['Staff', 'Gym Trainer', 'Admin', 'SuperAdmin']), logFitnessMetrics);
router.get('/gym/metrics/:studentId', getFitnessMetrics);

router.post('/gym/workouts', requireRole(['Student']), logWorkout);
router.get('/gym/workouts/:studentId', getStudentWorkouts);

router.get('/gym/report/:studentId', generateFitnessReportPdf);

// ========== 6. AI WORKOUT PLANS ==========
router.post('/gym/ai-plan/generate', requireRole(['Student']), generateAiWorkoutPlan);
router.get('/gym/ai-plan/:studentId/active', getActiveAiPlan);
router.post('/gym/ai-plan/:id/adjust', adjustAiPlan);

// ========== 7. WELLNESS CHECKINS ==========
router.post('/gym/wellness/checkin', requireRole(['Student']), logWellnessCheckin);
router.get('/gym/wellness/:studentId', getWellnessStats);

// ========== 8. FITNESS CHALLENGES & FITPOINTS ==========
router.get('/gym/challenges', getChallenges);
router.post('/gym/challenges', requireRole(['Admin', 'SuperAdmin']), createChallenge);
router.post('/gym/challenges/:id/join', requireRole(['Student']), joinChallenge);
router.post('/gym/challenges/:id/log', requireRole(['Student']), logChallengeProgress);
router.get('/gym/challenges/:id/leaderboard', getChallengeLeaderboard);

router.get('/gym/fitpoints/:studentId', getStudentFitPoints);
router.get('/gym/leaderboard', getFitPointsLeaderboard);

// ========== 9. VIRTUAL CLASSES ==========
router.get('/gym/classes', getVirtualClasses);
router.post('/gym/classes', requireRole(['Staff', 'Gym Trainer', 'Admin', 'SuperAdmin']), createVirtualClass);
router.get('/gym/classes/:id/stream', streamVirtualClass);

export default router;
