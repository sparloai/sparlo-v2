---
status: pending
priority: p2
issue_id: "113"
tags: [code-review, css, performance, simplicity]
dependencies: []
---

# Excessive nth-child Staggering Rules (22 Rules)

## Problem Statement

22 explicit `nth-child` rules are used for animation staggering when CSS calc() could achieve the same effect dynamically.

**File**: `apps/web/styles/report-animations.css`

```css
/* 22 hand-written rules across 3 sections */
.section-animate:nth-child(1) { animation-delay: 0ms; }
.section-animate:nth-child(2) { animation-delay: 80ms; }
.section-animate:nth-child(3) { animation-delay: 160ms; }
/* ... 7 more ... */

.scroll-reveal-stagger--visible > *:nth-child(1) { transition-delay: 0ms; }
/* ... 5 more ... */

.card-grid-animate > *:nth-child(1) { animation-delay: 0ms; }
/* ... 5 more ... */
```

## Findings

- **Performance Oracle Agent**: O(n) complexity per selector
- **Simplicity Reviewer**: Unnecessary repetition
- 22 selectors = 22 evaluations per parent element
- Limits scalability (what about 11+ items?)

## Proposed Solutions

### Solution A: CSS Custom Property with calc() (Recommended)
```css
/* Single rule, infinite scalability */
.section-animate {
  --stagger-index: 0;  /* Set via inline style */
  animation-delay: calc(var(--stagger-index) * 80ms);
}
```
HTML usage:
```html
<div class="section-animate" style="--stagger-index: 0">...</div>
<div class="section-animate" style="--stagger-index: 1">...</div>
```
- **Pros**: Single rule, unlimited items, dynamic
- **Cons**: Requires inline style or JS
- **Effort**: 1.5 hours
- **Risk**: Low

### Solution B: JavaScript IntersectionObserver
Set delay via JS when elements enter viewport.
- **Pros**: Full control, no CSS changes
- **Cons**: Requires JS, more complex
- **Effort**: 2 hours
- **Risk**: Low

## Recommended Action

Implement Solution A with inline style custom properties.

## Technical Details

**Affected Files:**
- `apps/web/styles/report-animations.css`
- React components that use staggered animations

**LOC Reduction:** ~25 lines

## Acceptance Criteria

- [ ] Single CSS rule replaces 22 nth-child rules
- [ ] Stagger animations work for any number of items
- [ ] Visual timing unchanged
- [ ] Performance improved (fewer selectors)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-25 | Created from code review | CSS calc() can replace nth-child patterns |

## Resources

- CSS calc() with custom properties
