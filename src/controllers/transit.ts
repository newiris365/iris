import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';

// ========== ZOD VALIDATION SCHEMAS ==========

export const createRouteSchema = z.object({
  name: z.string().min(1),
  route_number: z.string().min(1),
  stops: z.array(z.object({
    name: z.string().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    stop_index: z.number().int().nonnegative(),
    scheduled_time_morning: z.string().optional(),
    scheduled_time_evening: z.string().optional()
  })).min(1),
  distance_km: z.number().positive().optional(),
  duration_minutes: z.number().int().positive().optional(),
  monthly_fee: z.number().nonnegative().optional()
});

export const createBusSchema = z.object({
  vehicle_number: z.string().min(1),
  model: z.string().optional(),
  capacity: z.number().int().positive(),
  route_id: z.string().uuid().optional().nullable(),
  driver_id: z.string().uuid().optional().nullable(),
  device_id: z.string().optional().nullable(),
  insurance_expiry: z.string().optional().nullable(),
  fitness_expiry: z.string().optional().nullable()
});

export const updateLocationSchema = z.object({
  bus_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).default(0),
  heading: z.number().min(0).max(360).default(0)
});

export const subscribeTransportSchema = z.object({
  student_id: z.string().uuid(),
  route_id: z.string().uuid(),
  stop_name: z.string().min(1),
  start_date: z.string(),
  end_date: z.string(),
  amount_paid: z.number().positive(),
  transaction_id: z.string().min(1)
});

export const startTripSchema = z.object({
  bus_id: z.string().uuid(),
  route_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  trip_type: z.enum(['morning', 'evening', 'special']),
  scheduled_start: z.string().optional()
});

export const createIncidentSchema = z.object({
  bus_id: z.string().uuid(),
  trip_id: z.string().uuid().optional().nullable(),
  incident_type: z.string().min(1),
  description: z.string().min(1),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('low')
});

export const createMaintenanceSchema = z.object({
  bus_id: z.string().uuid(),
  maintenance_type: z.string().min(1),
  scheduled_date: z.string(),
  completed_date: z.string().optional().nullable(),
  cost: z.number().nonnegative().default(0),
  service_center: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  next_due_date: z.string().optional().nullable()
});

// ========== HELPER FUNCTIONS ==========

// Haversine formula to compute distance between two GPS coordinates in kilometers
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ========== 1. GET ALL BUS ROUTES ==========
export async function getRoutes(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('bus_routes')
      .select('*, buses(id, vehicle_number, capacity, driver_id, device_id)')
      .eq('institution_id', req.user?.institution_id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, routes: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching routes.' });
  }
}

// ========== 2. GET SINGLE ROUTE DETAIL ==========
export async function getRouteDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('bus_routes')
      .select('*, buses(id, vehicle_number, capacity, device_id, users(name))')
      .eq('id', id)
      .eq('institution_id', req.user?.institution_id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Route not found.' });
    }

    return res.status(200).json({ success: true, route: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching route detail.' });
  }
}

