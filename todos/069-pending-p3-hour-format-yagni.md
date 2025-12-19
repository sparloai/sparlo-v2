---
status: completed
priority: p3
issue_id: "069"
tags: [code-review, yagni, simplification]
dependencies: ["066"]
---

# Hour Format Support is YAGNI Violation

## Problem Statement

The `formatElapsed` function in `reports-dashboard.tsx` includes hour formatting:
```typescript
if (hours > 0) {
  return `${hours}:${mins}:${secs}`;
}
```

Reports typically take ~15 minutes. Hour-long reports don't currently exist.

## Findings

### Location: reports-dashboard.tsx (lines 47-56)

```typescript
function formatElapsed(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

**Evidence this is YAGNI**:
- Processing screen says "Analyses typically take ~15 minutes" (line 546)
- No current reports exceed 1 hour
- Extra code complexity for unused feature

## Proposed Solutions

### Option A: Simplify to M:SS Format (Recommended)
Remove hour handling until actually needed.

```typescript
function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

**Pros**: Simpler, YAGNI-compliant
**Cons**: Will need to add back if hour-long reports occur
**Effort**: Small (5 min)
**Risk**: Very low

### Option B: Keep Hour Support
Accept the extra complexity as future-proofing.

**Pros**: No change needed, handles edge case
**Cons**: Violates YAGNI
**Effort**: None
**Risk**: None

## Recommended Action

Option A - Simplify, but consider this LOW priority. Could defer until elapsed time extraction (todo 066).

## Technical Details

**Affected files**:
- `apps/web/app/home/(user)/_components/reports-dashboard.tsx`
- `apps/web/app/home/(user)/_components/processing-screen.tsx`

**Note**: Depends on todo 066 (extracting elapsed time utilities).

## Acceptance Criteria

- [ ] formatElapsed returns M:SS format only
- [ ] No hour calculation overhead
- [ ] All existing tests pass

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2024-12-19 | Created | From code review |

## Resources

- PR: Current branch changes
