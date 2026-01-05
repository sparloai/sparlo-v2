import 'server-only';

/**
 * Centralized configuration for Help Center features
 * Single source of truth for all constants and settings
 */
export const HELP_CENTER_CONFIG = {
  // Escalation marker - Claude includes this when user needs human support
  ESCALATION_MARKER: '__SYSTEM_ESCALATE_7a8b9c__',

  // Streaming limits
  STREAM_TIMEOUT_MS: 30000,
  MAX_RESPONSE_BYTES: 50000,
  MAX_BUFFER_SIZE: 10000, // 10KB - prevents DoS via unbounded buffer growth

  // Rate limits (requests per window)
  RATE_LIMITS: {
    CHAT_PER_HOUR: 20,
    TICKETS_PER_DAY: 5,
    FEEDBACK_PER_HOUR: 20,
    DOCS_SEARCH_PER_MINUTE: 60,
  },

  // RAG settings
  RAG: {
    TOP_K: 5,
    FUZZY_THRESHOLD: 0.3,
  },

  // Rate limit failure behavior
  RATE_LIMIT_FAIL_CLOSED_GRACE: 3, // Allow 3 requests when rate limiting fails
} as const;

// Derived constants
export const MARKER_LENGTH = HELP_CENTER_CONFIG.ESCALATION_MARKER.length;

// Type exports
export type HelpCenterConfig = typeof HELP_CENTER_CONFIG;
