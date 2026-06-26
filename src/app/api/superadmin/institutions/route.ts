import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client that bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function calculateSubscriptionEndDate(startDateStr: string, period: string): string {
  const startDate = new Date(startDateStr);
  const endDate = new Date(startDate);
  if (period === 'yearly') {
    endDate.setFullYear(startDate.getFullYear() + 1);
  } else if (period === 'quarterly') {
    endDate.setMonth(startDate.getMonth() + 3);
  } else { // default to monthly
    endDate.setMonth(startDate.getMonth() + 1);
  }
  return endDate.toISOString();
}

// GET - List all institutions
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('institutions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ institutions: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - Create a new institution
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, email, phone, plan_tier, is_active, address, city, state, subscription_period, password, institute_type } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const PLAN_PRICING: Record<string, number> = {
      Seed: 0, Campus: 10000, University: 25000, Enterprise: 50000,
    };

    // 1. Create the institution record
    const startDate = new Date().toISOString();
    const period = subscription_period || 'monthly';
    const endDate = calculateSubscriptionEndDate(startDate, period);

    const { data: institution, error: instError } = await supabaseAdmin
      .from('institutions')
      .insert({
        name,
        type: type || 'university',
        email,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        plan_tier: plan_tier || 'Campus',
        is_active: is_active !== undefined ? is_active : true,
        plan_price_monthly: PLAN_PRICING[plan_tier] || 0,
        subscription_status: 'active',
        subscription_start_date: startDate,
        subscription_end_date: endDate,
        subscription_period: period,
        institute_type: institute_type || 'college',
      })
      .select()
      .single();

    if (instError) throw instError;

    // 2. Create the Admin user in Supabase Auth
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: `${name} Admin`, role: 'Admin', institution_id: institution.id },
    });

    if (authErr) {
      console.warn('Auth user creation failed (sandbox mode):', authErr.message);
    }

    const userId = authUser?.user?.id;

    // 3. Create the corresponding profile row in the users table
    const { error: profileErr } = await supabaseAdmin
      .from('users')
      .insert({
        ...(userId ? { id: userId } : {}),
        institution_id: institution.id,
        name: `${name} Admin`,
        email,
        phone: phone || null,
        role: 'Admin',
        is_active: true,
      });

    if (profileErr) {
      console.error('Failed to create Admin profile row:', profileErr.message);
      throw profileErr;
    }

    return NextResponse.json({ institution }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH - Update an institution
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Institution ID is required.' }, { status: 400 });
    }

    // 1. Fetch one row to inspect the columns actually present in the institutions table
    const { data: schemaRecord } = await supabaseAdmin
      .from('institutions')
      .select('*')
      .limit(1);

    const allowedColumns = schemaRecord && schemaRecord.length > 0 ? Object.keys(schemaRecord[0]) : [];

    // 2. Recalculate end date if subscription period is being updated, but only if end date is not explicitly specified in payload and columns exist
    if (
      updates.subscription_period && 
      allowedColumns.includes('subscription_period') && 
      allowedColumns.includes('subscription_end_date') && 
      !('subscription_end_date' in updates)
    ) {
      // Fetch the existing start date first
      const selectFields = [];
      if (allowedColumns.includes('subscription_start_date')) selectFields.push('subscription_start_date');
      if (allowedColumns.includes('created_at')) selectFields.push('created_at');

      const { data: currentInst } = await supabaseAdmin
        .from('institutions')
        .select(selectFields.join(','))
        .eq('id', id)
        .single();
      
      const instData = currentInst as any;
      const startDate = instData?.subscription_start_date || instData?.created_at || new Date().toISOString();
      updates.subscription_end_date = calculateSubscriptionEndDate(startDate, updates.subscription_period);
    }

    // 3. Filter updates to only include columns that exist in the database table
    const sanitizedUpdates: Record<string, any> = {};
    const skippedColumns: string[] = [];
    for (const key of Object.keys(updates)) {
      if (allowedColumns.includes(key)) {
        sanitizedUpdates[key] = updates[key];
      } else {
        skippedColumns.push(key);
        console.warn(`Column '${key}' does not exist in 'institutions' table. Skipping.`);
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update. Institution table may be missing columns.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('institutions')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const response: any = { institution: data };
    if (skippedColumns.length > 0) {
      response.warnings = [`Columns not saved (missing from DB): ${skippedColumns.join(', ')}`];
    }
    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - Delete an institution
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Institution ID is required.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('institutions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
