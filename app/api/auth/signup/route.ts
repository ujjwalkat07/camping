import { NextRequest } from 'next/server';
import { setAuthCookies, backendFetch } from '@/lib/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, mobileNumber } = body;

    if (!email || !password || !mobileNumber) {
      return Response.json(
        { success: false, message: 'Email, password, and mobile number are required' },
        { status: 400 }
      );
    }

    // Step 1: Register with the backend
    let registrationSkipped = false;
    try {
      const registerRes = await backendFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, mobileNumber }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok || registerData.success === false) {
        const msg = registerData.message || '';
        // If account already exists, skip registration and proceed to login
        if (
          msg.includes('already exists') ||
          msg.includes('conflicts') ||
          msg.includes('already registered')
        ) {
          registrationSkipped = true;
        } else {
          return Response.json(
            { success: false, message: msg || 'Registration failed' },
            { status: registerRes.status || 400 }
          );
        }
      }
    } catch (regErr: any) {
      const msg = regErr.message || '';
      if (
        msg.includes('already exists') ||
        msg.includes('conflicts') ||
        msg.includes('already registered')
      ) {
        registrationSkipped = true;
      } else {
        throw regErr;
      }
    }

    // Step 2: Login to get tokens
    let loginRes = await backendFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    let loginData = await loginRes.json();

    // Backend returns 409 when there's already an active session.
    // Call backend logout to clear the stale session, then retry login.
    if (loginRes.status === 409) {
      try {
        await backendFetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // Ignore logout errors
      }

      loginRes = await backendFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      loginData = await loginRes.json();
    }

    if (!loginRes.ok || loginData.success === false) {
      return Response.json(
        {
          success: false,
          message: loginData.message || 'Login after registration failed',
        },
        { status: loginRes.status || 401 }
      );
    }

    // Extract tokens and user info
    const token = loginData.token;
    const refreshToken = loginData.refreshToken;
    const userRoles = loginData.roles || [];
    const userId = String(loginData.id);

    const userObj = {
      id: userId,
      name: loginData.email?.split('@')[0] || email.split('@')[0],
      email: loginData.email || email,
      roles: userRoles,
    };

    if (!token) {
      return Response.json(
        { success: false, message: 'No token received from server' },
        { status: 500 }
      );
    }

    // Set httpOnly cookies for tokens, non-httpOnly for user info
    await setAuthCookies(token, refreshToken || '', userObj, 'auth');

    // Tokens are set as cookies by setAuthCookies above.
    // Only return user info in the response body.
    return Response.json({
      success: true,
      user: userObj,
      registrationSkipped,
    });
  } catch (error: any) {
    console.error('Signup API route error:', error);
    return Response.json(
      { success: false, message: error.message || 'Signup failed' },
      { status: 500 }
    );
  }
}
