---
status: pending
priority: p3
issue_id: "116"
tags: [code-review, css, accessibility, a11y]
dependencies: []
---

# Missing Focus-Visible States for Accessibility

## Problem Statement

Many interactive components lack `:focus-visible` styles, making keyboard navigation difficult for users who rely on it.

**Missing Focus States:**
```css
/* Components missing :focus-visible */
.module           /* No focus outline */
.concept-card     /* No focus outline */
.constraint-card  /* No focus outline */
.badge-pill       /* No focus outline */
.report-nav-link  /* Has :hover but not :focus-visible */
```

## Findings

- **Architecture Agent**: Identified as HIGH RISK accessibility gap
- Interactive elements need visible focus indicators
- Current CSS has `:hover` states but often missing `:focus-visible`
- Required for WCAG 2.1 AA compliance

## Proposed Solutions

### Solution A: Add Focus-Visible Styles (Recommended)
```css
.module:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.concept-card:focus-visible,
.constraint-card:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```
- **Pros**: Proper keyboard navigation support
- **Cons**: Minor visual addition
- **Effort**: 1 hour
- **Risk**: None

### Solution B: Create Focus Utility Class
```css
.focusable:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```
Add class to all interactive elements.
- **Pros**: Single source of truth
- **Cons**: Requires HTML updates
- **Effort**: 1.5 hours
- **Risk**: Low

## Recommended Action

Implement Solution A for immediate fix, consider Solution B for long-term.

## Technical Details

**Affected Files:**
- `apps/web/styles/report-components.css`
- `apps/web/styles/report-sections.css`
- `apps/web/styles/report-tables.css`

**Interactive Elements Needing Focus:**
- All cards (module, concept, constraint, risk, pattern)
- All buttons and links
- Table sorting controls
- Navigation items
- Chat trigger button

## Acceptance Criteria

- [ ] All interactive elements have `:focus-visible` state
- [ ] Focus indicator visible and meets contrast requirements
- [ ] Keyboard navigation tested and working
- [ ] Lighthouse accessibility score improved

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-25 | Created from architecture review | Accessibility requires visible focus states |

## Resources

- WCAG Focus Visible: https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html
- :focus-visible MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible
