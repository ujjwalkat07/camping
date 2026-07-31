import { NextRequest } from 'next/server';
import { backendFetch, getAuthToken } from '@/lib/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieToken = await getAuthToken('auth');
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const backendRes = await backendFetch('/api/auth/password-change/request-otp', {
      method: 'POST',
      headers,
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok || data.success === false) {
      return Response.json(
        { success: false, message: data.message || 'Failed to request password change OTP' },
        { status: backendRes.status || 400 }
      );
    }

    return Response.json({
      success: true,
      message: data.message || 'Password change OTP sent to your registered email',
      ...data
    });
  } catch (error: any) {
    console.error('Password change request-otp route error:', error);
    return Response.json(
      { success: false, message: error.message || 'Failed to request OTP' },
      { status: 500 }
    );
  }
}
