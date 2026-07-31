import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email) {
      return Response.json(
        { success: false, message: 'Email address is required' },
        { status: 400 }
      );
    }

    const backendRes = await backendFetch('/api/auth/password-reset/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok || data.success === false) {
      return Response.json(
        { success: false, message: data.message || 'Failed to request password reset OTP' },
        { status: backendRes.status || 400 }
      );
    }

    return Response.json({
      success: true,
      message: data.message || 'Password reset OTP sent to your email address',
      ...data
    });
  } catch (error: any) {
    console.error('Password reset request-otp route error:', error);
    return Response.json(
      { success: false, message: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
