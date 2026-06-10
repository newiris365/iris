import { Router } from 'express';
import {
  getRoutes,
  getRouteDetail,
  createRoute,
  updateRoute,
  getBuses,
  createBus,
  updateBus,
  startTrip,
  endTrip,
  getTrips,
  stopReached,
  updateBusLocation,
  getLatestPosition,
  getTrackingHistory,
  subscribeToBus,
  deleteSubscription,
  getMySubscription,
  getStudentsForRoute,
  createIncident,
  getIncidents,
  updateIncidentStatus,
  createMaintenance,
  getMaintenance,
  getLatestPositionsAll,
  getDrivers
} from '../controllers/transit';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to protect all routes
router.use(authMiddleware);

// --- ROUTE MANAGEMENT ---
router.get('/routes', getRoutes);
router.get('/routes/:id', getRouteDetail);
router.post('/routes', requireRole(['Admin', 'SuperAdmin']), createRoute);
router.put('/routes/:id', requireRole(['Admin', 'SuperAdmin']), updateRoute);
router.get('/routes/:id/map', getRouteDetail);
router.get('/routes/:id/students', requireRole(['Admin', 'SuperAdmin', 'Driver']), getStudentsForRoute);

// --- BUS FLEET ---
router.get('/buses', getBuses);
router.post('/buses', requireRole(['Admin', 'SuperAdmin']), createBus);
router.put('/buses/:id', requireRole(['Admin', 'SuperAdmin']), updateBus);
router.get('/drivers', requireRole(['Admin', 'SuperAdmin']), getDrivers);
router.get('/buses/:id/tracking', getLatestPosition);

// --- TRIP CONTROLS ---
router.post('/trips/start', requireRole(['Driver', 'Admin', 'SuperAdmin']), startTrip);
router.put('/trips/:id/end', requireRole(['Driver', 'Admin', 'SuperAdmin']), endTrip);
router.get('/trips/:busId', getTrips);
router.post('/trips/:id/stop-reached', requireRole(['Driver', 'Admin', 'SuperAdmin']), stopReached);

// --- TELEMETRY & TRACKING ---
router.post('/location', requireRole(['Driver', 'Admin', 'SuperAdmin']), updateBusLocation);
router.post('/location/update', requireRole(['Driver', 'Admin', 'SuperAdmin']), updateBusLocation);
router.get('/tracking/all', requireRole(['Admin', 'SuperAdmin']), getLatestPositionsAll);
router.get('/tracking/:busId', getLatestPosition);
router.get('/tracking/:busId/history', getTrackingHistory);

// --- SUBSCRIPTIONS ---
router.post('/subscriptions', subscribeToBus);
router.delete('/subscriptions/:id', deleteSubscription);
router.get('/subscriptions/student/:studentId', getMySubscription);

// --- INCIDENTS ---
router.post('/incidents', requireRole(['Driver', 'Admin', 'SuperAdmin']), createIncident);
router.get('/incidents', getIncidents);
router.put('/incidents/:id/status', requireRole(['Admin', 'SuperAdmin']), updateIncidentStatus);

// --- VEHICLE MAINTENANCE ---
router.post('/maintenance', requireRole(['Admin', 'SuperAdmin']), createMaintenance);
router.get('/maintenance', requireRole(['Admin', 'SuperAdmin']), getMaintenance);

export default router;
