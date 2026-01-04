import { createBrowserClient } from '@supabase/ssr';

import { Database } from '../database.types';
import { getSupabaseClientKeys } from '../get-supabase-client-keys';

/**
 * Production domain for cookie sharing across subdomains.
 * Leading dot allows cookies to be accessible by both sparlo.ai and app.sparlo.ai
 */
const COOKIE_DOMAIN = '.sparlo.ai';

/**
 * @name getSupabaseBrowserClient
 * @description Get a Supabase client for use in the Browser.
 * Cookies are configured for cross-subdomain auth in production.
 */
export function getSupabaseBrowserClient<GenericSchema = Database>() {
  const keys = getSupabaseClientKeys();
  const isProduction = process.env.NODE_ENV === 'production';

  return createBrowserClient<GenericSchema>(keys.url, keys.publicKey, {
    cookieOptions: {
      // Share cookies across subdomains in production
      ...(isProduction && { domain: COOKIE_DOMAIN }),
      // Security: Only send over HTTPS in production
      ...(isProduction && { secure: true }),
      // Allow cross-subdomain navigation while preventing CSRF
      sameSite: 'lax',
    },
  });
}
