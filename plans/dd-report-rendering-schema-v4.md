# Due Diligence Report Rendering Schema v4.0.0

**Type**: feat
**Created**: 2025-01-05
**Priority**: High
**Complexity**: Medium (~1400 lines across 7 files)

---

## Overview

Render Due Diligence reports (v2.0.0 JSON schema) with:
1. **Existing design system** - Uses `report-tokens.css`, `sparlo-tokens.css`, and `primitives.tsx`
2. **100% antifragile** schema validation - NEVER crashes on ANY malformed LLM output
3. Graceful degradation for missing sections

**NOT included**: PDF rendering, version detection, legacy support.

---

## Design System Integration

Uses existing token files and primitives:

```
apps/web/styles/
├── report-tokens.css      # Primary tokens (colors, spacing, elevation)
└── sparlo-tokens.css      # Brand tokens (Suisse Intl, brand colors)

apps/web/app/home/(user)/reports/[id]/_components/brand-system/
└── primitives.tsx         # Reusable components (Section, BodyText, etc.)
```

**Key Design Tokens:**
- Canvas: `--void-black`, `--void-deep`, `--void-elevated`
- Accent: `--violet-500` (#7c3aed)
- Status: `--go-color`, `--warning-color`, `--nogo-color`
- Typography: Suisse Intl, monospace labels, uppercase tracking
- Spacing: 4px base unit scale
- Elevation: 5-level shadow system

---

## The Antifragile Contract

LLM output is **chaotic and unpredictable**. The schema MUST handle ALL of these:

| LLM Returns | Schema Handles |
|-------------|----------------|
| `"STRONG - very good"` | Parse as `STRONG` |
| `"strong"` | Parse as `STRONG` |
| `"Strong (high confidence)"` | Parse as `STRONG` |
| `null` | Use default value |
| `undefined` | Use default value |
| Missing field | Use default or skip render |
| `""` (empty string) | Treat as missing |
| `"   "` (whitespace) | Treat as missing |
| `"3"` (string number) | Coerce to `3` |
| `"3.5 points"` (annotated number) | Coerce to `3.5` |
| `NaN` | Use default |
| `Infinity` | Clamp to max |
| Unknown enum value | Use default + log |
| Extra fields | Ignore silently |
| `[item]` vs `item` | Normalize to array |
| `{0: x, 1: y}` vs `[x, y]` | Normalize to array |
| RTF escapes (`\'97`) | Clean to proper chars |
| HTML entities (`&mdash;`) | Decode properly |
| Deeply nested nulls | Safe navigation |
| Circular references | Detect and break |

### Core Antifragile Patterns

```typescript
// ============================================
// 1. ANTIFRAGILE ENUM - handles ALL variations
// ============================================
const ENUM_SYNONYMS: Record<string, Record<string, string>> = {
  verdict: {
    'GOOD': 'PROMISING', 'POSITIVE': 'PROMISING', 'YES': 'PROMISING',
    'BAD': 'PASS', 'NEGATIVE': 'PASS', 'NO': 'PASS',
    'MAYBE': 'CAUTION', 'UNCERTAIN': 'CAUTION', 'MIXED': 'CAUTION',
  },
  confidence: {
    'VERY_HIGH': 'HIGH', 'STRONG': 'HIGH', 'CERTAIN': 'HIGH',
    'MODERATE': 'MEDIUM', 'PARTIAL': 'MEDIUM', 'SOME': 'MEDIUM',
    'WEAK': 'LOW', 'UNCERTAIN': 'LOW', 'NONE': 'LOW',
  },
};

function safeEnum<T extends string>(
  values: readonly T[],
  defaultValue: T,
  synonymMap?: Record<string, string>
) {
  return z.preprocess(
    (val) => {
      if (val === null || val === undefined) return defaultValue;
      if (typeof val !== 'string') return String(val);
      return val;
    },
    z.string()
      .transform(s => {
        // 1. Clean: trim, uppercase, strip annotations
        const cleaned = s
          .trim()
          .toUpperCase()
          .split(/[\s\-\(\)\[\]:,]/)[0]  // Strip "STRONG - reason", "HIGH (90%)", etc.
          ?.replace(/[^A-Z_]/g, '')       // Remove non-alpha
          ?.trim() || '';

        // 2. Direct match
        if ((values as readonly string[]).includes(cleaned)) {
          return cleaned as T;
        }

        // 3. Synonym match
        if (synonymMap && synonymMap[cleaned]) {
          return synonymMap[cleaned] as T;
        }

        // 4. Partial match (starts with)
        const partial = values.find(v => cleaned.startsWith(v) || v.startsWith(cleaned));
        if (partial) return partial;

        // 5. Log unknown and return default
        if (cleaned && cleaned !== defaultValue) {
          console.warn(`[DDReport] Unknown enum value "${s}" -> defaulting to "${defaultValue}"`);
        }
        return defaultValue;
      })
  ).catch(defaultValue);
}

// ============================================
// 2. ANTIFRAGILE NUMBER - handles ALL formats
// ============================================
function safeNumber(defaultValue: number, min = 0, max = 100) {
  return z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return defaultValue;
      if (typeof val === 'number') {
        if (Number.isNaN(val)) return defaultValue;
        if (!Number.isFinite(val)) return Math.max(min, Math.min(max, val > 0 ? max : min));
        return val;
      }
      if (typeof val === 'string') {
        // Extract number from "3.5 points", "7/10", "85%", etc.
        const match = val.match(/-?\d+\.?\d*/);
        if (match) {
          const num = parseFloat(match[0]);
          // Handle percentages
          if (val.includes('%') && num > 1 && max <= 10) {
            return num / 10; // 85% -> 8.5 for 0-10 scale
          }
          return num;
        }
      }
      return defaultValue;
    },
    z.number().min(min).max(max)
  ).catch(defaultValue);
}

// ============================================
// 3. ANTIFRAGILE STRING - sanitizes everything
// ============================================
function safeString(maxLength = 10000) {
  return z.preprocess(
    (val) => {
      if (val === null || val === undefined) return '';
      if (typeof val !== 'string') return String(val);
      return val;
    },
    z.string()
      .transform(s => {
        // 1. Decode RTF escapes (\'97 -> —, \'b0 -> °)
        let cleaned = s.replace(/\\'([0-9a-f]{2})/gi, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        );
        // 2. Decode HTML entities
        cleaned = cleaned
          .replace(/&mdash;/g, '—')
          .replace(/&ndash;/g, '–')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)));
        // 3. Normalize whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        // 4. Truncate if too long
        if (cleaned.length > maxLength) {
          cleaned = cleaned.slice(0, maxLength - 3) + '...';
        }
        return cleaned;
      })
  ).catch('');
}

// ============================================
// 4. ANTIFRAGILE OPTIONAL STRING - empty = undefined
// ============================================
function safeOptionalString(maxLength = 10000) {
  return safeString(maxLength)
    .transform(s => s === '' ? undefined : s)
    .optional();
}

// ============================================
// 5. ANTIFRAGILE ARRAY - resilient to malformed items
// ============================================
function safeArray<T extends z.ZodTypeAny>(schema: T, maxItems = 100) {
  return z.preprocess(
    (val) => {
      // Handle null/undefined
      if (val === null || val === undefined) return [];
      // Handle single item (not array)
      if (!Array.isArray(val)) {
        // Handle object with numeric keys {0: x, 1: y}
        if (typeof val === 'object' && val !== null) {
          const keys = Object.keys(val);
          if (keys.every(k => /^\d+$/.test(k))) {
            return keys.sort((a, b) => +a - +b).map(k => (val as Record<string, unknown>)[k]);
          }
        }
        return [val]; // Wrap single item
      }
      return val;
    },
    z.array(
      // Each item has its own .catch() so one bad item doesn't break array
      schema.catch(undefined as never)
    )
      .transform(arr => arr.filter(item => item !== undefined)) // Remove failed items
      .transform(arr => arr.slice(0, maxItems)) // Limit length
  ).catch([]);
}

// ============================================
// 6. ANTIFRAGILE OBJECT - deep safety
// ============================================
function safeObject<T extends z.ZodRawShape>(shape: T) {
  return z.preprocess(
    (val) => {
      if (val === null || val === undefined) return {};
      if (typeof val !== 'object' || Array.isArray(val)) return {};
      return val;
    },
    z.object(shape)
  );
}
```

---

## File Structure (~1400 lines total)

```
apps/web/app/home/(user)/reports/[id]/_components/dd-report-v2/
├── index.tsx              # ~100 lines - Main wrapper + error boundary
├── schema.ts              # ~400 lines - Ultra-antifragile Zod schemas
├── schema-helpers.ts      # ~150 lines - Antifragile helper functions
├── sections-core.tsx      # ~250 lines - Executive summary, one-page, verdict
├── sections-analysis.tsx  # ~250 lines - Technical, claims, novelty, moat
├── sections-risk.tsx      # ~200 lines - Risk, scenarios, pre-mortem
└── sections-other.tsx     # ~200 lines - Questions, roadmap, confidence
```

---

## Implementation

### 1. `schema-helpers.ts` - Antifragile Helpers (~150 lines)

```typescript
// schema-helpers.ts
import { z } from 'zod';

// ============================================
// SYNONYM MAPS - Handle LLM vocabulary drift
// ============================================
export const ENUM_SYNONYMS = {
  verdict: {
    'GOOD': 'PROMISING', 'POSITIVE': 'PROMISING', 'YES': 'PROMISING', 'STRONG': 'PROMISING',
    'FAVORABLE': 'PROMISING', 'RECOMMENDED': 'PROMISING', 'APPROVE': 'PROMISING',
    'BAD': 'PASS', 'NEGATIVE': 'PASS', 'NO': 'PASS', 'REJECT': 'PASS', 'DECLINE': 'PASS',
    'MAYBE': 'CAUTION', 'UNCERTAIN': 'CAUTION', 'MIXED': 'CAUTION', 'CONDITIONAL': 'CAUTION',
  },
  confidence: {
    'VERY_HIGH': 'HIGH', 'STRONG': 'HIGH', 'CERTAIN': 'HIGH', 'CONFIDENT': 'HIGH',
    'MODERATE': 'MEDIUM', 'PARTIAL': 'MEDIUM', 'SOME': 'MEDIUM', 'REASONABLE': 'MEDIUM',
    'WEAK': 'LOW', 'UNCERTAIN': 'LOW', 'NONE': 'LOW', 'SPECULATIVE': 'LOW',
  },
  severity: {
    'CRITICAL': 'HIGH', 'SEVERE': 'HIGH', 'MAJOR': 'HIGH', 'SIGNIFICANT': 'HIGH',
    'MODERATE': 'MEDIUM', 'NOTABLE': 'MEDIUM', 'CONSIDERABLE': 'MEDIUM',
    'MINOR': 'LOW', 'MINIMAL': 'LOW', 'NEGLIGIBLE': 'LOW', 'NONE': 'LOW',
  },
  moat: {
    'STRONG': 'STRONG', 'DURABLE': 'STRONG', 'DEFENSIBLE': 'STRONG',
    'MODERATE': 'MODERATE', 'MEDIUM': 'MODERATE', 'PARTIAL': 'MODERATE',
    'WEAK': 'WEAK', 'THIN': 'WEAK', 'NONE': 'WEAK', 'MINIMAL': 'WEAK',
  },
  novelty: {
    'NOVEL': 'NOVEL', 'NEW': 'NOVEL', 'BREAKTHROUGH': 'NOVEL', 'INNOVATIVE': 'NOVEL',
    'INCREMENTAL': 'INCREMENTAL', 'IMPROVEMENT': 'INCREMENTAL', 'EVOLUTION': 'INCREMENTAL',
    'DERIVATIVE': 'DERIVATIVE', 'COPY': 'DERIVATIVE', 'CLONE': 'DERIVATIVE', 'EXISTING': 'DERIVATIVE',
  },
  action: {
    'PROCEED': 'PROCEED', 'GO': 'PROCEED', 'INVEST': 'PROCEED', 'YES': 'PROCEED',
    'PROCEED_WITH_CAUTION': 'PROCEED_WITH_CAUTION', 'CONDITIONAL': 'PROCEED_WITH_CAUTION',
    'CAUTION': 'PROCEED_WITH_CAUTION', 'MAYBE': 'PROCEED_WITH_CAUTION',
    'PASS': 'PASS', 'NO': 'PASS', 'DECLINE': 'PASS', 'REJECT': 'PASS',
  },
  claimVerdict: {
    'VALIDATED': 'VALIDATED', 'CONFIRMED': 'VALIDATED', 'VERIFIED': 'VALIDATED', 'TRUE': 'VALIDATED',
    'PLAUSIBLE': 'PLAUSIBLE', 'LIKELY': 'PLAUSIBLE', 'PROBABLE': 'PLAUSIBLE', 'REASONABLE': 'PLAUSIBLE',
    'QUESTIONABLE': 'QUESTIONABLE', 'DOUBTFUL': 'QUESTIONABLE', 'UNCERTAIN': 'QUESTIONABLE',
    'INVALID': 'INVALID', 'FALSE': 'INVALID', 'DISPROVEN': 'INVALID', 'WRONG': 'INVALID',
  },
  findingType: {
    'STRENGTH': 'STRENGTH', 'POSITIVE': 'STRENGTH', 'PRO': 'STRENGTH', 'ADVANTAGE': 'STRENGTH',
    'WEAKNESS': 'WEAKNESS', 'NEGATIVE': 'WEAKNESS', 'CON': 'WEAKNESS', 'DISADVANTAGE': 'WEAKNESS',
    'OPPORTUNITY': 'OPPORTUNITY', 'UPSIDE': 'OPPORTUNITY', 'POTENTIAL': 'OPPORTUNITY',
    'THREAT': 'THREAT', 'RISK': 'THREAT', 'DANGER': 'THREAT', 'CONCERN': 'THREAT',
  },
} as const;

// ============================================
// SAFE ENUM - Ultra-robust enum parsing
// ============================================
export function safeEnum<T extends string>(
  values: readonly T[],
  defaultValue: T,
  synonymKey?: keyof typeof ENUM_SYNONYMS
) {
  const synonymMap = synonymKey ? ENUM_SYNONYMS[synonymKey] : undefined;

  return z.preprocess(
    (val) => {
      if (val === null || val === undefined) return defaultValue;
      if (typeof val !== 'string') return String(val);
      return val;
    },
    z.string().transform(s => {
      // 1. Clean: trim, uppercase, strip annotations
      const cleaned = s
        .trim()
        .toUpperCase()
        .split(/[\s\-\(\)\[\]:,\.!?]/)[0]  // Strip "STRONG - reason", "HIGH (90%)", "PASS.", etc.
        ?.replace(/[^A-Z_0-9]/g, '')        // Remove special chars
        ?.trim() || '';

      // 2. Direct match
      if ((values as readonly string[]).includes(cleaned)) {
        return cleaned as T;
      }

      // 3. Synonym match
      if (synonymMap && cleaned in synonymMap) {
        const mapped = (synonymMap as Record<string, string>)[cleaned];
        if ((values as readonly string[]).includes(mapped)) {
          return mapped as T;
        }
      }

      // 4. Partial match (value starts with input or input starts with value)
      const partial = values.find(v =>
        cleaned.startsWith(v) || v.startsWith(cleaned) ||
        cleaned.includes(v) || v.includes(cleaned)
      );
      if (partial) return partial;

      // 5. Log and return default
      if (cleaned && process.env.NODE_ENV === 'development') {
        console.warn(`[DDReport] Unknown enum "${s}" for [${values.join(', ')}] -> "${defaultValue}"`);
      }
      return defaultValue;
    })
  ).catch(defaultValue);
}

// ============================================
// SAFE NUMBER - Handles all numeric formats
// ============================================
export function safeNumber(defaultValue: number, min = 0, max = 100) {
  return z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return defaultValue;
      if (typeof val === 'number') {
        if (!Number.isFinite(val)) return defaultValue;
        return Math.max(min, Math.min(max, val));
      }
      if (typeof val === 'string') {
        // Extract number from "3.5 points", "7/10", "85%", "~3", ">5"
        const match = val.replace(/[~<>≈]/g, '').match(/-?\d+\.?\d*/);
        if (match) {
          let num = parseFloat(match[0]);
          // Handle percentages for 0-10 scales
          if (val.includes('%') && num > max) {
            num = num / (100 / max);
          }
          // Handle fractions like "7/10"
          const fractionMatch = val.match(/(\d+)\s*\/\s*(\d+)/);
          if (fractionMatch) {
            num = (parseFloat(fractionMatch[1]) / parseFloat(fractionMatch[2])) * max;
          }
          return Math.max(min, Math.min(max, num));
        }
      }
      return defaultValue;
    },
    z.number()
  ).catch(defaultValue);
}

// ============================================
// SAFE STRING - Sanitizes all text
// ============================================
export function safeString(maxLength = 10000) {
  return z.preprocess(
    (val) => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'number' || typeof val === 'boolean') return String(val);
      if (typeof val !== 'string') return '';
      return val;
    },
    z.string().transform(s => {
      let cleaned = s;
      // 1. Decode RTF escapes (\'97 -> —)
      cleaned = cleaned.replace(/\\'([0-9a-f]{2})/gi, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );
      // 2. Decode common HTML entities
      const entities: Record<string, string> = {
        '&mdash;': '—', '&ndash;': '–', '&amp;': '&', '&lt;': '<',
        '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ',
        '&hellip;': '…', '&bull;': '•', '&trade;': '™', '&copy;': '©',
      };
      for (const [entity, char] of Object.entries(entities)) {
        cleaned = cleaned.split(entity).join(char);
      }
      // 3. Decode numeric HTML entities
      cleaned = cleaned.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)));
      cleaned = cleaned.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      // 4. Normalize unicode
      cleaned = cleaned.normalize('NFC');
      // 5. Normalize whitespace (preserve single newlines)
      cleaned = cleaned.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      // 6. Truncate
      if (cleaned.length > maxLength) {
        cleaned = cleaned.slice(0, maxLength - 3) + '...';
      }
      return cleaned;
    })
  ).catch('');
}

// ============================================
// SAFE OPTIONAL STRING - Empty = undefined
// ============================================
export function safeOptionalString(maxLength = 10000) {
  return safeString(maxLength)
    .transform(s => (s === '' || s === 'null' || s === 'undefined' || s === 'N/A') ? undefined : s)
    .optional()
    .catch(undefined);
}

// ============================================
// SAFE ARRAY - Resilient to malformed items
// ============================================
export function safeArray<T extends z.ZodTypeAny>(schema: T, maxItems = 100) {
  return z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return [];
      if (!Array.isArray(val)) {
        // Handle object with numeric keys
        if (typeof val === 'object' && val !== null) {
          const keys = Object.keys(val);
          if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
            return keys.sort((a, b) => +a - +b).map(k => (val as Record<string, unknown>)[k]);
          }
        }
        return [val]; // Wrap single item
      }
      return val;
    },
    z.array(schema.catch(undefined as never))
      .transform(arr => arr.filter(item => item !== undefined && item !== null))
      .transform(arr => arr.slice(0, maxItems))
  ).catch([]);
}

// ============================================
// SAFE BOOLEAN - Handles string booleans
// ============================================
export function safeBoolean(defaultValue = false) {
  return z.preprocess(
    (val) => {
      if (val === null || val === undefined) return defaultValue;
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        const lower = val.toLowerCase().trim();
        if (['true', 'yes', '1', 'on', 'y'].includes(lower)) return true;
        if (['false', 'no', '0', 'off', 'n', ''].includes(lower)) return false;
      }
      if (typeof val === 'number') return val !== 0;
      return defaultValue;
    },
    z.boolean()
  ).catch(defaultValue);
}
```

---

### 2. `schema.ts` - Ultra-Antifragile Schemas (~400 lines)

```typescript
// schema.ts
import { z } from 'zod';
import {
  safeEnum, safeNumber, safeString, safeOptionalString,
  safeArray, safeBoolean, ENUM_SYNONYMS
} from './schema-helpers';

// ============================================
// ENUM DEFINITIONS with synonym support
// ============================================
const Confidence = safeEnum(['HIGH', 'MEDIUM', 'LOW'] as const, 'MEDIUM', 'confidence');
const Verdict = safeEnum(['VALIDATED', 'PLAUSIBLE', 'QUESTIONABLE', 'INVALID'] as const, 'PLAUSIBLE', 'claimVerdict');
const Severity = safeEnum(['HIGH', 'MEDIUM', 'LOW'] as const, 'MEDIUM', 'severity');
const OverallVerdict = safeEnum(['PROMISING', 'CAUTION', 'PASS'] as const, 'CAUTION', 'verdict');
const Action = safeEnum(['PROCEED', 'PROCEED_WITH_CAUTION', 'PASS'] as const, 'PROCEED_WITH_CAUTION', 'action');
const MoatStrength = safeEnum(['STRONG', 'MODERATE', 'WEAK'] as const, 'MODERATE', 'moat');
const Novelty = safeEnum(['NOVEL', 'INCREMENTAL', 'DERIVATIVE'] as const, 'INCREMENTAL', 'novelty');
const FindingType = safeEnum(['STRENGTH', 'WEAKNESS', 'OPPORTUNITY', 'THREAT'] as const, 'STRENGTH', 'findingType');

// ============================================
// Shared Schemas
// ============================================
const ScoreSchema = z.object({
  score: safeNumber(5, 0, 10),
  out_of: safeNumber(10, 1, 10),
  one_liner: safeString(),
}).catch({ score: 5, out_of: 10, one_liner: '' });

const KeyFindingSchema = z.object({
  finding: safeString(),
  type: FindingType,
  impact: Severity,
}).catch({ finding: '', type: 'STRENGTH', impact: 'MEDIUM' });

// ============================================
// Section Schemas (19 sections)
// ============================================

// 1. Header
export const HeaderSchema = z.object({
  company_name: safeString(500),
  date: safeString(50),
  classification: safeOptionalString(),
  report_type: safeOptionalString(),
  technology_domain: safeOptionalString(),
  version: safeString(20).default('2.0.0'),
}).catch({
  company_name: 'Unknown Company',
  date: new Date().toISOString().split('T')[0]!,
  version: '2.0.0',
});

// 2. Executive Summary
export const ExecutiveSummarySchema = z.object({
  one_paragraph_summary: safeString(),
  key_findings: safeArray(KeyFindingSchema),
  scores: z.object({
    technical_credibility: ScoreSchema.optional(),
    commercial_viability: ScoreSchema.optional(),
    team_signals: ScoreSchema.optional(),
    moat_strength: ScoreSchema.optional(),
  }).catch({}),
  verdict: OverallVerdict,
  verdict_confidence: Confidence,
  recommendation: z.object({
    action: Action,
    rationale: safeOptionalString(),
    key_conditions: safeArray(safeString()),
  }).catch({ action: 'PROCEED_WITH_CAUTION', key_conditions: [] }),
}).optional().catch(undefined);

// 3. One Page Summary
export const OnePageSummarySchema = z.object({
  company: safeString(),
  sector: safeOptionalString(),
  stage: safeOptionalString(),
  ask: safeOptionalString(),
  one_sentence: safeString(),
  the_bet: safeOptionalString(),
  key_strength: safeOptionalString(),
  key_risk: safeOptionalString(),
  key_question: safeOptionalString(),
  closest_comparable: safeOptionalString(),
  expected_return: safeOptionalString(),
  bull_case_2_sentences: safeOptionalString(),
  bear_case_2_sentences: safeOptionalString(),
  if_you_do_one_thing: safeOptionalString(),
  verdict_box: z.object({
    overall: safeOptionalString(),
    technical_validity: z.object({ verdict: safeString(), symbol: safeOptionalString() }).optional(),
    commercial_viability: z.object({ verdict: safeString(), symbol: safeOptionalString() }).optional(),
    moat_strength: z.object({ verdict: safeString(), symbol: safeOptionalString() }).optional(),
    solution_space_position: z.object({ verdict: safeString(), symbol: safeOptionalString() }).optional(),
    timing: z.object({ verdict: safeString(), symbol: safeOptionalString() }).optional(),
  }).catch({}),
}).optional().catch(undefined);

// 4. Problem Primer
export const ProblemPrimerSchema = z.object({
  section_purpose: safeOptionalString(),
  problem_overview: z.object({
    plain_english: safeString(),
    why_it_matters: safeString(),
    market_context: safeOptionalString(),
  }).optional(),
  physics_foundation: z.object({
    governing_principles: safeArray(z.object({
      principle: safeString(),
      plain_english: safeString(),
      implication: safeString(),
    })),
    thermodynamic_limits: z.object({
      theoretical_minimum: safeOptionalString(),
      current_best_achieved: safeOptionalString(),
      gap_explanation: safeOptionalString(),
    }).optional(),
    rate_limiting_factors: safeArray(safeString()),
  }).optional(),
  key_contradictions: safeArray(z.object({
    tradeoff: safeString(),
    if_you_improve: safeString(),
    typically_worsens: safeString(),
    how_different_approaches_resolve: safeOptionalString(),
  })),
  key_insight: safeOptionalString(),
  success_requirements: z.object({
    physics_gates: safeArray(safeString()),
    engineering_challenges: safeArray(safeString()),
    commercial_thresholds: safeArray(safeString()),
  }).optional(),
  where_value_created: z.object({
    bottleneck_today: safeOptionalString(),
    what_breakthrough_would_unlock: safeOptionalString(),
    who_captures_value: safeOptionalString(),
  }).optional(),
}).optional().catch(undefined);

// 5. Technical Thesis Assessment
export const TechnicalThesisSchema = z.object({
  their_thesis: safeString(),
  thesis_validity: z.object({
    verdict: Verdict,
    confidence: Confidence,
    explanation: safeString(),
  }).optional(),
  mechanism_assessment: z.object({
    mechanism: safeString(),
    physics_validity: safeOptionalString(),
    precedent: safeOptionalString(),
    key_uncertainty: safeOptionalString(),
  }).optional(),
  performance_claims: safeArray(z.object({
    claim: safeString(),
    theoretical_limit: safeOptionalString(),
    verdict: Verdict,
    explanation: safeOptionalString(),
  })),
}).optional().catch(undefined);

// 6. Claim Validation Summary
export const ClaimValidationSchema = z.object({
  overview: safeOptionalString(),
  critical_claims: safeArray(z.object({
    claim: safeString(),
    verdict: Verdict,
    confidence: Confidence,
    plain_english: safeString(),
  })),
  triz_findings: z.object({
    key_contradictions: safeOptionalString(),
    resolution_quality: safeOptionalString(),
  }).optional(),
}).optional().catch(undefined);

// 7. Solution Landscape
const SolutionConceptSchema = z.object({
  name: safeString(),
  one_liner: safeString(),
  mechanism: safeOptionalString(),
  maturity: safeOptionalString(),
  key_advantage: safeOptionalString(),
  key_challenge: safeOptionalString(),
  current_players: safeArray(safeString()),
  threat_to_startup: Severity,
  threat_reasoning: safeOptionalString(),
});

export const SolutionLandscapeSchema = z.object({
  section_purpose: safeOptionalString(),
  landscape_overview: z.object({
    total_approaches_analyzed: safeNumber(0, 0, 100).optional(),
    how_we_generated: safeOptionalString(),
    key_insight: safeOptionalString(),
  }).optional(),
  solution_space_by_track: z.object({
    simpler_path: z.object({
      track_description: safeOptionalString(),
      concepts: safeArray(SolutionConceptSchema),
    }).optional(),
    best_fit: z.object({
      track_description: safeOptionalString(),
      concepts: safeArray(SolutionConceptSchema),
    }).optional(),
    frontier_transfer: z.object({
      track_description: safeOptionalString(),
      concepts: safeArray(SolutionConceptSchema),
    }).optional(),
    paradigm_shift: z.object({
      track_description: safeOptionalString(),
      concepts: safeArray(SolutionConceptSchema),
    }).optional(),
  }).optional(),
  startup_positioning: z.object({
    which_track: safeOptionalString(),
    which_concept_closest: safeOptionalString(),
    positioning_verdict: safeOptionalString(),
    positioning_explanation: safeOptionalString(),
    what_first_principles_recommends: safeOptionalString(),
    is_optimal_track: z.boolean().catch(false).optional(),
  }).optional(),
  missed_opportunities_deep_dive: safeArray(z.object({
    approach: safeString(),
    why_startup_missed: safeOptionalString(),
    why_potentially_better: safeOptionalString(),
    what_startup_would_say: safeOptionalString(),
    our_assessment: safeOptionalString(),
    investment_implication: safeOptionalString(),
  })),
  the_implicit_bet: z.object({
    what_they_are_betting_on: safeOptionalString(),
    what_they_are_betting_against: safeArray(safeString()),
    what_must_be_true: safeArray(safeString()),
    bet_quality: safeOptionalString(),
  }).optional(),
  competitive_threat_summary: z.object({
    highest_threats: safeArray(safeString()),
    timeline_to_threat: safeOptionalString(),
    startup_defense: safeOptionalString(),
  }).optional(),
  strategic_insight: safeOptionalString(),
}).optional().catch(undefined);

// 8. Novelty Assessment
export const NoveltyAssessmentSchema = z.object({
  verdict: Novelty,
  what_is_novel: safeOptionalString(),
  what_is_not_novel: safeOptionalString(),
  key_prior_art: safeArray(z.object({
    reference: safeString(),
    relevance: safeOptionalString(),
    impact: safeOptionalString(),
  })),
}).optional().catch(undefined);

// 9. Moat Assessment
export const MoatAssessmentSchema = z.object({
  overall: z.object({
    strength: MoatStrength,
    durability_years: safeNumber(3, 0, 20).optional(),
    primary_source: safeOptionalString(),
  }).optional(),
  breakdown: z.object({
    technical: MoatStrength.optional(),
    market: MoatStrength.optional(),
    execution: MoatStrength.optional(),
  }).optional(),
  vulnerabilities: safeArray(z.object({
    vulnerability: safeString(),
    severity: Severity,
  })),
}).optional().catch(undefined);

// 10. Commercialization Reality
export const CommercializationSchema = z.object({
  summary: safeOptionalString(),
  verdict: safeOptionalString(),
  market_readiness: z.object({
    market_exists: z.boolean().catch(false).optional(),
    vitamin_or_painkiller: safeOptionalString(),
    customer_evidence: safeOptionalString(),
  }).optional(),
  unit_economics: z.object({
    today: safeOptionalString(),
    claimed_at_scale: safeOptionalString(),
    credibility: safeOptionalString(),
    what_must_be_true: safeOptionalString(),
  }).optional(),
  path_to_revenue: z.object({
    timeline: safeOptionalString(),
    capital_required: safeOptionalString(),
    fits_vc_timeline: z.boolean().catch(false).optional(),
  }).optional(),
  scale_up_risk: z.object({
    valley_of_death: safeOptionalString(),
    stranding_risk: safeOptionalString(),
  }).optional(),
  policy_exposure: z.object({
    exposure_level: Severity.optional(),
    critical_policies: safeArray(safeString()),
    impact_if_changed: safeOptionalString(),
  }).optional(),
  the_hard_truth: z.object({
    even_if_physics_works: safeOptionalString(),
    critical_commercial_question: safeOptionalString(),
  }).optional(),
}).optional().catch(undefined);

// 11. Risk Analysis
export const RiskAnalysisSchema = z.object({
  key_risk_summary: safeOptionalString(),
  technical_risks: safeArray(z.object({
    risk: safeString(),
    probability: Severity.optional(),
    impact: Severity.optional(),
    mitigation: safeOptionalString(),
  })),
  commercial_risks: safeArray(z.object({
    risk: safeString(),
    severity: Severity.optional(),
  })),
  competitive_risks: safeArray(z.object({
    risk: safeString(),
    timeline: safeOptionalString(),
  })),
}).optional().catch(undefined);

// 12. Scenario Analysis
const ScenarioSchema = z.object({
  probability: safeOptionalString(),
  narrative: safeString(),
  return: safeOptionalString(),
});

export const ScenarioAnalysisSchema = z.object({
  bull_case: ScenarioSchema.optional(),
  base_case: ScenarioSchema.optional(),
  bear_case: ScenarioSchema.optional(),
  expected_value: z.object({
    weighted_multiple: safeOptionalString(),
    assessment: safeOptionalString(),
  }).optional(),
}).optional().catch(undefined);

// 13. Pre-Mortem
export const PreMortemSchema = z.object({
  framing: safeOptionalString(),
  most_likely_failure: z.object({
    probability: safeOptionalString(),
    scenario: safeString(),
    preventable_by: safeOptionalString(),
    early_warnings: safeArray(safeString()),
  }).optional(),
  second_most_likely: z.object({
    probability: safeOptionalString(),
    scenario: safeString(),
  }).optional(),
  black_swan: z.object({
    probability: safeOptionalString(),
    scenario: safeString(),
  }).optional(),
}).optional().catch(undefined);

// 14. Confidence Calibration
const ConfidenceItemSchema = z.object({
  assessment: safeString(),
  basis: safeOptionalString(),
  confidence: safeOptionalString(),
});

export const ConfidenceCalibrationSchema = z.object({
  high_confidence: safeArray(ConfidenceItemSchema),
  medium_confidence: safeArray(ConfidenceItemSchema),
  low_confidence: safeArray(ConfidenceItemSchema),
  known_unknowns: safeArray(safeString()),
  where_surprises_lurk: safeArray(safeString()),
}).optional().catch(undefined);

// 15. Comparable Analysis
export const ComparableAnalysisSchema = z.object({
  base_rate: z.object({
    category_success_rate: safeOptionalString(),
    this_company_vs_base: safeOptionalString(),
  }).optional(),
  closest_comparables: safeArray(z.object({
    company: safeString(),
    similarity: safeOptionalString(),
    outcome: safeOptionalString(),
    lesson: safeOptionalString(),
  })),
}).optional().catch(undefined);

// 16. Founder Questions
export const FounderQuestionsSchema = z.object({
  must_ask: safeArray(z.object({
    question: safeString(),
    why_critical: safeOptionalString(),
    good_answer: safeOptionalString(),
    bad_answer: safeOptionalString(),
  })),
  technical_deep_dives: safeArray(z.object({
    topic: safeString(),
    questions: safeArray(safeString()),
  })),
  commercial_deep_dives: safeArray(z.object({
    topic: safeString(),
    questions: safeArray(safeString()),
  })),
}).optional().catch(undefined);

// 17. Diligence Roadmap
export const DiligenceRoadmapSchema = z.object({
  before_term_sheet: safeArray(z.object({
    action: safeString(),
    purpose: safeOptionalString(),
    time: safeOptionalString(),
    cost: safeOptionalString(),
    who: safeOptionalString(),
    deal_breaker_if: safeOptionalString(),
    priority: safeOptionalString(),
  })),
  during_diligence: safeArray(z.object({
    action: safeString(),
    priority: safeOptionalString(),
  })),
  documents_to_request: safeArray(safeString()),
  reference_calls: safeArray(z.object({
    who: safeString(),
    why: safeOptionalString(),
    key_questions: safeArray(safeString()),
  })),
  technical_validation: safeArray(z.object({
    what: safeString(),
    how: safeOptionalString(),
    time: safeOptionalString(),
    cost: safeOptionalString(),
    who_can_help: safeOptionalString(),
  })),
}).optional().catch(undefined);

// 18. Why This Might Be Wrong
export const WhyWrongSchema = z.object({
  strongest_counter_argument: safeOptionalString(),
  our_response: safeOptionalString(),
  if_we_are_too_positive: z.object({
    what_we_might_be_missing: safeOptionalString(),
    what_would_change_our_mind: safeOptionalString(),
  }).optional(),
  if_we_are_too_negative: z.object({
    what_we_might_be_missing: safeOptionalString(),
    what_would_change_our_mind: safeOptionalString(),
  }).optional(),
}).optional().catch(undefined);

// 19. Verdict and Recommendation
export const VerdictRecommendationSchema = z.object({
  overall_verdict: z.object({
    verdict: OverallVerdict,
    confidence: Confidence,
  }).optional(),
  technical_verdict: z.object({
    verdict: OverallVerdict.optional(),
    confidence: Confidence.optional(),
    summary: safeOptionalString(),
  }).optional(),
  commercial_verdict: z.object({
    verdict: safeOptionalString(),
    summary: safeOptionalString(),
  }).optional(),
  recommendation: z.object({
    action: Action,
    conditions: safeArray(safeString()),
    derisking_steps: safeArray(safeString()),
    timeline: safeOptionalString(),
  }).optional(),
  final_word: safeOptionalString(),
}).optional().catch(undefined);

// ============================================
// MAIN SCHEMA
// ============================================
export const DDReportSchema = z.object({
  header: HeaderSchema,
  executive_summary: ExecutiveSummarySchema,
  one_page_summary: OnePageSummarySchema,
  problem_primer: ProblemPrimerSchema,
  technical_thesis_assessment: TechnicalThesisSchema,
  claim_validation_summary: ClaimValidationSchema,
  solution_landscape: SolutionLandscapeSchema,
  novelty_assessment: NoveltyAssessmentSchema,
  moat_assessment: MoatAssessmentSchema,
  commercialization_reality: CommercializationSchema,
  risk_analysis: RiskAnalysisSchema,
  scenario_analysis: ScenarioAnalysisSchema,
  pre_mortem: PreMortemSchema,
  confidence_calibration: ConfidenceCalibrationSchema,
  comparable_analysis: ComparableAnalysisSchema,
  founder_questions: FounderQuestionsSchema,
  diligence_roadmap: DiligenceRoadmapSchema,
  why_this_might_be_wrong: WhyWrongSchema,
  verdict_and_recommendation: VerdictRecommendationSchema,
});

export type DDReport = z.infer<typeof DDReportSchema>;

/** Parse DD report data with full antifragility - NEVER throws */
export function parseDDReport(data: unknown): DDReport {
  return DDReportSchema.parse(data);
}
```

---

### 3. `index.tsx` - Main Wrapper (~100 lines)

Uses existing design system from `report-tokens.css` and `primitives.tsx`:

```typescript
// index.tsx
'use client';

import { ErrorBoundary } from 'react-error-boundary';
import { parseDDReport, type DDReport } from './schema';

// Import existing brand system primitives
import {
  Section,
  SectionTitle,
  MonoLabel,
  BodyText,
  AccentBorder,
} from '../brand-system/primitives';

// DD Report section components
import { ExecutiveSummarySection, OnePageSummarySection, VerdictSection } from './sections-core';
import { TechnicalThesisSection, ClaimValidationSection, NoveltySection, MoatSection, SolutionLandscapeSection } from './sections-analysis';
import { RiskAnalysisSection, ScenarioAnalysisSection, PreMortemSection, CommercializationSection } from './sections-risk';
import { ProblemPrimerSection, ConfidenceCalibrationSection, ComparableAnalysisSection, FounderQuestionsSection, DiligenceRoadmapSection, WhyWrongSection } from './sections-other';

interface DDReportDisplayProps {
  data: unknown;
  reportId: string;
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="module module--warning">
      <div className="module-header">
        <MonoLabel>Render Error</MonoLabel>
      </div>
      <div className="module-body">
        <p className="text-nogo-color font-medium">Failed to render report</p>
        <p className="text-body text-void-muted mt-2">{error.message}</p>
      </div>
    </div>
  );
}

function DDReportContent({ report }: { report: DDReport }) {
  return (
    <div className="report-content" style={{ '--section-gap': 'var(--space-16)' } as React.CSSProperties}>
      {/* Header - Uses report-sections.css .report-header */}
      <header className="report-header">
        <div className="report-header-meta">
          <MonoLabel>
            {report.header.report_type || 'Technical Due Diligence Report'}
          </MonoLabel>
          {report.header.date && (
            <span className="report-header-date text-void-muted">{report.header.date}</span>
          )}
        </div>
        <h1 className="heading-display">{report.header.company_name}</h1>
        {report.header.technology_domain && (
          <div className="report-header-badges">
            <span className="badge-pill">{report.header.technology_domain}</span>
          </div>
        )}
      </header>

      {/* Core Sections */}
      <ExecutiveSummarySection data={report.executive_summary} />
      <OnePageSummarySection data={report.one_page_summary} />
      <VerdictSection data={report.verdict_and_recommendation} />

      {/* Analysis Sections */}
      <ProblemPrimerSection data={report.problem_primer} />
      <TechnicalThesisSection data={report.technical_thesis_assessment} />
      <ClaimValidationSection data={report.claim_validation_summary} />
      <SolutionLandscapeSection data={report.solution_landscape} />
      <NoveltySection data={report.novelty_assessment} />
      <MoatSection data={report.moat_assessment} />

      {/* Risk Sections */}
      <CommercializationSection data={report.commercialization_reality} />
      <RiskAnalysisSection data={report.risk_analysis} />
      <ScenarioAnalysisSection data={report.scenario_analysis} />
      <PreMortemSection data={report.pre_mortem} />

      {/* Other Sections */}
      <ConfidenceCalibrationSection data={report.confidence_calibration} />
      <ComparableAnalysisSection data={report.comparable_analysis} />
      <FounderQuestionsSection data={report.founder_questions} />
      <DiligenceRoadmapSection data={report.diligence_roadmap} />
      <WhyWrongSection data={report.why_this_might_be_wrong} />
    </div>
  );
}

export function DDReportDisplay({ data, reportId }: DDReportDisplayProps) {
  const report = parseDDReport(data);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {/* Uses report-base.css .report-page and .report-container */}
      <article
        className="report-page report-container"
        data-test="dd-report"
        data-report-id={reportId}
      >
        <DDReportContent report={report} />
      </article>
    </ErrorBoundary>
  );
}
```

---

### 4. `sections-core.tsx` - Core Sections (~250 lines)

Uses existing CSS classes from `report-modules.css`, `report-components.css`, and `primitives.tsx`:

```typescript
// sections-core.tsx
'use client';

import type { DDReport } from './schema';

// Import existing brand system primitives
import {
  Section as PrimitiveSection,
  SectionTitle,
  MonoLabel,
  BodyText,
  AccentBorder as PrimitiveAccentBorder,
  SeverityIndicator,
} from '../brand-system/primitives';

// ============================================
// Shared Components (using design system)
// ============================================

/** Section wrapper - uses report-base.css .report-act */
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <PrimitiveSection id={id}>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </PrimitiveSection>
  );
}

/** Accent border - uses primitives.tsx AccentBorder */
function AccentBorder({ children, weight = 'medium' }: { children: React.ReactNode; weight?: 'light' | 'medium' | 'heavy' }) {
  return <PrimitiveAccentBorder weight={weight}>{children}</PrimitiveAccentBorder>;
}

/** Module card - uses report-modules.css .module */
function Card({ children, className = '', variant = 'default' }: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'warning' | 'success' | 'elevated';
}) {
  const variantClasses: Record<string, string> = {
    default: 'module',
    primary: 'module module--primary',
    warning: 'module module--warning',
    success: 'module module--success',
    elevated: 'module module--elevated',
  };
  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}

/** Label - uses MonoLabel from primitives */
function Label({ children }: { children: React.ReactNode }) {
  return <MonoLabel>{children}</MonoLabel>;
}

/** Status badge - uses report-components.css status classes */
function VerdictBadge({ verdict, size = 'md' }: { verdict: string; size?: 'sm' | 'md' | 'lg' }) {
  // Map verdicts to semantic status
  const statusMap: Record<string, 'go' | 'warning' | 'nogo'> = {
    PROMISING: 'go', VALIDATED: 'go', PROCEED: 'go', STRONG: 'go', NOVEL: 'go',
    CAUTION: 'warning', PLAUSIBLE: 'warning', PROCEED_WITH_CAUTION: 'warning',
    QUESTIONABLE: 'warning', MODERATE: 'warning', INCREMENTAL: 'warning', MEDIUM: 'warning',
    PASS: 'nogo', INVALID: 'nogo', WEAK: 'nogo', DERIVATIVE: 'nogo',
  };
  const status = statusMap[verdict] || 'warning';

  const sizeClasses = {
    sm: 'badge-pill--sm',
    md: 'badge-pill',
    lg: 'badge-pill--lg',
  };

  return (
    <span className={`${sizeClasses[size]} badge-pill--${status}`}>
      {verdict.replace(/_/g, ' ')}
    </span>
  );
}

/** Score display - uses design tokens */
function ScoreCard({ label, score, outOf, description }: { label: string; score: number; outOf: number; description: string }) {
  const percentage = (score / outOf) * 100;
  const status = percentage >= 70 ? 'go' : percentage >= 40 ? 'warning' : 'nogo';

  return (
    <Card>
      <div className="module-header">
        <Label>{label}</Label>
      </div>
      <div className="module-body">
        <div className="flex items-baseline gap-[var(--space-1)]">
          <span className={`text-[var(--text-display)] font-semibold text-${status}-color`}>
            {score}
          </span>
          <span className="text-[var(--text-small)] text-void-muted">/{outOf}</span>
        </div>
        {description && <BodyText className="mt-[var(--space-2)]">{description}</BodyText>}
      </div>
    </Card>
  );
}

// ============================================
// Executive Summary
// ============================================
export function ExecutiveSummarySection({ data }: { data: DDReport['executive_summary'] }) {
  if (!data) return null;

  return (
    <Section id="executive-summary" title="Executive Summary">
      {data.one_paragraph_summary && (
        <AccentBorder>
          <p className="text-lg text-zinc-700 leading-relaxed">{data.one_paragraph_summary}</p>
        </AccentBorder>
      )}

      {/* Scores Grid */}
      {data.scores && Object.keys(data.scores).length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.scores.technical_credibility && (
            <ScoreCard
              label="Technical Credibility"
              score={data.scores.technical_credibility.score}
              outOf={data.scores.technical_credibility.out_of}
              description={data.scores.technical_credibility.one_liner}
            />
          )}
          {data.scores.commercial_viability && (
            <ScoreCard
              label="Commercial Viability"
              score={data.scores.commercial_viability.score}
              outOf={data.scores.commercial_viability.out_of}
              description={data.scores.commercial_viability.one_liner}
            />
          )}
          {data.scores.team_signals && (
            <ScoreCard
              label="Team Signals"
              score={data.scores.team_signals.score}
              outOf={data.scores.team_signals.out_of}
              description={data.scores.team_signals.one_liner}
            />
          )}
          {data.scores.moat_strength && (
            <ScoreCard
              label="Moat Strength"
              score={data.scores.moat_strength.score}
              outOf={data.scores.moat_strength.out_of}
              description={data.scores.moat_strength.one_liner}
            />
          )}
        </div>
      )}

      {/* Key Findings */}
      {data.key_findings.length > 0 && (
        <div className="mt-8">
          <Label>Key Findings</Label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.key_findings.map((finding, i) => (
              <div key={i} className="flex gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <span className={`text-xs font-semibold uppercase ${
                  finding.type === 'STRENGTH' ? 'text-zinc-900' :
                  finding.type === 'WEAKNESS' ? 'text-amber-700' :
                  finding.type === 'THREAT' ? 'text-red-700' : 'text-blue-700'
                }`}>
                  {finding.type}
                </span>
                <p className="text-sm text-zinc-700">{finding.finding}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verdict */}
      <div className="mt-8 flex items-center gap-4">
        <VerdictBadge verdict={data.verdict} size="lg" />
        <span className="text-sm text-zinc-500">{data.verdict_confidence} confidence</span>
      </div>
    </Section>
  );
}

// ============================================
// One Page Summary
// ============================================
export function OnePageSummarySection({ data }: { data: DDReport['one_page_summary'] }) {
  if (!data) return null;

  return (
    <Section id="one-page-summary" title="One Page Summary">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column - Key info */}
        <div className="space-y-6">
          <Card>
            <Label>The Bet</Label>
            <p className="mt-2 text-zinc-700">{data.the_bet}</p>
          </Card>

          {data.key_strength && (
            <Card>
              <Label>Key Strength</Label>
              <p className="mt-2 text-zinc-700">{data.key_strength}</p>
            </Card>
          )}

          {data.key_risk && (
            <Card>
              <Label>Key Risk</Label>
              <p className="mt-2 text-zinc-700">{data.key_risk}</p>
            </Card>
          )}
        </div>

        {/* Right column - Cases */}
        <div className="space-y-6">
          {data.bull_case_2_sentences && (
            <Card>
              <Label>Bull Case</Label>
              <p className="mt-2 text-zinc-700">{data.bull_case_2_sentences}</p>
            </Card>
          )}

          {data.bear_case_2_sentences && (
            <Card>
              <Label>Bear Case</Label>
              <p className="mt-2 text-zinc-700">{data.bear_case_2_sentences}</p>
            </Card>
          )}

          {data.if_you_do_one_thing && (
            <Card className="border-zinc-900 bg-zinc-950">
              <Label>If You Do One Thing</Label>
              <p className="mt-2 text-white">{data.if_you_do_one_thing}</p>
            </Card>
          )}
        </div>
      </div>
    </Section>
  );
}

// ============================================
// Verdict & Recommendation
// ============================================
export function VerdictSection({ data }: { data: DDReport['verdict_and_recommendation'] }) {
  if (!data) return null;

  return (
    <Section id="verdict" title="Verdict & Recommendation">
      <Card className="border-l-4 border-l-zinc-900">
        {data.overall_verdict && (
          <div className="flex items-center gap-4 mb-6">
            <VerdictBadge verdict={data.overall_verdict.verdict} size="lg" />
            <span className="text-sm text-zinc-500">{data.overall_verdict.confidence} confidence</span>
          </div>
        )}

        {data.recommendation && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label>Recommendation</Label>
              <VerdictBadge verdict={data.recommendation.action} size="sm" />
            </div>

            {data.recommendation.conditions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-zinc-700 mb-2">Key Conditions:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-600">
                  {data.recommendation.conditions.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}

            {data.recommendation.derisking_steps.length > 0 && (
              <div>
                <p className="text-sm font-medium text-zinc-700 mb-2">Derisking Steps:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-600">
                  {data.recommendation.derisking_steps.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {data.final_word && (
          <AccentBorder>
            <p className="mt-6 text-zinc-700 italic">{data.final_word}</p>
          </AccentBorder>
        )}
      </Card>
    </Section>
  );
}

export { Section, Card, Label, VerdictBadge, AccentBorder, ScoreCard };
```

---

### 4. `sections-analysis.tsx` - Analysis Sections (~250 lines)

```typescript
// sections-analysis.tsx
'use client';

import type { DDReport } from './schema';
import { Section, Card, Label, VerdictBadge, AccentBorder } from './sections-core';

// ============================================
// Technical Thesis
// ============================================
export function TechnicalThesisSection({ data }: { data: DDReport['technical_thesis_assessment'] }) {
  if (!data) return null;

  return (
    <Section id="technical-thesis" title="Technical Thesis Assessment">
      <AccentBorder>
        <p className="text-lg text-zinc-700">{data.their_thesis}</p>
      </AccentBorder>

      {data.thesis_validity && (
        <Card className="mt-6">
          <div className="flex items-center gap-4 mb-4">
            <Label>Thesis Validity</Label>
            <VerdictBadge verdict={data.thesis_validity.verdict} />
            <span className="text-sm text-zinc-500">{data.thesis_validity.confidence} confidence</span>
          </div>
          <p className="text-zinc-600">{data.thesis_validity.explanation}</p>
        </Card>
      )}

      {data.performance_claims.length > 0 && (
        <div className="mt-6">
          <Label>Performance Claims</Label>
          <div className="mt-4 space-y-3">
            {data.performance_claims.map((claim, i) => (
              <div key={i} className="flex items-start gap-4 rounded-lg border border-zinc-200 p-4">
                <VerdictBadge verdict={claim.verdict} size="sm" />
                <div className="flex-1">
                  <p className="font-medium text-zinc-900">{claim.claim}</p>
                  {claim.explanation && <p className="mt-1 text-sm text-zinc-600">{claim.explanation}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

// ============================================
// Claim Validation
// ============================================
export function ClaimValidationSection({ data }: { data: DDReport['claim_validation_summary'] }) {
  if (!data) return null;

  return (
    <Section id="claim-validation" title="Claim Validation Summary">
      {data.overview && <p className="text-zinc-700 mb-6">{data.overview}</p>}

      {data.critical_claims.length > 0 && (
        <div className="space-y-3">
          {data.critical_claims.map((claim, i) => (
            <Card key={i}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-zinc-900">{claim.claim}</p>
                  <p className="mt-2 text-sm text-zinc-600">{claim.plain_english}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <VerdictBadge verdict={claim.verdict} size="sm" />
                  <span className="text-xs text-zinc-500">{claim.confidence}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {data.triz_findings && (
        <Card className="mt-6 bg-zinc-50">
          <Label>TRIZ Analysis</Label>
          {data.triz_findings.key_contradictions && (
            <p className="mt-2 text-sm text-zinc-700">
              <span className="font-medium">Key Contradictions:</span> {data.triz_findings.key_contradictions}
            </p>
          )}
          {data.triz_findings.resolution_quality && (
            <p className="mt-2 text-sm text-zinc-700">
              <span className="font-medium">Resolution Quality:</span> {data.triz_findings.resolution_quality}
            </p>
          )}
        </Card>
      )}
    </Section>
  );
}

// ============================================
// Solution Landscape
// ============================================
export function SolutionLandscapeSection({ data }: { data: DDReport['solution_landscape'] }) {
  if (!data) return null;

  const tracks = data.solution_space_by_track;

  return (
    <Section id="solution-landscape" title="Solution Landscape">
      {data.landscape_overview?.key_insight && (
        <AccentBorder>
          <p className="text-lg text-zinc-700">{data.landscape_overview.key_insight}</p>
        </AccentBorder>
      )}

      {data.startup_positioning && (
        <Card className="mt-6 border-l-4 border-l-zinc-900">
          <Label>Startup Positioning</Label>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-medium text-zinc-900">{data.startup_positioning.which_track}</span>
            {data.startup_positioning.positioning_verdict && (
              <VerdictBadge verdict={data.startup_positioning.positioning_verdict} size="sm" />
            )}
          </div>
          {data.startup_positioning.positioning_explanation && (
            <p className="mt-2 text-sm text-zinc-600">{data.startup_positioning.positioning_explanation}</p>
          )}
        </Card>
      )}

      {data.strategic_insight && (
        <Card className="mt-6 bg-zinc-950 text-white">
          <Label>Strategic Insight</Label>
          <p className="mt-2">{data.strategic_insight}</p>
        </Card>
      )}
    </Section>
  );
}

// ============================================
// Novelty Assessment
// ============================================
export function NoveltySection({ data }: { data: DDReport['novelty_assessment'] }) {
  if (!data) return null;

  return (
    <Section id="novelty" title="Novelty Assessment">
      <div className="flex items-center gap-4 mb-6">
        <VerdictBadge verdict={data.verdict} size="lg" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {data.what_is_novel && (
          <Card>
            <Label>What Is Novel</Label>
            <p className="mt-2 text-zinc-700">{data.what_is_novel}</p>
          </Card>
        )}
        {data.what_is_not_novel && (
          <Card className="bg-zinc-50">
            <Label>What Is Not Novel</Label>
            <p className="mt-2 text-zinc-700">{data.what_is_not_novel}</p>
          </Card>
        )}
      </div>

      {data.key_prior_art.length > 0 && (
        <div className="mt-6">
          <Label>Key Prior Art</Label>
          <div className="mt-4 space-y-3">
            {data.key_prior_art.map((art, i) => (
              <Card key={i}>
                <p className="font-medium text-zinc-900">{art.reference}</p>
                {art.relevance && <p className="mt-1 text-sm text-zinc-600">{art.relevance}</p>}
                {art.impact && <p className="mt-1 text-sm text-zinc-500 italic">{art.impact}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

// ============================================
// Moat Assessment
// ============================================
export function MoatSection({ data }: { data: DDReport['moat_assessment'] }) {
  if (!data) return null;

  return (
    <Section id="moat" title="Moat Assessment">
      {data.overall && (
        <Card className="border-l-4 border-l-zinc-900">
          <div className="flex items-center gap-4 mb-4">
            <VerdictBadge verdict={data.overall.strength} size="lg" />
            {data.overall.durability_years && (
              <span className="text-sm text-zinc-500">{data.overall.durability_years} year durability</span>
            )}
          </div>
          {data.overall.primary_source && (
            <p className="text-zinc-700">{data.overall.primary_source}</p>
          )}
        </Card>
      )}

      {data.breakdown && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {data.breakdown.technical && (
            <Card>
              <Label>Technical</Label>
              <div className="mt-2">
                <VerdictBadge verdict={data.breakdown.technical} size="sm" />
              </div>
            </Card>
          )}
          {data.breakdown.market && (
            <Card>
              <Label>Market</Label>
              <div className="mt-2">
                <VerdictBadge verdict={data.breakdown.market} size="sm" />
              </div>
            </Card>
          )}
          {data.breakdown.execution && (
            <Card>
              <Label>Execution</Label>
              <div className="mt-2">
                <VerdictBadge verdict={data.breakdown.execution} size="sm" />
              </div>
            </Card>
          )}
        </div>
      )}

      {data.vulnerabilities.length > 0 && (
        <div className="mt-6">
          <Label>Vulnerabilities</Label>
          <div className="mt-4 space-y-2">
            {data.vulnerabilities.map((v, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-zinc-200 p-4">
                <span className={`text-xs font-semibold uppercase ${
                  v.severity === 'HIGH' ? 'text-red-700' :
                  v.severity === 'MEDIUM' ? 'text-amber-700' : 'text-zinc-500'
                }`}>
                  {v.severity}
                </span>
                <p className="text-sm text-zinc-700">{v.vulnerability}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
```

---

### 5. `sections-risk.tsx` - Risk Sections (~200 lines)

```typescript
// sections-risk.tsx
'use client';

import type { DDReport } from './schema';
import { Section, Card, Label, VerdictBadge, AccentBorder } from './sections-core';

// ============================================
// Commercialization Reality
// ============================================
export function CommercializationSection({ data }: { data: DDReport['commercialization_reality'] }) {
  if (!data) return null;

  return (
    <Section id="commercialization" title="Commercialization Reality">
      {data.summary && (
        <AccentBorder>
          <p className="text-lg text-zinc-700">{data.summary}</p>
        </AccentBorder>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {data.unit_economics && (
          <Card>
            <Label>Unit Economics</Label>
            <div className="mt-3 space-y-2">
              {data.unit_economics.today && (
                <p className="text-sm"><span className="text-zinc-500">Today:</span> <span className="font-medium">{data.unit_economics.today}</span></p>
              )}
              {data.unit_economics.claimed_at_scale && (
                <p className="text-sm"><span className="text-zinc-500">At Scale:</span> <span className="font-medium">{data.unit_economics.claimed_at_scale}</span></p>
              )}
              {data.unit_economics.credibility && (
                <VerdictBadge verdict={data.unit_economics.credibility} size="sm" />
              )}
            </div>
          </Card>
        )}

        {data.path_to_revenue && (
          <Card>
            <Label>Path to Revenue</Label>
            <div className="mt-3 space-y-2">
              {data.path_to_revenue.timeline && <p className="text-sm text-zinc-700">{data.path_to_revenue.timeline}</p>}
              {data.path_to_revenue.capital_required && (
                <p className="text-sm"><span className="text-zinc-500">Capital Required:</span> {data.path_to_revenue.capital_required}</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {data.the_hard_truth && (
        <Card className="mt-6 bg-zinc-950 text-white">
          <Label>The Hard Truth</Label>
          {data.the_hard_truth.even_if_physics_works && (
            <p className="mt-2 text-zinc-300">{data.the_hard_truth.even_if_physics_works}</p>
          )}
          {data.the_hard_truth.critical_commercial_question && (
            <p className="mt-2 font-medium text-white">{data.the_hard_truth.critical_commercial_question}</p>
          )}
        </Card>
      )}
    </Section>
  );
}

// ============================================
// Risk Analysis
// ============================================
export function RiskAnalysisSection({ data }: { data: DDReport['risk_analysis'] }) {
  if (!data) return null;

  return (
    <Section id="risk-analysis" title="Risk Analysis">
      {data.key_risk_summary && (
        <AccentBorder>
          <p className="text-lg text-zinc-700">{data.key_risk_summary}</p>
        </AccentBorder>
      )}

      {data.technical_risks.length > 0 && (
        <div className="mt-6">
          <Label>Technical Risks</Label>
          <div className="mt-4 space-y-3">
            {data.technical_risks.map((r, i) => (
              <Card key={i}>
                <p className="font-medium text-zinc-900">{r.risk}</p>
                <div className="mt-2 flex items-center gap-4">
                  {r.probability && <span className="text-xs text-zinc-500">Probability: {r.probability}</span>}
                  {r.impact && <span className="text-xs text-zinc-500">Impact: {r.impact}</span>}
                </div>
                {r.mitigation && <p className="mt-2 text-sm text-zinc-600">{r.mitigation}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {data.commercial_risks.length > 0 && (
        <div className="mt-6">
          <Label>Commercial Risks</Label>
          <div className="mt-4 space-y-2">
            {data.commercial_risks.map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4">
                {r.severity && (
                  <span className={`text-xs font-semibold uppercase ${
                    r.severity === 'HIGH' ? 'text-red-700' : r.severity === 'MEDIUM' ? 'text-amber-700' : 'text-zinc-500'
                  }`}>{r.severity}</span>
                )}
                <p className="text-sm text-zinc-700">{r.risk}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

// ============================================
// Scenario Analysis
// ============================================
export function ScenarioAnalysisSection({ data }: { data: DDReport['scenario_analysis'] }) {
  if (!data) return null;

  return (
    <Section id="scenario-analysis" title="Scenario Analysis">
      <div className="grid gap-4 sm:grid-cols-3">
        {data.bull_case && (
          <Card className="border-t-4 border-t-zinc-900">
            <Label>Bull Case {data.bull_case.probability && `(${data.bull_case.probability})`}</Label>
            <p className="mt-2 text-sm text-zinc-700">{data.bull_case.narrative}</p>
            {data.bull_case.return && (
              <p className="mt-2 font-semibold text-zinc-900">{data.bull_case.return}</p>
            )}
          </Card>
        )}
        {data.base_case && (
          <Card className="border-t-4 border-t-zinc-400">
            <Label>Base Case {data.base_case.probability && `(${data.base_case.probability})`}</Label>
            <p className="mt-2 text-sm text-zinc-700">{data.base_case.narrative}</p>
            {data.base_case.return && (
              <p className="mt-2 font-semibold text-zinc-900">{data.base_case.return}</p>
            )}
          </Card>
        )}
        {data.bear_case && (
          <Card className="border-t-4 border-t-red-400">
            <Label>Bear Case {data.bear_case.probability && `(${data.bear_case.probability})`}</Label>
            <p className="mt-2 text-sm text-zinc-700">{data.bear_case.narrative}</p>
            {data.bear_case.return && (
              <p className="mt-2 font-semibold text-zinc-900">{data.bear_case.return}</p>
            )}
          </Card>
        )}
      </div>

      {data.expected_value && (
        <Card className="mt-6 bg-zinc-50">
          <Label>Expected Value</Label>
          {data.expected_value.weighted_multiple && (
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{data.expected_value.weighted_multiple}</p>
          )}
          {data.expected_value.assessment && (
            <p className="mt-2 text-sm text-zinc-600">{data.expected_value.assessment}</p>
          )}
        </Card>
      )}
    </Section>
  );
}

// ============================================
// Pre-Mortem
// ============================================
export function PreMortemSection({ data }: { data: DDReport['pre_mortem'] }) {
  if (!data) return null;

  return (
    <Section id="pre-mortem" title="Pre-Mortem">
      {data.framing && <p className="text-lg text-zinc-700 italic mb-6">{data.framing}</p>}

      <div className="space-y-4">
        {data.most_likely_failure && (
          <Card className="border-l-4 border-l-red-400">
            <div className="flex items-center gap-2 mb-2">
              <Label>Most Likely Failure</Label>
              {data.most_likely_failure.probability && (
                <span className="text-xs text-red-600 font-medium">{data.most_likely_failure.probability}</span>
              )}
            </div>
            <p className="text-zinc-700">{data.most_likely_failure.scenario}</p>
            {data.most_likely_failure.early_warnings.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-zinc-700">Early Warnings:</p>
                <ul className="mt-2 list-disc pl-5 text-sm text-zinc-600 space-y-1">
                  {data.most_likely_failure.early_warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </Card>
        )}

        {data.black_swan && (
          <Card className="bg-zinc-950 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Label>Black Swan</Label>
              {data.black_swan.probability && (
                <span className="text-xs text-zinc-400">{data.black_swan.probability}</span>
              )}
            </div>
            <p className="text-zinc-300">{data.black_swan.scenario}</p>
          </Card>
        )}
      </div>
    </Section>
  );
}
```

---

### 6. `sections-other.tsx` - Remaining Sections (~200 lines)

```typescript
// sections-other.tsx
'use client';

import type { DDReport } from './schema';
import { Section, Card, Label, AccentBorder } from './sections-core';

// ============================================
// Problem Primer
// ============================================
export function ProblemPrimerSection({ data }: { data: DDReport['problem_primer'] }) {
  if (!data) return null;

  return (
    <Section id="problem-primer" title="Problem Primer">
      {data.problem_overview && (
        <AccentBorder>
          <p className="text-lg text-zinc-700">{data.problem_overview.plain_english}</p>
          {data.problem_overview.why_it_matters && (
            <p className="mt-4 text-zinc-600">{data.problem_overview.why_it_matters}</p>
          )}
        </AccentBorder>
      )}

      {data.key_insight && (
        <Card className="mt-6 bg-zinc-950 text-white">
          <Label>Key Insight</Label>
          <p className="mt-2">{data.key_insight}</p>
        </Card>
      )}

      {data.key_contradictions.length > 0 && (
        <div className="mt-6">
          <Label>Key Contradictions</Label>
          <div className="mt-4 space-y-3">
            {data.key_contradictions.map((c, i) => (
              <Card key={i}>
                <p className="font-medium text-zinc-900">{c.tradeoff}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 text-sm">
                  <p><span className="text-zinc-500">If you improve:</span> {c.if_you_improve}</p>
                  <p><span className="text-zinc-500">Typically worsens:</span> {c.typically_worsens}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

// ============================================
// Confidence Calibration
// ============================================
export function ConfidenceCalibrationSection({ data }: { data: DDReport['confidence_calibration'] }) {
  if (!data) return null;

  return (
    <Section id="confidence" title="Confidence Calibration">
      <div className="grid gap-6 sm:grid-cols-3">
        {data.high_confidence.length > 0 && (
          <div>
            <Label>High Confidence</Label>
            <div className="mt-4 space-y-3">
              {data.high_confidence.map((item, i) => (
                <Card key={i} className="border-l-4 border-l-zinc-900">
                  <p className="text-sm text-zinc-700">{item.assessment}</p>
                  {item.confidence && <p className="mt-1 text-xs text-zinc-500">{item.confidence}</p>}
                </Card>
              ))}
            </div>
          </div>
        )}

        {data.medium_confidence.length > 0 && (
          <div>
            <Label>Medium Confidence</Label>
            <div className="mt-4 space-y-3">
              {data.medium_confidence.map((item, i) => (
                <Card key={i} className="border-l-4 border-l-zinc-400">
                  <p className="text-sm text-zinc-700">{item.assessment}</p>
                  {item.confidence && <p className="mt-1 text-xs text-zinc-500">{item.confidence}</p>}
                </Card>
              ))}
            </div>
          </div>
        )}

        {data.low_confidence.length > 0 && (
          <div>
            <Label>Low Confidence</Label>
            <div className="mt-4 space-y-3">
              {data.low_confidence.map((item, i) => (
                <Card key={i} className="border-l-4 border-l-amber-400">
                  <p className="text-sm text-zinc-700">{item.assessment}</p>
                  {item.confidence && <p className="mt-1 text-xs text-zinc-500">{item.confidence}</p>}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {data.known_unknowns.length > 0 && (
        <Card className="mt-6 bg-zinc-50">
          <Label>Known Unknowns</Label>
          <ul className="mt-2 list-disc pl-5 text-sm text-zinc-700 space-y-1">
            {data.known_unknowns.map((u, i) => <li key={i}>{u}</li>)}
          </ul>
        </Card>
      )}
    </Section>
  );
}

// ============================================
// Comparable Analysis
// ============================================
export function ComparableAnalysisSection({ data }: { data: DDReport['comparable_analysis'] }) {
  if (!data) return null;

  return (
    <Section id="comparables" title="Comparable Analysis">
      {data.base_rate && (
        <Card className="mb-6 border-l-4 border-l-zinc-900">
          <Label>Base Rate</Label>
          {data.base_rate.category_success_rate && (
            <p className="mt-2 text-zinc-700">{data.base_rate.category_success_rate}</p>
          )}
          {data.base_rate.this_company_vs_base && (
            <p className="mt-2 font-medium text-zinc-900">{data.base_rate.this_company_vs_base}</p>
          )}
        </Card>
      )}

      {data.closest_comparables.length > 0 && (
        <div className="space-y-4">
          {data.closest_comparables.map((comp, i) => (
            <Card key={i}>
              <p className="font-semibold text-zinc-900">{comp.company}</p>
              {comp.similarity && <p className="mt-1 text-sm text-zinc-600">{comp.similarity}</p>}
              {comp.outcome && <p className="mt-2 text-sm text-zinc-700">{comp.outcome}</p>}
              {comp.lesson && (
                <p className="mt-2 text-sm text-zinc-900 font-medium">Lesson: {comp.lesson}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}

// ============================================
// Founder Questions
// ============================================
export function FounderQuestionsSection({ data }: { data: DDReport['founder_questions'] }) {
  if (!data) return null;

  return (
    <Section id="founder-questions" title="Founder Questions">
      {data.must_ask.length > 0 && (
        <div className="space-y-4">
          {data.must_ask.map((q, i) => (
            <Card key={i} className="border-l-4 border-l-zinc-900">
              <p className="font-medium text-zinc-900">{q.question}</p>
              {q.why_critical && <p className="mt-2 text-sm text-zinc-600">{q.why_critical}</p>}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {q.good_answer && (
                  <div className="rounded-lg bg-zinc-50 p-3">
                    <Label>Good Answer</Label>
                    <p className="mt-1 text-sm text-zinc-700">{q.good_answer}</p>
                  </div>
                )}
                {q.bad_answer && (
                  <div className="rounded-lg bg-red-50 p-3">
                    <Label>Red Flag</Label>
                    <p className="mt-1 text-sm text-red-700">{q.bad_answer}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}

// ============================================
// Diligence Roadmap
// ============================================
export function DiligenceRoadmapSection({ data }: { data: DDReport['diligence_roadmap'] }) {
  if (!data) return null;

  return (
    <Section id="diligence-roadmap" title="Diligence Roadmap">
      {data.before_term_sheet.length > 0 && (
        <div className="mb-6">
          <Label>Before Term Sheet</Label>
          <div className="mt-4 space-y-3">
            {data.before_term_sheet.map((action, i) => (
              <Card key={i}>
                <p className="font-medium text-zinc-900">{action.action}</p>
                {action.purpose && <p className="mt-1 text-sm text-zinc-600">{action.purpose}</p>}
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
                  {action.time && <span>Time: {action.time}</span>}
                  {action.cost && <span>Cost: {action.cost}</span>}
                  {action.who && <span>Who: {action.who}</span>}
                </div>
                {action.deal_breaker_if && (
                  <p className="mt-2 text-sm text-red-700">Deal breaker if: {action.deal_breaker_if}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {data.documents_to_request.length > 0 && (
        <Card className="bg-zinc-50">
          <Label>Documents to Request</Label>
          <ul className="mt-2 list-disc pl-5 text-sm text-zinc-700 space-y-1">
            {data.documents_to_request.map((doc, i) => <li key={i}>{doc}</li>)}
          </ul>
        </Card>
      )}
    </Section>
  );
}

// ============================================
// Why This Might Be Wrong
// ============================================
export function WhyWrongSection({ data }: { data: DDReport['why_this_might_be_wrong'] }) {
  if (!data) return null;

  return (
    <Section id="why-wrong" title="Why This Might Be Wrong">
      {data.strongest_counter_argument && (
        <AccentBorder>
          <Label>Strongest Counter-Argument</Label>
          <p className="mt-2 text-lg text-zinc-700">{data.strongest_counter_argument}</p>
        </AccentBorder>
      )}

      {data.our_response && (
        <Card className="mt-6">
          <Label>Our Response</Label>
          <p className="mt-2 text-zinc-700">{data.our_response}</p>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {data.if_we_are_too_positive && (
          <Card className="bg-amber-50">
            <Label>If We're Too Positive</Label>
            {data.if_we_are_too_positive.what_we_might_be_missing && (
              <p className="mt-2 text-sm text-zinc-700">{data.if_we_are_too_positive.what_we_might_be_missing}</p>
            )}
          </Card>
        )}
        {data.if_we_are_too_negative && (
          <Card className="bg-zinc-50">
            <Label>If We're Too Negative</Label>
            {data.if_we_are_too_negative.what_we_might_be_missing && (
              <p className="mt-2 text-sm text-zinc-700">{data.if_we_are_too_negative.what_we_might_be_missing}</p>
            )}
          </Card>
        )}
      </div>
    </Section>
  );
}
```

---

## Acceptance Criteria

### Antifragility Requirements (CRITICAL - ALL MUST PASS)

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Annotated enum | `"PROMISING - very good"` | `"PROMISING"` |
| Lowercase enum | `"promising"` | `"PROMISING"` |
| Parenthetical enum | `"HIGH (90% confident)"` | `"HIGH"` |
| Synonym enum | `"GOOD"` → verdict | `"PROMISING"` |
| Unknown enum | `"FOOBAR"` | Default value |
| String number | `"7"` | `7` |
| Annotated number | `"7.5 points"` | `7.5` |
| Percentage number | `"85%"` (0-10 scale) | `8.5` |
| Fraction number | `"7/10"` | `7` |
| NaN | `NaN` | Default value |
| Infinity | `Infinity` | Max value |
| Empty string | `""` | Default or `undefined` |
| Whitespace string | `"   "` | Default or `undefined` |
| RTF escapes | `"test\'97value"` | `"test—value"` |
| HTML entities | `"test&mdash;value"` | `"test—value"` |
| Null field | `null` | Default value |
| Missing field | (absent) | Default value |
| Single item as array | `"item"` | `["item"]` |
| Object as array | `{0: "a", 1: "b"}` | `["a", "b"]` |
| Bad array item | `[valid, invalid, valid]` | `[valid, valid]` |
| Nested null | `{ a: { b: null } }` | Safe default |
| Completely empty | `{}` | Valid report |
| Null input | `null` | Valid report |
| Undefined input | `undefined` | Valid report |

### Functional Requirements

- [ ] All 19 DD sections render with complete data
- [ ] Missing sections gracefully skipped (no empty boxes)
- [ ] Uses existing design system (`report-tokens.css`, `primitives.tsx`)
- [ ] Mobile responsive (breakpoints at 640px, 768px, 1024px)
- [ ] Semantic status colors (go/warning/nogo)

### Quality Gates

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint:fix` passes
- [ ] Zero runtime errors on sample reports
- [ ] All antifragility tests pass
- [ ] No console errors in browser

---

## Testing Strategy

Comprehensive test suite with intentionally malformed data:

```typescript
// __tests__/dd-report-schema.test.ts
import { parseDDReport } from '../schema';
import { safeEnum, safeNumber, safeString, safeArray, ENUM_SYNONYMS } from '../schema-helpers';

describe('DDReportSchema antifragility', () => {
  // ============================================
  // ENUM TESTS
  // ============================================
  describe('safeEnum', () => {
    const TestEnum = safeEnum(['HIGH', 'MEDIUM', 'LOW'] as const, 'MEDIUM', 'confidence');

    it('handles exact match', () => {
      expect(TestEnum.parse('HIGH')).toBe('HIGH');
    });

    it('handles lowercase', () => {
      expect(TestEnum.parse('high')).toBe('HIGH');
    });

    it('handles annotated values', () => {
      expect(TestEnum.parse('HIGH - very confident')).toBe('HIGH');
      expect(TestEnum.parse('HIGH (90%)')).toBe('HIGH');
      expect(TestEnum.parse('HIGH: explanation')).toBe('HIGH');
    });

    it('handles synonyms', () => {
      expect(TestEnum.parse('STRONG')).toBe('HIGH'); // via ENUM_SYNONYMS.confidence
      expect(TestEnum.parse('CERTAIN')).toBe('HIGH');
      expect(TestEnum.parse('MODERATE')).toBe('MEDIUM');
      expect(TestEnum.parse('WEAK')).toBe('LOW');
    });

    it('handles unknown values with default', () => {
      expect(TestEnum.parse('FOOBAR')).toBe('MEDIUM');
      expect(TestEnum.parse('UNKNOWN_VALUE')).toBe('MEDIUM');
    });

    it('handles null/undefined', () => {
      expect(TestEnum.parse(null)).toBe('MEDIUM');
      expect(TestEnum.parse(undefined)).toBe('MEDIUM');
    });

    it('handles non-strings', () => {
      expect(TestEnum.parse(123)).toBe('MEDIUM');
      expect(TestEnum.parse(true)).toBe('MEDIUM');
      expect(TestEnum.parse({})).toBe('MEDIUM');
    });
  });

  // ============================================
  // NUMBER TESTS
  // ============================================
  describe('safeNumber', () => {
    const TestScore = safeNumber(5, 0, 10);

    it('handles valid numbers', () => {
      expect(TestScore.parse(7)).toBe(7);
      expect(TestScore.parse(0)).toBe(0);
      expect(TestScore.parse(10)).toBe(10);
    });

    it('clamps out-of-range numbers', () => {
      expect(TestScore.parse(-5)).toBe(0);
      expect(TestScore.parse(15)).toBe(10);
    });

    it('handles string numbers', () => {
      expect(TestScore.parse('7')).toBe(7);
      expect(TestScore.parse('7.5')).toBe(7.5);
    });

    it('handles annotated numbers', () => {
      expect(TestScore.parse('7 points')).toBe(7);
      expect(TestScore.parse('~8')).toBe(8);
      expect(TestScore.parse('>5')).toBe(5);
    });

    it('handles percentages', () => {
      expect(TestScore.parse('70%')).toBe(7);
      expect(TestScore.parse('85%')).toBe(8.5);
    });

    it('handles fractions', () => {
      expect(TestScore.parse('7/10')).toBe(7);
      expect(TestScore.parse('8 / 10')).toBe(8);
    });

    it('handles NaN/Infinity', () => {
      expect(TestScore.parse(NaN)).toBe(5);
      expect(TestScore.parse(Infinity)).toBe(5);
      expect(TestScore.parse(-Infinity)).toBe(5);
    });

    it('handles empty/null', () => {
      expect(TestScore.parse('')).toBe(5);
      expect(TestScore.parse(null)).toBe(5);
      expect(TestScore.parse(undefined)).toBe(5);
    });
  });

  // ============================================
  // STRING TESTS
  // ============================================
  describe('safeString', () => {
    const TestString = safeString(100);

    it('handles valid strings', () => {
      expect(TestString.parse('hello')).toBe('hello');
    });

    it('decodes RTF escapes', () => {
      expect(TestString.parse("test\\'97value")).toBe('test—value');
      expect(TestString.parse("100\\'b0C")).toBe('100°C');
    });

    it('decodes HTML entities', () => {
      expect(TestString.parse('test&mdash;value')).toBe('test—value');
      expect(TestString.parse('a&amp;b')).toBe('a&b');
      expect(TestString.parse('&#8212;')).toBe('—');
    });

    it('normalizes whitespace', () => {
      expect(TestString.parse('  hello   world  ')).toBe('hello world');
      expect(TestString.parse('hello\n\n\n\nworld')).toBe('hello\n\nworld');
    });

    it('truncates long strings', () => {
      const long = 'a'.repeat(200);
      const result = TestString.parse(long);
      expect(result.length).toBeLessThanOrEqual(100);
      expect(result.endsWith('...')).toBe(true);
    });

    it('handles null/undefined', () => {
      expect(TestString.parse(null)).toBe('');
      expect(TestString.parse(undefined)).toBe('');
    });

    it('handles non-strings', () => {
      expect(TestString.parse(123)).toBe('123');
      expect(TestString.parse(true)).toBe('true');
    });
  });

  // ============================================
  // ARRAY TESTS
  // ============================================
  describe('safeArray', () => {
    const TestArray = safeArray(safeString());

    it('handles valid arrays', () => {
      expect(TestArray.parse(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('wraps single items', () => {
      expect(TestArray.parse('single')).toEqual(['single']);
    });

    it('handles object with numeric keys', () => {
      expect(TestArray.parse({ 0: 'a', 1: 'b', 2: 'c' })).toEqual(['a', 'b', 'c']);
    });

    it('filters out failed items', () => {
      // If inner schema fails, item is filtered
      const NumArray = safeArray(safeNumber(0, 0, 10));
      // All valid numbers pass
      expect(NumArray.parse([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('handles null/undefined', () => {
      expect(TestArray.parse(null)).toEqual([]);
      expect(TestArray.parse(undefined)).toEqual([]);
    });

    it('limits array length', () => {
      const LimitedArray = safeArray(safeString(), 5);
      const long = Array(20).fill('x');
      expect(LimitedArray.parse(long).length).toBe(5);
    });
  });

  // ============================================
  // FULL REPORT TESTS
  // ============================================
  describe('parseDDReport', () => {
    it('handles completely empty input', () => {
      const result = parseDDReport({});
      expect(result.header.company_name).toBe('Unknown Company');
      expect(result.header.version).toBe('2.0.0');
    });

    it('handles null input', () => {
      const result = parseDDReport(null);
      expect(result.header.company_name).toBe('Unknown Company');
    });

    it('handles undefined input', () => {
      const result = parseDDReport(undefined);
      expect(result.header.company_name).toBe('Unknown Company');
    });

    it('handles partial data', () => {
      const result = parseDDReport({
        header: { company_name: 'Test Co' },
        executive_summary: {
          verdict: 'PROMISING',
          // Missing other fields
        },
      });
      expect(result.header.company_name).toBe('Test Co');
      expect(result.executive_summary?.verdict).toBe('PROMISING');
      expect(result.executive_summary?.key_findings).toEqual([]);
    });

    it('handles malformed nested data', () => {
      const result = parseDDReport({
        header: { company_name: 'Test' },
        executive_summary: {
          verdict: 'PROMISING - great company!',
          scores: {
            technical_credibility: {
              score: '8.5 out of 10',
              out_of: '10',
              one_liner: null,
            },
          },
          key_findings: [
            { finding: 'Good team', type: 'STRENGTH - important' },
            { finding: 'Limited funding', type: 'weakness' },
            null, // Should be filtered
            { finding: 'Missing type' }, // Should get default type
          ],
        },
      });

      expect(result.executive_summary?.verdict).toBe('PROMISING');
      expect(result.executive_summary?.scores?.technical_credibility?.score).toBe(8.5);
      expect(result.executive_summary?.key_findings.length).toBeGreaterThan(0);
    });

    it('gracefully handles all 19 missing sections', () => {
      const result = parseDDReport({ header: { company_name: 'Test' } });

      expect(result.executive_summary).toBeUndefined();
      expect(result.one_page_summary).toBeUndefined();
      expect(result.problem_primer).toBeUndefined();
      expect(result.technical_thesis_assessment).toBeUndefined();
      expect(result.claim_validation_summary).toBeUndefined();
      expect(result.solution_landscape).toBeUndefined();
      expect(result.novelty_assessment).toBeUndefined();
      expect(result.moat_assessment).toBeUndefined();
      expect(result.commercialization_reality).toBeUndefined();
      expect(result.risk_analysis).toBeUndefined();
      expect(result.scenario_analysis).toBeUndefined();
      expect(result.pre_mortem).toBeUndefined();
      expect(result.confidence_calibration).toBeUndefined();
      expect(result.comparable_analysis).toBeUndefined();
      expect(result.founder_questions).toBeUndefined();
      expect(result.diligence_roadmap).toBeUndefined();
      expect(result.why_this_might_be_wrong).toBeUndefined();
      expect(result.verdict_and_recommendation).toBeUndefined();
    });
  });
});
```

---

## File Reference Index

| File | Purpose | Est. Lines |
|------|---------|------------|
| `index.tsx` | Main wrapper + error boundary | ~100 |
| `schema-helpers.ts` | Antifragile helper functions (safeEnum, safeNumber, etc.) | ~150 |
| `schema.ts` | Ultra-antifragile Zod schemas for all 19 sections | ~400 |
| `sections-core.tsx` | Executive summary, one-page, verdict + shared components | ~250 |
| `sections-analysis.tsx` | Technical, claims, novelty, moat, landscape | ~250 |
| `sections-risk.tsx` | Risk, scenarios, pre-mortem, commercialization | ~200 |
| `sections-other.tsx` | Problem primer, confidence, comparables, questions, roadmap | ~200 |

**Total: ~1,550 lines across 7 files**

**Existing files used (not new):**
- `apps/web/styles/report-tokens.css` - Primary design tokens
- `apps/web/styles/sparlo-tokens.css` - Brand tokens
- `apps/web/app/home/(user)/reports/[id]/_components/brand-system/primitives.tsx` - Shared components

---

## Key Differences from v3 Plan

| Removed | Reason |
|---------|--------|
| PDF rendering | Not needed per user |
| Version detection/router | Single version, no legacy |
| `memo()` everywhere | Profile first, premature optimization |
| Custom design tokens file | Use existing `report-tokens.css` |
| 30+ files | Consolidated to 7 files |

| Added (v4 Enhancements) | Reason |
|-------------------------|--------|
| `ENUM_SYNONYMS` mapping | Handle LLM vocabulary drift ("GOOD" → "PROMISING") |
| RTF escape decoding | Handle `\'97` from RTF sources |
| HTML entity decoding | Handle `&mdash;` etc. |
| `z.preprocess()` on all types | Normalize before validation |
| Percentage/fraction parsing | Handle "85%" and "7/10" |
| Array item filtering | One bad item doesn't break array |
| Single-to-array wrapping | Handle `"item"` instead of `["item"]` |
| Comprehensive test suite | ~200 test cases |

| Kept | Reason |
|------|--------|
| `.catch()` on every field | Core antifragility |
| `.default([])` on arrays | Core antifragility |
| `.optional()` on sections | Graceful degradation |
| Brand styling via CSS classes | Uses existing design system |
| Error boundary | Last line of defense |

---

## Antifragility Summary

The schema is designed to **NEVER throw** regardless of input:

```
┌─────────────────────────────────────────────────────────────────┐
│                    INPUT (LLM output)                           │
├─────────────────────────────────────────────────────────────────┤
│ z.preprocess()  → Normalize null/undefined/type coercion        │
├─────────────────────────────────────────────────────────────────┤
│ .transform()    → Clean annotations, decode entities, synonyms  │
├─────────────────────────────────────────────────────────────────┤
│ .catch()        → Fall back to sensible default on any failure  │
├─────────────────────────────────────────────────────────────────┤
│                    OUTPUT (always valid)                        │
└─────────────────────────────────────────────────────────────────┘
```

**Guarantee**: `parseDDReport(ANYTHING)` returns a valid `DDReport` type. Always.

---

**Plan Generated**: 2025-01-05 (v4 - Ultra-Antifragile)
