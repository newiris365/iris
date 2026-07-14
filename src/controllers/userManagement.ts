import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';

const ALL_ROLES = [
  'SuperAdmin', 'Admin', 'Director', 'HOD', 'Teacher', 'Staff',
  'Student', 'Parent', 'Warden', 'Security', 'Vendor', 'Driver',
  'TPO', 'Librarian', 'Gym Trainer', 'IQAC Coordinator', 'Admissions Officer', 'Principal'
] as const;

const COLLEGE_ONLY_ROLES = new Set(['HOD', 'TPO', 'IQAC Coordinator']);

const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  role: z.enum(ALL_ROLES),
  employee_id: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roll_number: z.string().optional(),
  batch_year: z.string().optional(),
  semester: z.number().int().min(1).optional(),
  department_id: z.string().uuid().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  guardian_name: z.string().optional(),
  guardian_phone: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(ALL_ROLES).optional(),
  employee_id: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

// ─── LIST USERS ───────────────────────────────────────────────

export async function listUsers(req: Request, res: Response) {
  try {
    const { role, search, is_active, page = '1', limit = '50' } = req.query;
    const institution_id = req.user?.institution_id;
    if (!institution_id) return res.status(400).json({ success: false, error: 'No institution context.' });

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string)));

    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, phone, role, employee_id, is_active, last_login, created_at', { count: 'exact' })
      .eq('institution_id', institution_id);

    if (role) query = query.eq('role', role);
    if (is_active !== undefined && is_active !== '') query = query.eq('is_active', is_active === 'true');
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,employee_id.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

    if (error) {
      console.error('[listUsers] Query error:', error);
      throw error;
    }

    return res.json({
      success: true,
      users: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[listUsers] Catch error:', errorMsg);
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── GET USER BY ID ───────────────────────────────────────────

export async function getUserById(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const institution_id = req.user?.institution_id;

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, phone, role, employee_id, is_active, last_login, created_at')
      .eq('id', userId)
      .eq('institution_id', institution_id)
      .single();

    if (error || !data) return res.status(404).json({ success: false, error: 'User not found.' });
    return res.json({ success: true, user: data });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── CREATE USER ──────────────────────────────────────────────

export async function createUser(req: Request, res: Response) {
  try {
    const parse = createUserSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, error: parse.error.errors[0].message });

    const { name, email, phone, role, employee_id, password, roll_number, batch_year, semester, department_id, dob, gender, guardian_name, guardian_phone } = parse.data;
    const institution_id = req.user?.institution_id;
    if (!institution_id) return res.status(400).json({ success: false, error: 'No institution context.' });

    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('institution_id', institution_id)
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ success: false, error: 'A user with this email already exists in your institution.' });
    }

    if (COLLEGE_ONLY_ROLES.has(role as any)) {
      const { data: inst } = await supabaseAdmin
        .from('institutions')
        .select('type')
        .eq('id', institution_id)
        .maybeSingle();
      if (inst?.type === 'school') {
        return res.status(400).json({ success: false, error: `Role "${role}" is not available for school-type institutions.` });
      }
    }

    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, institution_id },
    });

    if (authErr) {
      return res.status(500).json({ success: false, error: `Auth user creation failed: ${authErr.message}` });
    }

    const userId = authUser?.user?.id;
    if (!userId) {
      return res.status(500).json({ success: false, error: 'Auth user creation failed: No user ID returned.' });
    }

    const { data: user, error: uErr } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        institution_id,
        name,
        email,
        phone: phone || null,
        role,
        employee_id: employee_id || null,
        is_active: true,
      })
      .select()
      .single();

    if (uErr) {
      throw uErr;
    }

    if (role === 'Student') {
      const studentRollNumber = roll_number || `AUTO-${userId.substring(0, 8)}`;
      const studentBatchYear = batch_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`;

      const { error: sErr } = await supabaseAdmin
        .from('students')
        .insert({
          user_id: userId,
          institution_id,
          roll_number: studentRollNumber,
          batch_year: studentBatchYear,
          semester: semester || 1,
          department_id: department_id || null,
          dob: dob || null,
          gender: gender || null,
          guardian_name: guardian_name || null,
          guardian_phone: guardian_phone || null,
        });

      if (sErr) {
        console.error('[createUser] Failed to create student record:', sErr);
      }
    }

    return res.json({ success: true, user, message: `User created with role ${role}. Default password: ${password}` });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ success: false, error: errorMsg });
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

    if (updates.role && COLLEGE_ONLY_ROLES.has(updates.role as any)) {
      const { data: inst } = await supabaseAdmin
        .from('institutions')
        .select('type')
        .eq('id', institution_id!)
        .maybeSingle();
      if (inst?.type === 'school') {
        return res.status(400).json({ success: false, error: `Role "${updates.role}" is not available for school-type institutions.` });
      }
    }

    const cleanUpdates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) cleanUpdates[k] = v;
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(cleanUpdates)
      .eq('id', userId)
      .eq('institution_id', institution_id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, user: data });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── DEACTIVATE USER ─────────────────────────────────────────

export async function deactivateUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const institution_id = req.user?.institution_id;

    if (userId === req.user?.id) {
      return res.status(400).json({ success: false, error: 'You cannot deactivate your own account.' });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)
      .eq('institution_id', institution_id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, user: data, message: 'User deactivated.' });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── REACTIVATE USER ─────────────────────────────────────────

export async function reactivateUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const institution_id = req.user?.institution_id;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ is_active: true })
      .eq('id', userId)
      .eq('institution_id', institution_id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, user: data, message: 'User reactivated.' });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── RESET PASSWORD ───────────────────────────────────────────

export async function resetUserPassword(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
    }

    const institution_id = req.user?.institution_id;

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .eq('institution_id', institution_id)
      .single();

    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    if (authErr) {
      return res.status(500).json({ success: false, error: `Auth password update failed: ${authErr.message}` });
    }

    return res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ success: false, error: errorMsg });
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
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ success: false, error: errorMsg });
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
      .select('id, name, created_at')
      .eq('institution_id', institution_id)
      .order('name');

    if (error) throw error;

    return res.json({ success: true, departments: data || [] });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── CREATE DEPARTMENT ────────────────────────────────────────

export async function createDepartment(req: Request, res: Response) {
  try {
    const { name, institution_id } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, error: 'Department name is required.' });

    const instId = institution_id || req.user?.institution_id;
    if (!instId) return res.status(400).json({ success: false, error: 'No institution context.' });

    const { data, error } = await supabaseAdmin
      .from('departments')
      .insert({ name: name.trim(), institution_id: instId })
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, department: data });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── UPDATE DEPARTMENT ────────────────────────────────────────

export async function updateDepartment(req: Request, res: Response) {
  try {
    const { id, name } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Department ID required.' });
    if (!name || !name.trim()) return res.status(400).json({ success: false, error: 'Department name is required.' });

    const institution_id = req.user?.institution_id;

    const { data, error } = await supabaseAdmin
      .from('departments')
      .update({ name: name.trim() })
      .eq('id', id)
      .eq('institution_id', institution_id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, department: data });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── DELETE DEPARTMENT ────────────────────────────────────────

export async function deleteDepartment(req: Request, res: Response) {
  try {
    const id = req.query.id as string;
    if (!id) return res.status(400).json({ success: false, error: 'Department ID required.' });

    const institution_id = req.user?.institution_id;

    const { error } = await supabaseAdmin
      .from('departments')
      .delete()
      .eq('id', id)
      .eq('institution_id', institution_id);

    if (error) throw error;
    return res.json({ success: true, message: 'Department deleted.' });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ success: false, error: errorMsg });
  }
}
