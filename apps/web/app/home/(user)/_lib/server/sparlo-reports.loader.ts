import 'server-only';

import { cache } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import type { ConversationStatus } from '../types';
import type { SparloReport } from './sparlo-reports-server-actions';

/**
 * Lightweight report type for listing - excludes large JSONB fields
 */
export interface SparloReportListItem {
  id: string;
  title: string;
  status: ConversationStatus;
  current_step: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
}

/**
 * Load active (non-archived) reports for the current user (listing only)
 * Optimized to:
 * - Avoid loading large JSONB fields (report_data, messages, chat_history)
 * - Filter archived=false to use the idx_sparlo_reports_active partial index
 */
export const loadUserReports = cache(async (userId: string) => {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select('id, title, status, current_step, created_at, updated_at, archived')
    .eq('account_id', userId)
    .eq('archived', false)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to load reports:', error);
    return [];
  }

  return (data ?? []) as SparloReportListItem[];
});

/**
 * Count completed reports for a user in their current billing period.
 * For paid users, only counts reports created since period_starts_at.
 * For free users, counts all reports.
 */
export const countCompletedReports = cache(async (userId: string) => {
  const client = getSupabaseServerClient();

  // Get subscription's billing period start
  const { data: sub } = await client
    .from('subscriptions')
    .select('period_starts_at')
    .eq('account_id', userId)
    .eq('active', true)
    .single();

  // Free users: count all time. Paid users: count since period start.
  const periodStart = sub?.period_starts_at || '1970-01-01';

  const { count, error } = await client
    .from('sparlo_reports')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', userId)
    .eq('status', 'complete')
    .eq('archived', false)
    .gte('created_at', periodStart);

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
