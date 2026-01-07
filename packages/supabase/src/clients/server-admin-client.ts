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

  // TEMPORARY DEBUG LOGGING - remove after fixing
  console.log('[Supabase Admin Debug] Creating client:', {
    hasUrl: !!url,
    urlLength: url?.length ?? 0,
    urlPrefix: url?.substring(0, 30) ?? 'MISSING',
    hasSecretKey: !!secretKey,
    secretKeyLength: secretKey?.length ?? 0,
  });

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

  // TEMPORARY DEBUG LOGGING - remove after fixing
  console.log('[Supabase Admin Debug] Client created:', {
    hasClient: !!client,
    hasFrom: typeof client?.from === 'function',
    hasRpc: typeof client?.rpc === 'function',
    // @ts-expect-error - accessing internal property for debugging
    hasRest: !!client?.rest,
    clientKeys: client ? Object.keys(client).slice(0, 10) : [],
  });

  // Validate client was properly initialized (prevents 'Cannot read properties of undefined (reading rest)' error)
  if (!client || typeof client.from !== 'function') {
    console.error('[Supabase Admin] Client initialization failed - invalid client object');
    throw new Error('Supabase admin client initialization failed');
  }

  return client;
}
