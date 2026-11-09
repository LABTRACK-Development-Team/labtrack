import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://" + window.location.hostname + ":5000";
const FULL_API_BASE_URL = `${API_BASE_URL}/api/v1`;

export const apiClient = axios.create({
  baseURL: FULL_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('labtrack_access_token');
    if (token && config.headers) {
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

    if (error.response?.status === 401 && !originalRequest._retry && !(originalRequest?.url || '').includes('/auth/')) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('labtrack_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const res = await axios.post<AuthResponse>(`${FULL_API_BASE_URL}/auth/refresh-token`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data;

        localStorage.setItem('labtrack_access_token', accessToken);
        localStorage.setItem('labtrack_refresh_token', newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        localStorage.removeItem('labtrack_access_token');
        localStorage.removeItem('labtrack_refresh_token');
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) window.location.href = '/login/admin';
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);