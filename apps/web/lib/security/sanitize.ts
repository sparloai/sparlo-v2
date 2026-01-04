import 'server-only';

/**
 * Sanitizes user input to prevent XSS attacks
 * Uses simple regex-based sanitization to avoid jsdom dependency issues
 */
export function sanitizeHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .trim();
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
