import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
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
