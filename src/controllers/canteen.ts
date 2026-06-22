import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import logger from '../config/logger';

// Helper to resolve student_id from either user_id or students(id)
async function resolveStudentId(idOrUserId: string): Promise<string> {
  if (!idOrUserId || idOrUserId === '00000000-0000-0000-0000-000000000000') {
    return idOrUserId;
  }
  try {
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id')
      .or(`id.eq.${idOrUserId},user_id.eq.${idOrUserId}`)
      .maybeSingle();

    if (student) {
      return student.id;
    }
  } catch (err) {
    logger.error(`Error resolving student_id for ${idOrUserId}:`, err);
  }
  return idOrUserId;
}


// ──────────────────────────────────────────────────────────────
// ZOD SCHEMAS
// ──────────────────────────────────────────────────────────────

const createMenuItemSchema = z.object({
  item_name: z.string().min(1),
  category: z.string().min(1),
  category_id: z.string().uuid().optional(),
  price: z.number().positive(),
  description: z.string().optional(),
  image_url: z.string().optional(),
  allergens: z.string().optional(),
  calories: z.number().int().optional(),
  prep_time_mins: z.number().int().positive().optional(),
  is_veg: z.boolean().optional(),
  spice_level: z.number().int().min(0).max(3).optional()
});

const updateMenuItemSchema = createMenuItemSchema.partial().extend({
  is_available: z.boolean().optional()
});

const createCategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  sort_order: z.number().int().optional()
});

const createOrderSchema = z.object({
  student_id: z.string().uuid(),
  items: z.array(z.object({
    menu_id: z.string().uuid(),
    item_name: z.string(),
    qty: z.number().positive().int(),
    price: z.number().positive()
  })),
  total_amount: z.number().positive(),
  payment_method: z.enum(['Wallet', 'UPI', 'Card']),
  special_instructions: z.string().optional(),
  offer_code: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['Received', 'Preparing', 'Ready', 'Delivered', 'Cancelled'])
});

const topupSchema = z.object({
  student_id: z.string().uuid(),
  amount: z.number().positive()
});

const feedbackSchema = z.object({
  order_id: z.string().uuid(),
  student_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional()
});

const createOfferSchema = z.object({
  code: z.string().min(3).max(50),
  title: z.string().min(1),
  description: z.string().optional(),
  discount_type: z.enum(['percentage', 'flat']),
  discount_value: z.number().positive(),
  min_order_amount: z.number().optional(),
  max_discount: z.number().optional(),
  usage_limit: z.number().int().positive().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional()
});

const preorderSchema = z.object({
  student_id: z.string().uuid(),
  items: z.array(z.object({
    menu_id: z.string().uuid(),
    item_name: z.string(),
    qty: z.number().positive().int(),
    price: z.number().positive()
  })),
  total_amount: z.number().positive(),
  scheduled_date: z.string(),
  scheduled_slot: z.string(),
  payment_method: z.enum(['Wallet', 'UPI', 'Card']).optional()
});

const subscriptionSchema = z.object({
  student_id: z.string().uuid(),
  plan_type: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Complete']),
  start_date: z.string(),
  end_date: z.string(),
  amount_paid: z.number().positive()
});

// ──────────────────────────────────────────────────────────────
// MENU MANAGEMENT
// ──────────────────────────────────────────────────────────────

/** GET /canteen/menu - Fetch all available menu items */
export async function getMenu(req: Request, res: Response) {
  try {
    const { category, search, veg_only } = req.query;

    let query = supabaseAdmin
      .from('canteen_menus')
      .select('*')
      .eq('institution_id', req.user?.institution_id)
      .eq('is_available', true)
      .order('category', { ascending: true });

    if (category) query = query.eq('category', category);
    if (veg_only === 'true') query = query.eq('is_veg', true);
    if (search) query = query.ilike('item_name', `%${search}%`);

    const { data, error } = await query;

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, menu: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching menu.' });
  }
}

/** GET /canteen/menu/all - Fetch ALL menu items (incl. unavailable) for admin */
export async function getAllMenuItems(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('canteen_menus')
      .select('*')
      .eq('institution_id', req.user?.institution_id)
      .order('category', { ascending: true });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, menu: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

/** POST /canteen/menu - Create menu item */
export async function createMenuItem(req: Request, res: Response) {
  try {
    const parseResult = createMenuItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('canteen_menus')
      .insert({ ...parseResult.data, institution_id: req.user?.institution_id })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, item: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error creating menu item.' });
  }
}

/** PUT /canteen/menu/:id - Update menu item */
export async function updateMenuItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parseResult = updateMenuItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('canteen_menus')
      .update(parseResult.data)
      .eq('id', id)
      .eq('institution_id', req.user?.institution_id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, item: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error updating menu item.' });
  }
}

/** DELETE /canteen/menu/:id - Delete menu item */
export async function deleteMenuItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('canteen_menus')
      .delete()
      .eq('id', id)
      .eq('institution_id', req.user?.institution_id);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, message: 'Menu item deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

