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
  logEquipmentUsage,
  logFitnessMetrics,
  getFitnessMetrics,
  logWorkout,
  getStudentWorkouts,
  generateFitnessReportPdf
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
router.post('/gym/equipment/usage', logEquipmentUsage);

// ========== 5. FITNESS & PROGRESS TRACKING ==========
router.post('/gym/metrics', requireRole(['Staff', 'Gym Trainer', 'Admin', 'SuperAdmin']), logFitnessMetrics);
router.get('/gym/metrics/:studentId', getFitnessMetrics);

router.post('/gym/workouts', requireRole(['Student']), logWorkout);
router.get('/gym/workouts/:studentId', getStudentWorkouts);

router.get('/gym/report/:studentId', generateFitnessReportPdf);

export default router;
