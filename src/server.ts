import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from './config/logger';
import { globalLimiter, authLimiter } from './middleware/rateLimit';
import { requireSupabaseOnline } from './config/supabase';
import authRouter from './routes/auth';
import coreRouter from './routes/campusCore';
import canteenRouter from './routes/canteen';
import hostelGateRouter from './routes/hostelGate';
import libEventsRouter from './routes/libraryEvents';
import fitzoneRouter from './routes/fitzone';
import eventsRouter from './routes/events';
import hostelRouter from './routes/hostel';
import transitRouter from './routes/transit';
import directorRouter from './routes/director';
import aiConciergeRouter from './routes/aiConcierge';
import libraryRouter from './routes/library';
import gateRouter from './routes/gate';
import parentRouter from './routes/parent';
import admissionsRouter from './routes/admissions';
import placementsRouter from './routes/placements';
import obeRouter from './routes/obe';
import naacRouter from './routes/naac';
import hrRouter from './routes/hr';
import permissionsRouter from './routes/permissions';
import grievancesRouter from './routes/grievances';
import attendanceEngineRouter from './services/attendanceEngine/routes';
import { initGateHardware } from './services/gateHardware';
import { authMiddleware } from './middleware/auth';
import { requireFeature } from './middleware/permissions';
import { razorpayWebhook } from './controllers/campusCore';

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('CRITICAL SECURITY VIOLATION: JWT_SECRET environment variable is required and must be at least 32 characters in length to prevent brute-force signature forgery!');
}
const JWT_SECRET = process.env.JWT_SECRET;

// Defer cron jobs initialization to avoid blocking server startup
// Cron jobs are loaded after the server is listening (see httpServer.listen below)

const app = express();
const PORT = process.env.PORT || 4000;

// Create HTTP server for Socket.io attachment
const httpServer = http.createServer(app);

