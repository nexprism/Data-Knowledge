import { getApiBaseUrl } from './apiConfig.js';

const rawBase = getApiBaseUrl();
const BASE = rawBase.includes('/api/v1') ? rawBase : `${rawBase}`;

/**
 * Safely parse response body without throwing SyntaxError if server returns plain text (e.g. 401 Unauthorized)
 */
export async function parseApiResponse(res) {
  if (!res) return { success: false, message: 'No response received' };
  
  const contentType = res.headers?.get?.('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Invalid JSON response from server' };
    }
  }

  try {
    const text = await res.text();
    return { success: false, message: text || res.statusText || 'Unexpected server response' };
  } catch (e) {
    return { success: false, message: res.statusText || 'Unexpected server response' };
  }
}

export async function authorizedFetch(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const token = localStorage.getItem('edrilla_token') || null;
  const refreshToken = localStorage.getItem('edrilla_refresh') || null;

  const headers = { ...(opts.headers || {}) };
  if (!(opts.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-access-token'] = token;
  }
  if (refreshToken) {
    headers['x-refresh-token'] = refreshToken;
  }

  const fetchOpts = {
    credentials: 'include',
    ...opts,
    headers,
  };

  const res = await fetch(url, fetchOpts);

  // If server returns refreshed tokens in headers, persist them for future calls
  try {
    const newAccess = res.headers.get('x-access-token');
    const newRefresh = res.headers.get('x-refresh-token');
    if (newAccess) localStorage.setItem('edrilla_token', newAccess);
    if (newRefresh) localStorage.setItem('edrilla_refresh', newRefresh);
  } catch (e) { }

  return res;
}

export default authorizedFetch;
