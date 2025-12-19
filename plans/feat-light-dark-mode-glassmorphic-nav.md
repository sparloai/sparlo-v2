# feat: Complete Light/Dark Mode Support + Glassmorphic Navigation Bar

## Overview

Implement comprehensive light/dark mode theming across all pages and create a premium glassmorphic navigation bar inspired by Palantir.com's clean, minimal aesthetic. The nav bar features a fixed position with semi-transparent background, subtle blur effect, and smooth transitions between states.

## Problem Statement

The Sparlo application has partial dark mode implementation with several issues:

1. **Hardcoded dark colors** in 11+ files prevent proper theme switching
2. **NavHeader** uses hardcoded `bg-[#111113]`, `border-[#1E1E21]` instead of CSS variables
3. **Inconsistent theming** across marketing, user, and admin sections
4. **No glassmorphic navigation** - current nav uses solid backgrounds
5. **Beta section** forced to dark mode only

## Research Summary

### Current Infrastructure (Working)
- **next-themes** properly configured in `apps/web/components/root-providers.tsx`
- **CSS variables** defined in `apps/web/styles/sparlo-tokens.css` with `:root` and `.dark` selectors
- **Theme toggle** exists in `PersonalAccountDropdown` and `NavHeader`
- **Feature flag** `enableThemeToggle` controls visibility (default: true)

### Palantir.com Nav Analysis
From live inspection, Palantir's navigation bar features:
- **Fixed position** at top of viewport
- **Clean white background** with subtle transparency (`rgba(255, 255, 255, 0.95)`)
- **Minimal blur effect** (approximately 8-10px)
- **Very subtle bottom border** for definition
- **No dramatic glassmorphism** - prioritizes readability over aesthetics
- **Content scrolls behind** the nav bar
- **Same style** at top of page and when scrolled

### Key Files Requiring Updates

| File | Issue | Priority |
|------|-------|----------|
| `apps/web/app/home/(user)/_components/navigation/nav-header.tsx` | Hardcoded dark colors | Critical |
| `apps/web/app/home/(user)/reports/new/page.tsx` | Hardcoded styles | High |
| `apps/web/app/home/(user)/_components/reports-dashboard.tsx` | Hardcoded colors | High |
| `apps/web/app/home/(user)/_components/processing-screen.tsx` | Hardcoded colors | High |
| `apps/web/app/(marketing)/_components/sparlo-hero.tsx` | Hardcoded colors | Medium |
| `apps/web/app/beta/layout.tsx` | Forced dark mode | Medium |
| `apps/web/app/beta/page.tsx` | Hardcoded dark colors | Medium |

## Technical Approach

### Phase 1: Glassmorphic Navigation Bar

#### 1.1 Create Glass Nav CSS Variables

**File: `apps/web/styles/sparlo-tokens.css`**

Add new navigation-specific variables:

```css
:root {
  /* Glassmorphic Nav - Light Mode */
  --nav-bg: rgba(255, 255, 255, 0.85);
  --nav-bg-solid: #ffffff;
  --nav-border: rgba(0, 0, 0, 0.08);
  --nav-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  --nav-blur: 12px;
  --nav-text: var(--text-primary);
  --nav-text-muted: var(--text-muted);
}

.dark {
  /* Glassmorphic Nav - Dark Mode */
  --nav-bg: rgba(10, 10, 11, 0.85);
  --nav-bg-solid: #0a0a0b;
  --nav-border: rgba(255, 255, 255, 0.08);
  --nav-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  --nav-blur: 12px;
  --nav-text: var(--text-primary);
  --nav-text-muted: var(--text-muted);
}

/* Reduced blur for mobile performance */
@media (max-width: 768px) {
  :root, .dark {
    --nav-blur: 8px;
  }
}
```

#### 1.2 Create Glassmorphic Nav Component

**File: `apps/web/app/home/(user)/_components/navigation/glass-nav.tsx`**

