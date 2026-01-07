import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { CsrfError, createCsrfProtect } from '@edge-csrf/nextjs';

import { isSuperAdmin } from '@kit/admin';
import { getSafeRedirectPath } from '@kit/shared/utils';
import { createMiddlewareClient } from '@kit/supabase/middleware-client';

import appConfig from '~/config/app.config';
import pathsConfig from '~/config/paths.config';

const CSRF_SECRET_COOKIE = 'csrfSecret';
const NEXT_ACTION_HEADER = 'next-action';

export const config = {
  matcher: ['/((?!_next/static|_next/image|images|locales|assets|api/*).*)'],
};

/**
 * Auth cookie names that should be cleared when token refresh fails.
 * Supabase uses chunked cookies for large tokens (sb-*-auth-token and sb-*-auth-token.0, .1, etc.)
 */
const AUTH_COOKIE_PATTERNS = [
  'sb-', // Matches all Supabase cookies
];

/**
 * Clear all auth cookies from the response.
 * This forces a clean re-authentication flow.
 */
function clearAuthCookies(request: NextRequest, response: NextResponse) {
  const allCookies = request.cookies.getAll();
  const isProduction = process.env.NODE_ENV === 'production';

  for (const cookie of allCookies) {
    const isAuthCookie = AUTH_COOKIE_PATTERNS.some((pattern) =>
      cookie.name.startsWith(pattern),
    );

    if (isAuthCookie) {
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
        ...(isProduction && { secure: true }),
        sameSite: 'lax',
        httpOnly: true,
      });
    }
  }
}

const getUser = async (request: NextRequest, response: NextResponse) => {
  const supabase = createMiddlewareClient(request, response);

  try {
    const result = await supabase.auth.getClaims();

    // Handle returned errors (not thrown)
    if (result.error) {
      const errorCode = (result.error as { code?: string })?.code;
      if (
        errorCode === 'refresh_token_already_used' ||
        errorCode === 'invalid_refresh_token'
      ) {
        console.warn(
          '[Middleware] Stale refresh token detected, clearing cookies',
        );
        clearAuthCookies(request, response);
        return { data: { claims: null }, error: null };
      }
    }

    return result;
  } catch (error) {
    // Handle thrown errors
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error.code === 'refresh_token_already_used' ||
        error.code === 'invalid_refresh_token')
    ) {
      console.warn(
        '[Middleware] Stale refresh token detected (thrown), clearing cookies',
      );
      clearAuthCookies(request, response);
      return { data: { claims: null }, error: null };
    }

    // Re-throw other errors
    throw error;
  }
};

export async function proxy(request: NextRequest) {
  const secureHeaders = await createResponseWithSecureHeaders();
  const response = NextResponse.next(secureHeaders);

  // set a unique request ID for each request
  // this helps us log and trace requests
  setRequestId(request);

  // apply CSRF protection for mutating requests
  const csrfResponse = await withCsrfMiddleware(request, response);

  // handle patterns for specific routes
  const handlePattern = await matchUrlPattern(request);

  // if a pattern handler exists, call it
  if (handlePattern) {
    const patternHandlerResponse = await handlePattern(request, csrfResponse);

    // if a pattern handler returns a response, return it
    if (patternHandlerResponse) {
      return patternHandlerResponse;
    }
  }

  // append the action path to the request headers
  // which is useful for knowing the action path in server actions
  if (isServerAction(request)) {
    csrfResponse.headers.set('x-action-path', request.nextUrl.pathname);
  }

  // if no pattern handler returned a response,
  // return the session response
  return csrfResponse;
}

async function withCsrfMiddleware(
  request: NextRequest,
  response: NextResponse,
) {
  // set up CSRF protection
  const csrfProtect = createCsrfProtect({
    cookie: {
      secure: appConfig.production,
      name: CSRF_SECRET_COOKIE,
    },
    // ignore CSRF errors for server actions since protection is built-in
    ignoreMethods: isServerAction(request)
      ? ['POST']
      : // always ignore GET, HEAD, and OPTIONS requests
        ['GET', 'HEAD', 'OPTIONS'],
  });

  try {
    await csrfProtect(request, response);

    return response;
  } catch (error) {
    // if there is a CSRF error, return a 403 Forbidden response
    if (error instanceof CsrfError) {
      return NextResponse.json('Invalid CSRF token', {
        status: 403,
      });
    }

    throw error;
  }
}

function isServerAction(request: NextRequest) {
  const headers = new Headers(request.headers);

  return headers.has(NEXT_ACTION_HEADER);
}

async function adminMiddleware(request: NextRequest, response: NextResponse) {
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');

  if (!isAdminPath) {
    return;
  }

  const { data, error } = await getUser(request, response);

  // If user is not logged in, redirect to sign in page.
  if (!data?.claims || error) {
    return NextResponse.redirect(
      new URL(pathsConfig.auth.signIn, request.nextUrl.origin).href,
    );
  }

  const client = createMiddlewareClient(request, response);
  const userIsSuperAdmin = await isSuperAdmin(client);

  // If user is not an admin, redirect to 404 page.
  if (!userIsSuperAdmin) {
    return NextResponse.redirect(new URL('/404', request.nextUrl.origin).href);
  }

  // in all other cases, return the response
  return response;
}

