import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// ============================================================
// ZOD SCHEMAS
// ============================================================

const createEventSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  category: z.string().min(1),
  venue: z.string().optional(),
  start_datetime: z.string(),
  end_datetime: z.string(),
  max_participants: z.number().int().positive().optional(),
  is_paid: z.boolean().default(false),
  ticket_price: z.number().min(0).default(0),
  banner_url: z.string().url().optional(),
  registration_deadline: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'Scheduled', 'Ongoing', 'Completed', 'Cancelled']).default('draft')
});

const updateEventSchema = createEventSchema.partial();

const registerEventSchema = z.object({
  student_id: z.string().uuid()
});

const initiateTicketPaymentSchema = z.object({
  event_id: z.string().uuid(),
  student_id: z.string().uuid()
});

const verifyTicketPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  registration_id: z.string().uuid()
});

const checkinTicketSchema = z.object({
  ticket_number: z.string()
});

const addVolunteerSchema = z.object({
  student_id: z.string().uuid(),
  role: z.string().min(1)
});

const addSponsorSchema = z.object({
  sponsor_name: z.string().min(1),
  amount: z.number().min(0).default(0),
  tier: z.enum(['Gold', 'Silver', 'Bronze', 'Platinum']).default('Bronze'),
  logo_url: z.string().url().optional()
});

const addBudgetItemSchema = z.object({
  category: z.string().min(1),
  description: z.string().optional(),
  estimated_amount: z.number().min(0).default(0),
  actual_amount: z.number().min(0).default(0),
  receipt_url: z.string().url().optional()
});

const submitFeedbackSchema = z.object({
  student_id: z.string().uuid(),
  overall_rating: z.number().int().min(1).max(5),
  content_rating: z.number().int().min(1).max(5).optional(),
  venue_rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional()
});

const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  sent_via: z.array(z.enum(['email', 'push', 'whatsapp'])).default([])
});

