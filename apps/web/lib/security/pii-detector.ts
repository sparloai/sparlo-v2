import 'server-only';

// P2 Fix: Expanded PII patterns for comprehensive detection
const PII_PATTERNS: Record<string, RegExp> = {
  // Financial
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  bankAccount: /\b\d{8,17}\b/g, // Bank account numbers (8-17 digits)

  // Government IDs
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  ein: /\b\d{2}-\d{7}\b/g, // Employer Identification Number

  // Credentials
  password: /password\s*[:=]\s*['"]?([^\s'"]+)/gi,
  apiKey: /\b(sk-|pk-|api[_-]?key|secret[_-]?key)[a-z0-9_-]{20,}\b/gi,
  bearer: /bearer\s+[a-z0-9_-]{20,}/gi,
  privateKey: /-----BEGIN\s+(RSA\s+)?PRIVATE KEY-----/gi,

  // Contact info (basic patterns)
  phoneUS: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  email: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
};

export interface PIIDetectionResult {
  hasPII: boolean;
  detectedTypes: string[];
  redacted: string;
}

/**
 * Detects and optionally redacts PII from text
 */
export function detectPII(text: string): PIIDetectionResult {
  const detectedTypes: string[] = [];
  let redacted = text;

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    if (pattern.test(text)) {
      detectedTypes.push(type);
      redacted = redacted.replace(pattern, '[REDACTED]');
    }
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
  }

  return {
    hasPII: detectedTypes.length > 0,
    detectedTypes,
    redacted,
  };
}

/**
 * Validates that message doesn't contain sensitive information
 * Returns error message if PII detected, null if safe
 */
export function validateNoPII(text: string): string | null {
  const result = detectPII(text);

  if (result.hasPII) {
    return `Your message contains sensitive information (${result.detectedTypes.join(', ')}). Please remove it before sending.`;
  }

  return null;
}
