/**
 * Centralized API client for IRIS 365 Frontend
 * Handles JWT injection, base URL, and auto-redirect on auth failures.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  [key: string]: any;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

function getAuthHeaders(): Record<string, string> {
  let token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') : null;
  if (token === 'undefined' || token === 'null') {
    token = null;
  }
  const deviceId = typeof window !== 'undefined' ? localStorage.getItem('iris_client_device_id') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (typeof window !== 'undefined') {
    // Only inject a fallback sandbox token when no real token exists
    if (!token) {
      if (window.location.pathname.includes('/warden')) {
        // Warden fallback token
        token = 'mock-sandbox-jwt-token-value.eyJpZCI6ImIwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMiIsImluc3RpdHV0aW9uX2lkIjoiYTAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwicm9sZSI6IldhcmRlbiIsImVtYWlsIjoid2FyZGVuQHNpZXQuZWR1LmluIn0=';
      } else {
        // Default student fallback token
        token = 'mock-sandbox-jwt-token-value.eyJpZCI6ImIwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwNiIsImluc3RpdHV0aW9uX2lkIjoiYTAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwicm9sZSI6IlN0dWRlbnQiLCJlbWFpbCI6ImtodXNoYWxAZ21haWwuY29tIn0=';
      }
    }
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (deviceId) {
    headers['X-Client-Device-ID'] = deviceId;
  }
  return headers;
}

function handleAuthError(status: number): void {
  if (status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('iris_jwt_token');
    localStorage.removeItem('iris_user_profile');
    localStorage.removeItem('iris_refresh_token');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
}

async function request(url: string, options: RequestInit): Promise<Response> {
  const headers = { ...options.headers } as Record<string, string>;
  if (!headers['Authorization'] && typeof window !== 'undefined') {
    let token = localStorage.getItem('iris_jwt_token');
    if (token === 'undefined' || token === 'null') {
      token = null;
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  options.headers = headers;

  console.log(`[API Request] Fetching URL: ${url}`, {
    method: options.method,
    headers: {
      ...options.headers,
      Authorization: options.headers['Authorization'] ? 'Bearer [PRESENT]' : undefined
    }
  });

  const response = await fetch(url, options);

  console.log(`[API Response] URL: ${url} -> Status: ${response.status}`);

  if (response.status === 401) {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('iris_refresh_token') : null;
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          console.log(`[API Token Refresh] Initiating token refresh for URL: ${url}`);
          const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            if (data.success && data.token) {
              console.log('[API Token Refresh] Token refresh succeeded.');
              localStorage.setItem('iris_jwt_token', data.token);
              if (data.refreshToken) {
                localStorage.setItem('iris_refresh_token', data.refreshToken);
              }
              onRefreshed(data.token);
              isRefreshing = false;

              // Re-run the request with the new token
              const headers = { ...options.headers } as Record<string, string>;
              headers['Authorization'] = `Bearer ${data.token}`;
              return await fetch(url, { ...options, headers });
            }
          }
        } catch (err) {
          console.error('Failed to auto-refresh token:', err);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Wait for current refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            const headers = { ...options.headers } as Record<string, string>;
            headers['Authorization'] = `Bearer ${newToken}`;
            resolve(fetch(url, { ...options, headers }));
          });
        });
      }
    }

    // Refresh failed or no refresh token
    handleAuthError(response.status);
  }

  return response;
}

function dispatchFallbackEvent(endpoint: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('iris-api-fallback', { detail: { endpoint, isNetworkError: true } }));
  }
}

function getFormattedUrl(endpoint: string): string {
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${formattedEndpoint}`;
}

export async function apiGet<T = any>(endpoint: string, params?: Record<string, string>, cacheSeconds = 0): Promise<ApiResponse<T>> {
  try {
    const url = new URL(getFormattedUrl(endpoint), typeof window !== 'undefined' ? window.location.origin : undefined);
    if (params) {
      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    }

    const headers = getAuthHeaders();
    if (cacheSeconds > 0) {
      headers['Cache-Control'] = `public, max-age=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 5}`;
    }

    const response = await request(url.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store', // Disable browser caching to ensure fresh data
    });

    const json = await response.json();
    console.log(`[API GET Response JSON] URL: ${url.toString()}`, json);
    return json;
  } catch (err: any) {
    console.error(`apiGet failed for ${endpoint}:`, err);
    dispatchFallbackEvent(endpoint);
    return { success: false, error: 'Connection failed. Please check if backend is running.' };
  }
}

export async function apiPost<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
  try {
    const url = getFormattedUrl(endpoint);
    const response = await request(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    const json = await response.json();
    console.log(`[API POST Response JSON] URL: ${url}`, json);
    return json;
  } catch (err: any) {
    console.error(`apiPost failed for ${endpoint}:`, err);
    dispatchFallbackEvent(endpoint);
    return { success: false, error: 'Connection failed. Please check if backend is running.' };
  }
}

export async function apiPut<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
  try {
    const response = await request(getFormattedUrl(endpoint), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    return await response.json();
  } catch (err: any) {
    console.error(`apiPut failed for ${endpoint}:`, err);
    dispatchFallbackEvent(endpoint);
    return { success: false, error: 'Connection failed. Please check if backend is running.' };
  }
}

export async function apiDelete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const response = await request(getFormattedUrl(endpoint), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return await response.json();
  } catch (err: any) {
    console.error(`apiDelete failed for ${endpoint}:`, err);
    dispatchFallbackEvent(endpoint);
    return { success: false, error: 'Connection failed. Please check if backend is running.' };
  }
}

/**
 * Fetch a binary blob (e.g. PDF report download)
 */
