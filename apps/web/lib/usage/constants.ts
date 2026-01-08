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
  DEFAULT_TOKEN_LIMIT: 3_000_000,

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
 * Plan IDs must match billing.config.ts (lite, core, pro, max).
 *
 * Token allocations per plan:
 * - Lite: 1,000,000 tokens (~5 reports)
 * - Core: 3,000,000 tokens (~16 reports)
 * - Pro:  10,000,000 tokens (~55 reports)
 * - Max:  20,000,000 tokens (~111 reports)
 */
export const PLAN_TOKEN_LIMITS: Record<string, number> = {
  // Lite tier
  'lite-monthly': 1_000_000,
  'lite-annual': 1_000_000,
  // Core tier
  'core-monthly': 3_000_000,
  'core-annual': 3_000_000,
  // Pro tier
  'pro-monthly': 10_000_000,
  'pro-annual': 10_000_000,
  // Max tier
  'max-monthly': 20_000_000,
  'max-annual': 20_000_000,
} as const;

/**
 * Report limits per subscription plan.
 * Based on ~180,000 tokens per report.
 */
export const PLAN_REPORT_LIMITS: Record<string, number> = {
  'lite-monthly': 5,
  'lite-annual': 5,
  'core-monthly': 16,
  'core-annual': 16,
  'pro-monthly': 55,
  'pro-annual': 55,
  'max-monthly': 111,
  'max-annual': 111,
} as const;
