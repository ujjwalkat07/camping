import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminUser } from '@/lib/utils';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read auth cookies
  const authUserCookie = request.cookies.get('auth_user')?.value;
  const adminUserCookie = request.cookies.get('admin_user')?.value;
  const authToken = request.cookies.get('auth_token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;
  const authRefreshToken = request.cookies.get('auth_refresh_token')?.value || request.cookies.get('refreshToken')?.value;
  const adminRefreshToken = request.cookies.get('admin_refresh_token')?.value;

  let authUser: any = null;
  let adminUser: any = null;

  if (authUserCookie) {
    try {
      authUser = JSON.parse(authUserCookie);
    } catch { }
  }

  if (adminUserCookie) {
    try {
      adminUser = JSON.parse(adminUserCookie);
    } catch { }
  }

  const currentUser = adminUser || authUser;
  // Consider user authenticated if either access token OR refresh token exists
  const hasToken = !!(authToken || adminToken || authRefreshToken || adminRefreshToken);

  const isAdmin = isAdminUser(currentUser);

  // 1. Protect Admin Dashboard Routes (/admin, excluding /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!hasToken && !currentUser) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (currentUser && !isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 2. Protect User Dashboard Routes (/dashboard)
  if (pathname.startsWith('/dashboard')) {
    if (!hasToken && !currentUser) {
      return NextResponse.redirect(new URL('/login?redirect=/dashboard', request.url));
    }
    if (currentUser && isAdmin) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
