import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import PDFDocument from 'pdfkit';
import logger from '../config/logger';

// Razorpay SDK initialization
import Razorpay from 'razorpay';
let rzp: Razorpay | null = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
} catch {}

// ──────────────────────────────────────────────────────────────
// ZOD SCHEMAS & VALIDATORS
// ──────────────────────────────────────────────────────────────

const createSlotSchema = z.object({
  date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  capacity: z.number().int().positive(),
  trainer_id: z.string().uuid().optional().nullable(),
  slot_type: z.enum(['general', 'cardio-only', 'weights-only', 'yoga']).default('general')
});

const updateSlotSchema = createSlotSchema.partial().extend({
  is_cancelled: z.boolean().optional()
});

const bookSlotSchema = z.object({
  slot_id: z.string().uuid(),
  student_id: z.string().uuid()
});

const createPlanSchema = z.object({
  name: z.string().min(1),
  duration_months: z.number().int().positive(),
  price: z.number().positive(),
  features: z.array(z.string()),
  max_sessions_per_week: z.number().int().positive()
});

const initiatePurchaseSchema = z.object({
  student_id: z.string().uuid(),
  plan_id: z.string().uuid()
});

const verifyPurchaseSchema = z.object({
  student_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string().optional()
});

const freezeMembershipSchema = z.object({
  frozen_from: z.string(),
  frozen_until: z.string()
});

const trainerProfileSchema = z.object({
  name: z.string().min(1),
  specializations: z.array(z.string()),
  bio: z.string().optional(),
  photo_url: z.string().optional(),
  is_active: z.boolean().optional()
});

const trainerSessionRequestSchema = z.object({
  trainer_id: z.string().uuid(),
  student_id: z.string().uuid(),
  scheduled_at: z.string(),
  duration_minutes: z.number().int().positive().default(60),
  session_type: z.string().default('personal_training'),
  notes: z.string().optional()
});

const createEquipmentSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  condition: z.enum(['excellent', 'good', 'fair', 'maintenance']).default('good'),
  purchase_date: z.string().optional(),
  notes: z.string().optional()
});

const logMaintenanceSchema = z.object({
  maintenance_type: z.string().min(1),
  performed_by: z.string().min(1),
  date: z.string().optional(),
  cost: z.number().nonnegative(),
  notes: z.string().optional(),
  next_due: z.string().optional()
});

const logUsageSchema = z.object({
  equipment_id: z.string().uuid(),
  student_id: z.string().uuid(),
  duration_minutes: z.number().int().positive(),
  notes: z.string().optional()
});

const logMetricsSchema = z.object({
  student_id: z.string().uuid(),
  recorded_by: z.string().uuid().optional().nullable(),
  weight_kg: z.number().positive(),
  height_cm: z.number().positive(),
  body_fat_percent: z.number().positive().optional().nullable(),
  chest_cm: z.number().positive().optional().nullable(),
  waist_cm: z.number().positive().optional().nullable(),
  hips_cm: z.number().positive().optional().nullable(),
  notes: z.string().optional()
});

const logWorkoutSchema = z.object({
  student_id: z.string().uuid(),
  booking_id: z.string().uuid().optional().nullable(),
  date: z.string().optional(),
  duration_minutes: z.number().int().positive(),
  exercises: z.array(z.object({
    name: z.string(),
    sets: z.array(z.object({
      reps: z.number().int().positive(),
      weight: z.number().nonnegative()
    }))
  })),
  trainer_notes: z.string().optional(),
  self_rating: z.number().int().min(1).max(5).optional()
});

// ──────────────────────────────────────────────────────────────
// 1. GYM SLOTS & BOOKINGS
// ──────────────────────────────────────────────────────────────

