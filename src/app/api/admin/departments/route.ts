import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } });

function getScopedSupabase(req: NextRequest): any {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return supabaseAdmin;

  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      if (decoded?.supabase_token) {
        return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${decoded.supabase_token}` } }
        });
      }
    } catch {}
  }
  return supabaseAdmin;
}

function getUserPayload(req: NextRequest): any {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return null;
  try {
    return jwt.verify(token, jwtSecret) as any;
  } catch {
    return null;
  }
}

// GET - List departments
export async function GET(req: NextRequest) {
  try {
    const supabase = getScopedSupabase(req);
    const userPayload = getUserPayload(req);
    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get('institution_id') || userPayload?.institution_id;

    if (!institutionId) {
      return NextResponse.json({ success: false, error: 'institution_id required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('departments')
      .select('id, name, code, created_at')
      .eq('institution_id', institutionId)
      .order('name');

    if (error) throw error;

    return NextResponse.json({ success: true, departments: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST - Create department
export async function POST(req: NextRequest) {
  try {
    const supabase = getScopedSupabase(req);
    const userPayload = getUserPayload(req);
    const body = await req.json();
    const { name, code, institution_id } = body;

    const instId = institution_id || userPayload?.institution_id;
    if (!instId) {
      return NextResponse.json({ success: false, error: 'institution_id required.' }, { status: 400 });
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Department name is required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('departments')
      .insert({ name: name.trim(), code: code?.trim() || null, institution_id: instId })
      .select('id, name, code, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, department: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT - Update department
export async function PUT(req: NextRequest) {
  try {
    const supabase = getScopedSupabase(req);
    const body = await req.json();
    const { id, name, code } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Department id required.' }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (code !== undefined) updates.code = code?.trim() || null;

    const { data, error } = await supabase
      .from('departments')
      .update(updates)
      .eq('id', id)
      .select('id, name, code, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, department: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE - Delete department
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getScopedSupabase(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Department id required.' }, { status: 400 });
    }

    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
