/**
 * Antifragile Schema Helpers for DD Report v2
 *
 * These helpers ensure LLM output NEVER crashes the parser.
 * Every field has sensible defaults and graceful degradation.
 */
import { z } from 'zod';

// ============================================
// SYNONYM MAPS - Handle LLM vocabulary drift
// ============================================
export const ENUM_SYNONYMS = {
  verdict: {
    GOOD: 'PROMISING',
    POSITIVE: 'PROMISING',
    YES: 'PROMISING',
    STRONG: 'PROMISING',
    FAVORABLE: 'PROMISING',
    RECOMMENDED: 'PROMISING',
    APPROVE: 'PROMISING',
    BAD: 'PASS',
    NEGATIVE: 'PASS',
    NO: 'PASS',
    REJECT: 'PASS',
    DECLINE: 'PASS',
    MAYBE: 'CAUTION',
    UNCERTAIN: 'CAUTION',
    MIXED: 'CAUTION',
    CONDITIONAL: 'CAUTION',
  },
  confidence: {
    VERY_HIGH: 'HIGH',
    STRONG: 'HIGH',
    CERTAIN: 'HIGH',
    CONFIDENT: 'HIGH',
    MODERATE: 'MEDIUM',
    PARTIAL: 'MEDIUM',
    SOME: 'MEDIUM',
    REASONABLE: 'MEDIUM',
    WEAK: 'LOW',
    UNCERTAIN: 'LOW',
    NONE: 'LOW',
    SPECULATIVE: 'LOW',
  },
  severity: {
    CRITICAL: 'HIGH',
    SEVERE: 'HIGH',
    MAJOR: 'HIGH',
    SIGNIFICANT: 'HIGH',
    MODERATE: 'MEDIUM',
    NOTABLE: 'MEDIUM',
    CONSIDERABLE: 'MEDIUM',
    MINOR: 'LOW',
    MINIMAL: 'LOW',
    NEGLIGIBLE: 'LOW',
    NONE: 'LOW',
  },
  moat: {
    STRONG: 'STRONG',
    DURABLE: 'STRONG',
    DEFENSIBLE: 'STRONG',
    MODERATE: 'MODERATE',
    MEDIUM: 'MODERATE',
    PARTIAL: 'MODERATE',
    WEAK: 'WEAK',
    THIN: 'WEAK',
    NONE: 'WEAK',
    MINIMAL: 'WEAK',
  },
  novelty: {
    NOVEL: 'NOVEL',
    NEW: 'NOVEL',
    BREAKTHROUGH: 'NOVEL',
    INNOVATIVE: 'NOVEL',
    INCREMENTAL: 'INCREMENTAL',
    IMPROVEMENT: 'INCREMENTAL',
    EVOLUTION: 'INCREMENTAL',
    DERIVATIVE: 'DERIVATIVE',
    COPY: 'DERIVATIVE',
    CLONE: 'DERIVATIVE',
    EXISTING: 'DERIVATIVE',
  },
  action: {
    PROCEED: 'PROCEED',
    GO: 'PROCEED',
    INVEST: 'PROCEED',
    YES: 'PROCEED',
    PROCEED_WITH_CAUTION: 'PROCEED_WITH_CAUTION',
    CONDITIONAL: 'PROCEED_WITH_CAUTION',
    CAUTION: 'PROCEED_WITH_CAUTION',
    MAYBE: 'PROCEED_WITH_CAUTION',
    PASS: 'PASS',
    NO: 'PASS',
    DECLINE: 'PASS',
    REJECT: 'PASS',
  },
  claimVerdict: {
    VALIDATED: 'VALIDATED',
    CONFIRMED: 'VALIDATED',
    VERIFIED: 'VALIDATED',
    TRUE: 'VALIDATED',
    PLAUSIBLE: 'PLAUSIBLE',
    LIKELY: 'PLAUSIBLE',
    PROBABLE: 'PLAUSIBLE',
    REASONABLE: 'PLAUSIBLE',
    QUESTIONABLE: 'QUESTIONABLE',
    DOUBTFUL: 'QUESTIONABLE',
    UNCERTAIN: 'QUESTIONABLE',
    INVALID: 'INVALID',
    FALSE: 'INVALID',
    DISPROVEN: 'INVALID',
    WRONG: 'INVALID',
  },
  findingType: {
    STRENGTH: 'STRENGTH',
    POSITIVE: 'STRENGTH',
    PRO: 'STRENGTH',
    ADVANTAGE: 'STRENGTH',
    WEAKNESS: 'WEAKNESS',
    NEGATIVE: 'WEAKNESS',
    CON: 'WEAKNESS',
    DISADVANTAGE: 'WEAKNESS',
    OPPORTUNITY: 'OPPORTUNITY',
    UPSIDE: 'OPPORTUNITY',
    POTENTIAL: 'OPPORTUNITY',
    THREAT: 'THREAT',
    RISK: 'THREAT',
    DANGER: 'THREAT',
    CONCERN: 'THREAT',
  },
} as const;

