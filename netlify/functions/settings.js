const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ALL_FEATURES = [
  'dashboard', 'admissions', 'students', 'attendance', 'timetable',
  'fees', 'exams', 'canteen', 'hostel', 'library', 'placements',
  'hr', 'gate', 'gym', 'transit', 'events', 'notices', 'idcards',
  'ai_concierge', 'obe', 'naac', 'faculty_development', 'achievements',
  'director', 'parent_portal'
];

const ALL_ROLES = [
  'Admin', 'Staff', 'Teacher', 'Student', 'Parent',
  'Warden', 'Security', 'Vendor', 'Driver', 'Director',
  'TPO', 'HOD', 'Librarian', 'Gym Trainer', 'IQAC Coordinator',
  'Admissions Officer', 'Principal'
];

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const params = new URLSearchParams(event.queryStringParameters || {});
    const action = params.get('action');

    // Parse body if present
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Verify JWT token from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
    }
    const token = authHeader.replace('Bearer ', '');

    // Decode JWT to get user info (simple decode, not full verify since backend handles that)
    let userPayload;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        userPayload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      }
    } catch {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Invalid token' }) };
    }

    if (!userPayload || !userPayload.institution_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Missing institution context' }) };
    }

    const institutionId = userPayload.institution_id;
    const role = userPayload.role;

    // Determine target institution ID for SuperAdmin
    const targetInstitutionId = (role === 'SuperAdmin' && (params.get('institution_id') || params.get('institutionId') || body.institution_id || body.institutionId)) || institutionId;

    switch (action) {
      // ==================== FEATURES ====================
      case 'get_features': {
        const { data, error } = await supabase
          .from('institution_features')
          .select('feature_key, enabled')
          .eq('institution_id', targetInstitutionId);

        if (error) throw error;

        const featureMap = new Map((data || []).map(f => [f.feature_key, f.enabled]));
        const features = ALL_FEATURES.map(key => ({
          feature_key: key,
          enabled: featureMap.has(key) ? featureMap.get(key) : true
        }));

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, features }) };
      }

      case 'save_features': {
        if (role !== 'SuperAdmin') {
          return { statusCode: 403, headers, body: JSON.stringify({ success: false, error: 'Only SuperAdmin can toggle modules.' }) };
        }
        const { features } = body;
        if (!Array.isArray(features)) {
          return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'features array required' }) };
        }

        const rows = features.map(f => ({
          institution_id: targetInstitutionId,
          feature_key: f.feature_key,
          enabled: f.enabled
        }));

        const { error } = await supabase
          .from('institution_features')
          .upsert(rows, { onConflict: 'institution_id,feature_key' });

        if (error) throw error;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }

      // ==================== PERMISSIONS ====================
      case 'get_permissions': {
        if (role !== 'SuperAdmin' && role !== 'Admin') {
          return { statusCode: 403, headers, body: JSON.stringify({ success: false, error: 'Forbidden' }) };
        }

        const { data, error } = await supabase
          .from('module_permissions')
          .select('role, module, can_read, can_write, can_delete')
          .eq('institution_id', targetInstitutionId);

        if (error) throw error;

        return {
          statusCode: 200, headers,
          body: JSON.stringify({ success: true, permissions: data || [], all_roles: ALL_ROLES, all_modules: ALL_FEATURES })
        };
      }

      case 'save_permissions': {
        if (role !== 'SuperAdmin') {
          return { statusCode: 403, headers, body: JSON.stringify({ success: false, error: 'Only SuperAdmin can manage permissions.' }) };
        }
        const { permissions } = body;
        if (!Array.isArray(permissions)) {
          return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'permissions array required' }) };
        }

        const rows = permissions.map(p => ({
          institution_id: targetInstitutionId,
          role: p.role,
          module: p.module,
          can_read: p.can_read ?? true,
          can_write: p.can_write ?? false,
          can_delete: p.can_delete ?? false
        }));

        const { error } = await supabase
          .from('module_permissions')
          .upsert(rows, { onConflict: 'institution_id,role,module' });

        if (error) throw error;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }

      // ==================== MY PERMISSIONS ====================
      case 'my_permissions': {
        const { data: features } = await supabase
          .from('institution_features')
          .select('feature_key, enabled')
          .eq('institution_id', institutionId);

        const { data: perms } = await supabase
          .from('module_permissions')
          .select('module, can_read, can_write, can_delete')
          .eq('institution_id', institutionId)
          .eq('role', role);

        const featureMap = new Map((features || []).map(f => [f.feature_key, f.enabled]));
        const featureList = ALL_FEATURES.map(key => ({
          feature_key: key,
          enabled: featureMap.has(key) ? featureMap.get(key) : true
        }));

        const permList = (perms || []).map(p => ({
          module: p.module, can_read: p.can_read, can_write: p.can_write, can_delete: p.can_delete
        }));

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, features: featureList, permissions: permList }) };
      }

      // ==================== SEED ====================
      case 'seed': {
        if (!['SuperAdmin', 'Admin'].includes(role)) {
          return { statusCode: 403, headers, body: JSON.stringify({ success: false, error: 'Only SuperAdmin or Admin can seed defaults.' }) };
        }

        // Seed all features as enabled
        const featureRows = ALL_FEATURES.map(key => ({
          institution_id: targetInstitutionId,
          feature_key: key,
          enabled: true
        }));

        const { error: featureErr } = await supabase
          .from('institution_features')
          .upsert(featureRows, { onConflict: 'institution_id,feature_key' });

        if (featureErr) throw featureErr;

        // Seed Admin full CRUD on all modules
        const adminPerms = ALL_FEATURES.map(mod => ({
          institution_id: targetInstitutionId,
          role: 'Admin',
          module: mod,
          can_read: true,
          can_write: true,
          can_delete: true
        }));

        const { error: permErr } = await supabase
          .from('module_permissions')
          .upsert(adminPerms, { onConflict: 'institution_id,role,module' });

        if (permErr) throw permErr;

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Defaults seeded.' }) };
      }

      default:
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Unknown action: ' + action }) };
    }
  } catch (err) {
    console.error('Settings function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message || 'Internal server error' })
    };
  }
};
