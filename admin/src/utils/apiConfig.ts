// Centralized API and Asset configuration for Data Knowledge Admin

const isInvalidProdUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.includes('onrender.com') ||
    trimmed.includes('localhost') ||
    trimmed.includes('127.0.0.1')
  );
};

export const getApiBaseUrl = (): string => {
  const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const raw = env.VITE_BASE_URL || env.VITE_API_BASE_URL || env.VITE_BASE_URL_ADMIN;

  if (raw && !isInvalidProdUrl(raw)) {
    return raw.trim().replace(/\/+$/, '');
  }

  // In development mode (npm run dev), use local backend if available
  if (env.DEV && raw && !raw.includes('onrender.com')) {
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
  const raw = env.VITE_IMAGE_URL || env.VITE_BASE_URL;

  if (raw && !isInvalidProdUrl(raw)) {
    return raw.trim().replace(/\/+$/, '');
  }

  if (env.DEV && raw && !raw.includes('onrender.com')) {
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
