const BASE_URL = 'https://project-camps.onrender.com';

export interface ApiOptions extends RequestInit {
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  token?: string;
  _retry?: boolean;
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

export function setStatusOverride(bookingId: string, status: string) {
  if (typeof document === 'undefined') return;
  const existing = getCookie('status_overrides');
  let overrides: Record<string, string> = {};
  if (existing) {
    try { overrides = JSON.parse(existing); } catch {}
  }
  overrides[bookingId] = status;
  setCookie('status_overrides', JSON.stringify(overrides), 30);
}

export function getStatusOverride(bookingId: string): string | null {
  const existing = getCookie('status_overrides');
  if (existing) {
    try {
      const overrides = JSON.parse(existing);
      return overrides[bookingId] || null;
    } catch {}
  }
  return null;
}

export const tokenStorage = {
  getToken: (): string | null => {
    return getCookie('auth_token') || getCookie('accessToken') || getCookie('access_token');
  },
  setToken: (token: string) => {
    setCookie('auth_token', token, 7);
  },
  getRefreshToken: (): string | null => {
    return getCookie('auth_refresh_token');
  },
  setRefreshToken: (token: string) => {
    setCookie('auth_refresh_token', token, 30);
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
  },
  clearAuth: async () => {
    // Call the Next.js logout API route to clear cookies server-side
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Best effort — still clean up client-side below
    }
    // Delete on client side for immediate UI update
    deleteCookie('auth_token');
    deleteCookie('auth_refresh_token');
    deleteCookie('auth_user');
    deleteCookie('currentUser');
  }
};

export const adminStorage = {
  getAdminToken: (): string | null => {
    return getCookie('admin_token') || tokenStorage.getToken();
  },
  setAdminToken: (_token: string) => {
    // Set server-side via Next.js API routes.
  },
  getAdminRefreshToken: (): string | null => {
    return getCookie('admin_refresh_token') || tokenStorage.getRefreshToken();
  },
  setAdminRefreshToken: (_token: string) => {
    // Set server-side via Next.js API routes.
  },
  getAdminUser: (): any | null => {
    const checkIsAdmin = (u: any) => {
      if (!u) return false;
      const roles = Array.isArray(u.roles) ? u.roles : [];
      const roleStr = typeof u.role === 'string' ? u.role.toUpperCase() : '';
      return (
        roles.includes('ROLE_ADMIN') ||
        roles.includes('admin') ||
        roles.includes('ADMIN') ||
        roleStr === 'ADMIN' ||
        roleStr === 'ROLE_ADMIN'
      );
    };

    const adminStr = getCookie('admin_user');
    if (adminStr) {
      try {
        const parsed = JSON.parse(adminStr);
        if (checkIsAdmin(parsed)) return parsed;
      } catch {
        /* fall through */
      }
    }

    const user = tokenStorage.getUser();
    if (user && checkIsAdmin(user)) {
      return user;
    }
    return null;
  },
  setAdminUser: (user: any) => {
    setCookie('admin_user', JSON.stringify(user), 7);
  },
  clearAdminAuth: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Best effort
    }
    deleteCookie('admin_token');
    deleteCookie('admin_refresh_token');
    deleteCookie('admin_user');
  }
};

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export async function apiClient<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { requiresAuth = false, requiresAdmin = false, token: explicitToken, headers: customHeaders, ...restOptions } = options;

  let token: string | null = explicitToken || null;
  if (!token) {
    if (requiresAdmin) {
      token = adminStorage.getAdminToken();
    } else if (requiresAuth) {
      token = tokenStorage.getToken() || adminStorage.getAdminToken();
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    headers['Authorization'] = formattedToken;
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
    });

    if (response.status === 401 && (requiresAuth || requiresAdmin) && !options._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(newToken => {
          return apiClient<T>(endpoint, {
            ...options,
            headers: {
              ...headers,
              Authorization: newToken.startsWith('Bearer ') ? newToken : `Bearer ${newToken}`,
            },
          });
        });
      }

      options._retry = true;
      isRefreshing = true;

      const refreshToken = requiresAdmin
        ? adminStorage.getAdminRefreshToken()
        : (tokenStorage.getRefreshToken() || adminStorage.getAdminRefreshToken());

      if (!refreshToken) {
        // Don't clear cookies here — the httpOnly tokens may still be valid
        // but are simply not readable from client-side JS. Clearing them would
        // destroy a valid server-side session. Let the caller handle the error.
        throw new Error('Session expired. Please log in again.');
      }

      try {
        const refreshResponse = await fetch(`${BASE_URL}/api/auth/refreshtoken`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!refreshResponse.ok) {
          throw new Error('Failed to refresh token');
        }

        const refreshData = await refreshResponse.json();
        const newAccessToken = refreshData.accessToken || refreshData.token;
        const newRefreshToken = refreshData.refreshToken || refreshToken;

        if (requiresAdmin) {
          setCookie('admin_token', newAccessToken, 7);
          if (newRefreshToken) setCookie('admin_refresh_token', newRefreshToken, 30);
        } else {
          tokenStorage.setToken(newAccessToken);
          if (newRefreshToken) tokenStorage.setRefreshToken(newRefreshToken);
        }

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return apiClient<T>(endpoint, {
          ...options,
          headers: {
            ...headers,
            Authorization: newAccessToken.startsWith('Bearer ') ? newAccessToken : `Bearer ${newAccessToken}`,
          },
        });
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        // Don't clear auth on refresh failure — let the caller handle it.
        // Clearing here would destroy the session prematurely.
        throw new Error('Session expired. Please log in again.');
      }
    }

    const text = await response.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = text;
    }

    if (!response.ok || (data && typeof data === 'object' && data.success === false)) {
      const errorMessage = data?.message || data?.error || response.statusText || 'API Request Failed';
      throw new Error(errorMessage);
    }

    return data as T;
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export async function apiFormClient<T = any>(endpoint: string, formData: FormData, requiresAuth = true, customToken?: string): Promise<T> {
  const token = customToken || adminStorage.getAdminToken() || tokenStorage.getToken();
  const headers: Record<string, string> = {};

  if (requiresAuth && token) {
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    headers['Authorization'] = formattedToken;
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  const text = await response.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || response.statusText || 'Upload failed';
    throw new Error(errorMessage);
  }

  return data as T;
}
