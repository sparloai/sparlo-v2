/**
 * Shared formatting utilities for usage display.
 * Extracted to avoid duplication across components.
 */
import { USAGE_CONSTANTS } from './constants';

/**
 * Format a token count for display (e.g., 1.5M, 500K, 123)
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(0)}K`;
  }
  return tokens.toString();
}

/**
 * Format a date string for display (e.g., "Dec 22, 2025")
 */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Calculate days remaining until a period end date
 */
export function getDaysRemaining(periodEnd: string | null): number | null {
  if (!periodEnd) return null;
  const end = new Date(periodEnd);
  const now = new Date();
  return Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

/**
 * Get usage warning level based on percentage
 */
export function getUsageWarningLevel(percentage: number) {
  return {
    isAtLimit: percentage >= USAGE_CONSTANTS.HARD_LIMIT_THRESHOLD,
    isCritical: percentage >= USAGE_CONSTANTS.CRITICAL_THRESHOLD,
    isWarning: percentage >= USAGE_CONSTANTS.WARNING_THRESHOLD,
    showUsageBar: percentage >= USAGE_CONSTANTS.USAGE_BAR_VISIBLE_THRESHOLD,
  };
}

/**
 * Estimate reports remaining based on tokens
 */
export function estimateReportsRemaining(
  tokensUsed: number,
  tokensLimit: number,
): number {
  const remaining = Math.max(0, tokensLimit - tokensUsed);
  return Math.floor(remaining / USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT);
}
