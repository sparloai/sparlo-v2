/**
 * Report-related constants
 *
 * Centralized configuration values to avoid magic numbers in components.
 */

// ============================================
// TIMING
// ============================================

/** Debounce delay for context detection (ms) */
export const CONTEXT_DETECTION_DEBOUNCE_MS = 300;

// ============================================
// VALIDATION
// ============================================

/** Minimum character count for valid challenge input */
export const MIN_CHALLENGE_LENGTH = 50;

/** Maximum length for user input display */
export const MAX_INPUT_DISPLAY_LENGTH = 10_000;

// ============================================
// ATTACHMENTS
// ============================================

/** Maximum number of attachments per report */
export const MAX_ATTACHMENTS = 5;

/** Maximum file size for attachments (10MB) */
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

/** Allowed MIME types for attachments */
export const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
] as const;

// ============================================
// TYPOGRAPHY
// ============================================

/** Standard tracking (letter-spacing) for body text */
export const TRACKING_BODY = '-0.02em';

/** Tight tracking for display text */
export const TRACKING_DISPLAY = '-0.02em';

/** Standard line height for tight text */
export const LINE_HEIGHT_TIGHT = 1.2;

/** Standard line height for relaxed text */
export const LINE_HEIGHT_RELAXED = 1.4;

// ============================================
// LAYOUT
// ============================================

/** Scroll offset for TOC navigation (pixels) */
export const SCROLL_OFFSET = 100;

/** Scroll offset for example reports navigation (pixels) */
export const EXAMPLE_REPORTS_SCROLL_OFFSET = 120;

// ============================================
// READING TIME
// ============================================

/** Words per minute for read time calculation (technical content) */
export const WORDS_PER_MINUTE = 200;
