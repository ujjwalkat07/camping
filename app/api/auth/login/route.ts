import { NextRequest } from 'next/server';
import { setAuthCookies, backendFetch, getAuthToken, getRefreshToken } from '@/lib/auth-cookies';

const BACKEND_URL = 'https://project-camps.onrender.com';

/**
 * Attempt to clear any existing backend session by:
 * 1. Using the httpOnly auth_token cookie (if available) to call backend logout
 * 2. If no token, trying to refresh using the stored refresh token, then logout
 */
async function clearExistingSession() {
  // Try 1: Use stored access token to logout
  const existingToken = await getAuthToken('auth');
  if (existingToken) {
    try {
      const res = await backendFetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${existingToken}`,
        },
      });
      if (res.status === 204 || res.ok) return true;
    } catch {
      // Continue to next attempt
    }
  }

  // Try 2: Use stored refresh token to get a new access token, then logout
  const storedRefreshToken = await getRefreshToken('auth');
  if (storedRefreshToken) {
    try {
      const refreshRes = await fetch(`${BACKEND_URL}/api/auth/refreshtoken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newToken = refreshData.accessToken || refreshData.token;
        if (newToken) {
          await backendFetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${newToken}`,
            },
          });
          return true;
        }
      }
    } catch {
      // Continue — best effort
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Forward login request to the backend
    let backendRes = await backendFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    let data = await backendRes.json();

    // Backend returns 409 when there's already an active session for this user.
    // Try to clear the old session and retry login.
    if (backendRes.status === 409) {
      await clearExistingSession();

      // Retry login after clearing the old session
      backendRes = await backendFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      data = await backendRes.json();

      // If still 409, the old session couldn't be cleared (lost token).
      // Return a helpful error message.
      if (backendRes.status === 409) {
        return Response.json(
          {
            success: false,
            message:
              'There is an active session for this account that could not be cleared. ' +
              'The session will expire automatically. Please try again later, or contact support.',
          },
          { status: 409 }
        );
      }
    }

    if (!backendRes.ok || data.success === false) {
      return Response.json(
        { success: false, message: data.message || 'Invalid email or password' },
        { status: backendRes.status || 401 }
      );
    }

    // Extract tokens and user info from backend response
    const token = data.token;
    const refreshToken = data.refreshToken;
    const userRoles = data.roles || [];
    const userId = String(data.id);

    const userObj = {
      id: userId,
      name: data.email?.split('@')[0] || email.split('@')[0],
      email: data.email || email,
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
    });
  } catch (error: any) {
    console.error('Login API route error:', error);
    return Response.json(
      { success: false, message: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
