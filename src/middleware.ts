/**
 * AtomQuest — Auth Middleware
 *
 * Intercepts requests to refresh Supabase auth tokens
 * and protect routes based on authentication status and roles.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/callback', '/api/cron/escalation', '/api/auth'];

export async function middleware(request: NextRequest) {
  // 1. Update session and get user
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // 2. Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) => path.startsWith(route));

  // 3. Handle unauthenticated users
  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', path);
    return NextResponse.redirect(redirectUrl);
  }

  // 4. Role-based protection & Auth-Public redirection
  if (user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Middleware profiles query error:', error, 'for user:', user.id);
    }

    const role = profile?.role;
    console.log(`[MIDDLEWARE LOG] Path: ${path}, Role: ${role}, UserID: ${user.id}, Error: ${error ? error.message : 'none'}`);

    // Prevent accessing public routes if logged in (except callback)
    if (path === '/login' || path === '/') {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }

    // Protect role-specific routes
    const isManagerRoute = path.startsWith('/manager');
    const isAdminRoute = path.startsWith('/admin');
    const isEmployeeRoute = path.startsWith('/employee');

    if (isManagerRoute && role !== 'manager' && role !== 'admin') {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
    if (isAdminRoute && role !== 'admin') {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
    if (isEmployeeRoute && !role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, svg, etc (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
