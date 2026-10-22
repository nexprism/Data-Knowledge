import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
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
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

    // If data is FormData, remove Content-Type so browser/axios sets multipart boundary automatically
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    // Only attach real JWTs — skip the sentinel used for cookie-based sessions
    if (token && token !== 'cookie-session' && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['x-access-token'] = token;

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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Capture refreshed tokens from response headers if present
    const newAccess = response.headers?.['x-access-token'];
    const newRefresh = response.headers?.['x-refresh-token'];
    if (newAccess) {
      localStorage.setItem('token', newAccess);
      localStorage.setItem('accessToken', newAccess);
    }
    if (newRefresh) {
      localStorage.setItem('refreshToken', newRefresh);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response && error.response.status === 401 && originalRequest && !originalRequest._retry) {
      const isAuthUrl =
        originalRequest.url?.includes('/login') ||
        originalRequest.url?.includes('/refresh-token');

      const refreshToken = localStorage.getItem('refreshToken');

      if (!isAuthUrl && refreshToken) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (token && originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                originalRequest.headers['x-access-token'] = token as string;
              }
              return axiosInstance(originalRequest);
            })
            .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await axios.post(
            `${API_BASE_URL}/refresh-token`,
            { refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
                'x-refresh-token': refreshToken,
              },
              withCredentials: true,
            }
          );

          const newAccess = res.data?.data?.accessToken || res.headers?.['x-access-token'];
          const newRefresh = res.data?.data?.refreshToken || res.headers?.['x-refresh-token'];

          if (newAccess) {
            localStorage.setItem('token', newAccess);
            localStorage.setItem('accessToken', newAccess);
          }
          if (newRefresh) {
            localStorage.setItem('refreshToken', newRefresh);
          }

          if (originalRequest.headers && newAccess) {
            originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
            originalRequest.headers['x-access-token'] = newAccess;
          }

          processQueue(null, newAccess);
          isRefreshing = false;
          return axiosInstance(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          isRefreshing = false;

          const isMeEndpoint = originalRequest.url?.endsWith('/me');
          if (!isMeEndpoint) {
            localStorage.removeItem('token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          }
          return Promise.reject(refreshErr);
        }
      }
    }

    if (error.response && error.response.status === 401) {
      const isMeEndpoint = error.config?.url?.endsWith('/me');
      if (!isMeEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
