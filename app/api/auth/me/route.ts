import { cookies } from 'next/headers';
import { setAuthCookies } from '@/lib/auth-cookies';

/**
 * GET /api/auth/me
 * 
 * Checks if the user is authenticated by reading the auth cookies server-side.
 * Also re-sets all cookies with the current cookie settings (non-httpOnly)
 * to ensure client-side JS can read them. This handles migration from
 * old httpOnly cookies to the new non-httpOnly format.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get('auth_token')?.value;
    const refreshToken = cookieStore.get('auth_refresh_token')?.value;
    const userCookie = cookieStore.get('auth_user')?.value;

    if (!token) {
      return Response.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!userCookie) {
      return Response.json(
        { success: false, message: 'User data not found' },
        { status: 401 }
      );
    }

    let user: any;
    try {
      user = JSON.parse(userCookie);
    } catch {
      return Response.json(
        { success: false, message: 'Invalid user data' },
        { status: 500 }
      );
    }

    // Re-set all cookies with current settings (non-httpOnly, correct expiry).
    // This migrates any old httpOnly cookies so client JS can read them.
    await setAuthCookies(token, refreshToken || '', user, 'auth');

    return Response.json({ success: true, user });
  } catch (error: any) {
    console.error('Auth me API route error:', error);
    return Response.json(
      { success: false, message: error.message || 'Failed to check auth' },
      { status: 500 }
    );
  }
}