export async function apiFetchBlob(endpoint: string, body?: any): Promise<Blob> {
  try {
    const response = await request(getFormattedUrl(endpoint), {
      method: body ? 'POST' : 'GET',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    return await response.blob();
  } catch (err: any) {
    console.error(`apiFetchBlob failed for ${endpoint}:`, err);
    dispatchFallbackEvent(endpoint);
    throw new Error('Connection failed. Please check if backend is running.');
  }
}

// =========================================================================
// Permissions API
// =========================================================================
export interface FeatureToggle {
  feature_key: string;
  enabled: boolean;
}

export interface ModulePermission {
  role: string;
  module: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
}

export async function getFeatureToggles(institutionId: string): Promise<ApiResponse<{ features: FeatureToggle[] }>> {
  return settingsApi('get_features', { institution_id: institutionId });
}

export async function setFeatureToggles(institutionId: string, features: FeatureToggle[]): Promise<ApiResponse> {
  return settingsApi('save_features', { institution_id: institutionId }, { features });
}

export async function getRolePermissions(institutionId: string): Promise<ApiResponse<{ permissions: ModulePermission[]; all_roles: string[]; all_modules: string[] }>> {
  return settingsApi('get_permissions', { institution_id: institutionId });
}

export async function setRolePermissions(institutionId: string, permissions: ModulePermission[]): Promise<ApiResponse> {
  return settingsApi('save_permissions', { institution_id: institutionId }, { permissions });
}

export async function getMyPermissions(): Promise<ApiResponse<{ features: FeatureToggle[]; permissions: ModulePermission[] }>> {
  return settingsApi('my_permissions');
}

export async function seedPermissions(institutionId: string): Promise<ApiResponse> {
  return settingsApi('seed', { institution_id: institutionId }, {});
}

// Netlify Function helper for settings operations
async function settingsApi(action: string, queryParams?: Record<string, string>, body?: any): Promise<ApiResponse> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const urlParams = new URLSearchParams({ action });
    if (queryParams) {
      Object.entries(queryParams).forEach(([k, v]) => {
        if (v) urlParams.set(k, v);
      });
    }

    const response = await fetch(`/api/settings?${urlParams.toString()}`, {
      method: body ? 'POST' : 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return await response.json();
  } catch (err: any) {
    console.error(`settingsApi failed for ${action}:`, err);
    return { success: false, error: 'Connection failed. Please check if backend is running.' };
  }
}

// =========================================================================
// Attendance Methods & Devices API
// =========================================================================
export interface AttendanceMethod {
  id: string;
  method_key: string;
  is_enabled: boolean;
  config: Record<string, any>;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceDevice {
  id: string;
  device_name: string;
  device_type: string;
  device_serial: string;
  api_key: string;
  department_id?: string;
  is_active: boolean;
  last_heartbeat?: string;
  firmware_version?: string;
  created_at: string;
}

export async function getAttendanceMethods(): Promise<ApiResponse<{ methods: AttendanceMethod[] }>> {
  return apiGet('/core/attendance/methods');
}

export async function updateAttendanceMethod(methodKey: string, isEnabled: boolean, config?: Record<string, any>): Promise<ApiResponse> {
  return apiPut('/core/attendance/method', { method_key: methodKey, is_enabled: isEnabled, config });
}

export async function batchUpdateAttendanceMethods(methods: { method_key: string; is_enabled: boolean; config?: Record<string, any> }[]): Promise<ApiResponse> {
  return apiPost('/core/attendance/methods/batch', { methods });
}

export async function getAttendanceDevices(): Promise<ApiResponse<{ devices: AttendanceDevice[] }>> {
  return apiGet('/core/attendance/devices');
}

export async function registerAttendanceDevice(device: { device_name: string; device_type: string; device_serial: string; department_id?: string }): Promise<ApiResponse<{ device: AttendanceDevice }>> {
  return apiPost('/core/attendance/device', device);
}

export async function updateAttendanceDevice(id: string, updates: Partial<AttendanceDevice>): Promise<ApiResponse> {
  return apiPut(`/core/attendance/device/${id}`, updates);
}

export async function getDeviceLogs(deviceId?: string): Promise<ApiResponse<{ logs: any[] }>> {
  return apiGet('/core/attendance/device-logs', deviceId ? { device_id: deviceId } : undefined);
}

// =========================================================================
// DATA IMPORT API
// =========================================================================

export async function importAttendanceRecords(records: { student_roll: string; subject: string; date: string; status: string; method?: string; time_slot?: string }[]): Promise<ApiResponse<{ imported: number; errors: number; error_details: { row: number; error: string }[] }>> {
  return apiPost('/core/import/attendance', { records });
}

export async function importStudentProfiles(records: { name: string; email: string; roll_number: string; department_id?: string; semester?: number; batch_year?: string; dob?: string; gender?: string; phone?: string; guardian_name?: string; guardian_phone?: string; fingerprint_id?: string }[]): Promise<ApiResponse<{ imported: number; errors: number; error_details: { row: number; error: string }[]; imported_students: any[] }>> {
  return apiPost('/core/import/students', { records });
}

