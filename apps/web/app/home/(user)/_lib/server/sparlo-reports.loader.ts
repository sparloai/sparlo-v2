import 'server-only';

import { cache } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import type { SparloReport } from './sparlo-reports-server-actions';

/**
 * Load all reports for the current user
 */
export const loadUserReports = cache(async (userId: string) => {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select('*')
    .eq('account_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to load reports:', error);
    return [];
  }

  return (data ?? []) as unknown as SparloReport[];
});

/**
 * Count completed reports for a user
 */
export const countCompletedReports = cache(async (userId: string) => {
  const client = getSupabaseServerClient();

  const { count, error } = await client
    .from('sparlo_reports')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', userId)
    .eq('status', 'complete');

  if (error) {
    console.error('Failed to count completed reports:', error);
    return 0;
  }

  return count ?? 0;
});

/**
 * Get a single report by ID
 */
export const getReportById = cache(async (reportId: string) => {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    console.error('Failed to load report:', error);
    return null;
  }

  return data as unknown as SparloReport;
});

/**
 * Get a report by conversation ID
 */
export const getReportByConversationId = cache(
  async (conversationId: string, userId: string) => {
    const client = getSupabaseServerClient();

    const { data, error } = await client
      .from('sparlo_reports')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('account_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Failed to load report by conversation ID:', error);
      return null;
    }

    return data as unknown as SparloReport;
  },
);