```tsx
'use client';

import { cn } from '@kit/ui/utils';

interface GlassNavProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassNav({ children, className }: GlassNavProps) {
  return (
    <header
      className={cn(
        // Base positioning
        'fixed top-0 left-0 right-0 z-50',
        // Glassmorphic effect
        'bg-[--nav-bg] backdrop-blur-[--nav-blur]',
        // Border and shadow
        'border-b border-[--nav-border]',
        'shadow-[--nav-shadow]',
        // Fallback for browsers without backdrop-filter
        'supports-[backdrop-filter]:bg-[--nav-bg]',
        'supports-not-[backdrop-filter]:bg-[--nav-bg-solid]',
        // Transition
        'transition-colors duration-200',
        className
      )}
    >
      {children}
    </header>
  );
}
```

#### 1.3 Update NavHeader Component

**File: `apps/web/app/home/(user)/_components/navigation/nav-header.tsx`**

Replace hardcoded colors with CSS variables:

```tsx
// BEFORE
className="bg-[#111113] border-[#1E1E21]"

// AFTER
className="bg-[--nav-bg] backdrop-blur-[12px] border-[--nav-border]"
```

Key changes:
- Replace `bg-[#111113]` → `bg-[--nav-bg]`
- Replace `border-[#1E1E21]` → `border-[--nav-border]`
- Add `backdrop-blur-[12px]` or `backdrop-blur-[--nav-blur]`
- Add `supports-[backdrop-filter]:` fallback
- Change `position: relative` → `position: fixed`
- Add padding to main content to account for fixed nav height

### Phase 2: Fix Hardcoded Colors in Pages

#### 2.1 Color Mapping Reference

| Hardcoded Value | CSS Variable | Context |
|-----------------|--------------|---------|
| `#050505` | `--surface-base` | Page backgrounds |
| `#0A0A0A` | `--surface-elevated` | Cards, elevated surfaces |
| `#111113` | `--surface-overlay` | Nav, overlays |
| `#1E1E21` | `--border-subtle` | Subtle borders |
| `text-white` | `text-[--text-primary]` | Primary text |
| `text-neutral-300` | `text-[--text-secondary]` | Secondary text |
| `text-neutral-400/500` | `text-[--text-muted]` | Muted text |
| `border-neutral-700/800` | `border-[--border-default]` | Standard borders |

#### 2.2 Page-by-Page Updates

**reports-dashboard.tsx:**
```tsx
// BEFORE
<div className="bg-[#0A0A0A] border-neutral-900">

// AFTER
<div className="bg-[--surface-elevated] border-[--border-subtle]">
```

**reports/new/page.tsx:**
```tsx
// BEFORE
<div className="bg-[#050505] text-neutral-300">

// AFTER
<div className="bg-[--surface-base] text-[--text-secondary]">
```

**processing-screen.tsx:**
```tsx
// BEFORE (clarifying state)
<div className="bg-[#050505] text-neutral-300">

// AFTER
<div className="bg-[--surface-base] text-[--text-secondary]">
```

### Phase 3: Layout Adjustments for Fixed Nav

#### 3.1 Update User Layout

**File: `apps/web/app/home/(user)/layout.tsx`**

Add top padding to account for fixed nav:

```tsx
export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[--surface-base]">
      <NavHeader />
      {/* Add padding-top equal to nav height (64px typical) */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
```

#### 3.2 CSS Variable for Nav Height

**File: `apps/web/styles/sparlo-tokens.css`**

```css
:root {
  --nav-height: 64px;
}

@media (max-width: 768px) {
  :root {
    --nav-height: 56px;
  }
}
```

### Phase 4: Beta Section Theme Support

**File: `apps/web/app/beta/layout.tsx`**

Remove forced dark mode, use standard theme:

```tsx
// BEFORE
<div className="dark bg-[#0a0a0b]">

// AFTER
<div className="bg-[--surface-base]">
```

### Phase 5: Accessibility & Performance

#### 5.1 Reduced Motion Support

**File: `apps/web/styles/sparlo-tokens.css`**

```css
@media (prefers-reduced-motion: reduce) {
  :root, .dark {
    --transition-duration: 0.01ms;
  }

  * {
    transition-duration: 0.01ms !important;
  }
}
```

#### 5.2 High Contrast Mode Fallback

