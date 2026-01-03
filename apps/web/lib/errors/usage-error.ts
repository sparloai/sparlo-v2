/**
 * Usage-related error codes.
 * These codes survive serialization across the server/client boundary.
 */
export const USAGE_ERROR_CODES = {
  SUBSCRIPTION_REQUIRED: 'USAGE_SUBSCRIPTION_REQUIRED',
  LIMIT_EXCEEDED: 'USAGE_LIMIT_EXCEEDED',
} as const;

export type UsageErrorCode =
  (typeof USAGE_ERROR_CODES)[keyof typeof USAGE_ERROR_CODES];

/**
 * Check if an error message contains a usage error code.
 * Used on the client to detect usage errors from server actions.
 */
export function isUsageError(errorMessage: string): boolean {
  return (
    errorMessage.includes(USAGE_ERROR_CODES.SUBSCRIPTION_REQUIRED) ||
    errorMessage.includes(USAGE_ERROR_CODES.LIMIT_EXCEEDED)
  );
}

/**
 * Create a usage error message with embedded code.
 * The code is prefixed to survive serialization.
 */
export function createUsageErrorMessage(
  code: UsageErrorCode,
  details?: string,
): string {
  return details ? `[${code}] ${details}` : `[${code}]`;
}
