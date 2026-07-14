import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { supabaseServiceRole } from '../config/supabase';

const router = Router();
router.use(authMiddleware);

// All defined feature modules
const ALL_FEATURES = [
  'dashboard', 'admissions', 'new_admission', 'students', 'users_roles',
  'departments', 'permissions', 'attendance', 'timetable', 'timetable_auto',
  'fees', 'fee_escalation', 'exams', 'exam_seating', 'exam_enrollment',
  'academic_calendar', 'defaulter_report', 'canteen', 'hostel', 'complaints',
  'library', 'placements', 'hr', 'gate', 'gym', 'transit', 'events',
  'lost_found', 'notices', 'idcards', 'ai_concierge', 'obe', 'naac',
  'faculty_development', 'faculty_portal', 'security_portal', 'driver_portal',
  'vendor_portal', 'achievements', 'whatsapp', 'notifications',
  'payment_settings', 'settings', 'director', 'parent_portal', 'profile'
];

const ALL_ROLES = [
  'Admin', 'Staff', 'Teacher', 'Student', 'Parent',
  'Warden', 'Security', 'Vendor', 'Driver', 'Director',
  'TPO', 'HOD', 'Librarian', 'Gym Trainer', 'IQAC Coordinator',
  'Admissions Officer', 'Principal', 'HR Admin', 'Company HR',
  'Vice Principal', 'Applicant'
];

// =========================================================================
// GET /permissions/features/:institutionId - List feature toggles
// =========================================================================
router.get('/features/:institutionId', requireRole(['SuperAdmin', 'Admin']), async (req: Request, res: Response) => {
  try {
    const { institutionId } = req.params;

    // SuperAdmin can access any institution; Admin can only access their own
    if (req.user?.role === 'Admin' && req.user?.institution_id !== institutionId) {
      return res.status(403).json({ success: false, error: 'Access denied to this institution.' });
    }

    const { data: existing, error: fetchErr } = await supabaseServiceRole
      .from('institution_features')
      .select('feature_key, enabled')
      .eq('institution_id', institutionId);

    if (fetchErr) throw fetchErr;

    // Merge existing settings with all features (default enabled)
    const featureMap = new Map((existing || []).map((f: any) => [f.feature_key, f.enabled]));
    const features = ALL_FEATURES.map(key => ({
      feature_key: key,
      enabled: featureMap.has(key) ? featureMap.get(key) : true
    }));

    return res.json({ success: true, features });
  } catch (err: any) {
    console.error('Error fetching features:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch features.' });
  }
});

// =========================================================================
// POST /permissions/features - Toggle feature(s) for an institution
// =========================================================================
router.post('/features', requireRole(['SuperAdmin']), async (req: Request, res: Response) => {
  try {
    const { institution_id, features } = req.body;
    // features: Array<{ feature_key: string; enabled: boolean }>

    if (!institution_id || !Array.isArray(features)) {
      return res.status(400).json({ success: false, error: 'institution_id and features array required.' });
    }

    // SuperAdmin can modify any institution

    const rows = features.map((f: any) => ({
      institution_id,
      feature_key: f.feature_key,
      enabled: f.enabled
    }));

    const { error: upsertErr } = await supabaseServiceRole
      .from('institution_features')
      .upsert(rows, { onConflict: 'institution_id,feature_key' });

    if (upsertErr) throw upsertErr;

    return res.json({ success: true, message: 'Features updated successfully.' });
  } catch (err: any) {
    console.error('Error updating features:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to update features.' });
  }
});

// =========================================================================
// GET /permissions/roles/:institutionId - List role permissions
// =========================================================================
router.get('/roles/:institutionId', requireRole(['SuperAdmin', 'Admin']), async (req: Request, res: Response) => {
  try {
    const { institutionId } = req.params;

    if (req.user?.role === 'Admin' && req.user?.institution_id !== institutionId) {
      return res.status(403).json({ success: false, error: 'Access denied to this institution.' });
    }

    const { data: permissions, error: fetchErr } = await supabaseServiceRole
      .from('module_permissions')
      .select('role, module, can_read, can_write, can_delete')
      .eq('institution_id', institutionId);

    if (fetchErr) throw fetchErr;

    return res.json({ success: true, permissions: permissions || [], all_roles: ALL_ROLES, all_modules: ALL_FEATURES });
  } catch (err: any) {
    console.error('Error fetching role permissions:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch role permissions.' });
  }
});

// =========================================================================
// POST /permissions/roles - Set role permissions for an institution
// =========================================================================
router.post('/roles', requireRole(['SuperAdmin']), async (req: Request, res: Response) => {
  try {
    const { institution_id, permissions } = req.body;
    // permissions: Array<{ role: string; module: string; can_read: boolean; can_write: boolean; can_delete: boolean }>

    if (!institution_id || !Array.isArray(permissions)) {
      return res.status(400).json({ success: false, error: 'institution_id and permissions array required.' });
    }

    // Admin can only modify their own institution
    if (req.user?.role === 'Admin' && req.user?.institution_id !== institution_id) {
      return res.status(403).json({ success: false, error: 'Access denied to this institution.' });
    }

    const rows = permissions.map((p: any) => ({
      institution_id,
      role: p.role,
      module: p.module,
      can_read: p.can_read ?? true,
      can_write: p.can_write ?? false,
      can_delete: p.can_delete ?? false
    }));

    const { error: upsertErr } = await supabaseServiceRole
      .from('module_permissions')
      .upsert(rows, { onConflict: 'institution_id,role,module' });

    if (upsertErr) throw upsertErr;

    return res.json({ success: true, message: 'Role permissions updated successfully.' });
  } catch (err: any) {
    console.error('Error updating role permissions:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to update role permissions.' });
  }
});

