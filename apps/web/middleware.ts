import { type NextRequest, NextResponse } from 'next/server';

import { createMiddlewareClient } from '@kit/supabase/middleware-client';

/**
 * Middleware for subdomain routing and auth session refresh
 *
 * Routes:
 * - app.sparlo.ai/* → App routes (authenticated)
 * - sparlo.ai/* → Marketing routes (public)
 * - sparlo.ai/home/* → Redirect to app.sparlo.ai/* (backwards compat)
 */

const APP_SUBDOMAIN = 'app';
const PRODUCTION_DOMAIN = 'sparlo.ai';

// Whitelist of allowed hosts (security: prevents host header injection)
const ALLOWED_HOSTS = new Set([
  'sparlo.ai',
  'app.sparlo.ai',
  'localhost',
  'localhost:3000',
  '127.0.0.1',
  '127.0.0.1:3000',
]);

// Routes that don't require authentication on app subdomain
const UNPROTECTED_PREFIXES = ['/auth', '/api', '/share'];

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Security: Validate hostname against whitelist
  const isValidHost =
    ALLOWED_HOSTS.has(hostname) ||
    hostname.endsWith('.sparlo.ai') ||
    hostname.includes('localhost');

  if (!isValidHost) {
    console.warn(`[Middleware] Invalid host header: ${hostname}`);
    return new NextResponse('Invalid host', { status: 400 });
  }

  const isAppSubdomain = hostname.startsWith(`${APP_SUBDOMAIN}.`);
  const isProduction = hostname.includes(PRODUCTION_DOMAIN);

  // Redirect /home/* to app subdomain (backwards compatibility)
  if (pathname.startsWith('/home') && isProduction && !isAppSubdomain) {
    const newPath = pathname.replace(/^\/home/, '') || '/';
    const appUrl = new URL(
      newPath,
      `https://${APP_SUBDOMAIN}.${PRODUCTION_DOMAIN}`,
    );
    appUrl.search = request.nextUrl.search;
    return NextResponse.redirect(appUrl, { status: 308 });
  }

  // App subdomain: protect routes that require authentication
  if (isAppSubdomain) {
    const isProtectedRoute = !UNPROTECTED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    );

    if (isProtectedRoute) {
      const response = NextResponse.next({
        request: { headers: request.headers },
      });
      const supabase = createMiddlewareClient(request, response);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const signInUrl = new URL(
          '/auth/sign-in',
          `https://${PRODUCTION_DOMAIN}`,
        );
        // Security: Only pass pathname + search, not full URL (prevents open redirect)
        const safePath = pathname + request.nextUrl.search;
        signInUrl.searchParams.set('next', safePath);
        return NextResponse.redirect(signInUrl);
      }

      return response;
    }
  }

  // Main domain: refresh session for auth routes
  if (
    !isAppSubdomain &&
    (pathname.startsWith('/auth') || pathname.startsWith('/api'))
  ) {
    const response = NextResponse.next({
      request: { headers: request.headers },
    });
    const supabase = createMiddlewareClient(request, response);
    await supabase.auth.getSession();
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - Static assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
