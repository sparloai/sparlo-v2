---
status: pending
priority: p1
issue_id: "105"
tags: [code-review, css, performance]
dependencies: []
---

# Excessive will-change Usage Wastes GPU Memory

## Problem Statement

Multiple CSS components use `will-change: transform, box-shadow` unconditionally, creating GPU compositor layers for static elements that aren't animating. This wastes ~5-8MB of GPU memory.

**Files Affected:**
- `apps/web/styles/report-components.css:616`
- `apps/web/styles/report-sections.css:787`

## Findings

- **Performance Oracle Agent**: Identified as PERFORMANCE CRITICAL
- Each `will-change` declaration creates a new compositor layer
- With 20 buttons + 10 concept cards = ~30 unnecessary GPU layers
- Estimated GPU memory overhead: 5-8MB for static elements

**Current Code:**
```css
.btn {
  will-change: transform, box-shadow;  /* ❌ Always active */
  transition: transform 150ms, box-shadow 150ms;
}

.concept-card {
  will-change: transform, box-shadow;  /* ❌ Always active */
}
```

## Proposed Solutions

### Solution A: Remove from Base State, Add on Hover (Recommended)
```css
.btn {
  transition: transform 150ms, box-shadow 150ms;
}

.btn:hover,
.btn:active {
  will-change: transform;  /* ✅ Only during interaction */
}
```
- **Pros**: Eliminates GPU memory waste, maintains smooth animations
- **Cons**: Slightly delayed layer promotion on first hover
- **Effort**: 30 minutes
- **Risk**: Low

### Solution B: Use CSS Containment Instead
```css
.btn {
  contain: layout style;  /* ✅ Lighter optimization */
  transition: transform 150ms, box-shadow 150ms;
}
```
- **Pros**: Layout isolation without GPU layers
- **Cons**: Less animation optimization
- **Effort**: 30 minutes
- **Risk**: Low

## Recommended Action

Implement Solution A - remove `will-change` from base state and add only on `:hover`/`:focus`.

## Technical Details

**Affected Files:**
- `apps/web/styles/report-components.css` - buttons, badges
- `apps/web/styles/report-sections.css` - concept cards, constraint cards

## Acceptance Criteria

- [ ] No unconditional `will-change` in base element states
- [ ] `will-change` only applied during `:hover`, `:focus`, or `:active`
- [ ] Animations remain smooth (test visually)
- [ ] GPU memory usage reduced (verify in Chrome DevTools)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-25 | Created from performance review | will-change creates GPU layers unconditionally |

## Resources

- MDN will-change: https://developer.mozilla.org/en-US/docs/Web/CSS/will-change
- CSS Triggers: https://csstriggers.com/
