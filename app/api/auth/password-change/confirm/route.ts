import { NextRequest } from 'next/server';
import { backendFetch, getAuthToken } from '@/lib/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { currentPassword, otp, newPassword } = body;

    const authHeader = request.headers.get('authorization');
    const cookieToken = await getAuthToken('auth');
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const backendRes = await backendFetch('/api/auth/password-change/confirm', {
      method: 'POST',
      headers,
      body: JSON.stringify({ currentPassword, otp, newPassword }),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok || data.success === false) {
      return Response.json(
        { success: false, message: data.message || 'Password change failed' },
        { status: backendRes.status || 400 }
      );
    }

    return Response.json({
      success: true,
      message: data.message || 'Password changed successfully',
      ...data
    });
  } catch (error: any) {
    console.error('Password change confirm route error:', error);
    return Response.json(
      { success: false, message: error.message || 'Password change failed' },
      { status: 500 }
    );
  }
}
