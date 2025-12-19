---
status: ready
priority: p1
issue_id: "050"
tags: [accessibility, css, theme, report]
dependencies: []
---

# Report Theme Lacks Light Mode Support (Accessibility Issue)

## Problem Statement

The new report "Intelligence Briefing" theme is hardcoded to dark mode and ignores the user's system theme preference. This is an accessibility violation - users who need light mode for vision or reading preferences cannot access it for reports.

## Findings

**File:** `/apps/web/styles/report-tokens.css`

- All 156 CSS custom properties define dark theme colors
- No `@media (prefers-color-scheme: light)` support
- No `.dark` / `.light` class variants
- `.report-page` wrapper forces dark theme regardless of user preference
- Rest of app respects `dark:` Tailwind variant, creating inconsistent UX

**Architecture Review findings:**
- Critical Issue: No light mode support
- WCAG compliance risk
- Print styles also missing (dark backgrounds waste ink)

## Proposed Solutions

### Option 1: Add CSS Variables for Light Mode

**Approach:** Create light mode variants of all tokens and use `prefers-color-scheme` or Tailwind `dark:` class.

```css
.report-page {
  /* Light mode (default) */
  --void-black: #ffffff;
  --text-primary: rgba(0, 0, 0, 0.9);
}

.dark .report-page {
  /* Dark mode */
  --void-black: #050506;
  --text-primary: rgba(255, 255, 255, 0.95);
}
```

**Pros:**
- Full theme support
- Respects user preferences
- WCAG compliant

**Cons:**
- Doubles CSS token definitions
- Requires design decisions for light theme

**Effort:** 4-6 hours

**Risk:** Medium (design decisions needed)

---

### Option 2: Remove Custom Theme, Use Tailwind

**Approach:** Replace custom CSS with Tailwind utilities that automatically respect dark mode.

**Pros:**
- Automatic theme support
- Consistent with rest of app
- Less CSS to maintain

**Cons:**
- Loses "intelligence briefing" aesthetic
- Significant refactor

**Effort:** 8-12 hours

**Risk:** High (may lose design intent)

## Recommended Action

Implement Option 1 - add light mode variants. The dark "intelligence briefing" aesthetic should remain the default/preferred view, but users must have the ability to switch to light mode.

## Technical Details

**Affected files:**
- `apps/web/styles/report-tokens.css` - Add light mode tokens
- `apps/web/styles/report-base.css` - Update selectors for theme
- All report CSS files may need selector updates

**Related components:**
- All report components inherit from `.report-page` wrapper

## Acceptance Criteria

- [ ] Light mode variant tokens defined
- [ ] Report respects system `prefers-color-scheme`
- [ ] Report respects Tailwind `dark:` class toggle
- [ ] Contrast ratios meet WCAG AA standards in both modes
- [ ] Print styles work (light background)
- [ ] Visual review approved for light mode design

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Architecture Review Agent)

**Actions:**
- Identified dark mode lock-in as critical accessibility issue
- Analyzed CSS architecture for theme integration points
- Proposed two solution approaches

**Learnings:**
- Custom design systems must integrate with app theme infrastructure
- Accessibility requirements should be defined before implementation
