import { getApiBaseUrl } from './apiConfig.js';

const rawBase = getApiBaseUrl();
const BASE = rawBase.includes('/api/v1') ? rawBase : `${rawBase}`;

export async function authorizedFetch(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const token = localStorage.getItem('edrilla_token') || null;

  // Only set Content-Type to json if body is NOT FormData
  const headers = { ...(opts.headers || {}) };
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-access-token'] = token;
  }

  const res = await fetch(url, { ...opts, headers });

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
