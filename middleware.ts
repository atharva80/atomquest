/**
 * AtomQuest — Auth Middleware
 *
 * Intercepts requests to refresh Supabase auth tokens
 * and protect routes based on authentication status and roles.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/callback',
  '/api/cron/escalation',
  '/api/cron/checkin-reminders',
  '/api/auth/azure',
  '/api/dev/test-emails',
];

export async function middleware(request: NextRequest) {
  // 1. Update session and get user (suppress noisy refresh_token_not_found in console)
  let supabaseResponse: NextResponse;
  let user: any;
  try {
    const result = await updateSession(request);
    supabaseResponse = result.supabaseResponse;
    user = result.user;
  } catch (e: any) {
    // Stale/expired refresh token cookie — treat as unauthenticated
    supabaseResponse = NextResponse.next();
    user = null;
  }
  const path = request.nextUrl.pathname;

  // 2. Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) => path.startsWith(route));

  // 3. Handle unauthenticated users
  if (!user && !isPublicRoute) {
    // If they try to access a protected route without being logged in, send to login
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    // Optionally preserve the original URL they tried to visit as a 'next' param
    redirectUrl.searchParams.set('next', path);
    return NextResponse.redirect(redirectUrl);
  }

  // 4. Handle authenticated users on public routes (like /login)
  if (user && path === '/login') {
    // We have the user, but to route them correctly based on role
    // we would ideally need their profile. Since middleware edge runtime 
    // shouldn't do heavy DB queries, we redirect to a root handler (/) 
    // that fetches the profile and handles the role-based redirect, 
    // OR we can read the role from the JWT metadata if we injected it.
    
    // For now, let's redirect them to the root page, which will act as the traffic cop
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  // Return the modified response (contains refreshed cookies)
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
