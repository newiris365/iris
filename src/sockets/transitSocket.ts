import { Server, Socket } from 'socket.io';
import { supabaseAdmin } from '../config/supabase';
import logger from '../config/logger';

interface LocationPayload {
  busId: string;
  lat: number;
  lng: number;
  speedKmh?: number;
  heading?: number;
}

/**
 * Register the /transit Socket.io namespace with real GPS tracking events.
 *
 * Events:
 *   driver:join     — Driver selects a bus and starts a tracking session
 *   driver:location — Driver pushes real GPS coordinates (from mobile foreground/background)
 *   driver:stop     — Driver ends the tracking session
 *   student:watch   — Student subscribes to a bus's live location updates
 *   subscribe_bus   — Legacy event (kept for backward compatibility with web frontend)
 *   subscribe_admin — Admin subscribes to fleet-wide location feed
 *
 * All DB writes use supabaseAdmin (service-role) to bypass RLS since the
 * Socket layer already verified the JWT in the server-level middleware.
 */
export function registerTransitSocket(io: Server) {
  const transit = io.of('/transit');

  // Apply the same auth middleware to the /transit namespace
  transit.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      (socket as any).user = decoded;
      next();
    } catch {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  transit.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    const role: string = user?.role ?? '';
    const userId: string = user?.id ?? '';
    const institutionId: string = user?.institution_id ?? '';

    logger.info('Transit client connected', { socketId: socket.id, role });

    // ── Legacy events (backward compat with existing web frontend) ──────────

    socket.on('subscribe_bus', (busId: string) => {
      socket.join(`bus:${busId}`);
      // Also join the legacy room name for controllers that emit to bus_${busId}
      socket.join(`bus_${busId}`);
      logger.debug(`Socket ${socket.id} subscribed to bus:${busId}`);
    });

    socket.on('unsubscribe_bus', (busId: string) => {
      socket.leave(`bus:${busId}`);
      socket.leave(`bus_${busId}`);
    });

    socket.on('subscribe_admin', () => {
      socket.join('admin:transit');
      logger.debug(`Socket ${socket.id} subscribed to admin:transit`);
    });

    socket.on('unsubscribe_admin', () => {
      socket.leave('admin:transit');
    });

    // ── Driver Events ───────────────────────────────────────────────────────

    socket.on('driver:join', async ({ busId }: { busId: string }) => {
      if (role.toLowerCase() !== 'driver') {
        socket.emit('error', { message: 'Unauthorized: only drivers can start tracking' });
        return;
      }

      try {
        const { data: bus, error } = await supabaseAdmin
          .from('buses')
          .select('id, vehicle_number')
          .eq('id', busId)
          .eq('driver_id', userId)
          .eq('institution_id', institutionId)
          .single();

        if (error || !bus) {
          socket.emit('error', { message: 'Bus not assigned to you' });
          return;
        }

        socket.join(`bus:${busId}`);
        socket.join(`bus_${busId}`);

        await supabaseAdmin
          .from('buses')
          .update({ is_active: true })
          .eq('id', busId);

        socket.emit('driver:joined', { busId, busNumber: bus.vehicle_number });
        logger.info(`Driver ${userId} started tracking bus ${bus.vehicle_number}`, { busId });
      } catch (err) {
        logger.error('driver:join failed', { err });
        socket.emit('error', { message: 'Failed to join bus' });
      }
    });

    socket.on('driver:location', async (payload: LocationPayload) => {
      if (role.toLowerCase() !== 'driver') return;

      const { busId, lat, lng, speedKmh = 0, heading = 0 } = payload;

      // Validate Indian coordinate bounds (lat 8–37, lng 68–97)
      if (!lat || !lng || lat < 8 || lat > 37 || lng < 68 || lng > 97) {
        socket.emit('error', { message: 'Invalid coordinates (outside India bounds)' });
        return;
      }

      const now = new Date().toISOString();
      const locationData = {
        lat,
        lng,
        speed_kmh: speedKmh,
        heading,
        timestamp: now,
        busId,
      };

      // Broadcast to all watchers of this bus (students, admins)
      socket.to(`bus:${busId}`).emit('bus:location', locationData);

      // Also broadcast on legacy room + event for existing web frontend
      socket.to(`bus_${busId}`).emit('bus:location_updated', {
        bus_id: busId,
        latitude: lat,
        longitude: lng,
        speed: speedKmh,
        heading,
        timestamp: now,
      });

      // Broadcast to admin fleet view
      transit.to('admin:transit').emit('bus:location_updated', {
        bus_id: busId,
        latitude: lat,
        longitude: lng,
        speed: speedKmh,
        heading,
        timestamp: now,
      });

      // Persist latest position to buses table
      await supabaseAdmin
        .from('buses')
        .update({
          current_lat: lat,
          current_lng: lng,
          last_location_at: now,
          speed_kmh: speedKmh,
        })
        .eq('id', busId);

      // Persist to location history (non-blocking, fire and forget)
      supabaseAdmin
        .from('transit_location_history')
        .insert({
          bus_id: busId,
          driver_id: userId,
          lat,
          lng,
          speed_kmh: speedKmh,
          institution_id: institutionId,
        })
        .then(({ error }) => {
          if (error) logger.warn('Failed to insert location history', { error: error.message });
        });
    });

    // ── Student / Viewer Events ─────────────────────────────────────────────

    socket.on('student:watch', async ({ busId }: { busId: string }) => {
      socket.join(`bus:${busId}`);
      socket.join(`bus_${busId}`);

      try {
        const { data: bus } = await supabaseAdmin
          .from('buses')
          .select('current_lat, current_lng, last_location_at, is_active, speed_kmh, vehicle_number')
          .eq('id', busId)
          .single();

        // Send last known position if available
        if (bus?.current_lat) {
          socket.emit('bus:location', {
            lat: bus.current_lat,
            lng: bus.current_lng,
            speed_kmh: bus.speed_kmh,
            timestamp: bus.last_location_at,
            busId,
            isLastKnown: true,
          });
        }

        socket.emit('bus:status', { isActive: bus?.is_active ?? false, busId });
      } catch (err) {
        logger.error('student:watch failed', { err });
      }
    });

    // ── Driver Stop ─────────────────────────────────────────────────────────

    socket.on('driver:stop', async ({ busId }: { busId: string }) => {
      if (role.toLowerCase() !== 'driver') return;

      await supabaseAdmin
        .from('buses')
        .update({ is_active: false })
        .eq('id', busId);

      socket.to(`bus:${busId}`).emit('bus:offline', { busId });
      socket.to(`bus_${busId}`).emit('bus:offline', { busId });
      socket.leave(`bus:${busId}`);
      socket.leave(`bus_${busId}`);

      logger.info(`Driver ${userId} stopped tracking bus ${busId}`);
    });

    // ── Disconnect cleanup ──────────────────────────────────────────────────

    socket.on('disconnect', async () => {
      logger.debug('Transit client disconnected', { socketId: socket.id });

      if (role.toLowerCase() === 'driver') {
        // Mark all buses driven by this driver as inactive
        await supabaseAdmin
          .from('buses')
          .update({ is_active: false })
          .eq('driver_id', userId);
      }
    });
  });

  return transit;
}