// Razorpay instance (lazy)
let razorpayInstance: Razorpay | null = null;
function getRazorpay(): Razorpay | null {
  if (!razorpayInstance && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpayInstance;
}

// ============================================================
// 1. EVENT CRUD
// ============================================================

// GET /events — List all events (with filters)
export async function listEvents(req: Request, res: Response) {
  try {
    const { category, status, search, upcoming } = req.query;

    let query = supabaseAdmin
      .from('events')
      .select('*')
      .eq('institution_id', req.user?.institution_id)
      .order('start_datetime', { ascending: true });

    if (category) query = query.eq('category', category as string);
    if (status) query = query.eq('status', status as string);
    if (search) query = query.ilike('title', `%${search}%`);
    if (upcoming === 'true') query = query.gte('start_datetime', new Date().toISOString());

    const { data, error } = await query;

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, events: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// GET /events/:id — Single event detail with counts
export async function getEventDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !event) return res.status(404).json({ success: false, error: 'Event not found.' });

    // Get registration count
    const { count: registrationCount } = await supabaseAdmin
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', id);

    // Get volunteer count
    const { count: volunteerCount } = await supabaseAdmin
      .from('event_volunteers')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', id);

    // Get feedback stats
    const { data: feedbackData } = await supabaseAdmin
      .from('event_feedback')
      .select('overall_rating')
      .eq('event_id', id);

    const avgRating = feedbackData && feedbackData.length > 0
      ? (feedbackData.reduce((acc: number, f: any) => acc + f.overall_rating, 0) / feedbackData.length).toFixed(1)
      : null;

    return res.status(200).json({
      success: true,
      event: {
        ...event,
        registration_count: registrationCount || 0,
        volunteer_count: volunteerCount || 0,
        avg_rating: avgRating,
        feedback_count: feedbackData?.length || 0
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// POST /events — Create event
export async function createEvent(req: Request, res: Response) {
  try {
    const parseResult = createEventSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .insert({
        ...parseResult.data,
        institution_id: req.user?.institution_id,
        created_by: req.user?.id
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, event });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// PUT /events/:id — Update event
export async function updateEvent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parseResult = updateEventSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .update({ ...parseResult.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, event });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// DELETE /events/:id — Delete event
export async function deleteEvent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('events').delete().eq('id', id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, message: 'Event deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 2. EVENT REGISTRATION & TICKETING
// ============================================================

// POST /events/:id/register — Register for event (free events)
export async function registerForEvent(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const parseResult = registerEventSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { student_id } = parseResult.data;

    // Check event exists and isn't full
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('max_participants, is_paid, ticket_price, registration_deadline, status')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ success: false, error: 'Event not found.' });
    }

    if (event.status === 'Cancelled') {
      return res.status(400).json({ success: false, error: 'Event has been cancelled.' });
    }

    // Check deadline
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return res.status(400).json({ success: false, error: 'Registration deadline has passed.' });
    }

    // Check capacity
    const { count } = await supabaseAdmin
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (event.max_participants && (count || 0) >= event.max_participants) {
      return res.status(409).json({ success: false, error: 'Event capacity limit reached.' });
    }

    // Check duplicate registration
    const { data: existingReg } = await supabaseAdmin
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('student_id', student_id)
      .maybeSingle();

    if (existingReg) {
      return res.status(409).json({ success: false, error: 'Already registered for this event.' });
    }

    const ticketNumber = 'EVT-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data: registration, error: regError } = await supabaseAdmin
      .from('event_registrations')
      .insert({
        institution_id: req.user?.institution_id,
        event_id: eventId,
        student_id,
        ticket_number: ticketNumber,
        payment_status: event.is_paid ? 'Pending' : 'Completed',
        attendance_marked: false,
        amount_paid: event.is_paid ? 0 : 0
      })
      .select()
      .single();

    if (regError) return res.status(500).json({ success: false, error: regError.message });

    return res.status(201).json({ success: true, message: 'Registered successfully.', registration });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// GET /events/:id/registrations — List all registrations for an event
export async function getEventRegistrations(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .select('*, students(name, roll_number, department)')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, registrations: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// GET /events/my-registrations/:studentId — Student's registrations
export async function getMyRegistrations(req: Request, res: Response) {
  try {
    const { studentId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .select('*, events(title, category, venue, start_datetime, end_datetime, banner_url, status)')
      .eq('student_id', studentId)
      .order('registered_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, registrations: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// POST /events/:id/checkin — Check in a ticket by ticket number
export async function checkinEventTicket(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const parseResult = checkinTicketSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { ticket_number } = parseResult.data;

    const { data: registration, error } = await supabaseAdmin
      .from('event_registrations')
      .select('id, attendance_marked, payment_status')
      .eq('event_id', eventId)
      .eq('ticket_number', ticket_number)
      .single();

    if (error || !registration) {
      return res.status(404).json({ success: false, error: 'Invalid ticket number.' });
    }

    if (registration.payment_status === 'Pending') {
      return res.status(400).json({ success: false, error: 'Payment not completed for this ticket.' });
    }

    if (registration.attendance_marked) {
      return res.status(409).json({ success: false, error: 'Already checked in.' });
    }

    const { data: updated } = await supabaseAdmin
      .from('event_registrations')
      .update({ attendance_marked: true, checked_in_at: new Date().toISOString() })
      .eq('id', registration.id)
      .select()
      .single();

    return res.status(200).json({ success: true, message: 'Check-in successful.', registration: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 3. RAZORPAY PAID EVENT TICKETS
// ============================================================

// POST /events/tickets/initiate — Create Razorpay order for paid event
export async function initiateTicketPayment(req: Request, res: Response) {
  try {
    const parseResult = initiateTicketPaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { event_id, student_id } = parseResult.data;

    // Get event price
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('ticket_price, title, is_paid')
      .eq('id', event_id)
      .single();

    if (!event || !event.is_paid) {
      return res.status(400).json({ success: false, error: 'Event is free or not found.' });
    }

    const amount = Math.round(event.ticket_price * 100); // paise

    const razorpay = getRazorpay();
    if (razorpay) {
      const order = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: `evt_${event_id}_${student_id}`.slice(0, 40),
        notes: { event_id, student_id, event_title: event.title }
      });

      return res.status(200).json({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID
      });
    }

    // Mock mode
    const mockOrderId = 'order_mock_' + Math.random().toString(36).substring(2, 12);
    return res.status(200).json({
      success: true,
      order_id: mockOrderId,
      amount,
      currency: 'INR',
      key_id: 'rzp_test_mock',
      mock: true
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// POST /events/tickets/verify — Verify Razorpay payment and activate ticket
export async function verifyTicketPayment(req: Request, res: Response) {
  try {
    const parseResult = verifyTicketPaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registration_id } = parseResult.data;

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (secret && !razorpay_order_id.startsWith('order_mock_')) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, error: 'Payment verification failed.' });
      }
    }

    // Update registration
    const { data: registration, error } = await supabaseAdmin
      .from('event_registrations')
      .update({
        payment_status: 'Completed',
        razorpay_order_id,
        razorpay_payment_id
      })
      .eq('id', registration_id)
      .select('*, events(ticket_price)')
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, message: 'Payment verified. Ticket activated.', registration });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 4. VOLUNTEERS
// ============================================================

// POST /events/:id/volunteers — Add volunteer
export async function addVolunteer(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const parseResult = addVolunteerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('event_volunteers')
      .insert({
        institution_id: req.user?.institution_id,
        event_id: eventId,
        ...parseResult.data,
        assigned_by: req.user?.id
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, volunteer: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// GET /events/:id/volunteers — List volunteers for an event
export async function getEventVolunteers(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('event_volunteers')
      .select('*, students(name, roll_number, department)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, volunteers: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// DELETE /events/:id/volunteers/:volunteerId — Remove volunteer
export async function removeVolunteer(req: Request, res: Response) {
  try {
    const { volunteerId } = req.params;
    const { error } = await supabaseAdmin.from('event_volunteers').delete().eq('id', volunteerId);
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, message: 'Volunteer removed.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 5. SPONSORS
// ============================================================

// POST /events/:id/sponsors — Add sponsor
export async function addSponsor(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const parseResult = addSponsorSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('event_sponsors')
      .insert({
        institution_id: req.user?.institution_id,
        event_id: eventId,
        ...parseResult.data
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, sponsor: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// GET /events/:id/sponsors — List sponsors
export async function getEventSponsors(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('event_sponsors')
      .select('*')
      .eq('event_id', eventId)
      .order('amount', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, sponsors: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 6. BUDGET MANAGEMENT
// ============================================================

// POST /events/:id/budget — Add budget item
export async function addBudgetItem(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const parseResult = addBudgetItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('event_budget')
      .insert({
        institution_id: req.user?.institution_id,
        event_id: eventId,
        ...parseResult.data,
        approved_by: null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, budget_item: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// GET /events/:id/budget — List budget items
export async function getEventBudget(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('event_budget')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Calculate totals
    const totalEstimated = (data || []).reduce((acc: number, item: any) => acc + (item.estimated_amount || 0), 0);
    const totalActual = (data || []).reduce((acc: number, item: any) => acc + (item.actual_amount || 0), 0);

    return res.status(200).json({
      success: true,
      budget_items: data || [],
      summary: {
        total_estimated: totalEstimated,
        total_actual: totalActual,
        variance: totalEstimated - totalActual
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// PUT /events/:id/budget/:itemId/approve — Approve budget item
export async function approveBudgetItem(req: Request, res: Response) {
  try {
    const { itemId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('event_budget')
      .update({ status: 'approved', approved_by: req.user?.id })
      .eq('id', itemId)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, budget_item: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 7. PHOTO GALLERY
// ============================================================

// POST /events/:id/photos — Upload photo metadata
export async function addEventPhoto(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const { photo_url, thumbnail_url, caption, is_featured } = req.body;

    if (!photo_url) {
      return res.status(400).json({ success: false, error: 'photo_url is required.' });
    }

    const { data, error } = await supabaseAdmin
      .from('event_photos')
      .insert({
        institution_id: req.user?.institution_id,
        event_id: eventId,
        photo_url,
        thumbnail_url: thumbnail_url || photo_url,
        caption: caption || '',
        uploaded_by: req.user?.id,
        is_featured: is_featured || false
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, photo: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// GET /events/:id/photos — List photos
export async function getEventPhotos(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('event_photos')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, photos: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// DELETE /events/:id/photos/:photoId — Delete photo
export async function deleteEventPhoto(req: Request, res: Response) {
  try {
    const { photoId } = req.params;
    const { error } = await supabaseAdmin.from('event_photos').delete().eq('id', photoId);
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, message: 'Photo deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 8. FEEDBACK
// ============================================================

// POST /events/:id/feedback — Submit feedback
export async function submitFeedback(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const parseResult = submitFeedbackSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('event_feedback')
      .insert({
        institution_id: req.user?.institution_id,
        event_id: eventId,
        ...parseResult.data
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ success: false, error: 'Feedback already submitted for this event.' });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(201).json({ success: true, feedback: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// GET /events/:id/feedback — List feedback
export async function getEventFeedback(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('event_feedback')
      .select('*, students(name)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Compute stats
    const ratings = (data || []).map((f: any) => f.overall_rating);
    const avgOverall = ratings.length > 0
      ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1)
      : '0';

    return res.status(200).json({
      success: true,
      feedback: data || [],
      stats: {
        total_responses: ratings.length,
        avg_overall_rating: parseFloat(avgOverall),
        rating_distribution: {
          5: ratings.filter((r: number) => r === 5).length,
          4: ratings.filter((r: number) => r === 4).length,
          3: ratings.filter((r: number) => r === 3).length,
          2: ratings.filter((r: number) => r === 2).length,
          1: ratings.filter((r: number) => r === 1).length
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 9. ANNOUNCEMENTS
// ============================================================

// POST /events/:id/announcements — Create announcement
export async function createAnnouncement(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const parseResult = createAnnouncementSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('event_announcements')
      .insert({
        institution_id: req.user?.institution_id,
        event_id: eventId,
        ...parseResult.data,
        created_by: req.user?.id
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, announcement: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// GET /events/:id/announcements — List announcements
export async function getEventAnnouncements(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('event_announcements')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, announcements: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ============================================================
// 10. ANALYTICS & REPORTING
// ============================================================

// GET /events/analytics/overview — Dashboard KPIs
export async function getEventsAnalytics(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;

    // Total events
    const { count: totalEvents } = await supabaseAdmin
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institutionId);

    // Upcoming events
    const { count: upcomingEvents } = await supabaseAdmin
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institutionId)
      .gte('start_datetime', new Date().toISOString());

    // Total registrations
    const { count: totalRegistrations } = await supabaseAdmin
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institutionId);

    // Total checked-in
    const { count: totalCheckedIn } = await supabaseAdmin
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institutionId)
      .eq('attendance_marked', true);

    // Total revenue from paid events
    const { data: paidRegs } = await supabaseAdmin
      .from('event_registrations')
      .select('amount_paid')
      .eq('institution_id', institutionId)
      .eq('payment_status', 'Completed');

    const totalRevenue = (paidRegs || []).reduce((acc: number, r: any) => acc + (r.amount_paid || 0), 0);

    // Category-wise breakdown
    const { data: eventsByCategory } = await supabaseAdmin
      .from('events')
      .select('category')
      .eq('institution_id', institutionId);

    const categoryCount: Record<string, number> = {};
    (eventsByCategory || []).forEach((e: any) => {
      categoryCount[e.category] = (categoryCount[e.category] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      analytics: {
        total_events: totalEvents || 0,
        upcoming_events: upcomingEvents || 0,
        total_registrations: totalRegistrations || 0,
        total_checked_in: totalCheckedIn || 0,
        attendance_rate: totalRegistrations
          ? ((totalCheckedIn || 0) / totalRegistrations * 100).toFixed(1) + '%'
          : '0%',
        total_revenue: totalRevenue,
        events_by_category: categoryCount
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// GET /events/:id/report — Generate PDF event report
export async function generateEventReportPdf(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const PDFDocument = require('pdfkit');

    // Fetch event details
    const { data: event } = await supabaseAdmin.from('events').select('*').eq('id', eventId).single();
    if (!event) return res.status(404).json({ success: false, error: 'Event not found.' });

    // Fetch registration count + attendance
    const { data: regs } = await supabaseAdmin
      .from('event_registrations')
      .select('attendance_marked, payment_status, amount_paid')
      .eq('event_id', eventId);

    const totalRegs = regs?.length || 0;
    const attended = regs?.filter((r: any) => r.attendance_marked).length || 0;
    const revenue = regs?.reduce((acc: number, r: any) => acc + (r.amount_paid || 0), 0) || 0;

    // Fetch budget
    const { data: budgetItems } = await supabaseAdmin
      .from('event_budget')
      .select('category, estimated_amount, actual_amount')
      .eq('event_id', eventId);

    const totalBudget = budgetItems?.reduce((acc: number, b: any) => acc + (b.actual_amount || 0), 0) || 0;

    // Fetch feedback
    const { data: feedbackData } = await supabaseAdmin
      .from('event_feedback')
      .select('overall_rating')
      .eq('event_id', eventId);

    const avgRating = feedbackData && feedbackData.length > 0
      ? (feedbackData.reduce((acc: number, f: any) => acc + f.overall_rating, 0) / feedbackData.length).toFixed(1)
      : 'N/A';

    // Generate PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="event-report-${eventId.slice(0, 8)}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(24).fillColor('#6C2BD9').text('IRIS Events', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#888').text('Event Report', { align: 'center' });
    doc.moveDown(1);

    // Divider
    doc.strokeColor('#6C2BD9').lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Event details
    doc.fontSize(18).fillColor('#333').text(event.title);
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666');
    doc.text(`Category: ${event.category}    |    Venue: ${event.venue || 'TBA'}`);
    doc.text(`Date: ${new Date(event.start_datetime).toLocaleDateString()} — ${new Date(event.end_datetime).toLocaleDateString()}`);
    doc.text(`Status: ${event.status}`);
    doc.moveDown(1);

    // KPIs
    doc.fontSize(14).fillColor('#6C2BD9').text('Key Metrics');
    doc.moveDown(0.5);

    const kpis = [
      ['Total Registrations', `${totalRegs}`],
      ['Attendance', `${attended} / ${totalRegs} (${totalRegs ? ((attended / totalRegs) * 100).toFixed(0) : 0}%)`],
      ['Revenue Collected', `₹${revenue.toLocaleString()}`],
      ['Total Expenses', `₹${totalBudget.toLocaleString()}`],
      ['Net Profit/Loss', `₹${(revenue - totalBudget).toLocaleString()}`],
      ['Avg Feedback Rating', `${avgRating} / 5.0`]
    ];

    doc.fontSize(10).fillColor('#333');
    kpis.forEach(([label, value]) => {
      doc.text(`${label}: `, { continued: true }).fillColor('#6C2BD9').text(value).fillColor('#333');
    });

    doc.moveDown(1);

    // Budget breakdown
    if (budgetItems && budgetItems.length > 0) {
      doc.fontSize(14).fillColor('#6C2BD9').text('Budget Breakdown');
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#333');

      budgetItems.forEach((item: any) => {
        doc.text(`• ${item.category}: Estimated ₹${item.estimated_amount} | Actual ₹${item.actual_amount}`);
      });
    }

    doc.moveDown(1.5);

    // Footer
    doc.fontSize(8).fillColor('#aaa').text(`Generated on ${new Date().toLocaleString()} • IRIS 365 Platform`, { align: 'center' });

    doc.end();
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error generating report.' });
  }
}
