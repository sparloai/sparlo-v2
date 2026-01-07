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

  // Validate keys before creating client to catch configuration issues early
  if (!keys.url || !keys.publicKey) {
    console.error(
      '[Supabase] Missing configuration:',
      !keys.url ? 'NEXT_PUBLIC_SUPABASE_URL' : '',
      !keys.publicKey ? 'NEXT_PUBLIC_SUPABASE_PUBLIC_KEY' : '',
    );
    throw new Error('Supabase client configuration is incomplete');
  }

  const client = createServerClient<GenericSchema>(keys.url, keys.publicKey, {
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
              // Security: Prevent XSS from accessing auth cookies
              httpOnly: true,
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

  // Validate client was properly initialized
  if (!client || typeof client.from !== 'function') {
    console.error('[Supabase] Client initialization failed - invalid client object');
    throw new Error('Supabase client initialization failed');
  }

  return client;
}
