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

export async function POST(req: NextRequest) {
  const supabase = getScopedSupabase(req);
  try {
    const body = await req.json();
    const { amount, description, module: moduleName } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Valid amount required' }, { status: 400 });
    }

    // Get user from JWT
    const authHeader = req.headers.get('authorization');
    let userId = '';
    let institutionId = '';

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.sub || payload.user_id || '';
        institutionId = payload.institution_id || '';
      } catch {}
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get student record
    const { data: student, error: studentErr } = await supabase
      .from('students')
      .select('id, wallet_balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (studentErr || !student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    if ((student.wallet_balance || 0) < amount) {
      return NextResponse.json({ success: false, error: 'Insufficient balance' }, { status: 400 });
    }

    // Deduct from wallet
    const newBalance = (student.wallet_balance || 0) - amount;

    const { error: updateErr } = await supabase
      .from('students')
      .update({ wallet_balance: newBalance })
      .eq('id', student.id);

    if (updateErr) throw updateErr;

    // Record transaction
    const { error: txErr } = await supabase
      .from('wallet_transactions')
      .insert({
        institution_id: institutionId,
        student_id: student.id,
        amount,
        type: 'deduction',
        payment_method: 'wallet',
        status: 'completed',
        description: description || `Wallet deduction via ${moduleName || 'general'}`,
      });

    if (txErr) console.warn('Transaction record failed:', txErr);

    return NextResponse.json({ success: true, new_balance: newBalance });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
