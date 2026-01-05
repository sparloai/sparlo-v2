import 'server-only';

import { cache } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { UsageCheckResponseSchema } from '~/lib/usage/schemas';

export interface TeamMemberUsage {
  userId: string;
  userName: string;
  userEmail: string;
  reportsCount: number;
  isCurrentMember: boolean;
}

export interface TeamUsageData {
  percentage: number;
  tokensUsed: number;
  tokensLimit: number;
  periodEnd: string | null;
  memberUsage: TeamMemberUsage[];
}

export interface TeamUsageResult {
  data: TeamUsageData | null;
  error: string | null;
}

/**
 * @name loadTeamUsage
 * @description Load team usage data including per-member report counts.
 */
export const loadTeamUsage = cache(teamUsageLoader);

async function teamUsageLoader(accountId: string): Promise<TeamUsageResult> {
  const client = getSupabaseServerClient();

  try {
    // SECURITY FIX: Verify user is a member of this account BEFORE proceeding
    const { data: membership, error: membershipError } = await client
      .from('accounts_memberships')
      .select('account_id')
      .eq('account_id', accountId)
      .eq('user_id', (await client.auth.getUser()).data.user?.id ?? '')
      .single();

    if (membershipError || !membership) {
      console.error('Unauthorized access attempt to account:', accountId);
      return {
        data: null,
        error: 'You do not have permission to access this account'
      };
    }

    // 1. Get usage period data using existing RPC
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

    // 2. Calculate period boundaries (monthly periods)
    const periodEnd = usage.period_end
      ? new Date(usage.period_end)
      : new Date();
    const periodStart = new Date(periodEnd);
    periodStart.setMonth(periodStart.getMonth() - 1);

    // 3. Get per-member report counts using RPC
    // Note: The RPC function also has authorization checks (defense-in-depth)
    const { data: memberData, error: memberError } = await client.rpc(
      'get_team_member_usage',
      {
        p_account_id: accountId,
        p_period_start: periodStart.toISOString(),
        p_period_end: periodEnd.toISOString(),
      },
    );

    if (memberError) {
      console.error('Member usage query failed:', memberError);
      // Non-fatal - continue without member breakdown
    }

    const memberUsage: TeamMemberUsage[] = (memberData ?? []).map((m) => ({
      userId: m.user_id,
      userName: m.user_name ?? 'Unknown',
      userEmail: m.user_email ?? '',
      reportsCount: m.reports_count,
      isCurrentMember: m.is_current_member,
    }));

    return {
      data: {
        percentage: usage.percentage,
        tokensUsed: usage.tokens_used,
        tokensLimit: usage.tokens_limit,
        periodEnd: usage.period_end,
        memberUsage,
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error loading team usage:', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
}
