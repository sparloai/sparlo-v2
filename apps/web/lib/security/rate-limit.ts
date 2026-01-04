import 'server-only';

import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

// Rate limit configurations per type (requests per hour)
const rateLimitConfigs = {
  chat: { limit: 20, windowMinutes: 60 },
  ticket: { limit: 5, windowMinutes: 1440 }, // 5 per day
  feedback: { limit: 20, windowMinutes: 60 },
  docsSearch: { limit: 60, windowMinutes: 1 }, // 60 per minute
} as const;

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
      // Fail open - allow request if rate limiting fails
      return {
        success: true,
        limit: config.limit,
        remaining: config.limit,
        reset: Date.now() + config.windowMinutes * 60000,
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
    // Fail open
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: Date.now() + config.windowMinutes * 60000,
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
