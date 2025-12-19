---
status: ready
priority: p3
issue_id: "055"
tags: [css, design-system, refactor, report]
dependencies: []
---

# Missing Design Tokens and Hardcoded Values in Report CSS

## Problem Statement

The report CSS files contain 30+ hardcoded RGBA values and use font sizes (like 9px) that aren't defined in the token system. This creates maintenance burden and inconsistency.

## Findings

**Pattern Recognition Review findings:**

**Hardcoded RGBA values (30+ instances):**
```css
/* Used throughout but not in tokens */
background: rgba(255, 255, 255, 0.02);
background: rgba(255, 255, 255, 0.03);
background: rgba(255, 255, 255, 0.05);
background: rgba(255, 255, 255, 0.06);
```

**Missing font-size token:**
```css
/* Used 8+ times but not in token system */
font-size: 9px;
```

**Tokens exist but aren't used consistently:**
```css
/* report-tokens.css has: */
--border-subtle: rgba(255, 255, 255, 0.04);
--text-xs: 10px;

/* But code uses hardcoded values instead */
```

## Proposed Solutions

### Option 1: Add Missing Tokens

**Approach:** Add missing tokens to report-tokens.css and update usages.

```css
/* Add to report-tokens.css */
--text-2xs: 9px;
--bg-subtle: rgba(255, 255, 255, 0.02);
--bg-muted: rgba(255, 255, 255, 0.03);
--bg-default: rgba(255, 255, 255, 0.05);
--bg-elevated: rgba(255, 255, 255, 0.06);
```

**Pros:**
- Consistent design system
- Single source of truth
- Easy to update globally

**Cons:**
- Requires updating 30+ usages

**Effort:** 2-3 hours

**Risk:** Low

---

### Option 2: Create Label Utility Classes

**Approach:** Create reusable utility classes for repeated patterns.

```css
.label-xs {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
}
```

**Pros:**
- Eliminates 35+ duplicate declarations
- More maintainable
- DRY principle

**Cons:**
- Requires refactoring component classes

**Effort:** 3-4 hours

**Risk:** Low

## Recommended Action

Implement both options: first add missing tokens (Option 1), then consolidate into utility classes (Option 2) for label patterns.

## Technical Details

**Affected files:**
- `apps/web/styles/report-tokens.css` - Add missing tokens
- `apps/web/styles/report-components.css` - Update hardcoded values
- `apps/web/styles/report-sections.css` - Update hardcoded values
- All report CSS files

**Specific changes:**
- Add `--text-2xs: 9px` token
- Add background opacity tokens
- Replace 30+ hardcoded values with tokens
- Create label utility classes

## Acceptance Criteria

- [ ] All font-size values use tokens
- [ ] All background opacity values use tokens
- [ ] No hardcoded rgba() values in report CSS
- [ ] Label utility classes created and used
- [ ] Visual appearance unchanged after refactor

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Pattern Recognition Agent)

**Actions:**
- Identified 30+ hardcoded RGBA values
- Found 8+ uses of 9px without token
- Identified 35+ duplicate label patterns
- Documented consolidation opportunities

**Learnings:**
- Design tokens should cover all used values
- Repeated patterns should be extracted to utilities
- Code review catches design system drift
