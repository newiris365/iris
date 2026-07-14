import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authMiddleware, requireRole } from '../middleware/auth';
import { getRazorpayClient } from '../lib/razorpay';
import crypto from 'crypto';

const router = Router();
router.use(authMiddleware);

// ========== PRICING MANAGEMENT (Institute Admin) ==========

// GET /pricing/:institutionId — List all pricing plans for an institution
router.get('/pricing/:institutionId', async (req: Request, res: Response) => {
  try {
    const { institutionId } = req.params;
    const { service_type } = req.query;

    let query = supabaseAdmin
      .from('service_pricing')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('is_active', true)
      .order('service_type')
      .order('price');

    if (service_type) {
      query = query.eq('service_type', service_type);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, pricing: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /pricing — Create or update a pricing plan (Admin only)
router.post('/pricing', requireRole(['Admin', 'SuperAdmin']), async (req: Request, res: Response) => {
  try {
    const { institution_id, service_type, name, description, price, duration_days, features } = req.body;

    if (!institution_id || !service_type || !name || price === undefined) {
      return res.status(400).json({ success: false, error: 'institution_id, service_type, name, and price are required.' });
    }

    if (!['hostel', 'transit', 'gym'].includes(service_type)) {
      return res.status(400).json({ success: false, error: 'service_type must be hostel, transit, or gym.' });
    }

    const { data, error } = await supabaseAdmin
      .from('service_pricing')
      .upsert({
        institution_id,
        service_type,
        name,
        description: description || null,
        price,
        duration_days: duration_days || 30,
        features: features || [],
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'institution_id,service_type,name' })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, plan: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /pricing/:id — Deactivate a pricing plan (Admin only)
router.delete('/pricing/:id', requireRole(['Admin', 'SuperAdmin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('service_pricing')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ========== SUBSCRIPTION STATUS ==========

// GET /status/:studentId — Check if student has active subscription for a service type
router.get('/status/:studentId', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { service_type } = req.query;

    const today = new Date().toISOString().split('T')[0];

    let query = supabaseAdmin
      .from('service_subscriptions')
      .select('id, service_type, start_date, end_date, amount_paid, status, pricing_id, service_pricing(name, price, features)')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .gte('end_date', today);

    if (service_type) {
      query = query.eq('service_type', service_type);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    // Build a map: service_type → subscription details
    const subscriptions: Record<string, any> = {};
    for (const sub of data || []) {
      subscriptions[sub.service_type] = {
        id: sub.id,
        end_date: sub.end_date,
        amount_paid: sub.amount_paid,
        plan_name: (sub as any).service_pricing?.name || 'Unknown',
        features: (sub as any).service_pricing?.features || [],
      };
    }

    return res.status(200).json({
      success: true,
      has_hostel: !!subscriptions['hostel'],
      has_transit: !!subscriptions['transit'],
      has_gym: !!subscriptions['gym'],
      subscriptions
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ========== PURCHASE FLOW ==========

// POST /initiate — Create Razorpay order for a service subscription
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const { student_id, pricing_id } = req.body;

    if (!student_id || !pricing_id) {
      return res.status(400).json({ success: false, error: 'student_id and pricing_id are required.' });
    }

    // Fetch pricing plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from('service_pricing')
      .select('*')
      .eq('id', pricing_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return res.status(400).json({ success: false, error: 'Pricing plan not found or inactive.' });
    }

    const amount = Math.round(plan.price * 100); // paise
    const razorpay = getRazorpayClient();

    if (razorpay) {
      const order = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: `svc_${plan.service_type}_${student_id}_${Date.now()}`.slice(0, 40),
        notes: {
          type: 'service_subscription',
          service_type: plan.service_type,
          pricing_id: plan.id,
          student_id,
          institution_id: plan.institution_id
        }
      });

      return res.status(200).json({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        plan_name: plan.name,
        service_type: plan.service_type
      });
    }

    // Mock/Sandbox Mode
    const mockOrderId = 'order_mock_svc_' + Math.random().toString(36).substring(2, 12);
    return res.status(200).json({
      success: true,
      order_id: mockOrderId,
      amount,
      currency: 'INR',
      key_id: 'rzp_test_mock',
      mock: true,
      plan_name: plan.name,
      service_type: plan.service_type
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error initiating payment.' });
  }
});

// POST /verify — Verify Razorpay payment and activate subscription
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, student_id, pricing_id } = req.body;

    if (!student_id || !pricing_id) {
      return res.status(400).json({ success: false, error: 'student_id and pricing_id are required.' });
    }

    // Fetch pricing plan
    const { data: plan } = await supabaseAdmin
      .from('service_pricing')
      .select('*')
      .eq('id', pricing_id)
      .single();

    if (!plan) {
      return res.status(400).json({ success: false, error: 'Pricing plan not found.' });
    }

    // Verify Razorpay signature if not mock
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (secret && razorpay_order_id && !razorpay_order_id.startsWith('order_mock_')) {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, error: 'Razorpay signature validation failed.' });
      }
    }

    // Check for existing active subscription of same type
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabaseAdmin
      .from('service_subscriptions')
      .select('id, end_date')
      .eq('student_id', student_id)
      .eq('service_type', plan.service_type)
      .eq('status', 'active')
      .gte('end_date', today)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Active ${plan.service_type} subscription already exists until ${existing.end_date}.`
      });
    }

    // Create subscription
    const endDate = new Date(Date.now() + plan.duration_days * 24 * 3600 * 1000).toISOString().split('T')[0];

    const { data: sub, error: subError } = await supabaseAdmin
      .from('service_subscriptions')
      .insert({
        institution_id: plan.institution_id,
        student_id,
        service_type: plan.service_type,
        pricing_id: plan.id,
        start_date: today,
        end_date: endDate,
        amount_paid: plan.price,
        transaction_id: razorpay_payment_id || 'mock_' + Date.now(),
        status: 'active'
      })
      .select()
      .single();

    if (subError) return res.status(500).json({ success: false, error: subError.message });

    return res.status(200).json({
      success: true,
      message: `${plan.service_type} subscription activated successfully.`,
      subscription: sub,
      end_date: endDate
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error verifying payment.' });
  }
});

// GET /my/:studentId — Get all subscriptions for a student
router.get('/my/:studentId', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('service_subscriptions')
      .select('*, service_pricing(name, price, features, duration_days)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, subscriptions: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