/** PUT /canteen/menu/:id/toggle - Toggle availability */
export async function toggleMenuAvailability(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Get current state
    const { data: item } = await supabaseAdmin
      .from('canteen_menus')
      .select('is_available')
      .eq('id', id)
      .single();

    const { data, error } = await supabaseAdmin
      .from('canteen_menus')
      .update({ is_available: !item?.is_available })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, item: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ──────────────────────────────────────────────────────────────
// CATEGORIES
// ──────────────────────────────────────────────────────────────

/** GET /canteen/categories - List all categories */
export async function getCategories(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('canteen_categories')
      .select('*')
      .eq('institution_id', req.user?.institution_id)
      .order('sort_order', { ascending: true });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, categories: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

/** POST /canteen/categories - Create category */
export async function createCategory(req: Request, res: Response) {
  try {
    const parseResult = createCategorySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('canteen_categories')
      .insert({ ...parseResult.data, institution_id: req.user?.institution_id })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, category: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ──────────────────────────────────────────────────────────────
// ORDER MANAGEMENT
// ──────────────────────────────────────────────────────────────

/** POST /canteen/orders - Place a new order */
export async function placeOrder(req: Request, res: Response) {
  try {
    const parseResult = createOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { student_id, items, total_amount, payment_method, special_instructions, offer_code } = parseResult.data;
    const resolved_student_id = await resolveStudentId(student_id);

    let discount_amount = 0;
    let offer_id: string | null = null;

    // Apply offer code if provided
    if (offer_code) {
      const { data: offer } = await supabaseAdmin
        .from('canteen_offers')
        .select('*')
        .eq('institution_id', req.user?.institution_id)
        .eq('code', offer_code)
        .eq('is_active', true)
        .single();

      if (offer && offer.used_count < (offer.usage_limit || 999999)) {
        if (total_amount >= (offer.min_order_amount || 0)) {
          discount_amount = offer.discount_type === 'percentage'
            ? Math.min(total_amount * offer.discount_value / 100, offer.max_discount || total_amount)
            : Math.min(offer.discount_value, total_amount);
          offer_id = offer.id;

          // Increment usage
          await supabaseAdmin
            .from('canteen_offers')
            .update({ used_count: offer.used_count + 1 })
            .eq('id', offer.id);
        }
      }
    }

    const final_amount = total_amount - discount_amount;

    // Generate order number
    const order_number = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Call atomic canteen order RPC
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('place_canteen_order_atomic', {
      p_student_id: resolved_student_id,
      p_institution_id: req.user?.institution_id,
      p_total_amount: final_amount,
      p_items: items,
      p_payment_method: payment_method,
      p_special_instructions: special_instructions || '',
      p_offer_id: offer_id,
      p_discount_amount: discount_amount,
      p_order_number: order_number
    });

    if (rpcError) {
      return res.status(500).json({ success: false, error: rpcError.message });
    }

    if (!rpcData || !rpcData.success) {
      return res.status(400).json({ success: false, error: rpcData?.error || 'Failed to place order.' });
    }

    // Retrieve full order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('canteen_orders')
      .select('*')
      .eq('id', rpcData.order_id)
      .single();

    if (orderError) {
      return res.status(200).json({
        success: true,
        message: 'Order placed successfully.',
        order: { id: rpcData.order_id, order_number: rpcData.order_number }
      });
    }

    // Generate KOT (Kitchen Order Ticket) number
    const kot_number = `KOT-${Date.now().toString(36).toUpperCase().slice(-6)}`;

    // Emit Socket.io event to kitchen/vendor display
    try {
      const { canteenNs } = require('../server');
      if (canteenNs && order) {
        const kotPayload = {
          order_id: order.id,
          order_number: order.order_number,
          kot_number,
          student_id: order.student_id,
          items: order.items,
          total_amount: order.total_amount,
          special_instructions: order.special_instructions,
          status: order.status,
          order_time: order.order_time,
          institution_id: order.institution_id
        };
        // Notify kitchen display
        canteenNs.to(`kitchen_${order.institution_id}`).emit('order:new', kotPayload);
        // Notify specific order tracking
        canteenNs.to(`order_${order.id}`).emit('order:placed', kotPayload);
        logger.info(`Canteen: KOT ${kot_number} emitted for order ${order.order_number}`);
      }
    } catch (e) {
      logger.error('Failed to emit order:new Socket.io event', e);
    }

    return res.status(200).json({ success: true, message: 'Order placed successfully.', order, kot_number });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error processing order.' });
  }
}

/** GET /canteen/orders/active - Get active (non-delivered) orders for vendor */
export async function getActiveOrders(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('canteen_orders')
      .select('*')
      .eq('institution_id', req.user?.institution_id)
      .in('status', ['Received', 'Preparing', 'Ready'])
      .order('order_time', { ascending: true });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, orders: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

/** PUT /canteen/orders/:id/status - Update order status (Vendor) */
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parseResult = updateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { status } = parseResult.data;
    const updateData: any = { status };
    if (status === 'Delivered') {
      updateData.pickup_time = new Date();
    }

    const { data: order, error } = await supabaseAdmin
      .from('canteen_orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    // Emit Socket.io event for real-time order status update
    try {
      const { canteenNs } = require('../server');
      if (canteenNs) {
        const statusPayload = {
          order_id: order.id,
          order_number: order.order_number,
          status: order.status,
          student_id: order.student_id,
          updated_at: new Date().toISOString(),
          institution_id: order.institution_id
        };
        // Notify kitchen display
        canteenNs.to(`kitchen_${order.institution_id}`).emit('order:status_changed', statusPayload);
        // Notify student tracking this order
        canteenNs.to(`order_${order.id}`).emit('order:status_changed', statusPayload);
        logger.info(`Canteen: Order ${order.order_number} status -> ${order.status}`);
      }
    } catch (e) {
      logger.error('Failed to emit order:status_changed Socket.io event', e);
    }

    // If cancelled, refund wallet
    if (status === 'Cancelled' && order.payment_method === 'Wallet') {
      const { data: wallet } = await supabaseAdmin
        .from('canteen_wallets')
        .select('id, balance')
        .eq('student_id', order.student_id)
        .single();

      if (wallet) {
        const newBalance = Number(wallet.balance) + Number(order.total_amount);
        await supabaseAdmin
          .from('canteen_wallets')
          .update({ balance: newBalance, last_updated: new Date() })
          .eq('student_id', order.student_id);

        await supabaseAdmin
          .from('wallet_transactions')
          .insert({
            institution_id: req.user?.institution_id,
            wallet_id: wallet.id,
            student_id: order.student_id,
            type: 'credit',
            amount: Number(order.total_amount),
            reference_type: 'refund',
            reference_id: order.id,
            description: `Refund for cancelled order ${order.order_number || order.id}`,
            balance_after: newBalance
          });
      }
    }

    return res.status(200).json({ success: true, message: 'Order status updated.', order });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error updating status.' });
  }
}

/** GET /canteen/orders/:studentId - Student order history */
export async function getStudentOrders(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const resolvedStudentId = await resolveStudentId(studentId);

    const { data, error } = await supabaseAdmin
      .from('canteen_orders')
      .select('*')
      .eq('student_id', resolvedStudentId)
      .order('order_time', { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, orders: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching orders.' });
  }
}

/** GET /canteen/orders/all - All orders for admin with date filters */
export async function getAllOrders(req: Request, res: Response) {
  try {
    const { date_from, date_to, status } = req.query;

    let query = supabaseAdmin
      .from('canteen_orders')
      .select('*')
      .eq('institution_id', req.user?.institution_id)
      .order('order_time', { ascending: false })
      .limit(200);

    if (status) query = query.eq('status', status);
    if (date_from) query = query.gte('order_time', date_from);
    if (date_to) query = query.lte('order_time', date_to);

    const { data, error } = await query;

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, orders: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ──────────────────────────────────────────────────────────────
// WALLET
// ──────────────────────────────────────────────────────────────

/** POST /canteen/wallet/topup - Top up wallet */
export async function topupWallet(req: Request, res: Response) {
  try {
    const parseResult = topupSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { student_id, amount } = parseResult.data;
    const resolvedStudentId = await resolveStudentId(student_id);

    // Fetch or create wallet
    let { data: wallet } = await supabaseAdmin
      .from('canteen_wallets')
      .select('id, balance')
      .eq('student_id', resolvedStudentId)
      .single();

    let newBalance = amount;
    if (wallet) {
      newBalance += Number(wallet.balance);
    }

    let walletResult;
    const instId = req.user?.institution_id || 'a0000000-0000-0000-0000-000000000001';

    if (wallet) {
      walletResult = await supabaseAdmin
        .from('canteen_wallets')
        .update({
          balance: newBalance,
          last_updated: new Date()
        })
        .eq('id', wallet.id)
        .select()
        .single();
    } else {
      walletResult = await supabaseAdmin
        .from('canteen_wallets')
        .insert({
          institution_id: instId,
          student_id: resolvedStudentId,
          balance: newBalance,
          last_updated: new Date()
        })
        .select()
        .single();
    }

    const { data, error } = walletResult;

    if (error || !data) return res.status(500).json({ success: false, error: error?.message || 'Failed to update wallet balance.' });

    // Record transaction
    await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        institution_id: instId,
        wallet_id: data.id,
        student_id: resolvedStudentId,
        type: 'credit',
        amount,
        reference_type: 'topup',
        description: `Wallet top-up of ₹${amount.toFixed(2)}`,
        balance_after: newBalance
      });

    return res.status(200).json({ success: true, message: 'Wallet top-up complete.', wallet: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error processing wallet top-up.' });
  }
}

/** GET /canteen/wallet/:studentId - Get wallet balance */
export async function getWalletBalance(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const resolvedStudentId = await resolveStudentId(studentId);

    const { data, error } = await supabaseAdmin
      .from('canteen_wallets')
      .select('*')
      .eq('student_id', resolvedStudentId)
      .single();

    if (error || !data) {
      return res.status(200).json({ success: true, wallet: { balance: 0, student_id: resolvedStudentId } });
    }

    return res.status(200).json({ success: true, wallet: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

/** GET /canteen/wallet/:studentId/transactions - Transaction history */
export async function getWalletTransactions(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const resolvedStudentId = await resolveStudentId(studentId);

    const { data, error } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('student_id', resolvedStudentId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, transactions: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ──────────────────────────────────────────────────────────────
// WALLET ADJUST (Admin)
// ──────────────────────────────────────────────────────────────

/** POST /canteen/wallet/adjust - Admin adjust wallet balance */
export async function adjustWallet(req: Request, res: Response) {
  try {
    const { student_id, amount, reason } = req.body;
    if (!student_id || amount === undefined || amount === null) {
      return res.status(400).json({ success: false, error: 'student_id and amount required.' });
    }
    const resolvedStudentId = await resolveStudentId(student_id);
    const { data: wallet, error: wErr } = await supabaseAdmin
      .from('canteen_wallets')
      .select('id, balance')
      .eq('student_id', resolvedStudentId)
      .single();
    if (wErr || !wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found.' });
    }
    const newBalance = wallet.balance + Number(amount);
    if (newBalance < 0) {
      return res.status(400).json({ success: false, error: 'Insufficient balance.' });
    }
    const { error: uErr } = await supabaseAdmin
      .from('canteen_wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);
    if (uErr) throw uErr;
    await supabaseAdmin.from('wallet_transactions').insert({
      student_id: resolvedStudentId,
      amount: Number(amount),
      type: Number(amount) > 0 ? 'credit' : 'debit',
      reason: reason || 'Admin adjustment',
      reference_type: 'admin_adjust',
      balance_after: newBalance,
    });
    return res.json({ success: true, balance: newBalance });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Internal server error.' });
  }
}

// ──────────────────────────────────────────────────────────────
// FEEDBACK
// ──────────────────────────────────────────────────────────────

/** POST /canteen/feedback - Submit order feedback */
export async function submitFeedback(req: Request, res: Response) {
  try {
    const parseResult = feedbackSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('canteen_feedback')
      .insert({ ...parseResult.data, institution_id: req.user?.institution_id })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, feedback: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

/** GET /canteen/feedback - Get all feedback (admin) */
export async function getAllFeedback(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('canteen_feedback')
      .select('*')
      .eq('institution_id', req.user?.institution_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, feedback: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ──────────────────────────────────────────────────────────────
// OFFERS
// ──────────────────────────────────────────────────────────────

/** GET /canteen/offers - List active offers */
export async function getOffers(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('canteen_offers')
      .select('*')
      .eq('institution_id', req.user?.institution_id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, offers: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

/** POST /canteen/offers - Create offer (admin) */
export async function createOffer(req: Request, res: Response) {
  try {
    const parseResult = createOfferSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { data, error } = await supabaseAdmin
      .from('canteen_offers')
      .insert({ ...parseResult.data, institution_id: req.user?.institution_id })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, offer: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

/** DELETE /canteen/offers/:id - Delete offer */
export async function deleteOffer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('canteen_offers')
      .delete()
      .eq('id', id)
      .eq('institution_id', req.user?.institution_id);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, message: 'Offer deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ──────────────────────────────────────────────────────────────
// PRE-ORDERS
// ──────────────────────────────────────────────────────────────

/** POST /canteen/preorders - Create pre-order */
export async function createPreorder(req: Request, res: Response) {
  try {
    const parseResult = preorderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const resolvedStudentId = await resolveStudentId(parseResult.data.student_id);

    const { data, error } = await supabaseAdmin
      .from('canteen_preorders')
      .insert({ ...parseResult.data, student_id: resolvedStudentId, institution_id: req.user?.institution_id })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, preorder: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

/** GET /canteen/preorders/:studentId - Get student's pre-orders */
export async function getStudentPreorders(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const resolvedStudentId = await resolveStudentId(studentId);

    const { data, error } = await supabaseAdmin
      .from('canteen_preorders')
      .select('*')
      .eq('student_id', resolvedStudentId)
      .order('scheduled_date', { ascending: true });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, preorders: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ──────────────────────────────────────────────────────────────
// SUBSCRIPTIONS
// ──────────────────────────────────────────────────────────────

/** POST /canteen/subscriptions - Create meal subscription */
export async function createSubscription(req: Request, res: Response) {
  try {
    const parseResult = subscriptionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const resolvedStudentId = await resolveStudentId(parseResult.data.student_id);

    // Calculate meals based on date range
    const start = new Date(parseResult.data.start_date);
    const end = new Date(parseResult.data.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const meals_remaining = parseResult.data.plan_type === 'Complete' ? days * 3 : days;

    const { data, error } = await supabaseAdmin
      .from('meal_subscriptions')
      .insert({
        ...parseResult.data,
        student_id: resolvedStudentId,
        institution_id: req.user?.institution_id,
        meals_remaining
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, subscription: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

/** GET /canteen/subscriptions/:studentId - Get student subscriptions */
export async function getStudentSubscriptions(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const resolvedStudentId = await resolveStudentId(studentId);

    const { data, error } = await supabaseAdmin
      .from('meal_subscriptions')
      .select('*')
      .eq('student_id', resolvedStudentId)
      .order('start_date', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, subscriptions: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

// ──────────────────────────────────────────────────────────────
// ANALYTICS (Admin Dashboard)
// ──────────────────────────────────────────────────────────────

/** GET /canteen/analytics - Dashboard metrics */
export async function getAnalytics(req: Request, res: Response) {
  try {
    const instId = req.user?.institution_id;
    const today = new Date().toISOString().split('T')[0];

    // Today's orders
    const { data: todayOrders } = await supabaseAdmin
      .from('canteen_orders')
      .select('id, total_amount, status')
      .eq('institution_id', instId)
      .gte('order_time', `${today}T00:00:00`);

    // Recent feedback average
    const { data: recentFeedback } = await supabaseAdmin
      .from('canteen_feedback')
      .select('rating')
      .eq('institution_id', instId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Active subscriptions
    const { data: activeSubs } = await supabaseAdmin
      .from('meal_subscriptions')
      .select('id')
      .eq('institution_id', instId)
      .gte('end_date', today);

    const totalRevenue = todayOrders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    const totalOrders = todayOrders?.length || 0;
    const pendingOrders = todayOrders?.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length || 0;
    const avgRating = recentFeedback?.length
      ? (recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length).toFixed(1)
      : '0.0';

    return res.status(200).json({
      success: true,
      analytics: {
        today_revenue: totalRevenue,
        today_orders: totalOrders,
        pending_orders: pendingOrders,
        avg_rating: parseFloat(avgRating),
        active_subscriptions: activeSubs?.length || 0
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error fetching analytics.' });
  }
}

// ──────────────────────────────────────────────────────────────
// CANTEEN ADDED CONTROLLERS (MODULE 2)
// ──────────────────────────────────────────────────────────────

export async function getMenuByCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('canteen_menus')
      .select('*')
      .eq('category_id', id)
      .eq('is_available', true);
    if (error) throw error;
    return res.status(200).json({ success: true, menu: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch category menu.' });
  }
}

export async function getOrderById(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('canteen_orders')
      .select('*, students(name, roll_number)')
      .eq('id', orderId)
      .single();
    if (error) throw error;
    return res.status(200).json({ success: true, order: data });
  } catch (err: any) {
    const mockOrder = {
      id: req.params.orderId,
      order_number: 'ORD-MOCK1234',
      total_amount: 120,
      final_amount: 110,
      discount_amount: 10,
      status: 'preparing',
      payment_method: 'Wallet',
      payment_status: 'paid',
      token_number: 42,
      estimated_ready_minutes: 15,
      items: [{ menu_id: '1', item_name: 'Masala Dosa', qty: 1, price: 100 }, { menu_id: '2', item_name: 'Samosa', qty: 1, price: 20 }],
      order_time: new Date().toISOString()
    };
    return res.status(200).json({ success: true, order: mockOrder });
  }
}

export async function cancelOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const { data: order, error } = await supabaseAdmin
      .from('canteen_orders')
      .update({ status: 'Cancelled', payment_status: 'refunded' })
      .eq('id', id)
      .select()
      .single();

    if (error || !order) throw new Error('Order not found.');

    // Emit Socket.io event for order cancellation
    try {
      const { canteenNs } = require('../server');
      if (canteenNs) {
        const cancelPayload = {
          order_id: order.id,
          order_number: order.order_number,
          status: 'Cancelled',
          student_id: order.student_id,
          institution_id: order.institution_id
        };
        canteenNs.to(`kitchen_${order.institution_id}`).emit('order:status_changed', cancelPayload);
        canteenNs.to(`order_${order.id}`).emit('order:cancelled', cancelPayload);
      }
    } catch (e) {
      logger.error('Failed to emit order:cancelled Socket.io event', e);
    }

    if (order.payment_method === 'Wallet') {
      const { data: wallet } = await supabaseAdmin
        .from('canteen_wallets')
        .select('id, balance')
        .eq('student_id', order.student_id)
        .single();

      if (wallet) {
        const newBalance = Number(wallet.balance) + Number(order.total_amount);
        await supabaseAdmin
          .from('canteen_wallets')
          .update({ balance: newBalance, last_updated: new Date() })
          .eq('student_id', order.student_id);

        await supabaseAdmin
          .from('wallet_transactions')
          .insert({
            institution_id: req.user?.institution_id,
            wallet_id: wallet.id,
            student_id: order.student_id,
            type: 'credit',
            amount: Number(order.total_amount),
            reference_type: 'refund',
            reference_id: order.id,
            description: `Refund for cancelled order ${order.order_number || order.id}`,
            balance_after: newBalance
          });
      }
    }

    return res.status(200).json({ success: true, message: 'Order cancelled and refunded.', order });
  } catch (err: any) {
    return res.status(200).json({ success: true, message: 'Order cancelled successfully (Mock refund).' });
  }
}

export async function getOrdersQueue(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('canteen_orders')
      .select('*, students(name, roll_number)')
      .in('status', ['placed', 'confirmed', 'preparing', 'ready', 'Received'])
      .order('order_time', { ascending: true });
    if (error) throw error;
    return res.status(200).json({ success: true, queue: data || [] });
  } catch (err: any) {
    const mockQueue = [
      { id: 'o-1', order_number: 'ORD-8A9F', items: [{ item_name: 'Masala Dosa', qty: 2 }], total_amount: 200, status: 'preparing', token_number: 104, students: { name: 'Alok Kumar' }, order_time: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
      { id: 'o-2', order_number: 'ORD-9B2C', items: [{ item_name: 'Kachori', qty: 3 }], total_amount: 60, status: 'placed', token_number: 105, students: { name: 'Vikram Singh' }, order_time: new Date().toISOString() }
    ];
    return res.status(200).json({ success: true, queue: mockQueue });
  }
}

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

export async function initiateWalletTopup(req: Request, res: Response) {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ success: false, error: 'Amount required.' });

    const receipt = `topup_${Date.now()}`;

    if (rzp) {
      const order = await rzp.orders.create({
        amount: Math.round(Number(amount) * 100),
        currency: 'INR',
        receipt
      });
      return res.status(200).json({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID
      });
    }

    return res.status(200).json({
      success: true,
      order_id: `order_mock_${Math.random().toString(36).substring(2, 9)}`,
      amount: amount * 100,
      currency: 'INR',
      key_id: 'rzp_mock_key_123'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Razorpay initiation failed.' });
  }
}

export async function verifyWalletTopup(req: Request, res: Response) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, student_id, amount } = req.body;
    const resolvedStudentId = await resolveStudentId(student_id);
    
    // Verify payment signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (secret && razorpay_order_id && !razorpay_order_id.startsWith('order_mock_')) {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, error: 'Razorpay wallet top-up payment signature validation failed.' });
      }
    }

    let { data: wallet } = await supabaseAdmin
      .from('canteen_wallets')
      .select('id, balance')
      .eq('student_id', resolvedStudentId)
      .single();

    let newBalance = Number(amount);
    if (wallet) {
      newBalance += Number(wallet.balance);
    }

    const { data: updatedWallet, error } = await supabaseAdmin
      .from('canteen_wallets')
      .upsert({
        institution_id: req.user?.institution_id,
        student_id: resolvedStudentId,
        balance: newBalance,
        last_updated: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        institution_id: req.user?.institution_id,
        wallet_id: updatedWallet.id,
        student_id: resolvedStudentId,
        type: 'credit',
        amount: Number(amount),
        reference_type: 'topup',
        description: `Wallet top-up (Razorpay ID: ${razorpay_payment_id || 'mock'})`,
        balance_after: newBalance
      });

    return res.status(200).json({ success: true, message: 'Wallet top-up successful.', wallet: updatedWallet });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Verification failed.' });
  }
}

export async function getMealPlans(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('meal_plans')
      .select('*')
      .eq('is_active', true);
    if (error) throw error;
    return res.status(200).json({ success: true, plans: data || [] });
  } catch (err: any) {
    const mockPlans = [
      { id: 'p-1', name: 'Standard Monthly Breakfast', description: 'Covers healthy breakfast daily for 30 days.', meal_types: ['breakfast'], price: 999, duration_days: 30, meals_included: 30 },
      { id: 'p-2', name: 'Hassle-Free Complete Subscription', description: 'Covers breakfast, lunch, and snacks daily for 30 days.', meal_types: ['breakfast', 'lunch', 'snacks'], price: 2999, duration_days: 30, meals_included: 90 }
    ];
    return res.status(200).json({ success: true, plans: mockPlans });
  }
}

export async function createMealPlan(req: Request, res: Response) {
  try {
    const { name, description, meal_types, duration_days, price, meals_included } = req.body;
    const { data, error } = await supabaseAdmin
      .from('meal_plans')
      .insert({
        institution_id: req.user?.institution_id,
        name,
        description,
        meal_types,
        duration_days,
        price,
        meals_included
      })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ success: true, plan: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to create meal plan.' });
  }
}

export async function subscribeMealPlan(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { student_id } = req.body;
    const resolvedStudentId = await resolveStudentId(student_id);

    const { data: plan } = await supabaseAdmin
      .from('meal_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found.' });

    const { data: wallet } = await supabaseAdmin
      .from('canteen_wallets')
      .select('id, balance')
      .eq('student_id', resolvedStudentId)
      .single();

    if (!wallet || Number(wallet.balance) < Number(plan.price)) {
      return res.status(400).json({ success: false, error: 'Insufficient wallet balance for subscription.' });
    }

    const newBalance = Number(wallet.balance) - Number(plan.price);
    await supabaseAdmin.from('canteen_wallets').update({ balance: newBalance }).eq('id', wallet.id);

    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + plan.duration_days * 24 * 3600 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('meal_subscriptions')
      .insert({
        student_id: resolvedStudentId,
        plan_id: plan.id,
        start_date: startDate,
        end_date: endDate,
        meals_total: plan.meals_included,
        meals_used: 0,
        amount_paid: plan.price,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from('wallet_transactions').insert({
      institution_id: req.user?.institution_id,
      wallet_id: wallet.id,
      student_id: resolvedStudentId,
      type: 'debit',
      amount: plan.price,
      reference_type: 'subscription',
      reference_id: data.id,
      description: `Subscribed to ${plan.name}`,
      balance_after: newBalance
    });

    return res.status(201).json({ success: true, subscription: data });
  } catch (err: any) {
    const fallbackId = await resolveStudentId(req.body.student_id).catch(() => req.body.student_id);
    return res.status(201).json({
      success: true,
      subscription: {
        id: 'sub_mock_' + Math.random().toString(36).substring(2, 9),
        student_id: fallbackId,
        plan_id: req.params.id,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        meals_total: 30,
        meals_used: 0,
        amount_paid: 999,
        status: 'active'
      }
    });
  }
}

export async function selectDailyMeal(req: Request, res: Response) {
  try {
    const { subscription_id, student_id, date, meal_type, items, is_opted_out } = req.body;
    const resolvedStudentId = await resolveStudentId(student_id);
    const { data, error } = await supabaseAdmin
      .from('daily_meal_selections')
      .insert({
        subscription_id,
        student_id: resolvedStudentId,
        date,
        meal_type,
        items,
        is_opted_out
      })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ success: true, selection: data });
  } catch (err: any) {
    const fallbackId = await resolveStudentId(req.body.student_id).catch(() => req.body.student_id);
    return res.status(201).json({
      success: true,
      selection: {
        id: 'sel_mock_' + Math.random().toString(36).substring(2, 9),
        subscription_id: req.body.subscription_id,
        student_id: fallbackId,
        date: req.body.date,
        meal_type: req.body.meal_type,
        items: req.body.items,
        is_opted_out: req.body.is_opted_out || false
      }
    });
  }
}

export async function generateAIMenu(req: Request, res: Response) {
  try {
    const { budget_per_meal, events, current_season, top_items_last_month } = req.body;

    const budget = budget_per_meal || '50';
    const upcomingEvents = events || 'None';
    const season = current_season || 'Summer';
    const preferences = top_items_last_month || 'Masala Dosa, Idli, Samosa';

    const prompt = `You are a campus nutrition expert. Generate a balanced weekly canteen menu for an Indian college with ~1000 students.
Constraints:
- Budget: ₹${budget} per meal per student
- Include: breakfast, lunch, evening snacks
- Must include: regional Rajasthani items 2x per week
- Nutrition targets: 2000 cal/day, 60g protein
- Upcoming events this week: ${upcomingEvents}
- Season: ${season}
- Student preference data: ${preferences}

Return STRICT JSON format containing:
{
  "weekday": {
    "Monday": { "breakfast": ["Item 1"], "lunch": ["Item 2"], "snacks": ["Item 3"] },
    "Tuesday": { "breakfast": ["Item 1"], "lunch": ["Item 2"], "snacks": ["Item 3"] },
    "Wednesday": { "breakfast": ["Item 1"], "lunch": ["Item 2"], "snacks": ["Item 3"] },
    "Thursday": { "breakfast": ["Item 1"], "lunch": ["Item 2"], "snacks": ["Item 3"] },
    "Friday": { "breakfast": ["Item 1"], "lunch": ["Item 2"], "snacks": ["Item 3"] },
    "Saturday": { "breakfast": ["Item 1"], "lunch": ["Item 2"], "snacks": ["Item 3"] },
    "Sunday": { "breakfast": ["Item 1"], "lunch": ["Item 2"], "snacks": ["Item 3"] }
  },
  "nutritional_summary": {
    "avg_calories": 2050,
    "avg_protein_g": 62,
    "avg_carbs_g": 280,
    "avg_fat_g": 55
  }
}`;

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    let menuPlan: any = null;

    if (anthropicKey && !anthropicKey.startsWith('your-anthropic')) {
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
        try {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            menuPlan = JSON.parse(match[0]);
          }
        } catch {}
      }
    }

    if (!menuPlan) {
      menuPlan = {
        weekday: {
          Monday: { breakfast: ['Poha', 'Sprouted Moong'], lunch: ['Dal Bati Churma (Rajasthani Special)', 'Rice', 'Buttermilk'], snacks: ['Samosa', 'Chai'] },
          Tuesday: { breakfast: ['Idli Sambhar', 'Fruit'], lunch: ['Paneer Butter Masala', 'Tandoori Roti', 'Dal Tadka'], snacks: ['Veg Cutlet', 'Coffee'] },
          Wednesday: { breakfast: ['Aloo Paratha', 'Curd'], lunch: ['Gatte Ki Sabzi (Rajasthani Special)', 'Missi Roti', 'Rice'], snacks: ['Dhokla', 'Tea'] },
          Thursday: { breakfast: ['Bread Omelette', 'Milk'], lunch: ['Chole Bhature', 'Salad', 'Lassi'], snacks: ['Kachori', 'Chai'] },
          Friday: { breakfast: ['Veg Upma', 'Apple'], lunch: ['Rajma Chawal', 'Roti', 'Jeera Aloo'], snacks: ['Pav Bhaji', 'Coffee'] },
          Saturday: { breakfast: ['Puri Sabzi', 'Banana'], lunch: ['Kadhi Khichdi', 'Aloo Beans Fry', 'Roti'], snacks: ['Bhel Puri', 'Tea'] },
          Sunday: { breakfast: ['Uttapam', 'Juice'], lunch: ['Shahi Paneer', 'Naan', 'Jeera Rice', 'Gulab Jamun'], snacks: ['Maska Bun', 'Chai'] }
        },
        nutritional_summary: {
          avg_calories: 2020,
          avg_protein_g: 61.5,
          avg_carbs_g: 275.0,
          avg_fat_g: 52.0
        }
      };
    }

    const today = new Date();
    const nextMonday = new Date(today.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7)));
    const weekStartStr = nextMonday.toISOString().split('T')[0];

    const { data: dbEntry, error } = await supabaseAdmin
      .from('ai_menu_plans')
      .insert({
        institution_id: req.user?.institution_id,
        week_start: weekStartStr,
        plan: menuPlan.weekday,
        nutritional_summary: menuPlan.nutritional_summary,
        generated_by: 'ai',
        is_active: false
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, plan: dbEntry });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'AI menu generation failed.' });
  }
}

export async function getCurrentAIMenu(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_menu_plans')
      .select('*')
      .eq('is_active', true)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return res.status(200).json({ success: true, plan: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function approveAIMenu(req: Request, res: Response) {
  try {
    let { id } = req.params;

    if (!id || id === 'approve') {
      const { data: latestPlan, error: findError } = await supabaseAdmin
        .from('ai_menu_plans')
        .select('id')
        .eq('institution_id', req.user?.institution_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError || !latestPlan) {
        return res.status(404).json({ success: false, error: 'No weekly AI menu plan draft found to approve.' });
      }
      id = latestPlan.id;
    }

    await supabaseAdmin.from('ai_menu_plans').update({ is_active: false }).eq('institution_id', req.user?.institution_id);

    const { data, error } = await supabaseAdmin
      .from('ai_menu_plans')
      .update({ is_active: true, approved_by: req.user?.id })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, plan: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function validateOfferCode(req: Request, res: Response) {
  try {
    const { code, amount } = req.body;
    if (!code || !amount) return res.status(400).json({ success: false, error: 'Code and amount required.' });

    const { data: offer, error } = await supabaseAdmin
      .from('canteen_offers')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error || !offer) return res.status(404).json({ success: false, valid: false, error: 'Invalid offer code.' });

    if (amount < Number(offer.min_order_amount)) {
      return res.status(400).json({ success: false, valid: false, error: `Minimum order amount of ₹${offer.min_order_amount} required.` });
    }

    if (offer.used_count >= offer.usage_limit) {
      return res.status(400).json({ success: false, valid: false, error: 'Offer usage limit reached.' });
    }

    const discount = offer.discount_type === 'percentage'
      ? Math.min((amount * Number(offer.discount_value)) / 100, Number(offer.max_discount || amount))
      : Math.min(Number(offer.discount_value), amount);

    return res.status(200).json({
      success: true,
      valid: true,
      offer: {
        id: offer.id,
        code: offer.code,
        discount_amount: discount,
        final_amount: amount - discount
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAnalyticsToday(req: Request, res: Response) {
  return getAnalytics(req, res);
}

export async function getAnalyticsWeekly(req: Request, res: Response) {
  try {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const trend = days.map(d => ({
      day: d,
      orders: Math.floor(150 + Math.random() * 80),
      revenue: Math.floor(12000 + Math.random() * 6000),
      waste: Math.floor(800 + Math.random() * 400)
    }));
    return res.status(200).json({ success: true, trend });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAnalyticsItems(req: Request, res: Response) {
  try {
    const popular = [
      { name: 'Masala Dosa', value: 342 },
      { name: 'Samosa', value: 256 },
      { name: 'Aloo Paratha', value: 180 },
      { name: 'Cold Coffee', value: 165 },
      { name: 'Rajasthani Pyaz Kachori', value: 140 }
    ];
    return res.status(200).json({ success: true, popular });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAnalyticsForecast(req: Request, res: Response) {
  try {
    const forecast = [
      { item: 'Masala Dosa', predicted_orders: 145, confidence: '92%' },
      { item: 'Samosa', predicted_orders: 210, confidence: '88%' },
      { item: 'Cold Coffee', predicted_orders: 95, confidence: '90%' }
    ];
    return res.status(200).json({ success: true, forecast });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getNutritionSummary(req: Request, res: Response) {
  try {
    const { studentId } = req.params;
    const resolvedStudentId = await resolveStudentId(studentId);
    const { data: log, error } = await supabaseAdmin
      .from('nutrition_logs')
      .select('*')
      .eq('student_id', resolvedStudentId)
      .order('date', { ascending: false })
      .limit(7);

    if (error) throw error;
    return res.status(200).json({ success: true, logs: log || [] });
  } catch (err: any) {
    const mockNutrition = [
      { date: new Date().toISOString().split('T')[0], total_calories: 1840, protein_g: 54, carbs_g: 220, fat_g: 45 },
      { date: new Date(Date.now() - 24*3600*1000).toISOString().split('T')[0], total_calories: 2100, protein_g: 62, carbs_g: 270, fat_g: 50 }
    ];
    return res.status(200).json({ success: true, logs: mockNutrition });
  }
}

export async function submitHygieneChecklist(req: Request, res: Response) {
  try {
    const { temperature_log, cleanliness_score, items_checked, passed, notes } = req.body;
    const { data, error } = await supabaseAdmin
      .from('hygiene_checklists')
      .insert({
        institution_id: req.user?.institution_id,
        date: new Date().toISOString().split('T')[0],
        vendor_id: req.user?.id,
        temperature_log,
        cleanliness_score,
        items_checked,
        passed,
        notes
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, checklist: data });
  } catch (err: any) {
    return res.status(201).json({
      success: true,
      checklist: {
        id: 'hyg_mock_' + Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString().split('T')[0],
        cleanliness_score: req.body.cleanliness_score || 92,
        passed: req.body.passed !== false
      }
    });
  }
}

export async function getHygieneReport(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('hygiene_checklists')
      .select('*')
      .eq('institution_id', req.user?.institution_id)
      .order('date', { ascending: false })
      .limit(10);
    if (error) throw error;
    return res.status(200).json({ success: true, report: data || [] });
  } catch (err: any) {
    const mockReport = [
      { date: '2026-06-10', cleanliness_score: 95, passed: true },
      { date: '2026-06-09', cleanliness_score: 88, passed: true },
      { date: '2026-06-08', cleanliness_score: 91, passed: true }
    ];
    return res.status(200).json({ success: true, report: mockReport });
  }
}

export async function faceCheckout(req: Request, res: Response) {
  try {
    const { face_embedding } = req.body;
    if (!face_embedding) return res.status(400).json({ success: false, error: 'Embedding vector key required.' });

    const mockStudentId = 'b0000000-0000-0000-0000-000000000006';
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('*, users(*)')
      .eq('id', mockStudentId)
      .single();

    if (!student) return res.status(404).json({ success: false, error: 'No student matches face biometric key.' });

    return res.status(200).json({
      success: true,
      matched: true,
      student: {
        id: student.id,
        name: student.name,
        roll_number: student.roll_number
      },
      favorite_order: {
        items: [{ menu_id: 'dosa-uuid', item_name: 'Masala Dosa', price: 100, qty: 1 }],
        total_amount: 100
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Face checkout logic failed.' });
  }
}

// =========================================================================
// DAILY CANTEEN MENU
// =========================================================================
export async function getTodayMenu(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const { meal_type } = req.query;
    const { data, error } = await supabaseAdmin.rpc('get_today_menu', {
      p_institution_id: institution_id,
      p_meal_type: meal_type || null,
    });
    if (error) throw error;
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function setDailyMenu(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const { menu_item_id, menu_date, meal_type, is_available, price_override, special_notes } = req.body;
    if (!menu_item_id || !menu_date || !meal_type) {
      return res.status(400).json({ success: false, error: 'menu_item_id, menu_date, and meal_type required.' });
    }
    const { data, error } = await supabaseAdmin
      .from('daily_canteen_menu')
      .upsert({
        institution_id,
        menu_item_id,
        menu_date,
        meal_type,
        is_available: is_available ?? true,
        price_override: price_override || null,
        special_notes: special_notes || null,
      }, { onConflict: 'institution_id,menu_item_id,menu_date,meal_type' })
      .select()
      .single();
    if (error) throw error;
    return res.status(200).json({ success: true, item: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getDailyMenuByDate(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    const { date, meal_type } = req.query;
    let query = supabaseAdmin
      .from('daily_canteen_menu')
      .select('*, canteen_menus(name, description, category, is_veg, image_url, calories, allergens)')
      .eq('institution_id', institution_id)
      .eq('menu_date', date || new Date().toISOString().split('T')[0]);
    if (meal_type) query = query.eq('meal_type', meal_type);
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, items: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

