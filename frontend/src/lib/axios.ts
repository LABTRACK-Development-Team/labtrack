  import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { env } from '@/config/env';

const AUTH_TOKEN_KEY = 'jrmsu_labtrack_auth_token';


export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000, // 15-second timeout for telemetry and API calls
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});


apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      if (env.enableDebugLogs) {
        console.error('[Axios Interceptor] Error retrieving auth token:', err);
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);


apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (env.enableDebugLogs) {
        console.warn('[Axios Interceptor] Unauthorized (401). Clearing stored auth tokens...');
      }
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem('jrmsu_labtrack_user_data');
      
      
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) window.location.href = '/login/admin';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;