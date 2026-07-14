import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const PAGE_SIZE = 1000;

export async function GET() {
  try {
    let allUsers: any[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role, is_active, institution_id')
        .order('name', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allUsers = allUsers.concat(data);
        from += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    // Fetch institution names separately to avoid join issues
    const { data: insts } = await supabaseAdmin
      .from('institutions')
      .select('id, name');

    const instMap = new Map<string, string>();
    if (insts) {
      for (const inst of insts) {
        instMap.set(inst.id, inst.name);
      }
    }

    const users = allUsers.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      is_active: u.is_active,
      institution_id: u.institution_id,
      institution_name: instMap.get(u.institution_id) || 'Global System'
    }));

    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
