import 'server-only';

import { redactSensitiveData } from './input-validator';

/**
 * Error categorization and sanitization for DD reports
 *
 * Maps internal errors to user-friendly messages while
 * logging appropriate details for debugging.
 */

// =============================================================================
// Error Types
// =============================================================================

export type ErrorCategory =
  | 'VALIDATION' // Input validation failed
  | 'TOKEN_BUDGET' // Token limit exceeded
  | 'RATE_LIMIT' // Rate limit hit
  | 'CLAUDE_REFUSAL' // Claude refused the request
  | 'JSON_PARSE' // Failed to parse Claude's response
  | 'AUTHORIZATION' // User not authorized
  | 'INTERNAL'; // Internal/unknown error

export interface CategorizedError {
  category: ErrorCategory;
  userMessage: string;
  logDetails: Record<string, unknown>;
  retryable: boolean;
}

// =============================================================================
// Error Categorization
// =============================================================================

/**
 * Categorize an error and return user-friendly message + log details
 */
export function categorizeError(error: Error): CategorizedError {
  const message = error.message || '';

  // Token budget exceeded
  if (
    message.includes('Token budget exceeded') ||
    message.includes('token limit') ||
    message.includes('too large')
  ) {
    return {
      category: 'TOKEN_BUDGET',
      userMessage:
        'Your input is too large for analysis. Please reduce the size of your startup materials ' +
        'or remove some attachments and try again.',
      logDetails: {
        type: 'TokenBudget',
        message: redactSensitiveData(message, 500),
      },
      retryable: false,
    };
  }

  // Rate limit
  if (
    message.includes('Rate limit') ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  ) {
    // Extract reset time if present
    const resetMatch = message.match(/try again (?:at|in) ([^.]+)/i);
    const resetInfo = resetMatch ? ` ${resetMatch[0]}.` : '';

    return {
      category: 'RATE_LIMIT',
      userMessage: `You've reached the limit for report generation.${resetInfo} Please wait and try again later.`,
      logDetails: {
        type: 'RateLimit',
      },
      retryable: true,
    };
  }

  // Claude refusal
  if (
    message.includes('refused') ||
    message.includes('cannot assist') ||
    message.includes('inappropriate') ||
    error.name === 'ClaudeRefusalError'
  ) {
    return {
      category: 'CLAUDE_REFUSAL',
      userMessage:
        'Your input was flagged as potentially problematic. Please review your startup materials ' +
        'and ensure they contain appropriate business content.',
      logDetails: {
        type: 'ClaudeRefusal',
        message: redactSensitiveData(message, 300),
      },
      retryable: false,
    };
  }

  // JSON parse error
  if (
    message.includes('Failed to parse JSON') ||
    message.includes('JSON parse') ||
    message.includes('Unexpected token') ||
    message.includes('Invalid JSON')
  ) {
    return {
      category: 'JSON_PARSE',
      userMessage:
        'We encountered a technical issue generating your report. Our team has been notified. ' +
        'Please try again, and contact support if this persists.',
      logDetails: {
        type: 'JSONParse',
        preview: redactSensitiveData(message, 200),
      },
      retryable: true,
    };
  }

  // Validation errors
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('exceed')
  ) {
    return {
      category: 'VALIDATION',
      userMessage:
        'There was an issue with your input. Please check your startup materials are valid ' +
        'and try again.',
      logDetails: {
        type: 'Validation',
        message: redactSensitiveData(message, 300),
      },
      retryable: false,
    };
  }

  // Authorization
  if (
    message.includes('Not authorized') ||
    message.includes('unauthorized') ||
    message.includes('permission')
  ) {
    return {
      category: 'AUTHORIZATION',
      userMessage: 'You do not have permission to access this report.',
      logDetails: {
        type: 'Authorization',
      },
      retryable: false,
    };
  }

  // Default: internal error
  return {
    category: 'INTERNAL',
    userMessage:
      'An unexpected error occurred while generating your report. ' +
      'Please try again, or contact support if this continues.',
    logDetails: {
      type: 'Internal',
      message: redactSensitiveData(message, 200),
      stack:
        process.env.NODE_ENV === 'development'
          ? error.stack?.slice(0, 500)
          : undefined,
    },
    retryable: true,
  };
}

/**
 * Create a structured log entry for an error
 */
export function createErrorLogEntry(
  reportId: string,
  error: Error,
  context?: Record<string, unknown>,
): Record<string, unknown> {
  const categorized = categorizeError(error);

  return {
    reportId,
    category: categorized.category,
    retryable: categorized.retryable,
    ...categorized.logDetails,
    ...(context || {}),
    timestamp: new Date().toISOString(),
  };
}
