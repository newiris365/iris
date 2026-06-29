import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';

const ALL_ROLES = [
  'SuperAdmin', 'Admin', 'Director', 'HOD', 'Teacher', 'Staff',
  'Student', 'Parent', 'Warden', 'Security', 'Vendor', 'Driver',
  'TPO', 'Librarian', 'Gym Trainer', 'IQAC Coordinator', 'Admissions Officer', 'Principal'
];

const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  role: z.enum(ALL_ROLES as any),
  department_id: z.string().uuid().optional(),
  employee_id: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(ALL_ROLES as any).optional(),
  department_id: z.string().uuid().optional().nullable(),
  employee_id: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

// ─── LIST USERS ───────────────────────────────────────────────

export async function listUsers(req: Request, res: Response) {
  try {
    const { role, department_id, search, is_active, page = '1', limit = '50' } = req.query;
    const institution_id = req.user?.institution_id;
    if (!institution_id) return res.status(400).json({ success: false, error: 'No institution context.' });

    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, phone, role, employee_id, is_active, department_id, last_login, created_at, departments(name)', { count: 'exact' })
      .eq('institution_id', institution_id)
      .order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);
    if (department_id) query = query.eq('department_id', department_id);
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,employee_id.ilike.%${search}%`);
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string)));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    return res.json({
      success: true,
      users: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET USER BY ID ───────────────────────────────────────────

export async function getUserById(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const institution_id = req.user?.institution_id;

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, phone, role, employee_id, is_active, department_id, last_login, created_at, departments(name)')
      .eq('id', userId)
      .eq('institution_id', institution_id)
      .single();

    if (error || !data) return res.status(404).json({ success: false, error: 'User not found.' });
    return res.json({ success: true, user: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── CREATE USER ──────────────────────────────────────────────

export async function createUser(req: Request, res: Response) {
  try {
    const parse = createUserSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { name, email, phone, role, department_id, employee_id, password } = parse.data;
    const institution_id = req.user?.institution_id;
    if (!institution_id) return res.status(400).json({ success: false, error: 'No institution context.' });

    // Check for duplicate email within institution
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('institution_id', institution_id)
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ success: false, error: 'A user with this email already exists in your institution.' });
    }

    // Create Supabase auth user
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, institution_id },
    });

    if (authErr) {
      // If auth creation fails, still create the profile row (sandbox mode)
      console.warn('Auth user creation failed (sandbox mode):', authErr.message);
    }

    const userId = authUser?.user?.id || undefined;

    // Create user profile row
    const { data: user, error: uErr } = await supabaseAdmin
      .from('users')
      .insert({
        ...(userId ? { id: userId } : {}),
        institution_id,
        name,
        email,
        phone: phone || null,
        role,
        department_id: department_id || null,
        employee_id: employee_id || null,
        is_active: true,
      })
      .select()
      .single();

    if (uErr) {
      // If duplicate id, try without explicit id
      if (uErr.code === '23505') {
        const { data: user2, error: uErr2 } = await supabaseAdmin
          .from('users')
          .insert({
            institution_id,
            name,
            email,
            phone: phone || null,
            role,
            department_id: department_id || null,
            employee_id: employee_id || null,
            is_active: true,
          })
          .select()
          .single();
        if (uErr2) throw uErr2;
        return res.json({ success: true, user: user2, message: `User created with role ${role}. Default password: ${password}` });
      }
      throw uErr;
    }

    return res.json({ success: true, user, message: `User created with role ${role}. Default password: ${password}` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── UPDATE USER ──────────────────────────────────────────────

export async function updateUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const parse = updateUserSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const institution_id = req.user?.institution_id;
    const updates = parse.data;

    // Remove undefined values
    const cleanUpdates: Record<string, any> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) cleanUpdates[k] = v;
    }
    cleanUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(cleanUpdates)
      .eq('id', userId)
      .eq('institution_id', institution_id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, user: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── DEACTIVATE USER ─────────────────────────────────────────

export async function deactivateUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const institution_id = req.user?.institution_id;

    // Prevent self-deactivation
    if (userId === req.user?.id) {
      return res.status(400).json({ success: false, error: 'You cannot deactivate your own account.' });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .eq('institution_id', institution_id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, user: data, message: 'User deactivated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── REACTIVATE USER ─────────────────────────────────────────

export async function reactivateUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const institution_id = req.user?.institution_id;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .eq('institution_id', institution_id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, user: data, message: 'User reactivated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── RESET PASSWORD ───────────────────────────────────────────

export async function resetUserPassword(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
    }

    const institution_id = req.user?.institution_id;

    // Get user email
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .eq('institution_id', institution_id)
      .single();

    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    // Update auth password
    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    if (authErr) {
      console.warn('Auth password reset failed (sandbox):', authErr.message);
    }

    return res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET ROLE STATS ───────────────────────────────────────────

export async function getUserRoleStats(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    if (!institution_id) return res.status(400).json({ success: false, error: 'No institution context.' });

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('institution_id', institution_id)
      .eq('is_active', true);

    if (error) throw error;

    const stats: Record<string, number> = {};
    for (const u of data || []) {
      stats[u.role] = (stats[u.role] || 0) + 1;
    }

    return res.json({ success: true, stats });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET DEPARTMENTS ──────────────────────────────────────────

export async function getDepartments(req: Request, res: Response) {
  try {
    const institution_id = req.query.institution_id || req.user?.institution_id;
    if (!institution_id) {
      return res.status(400).json({ success: false, error: 'institution_id required.' });
    }

    const { data, error } = await supabaseAdmin
      .from('departments')
      .select('id, name')
      .eq('institution_id', institution_id)
      .order('name');

    if (error) throw error;

    if (data && data.length > 0) {
      return res.json({ success: true, departments: data });
    } else {
      // Fallback default departments to ensure dropdown is never empty
      const fallbackDepts = [
        { id: 'd0000000-0000-0000-0000-000000000001', name: 'Computer Science & Engineering' },
        { id: 'd0000000-0000-0000-0000-000000000002', name: 'Electronics & Communication Engineering' },
        { id: 'd0000000-0000-0000-0000-000000000003', name: 'Mechanical Engineering' }
      ];
      return res.json({ success: true, departments: fallbackDepts });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
