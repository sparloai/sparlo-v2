---
id: extract-calculate-total-usage
title: Extract calculateTotalUsage to shared utility
priority: P2
status: pending
category: architecture
source: code-review
created: 2025-12-20
files:
  - apps/web/lib/inngest/functions/generate-report.ts
  - apps/web/lib/inngest/functions/generate-discovery-report.ts
---

## Problem

`calculateTotalUsage()` is duplicated in both report generation files (~60 lines each). This violates DRY and creates maintenance burden.

## Solution

Extract to shared utility:

```typescript
// apps/web/lib/inngest/utils/token-usage.ts
import 'server-only';

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export function calculateTotalUsage(
  usages: (TokenUsage | null)[],
  stepNames?: string[]
): { total: TokenUsage; byStep: Record<string, TokenUsage> } {
  // Implementation with validation
}
```

## Acceptance Criteria

- [ ] Create `apps/web/lib/inngest/utils/token-usage.ts`
- [ ] Export `TokenUsage` interface and `calculateTotalUsage` function
- [ ] Update both report files to import from shared utility
- [ ] Add input validation (see token-tracking-validation todo)
- [ ] Typecheck passes