// ============================================
// SAFE ENUM - Ultra-robust enum parsing
// ============================================
export function safeEnum<T extends string>(
  values: readonly T[],
  defaultValue: T,
  synonymKey?: keyof typeof ENUM_SYNONYMS,
) {
  const synonymMap = synonymKey ? ENUM_SYNONYMS[synonymKey] : undefined;

  return z
    .preprocess((val) => {
      if (val === null || val === undefined) return defaultValue;
      if (typeof val !== 'string') return String(val);
      return val;
    }, z.string())
    .transform((s) => {
      // 1. Clean: trim, uppercase, strip annotations
      const cleaned =
        s
          .trim()
          .toUpperCase()
          .split(/[\s\-()[\]:,.!?]/)[0]
          ?.replace(/[^A-Z_0-9]/g, '')
          ?.trim() || '';

      // 2. Direct match
      if ((values as readonly string[]).includes(cleaned)) {
        return cleaned as T;
      }

      // 3. Synonym match
      if (synonymMap && cleaned in synonymMap) {
        const mapped = (synonymMap as Record<string, string>)[cleaned];
        if (mapped && (values as readonly string[]).includes(mapped)) {
          return mapped as T;
        }
      }

      // 4. Partial match (value starts with input or input starts with value)
      const partial = values.find(
        (v) =>
          cleaned.startsWith(v) ||
          v.startsWith(cleaned) ||
          cleaned.includes(v) ||
          v.includes(cleaned),
      );
      if (partial) return partial;

      // 5. Log and return default
      if (cleaned && process.env.NODE_ENV === 'development') {
        console.warn(
          `[DDReport] Unknown enum "${s}" for [${values.join(', ')}] -> "${defaultValue}"`,
        );
      }
      return defaultValue;
    })
    .catch(defaultValue);
}

// ============================================
// SAFE NUMBER - Handles all numeric formats
// ============================================
export function safeNumber(defaultValue: number, min = 0, max = 100) {
  return z
    .preprocess((val) => {
      if (val === null || val === undefined || val === '') return defaultValue;
      if (typeof val === 'number') {
        if (!Number.isFinite(val)) return defaultValue;
        return Math.max(min, Math.min(max, val));
      }
      if (typeof val === 'string') {
        // Extract number from "3.5 points", "7/10", "85%", "~3", ">5"
        const cleanedVal = val.replace(/[~<>≈]/g, '');
        const match = cleanedVal.match(/-?\d+\.?\d*/);
        if (match) {
          let num = parseFloat(match[0]);
          // Handle percentages for 0-10 scales
          if (val.includes('%') && num > max) {
            num = num / (100 / max);
          }
          // Handle fractions like "7/10"
          const fractionMatch = val.match(/(\d+)\s*\/\s*(\d+)/);
          if (fractionMatch) {
            num =
              (parseFloat(fractionMatch[1]!) / parseFloat(fractionMatch[2]!)) *
              max;
          }
          return Math.max(min, Math.min(max, num));
        }
      }
      return defaultValue;
    }, z.number())
    .catch(defaultValue);
}

// ============================================
// SAFE STRING - Sanitizes all text
// ============================================
export function safeString(maxLength = 10000) {
  return z
    .preprocess((val) => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'number' || typeof val === 'boolean')
        return String(val);
      if (typeof val !== 'string') return '';
      return val;
    }, z.string())
    .transform((s) => {
      let cleaned = s;
      // 1. Decode RTF escapes (\'97 -> —)
      cleaned = cleaned.replace(/\\'([0-9a-f]{2})/gi, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      );
      // 2. Decode common HTML entities
      const entities: Record<string, string> = {
        '&mdash;': '—',
        '&ndash;': '–',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&apos;': "'",
        '&nbsp;': ' ',
        '&hellip;': '…',
        '&bull;': '•',
        '&trade;': '™',
        '&copy;': '©',
      };
      for (const [entity, char] of Object.entries(entities)) {
        cleaned = cleaned.split(entity).join(char);
      }
      // 3. Decode numeric HTML entities
      cleaned = cleaned.replace(/&#(\d+);/g, (_, dec) =>
        String.fromCharCode(parseInt(dec)),
      );
      cleaned = cleaned.replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      );
      // 4. Normalize unicode
      cleaned = cleaned.normalize('NFC');
      // 5. Normalize whitespace (preserve single newlines)
      cleaned = cleaned
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      // 6. Truncate
      if (cleaned.length > maxLength) {
        cleaned = cleaned.slice(0, maxLength - 3) + '...';
      }
      return cleaned;
    })
    .catch('');
}

// ============================================
// SAFE OPTIONAL STRING - Empty = undefined
// ============================================
export function safeOptionalString(maxLength = 10000) {
  return safeString(maxLength)
    .transform((s) =>
      s === '' || s === 'null' || s === 'undefined' || s === 'N/A'
        ? undefined
        : s,
    )
    .optional()
    .catch(undefined);
}

// ============================================
// SAFE ARRAY - Resilient to malformed items
// ============================================
export function safeArray<T extends z.ZodTypeAny>(schema: T, maxItems = 100) {
  return z
    .preprocess(
      (val) => {
        if (val === null || val === undefined || val === '') return [];
        if (!Array.isArray(val)) {
          // Handle object with numeric keys
          if (typeof val === 'object' && val !== null) {
            const keys = Object.keys(val);
            if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k))) {
              return keys
                .sort((a, b) => +a - +b)
                .map((k) => (val as Record<string, unknown>)[k]);
            }
          }
          return [val]; // Wrap single item
        }
        return val;
      },
      z.array(schema.catch(undefined as never)),
    )
    .transform((arr) =>
      arr.filter((item) => item !== undefined && item !== null),
    )
    .transform((arr) => arr.slice(0, maxItems))
    .catch([]);
}

// ============================================
// SAFE BOOLEAN - Handles string booleans
// ============================================
export function safeBoolean(defaultValue = false) {
  return z
    .preprocess((val) => {
      if (val === null || val === undefined) return defaultValue;
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        const lower = val.toLowerCase().trim();
        if (['true', 'yes', '1', 'on', 'y'].includes(lower)) return true;
        if (['false', 'no', '0', 'off', 'n', ''].includes(lower)) return false;
      }
      if (typeof val === 'number') return val !== 0;
      return defaultValue;
    }, z.boolean())
    .catch(defaultValue);
}
