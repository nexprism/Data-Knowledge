// Centralized API and Asset configuration for Data Knowledge Admin

export const getApiBaseUrl = (): string => {
  const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const raw = env.VITE_BASE_URL || env.VITE_API_BASE_URL || env.VITE_BASE_URL_ADMIN;

  if (raw && typeof raw === 'string' && raw.trim() && !raw.includes('localhost')) {
    return raw.trim().replace(/\/+$/, '');
  }

  // In development mode (npm run dev), use local backend if available
  if (env.DEV && raw) {
    return raw.trim().replace(/\/+$/, '');
  }
  if (env.DEV) {
    return 'http://localhost:5000';
  }

  // In production builds (Vercel, custom domain, static hosting), always default to live API
  return 'https://api.dataknowledge.in';
};

export const getImageBaseUrl = (): string => {
  const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const raw = env.VITE_IMAGE_URL;

  if (raw && typeof raw === 'string' && raw.trim() && !raw.includes('localhost')) {
    return raw.trim().replace(/\/+$/, '');
  }

  if (env.DEV && raw) {
    return raw.trim().replace(/\/+$/, '');
  }
  if (env.DEV) {
    return 'http://localhost:5000';
  }

  return 'https://api.dataknowledge.in';
};

export const API_BASE_URL: string = getApiBaseUrl();
export const IMAGE_BASE_URL: string = getImageBaseUrl();
export default API_BASE_URL;