// Socket.io realtime gateway
const io = new SocketServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Enforce authentication on all Socket.io connections
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if (!token) {
    logger.warn('Socket connection rejected: Authentication token missing', { socketId: socket.id });
    return next(new Error('Authentication error: Token missing'));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (socket as any).user = decoded;
    next();
  } catch (err) {
    logger.warn('Socket connection rejected: Invalid authentication token', { socketId: socket.id });
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.io namespace: Transit GPS telemetry
const transitNs = io.of('/transit');
transitNs.on('connection', (socket) => {
  logger.info('Transit client connected', { socketId: socket.id });

  socket.on('subscribe_bus', (busId: string) => {
    socket.join(`bus_${busId}`);
    logger.debug(`Socket ${socket.id} subscribed to bus_${busId}`);
  });

  socket.on('unsubscribe_bus', (busId: string) => {
    socket.leave(`bus_${busId}`);
  });

  socket.on('subscribe_admin', () => {
    socket.join('admin:transit');
    logger.debug(`Socket ${socket.id} subscribed to admin:transit`);
  });

  socket.on('unsubscribe_admin', () => {
    socket.leave('admin:transit');
  });

  socket.on('disconnect', () => {
    logger.debug('Transit client disconnected', { socketId: socket.id });
  });
});

// Socket.io namespace: Live notifications
const notificationsNs = io.of('/notifications');
notificationsNs.on('connection', (socket) => {
  logger.info('Notifications client connected', { socketId: socket.id });

  socket.on('join_institution', (institutionId: string) => {
    socket.join(`institution_${institutionId}`);
  });

  socket.on('disconnect', () => {
    logger.debug('Notifications client disconnected', { socketId: socket.id });
  });
});

// Socket.io namespace: Live gate activity feed
const gateNs = io.of('/gate');
gateNs.on('connection', (socket) => {
  logger.info('Gate client connected', { socketId: socket.id });

  socket.on('subscribe_admin_gate', () => {
    socket.join('admin:gate');
    logger.debug(`Socket ${socket.id} joined admin:gate`);
  });

  socket.on('subscribe_security', () => {
    socket.join('admin:security');
    logger.debug(`Socket ${socket.id} joined admin:security`);
  });

  socket.on('disconnect', () => {
    logger.debug('Gate client disconnected', { socketId: socket.id });
  });
});

// Socket.io namespace: Canteen live order tracking
const canteenNs = io.of('/canteen');
canteenNs.on('connection', (socket) => {
  logger.info('Canteen client connected', { socketId: socket.id });

  socket.on('join_kitchen', (institutionId: string) => {
    socket.join(`kitchen_${institutionId}`);
    logger.debug(`Socket ${socket.id} joined kitchen_${institutionId}`);
  });

  socket.on('track_order', (orderId: string) => {
    socket.join(`order_${orderId}`);
    logger.debug(`Socket ${socket.id} tracking order_${orderId}`);
  });

  socket.on('order_status_update', (data: { orderId: string; status: string; institutionId: string }) => {
    // Broadcast to the specific order room and kitchen
    canteenNs.to(`order_${data.orderId}`).emit('status_changed', data);
    canteenNs.to(`kitchen_${data.institutionId}`).emit('queue_updated', data);
  });

  socket.on('disconnect', () => {
    logger.debug('Canteen client disconnected', { socketId: socket.id });
  });
});

// Socket.io namespace: Director Dashboard telemetry
const directorNs = io.of('/director');
directorNs.on('connection', (socket) => {
  logger.info('Director client connected', { socketId: socket.id });

  socket.on('subscribe_director_kpis', () => {
    socket.join('director:dashboard');
    logger.debug(`Socket ${socket.id} joined director:dashboard`);
  });

  socket.on('disconnect', () => {
    logger.debug('Director client disconnected', { socketId: socket.id });
  });
});

// Socket.io namespace: Live Event Interactive Panel
const eventsNs = io.of('/events-live');
eventsNs.on('connection', (socket) => {
  logger.info('Live Event client connected', { socketId: socket.id });

  socket.on('join_event', (eventId: string) => {
    socket.join(`event_${eventId}`);
    logger.debug(`Socket ${socket.id} joined event_${eventId}`);
  });

  socket.on('disconnect', () => {
    logger.debug('Live Event client disconnected', { socketId: socket.id });
  });
});

// Periodically broadcast KPI updates to director:dashboard room every 30 seconds
if (process.env.NODE_ENV !== 'test') {
  setInterval(async () => {
    try {
      directorNs.to('director:dashboard').emit('director:kpis_updated', {
        attendance_rate: 80 + Math.floor(Math.random() * 12),
        fee_collected_today: 185000 + Math.floor(Math.random() * 15000),
        students_on_campus: 40 + Math.floor(Math.random() * 20),
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      logger.error('Failed broadcasting director KPIs:', err);
    }
  }, 30000);
}

// Export io for use in controllers (e.g. transit GPS broadcast)
export { io, transitNs, notificationsNs, canteenNs, gateNs, directorNs, eventsNs };

// Trust upstream proxy (Nginx, AWS, Cloudflare, etc.) to correctly resolve req.ip
app.set('trust proxy', 1);

// Security and CORS middleware configuration
app.use(helmet());
app.use(cors({
  origin: '*', // Whitelisted domains should be configured here in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Device-ID']
}));

app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

// Global rate limiter (500 req / 15 min per IP)
app.use(globalLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

// Stale-while-revalidate cache headers for read-only GET endpoints
const CACHEABLE_PATHS = [
  '/api/v1/director/overview',
  '/api/v1/director/activity-feed',
  '/api/v1/director/alerts',
  '/api/v1/transit/routes',
  '/api/v1/transit/buses',
  '/api/v1/hostel',
  '/api/v1/library',
  '/api/v1/events',
  '/api/v1/obe',
  '/api/v1/naac',
];
app.use((req, res, next) => {
  if (req.method === 'GET' && CACHEABLE_PATHS.some(p => req.path.startsWith(p))) {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  }
  next();
});

// Routes mapping (auth gets stricter rate limiter)
app.post('/api/v1/webhooks/razorpay', razorpayWebhook);
app.use('/api/v1/auth', authLimiter, authRouter);

// When Supabase is offline, return 503 for data-dependent routes (skip auth/login which has sandbox fallback)
app.use('/api/v1/core', requireSupabaseOnline);
app.use('/api/v1/campusCore', requireSupabaseOnline);
app.use('/api/canteen', requireSupabaseOnline);
app.use('/api/v1/canteen', requireSupabaseOnline);
app.use('/api/v1/hostel-gate', requireSupabaseOnline);
app.use('/api/v1/lib-events', requireSupabaseOnline);
app.use('/api/v1/fitzone', requireSupabaseOnline);
app.use('/api/gym', requireSupabaseOnline);
app.use('/api/fitzone', requireSupabaseOnline);
app.use('/api/v1/events', requireSupabaseOnline);
app.use('/api/v1/hostel', requireSupabaseOnline);
app.use('/api/v1/transit', requireSupabaseOnline);
app.use('/api/v1/director', requireSupabaseOnline);
app.use('/api/v1/ai', requireSupabaseOnline);
app.use('/api/library', requireSupabaseOnline);
app.use('/api/gate', requireSupabaseOnline);
app.use('/api/v1/gate', requireSupabaseOnline);
app.use('/api/parent', requireSupabaseOnline);
app.use('/api/v1/parent', requireSupabaseOnline);
app.use('/api/admissions', requireSupabaseOnline);
app.use('/api/v1/admissions', requireSupabaseOnline);
app.use('/api/placements', requireSupabaseOnline);
app.use('/api/v1/placements', requireSupabaseOnline);
app.use('/api/obe', requireSupabaseOnline);
app.use('/api/v1/obe', requireSupabaseOnline);
app.use('/api/naac', requireSupabaseOnline);
app.use('/api/v1/naac', requireSupabaseOnline);
app.use('/api/hr', requireSupabaseOnline);
app.use('/api/v1/hr', requireSupabaseOnline);
app.use('/api/v1/permissions', requireSupabaseOnline);

app.use('/api/v1/core', coreRouter);
app.use('/api/v1/campusCore', coreRouter);
app.use('/api/canteen', authMiddleware, requireFeature('canteen'), canteenRouter);
app.use('/api/v1/canteen', authMiddleware, requireFeature('canteen'), canteenRouter);
app.use('/api/v1/hostel-gate', hostelGateRouter);
app.use('/api/v1/lib-events', libEventsRouter);
app.use('/api/v1/fitzone', authMiddleware, requireFeature('gym'), fitzoneRouter);
app.use('/api/gym', authMiddleware, requireFeature('gym'), fitzoneRouter);
app.use('/api/fitzone', authMiddleware, requireFeature('gym'), fitzoneRouter);
app.use('/api/v1/events', authMiddleware, requireFeature('events'), eventsRouter);
app.use('/api/v1/hostel', authMiddleware, requireFeature('hostel'), hostelRouter);
app.use('/api/v1/transit', authMiddleware, requireFeature('transit'), transitRouter);
app.use('/api/v1/director', authMiddleware, requireFeature('director'), directorRouter);
app.use('/api/v1/ai', authMiddleware, requireFeature('ai_concierge'), aiConciergeRouter);
app.use('/api/library', authMiddleware, requireFeature('library'), libraryRouter);
app.use('/api/gate', authMiddleware, requireFeature('gate'), gateRouter);
app.use('/api/v1/gate', authMiddleware, requireFeature('gate'), gateRouter);
app.use('/api/parent', authMiddleware, requireFeature('parent_portal'), parentRouter);
app.use('/api/v1/parent', authMiddleware, requireFeature('parent_portal'), parentRouter);
app.use('/api/admissions', authMiddleware, requireFeature('admissions'), admissionsRouter);
app.use('/api/v1/admissions', authMiddleware, requireFeature('admissions'), admissionsRouter);
app.use('/api/placements', authMiddleware, requireFeature('placements'), placementsRouter);
app.use('/api/v1/placements', authMiddleware, requireFeature('placements'), placementsRouter);
app.use('/api/obe', authMiddleware, requireFeature('obe'), obeRouter);
app.use('/api/v1/obe', authMiddleware, requireFeature('obe'), obeRouter);
app.use('/api/naac', authMiddleware, requireFeature('naac'), naacRouter);
app.use('/api/v1/naac', authMiddleware, requireFeature('naac'), naacRouter);
app.use('/api/hr', authMiddleware, requireFeature('hr'), hrRouter);
app.use('/api/v1/hr', authMiddleware, requireFeature('hr'), hrRouter);
app.use('/api/v1/permissions', permissionsRouter);
app.use('/api/grievances', grievancesRouter);
app.use('/api/v1/grievances', grievancesRouter);
app.use('/api/v1/attendance-engine', attendanceEngineRouter);

// Health Check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date(), uptime: process.uptime() });
});

// 404 catch-all for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Express error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(`Unhandled error: ${err.message}`, { url: req.originalUrl, method: req.method, stack: err.stack });
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Main Server listener (use httpServer for Socket.io support)
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    logger.info(`IRIS 365 Core Backend Server running on port ${PORT}`);
    logger.info(`Socket.io namespaces: /transit, /notifications, /canteen, /gate`);

    // Lazy-load cron jobs AFTER server is listening (avoids blocking startup)
    setTimeout(() => {
      try {
        require('./config/cron');
        logger.info('Background cron jobs loaded successfully.');
      } catch (err) {
        logger.error('Failed to initialize cron jobs:', err);
      }
    }, 2000);

    setTimeout(() => {
      try {
        const { startFeeReminderScheduler } = require('./services/feeReminderScheduler');
        startFeeReminderScheduler();
        logger.info('Fee reminder scheduler started.');
      } catch (err) {
        logger.error('Failed to start fee reminder scheduler:', err);
      }
    }, 4000);

    // Defer gate hardware init to avoid blocking startup with native module loading
    setTimeout(() => {
      try {
        initGateHardware();
      } catch (err) {
        logger.error('Failed to initialize gate hardware integrations:', err);
      }
    }, 3000);
  });
}

export default app;
