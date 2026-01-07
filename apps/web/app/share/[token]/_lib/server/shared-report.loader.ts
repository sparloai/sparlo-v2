import 'server-only';

import { cache } from 'react';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import type { SharedReport } from '~/app/app/reports/_lib/types/report-data.types';

// UUID v4 regex for token validation
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Mask token for logging (show first 8 chars only)
 */
function maskToken(token: string): string {
  return token.length > 8 ? `${token.slice(0, 8)}...` : token;
}

/**
 * Load a shared report by its share token.
 * Uses React cache() for request deduplication (prevents duplicate fetches
 * between page and generateMetadata).
 *
 * Uses admin client to bypass RLS since this is a public page.
 * Authorization is handled by share token validation.
 *
 * Security notes:
 * - Tokens are UUID v4 (122 bits of entropy) - not practically enumerable
 * - Returns uniform null response for any failure (no information leakage)
 * - Logs masked tokens only (first 8 chars) for monitoring
 */
export const loadSharedReport = cache(
  async (token: string): Promise<SharedReport | null> => {
    // Validate token format before database query (prevents injection, logs malformed attempts)
    if (!UUID_REGEX.test(token)) {
      console.warn(
        `[Share Loader] Invalid token format attempted: ${maskToken(token)}`,
      );
      return null;
    }

    const adminClient = getSupabaseServerAdminClient();

    // Optimized: Single query with JOIN instead of N+1 sequential queries
    // Security: Only allow non-revoked tokens that haven't expired
    const { data, error } = await adminClient
      .from('report_shares')
      .select(
        `
        report_id,
        sparlo_reports!inner(
          id,
          title,
          headline,
          report_data,
          created_at
        )
      `,
      )
      .eq('share_token', token)
      .is('revoked_at', null)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      // Log with masked token for security monitoring
      console.warn(
        `[Share Loader] Share not found or expired: ${maskToken(token)}`,
      );
      return null;
    }

    // Extract the joined report data
    // TypeScript needs help here since Supabase returns nested objects
    const report = data.sparlo_reports as unknown as SharedReport;

    return report;
  },
);
