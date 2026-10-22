// Centralized API configuration for Data Knowledge web client

const isInvalidProdUrl = (url) => {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.includes('onrender.com') ||
    trimmed.includes('localhost') ||
    trimmed.includes('127.0.0.1')
  );
};

export const getApiBaseUrl = () => {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
  const raw = env.VITE_BASE_URL || env.VITE_API_BASE;

  // If running in browser on localhost or 127.0.0.1, prioritize local backend
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    if (raw && !raw.includes('onrender.com')) {
      return raw.trim().replace(/\/+$/, '');
    }
    return 'http://localhost:5000';
  }

  // If explicitly set to a valid production domain (NOT Render, NOT localhost)
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

  // In any production build (Vercel, custom domain, or static hosting), always default to live API
  return 'https://api.dataknowledge.in';
};

export const getImageBaseUrl = () => {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
  const raw = env.VITE_IMAGE_URL || env.VITE_BASE_URL;

  // If running in browser on localhost or 127.0.0.1, prioritize local backend
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    if (raw && !raw.includes('onrender.com')) {
      return raw.trim().replace(/\/+$/, '');
    }
    return 'http://localhost:5000';
  }

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

/**
 * Universal media URL resolver — use this everywhere instead of manual URL building.
 *
 * Handles all these cases safely WITHOUT double-prefixing /uploads/:
 *   - Full HTTP/HTTPS URLs         → returned as-is
 *   - Paths starting /uploads/     → base + path
 *   - Paths starting uploads/      → base + /uploads/...  (no leading slash)
 *   - Bare filenames               → base + /uploads/<subfolder>/<filename>
 *   - null / undefined / ''        → fallback string (default '')
 *
 * @param {string} path       - Raw path or URL from the API response
 * @param {string} subfolder  - Optional uploads subfolder, e.g. 'news', 'courses', 'mentors'
 * @param {string} fallback   - Fallback URL when path is empty
 */
export const getMediaUrl = (path, subfolder = '', fallback = '') => {
  if (!path) return fallback;

  const trimmed = String(path).trim();

  // Already a full URL — pass through
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const base = getImageBaseUrl();

  // Path already has /uploads/ prefix
  if (trimmed.startsWith('/uploads/')) {
    return `${base}${trimmed}`;
  }

  // Path has uploads/ prefix but no leading slash
  if (trimmed.startsWith('uploads/')) {
    return `${base}/${trimmed}`;
  }

  // Bare filename — add subfolder
  const folder = subfolder ? `uploads/${subfolder}/` : 'uploads/';
  const cleanPath = trimmed.replace(/^\/+/, '');
  return `${base}/${folder}${cleanPath}`;
};

export const API_BASE_URL = getApiBaseUrl();
export const IMAGE_BASE_URL = getImageBaseUrl();
export default API_BASE_URL;
