---
status: completed
priority: p3
issue_id: "138"
tags: [code-review, token-gating, simplification, yagni]
dependencies: []
---

# NewAnalysisForm Could Be Simplified

## Problem Statement

The NewAnalysisForm component at 700 lines contains several features that may be YAGNI (detection indicators, keyboard shortcuts, duplicate submit handlers). These add complexity without clear user value.

## Findings

**File:** `apps/web/app/home/(user)/reports/new/_components/new-analysis-form.tsx`

**Potential removals:**
1. Detection indicators (70 lines) - cosmetic UX polish, not core
2. Keyboard shortcuts (12 lines) - power user feature, rarely used
3. Duplicate submit handlers (60 lines) - `handleContinue` and `handleRunAnalysis` are 90% identical

**Potential total reduction:** ~140 lines (20%)

## Proposed Solutions

### Solution A: Consolidate Submit Handlers
Merge `handleContinue` and `handleRunAnalysis` into single function.

**Pros:** Eliminates duplication, easier maintenance
**Cons:** Minor refactor
**Effort:** Small (1 hour)
**Risk:** Low

```typescript
async function handleSubmit(clarificationText?: string) {
  const challenge = clarificationText
    ? `${problemText}\n\nAdditional: ${clarificationText}`
    : problemText;

  const result = await startReportGeneration({
    designChallenge: challenge,
    attachments: attachments.map(...)
  });
  // Single success/error handling path
}
```

### Solution B: Remove Detection Indicators
Delete the pattern-matching "Problem/Constraints/Success" indicators.

**Pros:** Removes 70+ lines of regex
**Cons:** Loses visual feedback (may be valued by users)
**Effort:** Small (30 minutes)
**Risk:** Low - verify with analytics first

## Recommended Action

Consolidate submit handlers as quick win. For detection indicators, check analytics before removing.

## Technical Details

**Affected Files:**
- `apps/web/app/home/(user)/reports/new/_components/new-analysis-form.tsx`

## Acceptance Criteria

- [ ] Single submit handler function
- [ ] No duplicate error handling code
- [ ] All existing functionality preserved

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-02 | Created from simplicity review | DHH approved server pattern, flagged client bloat |

## Resources

- Code simplicity review
- DHH review: "These are 70 lines of client-side fluff"
