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
  const code = requestUrl.searchParams.get('code');
  const accessToken = requestUrl.searchParams.get('access_token');
  const refreshToken = requestUrl.searchParams.get('refresh_token');
  const deviceId = requestUrl.searchParams.get('device_id') || 'unknown-device';

  console.log('[auth/callback] code:', code ? '[PRESENT]' : '[MISSING]', 'access_token:', accessToken ? '[PRESENT]' : '[MISSING]');

  // If no server-side query params exist, check client-side hash fragment (Implicit flow)
  if (!code && !accessToken) {
    return renderClientHashBridge();
  }

  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    return renderErrorPage('JWT Secret key is missing or invalid on the server.');
  }

  try {
    let authUser = null;
    let authSession: { access_token: string; refresh_token: string } | null = null;

    if (code) {
      // Use next/headers cookieStore for maximum compatibility with Netlify SSR.
      // createServerClient reads code_verifier from the cookie set by createBrowserClient
      // on the frontend, completing the PKCE exchange without any manual bridging.
      const cookieStore = await cookies();

      const supabaseSSR = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                });
              } catch {
                // setAll may throw in read-only contexts (edge middleware).
                // Not critical for the callback route — the exchange already succeeded.
              }
            }
          }
        }
      );

      // Exchange the OAuth authorization code for a Supabase session.
      // @supabase/ssr automatically retrieves the code_verifier from the cookie.
      const { data: authData, error: authError } = await supabaseSSR.auth.exchangeCodeForSession(code);
      if (authError || !authData.session || !authData.user) {
        throw new Error(authError?.message || 'Failed to exchange auth session code');
      }
      authUser = authData.user;
      authSession = {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token
      };
    } else if (accessToken) {
      // Implicit flow fallback — use access token directly
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
      if (userError || !userData.user) {
        throw new Error(userError?.message || 'Failed to retrieve user from access token');
      }
      authUser = userData.user;
      authSession = {
        access_token: accessToken,
        refresh_token: refreshToken || ''
      };
    }

    if (!authUser || !authSession) {
      throw new Error('Authentication session structure is invalid');
    }

    console.log('[auth/callback] Authenticated:', { user_id: authUser.id, email: authUser.email });

    const email = authUser.email;
    if (!email) {
      throw new Error('No email returned from Google authentication provider');
    }

    // Fetch user profile matching the authenticated email
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('*, institutions(name, plan_tier, type)')
      .eq('email', email)
      .single();

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
      console.warn(`[auth/callback] Email not in users table: ${email}. Rejecting.`);
      return NextResponse.redirect(new URL('/login?error=user_not_found', requestUrl.origin));
    }

    if (!isActive) {
      return renderErrorPage('Your platform profile has been deactivated.');
    }

    const normalizedRole = normalizeRole(resolvedRole);

    console.log('[auth/callback] JWT_SECRET at sign time — present:', !!JWT_SECRET, '| length:', JWT_SECRET.length, '| prefix:', JWT_SECRET.substring(0, 8));

    const tokenClaims = {
      id: profileId,
      institution_id: resolvedInstitutionId,
      role: normalizedRole,
      email,
      // NOTE: fingerprint intentionally REMOVED — it was computed on Vercel's serverless IP/UA
      // which will never match what Render Express recomputes from browser requests → causes 403
      supabase_token: authSession.access_token,
      supabase_refresh_token: authSession.refresh_token,
      institute_type: resolvedInstituteType
    };

    const token = jwt.sign(tokenClaims, JWT_SECRET, { expiresIn: '15m' });

    // DEBUG: Log the signed token header+payload (NOT signature) and first 20 chars
    const tokenParts = token.split('.');
    console.log('[auth/callback] Token signed — header:', Buffer.from(tokenParts[0], 'base64').toString(), '| payload preview:', Buffer.from(tokenParts[1], 'base64').toString().substring(0, 120), '| token prefix:', token.substring(0, 20));


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

    // Client-side bridge writes auth tokens to localStorage then redirects
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head><title>Authenticating User...</title></head>
      <body style="background-color:#0D0A1A;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px;">
          <div style="width:40px;height:40px;border:3px solid rgba(124,58,237,0.3);border-top-color:#7C3AED;border-radius:50%;animation:spin 1s infinite linear;"></div>
          <p style="font-size:14px;font-weight:500;color:#C4B5FD;">Finalizing platform authentication...</p>
        </div>
        <style>@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>
        <script>
          (function(){
            try{
              var token = ${JSON.stringify(token)};
              var refreshToken = ${JSON.stringify(authSession.refresh_token)};
              var profile = ${JSON.stringify(profileData)};

              // DEBUG: Log token details to browser console
              console.log('[IRIS Auth Callback] Token type:', token.startsWith('eyJ') ? 'REAL JWT' : 'UNEXPECTED FORMAT');
              console.log('[IRIS Auth Callback] Token prefix (first 30 chars):', token.substring(0, 30));
              console.log('[IRIS Auth Callback] Token length:', token.length);
              console.log('[IRIS Auth Callback] Profile role:', profile.role);
              console.log('[IRIS Auth Callback] Storing to localStorage key: iris_jwt_token');

              localStorage.setItem('iris_jwt_token', token);
              localStorage.setItem('iris_refresh_token', refreshToken);
              localStorage.setItem('iris_user_profile', JSON.stringify(profile));
              
              var stored = localStorage.getItem('iris_jwt_token');
              console.log('[IRIS Auth Callback] Verified stored token prefix:', stored ? stored.substring(0, 30) : 'NULL - STORAGE FAILED');

              if (!stored) {
                throw new Error('JWT token could not be verified in localStorage.');
              }
              
              window.location.href=${JSON.stringify(redirectPath)};
            }catch(e){
              console.error('[IRIS Auth Callback] Error:', e.message);
              window.location.href='/login?error='+encodeURIComponent('Failed to store session locally: ' + e.message);
            }
          })();
        </script>
      </body>
      </html>
    `;

    return new NextResponse(htmlResponse, { headers: { 'Content-Type': 'text/html' } });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'OAuth authentication failed.';
    console.error('[auth/callback] Error:', message);
    return renderErrorPage(message);
  }
}
