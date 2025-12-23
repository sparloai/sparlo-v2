---
status: pending
priority: p2
issue_id: "099"
tags:
  - code-review
  - react
  - performance
dependencies: []
---

# Unstable Map Keys Mixing ID with Index

## Problem Statement

Multiple map operations use `key={item.id ?? idx}` pattern, which creates unpredictable key behavior and potential React reconciliation issues.

## Findings

- **File:** `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`
- **Lines:** 1567, 1858, 2087 (multiple occurrences)
- **Agent:** TypeScript Reviewer, Performance Oracle

Pattern found:
```typescript
{track.supporting_concepts.map((concept, idx) => (
  <div key={concept.id ?? idx}>  // Mixing stable and unstable keys
```

**Issues:**
- If `concept.id` exists: stable key (good)
- If `concept.id` is undefined: uses index (bad)
- Unpredictable reconciliation behavior on reordering
- Lost component state when items change

## Proposed Solutions

### Option A: Require Stable IDs in Schema (Recommended)
**Pros:** Clean solution, consistent behavior
**Cons:** Schema change required
**Effort:** 1 hour
**Risk:** Low

Make `id` required in interface and ensure it's populated.

### Option B: Generate Composite Keys
**Pros:** Works with current data
**Cons:** More complex
**Effort:** 2 hours
**Risk:** Low

```typescript
const conceptsWithKeys = useMemo(
  () => track.supporting_concepts.map((c, i) => ({
    ...c,
    key: c.id || `concept-${i}-${c.title}`
  })),
  [track.supporting_concepts]
);
```

## Technical Details

### Affected Files
- `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`

### Pattern to Fix
Search for: `?? idx}` or `?? index}`

## Acceptance Criteria

- [ ] All map operations use stable, unique keys
- [ ] No index-based fallbacks for keys
- [ ] Component state preserved on reordering

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-23 | Created from code review | - |

## Resources

- PR: Current uncommitted changes
- Related: TypeScript Reviewer, Performance Oracle findings
