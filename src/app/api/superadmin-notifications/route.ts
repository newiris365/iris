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
    const action = searchParams.get('action');

    if (action === 'unread_notifications') {
      // Get user from JWT header
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.json({ count: 0 });
      }

      // Decode JWT to get user info (simplified - in production use proper JWT verification)
      const token = authHeader.replace('Bearer ', '');
      let userId = '';
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.sub || payload.user_id || '';
      } catch {
        return NextResponse.json({ count: 0 });
      }

      if (!userId) return NextResponse.json({ count: 0 });

      // Count unread notifications
      const { count, error } = await supabase
        .from('superadmin_notification_reads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return NextResponse.json({ success: true, count: count || 0 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = getScopedSupabase(req);
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'send_notification') {
      const { title, body: messageBody, type, target_campus_ids, sent_by } = body;

      if (!title || !messageBody) {
        return NextResponse.json({ success: false, error: 'Title and body are required' }, { status: 400 });
      }

      // Insert notification
      const { data: notif, error: notifErr } = await supabase
        .from('superadmin_notifications')
        .insert({
          title,
          body: messageBody,
          type: type || 'General Update',
          target_campus_ids: target_campus_ids || [],
          sent_by: sent_by || null,
        })
        .select()
        .single();

      if (notifErr) throw notifErr;

      // Get admin users in target campuses
      let query = supabase.from('users').select('id, institution_id').eq('role', 'Admin');
      if (target_campus_ids && target_campus_ids.length > 0) {
        query = query.in('institution_id', target_campus_ids);
      }
      const { data: admins } = await query;

      if (admins && admins.length > 0) {
        const readRows = admins.map((a: any) => ({
          notification_id: notif.id,
          user_id: a.id,
          is_read: false,
        }));
        await supabase.from('superadmin_notification_reads').insert(readRows);
      }

      return NextResponse.json({ success: true, notification: notif });
    }

    if (action === 'mark_read') {
      const { notification_id, user_id } = body;
      const { error } = await supabase
        .from('superadmin_notification_reads')
        .upsert({
          notification_id,
          user_id,
          is_read: true,
          read_at: new Date().toISOString(),
        }, { onConflict: 'notification_id,user_id' });

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_notification') {
      const { notification_id } = body;
      await supabase.from('superadmin_notification_reads').delete().eq('notification_id', notification_id);
      await supabase.from('superadmin_notifications').delete().eq('id', notification_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
