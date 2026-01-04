import 'server-only';

import { cookies } from 'next/headers';

import { createServerClient } from '@supabase/ssr';

import { Database } from '../database.types';
import { getSupabaseClientKeys } from '../get-supabase-client-keys';

/**
 * Production domain for cookie sharing across subdomains.
 * Leading dot allows cookies to be accessible by both sparlo.ai and app.sparlo.ai
 */
const COOKIE_DOMAIN = '.sparlo.ai';

/**
 * @name getSupabaseServerClient
 * @description Creates a Supabase client for use in the Server.
 * Cookies are configured for cross-subdomain auth in production.
 */
export function getSupabaseServerClient<GenericSchema = Database>() {
  const keys = getSupabaseClientKeys();
  const isProduction = process.env.NODE_ENV === 'production';

  return createServerClient<GenericSchema>(keys.url, keys.publicKey, {
    cookies: {
      async getAll() {
        const cookieStore = await cookies();

        return cookieStore.getAll();
      },
      async setAll(cookiesToSet) {
        const cookieStore = await cookies();

        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Configure cookies for cross-subdomain auth in production
            const cookieOptions = {
              ...options,
              ...(isProduction && { domain: COOKIE_DOMAIN }),
              ...(isProduction && { secure: true }),
              sameSite: 'lax' as const,
            };

            cookieStore.set(name, value, cookieOptions);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
