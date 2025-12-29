---
status: pending
priority: p2
issue_id: "112"
tags: [code-review, css, design-tokens]
dependencies: []
---

# Missing Design Tokens (Easing Curves, Font Sizes)

## Problem Statement

Several commonly used values are hardcoded with fallbacks because the design tokens they reference don't exist.

**Missing Tokens:**
```css
/* These tokens are REFERENCED but NOT DEFINED in report-tokens.css */
var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))   /* Used 20+ times */
var(--ease-spring, cubic-bezier(0.4, 0, 0.2, 1))      /* Used 15+ times */
var(--interaction-fast, 100ms)                         /* Used 10+ times */
var(--interaction-normal, 150ms)                       /* Used 15+ times */
var(--interaction-slow, 200ms)                         /* Used 20+ times */
--text-xxs: 9px                                        /* Used 15+ times as hardcoded value */
--radius-full: 9999px                                  /* Used 10+ times as hardcoded value */
```

## Findings

- **Pattern Recognition Agent**: Found tokens referenced but not defined
- **Architecture Agent**: Identified as token system gap
- Fallback values mask the missing tokens
- Inconsistent timing and easing across components

## Proposed Solutions

### Solution A: Add Missing Tokens (Recommended)
```css
/* Add to report-tokens.css */
.report-page {
  /* Typography additions */
  --text-xxs: 9px;

  /* Border radius additions */
  --radius-full: 9999px;

  /* Easing curves */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* Interaction timing */
  --interaction-fast: 100ms;
  --interaction-normal: 150ms;
  --interaction-slow: 200ms;
}
```
- **Pros**: Tokens become source of truth, removes fallbacks
- **Cons**: None
- **Effort**: 30 minutes
- **Risk**: None

## Recommended Action

Add all missing tokens to `report-tokens.css`.

## Technical Details

**Affected Files:**
- `apps/web/styles/report-tokens.css` - Add missing tokens
- All other report CSS files - Remove fallback values after tokens added

## Acceptance Criteria

- [ ] All referenced tokens exist in report-tokens.css
- [ ] Fallback values removed from other files
- [ ] Animation timing consistent
- [ ] Visual appearance unchanged

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-25 | Created from code review | All tokens should be defined, not just fallbacks |

## Resources

- Design Token Best Practices
