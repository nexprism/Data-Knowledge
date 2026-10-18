// Centralized API configuration for Data Knowledge web client

export const getApiBaseUrl = () => {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
  const raw = env.VITE_BASE_URL || env.VITE_API_BASE;
  
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
  
  // In any production build (Vercel, custom domain, or static hosting), always default to live API
  return 'https://api.dataknowledge.in';
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;
