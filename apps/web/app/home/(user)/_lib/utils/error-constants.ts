/**
 * Centralized error pattern constants.
 * Used for error type detection to avoid brittle string matching.
 */
export const ERROR_PATTERNS = {
  /** Error message indicating AI refused to process the query */
  REFUSAL: 'could not be processed',
} as const;
