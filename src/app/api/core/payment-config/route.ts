import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';

function getScopedSupabase(req: NextRequest): any {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  const jwtSecret = process.env.JWT_SECRET;
  
  if (token && jwtSecret && token !== 'mock-sandbox-jwt-token-value') {
    try {
      const decodedClaims = jwt.verify(token, jwtSecret) as any;
      if (decodedClaims && decodedClaims.supabase_token) {
        return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${decodedClaims.supabase_token}` } }
        });
      }
    } catch (e) {
      // ignore
    }
  }
  return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
}

export async function GET(req: NextRequest) {
  const supabase = getScopedSupabase(req);
  try {
    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get('institution_id');

    if (!institutionId) {
      return NextResponse.json({ success: false, error: 'institution_id required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('payment_config')
      .select('*')
      .eq('institution_id', institutionId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      config: data || {
        enabled_methods: ['razorpay'],
        razorpay_key_id: '',
        razorpay_key_secret: '',
        bank_account_number: '',
        bank_name: '',
        bank_ifsc: '',
        bank_holder_name: '',
        upi_id: '',
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = getScopedSupabase(req);
  try {
    const body = await req.json();
    const { institution_id, ...config } = body;

    if (!institution_id) {
      return NextResponse.json({ success: false, error: 'institution_id required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('payment_config')
      .upsert({
        institution_id,
        ...config,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'institution_id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
