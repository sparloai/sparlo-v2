---
module: Sparlo Web
date: 2025-12-23
problem_type: integration_issue
component: service_object
symptoms:
  - "LLM output validation failures when model returns unexpected field variations"
  - "Zod schema errors on valid-but-different LLM responses"
  - "Report generation failures due to strict schema validation"
root_cause: config_error
resolution_type: code_fix
severity: high
tags: [llm, schema, zod, antifragile, validation, ai]
---

# Antifragile Schema Design for LLM Output Validation

## Problem

LLM outputs are inherently variable - the same prompt can produce slightly different JSON structures. Strict Zod schemas caused validation failures when the LLM returned valid content in slightly different formats (e.g., `confidence` as string vs number, missing optional fields, extra fields).

## Environment

- Module: Sparlo Web - Hybrid Report Generation
- Framework: Next.js 16, Zod validation
- LLM: Claude/OpenAI for report generation
- Date: 2025-12-23

## Symptoms

- Schema validation errors like `Expected number, received string`
- Report generation failures with valid LLM content
- Inconsistent behavior between report generations
- Truncated JSON responses causing parse failures

## What Didn't Work

**Attempted Solution 1:** Adding more optional fields to schemas
- **Why it failed:** Didn't handle type variations (string vs number) or extra fields

**Attempted Solution 2:** Using `.passthrough()` on all schemas
- **Why it failed:** Lost type safety entirely, allowed garbage data through

## Solution

### Enum Factory Pattern

Created a factory function that generates flexible enums with fallback handling:

```typescript
// Before (fragile):
const confidenceSchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);

// After (antifragile):
function createFlexibleEnum<T extends string>(
  values: readonly T[],
  fallback: T
): z.ZodEffects<z.ZodString, T, string> {
  return z.string().transform((val) => {
    const normalized = val.toUpperCase().trim();
    if (values.includes(normalized as T)) {
      return normalized as T;
    }
    // Log unexpected value for monitoring
    console.warn(`[Schema] Unexpected enum value: ${val}, using fallback: ${fallback}`);
    return fallback;
  });
}

// Usage:
const confidenceSchema = createFlexibleEnum(
  ['HIGH', 'MEDIUM', 'LOW'] as const,
  'MEDIUM'
);
```

### Coercion for Number/String Variations

```typescript
// Before (fragile):
const scoreSchema = z.number().min(0).max(100);

// After (antifragile):
const scoreSchema = z.union([
  z.number(),
  z.string().transform((s) => {
    const parsed = parseFloat(s);
    return isNaN(parsed) ? 50 : Math.min(100, Math.max(0, parsed));
  }),
]).pipe(z.number().min(0).max(100));
```

### Deep Optional with Defaults

```typescript
// Before (fragile):
const analysisSchema = z.object({
  whats_wrong: z.object({
    prose: z.string(),
  }),
  root_causes: z.array(rootCauseSchema),
});

// After (antifragile):
const analysisSchema = z.object({
  whats_wrong: z.object({
    prose: z.string().default(''),
  }).optional().default({}),
  root_causes: z.array(rootCauseSchema).optional().default([]),
}).passthrough(); // Allow extra fields from LLM
```

### JSON Repair for Truncated Responses

```typescript
// In lib/llm/client.ts
function repairTruncatedJson(jsonString: string): string {
  let repaired = jsonString.trim();

  // Count unclosed brackets
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;

  // Close unclosed structures
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    repaired += ']';
  }
  for (let i = 0; i < openBraces - closeBraces; i++) {
    repaired += '}';
  }

  return repaired;
}
```

## Why This Works

1. **Enum Factory**: Normalizes case variations and provides sensible fallbacks instead of failing. `"high"`, `"High"`, `"HIGH"` all work.

2. **Type Coercion**: LLMs sometimes output `"85"` instead of `85`. Coercion handles both.

3. **Deep Defaults**: Missing optional fields get sensible defaults instead of causing validation failures.

4. **Passthrough**: Extra fields from LLM exploration are preserved, not rejected.

5. **JSON Repair**: Truncated responses (from token limits) are repaired by closing unclosed brackets/braces.

## Prevention

- **Design for Variance**: Always expect LLM output to vary from the ideal schema
- **Use Factories**: Create reusable schema patterns with built-in flexibility
- **Log Don't Fail**: Log unexpected values for monitoring, but continue with fallbacks
- **Test with Real Output**: Save example LLM outputs and use them as test fixtures
- **Token Headroom**: Use higher token limits (32k) to prevent truncation

## Related Issues

- See also: [p1-security-fixes-code-review-20251223.md](../security-issues/p1-security-fixes-code-review-20251223.md)
- See also: [type-extraction-large-components-20251223.md](../best-practices/type-extraction-large-components-20251223.md)
