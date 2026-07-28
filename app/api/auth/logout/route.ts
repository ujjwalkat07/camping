import { clearAuthCookies, getAuthToken, backendFetch } from '@/lib/auth-cookies';

export async function POST() {
  try {
    // Try to call backend logout with the current token
    const token = await getAuthToken('auth');

    if (token) {
      try {
        await backendFetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Ignore backend logout errors — we still clear cookies
      }
    }

    // Clear all auth cookies
    await clearAuthCookies('auth');

    // Also clear admin cookies if present
    await clearAuthCookies('admin');

    return Response.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout API route error:', error);

    // Even on error, try to clear cookies
    try {
      await clearAuthCookies('auth');
      await clearAuthCookies('admin');
    } catch {
      // Best effort
    }

    return Response.json({ success: true, message: 'Logged out' });
  }
}
