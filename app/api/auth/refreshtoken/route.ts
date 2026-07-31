import { NextRequest } from 'next/server';
import { backendFetch, getRefreshToken, setAuthCookies } from '@/lib/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    let refreshToken = body?.refreshToken || body?.refresh_token;

    if (!refreshToken) {
      refreshToken = (await getRefreshToken('auth')) || (await getRefreshToken('admin'));
    }

    if (!refreshToken) {
      return Response.json(
        { success: false, message: 'Refresh token is required' },
        { status: 400 }
      );
    }

    const backendRes = await backendFetch('/api/auth/refreshtoken', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok || data.success === false) {
      return Response.json(
        { success: false, message: data.message || 'Token refresh failed' },
        { status: backendRes.status || 401 }
      );
    }

    const newToken = data.token || data.accessToken;
    const newRefreshToken = data.refreshToken || refreshToken;

    if (newToken) {
      const userObj = {
        id: String(data.id || ''),
        name: data.email?.split('@')[0] || '',
        email: data.email || '',
        roles: data.roles || []
      };
      await setAuthCookies(newToken, newRefreshToken, userObj, 'auth');
    }

    return Response.json({
      success: true,
      token: newToken,
      accessToken: newToken,
      refreshToken: newRefreshToken,
      ...data
    });
  } catch (error: any) {
    console.error('Refresh token API route error:', error);
    return Response.json(
      { success: false, message: error.message || 'Token refresh failed' },
      { status: 500 }
    );
  }
}
