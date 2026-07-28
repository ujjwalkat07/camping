import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read auth cookies
  const authUserCookie = request.cookies.get('auth_user')?.value;
  const adminUserCookie = request.cookies.get('admin_user')?.value;
  const authToken = request.cookies.get('auth_token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;

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
  const hasToken = !!(authToken || adminToken);

  const checkIsAdmin = (u: any) => {
    if (!u) return false;
    const roles = Array.isArray(u.roles) ? u.roles : [];
    const roleStr = typeof u.role === 'string' ? u.role.toUpperCase() : '';
    return (
      roles.includes('ROLE_ADMIN') ||
      roles.includes('admin') ||
      roles.includes('ADMIN') ||
      roleStr === 'ADMIN' ||
      roleStr === 'ROLE_ADMIN'
    );
  };

  const isAdmin = checkIsAdmin(currentUser);

  // 1. Protect Admin Dashboard Routes (/admin, excluding /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!hasToken || !currentUser) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (!isAdmin) {
      // User with ROLE_USER trying to access admin dashboard -> redirect to user dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 2. Protect User Dashboard Routes (/dashboard)
  if (pathname.startsWith('/dashboard')) {
    if (!hasToken || !currentUser) {
      return NextResponse.redirect(new URL('/login?redirect=/dashboard', request.url));
    }
    if (isAdmin) {
      // Admin trying to access user dashboard -> redirect to admin dashboard
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
