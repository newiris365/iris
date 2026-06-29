import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

let currentToken: string | null = null;
let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  const token = typeof window !== 'undefined' ? (getSupabaseTokenFromJWT() || 'anon') : 'anon';
  
  if (!supabaseInstance || currentToken !== token) {
    currentToken = token;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase URL or Anon Key is missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured.');
    }
    
    const headers: Record<string, string> = {};
    if (token && token !== 'anon') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    supabaseInstance = createClient(
      supabaseUrl || 'https://placeholder.supabase.co', 
      supabaseAnonKey || 'placeholder',
      {
        auth: {
          flowType: 'pkce',
          persistSession: true,
          detectSessionInUrl: true
        },
        global: {
          headers
        }
      }
    );
  }
  return supabaseInstance;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop];
  }
});
