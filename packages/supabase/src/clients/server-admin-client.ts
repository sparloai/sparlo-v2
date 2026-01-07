import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { Database } from '../database.types';
import {
  getSupabaseSecretKey,
  warnServiceRoleKeyUsage,
} from '../get-secret-key';
import { getSupabaseClientKeys } from '../get-supabase-client-keys';

/**
 * @name getSupabaseServerAdminClient
 * @description Get a Supabase client for use in the Server with admin access to the database.
 */
export function getSupabaseServerAdminClient<GenericSchema = Database>() {
  warnServiceRoleKeyUsage();

  const url = getSupabaseClientKeys().url;
  const secretKey = getSupabaseSecretKey();

  // Validate keys before creating client to catch configuration issues early
  if (!url) {
    console.error(
      '[Supabase Admin] Missing NEXT_PUBLIC_SUPABASE_URL environment variable',
    );
    throw new Error('Supabase admin client configuration is incomplete: missing URL');
  }

  if (!secretKey) {
    console.error(
      '[Supabase Admin] Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable',
    );
    throw new Error('Supabase admin client configuration is incomplete: missing secret key');
  }

  const client = createClient<GenericSchema>(url, secretKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      autoRefreshToken: false,
    },
  });

  // Validate client was properly initialized
  if (!client || typeof client.from !== 'function') {
    console.error('[Supabase Admin] Client initialization failed - invalid client object');
    throw new Error('Supabase admin client initialization failed');
  }

  return client;
}
