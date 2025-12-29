---
status: pending
priority: p2
issue_id: "108"
tags: [code-review, css, design-tokens, maintainability]
dependencies: []
---

# Hardcoded RGBA Colors Bypass Design Token System

## Problem Statement

Despite having an excellent design token system, 110+ hardcoded RGBA color values bypass the tokens, making theme changes difficult and inconsistent.

**Files Affected:**
- `apps/web/styles/report-components.css` - 47 instances of `rgba(139, 92, 246, 0.X)`
- `apps/web/styles/report-sections.css` - Multiple instances
- `apps/web/styles/report-base.css` - Several instances

**Example:**
```css
/* ❌ Hardcoded color */
.badge-pill--primary {
  border: 1px solid rgba(139, 92, 246, 0.2);
}

/* ✅ Should use token */
.badge-pill--primary {
  border: 1px solid var(--violet-400-20);  /* or similar token */
}
```

## Findings

- **Pattern Recognition Agent**: Found 110+ hardcoded color values
  - `rgba(139, 92, 246, 0.X)` - 47 instances (violet)
  - `rgba(255, 255, 255, 0.X)` - 35 instances (white)
  - `rgba(0, 0, 0, 0.X)` - 28 instances (black)
- These undermine the design token system's value
- Theme switching becomes inconsistent

## Proposed Solutions

### Solution A: Add Opacity Variants to Token System (Recommended)
Add tokens like:
```css
.report-page {
  --violet-400-10: rgba(139, 92, 246, 0.1);
  --violet-400-20: rgba(139, 92, 246, 0.2);
  --violet-400-30: rgba(139, 92, 246, 0.3);
  /* etc. */
}
```
- **Pros**: Full control via tokens, easy theme updates
- **Cons**: Adds more tokens
- **Effort**: 2 hours
- **Risk**: Low

### Solution B: Use color-mix() for Dynamic Opacity
```css
border: 1px solid color-mix(in srgb, var(--violet-400) 20%, transparent);
```
- **Pros**: Dynamic, fewer tokens needed
- **Cons**: Browser support (modern only)
- **Effort**: 3 hours
- **Risk**: Medium

## Recommended Action

Implement Solution A - add opacity variant tokens, then search-replace hardcoded values.

## Technical Details

**Affected Files:**
- `apps/web/styles/report-tokens.css` - Add new tokens
- `apps/web/styles/report-components.css` - Replace hardcoded values
- `apps/web/styles/report-sections.css` - Replace hardcoded values
- `apps/web/styles/report-base.css` - Replace hardcoded values

## Acceptance Criteria

- [ ] All `rgba(139, 92, 246, X)` replaced with tokens
- [ ] All `rgba(255, 255, 255, X)` replaced with tokens
- [ ] All `rgba(0, 0, 0, X)` replaced with tokens
- [ ] Visual appearance unchanged
- [ ] Theme switching works consistently

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-25 | Created from code review | Hardcoded colors undermine token system |

## Resources

- CSS Custom Properties: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