// =========================================================================
// GET /permissions/my - Get current user's allowed features & permissions
// =========================================================================
router.get('/my', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const institutionId = req.user?.institution_id;
    const role = req.user?.role;

    if (!userId || !institutionId || !role) {
      return res.status(400).json({ success: false, error: 'User context incomplete.' });
    }

    // SuperAdmin bypasses all checks
    if (role === 'SuperAdmin') {
      return res.json({
        success: true,
        features: ALL_FEATURES.map(f => ({ feature_key: f, enabled: true })),
        permissions: ALL_FEATURES.map(m => ({ module: m, can_read: true, can_write: true, can_delete: true }))
      });
    }

    // Fetch features
    const { data: features } = await supabaseServiceRole
      .from('institution_features')
      .select('feature_key, enabled')
      .eq('institution_id', institutionId);

    // Fetch role permissions
    const { data: perms } = await supabaseServiceRole
      .from('module_permissions')
      .select('module, can_read, can_write, can_delete')
      .eq('institution_id', institutionId)
      .eq('role', role);

    const featureMap = new Map((features || []).map((f: any) => [f.feature_key, f.enabled]));
    const featureList = ALL_FEATURES.map(key => ({
      feature_key: key,
      enabled: featureMap.has(key) ? featureMap.get(key) : true
    }));

    const permList = (perms || []).map((p: any) => ({
      module: p.module,
      can_read: p.can_read,
      can_write: p.can_write,
      can_delete: p.can_delete
    }));

    return res.json({ success: true, features: featureList, permissions: permList });
  } catch (err: any) {
    console.error('Error fetching user permissions:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch permissions.' });
  }
});

// =========================================================================
// POST /permissions/seed - Seed default permissions for a new institution
// =========================================================================
router.post('/seed', requireRole(['SuperAdmin']), async (req: Request, res: Response) => {
  try {
    const { institution_id } = req.body;

    if (!institution_id) {
      return res.status(400).json({ success: false, error: 'institution_id required.' });
    }

    // Admin can only seed their own institution
    if (req.user?.role === 'Admin' && req.user?.institution_id !== institution_id) {
      return res.status(403).json({ success: false, error: 'Access denied to this institution.' });
    }

    // Seed all features as enabled
    const featureRows = ALL_FEATURES.map(key => ({
      institution_id,
      feature_key: key,
      enabled: true
    }));

    const { error: featureErr } = await supabaseServiceRole
      .from('institution_features')
      .upsert(featureRows, { onConflict: 'institution_id,feature_key' });

    if (featureErr) throw featureErr;

    // Sensible default permissions per role
    const WRITE_MODULES: Record<string, string[]> = {
      Admin: [...ALL_FEATURES],
      Director: ['dashboard', 'admissions', 'new_admission', 'students', 'attendance', 'timetable', 'fees', 'fee_escalation', 'exams', 'defaulter_report', 'placements', 'hr', 'hostel', 'gate', 'events', 'notices', 'obe', 'naac', 'director', 'faculty_development', 'achievements'],
      HOD: ['dashboard', 'students', 'attendance', 'obe', 'timetable', 'exams', 'faculty_development', 'achievements', 'placements', 'events', 'notices', 'canteen', 'complaints'],
      Teacher: ['attendance', 'obe', 'timetable', 'exams'],
      Staff: ['attendance'],
      Student: [],
      Parent: [],
      Warden: ['hostel', 'gate', 'complaints', 'notices'],
      Security: ['gate', 'security_portal', 'transit', 'notices'],
      Vendor: ['canteen', 'vendor_portal'],
      Driver: ['driver_portal'],
      TPO: ['placements', 'students'],
      Librarian: ['library'],
      'Gym Trainer': ['gym'],
      'IQAC Coordinator': ['obe', 'naac'],
      'Admissions Officer': ['admissions', 'new_admission'],
      'HR Admin': ['hr'],
      'Company HR': [],
      'Vice Principal': ['dashboard', 'students', 'attendance', 'timetable', 'exams', 'notices', 'complaints'],
      Applicant: [],
    };

    const DELETE_MODULES: Record<string, string[]> = {
      Admin: [...ALL_FEATURES],
    };

    // Seed permissions for all roles
    const permRows: any[] = [];
    for (const r of ALL_ROLES) {
      const writeSet = new Set(WRITE_MODULES[r] || []);
      const deleteSet = new Set(DELETE_MODULES[r] || []);
      for (const mod of ALL_FEATURES) {
        permRows.push({
          institution_id,
          role: r,
          module: mod,
          can_read: true,
          can_write: writeSet.has(mod),
          can_delete: deleteSet.has(mod),
        });
      }
    }

    const { error: permErr } = await supabaseServiceRole
      .from('module_permissions')
      .upsert(permRows, { onConflict: 'institution_id,role,module' });

    if (permErr) throw permErr;

    return res.json({ success: true, message: 'Default permissions seeded for institution.' });
  } catch (err: any) {
    console.error('Error seeding permissions:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to seed permissions.' });
  }
});

export default router;
