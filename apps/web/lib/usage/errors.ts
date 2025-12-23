/**
 * Custom error classes for usage and billing operations.
 * These enable structured error handling instead of string matching.
 */

export class UsageError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'UsageError';
    this.code = code;
  }
}

export class SubscriptionRequiredError extends UsageError {
  constructor(message = 'A subscription is required to continue') {
    super(message, 'SUBSCRIPTION_REQUIRED');
    this.name = 'SubscriptionRequiredError';
  }
}

export class UsageLimitExceededError extends UsageError {
  readonly tokensUsed: number;
  readonly tokensLimit: number;
  readonly percentage: number;

  constructor(
    tokensUsed: number,
    tokensLimit: number,
    message = 'Usage limit exceeded',
  ) {
    super(message, 'LIMIT_EXCEEDED');
    this.name = 'UsageLimitExceededError';
    this.tokensUsed = tokensUsed;
    this.tokensLimit = tokensLimit;
    this.percentage = Math.round((tokensUsed / tokensLimit) * 100);
  }
}

export class FirstReportUsedError extends UsageError {
  constructor(message = 'First free report has already been used') {
    super(message, 'FIRST_REPORT_USED');
    this.name = 'FirstReportUsedError';
  }
}

/**
 * Type guard for usage errors
 */
export function isUsageError(error: unknown): error is UsageError {
  return error instanceof UsageError;
}

/**
 * Type guard for subscription required error
 */
export function isSubscriptionRequiredError(
  error: unknown,
): error is SubscriptionRequiredError {
  return error instanceof SubscriptionRequiredError;
}

/**
 * Type guard for limit exceeded error
 */
export function isLimitExceededError(
  error: unknown,
): error is UsageLimitExceededError {
  return error instanceof UsageLimitExceededError;
}
