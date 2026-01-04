---
title: "ZodError LLM Schema Validation Failures"
date: 2026-01-04
category: runtime-errors
severity: critical
tags: [zod, llm, inngest, validation, enum, antifragile]
affected_components:
  - apps/web/lib/llm/prompts/dd/schemas.ts
  - apps/web/lib/llm/prompts/hybrid/schemas.ts
  - Inngest DD/Hybrid flows
prevention_documented: true
---

# ZodError LLM Schema Validation Failures

## Problem Summary

LLM outputs fail Zod schema validation because models return unpredictable formats that don't match strict enum/number validators.

## Symptoms

```
ZodError: Enum validation failed
  Expected: 'WEAK' | 'MODERATE' | 'STRONG'
  Received: 'WEAK - needs improvement'
```

Or:
```
ZodError: Expected number, received string
  Received: "3"
```

These errors block entire DD and Hybrid report generation flows.

## Root Cause

LLM outputs are inherently unpredictable. Strict validators fail on:

| Variation | Example | Why It Fails |
|-----------|---------|--------------|
| Annotations | `"WEAK - reason"` | Extra text after value |
| Parentheticals | `"WEAK (explanation)"` | Parenthetical notes |
| Case variations | `"weak"` | Lowercase instead of uppercase |
| Synonyms | `"MODERATE"` | Valid synonym not in enum |
| String numbers | `"3"` or `"3/5"` | Number as string |

## Solution

### 1. Create `flexibleEnum()` Helper

```typescript
const ENUM_SYNONYMS: Record<string, string> = {
  MODERATE: 'SIGNIFICANT',
  MEDIUM: 'SIGNIFICANT',
  MINOR: 'MANAGEABLE',
  MAJOR: 'SEVERE',
  YES: 'VALIDATED',
  NO: 'INVALID',
  // ... more mappings
};

function flexibleEnum<T extends readonly [string, ...string[]]>(
  values: T,
  defaultValue: T[number],
): z.ZodEffects<z.ZodString, T[number], string> {
  return z.string().transform((val): T[number] => {
    // Step 1: Strip annotations ("WEAK - reason" → "WEAK")
    const stripped = val
      .replace(/\s*[-:(].*$/, '')
      .trim()
      .toUpperCase();

    // Step 2: Direct match
    if (values.includes(stripped as T[number])) {
      return stripped as T[number];
    }

    // Step 3: Check synonyms
    const synonym = ENUM_SYNONYMS[stripped];
    if (synonym && values.includes(synonym as T[number])) {
      return synonym as T[number];
    }

    // Step 4: Fallback with warning
    console.warn(`Enum fallback: "${val}" -> "${defaultValue}"`);
    return defaultValue;
  });
}
```

### 2. Create `flexibleNumber()` Helper

```typescript
function flexibleNumber(
  defaultValue: number,
  options?: { min?: number; max?: number },
): z.ZodEffects<z.ZodUnknown, number, unknown> {
  return z.unknown().transform((val): number => {
    if (typeof val === 'number' && !isNaN(val)) {
      let num = val;
      if (options?.min !== undefined) num = Math.max(num, options.min);
      if (options?.max !== undefined) num = Math.min(num, options.max);
      return num;
    }

    if (typeof val === 'string') {
      const match = val.match(/[\d.]+/);
      if (match) {
        const parsed = parseFloat(match[0]);
        if (!isNaN(parsed)) {
          let num = parsed;
          if (options?.min !== undefined) num = Math.max(num, options.min);
          if (options?.max !== undefined) num = Math.min(num, options.max);
          return num;
        }
      }
    }
    return defaultValue;
  });
}
```

### 3. Replace All Raw Validators

```typescript
// ❌ WRONG - Will break
verdict: z.enum(['STRONG', 'MODERATE', 'WEAK'])
score: z.number()

// ✅ CORRECT - Antifragile
verdict: flexibleEnum(['STRONG', 'MODERATE', 'WEAK'], 'MODERATE')
score: flexibleNumber(5, { min: 1, max: 10 })
```

## Prevention

### Pre-Change Check

Before modifying LLM schemas, run:
```bash
grep -c "z\.enum" apps/web/lib/llm/prompts/*/schemas.ts
```

If count > 0, convert ALL to `flexibleEnum` first.

### CLAUDE.md Documentation

Added "LLM Output Schemas (CRITICAL)" section to CLAUDE.md documenting:
- Never use raw `z.enum()` for LLM outputs
- Never use raw `z.number()` for LLM outputs
- Always use `flexibleEnum`/`flexibleNumber` helpers

### Testing

Test schemas with intentionally malformed inputs:
- `"WEAK - needs improvement"`
- `"high (confidence)"`
- `"3/5"`
- `"unknown"`

All should fallback gracefully without throwing.

## Files Modified

- `apps/web/lib/llm/prompts/dd/schemas.ts` - All enums converted
- `apps/web/lib/llm/prompts/hybrid/schemas.ts` - All enums converted
- `CLAUDE.md` - Added documentation section

## Related Documentation

- [Evidence-Based Schema Patterns](/docs/solutions/ai/evidence-based-schema-patterns.md)
- [Schema Antifragility](/docs/solutions/architecture/schema-antifragility-llm-output-20251223.md)
