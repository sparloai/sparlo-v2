import 'server-only';

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeHtml(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}

/**
 * Sanitizes input for use in AI prompts to prevent prompt injection
 */
export function sanitizeForPrompt(text: string): string {
  return text
    .replace(/```/g, '\\`\\`\\`') // Escape code blocks
    .replace(/<\|/g, '<\\|') // Escape special tokens
    .replace(/\|>/g, '\\|>')
    .replace(/\[SYSTEM\]/gi, '[SYS]') // Escape system markers
    .replace(/\[ESCALATE\]/g, '') // Remove escalation markers from user input
    .trim();
}

/**
 * Validates and sanitizes email format
 */
export function sanitizeEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.trim().toLowerCase();
  return emailRegex.test(sanitized) ? sanitized : null;
}

/**
 * Sanitizes user display name
 */
export function sanitizeDisplayName(name: string): string {
  return name
    .replace(/[<>{}]/g, '')
    .trim()
    .slice(0, 100);
}
