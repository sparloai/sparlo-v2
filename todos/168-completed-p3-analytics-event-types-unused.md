---
status: completed
priority: p3
issue_id: "168"
tags: [code-simplification, dead-code, analytics]
dependencies: ["163", "164", "165", "166", "167"]
---

# Analytics Event Type Definitions Are Unused

## Problem Statement

The `events.ts` file defines TypeScript types for analytics events, but these types are never actually used for type-checking event calls. This is dead code that adds maintenance burden.

**Why it matters:**
- 80+ lines of unused code
- Maintenance burden without benefit
- False sense of type safety

## Findings

### Code Simplicity Reviewer Agent
The event type definitions in `packages/analytics/src/events.ts` are exported but never imported or used elsewhere. The actual tracking calls use plain strings and untyped objects.

**Evidence:**
```typescript
// packages/analytics/src/events.ts - 85 lines of types
export interface SignupStartedEvent { name: 'signup_started'; properties: {...} }
export interface ReportCompletedEvent { name: 'report_completed'; properties: {...} }
// ... many more

// Actual usage in analytics-events.tsx - ignores the types!
analytics.trackEvent('signup_started', {  // ← Plain string, not typed
  utm_source: ...,
});
```

## Proposed Solutions

### Option A: Delete the file (Recommended after other fixes)
**Pros:** Remove dead code, reduce maintenance
**Cons:** None - code is unused
**Effort:** Very Low (15 minutes)
**Risk:** None

### Option B: Actually use the types
**Pros:** Type-safe analytics
**Cons:** More complex API, not worth effort for analytics
**Effort:** High (2+ hours)
**Risk:** Low

## Recommended Action

Delete `events.ts` after higher-priority analytics issues are resolved. The types add no value if not enforced at call sites.

## Technical Details

**Affected Files:**
- `packages/analytics/src/events.ts` (delete)
- `packages/analytics/src/index.ts` (remove export)

**Lines Removed:** ~85 lines

## Acceptance Criteria

- [ ] events.ts deleted
- [ ] Export removed from index.ts
- [ ] Build passes
- [ ] No runtime impact

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | Type definitions need enforcement to have value |
