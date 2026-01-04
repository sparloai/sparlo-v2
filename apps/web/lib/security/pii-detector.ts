import 'server-only';

const PII_PATTERNS: Record<string, RegExp> = {
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  password: /password\s*[:=]\s*['"]?([^\s'"]+)/gi,
  apiKey: /\b(sk-|pk-|api[_-]?key)[a-z0-9_-]{20,}\b/gi,
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
