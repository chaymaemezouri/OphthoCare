import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { getSession } from 'next-auth/react';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

async function readAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const fromStorage = sessionStorage.getItem('access_token');
  if (fromStorage) return fromStorage;
  const session = await getSession();
  return session?.accessToken ?? null;
}

async function readRefreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const fromStorage = sessionStorage.getItem('refresh_token');
  if (fromStorage) return fromStorage;
  const session = await getSession();
  return session?.refreshToken ?? null;
}

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    const token = await readAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await readRefreshToken();

        if (refreshToken) {
          const response = await apiClient.post('/auth/refresh', { refreshToken });
          const { access_token } = response.data as { access_token: string };

          if (typeof window !== 'undefined') {
            sessionStorage.setItem('access_token', access_token);
          }

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/unauthorized')) {
        window.location.href = '/unauthorized';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
