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
 * Plan IDs must match billing.config.ts (core, pro, max).
 *
 * Calculated based on Claude Opus 4.5 pricing (~$33/1M tokens blended):
 * - Core: $90/month  → 2,700,000 tokens (~15 reports)
 * - Pro:  $270/month → 8,100,000 tokens (~45 reports)
 * - Max:  $540/month → 16,200,000 tokens (~90 reports)
 */
export const PLAN_TOKEN_LIMITS: Record<string, number> = {
  // Core tier (~$90/month in token costs)
  'core-monthly': 2_700_000,
  'core-annual': 2_700_000,
  // Pro tier (~$270/month in token costs)
  'pro-monthly': 8_100_000,
  'pro-annual': 8_100_000,
  // Max tier (~$540/month in token costs)
  'max-monthly': 16_200_000,
  'max-annual': 16_200_000,
} as const;

/**
 * Report limits per subscription plan.
 * Based on ~180,000 tokens per report.
 */
export const PLAN_REPORT_LIMITS: Record<string, number> = {
  'core-monthly': 15,
  'core-annual': 15,
  'pro-monthly': 45,
  'pro-annual': 45,
  'max-monthly': 90,
  'max-annual': 90,
} as const;
