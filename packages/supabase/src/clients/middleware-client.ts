import 'server-only';

import { type NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

import { Database } from '../database.types';
import { getSupabaseClientKeys } from '../get-supabase-client-keys';

/**
 * Production domain for cookie sharing across subdomains.
 * Leading dot allows cookies to be accessible by both sparlo.ai and app.sparlo.ai
 */
const COOKIE_DOMAIN = '.sparlo.ai';

/**
 * Creates a middleware client for Supabase.
 *
 * Cookies are configured for cross-subdomain auth:
 * - Production: domain=.sparlo.ai (shared across subdomains)
 * - Development: no domain (localhost default)
 *
 * @param {NextRequest} request - The Next.js request object.
 * @param {NextResponse} response - The Next.js response object.
 */
export function createMiddlewareClient<GenericSchema = Database>(
  request: NextRequest,
  response: NextResponse,
) {
  const keys = getSupabaseClientKeys();
  const isProduction = process.env.NODE_ENV === 'production';

  return createServerClient<GenericSchema>(keys.url, keys.publicKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );

        cookiesToSet.forEach(({ name, value, options }) => {
          // Configure cookies for cross-subdomain auth in production
          const cookieOptions = {
            ...options,
            // Leading dot allows cookie sharing across subdomains
            ...(isProduction && { domain: COOKIE_DOMAIN }),
            // Security: Ensure cookies are secure in production
            ...(isProduction && { secure: true }),
            // Prevent CSRF while allowing cross-subdomain navigation
            sameSite: 'lax' as const,
          };

          response.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });
}
