import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor — attaches the JWT from localStorage to every request
axiosInstance.interceptors.request.use(
  (config: import('axios').InternalAxiosRequestConfig): import('axios').InternalAxiosRequestConfig => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

    // If data is FormData, remove Content-Type so browser/axios sets multipart boundary automatically
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    // Only attach real JWTs — skip the sentinel used for cookie-based sessions
    if (token && token !== 'cookie-session' && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        config.headers['x-refresh-token'] = refreshToken;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-clear storage if the failing endpoint is /me
      // The checkAuthStatus thunk handles its own cleanup and fallbacks
      const isMeEndpoint = error.config?.url?.endsWith('/me');

      if (!isMeEndpoint) {
        // Clear ALL auth data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('role');

        // Fire a custom event so the Redux store can also clear its state.
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
