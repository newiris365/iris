import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server as SocketServer } from 'socket.io';
import logger from './config/logger';
import { globalLimiter, authLimiter } from './middleware/rateLimit';
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
import { initGateHardware } from './services/gateHardware';

dotenv.config();

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

// Periodically broadcast KPI updates to director:dashboard room every 30 seconds
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

// Export io for use in controllers (e.g. transit GPS broadcast)
export { io, transitNs, notificationsNs, canteenNs, gateNs, directorNs };

// Security and CORS middleware configuration
app.use(helmet());
app.use(cors({
  origin: '*', // Whitelisted domains should be configured here in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

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

// Routes mapping (auth gets stricter rate limiter)
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/core', coreRouter);
app.use('/api/v1/canteen', canteenRouter);
app.use('/api/v1/hostel-gate', hostelGateRouter);
app.use('/api/v1/lib-events', libEventsRouter);
app.use('/api/v1/fitzone', fitzoneRouter);
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/hostel', hostelRouter);
app.use('/api/v1/transit', transitRouter);
app.use('/api/v1/director', directorRouter);
app.use('/api/v1/ai', aiConciergeRouter);
app.use('/api/library', libraryRouter);
app.use('/api/gate', gateRouter);
app.use('/api/v1/gate', gateRouter);

// Health Check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date(), uptime: process.uptime() });
});

// Main Server listener (use httpServer for Socket.io support)
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

  // Defer gate hardware init to avoid blocking startup with native module loading
  setTimeout(() => {
    try {
      initGateHardware();
    } catch (err) {
      logger.error('Failed to initialize gate hardware integrations:', err);
    }
  }, 3000);
});

export default app;
