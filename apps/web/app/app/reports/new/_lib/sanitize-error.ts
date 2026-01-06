/**
 * Sanitizes error messages to prevent database schema exposure.
 * Maps technical errors to user-friendly messages.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred. Please try again.';
  }

  const message = error.message.toLowerCase();

  // Map known error patterns to user-friendly messages
  if (message.includes('duplicate') || message.includes('unique constraint')) {
    return 'A report with this identifier already exists.';
  }

  if (message.includes('foreign key') || message.includes('violates')) {
    return 'Invalid reference. Please try again.';
  }

  if (
    message.includes('permission') ||
    message.includes('rls') ||
    message.includes('access denied')
  ) {
    return 'You do not have permission to perform this action.';
  }

  if (message.includes('rate limit')) {
    return 'Please wait a moment before trying again.';
  }

  if (
    message.includes('usage') ||
    message.includes('token') ||
    message.includes('limit exceeded')
  ) {
    // Re-throw usage errors so they can be handled specially
    return error.message;
  }

  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('connection')
  ) {
    return 'Network error. Please check your connection and try again.';
  }

  // Default: hide technical details
  return 'Failed to start report generation. Please try again.';
}
