---
status: completed
priority: p3
issue_id: "068"
tags: [code-review, error-handling, maintainability]
dependencies: []
---

# Brittle Error Message String Matching

## Problem Statement

Error type detection relies on string matching in the error message:
```typescript
const isRefusalError = progress.errorMessage?.includes('could not be processed');
```

If the error message text changes, this detection will break silently.

## Findings

### Location: processing-screen.tsx (line 270)

```typescript
const isRefusalError = progress.errorMessage?.includes(
  'could not be processed',
);
```

This pattern is fragile because:
1. Error message text could change without updating this check
2. Partial string matches could cause false positives
3. No compile-time safety

## Proposed Solutions

### Option A: Add Error Code Field (Recommended)
Add `error_code` column to database for structured error types.

```sql
ALTER TABLE sparlo_reports
ADD COLUMN error_code TEXT CHECK (error_code IN ('REFUSAL', 'TIMEOUT', 'GENERIC'));
```

```typescript
const isRefusalError = progress.errorCode === 'REFUSAL';
```

**Pros**: Type-safe, explicit, testable
**Cons**: Requires migration
**Effort**: Medium (1 hour)
**Risk**: Low

### Option B: Define Error Constants
Use constants for known error messages.

```typescript
const ERROR_PATTERNS = {
  REFUSAL: 'could not be processed',
} as const;

const isRefusalError = progress.errorMessage?.includes(ERROR_PATTERNS.REFUSAL);
```

**Pros**: Centralized, no migration needed
**Cons**: Still relies on string matching
**Effort**: Small (15 min)
**Risk**: Low

## Recommended Action

Option B for now (quick fix), with Option A as future enhancement.

## Technical Details

**Affected files**:
- `apps/web/app/home/(user)/_components/processing-screen.tsx`
- Optional: `apps/web/lib/inngest/functions/generate-report.ts`
- Optional: Database migration

## Acceptance Criteria

- [ ] Error type constants defined in shared location
- [ ] String matching uses constants
- [ ] Tests verify error type detection

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2024-12-19 | Created | From code review |

## Resources

- PR: Current branch changes
- Error source: generate-report.ts onFailure handler
