import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';

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

    // Wallet balance check & deduction
    if (payment_method === 'Wallet') {
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('canteen_wallets')
        .select('id, balance')
        .eq('student_id', student_id)
        .single();

      if (walletError || !wallet) {
        return res.status(404).json({ success: false, error: 'Canteen wallet not found for this student.' });
      }

      if (Number(wallet.balance) < final_amount) {
        return res.status(400).json({
          success: false,
          error: `Insufficient wallet balance. Required: ₹${final_amount.toFixed(2)}, Available: ₹${Number(wallet.balance).toFixed(2)}`
        });
      }

      const newBalance = Number(wallet.balance) - final_amount;
      await supabaseAdmin
        .from('canteen_wallets')
        .update({ balance: newBalance, last_updated: new Date() })
        .eq('student_id', student_id);

      // Record transaction
      await supabaseAdmin
        .from('wallet_transactions')
        .insert({
          institution_id: req.user?.institution_id,
          wallet_id: wallet.id,
          student_id,
          type: 'debit',
          amount: final_amount,
          reference_type: 'order_payment',
          description: `Order payment for ${items.length} item(s)`,
          balance_after: newBalance
        });
    }

    // Generate order number
    const order_number = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Insert order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('canteen_orders')
      .insert({
        institution_id: req.user?.institution_id,
        student_id,
        items,
        total_amount: final_amount,
        status: 'Received',
        payment_method,
        special_instructions,
        offer_id,
        discount_amount,
        order_number
      })
      .select()
      .single();

    if (orderError) return res.status(500).json({ success: false, error: orderError.message });
    return res.status(200).json({ success: true, message: 'Order placed successfully.', order });
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

    const { data, error } = await supabaseAdmin
      .from('canteen_orders')
      .select('*')
      .eq('student_id', studentId)
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

    // Fetch or create wallet
    let { data: wallet } = await supabaseAdmin
      .from('canteen_wallets')
      .select('id, balance')
      .eq('student_id', student_id)
      .single();

    let newBalance = amount;
    if (wallet) {
      newBalance += Number(wallet.balance);
    }

    const { data, error } = await supabaseAdmin
      .from('canteen_wallets')
      .upsert({
        institution_id: req.user?.institution_id,
        student_id,
        balance: newBalance,
        last_updated: new Date()
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    // Record transaction
    await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        institution_id: req.user?.institution_id,
        wallet_id: data.id,
        student_id,
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

    const { data, error } = await supabaseAdmin
      .from('canteen_wallets')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error || !data) {
      return res.status(200).json({ success: true, wallet: { balance: 0, student_id: studentId } });
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

    const { data, error } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, transactions: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
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

    const { data, error } = await supabaseAdmin
      .from('canteen_preorders')
      .insert({ ...parseResult.data, institution_id: req.user?.institution_id })
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

    const { data, error } = await supabaseAdmin
      .from('canteen_preorders')
      .select('*')
      .eq('student_id', studentId)
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

    // Calculate meals based on date range
    const start = new Date(parseResult.data.start_date);
    const end = new Date(parseResult.data.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const meals_remaining = parseResult.data.plan_type === 'Complete' ? days * 3 : days;

    const { data, error } = await supabaseAdmin
      .from('meal_subscriptions')
      .insert({
        ...parseResult.data,
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

    const { data, error } = await supabaseAdmin
      .from('meal_subscriptions')
      .select('*')
      .eq('student_id', studentId)
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
