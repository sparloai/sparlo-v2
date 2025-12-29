---
module: Reports
date: 2025-12-29
problem_type: performance_issue
component: frontend_stimulus
symptoms:
  - "Duplicate IntersectionObserver instances for TOC tracking"
  - "Multiple scroll event listeners on same page"
  - "Each TocNavItem component creating its own scroll listener"
root_cause: logic_error
resolution_type: code_fix
severity: high
tags: [toc, scroll, intersection-observer, hooks, react, performance]
---

# Troubleshooting: Duplicate TOC Scroll Listeners Causing Performance Issues

## Problem
The Table of Contents (TOC) implementation had duplicate scroll tracking logic spread across multiple components, resulting in multiple IntersectionObserver instances and scroll event listeners on the same page.

## Environment
- Module: Reports / Brand System
- Framework: Next.js 16 with React 19
- Affected Components: `table-of-contents.tsx`, `brand-system-report.tsx`
- Date: 2025-12-29

## Symptoms
- `table-of-contents.tsx` had its own IntersectionObserver and scroll listener
- `brand-system-report.tsx` TocNavItem component had a separate scroll listener per item
- `example-reports-section.tsx` had yet another navigation tracking implementation
- Memory and CPU overhead from duplicate observers

## What Didn't Work

**Direct solution:** The problem was identified through code review and fixed by creating a shared hook.

## Solution

**Step 1: Create shared scroll tracking hook**

```typescript
// _lib/hooks/use-toc-scroll.ts
'use client';

import { useCallback, useEffect, useState } from 'react';

// Constants extracted from magic numbers
export const TOC_SCROLL_OFFSET = 100;
export const TOC_STICKY_TOP = 96;
export const TOC_STICKY_TOP_WITH_NAV = 112;

const OBSERVER_ROOT_MARGIN = '-20% 0px -75% 0px';
const SCROLL_VISIBILITY_THRESHOLD = 0.5;

export interface TocSection {
  id: string;
  title: string;
  subsections?: { id: string; title: string }[];
}

interface UseTocScrollOptions {
  sectionIds: string[];
  scrollOffset?: number;
  trackProgress?: boolean;
  trackVisibility?: boolean;
}

export function useTocScroll({
  sectionIds,
  scrollOffset = TOC_SCROLL_OFFSET,
  trackProgress = false,
  trackVisibility = false,
}: UseTocScrollOptions) {
  const [activeSection, setActiveSection] = useState<string>(sectionIds[0] ?? '');
  const [progress, setProgress] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Single IntersectionObserver for all sections
  useEffect(() => {
    if (sectionIds.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      }
    }, { rootMargin: OBSERVER_ROOT_MARGIN, threshold: 0 });

    for (const id of sectionIds) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [sectionIds]);

  // Single scroll listener (only when features needed)
  useEffect(() => {
    if (!trackProgress && !trackVisibility) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      window.requestAnimationFrame(() => {
        // ... scroll logic
        ticking = false;
      });
      ticking = true;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trackProgress, trackVisibility]);

  const navigateToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - scrollOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, [scrollOffset]);

  return { activeSection, navigateToSection, progress, hasScrolled };
}

// Utility to flatten sections
export function flattenSectionIds(sections: TocSection[]): string[] {
  const ids: string[] = [];
  for (const section of sections) {
    ids.push(section.id);
    if (section.subsections) {
      for (const sub of section.subsections) {
        ids.push(sub.id);
      }
    }
  }
  return ids;
}
```

**Step 2: Update components to use shared hook**

```tsx
// table-of-contents.tsx - Before
const TableOfContents = memo(function TableOfContents({ sections }) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');

  // Duplicate IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(/* ... */);
    // ...
  }, []);

  // Duplicate scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    // ...
  }, []);
});

// table-of-contents.tsx - After
const TableOfContents = memo(function TableOfContents({ sections }) {
  const sectionIds = useMemo(() => flattenSectionIds(sections), [sections]);
  const { activeSection, navigateToSection, progress } = useTocScroll({
    sectionIds,
    scrollOffset: TOC_SCROLL_OFFSET,
    trackProgress: true,
  });
  // ... render
});
```

**Step 3: Remove per-item scroll listeners**

```tsx
// TocNavItem - Before (each item had its own listener!)
function TocNavItem({ section }: TocNavItemProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Scroll tracking per item - BAD!
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
}

// TocNavItem - After (receives state from parent)
const TocNavItem = memo(function TocNavItem({
  section,
  activeSection,  // Passed from parent
  onNavigate,     // Passed from parent
}: TocNavItemProps) {
  const isActive = activeSection === section.id;
  // ... render (no scroll listeners!)
});
```

**Step 4: Remove unused FloatingToc component**

The FloatingToc component (dots on right side of screen) was never used in the UI but still had code. Removed entirely.

## Why This Works

1. **Root cause:** Each component independently implemented scroll tracking, creating:
   - Multiple IntersectionObserver instances
   - Multiple scroll event listeners
   - State management overhead in each component

2. **Why the solution works:**
   - Single shared hook manages one IntersectionObserver
   - Scroll listener only created when features are needed
   - State lifted to parent, passed to children as props
   - Unused code removed entirely

3. **Performance impact:**
   - N scroll listeners → 1 scroll listener
   - N IntersectionObservers → 1 IntersectionObserver
   - Eliminated unnecessary re-renders

## Prevention

- **Create shared hooks** for cross-cutting concerns like scroll tracking
- **Lift state up** - children should receive state, not track it independently
- **Review for duplicate listeners** when multiple components need same data
- **Remove unused code** - don't leave dead code paths
- **Use constants** for magic numbers to make them discoverable and centralized

## Related Issues

- See also: [hero-video-compression-marketing-20251229.md](./hero-video-compression-marketing-20251229.md) - Related performance fixes