```css
@media (prefers-contrast: more) {
  :root {
    --nav-bg: rgba(255, 255, 255, 1);
    --nav-border: rgba(0, 0, 0, 0.3);
  }

  .dark {
    --nav-bg: rgba(0, 0, 0, 1);
    --nav-border: rgba(255, 255, 255, 0.3);
  }
}
```

#### 5.3 Focus Indicators

Ensure visible focus states on glassmorphic backgrounds:

```css
.glass-nav a:focus-visible,
.glass-nav button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

## Acceptance Criteria

### Functional Requirements
- [ ] Theme toggle switches all pages between light/dark mode instantly
- [ ] No flash of wrong theme on page load (FOUC prevention)
- [ ] Theme preference persists across sessions (localStorage)
- [ ] System preference is respected when set to "system"
- [ ] All 36 pages render correctly in both themes

### Glassmorphic Nav Requirements
- [ ] Nav bar is fixed at top of viewport
- [ ] Semi-transparent background with blur effect visible
- [ ] Content scrolls behind the nav bar
- [ ] Nav maintains readability (4.5:1 contrast) in both themes
- [ ] Fallback to solid background when `backdrop-filter` unsupported

### Non-Functional Requirements
- [ ] Page load performance not degraded (blur is GPU-accelerated)
- [ ] Mobile devices use reduced blur (8px vs 12px)
- [ ] Reduced motion preference disables transitions
- [ ] Keyboard navigation works with visible focus indicators

### Quality Gates
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint:fix` passes
- [ ] Manual testing on Chrome, Safari, Firefox
- [ ] Mobile testing on iOS Safari and Chrome Android
- [ ] Accessibility audit passes (contrast ratios verified)

## Implementation Phases

### Phase 1: Foundation (Nav + CSS Variables)
1. Add glassmorphic CSS variables to `sparlo-tokens.css`
2. Update `NavHeader` component to use CSS variables
3. Make nav position fixed with backdrop blur
4. Add padding to layout for fixed nav

**Files to modify:**
- `apps/web/styles/sparlo-tokens.css`
- `apps/web/app/home/(user)/_components/navigation/nav-header.tsx`
- `apps/web/app/home/(user)/layout.tsx`

### Phase 2: Page Theme Fixes
1. Fix `reports-dashboard.tsx` hardcoded colors
2. Fix `reports/new/page.tsx` hardcoded colors
3. Fix `processing-screen.tsx` hardcoded colors
4. Fix `sparlo-hero.tsx` hardcoded colors

**Files to modify:**
- `apps/web/app/home/(user)/_components/reports-dashboard.tsx`
- `apps/web/app/home/(user)/reports/new/page.tsx`
- `apps/web/app/home/(user)/_components/processing-screen.tsx`
- `apps/web/app/(marketing)/_components/sparlo-hero.tsx`

### Phase 3: Beta Section + Polish
1. Fix beta section forced dark mode
2. Add accessibility improvements (reduced motion, high contrast)
3. Add browser fallbacks for `backdrop-filter`
4. Test all 36 pages in both themes

**Files to modify:**
- `apps/web/app/beta/layout.tsx`
- `apps/web/app/beta/page.tsx`
- `apps/web/styles/sparlo-tokens.css`

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| `backdrop-filter` not supported | Medium | Provide solid color fallback |
| Performance on low-end mobile | Medium | Reduce blur to 8px on mobile |
| Contrast issues with variable backgrounds | High | Use 0.85 opacity minimum + subtle text shadow |
| Theme flicker on page load | Medium | next-themes handles this with inline script |
| Breaking existing dark-mode-only designs | Low | CSS variables maintain visual hierarchy |

## References

### Internal Files
- Theme Provider: `apps/web/components/root-providers.tsx`
- Theme Toggle: `packages/ui/src/makerkit/mode-toggle.tsx`
- Brand Tokens: `apps/web/styles/sparlo-tokens.css`
- Shadcn Tokens: `apps/web/styles/shadcn-ui.css`
- NavHeader: `apps/web/app/home/(user)/_components/navigation/nav-header.tsx`

### External Documentation
- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [CSS backdrop-filter MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [WCAG Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

### Design Inspiration
- Palantir.com - Clean, minimal glassmorphic nav with high readability
- Apple.com - Fixed nav with subtle blur on scroll
