/**
 * Centralized usage tracking constants.
 *
 * Token estimates based on production data from Claude Opus 4.5:
 * - Per report: ~150,000 tokens (input + output across all phases)
 * - Per chat message: ~2,000 tokens
 * - Combined report + chat: ~180,000 tokens per "report session"
 */

export const USAGE_CONSTANTS = {
  /** Default token limit for Standard tier / no subscription */
  DEFAULT_TOKEN_LIMIT: 2_700_000,

  /** Estimated tokens consumed per full report generation */
  ESTIMATED_TOKENS_PER_REPORT: 180_000,

  /** Estimated tokens per chat message exchange */
  ESTIMATED_TOKENS_PER_CHAT_MESSAGE: 2_000,

  /** Show usage bar when usage reaches this percentage (like Claude) */
  USAGE_BAR_VISIBLE_THRESHOLD: 25,

  /** Show warning indicator at this percentage */
  WARNING_THRESHOLD: 80,

  /** Show critical indicator at this percentage */
  CRITICAL_THRESHOLD: 95,

  /** Hard limit - block new reports at this percentage */
  HARD_LIMIT_THRESHOLD: 100,

  /** Maximum tokens allowed per single operation (DoS prevention) */
  MAX_TOKENS_PER_OPERATION: 1_000_000,
} as const;

/**
 * Token limits per subscription plan.
 * These values should match the billing configuration metadata.
 *
 * Calculated as: reports × 180,000 tokens per report
 * - Standard: 15 reports × 180,000 = 2,700,000
 * - Pro: 30 reports × 180,000 = 5,400,000
 * - Max: 75 reports × 180,000 = 13,500,000
 */
export const PLAN_TOKEN_LIMITS: Record<string, number> = {
  'standard-monthly': 2_700_000,
  'pro-monthly': 5_400_000,
  'max-monthly': 13_500_000,
} as const;

/**
 * Report limits per subscription plan.
 */
export const PLAN_REPORT_LIMITS: Record<string, number> = {
  'standard-monthly': 15,
  'pro-monthly': 30,
  'max-monthly': 75,
} as const;
