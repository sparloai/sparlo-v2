import 'server-only';

import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { HELP_CENTER_CONFIG } from '~/lib/help/config';

// Rate limit configurations per type (requests per window)
const rateLimitConfigs = {
  chat: {
    limit: HELP_CENTER_CONFIG.RATE_LIMITS.CHAT_PER_HOUR,
    windowMinutes: 60,
  },
  ticket: {
    limit: HELP_CENTER_CONFIG.RATE_LIMITS.TICKETS_PER_DAY,
    windowMinutes: 1440,
  },
  feedback: {
    limit: HELP_CENTER_CONFIG.RATE_LIMITS.FEEDBACK_PER_HOUR,
    windowMinutes: 60,
  },
  docsSearch: {
    limit: HELP_CENTER_CONFIG.RATE_LIMITS.DOCS_SEARCH_PER_MINUTE,
    windowMinutes: 1,
  },
} as const;

// Grace period for requests when rate limiting fails (fail-closed with small grace)
const FAIL_CLOSED_GRACE = HELP_CENTER_CONFIG.RATE_LIMIT_FAIL_CLOSED_GRACE;

export type RateLimitType = keyof typeof rateLimitConfigs;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface CheckRateLimitResponse {
  allowed: boolean;
  current_count: number;
  limit: number;
  reset_at: string;
}

/**
 * Check rate limit using existing Supabase RPC
 * Uses the distributed rate limiting function from the database
 */
export async function checkRateLimit(
  type: RateLimitType,
  identifier: string,
): Promise<RateLimitResult> {
  const logger = await getLogger();
  const config = rateLimitConfigs[type];

  try {
    const client = getSupabaseServerClient();

    const { data, error } = await client.rpc('check_rate_limit', {
      p_account_id: identifier,
      p_resource_type: `help-${type}`,
      p_limit: config.limit,
      p_window_minutes: config.windowMinutes,
    });

    if (error) {
      logger.error({ type, identifier, error }, 'Rate limit check failed');
      // P2 Fix: Fail closed with small grace period to prevent DoS via DB overload
      return {
        success: false,
        limit: FAIL_CLOSED_GRACE,
        remaining: 0,
        reset: Date.now() + 60000, // 1 minute retry
      };
    }

    const result = data as unknown as CheckRateLimitResponse;

    const resetTime = result.reset_at
      ? new Date(result.reset_at).getTime()
      : Date.now() + config.windowMinutes * 60000;

    return {
      success: result.allowed,
      limit: result.limit,
      remaining: Math.max(0, result.limit - result.current_count),
      reset: resetTime,
    };
  } catch (error) {
    logger.error({ type, identifier, error }, 'Rate limit check error');
    // P2 Fix: Fail closed with small grace period
    return {
      success: false,
      limit: FAIL_CLOSED_GRACE,
      remaining: 0,
      reset: Date.now() + 60000, // 1 minute retry
    };
  }
}

/**
 * Returns rate limit headers for response
 */
export function getRateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}
