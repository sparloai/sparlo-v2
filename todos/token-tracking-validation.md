---
id: token-tracking-validation
title: Add input validation for token usage values
priority: P1
status: pending
category: security
source: code-review
created: 2025-12-20
files:
  - apps/web/lib/inngest/functions/generate-report.ts
  - apps/web/lib/inngest/functions/generate-discovery-report.ts
---

## Problem

The `calculateTotalUsage()` function accepts token values from Claude API responses without validation. Malformed or malicious values could cause runtime errors or incorrect calculations.

## Security Impact

- **Risk Level**: CRITICAL
- **Vulnerability Type**: Input Validation
- Token values are used in database operations and billing calculations

## Solution

Add validation in `calculateTotalUsage()`:

```typescript
function validateTokenUsage(usage: TokenUsage): TokenUsage {
  const validateNumber = (n: number): number => {
    if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) {
      return 0;
    }
    return Math.floor(n);
  };

  return {
    input_tokens: validateNumber(usage.input_tokens),
    output_tokens: validateNumber(usage.output_tokens),
    cache_creation_input_tokens: validateNumber(usage.cache_creation_input_tokens ?? 0),
    cache_read_input_tokens: validateNumber(usage.cache_read_input_tokens ?? 0),
  };
}
```

## Acceptance Criteria

- [ ] Token values validated as finite positive integers
- [ ] Invalid values default to 0 with warning log
- [ ] Validation applied before aggregation
