---
status: pending
priority: p3
issue_id: 210
tags: [code-review, performance, help-center]
dependencies: []
---

# AbortController Reference Not Cleared on Cleanup

## Problem Statement

The `abortControllerRef.current` is not cleared after abort, potentially keeping large closures in memory until garbage collection.

## Findings

**Location**: `apps/web/components/help-widget/help-chat-widget.tsx` (lines 63-67)

**Current Code**:
```typescript
useEffect(() => {
  return () => {
    abortControllerRef.current?.abort();
    // Reference not cleared
  };
}, []);
```

## Proposed Solutions

### Solution A: Clear Reference on Cleanup (Recommended)
**Pros**: Reduces memory footprint, ensures GC can clean up
**Cons**: None
**Effort**: Trivial (1 min)
**Risk**: None

```typescript
useEffect(() => {
  return () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  };
}, []);
```

## Technical Details

- **Affected Files**: `apps/web/components/help-widget/help-chat-widget.tsx`
- **Components**: AbortController cleanup
- **Database Changes**: None

## Acceptance Criteria

- [ ] abortControllerRef cleared on unmount
- [ ] No regression in abort functionality

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Performance review finding |

## Resources

- Agent: performance-oracle review
