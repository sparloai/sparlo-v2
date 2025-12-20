import { NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { USAGE_CONSTANTS } from '~/lib/usage/constants';
import { UsageCheckResponseSchema } from '~/lib/usage/schemas';

/**
 * GET /api/usage
 *
 * Returns the current usage data for the authenticated user's account.
 * Agent-native endpoint (P1-086 fix) - allows programmatic access to usage data.
 *
 * Response:
 * {
 *   allowed: boolean,
 *   tokensUsed: number,
 *   tokensLimit: number,
 *   remaining: number,
 *   percentage: number,
 *   reportsCount: number,
 *   chatTokensUsed: number,
 *   periodEnd: string (ISO date),
 *   tier: string
 * }
 */
export const GET = enhanceRouteHandler(
  async ({ user }) => {
    const client = getSupabaseServerClient();

    // Call the database function to get usage data
    const { data, error } = await (client.rpc as CallableFunction)(
      'check_usage_allowed',
      {
        p_account_id: user.id,
        p_estimated_tokens: USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT,
      },
    );

    if (error) {
      console.error('[API/Usage] Failed to fetch usage:', error);
      return NextResponse.json(
        { error: 'Failed to fetch usage data' },
        { status: 500 },
      );
    }

    // Validate response
    const validated = UsageCheckResponseSchema.safeParse(data);

    if (!validated.success) {
      console.error('[API/Usage] Invalid response shape:', validated.error);
      return NextResponse.json(
        { error: 'Invalid usage data format' },
        { status: 500 },
      );
    }

    const { data: usage } = validated;

    // Return agent-friendly response format
    return NextResponse.json({
      // Core usage metrics
      allowed: usage.allowed,
      tokensUsed: usage.tokens_used,
      tokensLimit: usage.tokens_limit,
      remaining: usage.remaining,
      percentage: usage.percentage,

      // Breakdown
      reportsCount: usage.reports_count,
      chatTokensUsed: usage.chat_tokens_used,

      // Period info
      periodEnd: usage.period_end,

      // Thresholds for client-side logic
      thresholds: {
        warningPercentage: USAGE_CONSTANTS.WARNING_THRESHOLD,
        hardLimitPercentage: USAGE_CONSTANTS.HARD_LIMIT_THRESHOLD,
        estimatedTokensPerReport: USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT,
        estimatedTokensPerChat:
          USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_CHAT_MESSAGE,
      },
    });
  },
  {
    auth: true,
  },
);
