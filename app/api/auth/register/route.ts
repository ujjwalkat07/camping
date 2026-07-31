import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, mobileNumber, name } = body;

    if (!email || !password) {
      return Response.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const backendRes = await backendFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, mobileNumber, name }),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok || data.success === false) {
      return Response.json(
        { success: false, message: data.message || 'Registration failed' },
        { status: backendRes.status || 400 }
      );
    }

    return Response.json({
      success: true,
      message: data.message || 'Registered successfully',
      ...data
    });
  } catch (error: any) {
    console.error('Register API route error:', error);
    return Response.json(
      { success: false, message: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
