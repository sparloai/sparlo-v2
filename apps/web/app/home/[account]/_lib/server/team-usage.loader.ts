import 'server-only';

import { cache } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { UsageCheckResponseSchema } from '~/lib/usage/schemas';

export interface TeamMemberUsage {
  userId: string;
  userName: string;
  reportsCount: number;
  isCurrentMember: boolean;
}

export interface TeamUsageData {
  percentage: number;
  tokensUsed: number;
  tokensLimit: number;
  periodEnd: string | null;
  periodStart: string | null;
  memberUsage: TeamMemberUsage[];
}

export interface TeamUsageResult {
  data: TeamUsageData | null;
  error: string | null;
}

export const loadTeamUsage = cache(teamUsageLoader);

async function teamUsageLoader(accountId: string): Promise<TeamUsageResult> {
  const client = getSupabaseServerClient();

  try {
    // 1. Get usage period data - this also validates account access via RLS
    const { data: usageData, error: usageError } = await client.rpc(
      'check_usage_allowed',
      {
        p_account_id: accountId,
        p_estimated_tokens: 0,
      },
    );

    if (usageError) {
      console.error('Usage check failed:', usageError);
      return { data: null, error: 'Failed to load usage data' };
    }

    const validated = UsageCheckResponseSchema.safeParse(usageData);
    if (!validated.success) {
      console.error('Usage validation failed:', validated.error);
      return { data: null, error: 'Invalid usage data format' };
    }

    const usage = validated.data;

    // 2. Calculate period boundaries correctly
    // Use first day of month to avoid edge cases (e.g., March 31 - 1 month = March 3)
    const periodEnd = usage.period_end
      ? new Date(usage.period_end)
      : new Date();

    // Calculate period start as first day of previous month
    const periodStart = new Date(
      periodEnd.getFullYear(),
      periodEnd.getMonth() - 1,
      1,
    );

    // 3. Get per-member report counts
    // Note: RPC enforces authorization via has_role_on_account check
    const { data: memberData, error: memberError } = await client.rpc(
      'get_team_member_usage',
      {
        p_account_id: accountId,
        p_period_start: periodStart.toISOString(),
        p_period_end: periodEnd.toISOString(),
      },
    );

    if (memberError) {
      // Check if this is an authorization error
      if (memberError.code === 'insufficient_privilege') {
        return {
          data: null,
          error: 'You do not have permission to view this data',
        };
      }
      console.error('Member usage query failed:', memberError);
      // Non-fatal for other errors - continue without member breakdown
    }

    const memberUsage: TeamMemberUsage[] = (memberData ?? []).map((m) => ({
      userId: m.user_id,
      userName: m.user_name ?? 'Unknown',
      reportsCount: m.reports_count,
      isCurrentMember: m.is_current_member,
    }));

    return {
      data: {
        percentage: usage.percentage,
        tokensUsed: usage.tokens_used,
        tokensLimit: usage.tokens_limit,
        periodEnd: usage.period_end,
        periodStart: periodStart.toISOString(),
        memberUsage,
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error loading team usage:', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
}
