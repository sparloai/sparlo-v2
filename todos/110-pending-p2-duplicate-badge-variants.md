---
status: pending
priority: p2
issue_id: "110"
tags: [code-review, css, duplication, simplicity]
dependencies: []
---

# Duplicate Badge Variant CSS (250+ Lines Redundant)

## Problem Statement

Four separate badge types (pill, tag, score, status) each define identical 5-color variants with nearly identical CSS. This creates ~250 lines of redundant code.

**Files Affected:**
- `apps/web/styles/report-components.css`

**Duplicate Pattern:**
```css
/* Same 5 color variants repeated 4 times */
.badge-pill--go { ... }
.badge-pill--warning { ... }
.badge-pill--nogo { ... }
.badge-pill--neutral { ... }
.badge-pill--accent { ... }

.tag-badge--go { ... }      /* Same colors! */
.tag-badge--warning { ... }
/* etc. */
```

## Findings

- **Simplicity Reviewer**: Identified as excessive duplication
- 4 badge types × 5 color variants = 20 CSS blocks
- Only differences: colors and minor structure
- Should consolidate into single system with modifiers

## Proposed Solutions

### Solution A: CSS Custom Property System (Recommended)
```css
/* Base badge with color variables */
.badge {
  display: inline-flex;
  padding: var(--badge-py, 4px) var(--badge-px, 10px);
  background: var(--badge-bg);
  color: var(--badge-color);
  border: 1px solid var(--badge-border);
  border-radius: var(--badge-radius, 4px);
}

/* Size/shape modifiers */
.badge--pill { --badge-radius: 9999px; }
.badge--tag { background: transparent; }

/* Color modifiers (shared across all badge types) */
.badge--go {
  --badge-bg: var(--go-bg);
  --badge-color: var(--go-color);
  --badge-border: var(--go-border);
}
```
- **Pros**: DRY code, easy to add colors, ~200 lines saved
- **Cons**: Requires HTML class changes
- **Effort**: 3 hours
- **Risk**: Medium (requires component updates)

### Solution B: Sass/PostCSS Mixins
Use preprocessor to generate variants from single source.
- **Pros**: Generates current output, no HTML changes
- **Cons**: Adds build dependency
- **Effort**: 2 hours
- **Risk**: Low

## Recommended Action

Implement Solution A for long-term maintainability.

## Technical Details

**Affected Files:**
- `apps/web/styles/report-components.css`
- Components using badge classes

**Estimated LOC Reduction:** ~200 lines (76% reduction in badge CSS)

## Acceptance Criteria

- [ ] Single badge base class with modifiers
- [ ] All 5 color variants work with all badge types
- [ ] Visual appearance unchanged
- [ ] ~200 lines of CSS removed

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-25 | Created from simplicity review | DRY principle applies to CSS |

## Resources

- BEM Methodology: https://getbem.com/
