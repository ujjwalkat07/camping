import { cookies } from 'next/headers';
import axios from 'axios';
import { BACKEND_URL } from '@/lib/constants';

// Cookie expiry constants (in seconds)
export const TOKEN_MAX_AGE = 7 * 24 * 60 * 60;         // 7 days
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export interface CookieConfig {
  name: string;
  value: string;
  httpOnly: boolean;
  maxAge: number;
}

export async function setAuthCookies(
  token: string,
  refreshToken: string,
  user: object,
  prefix: 'auth' | 'admin' = 'auth'
) {
  const cookieStore = await cookies();

  cookieStore.set(`${prefix}_token`, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_MAX_AGE,
  });

  cookieStore.set(`${prefix}_refresh_token`, refreshToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  cookieStore.set(`${prefix}_user`, JSON.stringify(user), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function clearAuthCookies(prefix: 'auth' | 'admin' = 'auth') {
  const cookieStore = await cookies();

  cookieStore.set(`${prefix}_token`, '', { maxAge: 0, path: '/' });
  cookieStore.set(`${prefix}_refresh_token`, '', { maxAge: 0, path: '/' });
  cookieStore.set(`${prefix}_user`, '', { maxAge: 0, path: '/' });
}

export async function getAuthToken(prefix: 'auth' | 'admin' = 'auth'): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(`${prefix}_token`)?.value || null;
}

export async function getRefreshToken(prefix: 'auth' | 'admin' = 'auth'): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(`${prefix}_refresh_token`)?.value || null;
}

export async function backendFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${BACKEND_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  try {
    let requestData: any = undefined;
    if (options.body) {
      requestData = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    }

    const res = await axios({
      url,
      method: (options.method || 'GET') as any,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers as any || {}),
      },
      data: requestData,
      validateStatus: () => true,
    });

    return new Response(JSON.stringify(res.data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'Backend request failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
