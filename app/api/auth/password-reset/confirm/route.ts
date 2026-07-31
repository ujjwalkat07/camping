import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return Response.json(
        { success: false, message: 'Email, OTP, and new password are required' },
        { status: 400 }
      );
    }

    const backendRes = await backendFetch('/api/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok || data.success === false) {
      return Response.json(
        { success: false, message: data.message || 'Password reset failed' },
        { status: backendRes.status || 400 }
      );
    }

    return Response.json({
      success: true,
      message: data.message || 'Password has been reset successfully',
      ...data
    });
  } catch (error: any) {
    console.error('Password reset confirm route error:', error);
    return Response.json(
      { success: false, message: error.message || 'Password reset failed' },
      { status: 500 }
    );
  }
}
