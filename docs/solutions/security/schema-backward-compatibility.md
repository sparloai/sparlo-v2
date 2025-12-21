---
title: "Schema Backward Compatibility - SafeUrlSchema and SeverityLevel Fixes"
category: security
tags:
  - zod-schemas
  - backward-compatibility
  - security-validation
  - case-sensitivity
  - antifragile
severity: high
component: Hybrid Schema Validation
framework: Zod, TypeScript
date: 2025-12-20
status: resolved
---

# Schema Backward Compatibility

## Problem

After adding security hardening to the hybrid schema (P1/P2 fixes from code review), existing reports started failing validation and returning 404 errors. Two issues caused this:

### Issue 1: SafeUrlSchema Too Strict

The new URL validation rejected legitimate URLs:

```typescript
// Too strict - rejected valid URLs
const SafeUrlSchema = z.string()
  .url()
  .refine((url) => {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  });
```

Problem: LLM sometimes returns empty strings or placeholder text instead of URLs.

### Issue 2: SeverityLevel Case Mismatch

```typescript
// New schema expected lowercase
z.enum(['critical', 'high', 'medium', 'low'])

// Existing data had uppercase
"severity": "HIGH"
```

This caused validation failures for all existing reports with uppercase severity values.

## Solution

Made both schemas more lenient while maintaining security:

### SafeUrlSchema with Fallback

```typescript
// apps/web/lib/llm/prompts/hybrid/schemas.ts

export const SafeUrlSchema = z.string()
  .transform((val) => {
    // Accept empty/placeholder strings gracefully
    if (!val || val === 'N/A' || val === 'unknown' || val === '') {
      return '';
    }
    return val;
  })
  .pipe(
    z.string().refine((val) => {
      // Empty strings are valid (no URL provided)
      if (val === '') return true;

      // Validate actual URLs
      try {
        const parsed = new URL(val);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }, { message: 'Invalid URL format' })
  );
```

### SeverityLevel with Case Transformation

```typescript
// apps/web/lib/llm/prompts/hybrid/schemas.ts

export const SeverityLevel = z.enum(['critical', 'high', 'medium', 'low'])
  .or(z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
    .transform((val) => val.toLowerCase() as 'critical' | 'high' | 'medium' | 'low')
  );
```

## Key Patterns

### 1. Transform Before Validate

```typescript
// Pattern: Clean input, then validate
z.string()
  .transform(cleanInput)
  .pipe(z.string().refine(validate))
```

### 2. Accept Multiple Cases

```typescript
// Pattern: Accept both cases, normalize to one
z.enum(['low', 'med', 'high'])
  .or(z.enum(['LOW', 'MED', 'HIGH']).transform(v => v.toLowerCase()))
```

### 3. Graceful Empty Handling

```typescript
// Pattern: Allow empty/placeholder values
.transform((val) => {
  if (!val || val === 'N/A') return '';
  return val;
})
```

## Prevention

### Schema Change Checklist

When modifying Zod schemas:

- [ ] Check if existing data uses different casing
- [ ] Test with sample of production data before deploy
- [ ] Use `.transform()` for normalization before validation
- [ ] Consider `.catch()` for optional fields with defaults
- [ ] Add `.passthrough()` for objects that may have extra fields

### Antifragile Schema Patterns

```typescript
// ✅ Good: Accepts variations, normalizes internally
const FlexibleEnum = z.string()
  .transform(s => s.toLowerCase())
  .pipe(z.enum(['a', 'b', 'c']));

// ❌ Bad: Strict validation rejects valid variations
const StrictEnum = z.enum(['a', 'b', 'c']);

// ✅ Good: Falls back gracefully
const SafeArray = z.array(ItemSchema).catch([]);

// ❌ Bad: Throws on any item failure
const StrictArray = z.array(ItemSchema);
```

## Files Changed

- `apps/web/lib/llm/prompts/hybrid/schemas.ts`

## Commits

- `c24c0bd` - fix: make SafeUrlSchema and SeverityLevel backward compatible
- `223248b` - fix: improve hybrid schema security and validation

## Related

- `docs/solutions/ai/evidence-based-schema-patterns.md` - Antifragile schema design
- `docs/solutions/ai/prevention-strategies-evidence-based-prompts.md` - Schema patterns
