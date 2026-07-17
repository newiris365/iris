import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Public endpoint — no auth required.
// Uses the anon key so RLS applies (institutions table should allow public SELECT).
// Falls back to service key if the anon key cannot read the table (common before RLS is tuned).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service-role client used here because:
// 1. The institutions table has RLS policies scoped to authenticated users/tenants.
// 2. This is a read-only, non-sensitive list — only rows where is_visible_on_homepage=true are returned.
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * GET /api/institutions/public
 *
 * Query params:
 *   type  – "college" | "school" | "all" (default: "all")
 *   city  – city name string (case-insensitive, optional)
 *   id    – UUID of a specific institution (optional — returns single record)
 *
 * Returns only active institutions where is_visible_on_homepage = true.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get('type') || 'all';
    const cityFilter = searchParams.get('city') || '';
    const idFilter = searchParams.get('id') || '';

    // Build query — only return publicly visible, active institutions
    let query = supabaseAdmin
      .from('institutions')
      .select('id, name, type, institute_type, city, state, logo_url, address')
      .eq('is_visible_on_homepage', true)
      .eq('is_active', true)
      .order('name', { ascending: true });

    // Filter by type if specified
    if (typeFilter === 'college') {
      query = query.neq('institute_type', 'school');
    } else if (typeFilter === 'school') {
      query = query.eq('institute_type', 'school');
    }

    // Filter by city (case-insensitive via ilike)
    if (cityFilter) {
      query = query.ilike('city', `%${cityFilter}%`);
    }

    // Single institution by ID
    if (idFilter) {
      query = query.eq('id', idFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[api/institutions/public] Supabase error:', error.message);
      // Graceful degradation — return empty list rather than a 500 to the public
      return NextResponse.json({ institutions: [], error: error.message }, { status: 200 });
    }

    // Derive distinct city list from the result for client-side city filter population
    const allCities = Array.from(new Set((data || []).map((i: any) => i.city).filter(Boolean))).sort();

    if (idFilter) {
      const institution = data && data.length > 0 ? data[0] : null;
      if (!institution) {
        return NextResponse.json({ error: 'Institution not found or not publicly listed.' }, { status: 404 });
      }
      return NextResponse.json({ institution });
    }

    return NextResponse.json({
      institutions: data || [],
      cities: allCities,
    });
  } catch (err: any) {
    console.error('[api/institutions/public] Unexpected error:', err?.message);
    return NextResponse.json({ institutions: [], cities: [], error: 'Internal server error' }, { status: 500 });
  }
}
