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
  getDrivers,
  analyzeRouteOptimizer,
  getSuggestions,
  approveSuggestion,
  getPredictiveArrival,
  triggerSos,
  getSosAlerts,
  resolveSos,
  getSosReport,
  getCarbonFootprint,
  issueCarbonCertificate,
  registerVehicle,
  getParkingSlots,
  occupyParkingSlot,
  getParkingAlerts,
  ingestGpsTelemetry,
  recordStudentTransitTap,
  getLiveBuses,
  getMyBuses
} from '../controllers/transit';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// --- UN-AUTHENTICATED HARDWARE TELEMETRY ROUTE ---
router.post('/telemetry/gps', ingestGpsTelemetry);

// Apply auth middleware to protect all other routes
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
router.post('/trips/:id/tap', requireRole(['Driver', 'Admin', 'SuperAdmin']), recordStudentTransitTap);

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

// --- AI ROUTE OPTIMIZER (NEW) ---
router.post('/ai-route-optimizer/analyze', requireRole(['Admin', 'SuperAdmin']), analyzeRouteOptimizer);
router.get('/ai-route-optimizer/suggestions', requireRole(['Admin', 'SuperAdmin']), getSuggestions);
router.post('/ai-route-optimizer/approve/:id', requireRole(['Admin', 'SuperAdmin']), approveSuggestion);

// --- ML PREDICTIVE ARRIVAL (NEW) ---
router.get('/routes/:id/predictive-arrival', getPredictiveArrival);

// --- PARENT SOS SYSTEM (NEW) ---
router.post('/sos/trigger', triggerSos);
router.get('/sos/alerts', getSosAlerts);
router.post('/sos/resolve/:id', resolveSos);
router.get('/sos/report/:id', getSosReport);

// --- CARBON FOOTPRINT TRACKER (NEW) ---
router.get('/carbon/tracker', getCarbonFootprint);
router.post('/carbon/issue-certificate', requireRole(['Admin', 'SuperAdmin']), issueCarbonCertificate);

// --- CAMPUS PARKING MANAGEMENT (NEW) ---
router.post('/parking/register', registerVehicle);
router.get('/parking/slots', getParkingSlots);
router.post('/parking/occupy', occupyParkingSlot);
router.get('/parking/alerts', requireRole(['Admin', 'SuperAdmin']), getParkingAlerts);

// --- LIVE BUS TRACKING (NEW) ---
router.get('/live', getLiveBuses);
router.get('/my-buses', requireRole(['Driver', 'Admin', 'SuperAdmin']), getMyBuses);

export default router;