/**
 * Check if MFA verification is required based on JWT claims.
 * Reads AAL (Authenticator Assurance Level) directly from claims to avoid
 * an extra API call on every request.
 *
 * MFA is required when:
 * - User has MFA factors enrolled (amr contains 'mfa')
 * - Current AAL is aal1 (not yet verified with second factor)
 */
function requiresMfaVerification(claims: Record<string, unknown>): boolean {
  const aal = claims.aal as string | undefined;
  const amr = claims.amr as Array<{ method: string }> | undefined;

  // If user is already at aal2, no MFA verification needed
  if (aal === 'aal2') {
    return false;
  }

  // Check if user has MFA factors enrolled
  // The amr (Authentication Methods Reference) array indicates enrolled methods
  const hasMfaEnrolled = amr?.some((method) => method.method === 'totp');

  // MFA required if factors are enrolled but user is at aal1
  return hasMfaEnrolled === true && aal === 'aal1';
}

/**
 * Handler for protected routes (requires authentication and MFA check).
 * Used for /app/* routes.
 */
async function protectedRouteHandler(req: NextRequest, res: NextResponse) {
  const { data } = await getUser(req, res);
  const { origin, pathname } = req.nextUrl;

  // If user is not logged in, redirect to sign in page.
  if (!data?.claims) {
    const signInPath = `${pathsConfig.auth.signIn}?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(new URL(signInPath, origin).href);
  }

  // Check MFA requirement from claims (no extra API call)
  const requiresMultiFactorAuthentication = requiresMfaVerification(
    data.claims as Record<string, unknown>,
  );

  // If user requires multi-factor authentication, redirect to MFA page.
  if (requiresMultiFactorAuthentication) {
    const mfaPath = `${pathsConfig.auth.verifyMfa}?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(new URL(mfaPath, origin).href);
  }
}

/**
 * Define URL patterns and their corresponding handlers.
 */
async function getPatterns() {
  let URLPattern = globalThis.URLPattern;

  if (!URLPattern) {
    const { URLPattern: polyfill } = await import('urlpattern-polyfill');
    URLPattern = polyfill as typeof URLPattern;
  }

  return [
    {
      pattern: new URLPattern({ pathname: '/admin/*?' }),
      handler: adminMiddleware,
    },
    {
      pattern: new URLPattern({ pathname: '/auth/*?' }),
      handler: async (req: NextRequest, res: NextResponse) => {
        const { data } = await getUser(req, res);

        // the user is logged out, so we don't need to do anything
        if (!data?.claims) {
          return;
        }

        // check if we need to verify MFA (user is authenticated but needs to verify MFA)
        const isVerifyMfa = req.nextUrl.pathname === pathsConfig.auth.verifyMfa;

        // If user is logged in and does not need to verify MFA,
        // redirect to app home.
        if (!isVerifyMfa) {
          const nextPath = getSafeRedirectPath(
            req.nextUrl.searchParams.get('next'),
            pathsConfig.app.home,
          );

          return NextResponse.redirect(
            new URL(nextPath, req.nextUrl.origin).href,
          );
        }
      },
    },
    {
      pattern: new URLPattern({ pathname: '/app/*?' }),
      handler: protectedRouteHandler,
    },
    {
      // Handle /app/* URLs with same auth logic as /home/*
      pattern: new URLPattern({ pathname: '/app/*?' }),
      handler: async (req: NextRequest, res: NextResponse) => {
        const { data } = await getUser(req, res);
        const { origin, pathname: next } = req.nextUrl;

        // If user is not logged in, redirect to sign in page.
        if (!data?.claims) {
          const signIn = pathsConfig.auth.signIn;
          const redirectPath = `${signIn}?next=${next}`;

          return NextResponse.redirect(new URL(redirectPath, origin).href);
        }

        const supabase = createMiddlewareClient(req, res);

        const requiresMultiFactorAuthentication =
          await checkRequiresMultiFactorAuthentication(supabase);

        // If user requires multi-factor authentication, redirect to MFA page.
        if (requiresMultiFactorAuthentication) {
          return NextResponse.redirect(
            new URL(pathsConfig.auth.verifyMfa, origin).href,
          );
        }
      },
    },
  ];
}

/**
 * Match URL patterns to specific handlers.
 * @param request - The incoming request
 */
async function matchUrlPattern(request: NextRequest) {
  const patterns = await getPatterns();
  const input = request.url.split('?')[0];

  for (const pattern of patterns) {
    const patternResult = pattern.pattern.exec(input);

    if (patternResult !== null && 'pathname' in patternResult) {
      return pattern.handler;
    }
  }
}

/**
 * Set a unique request ID for each request.
 * @param request
 */
function setRequestId(request: Request) {
  request.headers.set('x-correlation-id', crypto.randomUUID());
}

/**
 * @name createResponseWithSecureHeaders
 * @description Create a middleware with enhanced headers applied (if applied).
 * This is disabled by default. To enable set ENABLE_STRICT_CSP=true
 */
async function createResponseWithSecureHeaders() {
  const enableStrictCsp = process.env.ENABLE_STRICT_CSP ?? 'false';

  // we disable ENABLE_STRICT_CSP by default
  if (enableStrictCsp === 'false') {
    return {};
  }

  const { createCspResponse } = await import('./lib/create-csp-response');

  return createCspResponse();
}
