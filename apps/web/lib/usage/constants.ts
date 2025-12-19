/**
 * Centralized usage tracking constants.
 *
 * Token estimates based on production data from Claude Opus 4.5:
 * - Per report: ~150,000 tokens (input + output across all phases)
 * - Per chat message: ~2,000 tokens
 * - Combined report + chat: ~180,000 tokens per "report session"
 */

export const USAGE_CONSTANTS = {
  /** Default token limit for Starter tier / no subscription */
  DEFAULT_TOKEN_LIMIT: 3_000_000,

  /** Estimated tokens consumed per full report generation */
  ESTIMATED_TOKENS_PER_REPORT: 180_000,

  /** Estimated tokens per chat message exchange */
  ESTIMATED_TOKENS_PER_CHAT_MESSAGE: 2_000,

  /** Show usage bar when usage reaches this percentage (like Claude) */
  USAGE_BAR_VISIBLE_THRESHOLD: 25,

  /** Show warning indicator at this percentage */
  WARNING_THRESHOLD: 80,

  /** Hard limit - block new reports at this percentage */
  HARD_LIMIT_THRESHOLD: 100,
} as const;

/**
 * Token limits per subscription plan.
 * These values should match the billing configuration metadata.
 */
export const PLAN_TOKEN_LIMITS: Record<string, number> = {
  'starter-monthly': 3_000_000,
  'starter-yearly': 3_000_000,
  'pro-monthly': 10_000_000,
  'pro-yearly': 10_000_000,
  'enterprise-monthly': 30_000_000,
  'enterprise-yearly': 30_000_000,
} as const;

/**
 * Report limits per subscription plan.
 */
export const PLAN_REPORT_LIMITS: Record<string, number> = {
  'starter-monthly': 15,
  'starter-yearly': 15,
  'pro-monthly': 50,
  'pro-yearly': 50,
  'enterprise-monthly': 150,
  'enterprise-yearly': 150,
} as const;
