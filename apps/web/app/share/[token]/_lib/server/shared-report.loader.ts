import 'server-only';

import { cache } from 'react';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import type { SharedReport } from '~/home/(user)/reports/_lib/types/report-data.types';

/**
 * Load a shared report by its share token.
 * Uses React cache() for request deduplication (prevents duplicate fetches
 * between page and generateMetadata).
 *
 * Uses admin client to bypass RLS since this is a public page.
 * Authorization is handled by share token validation.
 */
export const loadSharedReport = cache(
  async (token: string): Promise<SharedReport | null> => {
    const adminClient = getSupabaseServerAdminClient();

    // Optimized: Single query with JOIN instead of N+1 sequential queries
    // Note: After migration, add revoked_at check and access tracking
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
      .single();

    if (error || !data) {
      console.error('[Share Loader] Share not found:', error);
      return null;
    }

    // Extract the joined report data
    // TypeScript needs help here since Supabase returns nested objects
    const report = data.sparlo_reports as unknown as SharedReport;

    return report;
  },
);
