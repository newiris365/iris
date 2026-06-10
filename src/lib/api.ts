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

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function handleAuthError(status: number): void {
  if ((status === 401 || status === 403) && typeof window !== 'undefined') {
    localStorage.removeItem('iris_jwt_token');
    localStorage.removeItem('iris_user_profile');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
}

export async function apiGet<T = any>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
  const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    handleAuthError(response.status);
  }

  return response.json();
}

export async function apiPost<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    handleAuthError(response.status);
  }

  return response.json();
}

export async function apiPut<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    handleAuthError(response.status);
  }

  return response.json();
}

export async function apiDelete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    handleAuthError(response.status);
  }

  return response.json();
}

/**
 * Fetch a binary blob (e.g. PDF report download)
 */
export async function apiFetchBlob(endpoint: string, body?: any): Promise<Blob> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: body ? 'POST' : 'GET',
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    handleAuthError(response.status);
    throw new Error('Failed to download file');
  }

  return response.blob();
}
