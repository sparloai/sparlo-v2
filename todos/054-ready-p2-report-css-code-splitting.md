---
status: ready
priority: p2
issue_id: "054"
tags: [performance, css, bundle-size, next-js]
dependencies: []
---

# Report CSS Loaded Globally (Needs Code-Splitting)

## Problem Statement

All 7 report CSS files (~69KB uncompressed, ~12-15KB gzipped) are imported in globals.css and loaded on every page, including pages that don't display reports. This unnecessarily increases the CSS bundle size and delays First Contentful Paint.

## Findings

**File:** `/apps/web/styles/globals.css`
**Lines:** 20-27

```css
/* Report Intelligence Briefing Theme */
@import './report-tokens.css';
@import './report-base.css';
@import './report-modules.css';
@import './report-components.css';
@import './report-sections.css';
@import './report-tables.css';
@import './report-animations.css';
```

**Performance Review findings:**
- Total CSS: ~69KB uncompressed, ~12-15KB gzipped
- Impact: +50-80ms FCP delay on initial page load
- Loaded on ALL pages, even non-report pages
- CSS budget warning: pushing limits with +15KB gzipped

## Proposed Solutions

### Option 1: Dynamic Import in Report Layout

**Approach:** Move imports to report-specific layout or page component.

```typescript
// apps/web/app/home/(user)/reports/[id]/layout.tsx
import '@/styles/report-tokens.css';
import '@/styles/report-base.css';
// ... etc
```

**Pros:**
- Simple change
- CSS only loads on report routes
- No build configuration needed

**Cons:**
- Still loads all report CSS even for simple report views

**Effort:** 1 hour

**Risk:** Low

---

### Option 2: CSS Modules for Report Components

**Approach:** Convert to CSS Modules for automatic code-splitting.

```typescript
// structured-report.tsx
import styles from './structured-report.module.css';

<div className={styles.reportPage}>
```

**Pros:**
- Maximum code splitting
- Scoped styles (no global conflicts)
- Tree-shaking unused styles

**Cons:**
- Significant refactor
- Changes class name patterns

**Effort:** 6-8 hours

**Risk:** Medium

---

### Option 3: Next.js Page-Level CSS

**Approach:** Use `next/dynamic` with CSS imports.

**Pros:**
- Lazy loads CSS with component
- Follows Next.js patterns

**Cons:**
- More complex setup

**Effort:** 3-4 hours

**Risk:** Low

## Recommended Action

Implement Option 1 as immediate fix (move imports to report layout). Consider Option 2 as future optimization if report CSS continues to grow.

## Technical Details

**Affected files:**
- `apps/web/styles/globals.css` - Remove report imports
- `apps/web/app/home/(user)/reports/layout.tsx` - Add imports here

**Performance impact:**
- -12-15KB from initial page load
- Faster FCP on non-report pages

## Acceptance Criteria

- [ ] Report CSS not loaded on non-report pages (verify in Network tab)
- [ ] Report pages still render correctly
- [ ] No FOUC (flash of unstyled content) on reports
- [ ] Lighthouse performance score maintained or improved
- [ ] Bundle analysis shows CSS properly split

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Performance Review Agent)

**Actions:**
- Analyzed CSS bundle size impact
- Identified global import as performance issue
- Proposed code-splitting strategies

**Learnings:**
- Feature-specific CSS should be route-specific
- Global CSS imports affect all pages
- CSS code-splitting reduces initial load time