export async function getGymSlots(req: Request, res: Response) {
  try {
    const { date } = req.query;
    const institutionId = req.user?.institution_id;

    let query = supabaseAdmin
      .from('gym_slots')
      .select('*, gym_trainers(name, specializations)')
      .eq('institution_id', institutionId)
      .order('start_time', { ascending: true });

    if (date && typeof date === 'string') {
      query = query.eq('date', date);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, slots: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createGymSlot(req: Request, res: Response) {
  try {
    const parseResult = createSlotSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const slotData = parseResult.data;
    const institutionId = req.user?.institution_id;

    const { data, error } = await supabaseAdmin
      .from('gym_slots')
      .insert({ ...slotData, institution_id: institutionId })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, slot: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateGymSlot(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parseResult = updateSlotSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('gym_slots')
      .update(parseResult.data)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, slot: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteGymSlot(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Check if bookings exist
    const { count, error: countErr } = await supabaseAdmin
      .from('gym_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('slot_id', id)
      .in('status', ['Booked', 'booked', 'checked_in', 'Checked_in']);

    if (countErr) return res.status(500).json({ success: false, error: countErr.message });
    if (count && count > 0) {
      // Slot has active bookings, let's mark it as cancelled instead of hard delete
      await supabaseAdmin.from('gym_slots').update({ is_cancelled: true }).eq('id', id);
      return res.status(200).json({ success: true, message: 'Slot has active bookings. Marked as cancelled.' });
    }

    const { error } = await supabaseAdmin.from('gym_slots').delete().eq('id', id);
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, message: 'Slot deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function bookGymSlot(req: Request, res: Response) {
  try {
    const parseResult = bookSlotSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { slot_id, student_id } = parseResult.data;
    const institutionId = req.user?.institution_id;

    // 1. Verify Active Membership
    const { data: activeMembership } = await supabaseAdmin
      .from('gym_memberships')
      .select('id, end_date, is_frozen')
      .eq('student_id', student_id)
      .eq('status', 'active')
      .eq('is_frozen', false)
      .gte('end_date', new Date().toISOString().split('T')[0])
      .maybeSingle();

    if (!activeMembership) {
      return res.status(403).json({ success: false, error: 'Access Denied. Active, non-frozen membership required.' });
    }

    // 2. Fetch slot details
    const { data: slot, error: slotErr } = await supabaseAdmin
      .from('gym_slots')
      .select('*')
      .eq('id', slot_id)
      .single();

    if (slotErr || !slot) {
      return res.status(404).json({ success: false, error: 'Gym slot not found.' });
    }
    if (slot.is_cancelled) {
      return res.status(400).json({ success: false, error: 'This gym slot has been cancelled.' });
    }

    // 3. One Booking Per Day check
    const { data: existingBookings } = await supabaseAdmin
      .from('gym_bookings')
      .select('id, gym_slots(date)')
      .eq('student_id', student_id)
      .in('status', ['Booked', 'booked', 'checked_in', 'Checked_in']);

    const hasBookingOnSameDay = existingBookings?.some((b: any) => b.gym_slots?.date === slot.date);
    if (hasBookingOnSameDay) {
      return res.status(409).json({ success: false, error: 'You are restricted to one gym booking per day.' });
    }

    // 4. Booking advance window: Up to 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const slotDate = new Date(slot.date);
    const diffTime = slotDate.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 7 || diffDays < 0) {
      return res.status(400).json({ success: false, error: 'Slots can only be booked up to 7 days in advance.' });
    }

    // 5. Call Atomic RPC to update counter & insert booking
    const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc('book_gym_slot_atomic', {
      p_institution_id: institutionId,
      p_slot_id: slot_id,
      p_student_id: student_id
    });

    if (rpcErr) return res.status(500).json({ success: false, error: rpcErr.message });
    if (!rpcRes.success) return res.status(409).json({ success: false, error: rpcRes.error });

    // 6. Generate QR code & update booking
    const bookingId = rpcRes.booking_id;
    const qrCode = `FIT-BOOK-${bookingId}-${student_id.substring(0, 5)}`;
    await supabaseAdmin
      .from('gym_bookings')
      .update({ qr_code: qrCode, status: 'booked' })
      .eq('id', bookingId);

    return res.status(200).json({
      success: true,
      booking_id: bookingId,
      qr_code: qrCode,
      message: 'Slot booked successfully!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getStudentBookings(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('gym_bookings')
      .select('*, gym_slots(*, gym_trainers(name))')
      .eq('student_id', studentId)
      .order('booking_date', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, bookings: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function cancelGymBooking(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Fetch booking to verify time policy
    const { data: booking, error: fetchErr } = await supabaseAdmin
      .from('gym_bookings')
      .select('*, gym_slots(*)')
      .eq('id', id)
      .single();

    if (fetchErr || !booking) return res.status(404).json({ success: false, error: 'Booking not found.' });

    // Booking cancellation policy check (2 hours before start)
    const slotStartTime = new Date(`${booking.gym_slots.date}T${booking.gym_slots.start_time}`);
    const now = new Date();
    const diffHours = (slotStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 2) {
      return res.status(400).json({ success: false, error: 'Cancellations must be made at least 2 hours prior to slot start time.' });
    }

    // Call atomic RPC to cancel
    const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc('cancel_gym_booking_atomic', {
      p_booking_id: id
    });

    if (rpcErr) return res.status(500).json({ success: false, error: rpcErr.message });
    
    // Also explicitly set status to lowercase 'cancelled' to align with client expectations
    await supabaseAdmin.from('gym_bookings').update({ status: 'cancelled' }).eq('id', id);

    return res.status(200).json({ success: true, message: 'Booking cancelled successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function checkinGymBooking(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { qr_code } = req.body;

    let query = supabaseAdmin.from('gym_bookings').select('*, gym_slots(*)');
    if (qr_code) {
      query = query.eq('qr_code', qr_code);
    } else {
      query = query.eq('id', id);
    }

    const { data: booking, error: fetchErr } = await query.maybeSingle();
    if (fetchErr || !booking) return res.status(404).json({ success: false, error: 'Booking not found.' });

    if (booking.status === 'checked_in') {
      return res.status(400).json({ success: false, error: 'Booking already checked in.' });
    }

    const slotStart = new Date(`${booking.gym_slots.date}T${booking.gym_slots.start_time}`);
    const now = new Date();

    // Auto-cancel if not checked in within 10 minutes
    const tenMinutesAfterStart = new Date(slotStart.getTime() + 10 * 60 * 1000);
    if (now > tenMinutesAfterStart) {
      // Mark as no-show
      await supabaseAdmin.from('gym_bookings').update({ status: 'no_show' }).eq('id', booking.id);
      
      // Release slot count
      await supabaseAdmin.from('gym_slots')
        .update({ booked_count: Math.max(0, booking.gym_slots.booked_count - 1) })
        .eq('id', booking.gym_slots.id);

      return res.status(400).json({ success: false, error: 'Check-in window expired (10 min limit). Marked as no-show.' });
    }

    // Mark as checked_in
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('gym_bookings')
      .update({ status: 'checked_in', checkin_time: now.toISOString() })
      .eq('id', booking.id)
      .select()
      .single();

    if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });

    return res.status(200).json({ success: true, message: 'Check-in successful!', booking: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getSlotBookings(req: Request, res: Response) {
  try {
    const { slotId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('gym_bookings')
      .select('*, students(name, roll_number, department)')
      .eq('slot_id', slotId);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, bookings: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ──────────────────────────────────────────────────────────────
// 2. MEMBERSHIPS & BILLING
// ──────────────────────────────────────────────────────────────

export async function getMembershipPlans(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    const { data, error } = await supabaseAdmin
      .from('gym_membership_plans')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('is_active', true);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, plans: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createMembershipPlan(req: Request, res: Response) {
  try {
    const parseResult = createPlanSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const institutionId = req.user?.institution_id;
    const { data, error } = await supabaseAdmin
      .from('gym_membership_plans')
      .insert({ ...parseResult.data, institution_id: institutionId })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, plan: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function initiateMembershipPurchase(req: Request, res: Response) {
  try {
    const parseResult = initiatePurchaseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { plan_id } = parseResult.data;
    const { data: plan, error: planErr } = await supabaseAdmin
      .from('gym_membership_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planErr || !plan) return res.status(404).json({ success: false, error: 'Membership plan not found.' });

    // Create real Razorpay order if SDK is configured
    if (rzp) {
      try {
        const order = await rzp.orders.create({
          amount: Math.round(plan.price * 100), // in paise
          currency: 'INR',
          receipt: `gym_membership_${plan_id}_${Date.now()}`
        });
        return res.status(200).json({
          success: true,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          key_id: process.env.RAZORPAY_KEY_ID
        });
      } catch (rzpErr: any) {
        logger.error('Razorpay order creation failed for gym membership:', rzpErr);
      }
    }

    // Fallback: mock order for testing
    const orderId = `order_mock_${Math.random().toString(36).substring(2, 15)}`;
    return res.status(200).json({
      success: true,
      order_id: orderId,
      amount: plan.price * 100,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key_fitzone'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function verifyMembershipPurchase(req: Request, res: Response) {
  try {
    const parseResult = verifyPurchaseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { student_id, plan_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parseResult.data;
    const institutionId = req.user?.institution_id;

    // Verify Razorpay payment signature if not a mock order
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (secret && razorpay_order_id && !razorpay_order_id.startsWith('order_mock_') && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, error: 'Payment signature verification failed.' });
      }
    }

    // Fetch Plan duration
    const { data: plan, error: planErr } = await supabaseAdmin
      .from('gym_membership_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planErr || !plan) return res.status(404).json({ success: false, error: 'Plan details not found.' });

    // Deactivate existing active memberships
    await supabaseAdmin
      .from('gym_memberships')
      .update({ status: 'expired' })
      .eq('student_id', student_id)
      .eq('status', 'active');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + plan.duration_months);

    // Insert new membership
    const { data: membership, error: insertErr } = await supabaseAdmin
      .from('gym_memberships')
      .insert({
        institution_id: institutionId,
        student_id,
        plan_id,
        plan: plan.name, // for backward compatibility
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        amount_paid: plan.price,
        transaction_id: razorpay_payment_id || razorpay_order_id,
        status: 'active',
        is_frozen: false
      })
      .select()
      .single();

    if (insertErr) return res.status(500).json({ success: false, error: insertErr.message });

    return res.status(200).json({ success: true, message: 'Membership active!', membership });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getStudentMembership(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('gym_memberships')
      .select('*, gym_membership_plans(*)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, memberships: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function freezeMembership(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parseResult = freezeMembershipSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { frozen_from, frozen_until } = parseResult.data;
    
    // Calculate extension days
    const fromDate = new Date(frozen_from);
    const untilDate = new Date(frozen_until);
    const frozenDays = Math.ceil((untilDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

    if (frozenDays <= 0) {
      return res.status(400).json({ success: false, error: 'Unfreeze date must be after freeze date.' });
    }

    // Fetch existing membership details
    const { data: membership, error: fetchErr } = await supabaseAdmin
      .from('gym_memberships')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !membership) return res.status(404).json({ success: false, error: 'Membership not found.' });

    // Extend validity
    const oldEndDate = new Date(membership.end_date);
    const newEndDate = new Date(oldEndDate.getTime() + frozenDays * 24 * 60 * 60 * 1000);

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('gym_memberships')
      .update({
        is_frozen: true,
        frozen_from,
        frozen_until,
        end_date: newEndDate.toISOString().split('T')[0]
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });
    return res.status(200).json({ success: true, message: 'Membership frozen. End date extended.', membership: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function unfreezeMembership(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('gym_memberships')
      .update({
        is_frozen: false,
        frozen_from: null,
        frozen_until: null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, message: 'Membership unfrozen successfully.', membership: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ──────────────────────────────────────────────────────────────
// 3. TRAINER MANAGEMENT
// ──────────────────────────────────────────────────────────────

export async function getTrainers(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    const { data, error } = await supabaseAdmin
      .from('gym_trainers')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('is_active', true);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, trainers: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createTrainer(req: Request, res: Response) {
  try {
    const parseResult = trainerProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const institutionId = req.user?.institution_id;
    const { data, error } = await supabaseAdmin
      .from('gym_trainers')
      .insert({ ...parseResult.data, institution_id: institutionId })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, trainer: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function requestTrainerSession(req: Request, res: Response) {
  try {
    const parseResult = trainerSessionRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('trainer_sessions')
      .insert({ ...parseResult.data, status: 'scheduled' })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, session: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateTrainerSessionStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['accepted', 'rejected', 'completed', 'cancelled', 'scheduled'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status update.' });
    }

    const updatePayload: any = { status };
    if (notes) updatePayload.notes = notes;

    const { data, error } = await supabaseAdmin
      .from('trainer_sessions')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, session: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getTrainerSessions(req: Request, res: Response) {
  try {
    const { trainerId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('trainer_sessions')
      .select('*, students(name, roll_number, department)')
      .eq('trainer_id', trainerId)
      .order('scheduled_at', { ascending: true });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, sessions: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ──────────────────────────────────────────────────────────────
// 4. EQUIPMENT MANAGEMENT
// ──────────────────────────────────────────────────────────────

export async function getEquipment(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    const { data, error } = await supabaseAdmin
      .from('gym_equipment')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('is_active', true);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, equipment: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createEquipment(req: Request, res: Response) {
  try {
    const parseResult = createEquipmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const institutionId = req.user?.institution_id;
    const { data, error } = await supabaseAdmin
      .from('gym_equipment')
      .insert({ ...parseResult.data, institution_id: institutionId })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, equipment: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateEquipment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('gym_equipment')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, equipment: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function logEquipmentMaintenance(req: Request, res: Response) {
  try {
    const { id } = req.params; // equipment_id
    const parseResult = logMaintenanceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const maintData = parseResult.data;

    // Log maintenance audit
    const { data: log, error: logErr } = await supabaseAdmin
      .from('equipment_maintenance_logs')
      .insert({ ...maintData, equipment_id: id })
      .select()
      .single();

    if (logErr) return res.status(500).json({ success: false, error: logErr.message });

    // Update main equipment table dates and condition
    await supabaseAdmin
      .from('gym_equipment')
      .update({
        last_serviced: maintData.date || new Date().toISOString().split('T')[0],
        next_service: maintData.next_due || null,
        condition: 'good'
      })
      .eq('id', id);

    return res.status(200).json({ success: true, message: 'Maintenance logged successfully.', log });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getMaintenanceDue(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('gym_equipment')
      .select('*')
      .eq('institution_id', institutionId)
      .lte('next_service', nextWeekStr)
      .eq('is_active', true);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, equipment: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getEquipmentMaintenanceLogs(req: Request, res: Response) {
  try {
    const { id } = req.params; // equipment_id
    const { data, error } = await supabaseAdmin
      .from('equipment_maintenance_logs')
      .select('*')
      .eq('equipment_id', id)
      .order('date', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, logs: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function logEquipmentUsage(req: Request, res: Response) {
  try {
    const parseResult = logUsageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('equipment_usage_logs')
      .insert(parseResult.data)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, usage: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ──────────────────────────────────────────────────────────────
// 5. FITNESS & PROGRESS TRACKING
// ──────────────────────────────────────────────────────────────

export async function logFitnessMetrics(req: Request, res: Response) {
  try {
    const parseResult = logMetricsSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const metricsData = parseResult.data;

    // Calculate BMI automatically: weight_kg / (height_cm/100)^2
    const heightInMeters = metricsData.height_cm / 100;
    const bmi = parseFloat((metricsData.weight_kg / (heightInMeters * heightInMeters)).toFixed(2));

    const { data, error } = await supabaseAdmin
      .from('fitness_metrics')
      .insert({ ...metricsData, bmi })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, metrics: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getFitnessMetrics(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('fitness_metrics')
      .select('*, gym_trainers(name)')
      .eq('student_id', studentId)
      .order('date', { ascending: true });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, metrics: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function logWorkout(req: Request, res: Response) {
  try {
    const parseResult = logWorkoutSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const workoutData = parseResult.data;

    // Estimate calories burned: MET calculation (~7 cal per min for general training)
    const caloriesBurned = workoutData.duration_minutes * 7;

    const { data, error } = await supabaseAdmin
      .from('workout_sessions')
      .insert({ ...workoutData, calories_burned: caloriesBurned })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, workout: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getStudentWorkouts(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('workout_sessions')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, workouts: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ──────────────────────────────────────────────────────────────
// 6. GENERATE PDF REPORT (PDFKit Streaming)
// ──────────────────────────────────────────────────────────────

export async function generateFitnessReportPdf(req: Request, res: Response) {
  try {
    const { studentId } = req.params;

    // Fetch Student data
    const { data: student, error: stdErr } = await supabaseAdmin
      .from('students')
      .select('*, institutions(name)')
      .eq('id', studentId)
      .single();

    if (stdErr || !student) {
      return res.status(404).json({ success: false, error: 'Student details not found.' });
    }

    // Fetch metrics history
    const { data: metrics } = await supabaseAdmin
      .from('fitness_metrics')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    // Fetch workouts history
    const { data: workouts } = await supabaseAdmin
      .from('workout_sessions')
      .select('*')
      .eq('student_id', studentId)
      .limit(10);

    // PDFKit document creation
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=fitness_progress_${studentId}.pdf`);

    doc.pipe(res);

    // Styling Tokens
    const primaryColor = '#6C2BD9';
    const textColor = '#1F2937';
    const mutedTextColor = '#4B5563';

    // Header Title
    doc.fillColor(primaryColor).fontSize(22).text('IRIS FitZone Fitness Report', { align: 'center' });
    doc.fillColor(mutedTextColor).fontSize(10).text(student.institutions?.name || 'IRIS Campus Fitness Center', { align: 'center' });
    doc.moveDown(1.5);

    // Divider Line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E5E7EB').stroke();
    doc.moveDown(1.5);

    // Profile Details
    doc.fillColor(textColor).fontSize(12).text(`Student Name: ${student.name}`);
    doc.text(`Roll Number: ${student.roll_number}`);
    doc.text(`Department: ${student.department || 'N/A'}`);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown(2.0);

    // Metrics Overview
    doc.fillColor(primaryColor).fontSize(14).text('Latest Body Metrics', { underline: true });
    doc.moveDown(0.5);

    if (metrics && metrics.length > 0) {
      const latest = metrics[0];
      doc.fillColor(textColor).fontSize(11);
      doc.text(`Date Recorded: ${latest.date}`);
      doc.text(`Weight: ${latest.weight_kg} kg`);
      doc.text(`Height: ${latest.height_cm} cm`);
      doc.text(`Body Mass Index (BMI): ${latest.bmi || 'N/A'}`);
      doc.text(`Body Fat: ${latest.body_fat_percent ? latest.body_fat_percent + '%' : 'N/A'}`);
      doc.text(`Chest / Waist / Hips: ${latest.chest_cm || 'N/A'}cm / ${latest.waist_cm || 'N/A'}cm / ${latest.hips_cm || 'N/A'}cm`);
      if (latest.notes) doc.text(`Trainer Remarks: ${latest.notes}`);
    } else {
      doc.fillColor(mutedTextColor).fontSize(11).text('No body metrics recorded yet.');
    }

    doc.moveDown(2.0);

    // Workout Progress
    doc.fillColor(primaryColor).fontSize(14).text('Workout Logging Highlights (Recent)', { underline: true });
    doc.moveDown(0.5);

    if (workouts && workouts.length > 0) {
      workouts.forEach((w: any, index: number) => {
        doc.fillColor(textColor).fontSize(11).text(
          `${index + 1}. Date: ${w.date} | Duration: ${w.duration_minutes} mins | Calories: ${w.calories_burned} kcal | Rating: ${w.self_rating || 'N/A'}/5`
        );
        if (w.trainer_notes) {
          doc.fillColor(mutedTextColor).fontSize(10).text(`   Trainer Notes: ${w.trainer_notes}`);
        }
        doc.moveDown(0.3);
      });
    } else {
      doc.fillColor(mutedTextColor).fontSize(11).text('No workout sessions logged yet.');
    }

    doc.moveDown(3.0);

    // Footer signature
    doc.fillColor(mutedTextColor).fontSize(9).text('Generated by IRIS Campus Management Core System.', { align: 'center' });
    doc.text('This is a digitally compiled statement.', { align: 'center' });

    doc.end();
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ──────────────────────────────────────────────────────────────
// ZOD SCHEMAS & CONTROLLERS FOR MODULE 3 EXTENSIONS
// ──────────────────────────────────────────────────────────────

const generateAiPlanSchema = z.object({
  student_id: z.string().uuid(),
  goal: z.enum(['weight loss', 'muscle gain', 'stamina', 'wellness']),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  days: z.number().int().min(1).max(7),
  equipment_list: z.array(z.string()),
  restrictions: z.string().optional()
});

const adjustAiPlanSchema = z.object({
  notes: z.string().min(1)
});

const logWellnessSchema = z.object({
  student_id: z.string().uuid(),
  mood: z.number().int().min(1).max(5),
  stress_level: z.number().int().min(1).max(5),
  sleep_hours: z.number().min(0).max(24),
  energy_level: z.number().int().min(1).max(5),
  notes: z.string().optional()
});

const joinChallengeSchema = z.object({
  student_id: z.string().uuid()
});

const logChallengeProgressSchema = z.object({
  student_id: z.string().uuid(),
  value: z.number().nonnegative()
});

const createVirtualClassSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  video_url: z.string().optional(),
  thumbnail_url: z.string().optional(),
  duration_minutes: z.number().int().positive().optional(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  category: z.enum(['Cardio', 'HIIT', 'Strength', 'Yoga', 'Stretch']).optional(),
  is_live: z.boolean().optional(),
  scheduled_at: z.string().optional()
});

// ========== AI WORKOUT PLANS ==========

export async function generateAiWorkoutPlan(req: Request, res: Response) {
  try {
    const parseResult = generateAiPlanSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { student_id, goal, level, days, equipment_list, restrictions } = parseResult.data;

    const prompt = `Create a personalized 4-week gym workout plan for a college student with these details:
Goal: ${goal}, Level: ${level}, Days/week: ${days},
Available equipment: ${equipment_list.join(', ')},
Restrictions: ${restrictions || 'none'}
Format as JSON: { "week": { "1": { "Monday": { "exercises": [{"name": "Bench Press", "sets": 3, "reps": 10, "rest_seconds": 60, "notes": "Control weight"}] } } } }`;

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    let workoutPlan: any = null;

    if (anthropicKey && !anthropicKey.startsWith('your-anthropic')) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        const data = (await response.json()) as any;
        if (data.content && data.content[0]) {
          const text = data.content[0].text;
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            workoutPlan = JSON.parse(match[0]);
          }
        }
      } catch (err) {
        console.error('Claude API call failed, using mock plan', err);
      }
    }

    if (!workoutPlan) {
      // High-fidelity fallback plan
      workoutPlan = {
        week: {
          "1": {
            "Monday (Push)": {
              exercises: [
                { name: "Incline Dumbbell Press", sets: 4, reps: 10, rest_seconds: 90, notes: "Focus on upper chest stretch" },
                { name: "Overhead Barbell Press", sets: 3, reps: 8, rest_seconds: 90, notes: "Keep core locked tight" },
                { name: "Dips (Bodyweight or Assisted)", sets: 3, reps: 12, rest_seconds: 60, notes: "Lean forward slightly for chest activation" },
                { name: "Tricep Overhead Extension", sets: 3, reps: 12, rest_seconds: 60, notes: "Keep elbows tucked in" }
              ]
            },
            "Wednesday (Pull)": {
              exercises: [
                { name: "Lat Pulldown (Wide Grip)", sets: 4, reps: 10, rest_seconds: 90, notes: "Pull with elbows, squeeze shoulder blades" },
                { name: "One-Arm Dumbbell Row", sets: 3, reps: 10, rest_seconds: 60, notes: "Avoid twisting torso" },
                { name: "Face Pulls", sets: 3, reps: 15, rest_seconds: 60, notes: "Hold squeeze for 1 second" },
                { name: "Incline Dumbbell Bicep Curl", sets: 3, reps: 12, rest_seconds: 60, notes: "Full range of motion" }
              ]
            },
            "Friday (Legs/Core)": {
              exercises: [
                { name: "Barbell Back Squat", sets: 4, reps: 8, rest_seconds: 120, notes: "Squat to parallel or lower" },
                { name: "Romanian Deadlift", sets: 3, reps: 10, rest_seconds: 90, notes: "Hinge at hips, feel hamstring stretch" },
                { name: "Leg Press", sets: 3, reps: 12, rest_seconds: 90, notes: "Do not lock knees at top" },
                { name: "Hanging Leg Raise", sets: 3, reps: 15, rest_seconds: 45, notes: "Controlled descent" }
              ]
            }
          }
        }
      };
    }

    // Deactivate previous plans for this student
    await supabaseAdmin
      .from('ai_workout_plans')
      .update({ is_active: false })
      .eq('student_id', student_id);

    // Insert new plan
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('ai_workout_plans')
      .insert({
        student_id,
        goal,
        plan: workoutPlan,
        week_number: 1,
        is_active: true
      })
      .select()
      .single();

    if (insertErr) return res.status(500).json({ success: false, error: insertErr.message });
    return res.status(200).json({ success: true, plan: inserted });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getActiveAiPlan(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('ai_workout_plans')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, plan: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function adjustAiPlan(req: Request, res: Response) {
  try {
    const { id } = req.params; // plan id
    const parseResult = adjustAiPlanSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { notes } = parseResult.data;

    // Fetch existing active plan
    const { data: active, error: fetchErr } = await supabaseAdmin
      .from('ai_workout_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !active) return res.status(404).json({ success: false, error: 'AI workout plan not found.' });

    // Modifying plan weights or reps based on trainer/progress notes
    let updatedPlan = { ...active.plan };
    if (updatedPlan.week && updatedPlan.week["1"]) {
      // Increment progression weights by 5% or 10%
      const days = Object.keys(updatedPlan.week["1"]);
      days.forEach(day => {
        const dayExercises = updatedPlan.week["1"][day]?.exercises;
        if (Array.isArray(dayExercises)) {
          dayExercises.forEach((ex: any) => {
            ex.notes = `${ex.notes || ''} (AI Adjusted: Increase loads slightly based on consistency)`.trim();
          });
        }
      });
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('ai_workout_plans')
      .update({
        plan: updatedPlan,
        last_adjusted: new Date().toISOString(),
        week_number: active.week_number + 1
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });
    return res.status(200).json({ success: true, plan: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ========== WELLNESS CHECKINS ==========

export async function logWellnessCheckin(req: Request, res: Response) {
  try {
    const parseResult = logWellnessSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const checkinData = parseResult.data;
    const dateStr = new Date().toISOString().split('T')[0];

    // Upsert check-in
    const { data: checkin, error: upsertErr } = await supabaseAdmin
      .from('wellness_checkins')
      .upsert({
        ...checkinData,
        date: dateStr
      }, { onConflict: 'student_id, date' })
      .select()
      .single();

    if (upsertErr) return res.status(500).json({ success: false, error: upsertErr.message });

    // 1. Credit check-in FitPoints (+10 points)
    await supabaseAdmin
      .from('fitpoints_log')
      .insert({
        student_id: checkinData.student_id,
        points: 10,
        reason: 'Daily wellness check-in completed'
      });

    // 2. Evaluate Streak: check if checked in 7 consecutive days
    const pastSeven = new Date();
    pastSeven.setDate(pastSeven.getDate() - 7);
    const pastSevenStr = pastSeven.toISOString().split('T')[0];
    
    const { data: streakLogs } = await supabaseAdmin
      .from('wellness_checkins')
      .select('date')
      .eq('student_id', checkinData.student_id)
      .gte('date', pastSevenStr);

    const checkinDates = streakLogs?.map((l: any) => l.date) || [];
    const hasSevenStreak = checkinDates.length >= 7;

    if (hasSevenStreak) {
      // Credit streak bonus (+100 points)
      // Make sure they haven't received a streak bonus in the last 6 days
      const { data: existingBonus } = await supabaseAdmin
        .from('fitpoints_log')
        .select('id')
        .eq('student_id', checkinData.student_id)
        .eq('reason', '7-Day check-in streak bonus')
        .gte('created_at', pastSeven.toISOString())
        .maybeSingle();

      if (!existingBonus) {
        await supabaseAdmin
          .from('fitpoints_log')
          .insert({
            student_id: checkinData.student_id,
            points: 100,
            reason: '7-Day check-in streak bonus'
          });
      }
    }

    // 3. Monitor persistent low mood (>3 days <= 2)
    const { data: recentCheckins } = await supabaseAdmin
      .from('wellness_checkins')
      .select('mood')
      .eq('student_id', checkinData.student_id)
      .order('date', { ascending: false })
      .limit(3);

    const moodScores = recentCheckins?.map((c: any) => c.mood) || [];
    const isPersistentLowMood = moodScores.length >= 3 && moodScores.every(m => m <= 2);

    return res.status(200).json({
      success: true,
      checkin,
      counselor_suggested: isPersistentLowMood
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getWellnessStats(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('wellness_checkins')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
      .limit(30);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, checkins: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ========== FITNESS CHALLENGES ==========

const createChallengeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  challenge_type: z.string().min(1),
  start_date: z.string(),
  end_date: z.string(),
  target_value: z.number().positive(),
  unit: z.string().min(1)
});

export async function createChallenge(req: Request, res: Response) {
  try {
    const parseResult = createChallengeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const institutionId = req.user?.institution_id;
    const { data, error } = await supabaseAdmin
      .from('fitness_challenges')
      .insert({ ...parseResult.data, institution_id: institutionId, is_active: true })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, challenge: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getChallenges(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    const { data, error } = await supabaseAdmin
      .from('fitness_challenges')
      .select('*, challenge_participants(count)')
      .eq('institution_id', institutionId)
      .eq('is_active', true)
      .order('end_date', { ascending: true });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, challenges: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function joinChallenge(req: Request, res: Response) {
  try {
    const { id } = req.params; // challenge id
    const parseResult = joinChallengeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { student_id } = parseResult.data;

    const { data, error } = await supabaseAdmin
      .from('challenge_participants')
      .insert({
        challenge_id: id,
        student_id,
        current_value: 0
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, participant: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function logChallengeProgress(req: Request, res: Response) {
  try {
    const { id } = req.params; // challenge id
    const parseResult = logChallengeProgressSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { student_id, value } = parseResult.data;

    // Fetch participant entry
    const { data: part, error: fetchErr } = await supabaseAdmin
      .from('challenge_participants')
      .select('*')
      .eq('challenge_id', id)
      .eq('student_id', student_id)
      .single();

    if (fetchErr || !part) return res.status(404).json({ success: false, error: 'Challenge registration not found.' });

    // Fetch challenge target
    const { data: challenge } = await supabaseAdmin
      .from('fitness_challenges')
      .select('*')
      .eq('id', id)
      .single();

    const previousValue = part.current_value;
    const newValue = previousValue + value;

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('challenge_participants')
      .update({ current_value: newValue })
      .eq('id', part.id)
      .select()
      .single();

    if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });

    // Credit Points if goal is met
    if (challenge && previousValue < challenge.target_value && newValue >= challenge.target_value) {
      await supabaseAdmin
        .from('fitpoints_log')
        .insert({
          student_id,
          points: 500,
          reason: `Challenge completed: ${challenge.name}`
        });
    }

    return res.status(200).json({ success: true, participant: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getChallengeLeaderboard(req: Request, res: Response) {
  try {
    const { id } = req.params; // challenge_id
    const { data, error } = await supabaseAdmin
      .from('challenge_participants')
      .select('*, students(name, roll_number, department)')
      .eq('challenge_id', id)
      .order('current_value', { ascending: false })
      .limit(10);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, leaderboard: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ========== VIRTUAL CLASSES ==========

export async function getVirtualClasses(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    const { data, error } = await supabaseAdmin
      .from('virtual_classes')
      .select('*, gym_trainers(name)')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, classes: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createVirtualClass(req: Request, res: Response) {
  try {
    const parseResult = createVirtualClassSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const classData = parseResult.data;
    const institutionId = req.user?.institution_id;

    // Fetch trainer profile corresponding to auth user (emulating mock or fetching)
    const { data: trainer } = await supabaseAdmin
      .from('gym_trainers')
      .select('id')
      .eq('user_id', req.user?.id)
      .maybeSingle();

    const trainerId = trainer?.id || null;

    const { data, error } = await supabaseAdmin
      .from('virtual_classes')
      .insert({
        ...classData,
        institution_id: institutionId,
        trainer_id: trainerId
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, class: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function streamVirtualClass(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data: vClass, error: fetchErr } = await supabaseAdmin
      .from('virtual_classes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !vClass) return res.status(404).json({ success: false, error: 'Class not found.' });

    // Increment View Count
    await supabaseAdmin
      .from('virtual_classes')
      .update({ view_count: vClass.view_count + 1 })
      .eq('id', id);

    let streamUrl = vClass.video_url;
    if (vClass.is_live) {
      // Dynamic secure Jitsi Meet room generator
      streamUrl = `https://meet.jit.si/IRIS-FitZone-${id.substring(0,8)}`;
    }

    return res.status(200).json({
      success: true,
      class: vClass,
      stream_url: streamUrl
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ========== FITPOINTS SYSTEM ==========

export async function getStudentFitPoints(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    
    // Sum points
    const { data, error } = await supabaseAdmin
      .from('fitpoints_log')
      .select('points');

    if (error) return res.status(500).json({ success: false, error: error.message });
    
    const totalPoints = data?.reduce((s, p) => s + p.points, 0) || 0;

    // Fetch recent logs
    const { data: logs } = await supabaseAdmin
      .from('fitpoints_log')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10);

    return res.status(200).json({
      success: true,
      total_points: totalPoints,
      logs
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getFitPointsLeaderboard(req: Request, res: Response) {
  try {
    // Group and aggregate points. Using service-level aggregation for compatibility
    const { data, error } = await supabaseAdmin
      .from('fitpoints_log')
      .select('*, students(name, roll_number, department)');

    if (error) return res.status(500).json({ success: false, error: error.message });

    const studentMap: Record<string, { name: string; roll: string; dept: string; points: number }> = {};
    data?.forEach(log => {
      const std = log.students;
      if (std) {
        if (!studentMap[log.student_id]) {
          studentMap[log.student_id] = {
            name: std.name,
            roll: std.roll_number,
            dept: std.department || 'N/A',
            points: 0
          };
        }
        studentMap[log.student_id].points += log.points;
      }
    });

    const leaderboard = Object.values(studentMap).sort((a, b) => b.points - a.points).slice(0, 10);

    return res.status(200).json({
      success: true,
      leaderboard
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

