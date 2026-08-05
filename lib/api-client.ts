import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { BACKEND_URL } from '@/lib/constants';
import { isAdminUser } from '@/lib/utils';

export interface ApiOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  token?: string;
  _retry?: boolean;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
  [key: string]: any;
}

// Cookie Helper Utilities
export function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0]?.trim() === name ? decodeURIComponent(parts.slice(1).join('=')) : r;
  }, null as string | null);
}

export function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export const tokenStorage = {
  getToken: (): string | null => {
    return (
      getCookie('auth_token') ||
      getCookie('admin_token') ||
      getCookie('accessToken') ||
      getCookie('token') ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') || localStorage.getItem('accessToken')
        : null)
    );
  },
  setToken: (token: string) => {
    setCookie('auth_token', token, 7);
    setCookie('admin_token', token, 7);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('accessToken', token);
    }
  },
  getRefreshToken: (): string | null => {
    return (
      getCookie('auth_refresh_token') ||
      getCookie('admin_refresh_token') ||
      getCookie('refreshToken') ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('auth_refresh_token') || localStorage.getItem('refreshToken')
        : null)
    );
  },
  setRefreshToken: (token: string) => {
    setCookie('auth_refresh_token', token, 30);
    setCookie('admin_refresh_token', token, 30);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_refresh_token', token);
      localStorage.setItem('refreshToken', token);
    }
  },
  saveBookingId: (bookingId: string) => {
    if (!bookingId) return;
    const existing = getCookie('user_booking_ids');
    let ids: string[] = [];
    if (existing) {
      try { ids = JSON.parse(existing); } catch { }
    }
    if (!ids.includes(bookingId)) {
      ids.unshift(bookingId);
      setCookie('user_booking_ids', JSON.stringify(ids), 30);
    }
  },
  getBookingIds: (): string[] => {
    const existing = getCookie('user_booking_ids');
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed)) return parsed;
      } catch { }
    }
    return [];
  },
  getUser: (): any | null => {
    const cookieUser = getCookie('auth_user');
    if (cookieUser) {
      try { return JSON.parse(cookieUser); } catch { /* fall through */ }
    }
    return null;
  },
  setUser: (user: any) => {
    setCookie('auth_user', JSON.stringify(user), 7);
    setCookie('admin_user', JSON.stringify(user), 7);
  },
  clearAuth: async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
    } catch {
      // Best effort
    }
    deleteCookie('auth_token');
    deleteCookie('auth_refresh_token');
    deleteCookie('auth_user');
    deleteCookie('admin_token');
    deleteCookie('admin_refresh_token');
    deleteCookie('admin_user');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }
};

export const adminStorage = {
  getAdminToken: (): string | null => {
    return getCookie('admin_token') || tokenStorage.getToken();
  },
  setAdminToken: (token: string) => {
    tokenStorage.setToken(token);
  },
  getAdminRefreshToken: (): string | null => {
    return getCookie('admin_refresh_token') || tokenStorage.getRefreshToken();
  },
  setAdminRefreshToken: (token: string) => {
    tokenStorage.setRefreshToken(token);
  },
  getAdminUser: (): any | null => {
    const adminStr = getCookie('admin_user');
    if (adminStr) {
      try {
        const parsed = JSON.parse(adminStr);
        if (isAdminUser(parsed)) return parsed;
      } catch { }
    }
    const user = tokenStorage.getUser();
    if (user && isAdminUser(user)) {
      return user;
    }
    return null;
  },
  setAdminUser: (user: any) => {
    tokenStorage.setUser(user);
  },
  clearAdminAuth: async () => {
    await tokenStorage.clearAuth();
  }
};

// Create Axios Instance connected directly to backend URL
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Axios Request Interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getToken() || adminStorage.getAdminToken();
    if (token && !config.headers.Authorization) {
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = formattedToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Axios Response Interceptor for automatic token refresh (handling 401 and 400 status codes)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 400) &&
      !originalRequest._retry &&
      !requestUrl.includes('/api/auth/refreshtoken') &&
      !requestUrl.includes('/api/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = newToken.startsWith('Bearer ') ? newToken : `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();
      let newAccessToken: string | null = null;
      let newRefreshToken: string | null = null;

      try {
        const refreshRes = await axiosInstance.post('/api/auth/refreshtoken', {
          refreshToken: refreshToken || '',
        });
        const data = refreshRes.data;
        newAccessToken = data?.accessToken || data?.token;
        newRefreshToken = data?.refreshToken || refreshToken;
      } catch (refreshErr) {
        console.error('Refresh token request failed:', refreshErr);
      }

      if (newAccessToken) {
        // Save BOTH access token and refresh token in client-side cookies and storage
        tokenStorage.setToken(newAccessToken);
        if (newRefreshToken) {
          tokenStorage.setRefreshToken(newRefreshToken);
        }

        processQueue(null, newAccessToken);
        isRefreshing = false;

        const formattedToken = newAccessToken.startsWith('Bearer ') ? newAccessToken : `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = formattedToken;
        return axiosInstance(originalRequest);
      } else {
        // Refresh token is expired or invalid — clear invalid cookies to stop 401 loops
        await tokenStorage.clearAuth();
        const refreshError = new Error('Session expired. Please log in again.');
        processQueue(refreshError, null);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'API Request Failed';
    return Promise.reject(new Error(message));
  }
);

// Wrapper API client functions keeping compatibility with codebase
export async function apiClient<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { requiresAuth, requiresAdmin, token: explicitToken, headers: customHeaders, body, method = 'GET', ...rest } = options;

  let path = endpoint;
  if (path.startsWith(BACKEND_URL)) {
    path = path.substring(BACKEND_URL.length);
  }
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  const requestHeaders: Record<string, string> = { ...(customHeaders as Record<string, string>) };
  if (explicitToken) {
    requestHeaders['Authorization'] = explicitToken.startsWith('Bearer ') ? explicitToken : `Bearer ${explicitToken}`;
  }

  let data = body;
  if (typeof body === 'string') {
    try {
      data = JSON.parse(body);
    } catch {
      data = body;
    }
  }

  const config: AxiosRequestConfig = {
    url: path,
    method: method as any,
    headers: requestHeaders,
    data,
    ...rest,
  };

  const response = await axiosInstance(config);
  return response.data as T;
}

export async function apiFormClient<T = any>(
  endpoint: string,
  formData: FormData,
  requiresAuth = true,
  customToken?: string
): Promise<T> {
  let path = endpoint;
  if (path.startsWith(BACKEND_URL)) {
    path = path.substring(BACKEND_URL.length);
  }
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  const headers: Record<string, string> = {};

  const token = customToken || tokenStorage.getToken();
  if (requiresAuth && token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const response = await axiosInstance.post(path, formData, {
    headers: {
      ...headers,
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data as T;
}
