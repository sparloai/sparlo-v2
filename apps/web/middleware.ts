import { type NextRequest, NextResponse } from 'next/server';

/**
 * Middleware for security headers
 * P2 Security: Content Security Policy and other security headers
 */
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  addSecurityHeaders(response);

  return response;
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse) {
  // Content Security Policy
  // Note: 'unsafe-inline' and 'unsafe-eval' are needed for Next.js and some libraries
  // In production, consider using nonces for stricter CSP
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.anthropic.com wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy - restrict access to sensitive APIs
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()',
  );
}

export const config = {
  /*
   * Match all paths except for:
   * 1. /api routes
   * 2. /_next (Next.js internals)
   * 3. Static files
   */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
