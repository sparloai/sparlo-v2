---
status: pending
priority: p1
issue_id: "107"
tags: [code-review, css, performance, animation]
dependencies: []
---

# Layout-Triggering Animations Cause Reflow

## Problem Statement

The `progress-fill` animation uses `width` property which triggers expensive layout reflows. Each width change forces browser to recalculate layout for parent containers.

**File**: `apps/web/styles/report-animations.css:467-470`

```css
/* ❌ REFLOW TRIGGER */
@keyframes progress-fill {
  from { width: 0%; }  /* Width changes cause layout reflow */
}
```

## Findings

- **Performance Oracle Agent**: Identified as REFLOW RISK
- Width animations have O(n) reflow cost where n = affected elements
- Estimated cost: 3-8ms per frame on mid-range devices
- Multiple progress bars animating = multiple synchronous reflows

## Proposed Solutions

### Solution A: Use transform: scaleX() (Recommended)
```css
@keyframes progress-fill {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.progress-animate {
  transform-origin: left center;
  animation: progress-fill 800ms var(--ease-out-expo) forwards;
}
```
- **Pros**: GPU-accelerated, no layout reflows
- **Cons**: Requires transform-origin setup
- **Effort**: 15 minutes
- **Risk**: Low

### Solution B: Use clip-path
```css
@keyframes progress-fill {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0 0 0 0); }
}
```
- **Pros**: No layout changes
- **Cons**: Less browser support
- **Effort**: 15 minutes
- **Risk**: Medium (browser compat)

## Recommended Action

Implement Solution A - replace width animation with transform: scaleX().

## Technical Details

**Affected Files:**
- `apps/web/styles/report-animations.css`

## Acceptance Criteria

- [ ] Progress animations use transform instead of width
- [ ] transform-origin set correctly (left center)
- [ ] Animation visual appearance unchanged
- [ ] No layout reflows during animation (verify in DevTools)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-25 | Created from performance review | Width animations trigger layout |

## Resources

- CSS Triggers: https://csstriggers.com/
- High Performance Animations: https://web.dev/animations-guide/
