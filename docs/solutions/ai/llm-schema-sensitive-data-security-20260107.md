---
title: "Remove Sensitive Debug Logging and Type Casting Vulnerabilities from Due Diligence Schema Validators"
date: 2026-01-07
category: ai
tags:
  - logging
  - type-safety
  - zod-validation
  - llm-output-validation
  - dead-code-removal
  - production-hardening
  - security
severity: high
component: apps/web/lib/llm/prompts/dd/schemas.ts
symptoms:
  - "console.log/warn/error statements exposing sensitive LLM outputs in production logs (30+ instances)"
  - "Unsafe 'as unknown as' type casts bypassing TypeScript type safety"
  - "Code duplication via unused helper functions"
  - "Large hardcoded default data structures creating maintenance burden"
  - "Inconsistent null/undefined handling across DD0, DD3, DD3.5, DD4, DD5 schemas"
related_docs:
  - docs/solutions/ai/llm-schema-antifragility-patterns.md
  - docs/solutions/architecture/schema-antifragility-llm-output-20251223.md
---

# Remove Sensitive Debug Logging and Type Casting Vulnerabilities from Due Diligence Schema Validators

## Problem

The Due Diligence (DD) schema validation file had multiple security and code quality issues that could expose sensitive LLM output in production logs and bypass TypeScript type safety.

### Symptoms

1. **30+ console statements** logging raw LLM output to production logs
2. **Unsafe `as unknown as` type casts** bypassing TypeScript validation
3. **Duplicated null-processing code** across DD0, DD3.5, DD4, DD5 schemas
4. **Dead code** (unused `_flexibleEnumOptional` helper)
5. **Large default objects** (~86 lines) duplicating schema definitions

## Root Cause

Debug logging was added during development but never removed before production. Type casts were used as shortcuts instead of proper Zod validation. Code was duplicated across schemas without extraction into shared helpers.

## Solution

### 1. Remove All Console Statements

Removed all `console.log`, `console.warn`, and `console.error` statements that could expose sensitive LLM output:

```typescript
// BEFORE - Sensitive data exposure
console.warn(
  `[DD Schema] Enum fallback: "${val}" -> "${defaultValue}" (valid: ${values.join(', ')})`
);
return defaultValue;

// AFTER - Silent fallback
// Step 6: Fall back to default (silent - sensitive values not logged)
return defaultValue;
```

### 2. Replace Unsafe Type Casts with Schema.parse({})

Replaced `as unknown as` casts with proper Zod validation:

```typescript
// BEFORE - Bypasses type safety
return DD3_M_DefaultStructuredData as unknown as z.infer<typeof DD3_M_StructuredDataSchema>;

// AFTER - Type-safe default generation
return DD3_M_StructuredDataSchema.parse({});
```

### 3. Extract Shared processNullValues Helper

Created a single helper function for null preprocessing:

```typescript
/**
 * Shared helper to recursively convert null to undefined and filter empty objects from arrays.
 * Used by DD0, DD3.5, DD4 schemas for preprocessing LLM output.
 */
function processNullValues(v: unknown): unknown {
  if (v === null) return undefined;
  if (Array.isArray(v)) {
    return v
      .filter((item) => {
        if (item === null || item === undefined) return false;
        if (
          typeof item === 'object' &&
          item !== null &&
          Object.keys(item).length === 0
        )
          return false;
        return true;
      })
      .map(processNullValues);
  }
  if (typeof v === 'object' && v !== null) {
    return Object.fromEntries(
      Object.entries(v).map(([k, val]) => [k, processNullValues(val)]),
    );
  }
  return v;
}
```

### 4. Delete Dead Code

Removed unused helper functions:
- `_flexibleEnumOptional`

### 5. Standardize Default Handling

Replaced large default data objects with `Schema.parse({})` pattern:

```typescript
// BEFORE - 86-line hardcoded default object
const DD3_M_DefaultStructuredData = {
  claim_validation: { ... },
  evidence_matrix: { ... },
  // ... many more lines
};

// AFTER - Schema generates defaults from field definitions
return DD3_M_StructuredDataSchema.parse({});
```

## Prevention Strategies

### Code Review Checklist

- [ ] No `console.log/warn/error` statements in production code
- [ ] No `as unknown as` type casts - use `Schema.parse()` or `Schema.safeParse()`
- [ ] Check for duplicate code that could be extracted into shared helpers
- [ ] Verify unused code is deleted, not just prefixed with `_`
- [ ] Large default objects should use `Schema.parse({})` pattern

### Linting Rules

Consider adding ESLint rules:

```json
{
  "no-console": "error",
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/consistent-type-assertions": [
    "error",
    { "assertionStyle": "never" }
  ]
}
```

### Testing Strategy

1. **Schema validation tests** - Ensure schemas handle malformed LLM output gracefully
2. **Log output tests** - Verify no sensitive data appears in logs
3. **Type safety tests** - TypeScript strict mode catches unsafe casts

## Key Patterns

### Antifragile Schema Pattern

```typescript
export const DD_OutputSchema = z
  .unknown()
  .transform((val) => {
    // Handle invalid input gracefully
    if (!val || typeof val !== 'object') {
      return InnerSchema.parse({}); // Safe default
    }

    // Preprocess nulls
    const processed = processNullValues(val);

    // Validate with safeParse for error handling
    const result = InnerSchema.safeParse(processed);
    if (result.success) {
      return result.data;
    }

    // Fallback to defaults on validation failure
    return InnerSchema.parse({});
  });
```

## Files Changed

- `apps/web/lib/llm/prompts/dd/schemas.ts` - Main schema file (2,958 lines)

## Related Documentation

- [LLM Schema Antifragility Patterns](./llm-schema-antifragility-patterns.md)
- [CLAUDE.md LLM Schema Guidelines](/CLAUDE.md#llm-output-schemas-critical)
