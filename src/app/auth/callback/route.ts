import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Force this route to always be server-rendered (never statically cached).
// Required for cookie access on Netlify SSR deployments.
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || '';

// DEBUG: Log JWT_SECRET presence at module load time (shows in Vercel function logs)
console.log('[auth/callback] MODULE INIT — JWT_SECRET present:', !!JWT_SECRET, '| length:', JWT_SECRET.length, '| prefix:', JWT_SECRET.substring(0, 8));


// Create a service-role supabase client to fetch profiles bypassed RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Standardized mapping of lowercased role strings to their official capitalized casings
const ROLE_CASING_MAP: Record<string, string> = {
  'admin': 'Admin',
  'superadmin': 'SuperAdmin',
  'staff': 'Staff',
  'teacher': 'Teacher',
  'student': 'Student',
  'parent': 'Parent',
  'warden': 'Warden',
  'security': 'Security',
  'vendor': 'Vendor',
  'driver': 'Driver',
  'director': 'Director',
  'tpo': 'TPO',
  'hod': 'HOD',
  'librarian': 'Librarian',
  'gym trainer': 'Gym Trainer',
  'iqac coordinator': 'IQAC Coordinator',
  'admissions officer': 'Admissions Officer',
  'principal': 'Principal',
  'vice principal': 'Vice Principal',
  'vp': 'Vice Principal',
  'hr admin': 'HR Admin',
  'applicant': 'Applicant',
  'company hr': 'Company HR',
  'alumni': 'Alumni'
};

function normalizeRole(role: string | undefined | null): string {
  if (!role) return '';
  const normalized = ROLE_CASING_MAP[role.toLowerCase()];
  return normalized || role;
}

const getRedirectPath = (role: string): string => {
  switch (role) {
    case 'SuperAdmin': return '/admin/global';
    case 'Admin': return '/admin/dashboard';
    case 'Student': return '/student/dashboard';
    case 'Warden': return '/warden/hostel';
    case 'Security': return '/gate';
    case 'Driver': return '/transit';
    case 'Librarian': return '/librarian/library';
    case 'Director': return '/director';
    case 'Parent': return '/parent/dashboard';
    case 'Teacher': return '/teacher/timetable';
    case 'HOD': return '/hod/dashboard';
    case 'Vendor': return '/vendor/dashboard';
    case 'Principal': return '/principal/dashboard';
    case 'Vice Principal': return '/vp/dashboard';
    case 'VP': return '/vp/dashboard';
    case 'HR Admin': return '/hr/my/dashboard';
    case 'Company HR': return '/company';
    case 'IQAC Coordinator': return '/iqac';
    case 'Admissions Officer': return '/officer';
    case 'TPO': return '/tpo';
    case 'Staff': return '/faculty';
    case 'Applicant': return '/applicant';
    default: return '/dashboard';
  }
};

function computeFingerprint(req: NextRequest, deviceId: string): string {
  const userAgent = req.headers.get('user-agent') || 'unknown';

  // Try to resolve client IP
  let ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  let ipSegment = ip;
  if (ip.includes(':')) {
    // IPv6 subnet masking
    ipSegment = ip.split(':').slice(0, 4).join(':');
  } else if (ip.includes('.')) {
    // IPv4 subnet masking
    ipSegment = ip.split('.').slice(0, 3).join('.');
  }

  const raw = `${userAgent}-${ipSegment}-${deviceId}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function renderErrorPage(errorMessage: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Authentication Error</title></head>
    <body style="background-color:#0D0A1A;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
      <div style="text-align:center;max-width:440px;width:100%;padding:32px;border:1px solid rgba(239,68,68,0.25);background-color:#13102A;border-radius:24px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
        <div style="width:48px;height:48px;border-radius:50%;background-color:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
          <svg style="width:24px;height:24px;color:#EF4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h2 style="color:#EF4444;font-size:20px;font-weight:800;margin-top:0;margin-bottom:8px;">Authentication Failed</h2>
        <p style="font-size:13px;color:#C4B5FD;line-height:1.6;margin-bottom:24px;">${errorMessage}</p>
        <a href="/login" style="display:block;width:100%;box-sizing:border-box;text-align:center;padding:12px;background:linear-gradient(to right,#6C2BD9,#8B5CF6);color:white;text-decoration:none;border-radius:12px;font-weight:bold;font-size:14px;">Return to Login</a>
      </div>
    </body>
    </html>
  `;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}

