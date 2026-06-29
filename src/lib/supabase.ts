import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabaseTokenFromJWT(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('iris_jwt_token');
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(payloadJson);
      return payload.supabase_token || token;
    }
  } catch (e) {
    console.error('Failed to decode iris_jwt_token:', e);
  }
  return token;
}

let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase URL or Anon Key is missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured.');
    }

    // createBrowserClient from @supabase/ssr stores the PKCE code_verifier in cookies
    // so it is accessible server-side during the OAuth callback exchange.
    supabaseInstance = createBrowserClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder'
    );
  }

  // Inject iris JWT into Supabase auth headers so RLS policies are satisfied
  const irisToken = getSupabaseTokenFromJWT();
  if (irisToken && typeof (supabaseInstance as any).rest !== 'undefined') {
    try {
      (supabaseInstance as any).rest.headers['Authorization'] = `Bearer ${irisToken}`;
    } catch {
      // Ignore header injection failure — falls back to anon key
    }
  }

  return supabaseInstance;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop];
  }
});