// ========== 3. CREATE BUS ROUTE ==========
export async function createRoute(req: Request, res: Response) {
  try {
    const parse = createRouteSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('bus_routes')
      .insert({
        ...parse.data,
        institution_id: req.user?.institution_id,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(201).json({ success: true, route: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error creating route.' });
  }
}

// ========== 4. UPDATE BUS ROUTE ==========
export async function updateRoute(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parse = createRouteSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('bus_routes')
      .update(parse.data)
      .eq('id', id)
      .eq('institution_id', req.user?.institution_id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, route: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error updating route.' });
  }
}

// ========== 5. GET ALL BUSES ==========
export async function getBuses(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('buses')
      .select('*, bus_routes(name), users(name)')
      .eq('institution_id', req.user?.institution_id);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, buses: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching buses.' });
  }
}

// ========== 6. CREATE BUS ==========
export async function createBus(req: Request, res: Response) {
  try {
    const parse = createBusSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('buses')
      .insert({
        ...parse.data,
        institution_id: req.user?.institution_id,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(201).json({ success: true, bus: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error creating bus.' });
  }
}

// ========== 7. UPDATE BUS ==========
export async function updateBus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parse = createBusSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('buses')
      .update(parse.data)
      .eq('id', id)
      .eq('institution_id', req.user?.institution_id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, bus: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error updating bus.' });
  }
}

// ========== 8. START TRIP ==========
export async function startTrip(req: Request, res: Response) {
  try {
    const parse = startTripSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { bus_id, route_id, driver_id, trip_type, scheduled_start } = parse.data;

    // Check if there is already an active trip for this bus
    const { data: existing } = await supabaseAdmin
      .from('bus_trips')
      .select('id')
      .eq('bus_id', bus_id)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, error: 'Bus is already on an active trip.' });
    }

    const { data, error } = await supabaseAdmin
      .from('bus_trips')
      .insert({
        institution_id: req.user?.institution_id,
        bus_id,
        route_id,
        driver_id,
        trip_date: new Date().toISOString().split('T')[0],
        trip_type,
        scheduled_start: scheduled_start || new Date().toISOString(),
        actual_start: new Date().toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(201).json({ success: true, trip: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error starting trip.' });
  }
}

// ========== 9. END TRIP ==========
export async function endTrip(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data: trip, error: tripErr } = await supabaseAdmin
      .from('bus_trips')
      .select('id, bus_id')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (tripErr || !trip) {
      return res.status(404).json({ success: false, error: 'Active trip record not found.' });
    }

    const { data, error } = await supabaseAdmin
      .from('bus_trips')
      .update({
        actual_end: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    // Broadcast trip:completed via Socket.io
    try {
      const { transitNs } = require('../server');
      if (transitNs) {
        transitNs.to(`bus_${trip.bus_id}`).emit('trip:completed', { trip_id: id, status: 'completed' });
      }
    } catch {
      // Ignore websocket failures in build
    }

    return res.status(200).json({ success: true, trip: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error ending trip.' });
  }
}

// ========== 10. GET TRIPS FOR BUS / ROUTE ==========
export async function getTrips(req: Request, res: Response) {
  try {
    const { busId } = req.params;
    const { date } = req.query;
    const targetDate = date ? (date as string) : new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('bus_trips')
      .select('*, bus_routes(name, stops), bus_drivers(license_number)')
      .eq('bus_id', busId)
      .eq('trip_date', targetDate)
      .order('actual_start', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, trips: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching trips.' });
  }
}

// ========== 11. MARK STOP REACHED ==========
export async function stopReached(req: Request, res: Response) {
  try {
    const { id } = req.params; // trip_id
    const { stop_index, stop_name, passengers_boarded, passengers_alighted } = req.body;

    if (stop_index === undefined || !stop_name) {
      return res.status(400).json({ success: false, error: 'Stop index and name are required.' });
    }

    // Verify trip is active
    const { data: trip, error: tripErr } = await supabaseAdmin
      .from('bus_trips')
      .select('*, bus_routes(stops)')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (tripErr || !trip) {
      return res.status(404).json({ success: false, error: 'Active trip not found.' });
    }

    // Insert stop arrival log
    const { data, error } = await supabaseAdmin
      .from('trip_stop_logs')
      .insert({
        institution_id: req.user?.institution_id,
        trip_id: id,
        stop_index,
        stop_name,
        scheduled_time: new Date().toISOString(), // Mock scheduled arrival
        actual_arrival: new Date().toISOString(),
        passengers_boarded: passengers_boarded || 0,
        passengers_alighted: passengers_alighted || 0
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    // Update accumulated passenger counts on the trip record
    const totalBoarded = (trip.passenger_count || 0) + (passengers_boarded || 0) - (passengers_alighted || 0);
    await supabaseAdmin
      .from('bus_trips')
      .update({ passenger_count: Math.max(0, totalBoarded) })
      .eq('id', id);

    return res.status(201).json({ success: true, log: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error recording stop log.' });
  }
}

// ========== 12. UPDATE BUS LOCATION (GPS TELEMETRY) ==========
export async function updateBusLocation(req: Request, res: Response) {
  try {
    const parseResult = updateLocationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { bus_id, latitude, longitude, speed, heading } = parseResult.data;

    // Verify bus exists
    const { data: bus, error: busError } = await supabaseAdmin
      .from('buses')
      .select('id, vehicle_number, route_id')
      .eq('id', bus_id)
      .eq('institution_id', req.user?.institution_id)
      .single();

    if (busError || !bus) {
      return res.status(404).json({ success: false, error: 'Bus not found.' });
    }

    // Insert tracking record
    const { data: tracking, error: trackError } = await supabaseAdmin
      .from('bus_tracking')
      .insert({
        institution_id: req.user?.institution_id,
        bus_id,
        latitude,
        longitude,
        speed,
        heading,
        is_active: true
      })
      .select()
      .single();

    if (trackError) {
      return res.status(500).json({ success: false, error: trackError.message });
    }

    // Calculate remaining ETAs for upcoming stops if active route exists
    let etas: any[] = [];
    if (bus.route_id) {
      const { data: route } = await supabaseAdmin
        .from('bus_routes')
        .select('stops')
        .eq('id', bus.route_id)
        .single();

      if (route && Array.isArray(route.stops)) {
        const stopsList: any[] = route.stops;
        etas = stopsList.map((stop: any) => {
          const distance = calculateHaversineDistance(latitude, longitude, stop.latitude, stop.longitude);
          // Use current speed if moving, else fallback to average speed 25 km/h
          const velocity = speed > 5 ? speed : 25;
          const etaMins = Math.round((distance / velocity) * 60);
          return {
            name: stop.name,
            stop_index: stop.stop_index,
            distance_km: parseFloat(distance.toFixed(2)),
            eta_minutes: etaMins
          };
        });
      }
    }

    // Broadcast via Socket.io
    try {
      const { transitNs } = require('../server');
      if (transitNs) {
        // Broadcast location and ETAs to parent/student rooms
        transitNs.to(`bus_${bus_id}`).emit('bus:location_updated', {
          bus_id,
          vehicle_number: bus.vehicle_number,
          latitude,
          longitude,
          speed,
          heading,
          timestamp: new Date().toISOString(),
          etas
        });

        // Broadcast to admin fleet view
        transitNs.to('admin:transit').emit('bus:location_updated', {
          bus_id,
          vehicle_number: bus.vehicle_number,
          latitude,
          longitude,
          speed,
          heading,
          timestamp: new Date().toISOString()
        });

        // Broadcast approaching notifications if distance is less than 0.8 km
        etas.forEach((item: any) => {
          if (item.distance_km < 0.8) {
            transitNs.to(`bus_${bus_id}`).emit(`bus:approaching:${item.stop_index}`, {
              stop_name: item.name,
              eta_minutes: item.eta_minutes
            });
          }
        });
      }
    } catch {
      // Ignore Socket.io issues during builds
    }

    return res.status(200).json({
      success: true,
      message: 'Bus position telemetry updated.',
      tracking,
      etas
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ========== 13. GET LATEST BUS POSITION ==========
export async function getLatestPosition(req: Request, res: Response) {
  try {
    const { busId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('bus_tracking')
      .select('*, buses(vehicle_number, bus_routes(name, stops))')
      .eq('bus_id', busId)
      .eq('institution_id', req.user?.institution_id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, position: data || null });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching position.' });
  }
}

// ========== 14. GET TRACKING HISTORY ==========
export async function getTrackingHistory(req: Request, res: Response) {
  try {
    const { busId } = req.params;
    const { limit: queryLimit } = req.query;
    const recordLimit = parseInt(queryLimit as string) || 50;

    const { data, error } = await supabaseAdmin
      .from('bus_tracking')
      .select('latitude, longitude, speed, heading, timestamp, is_active')
      .eq('bus_id', busId)
      .eq('institution_id', req.user?.institution_id)
      .order('timestamp', { ascending: false })
      .limit(recordLimit);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, history: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching tracking history.' });
  }
}

// ========== 15. SUBSCRIBE TO ROUTE (RAZORPAY SUCCESS INJECTION) ==========
export async function subscribeToBus(req: Request, res: Response) {
  try {
    const parseResult = subscribeTransportSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { student_id, route_id, stop_name, start_date, end_date, amount_paid, transaction_id } = parseResult.data;

    // Check for existing active subscription on same route
    const { data: existingSub } = await supabaseAdmin
      .from('transport_subscriptions')
      .select('id, end_date')
      .eq('student_id', student_id)
      .eq('route_id', route_id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString().split('T')[0])
      .maybeSingle();

    if (existingSub) {
      return res.status(409).json({
        success: false,
        error: `Active subscription already exists for this route until ${existingSub.end_date}.`
      });
    }

    const { data, error } = await supabaseAdmin
      .from('transport_subscriptions')
      .insert({
        institution_id: req.user?.institution_id,
        student_id,
        route_id,
        stop_name,
        start_date,
        end_date,
        amount_paid,
        transaction_id,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, message: 'Transport subscription created.', subscription: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error creating subscription.' });
  }
}

// ========== 16. CANCEL SUBSCRIPTION ==========
export async function deleteSubscription(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('transport_subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('institution_id', req.user?.institution_id)
      .select()
      .single();

    if (error || !data) {
      return res.status(500).json({ success: false, error: error?.message || 'Subscription not found.' });
    }

    return res.status(200).json({ success: true, message: 'Subscription cancelled.', subscription: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error cancelling subscription.' });
  }
}

// ========== 17. GET MY SUBSCRIPTION DETAILS ==========
export async function getMySubscription(req: Request, res: Response) {
  try {
    const { studentId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('transport_subscriptions')
      .select('*, bus_routes(*)')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      has_subscription: !!data,
      subscription: data || null
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching subscription.' });
  }
}

// ========== 18. LIST SUBSCRIBED STUDENTS FOR ROUTE ==========
export async function getStudentsForRoute(req: Request, res: Response) {
  try {
    const { id } = req.params; // route_id

    const { data, error } = await supabaseAdmin
      .from('transport_subscriptions')
      .select('*, students(*, users(name, phone))')
      .eq('route_id', id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString().split('T')[0]);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, students: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching route subscribers.' });
  }
}

// ========== 19. CREATE INCIDENT REPORT ==========
export async function createIncident(req: Request, res: Response) {
  try {
    const parse = createIncidentSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('bus_incidents')
      .insert({
        ...parse.data,
        institution_id: req.user?.institution_id,
        reported_by: req.user?.id,
        status: 'reported'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    // Trigger delay alerts to subscribed students if delay incidents happen
    if (parse.data.severity === 'high' || parse.data.severity === 'critical') {
      try {
        const { transitNs } = require('../server');
        if (transitNs) {
          transitNs.to(`bus_${parse.data.bus_id}`).emit('trip:delayed', {
            incident_type: parse.data.incident_type,
            description: parse.data.description,
            severity: parse.data.severity
          });
        }
      } catch {
        // Ignore websocket failures in build
      }
    }

    return res.status(201).json({ success: true, incident: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error logging incident.' });
  }
}

// ========== 20. GET INCIDENTS ==========
export async function getIncidents(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('bus_incidents')
      .select('*, buses(vehicle_number), users(name)')
      .eq('institution_id', req.user?.institution_id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, incidents: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching incidents.' });
  }
}

// ========== 21. UPDATE INCIDENT RESOLUTION STATUS ==========
export async function updateIncidentStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['reported', 'investigating', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Valid status parameter is required.' });
    }

    const { data, error } = await supabaseAdmin
      .from('bus_incidents')
      .update({ status })
      .eq('id', id)
      .eq('institution_id', req.user?.institution_id)
      .select()
      .single();

    if (error || !data) {
      return res.status(500).json({ success: false, error: error?.message || 'Incident not found.' });
    }

    return res.status(200).json({ success: true, incident: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error updating incident.' });
  }
}

// ========== 22. CREATE VEHICLE MAINTENANCE LOG ==========
export async function createMaintenance(req: Request, res: Response) {
  try {
    const parse = createMaintenanceSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('bus_maintenance')
      .insert({
        ...parse.data,
        institution_id: req.user?.institution_id
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(201).json({ success: true, maintenance: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error creating maintenance log.' });
  }
}

// ========== 23. GET VEHICLE MAINTENANCE HISTORY ==========
export async function getMaintenance(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('bus_maintenance')
      .select('*, buses(vehicle_number)')
      .eq('institution_id', req.user?.institution_id)
      .order('scheduled_date', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, maintenance: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching maintenance history.' });
  }
}

// ========== 24. GET LATEST POSITION OF ALL BUSES ==========
export async function getLatestPositionsAll(req: Request, res: Response) {
  try {
    const { data: buses, error: busError } = await supabaseAdmin
      .from('buses')
      .select('id, vehicle_number, route_id')
      .eq('institution_id', req.user?.institution_id)
      .eq('is_active', true);

    if (busError || !buses) {
      return res.status(500).json({ success: false, error: busError?.message });
    }

    const busIds = buses.map(b => b.id);
    if (busIds.length === 0) {
      return res.status(200).json({ success: true, positions: [] });
    }

    const positions = [];
    for (const busId of busIds) {
      const { data: pos } = await supabaseAdmin
        .from('bus_tracking')
        .select('*')
        .eq('bus_id', busId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pos) {
        const busObj = buses.find(b => b.id === busId);
        positions.push({
          ...pos,
          vehicle_number: busObj?.vehicle_number
        });
      }
    }

    return res.status(200).json({ success: true, positions });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ========== 25. GET ALL DRIVERS ==========
export async function getDrivers(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('bus_drivers')
      .select('*, users(name, phone)')
      .eq('institution_id', req.user?.institution_id)
      .eq('is_active', true);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, drivers: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching drivers.' });
  }
}