function renderClientHashBridge() {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Authenticating...</title></head>
    <body style="background-color:#0D0A1A;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
      <div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px;">
        <div style="width:40px;height:40px;border:3px solid rgba(124,58,237,0.3);border-top-color:#7C3AED;border-radius:50%;animation:spin 1s infinite linear;"></div>
        <p style="font-size:14px;font-weight:500;color:#C4B5FD;">Verifying Google login parameters...</p>
      </div>
      <style>@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>
      <script>
        (function(){
          try{
            const hash=window.location.hash;
            if(hash&&hash.includes('access_token=')){
              const params=new URLSearchParams(hash.substring(1));
              const at=params.get('access_token');
              const rt=params.get('refresh_token');
              if(at){
                const u=new URL(window.location.href);
                u.searchParams.set('access_token',at);
                if(rt)u.searchParams.set('refresh_token',rt);
                u.hash='';
                window.location.href=u.toString();
                return;
              }
            }
            window.location.href='/login?error='+encodeURIComponent('No authorization code or session tokens returned from Google.');
          }catch(e){
            window.location.href='/login?error='+encodeURIComponent('Authentication routing error');
          }
        })();
      </script>
    </body>
    </html>
  `;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  // ─── STEP 1: Log the incoming request ─────────────────────────────────────
  console.log('════════════════════════════════════════════════════════════');
  console.log('[auth/callback] ▶ ROUTE HIT');
  console.log('[auth/callback] Full URL:', request.url);
  console.log('[auth/callback] Origin:', requestUrl.origin);
  console.log('[auth/callback] Pathname:', requestUrl.pathname);
  console.log('[auth/callback] All query params:', Object.fromEntries(requestUrl.searchParams.entries()));
  console.log('[auth/callback] Cookies present:', request.cookies.getAll().map(c => c.name));
  console.log('════════════════════════════════════════════════════════════');

  const code = requestUrl.searchParams.get('code');
  const accessToken = requestUrl.searchParams.get('access_token');
  const refreshToken = requestUrl.searchParams.get('refresh_token');
  const deviceId = requestUrl.searchParams.get('device_id') || 'unknown-device';

  // ─── STEP 2: Check for auth params ────────────────────────────────────────
  console.log('[auth/callback] STEP 2 — Auth params:');
  console.log('  code:', code ? `PRESENT (${code.substring(0, 12)}...)` : 'MISSING');
  console.log('  access_token:', accessToken ? 'PRESENT' : 'MISSING');
  console.log('  device_id:', deviceId);

  // If no server-side query params exist, check client-side hash fragment (Implicit flow)
  if (!code && !accessToken) {
    console.log('[auth/callback] STEP 2 — No code or access_token. Rendering hash bridge for implicit flow.');
    return renderClientHashBridge();
  }

  // ─── STEP 3: JWT_SECRET check ──────────────────────────────────────────────
  console.log('[auth/callback] STEP 3 — JWT_SECRET present:', !!JWT_SECRET, '| length:', JWT_SECRET.length);
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    console.error('[auth/callback] STEP 3 — JWT_SECRET MISSING or too short! Cannot sign token.');
    return renderErrorPage('JWT Secret key is missing or invalid on the server.');
  }

  try {
    let authUser = null;
    let authSession: { access_token: string; refresh_token: string } | null = null;

    if (code) {
      // ─── STEP 4: PKCE code exchange via direct HTTP POST ───────────────────
      console.log('[auth/callback] STEP 4 — Attempting PKCE code exchange...');
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      console.log('[auth/callback] STEP 4 — Available cookies:', allCookies.map(c => c.name));
      const verifierCookie = allCookies.find(c => c.name.includes('code-verifier') || c.name.includes('code_verifier') || c.name.includes('pkce'));
      const code_verifier = verifierCookie?.value;
      console.log('[auth/callback] STEP 4 — PKCE verifier cookie found:', verifierCookie?.name || 'NONE');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://api.iris365.in';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      const tokenUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=pkce`;
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          code,
          code_verifier: code_verifier || ''
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[auth/callback] STEP 4 — Direct PKCE token exchange failed:', response.status, errText);
        throw new Error(`Direct PKCE token exchange failed: ${errText}`);
      }

      const tokenData = await response.json();
      console.log('[auth/callback] STEP 4 — Direct PKCE exchange SUCCESS');

      const authData = {
        user: tokenData.user,
        session: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600)
        }
      };

      if (!authData.session || !authData.user) {
        console.error('[auth/callback] STEP 5 — Direct PKCE exchange returned no session or user. Data:', JSON.stringify({ hasSession: !!authData.session, hasUser: !!authData.user }));
        throw new Error('Failed to exchange auth session code');
      }
      console.log('[auth/callback] STEP 5 — exchangeCodeForSession SUCCESS:');
      console.log('  user.id:', authData.user.id);
      console.log('  user.email:', authData.user.email);
      console.log('  session.expires_at:', authData.session.expires_at);

      authUser = authData.user;
      authSession = {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token
      };
    } else if (accessToken) {
      // Implicit flow fallback
      console.log('[auth/callback] STEP 4 — Using implicit flow (access_token directly)');
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
      if (userError || !userData.user) {
        console.error('[auth/callback] STEP 4 — getUser failed:', userError?.message);
        throw new Error(userError?.message || 'Failed to retrieve user from access token');
      }
      console.log('[auth/callback] STEP 4 — Implicit flow user:', userData.user.email);
      authUser = userData.user;
      authSession = {
        access_token: accessToken,
        refresh_token: refreshToken || ''
      };
    }

    if (!authUser || !authSession) {
      throw new Error('Authentication session structure is invalid');
    }

    const email = authUser.email;
    if (!email) {
      throw new Error('No email returned from Google authentication provider');
    }

    // ─── STEP 6: Fetch user profile from Supabase users table ────────────────
    console.log('[auth/callback] STEP 6 — Looking up email in users table:', email);
    // Fetch user profile matching the authenticated email
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*, institutions(name, plan_tier, type)')

      .eq('email', email)
      .single();

    // ─── STEP 6 result ────────────────────────────────────────────────────────
    if (profileError) {
      console.error('[auth/callback] STEP 6 — Supabase users table query error:', profileError.message, '| code:', profileError.code);
    }
    console.log('[auth/callback] STEP 6 — Profile found:', !!userProfile, '| email queried:', email);
    if (userProfile) {
      console.log('[auth/callback] STEP 6 — Profile details: id:', userProfile.id, '| role:', userProfile.role, '| is_active:', userProfile.is_active, '| institution_id:', userProfile.institution_id);
    }

    let resolvedRole = 'Student';
    let resolvedInstitutionId = 'a0000000-0000-0000-0000-000000000001';
    let resolvedName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Google User';
    let resolvedInstitutionName = 'SIN Institute of Engineering & Technology (SIET)';
    let resolvedPlanTier = 'University';
    let resolvedInstituteType = 'college';
    let isActive = true;
    let profileId = authUser.id;

    if (userProfile) {
      resolvedRole = userProfile.role;
      resolvedInstitutionId = userProfile.institution_id;
      resolvedName = userProfile.name;
      resolvedInstitutionName = userProfile.institutions?.name || resolvedInstitutionName;
      resolvedPlanTier = userProfile.institutions?.plan_tier || resolvedPlanTier;
      resolvedInstituteType = userProfile.institutions?.type === 'school' ? 'school' : 'college';
      isActive = userProfile.is_active;
      profileId = userProfile.id;
    } else {
      // Email not found in users table — reject OAuth login
      console.warn(`[auth/callback] STEP 6 — Email NOT found in users table: ${email}. Redirecting to /login?error=user_not_found`);
      return NextResponse.redirect(new URL('/login?error=user_not_found', requestUrl.origin));
    }

    if (!isActive) {
      return renderErrorPage('Your platform profile has been deactivated.');
    }

    const normalizedRole = normalizeRole(resolvedRole);

    // ─── STEP 7: Sign JWT ─────────────────────────────────────────────────────
    console.log('[auth/callback] STEP 7 — Signing JWT:');
    console.log('  JWT_SECRET present:', !!JWT_SECRET, '| length:', JWT_SECRET.length, '| prefix:', JWT_SECRET.substring(0, 8));
    console.log('  Claims: role:', normalizedRole, '| id:', profileId, '| institution_id:', resolvedInstitutionId);

    const tokenClaims = {
      id: profileId,
      institution_id: resolvedInstitutionId,
      role: normalizedRole,
      email,
      // fingerprint intentionally omitted — computed on Vercel serverless IP/UA, never matches Render
      supabase_token: authSession.access_token,
      supabase_refresh_token: authSession.refresh_token,
      institute_type: resolvedInstituteType
    };

    const token = jwt.sign(tokenClaims, JWT_SECRET, { expiresIn: '7d' });
    const tokenParts = token.split('.');
    console.log('[auth/callback] STEP 7 — Token signed ✓ | starts with eyJ:', token.startsWith('eyJ'), '| prefix:', token.substring(0, 25), '| payload:', Buffer.from(tokenParts[1], 'base64').toString().substring(0, 100));

    const profileData = {
      id: profileId,
      name: resolvedName,
      email,
      role: normalizedRole,
      institution_id: resolvedInstitutionId,
      institution_name: resolvedInstitutionName,
      plan_tier: resolvedPlanTier,
      institute_type: resolvedInstituteType
    };

    const redirectPath = getRedirectPath(normalizedRole);

    // ─── Reliable token delivery via URL redirect ─────────────────────────────
    // The previous HTML bridge approach (inline <script> writing localStorage)
    // was silently failing — browser security policies (CSP, ITP, incognito mode)
    // can block inline script execution or localStorage access in third-party contexts.
    //
    // New approach: redirect to /login with the token embedded as a URL query param.
    // The login page React code reads it, writes localStorage, then navigates to the
    // correct dashboard — this always runs in a trusted first-party page context.
    // ─────────────────────────────────────────────────────────────────────────────
    const loginRedirectUrl = new URL('/login', requestUrl.origin);
    loginRedirectUrl.searchParams.set('token', token);
    loginRedirectUrl.searchParams.set('refresh', authSession.refresh_token);
    loginRedirectUrl.searchParams.set('profile', JSON.stringify(profileData));
    loginRedirectUrl.searchParams.set('path', redirectPath);

    // ─── STEP 8: Final redirect ───────────────────────────────────────────────
    console.log('[auth/callback] STEP 8 — Final redirect URL (base, no token for security):');
    console.log('  Origin:', requestUrl.origin);
    console.log('  Path: /login');
    console.log('  Params: path=' + redirectPath + ' | role=' + normalizedRole + ' | token present:', !!token);
    console.log('  Full redirect URL length:', loginRedirectUrl.toString().length, 'chars');
    console.log('════════════════════════════════════════════════════════════');
    console.log('[auth/callback] ✅ COMPLETE — redirecting to login for localStorage ingestion');
    console.log('════════════════════════════════════════════════════════════');

    return NextResponse.redirect(loginRedirectUrl);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'OAuth authentication failed.';
    console.error('[auth/callback] Error:', message);
    return renderErrorPage(message);
  }
}
