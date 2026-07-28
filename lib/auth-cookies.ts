import { cookies } from 'next/headers';

const BACKEND_URL = 'https://project-camps.onrender.com';

// Cookie expiry constants (in seconds)
export const TOKEN_MAX_AGE = 7 * 24 * 60 * 60;         // 7 days
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export interface CookieConfig {
  name: string;
  value: string;
  httpOnly: boolean;
  maxAge: number;
}

/**
 * Set auth cookies on the response via Next.js cookies() API.
 * All cookies are non-httpOnly so client JS can read them for direct API calls.
 */
export async function setAuthCookies(
  token: string,
  refreshToken: string,
  user: object,
  prefix: 'auth' | 'admin' = 'auth'
) {
  const cookieStore = await cookies();

  // Access token — non-httpOnly so client JS can read it for direct API calls.
  // 7-day cookie lifetime matching the JWT expiry.
  cookieStore.set(`${prefix}_token`, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_MAX_AGE,
  });

  // Refresh token — non-httpOnly, 30 days
  cookieStore.set(`${prefix}_refresh_token`, refreshToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  // User info — NOT httpOnly (client JS needs to read it for UI)
  cookieStore.set(`${prefix}_user`, JSON.stringify(user), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_MAX_AGE,
  });
}

/**
 * Clear all auth cookies by setting maxAge to 0.
 */
export async function clearAuthCookies(prefix: 'auth' | 'admin' = 'auth') {
  const cookieStore = await cookies();

  cookieStore.set(`${prefix}_token`, '', { maxAge: 0, path: '/' });
  cookieStore.set(`${prefix}_refresh_token`, '', { maxAge: 0, path: '/' });
  cookieStore.set(`${prefix}_user`, '', { maxAge: 0, path: '/' });
}

/**
 * Get auth token from cookie (readable both server-side and client-side).
 */
export async function getAuthToken(prefix: 'auth' | 'admin' = 'auth'): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(`${prefix}_token`)?.value || null;
}

/**
 * Get refresh token from cookie (readable both server-side and client-side).
 */
export async function getRefreshToken(prefix: 'auth' | 'admin' = 'auth'): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(`${prefix}_refresh_token`)?.value || null;
}

/**
 * Forward a request to the backend API.
 */
export async function backendFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${BACKEND_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}
