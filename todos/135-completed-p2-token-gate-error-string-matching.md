---
status: completed
priority: p2
issue_id: "135"
tags: [code-review, token-gating, maintainability]
dependencies: []
---

# Error String Matching Is Brittle

## Problem Statement

The token gating client component uses string matching to detect usage errors, which is fragile and could break if error messages change.

## Findings

**File:** `apps/web/app/home/(user)/reports/new/_components/new-analysis-form.tsx` (lines 305-310)

```typescript
const isUsageError =
  errorMessage.includes('Usage limit') ||
  errorMessage.includes('subscription');

if (isUsageError) {
  router.refresh();
}
```

**Issues:**
- String matching is brittle - changes to error message wording break detection
- No type safety for error categories
- Difficult to maintain across multiple files

## Proposed Solutions

### Solution A: Typed Error Classes (Recommended)
Create typed error classes for different error categories.

**Pros:** Type-safe, extensible, clear categorization
**Cons:** More code to write initially
**Effort:** Small (1-2 hours)
**Risk:** Low

```typescript
// lib/errors/usage-errors.ts
export class UsageLimitError extends Error {
  constructor(
    public readonly reason: 'subscription_required' | 'limit_exceeded',
    public readonly percentage?: number
  ) {
    super('Usage limit reached');
    this.name = 'UsageLimitError';
  }
}

// Server action
if (!usage.allowed) {
  throw new UsageLimitError(usage.reason, usage.percentage);
}

// Client
catch (err) {
  if (err instanceof UsageLimitError) {
    router.refresh();
  }
}
```

### Solution B: Error Codes
Use error codes instead of string matching.

**Pros:** Simple to implement
**Cons:** Less type safety than Solution A
**Effort:** Small (1 hour)
**Risk:** Low

## Recommended Action

Implement Solution A when making related changes to this file.

## Technical Details

**Affected Files:**
- `apps/web/app/home/(user)/reports/new/_components/new-analysis-form.tsx`
- `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`

## Acceptance Criteria

- [ ] Error types defined in shared location
- [ ] Server actions throw typed errors
- [ ] Client catches typed errors
- [ ] String matching removed

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-02 | Created from code review | DHH reviewer flagged as string parsing anti-pattern |

## Resources

- PR: Token gating implementation
- Related: Security review noted this as information leakage vector
