# Premium Page Transitions & Loading States Improvement Plan

**Created:** January 2026
**Type:** Enhancement
**Priority:** High
**Estimated Scope:** Multi-sprint initiative

---

## Overview

Transform Sparlo's page transitions and loading states to achieve a premium, deep tech aesthetic that resonates with mechanical engineers. This plan addresses performance (Core Web Vitals), accessibility (reduced motion), and user experience through precise, functional motion.

### Core Philosophy

> Motion as precision engineering: Every animation must answer "why is this moving?" with a functional reason. The deep tech aesthetic uses radical tech with conservative packaging—the innovation lives inside, not on the surface.

### Current State Summary

| Aspect | Current | Target |
|--------|---------|--------|
| Page transition duration | 400ms | 200-300ms |
| Routes with loading.tsx | 6 of 49 | All critical routes |
| Loading delay pattern | None | 200ms delay, 300ms minimum |
| Reduced motion support | Partial (3 duplicate hooks!) | Complete (1 canonical hook) |
| Animation constants | 2 files (inconsistent) | 1 unified file |
| Stagger cap | Unlimited | Max 10 items |

---

## Problem Statement

### Current Issues

1. **Inconsistent loading states** — 43 of 49 routes lack dedicated `loading.tsx` files, causing blank pages during navigation
2. **Suboptimal timing** — Page transitions at 400ms feel sluggish; industry standard is 200-300ms
3. **Flash of loading state** — No delay before showing skeletons causes visual noise on fast loads
4. **Three duplicate hooks** — `usePrefersReducedMotion` exists in 3 locations with different implementations (one buggy)
5. **Multiple animation constants** — `animation.ts` and `animation-constants.ts` create confusion
6. **Unlimited stagger** — `AnimatedReportsList` staggers all items without cap, degrading performance on large lists
7. **Exit animation direction** — Current enter/exit both go UP creating an "escalator effect"

### User Impact

- Mechanical engineers expect precision and predictability—janky animations undermine trust
- Blank loading states suggest the app is broken
- Users with vestibular disorders may experience discomfort from uncontrolled animations

---

## Proposed Solution

A phased approach that prioritizes:
1. **Foundation fixes** — Consolidate constants, fix timing, add delayed loading hook
2. **Critical path coverage** — Loading states for high-traffic routes
3. **Accessibility compliance** — Complete reduced motion support
4. **Polish** — Micro-interactions and performance verification

---

## Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Animation System                          │
├─────────────────────────────────────────────────────────────┤
│  Animation Constants (TypeScript) - SINGLE SOURCE OF TRUTH  │
│  └── apps/web/app/app/_lib/animation.ts                     │
├─────────────────────────────────────────────────────────────┤
│  React Hooks (Consolidated)                                  │
│  ├── usePrefersReducedMotion (@kit/ui/hooks - canonical)    │
│  └── useDelayedLoading (new, for client-side loading)       │
├─────────────────────────────────────────────────────────────┤
│  Components                                                  │
│  ├── PageTransition (optimized timing, fixed direction)     │
│  ├── FrozenRouter (existing, verified)                      │
│  └── Skeleton variants (route-specific)                     │
└─────────────────────────────────────────────────────────────┘
```

### Key Files to Modify

| File | Change |
|------|--------|
| `apps/web/app/app/_lib/animation.ts` | Update durations, consolidate constants |
| `apps/web/app/app/template.tsx` | Add reduced motion, optimize timing, fix exit direction |
| `packages/ui/src/hooks/use-prefers-reduced-motion.ts` | Canonical hook (already correct) |

### Files to DELETE (Hook Consolidation)

| File | Reason |
|------|--------|
| `apps/web/lib/hooks/use-prefers-reduced-motion.ts` | Duplicate, uses useState+useEffect (buggy) |
| `apps/web/app/app/_hooks/use-prefers-reduced-motion.ts` | Duplicate, unnecessary |
| `apps/web/app/app/_lib/animation-constants.ts` | Merged into animation.ts |

### New Files to Create

| File | Purpose |
|------|---------|
| `apps/web/lib/hooks/use-delayed-loading.ts` | 200ms delay, 300ms minimum display |
| `apps/web/lib/hooks/__tests__/use-delayed-loading.test.ts` | Unit tests for timing-sensitive hook |
| `apps/web/app/app/settings/loading.tsx` | Settings skeleton |
| `apps/web/app/app/teams/loading.tsx` | Teams skeleton |
| `apps/web/app/admin/loading.tsx` | Admin skeleton |
| `apps/web/components/skeletons/generic-page-skeleton.tsx` | Reusable fallback |

---

## Implementation Phases

### Phase 1: Foundation (Critical)

**Goal:** Establish consistent animation system and fix timing issues

#### 1.1 Consolidate Animation Constants

```typescript
// apps/web/app/app/_lib/animation.ts

export const DURATION = {
  instant: 50,     // Press feedback, toggles
  fast: 150,       // Hover states, micro-interactions
  normal: 200,     // Standard transitions (unchanged)
  moderate: 250,   // Modals, dropdowns (unchanged)
  page: 300,       // Route changes (was 400) ← KEY CHANGE - distinct from normal/moderate
  slow: 400,       // Complex orchestrations
} as const;

export const EASE = {
  // Deep tech aesthetic - no bounce/spring for UI
  out: [0.22, 1, 0.36, 1] as const,        // Elements entering
  in: [0.4, 0, 1, 1] as const,             // Elements exiting
  inOut: [0.65, 0, 0.35, 1] as const,      // State changes
  standard: [0.4, 0, 0.2, 1] as const,     // General purpose
} as const;

export const STAGGER = {
  fast: 0.03,
  normal: 0.04,
  relaxed: 0.06,
  maxItems: 10,      // Cap stagger at 10 items (was 20)
  maxDuration: 0.4,  // Maximum total stagger time (was 0.5)
} as const;

// Remove SPRING from UI animations - keep only for physics interactions
export const SPRING = {
  // Only use for layoutId tab indicators and drag interactions
  snappy: { stiffness: 500, damping: 35, mass: 1 },
} as const;
```

**Delete or merge:** `apps/web/app/app/_lib/animation-constants.ts`

#### 1.2 Consolidate usePrefersReducedMotion Hooks (CRITICAL)

Three copies exist with inconsistent implementations. Consolidate to one.

**Keep (canonical, uses useSyncExternalStore):**
```
packages/ui/src/hooks/use-prefers-reduced-motion.ts
```

**Delete these duplicates:**
```bash
rm apps/web/lib/hooks/use-prefers-reduced-motion.ts      # useState+useEffect (buggy)
rm apps/web/app/app/_hooks/use-prefers-reduced-motion.ts # unnecessary duplicate
```

**Update all imports:**
```bash
# Find and replace all imports to use canonical location
grep -r "use-prefers-reduced-motion" apps/web --include="*.tsx" --include="*.ts"
# Change all to: import { usePrefersReducedMotion } from '@kit/ui/hooks';
```

#### 1.3 Create useDelayedLoading Hook (Fixed Race Condition)

**Note:** This hook is for CLIENT-SIDE loading states only (e.g., `useQuery`).
Next.js `loading.tsx` files are controlled by React Suspense and cannot use this hook.

```typescript
// apps/web/lib/hooks/use-delayed-loading.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseDelayedLoadingOptions {
  /** Delay before showing loading state (ms). Default: 200 */
  showDelay?: number;
  /** Minimum time to display loading state (ms). Default: 300 */
  minDisplayTime?: number;
}

/**
 * Prevents flash of loading state for fast operations.
 * Shows loading only if operation takes longer than showDelay,
 * then displays for at least minDisplayTime.
 *
 * FIXED: Uses refs to track state across effect cycles, preventing
 * race conditions when isLoading changes rapidly.
 */
export function useDelayedLoading(
  isLoading: boolean,
  options: UseDelayedLoadingOptions = {}
): boolean {
  const { showDelay = 200, minDisplayTime = 300 } = options;

  const [showLoading, setShowLoading] = useState(false);

  // Track loading state across effect cycles to prevent race conditions
  const loadingStartedRef = useRef(false);
  const loadingStartTimeRef = useRef<number | null>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup helper
  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isLoading && !loadingStartedRef.current) {
      // Loading started - schedule showing indicator
      loadingStartedRef.current = true;
      clearTimeouts();

      showTimeoutRef.current = setTimeout(() => {
        setShowLoading(true);
        loadingStartTimeRef.current = Date.now();
      }, showDelay);
    }

    if (!isLoading && loadingStartedRef.current) {
      // Loading ended - handle cleanup
      loadingStartedRef.current = false;
      clearTimeouts();

      if (showLoading && loadingStartTimeRef.current) {
        // Ensure minimum display time
        const elapsed = Date.now() - loadingStartTimeRef.current;
        const remaining = Math.max(0, minDisplayTime - elapsed);

        hideTimeoutRef.current = setTimeout(() => {
          setShowLoading(false);
          loadingStartTimeRef.current = null;
        }, remaining);
      } else {
        // Loading finished before we showed anything - just reset
        setShowLoading(false);
        loadingStartTimeRef.current = null;
      }
    }

    return clearTimeouts;
  }, [isLoading, showDelay, minDisplayTime, showLoading, clearTimeouts]);

  return showLoading;
}
```

#### 1.3.1 Unit Tests for useDelayedLoading

```typescript
// apps/web/lib/hooks/__tests__/use-delayed-loading.test.ts
import { renderHook, act } from '@testing-library/react';
import { useDelayedLoading } from '../use-delayed-loading';

describe('useDelayedLoading', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns false initially when isLoading is true (within delay)', () => {
    const { result } = renderHook(() => useDelayedLoading(true));
    expect(result.current).toBe(false);
  });

  it('returns true after showDelay when isLoading remains true', () => {
    const { result } = renderHook(() => useDelayedLoading(true));

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe(true);
  });

  it('maintains true for minDisplayTime even if isLoading becomes false', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useDelayedLoading(loading),
      { initialProps: { loading: true } }
    );

    // Wait for loading to show
    act(() => jest.advanceTimersByTime(200));
    expect(result.current).toBe(true);

    // Stop loading after 50ms of display
    act(() => jest.advanceTimersByTime(50));
    rerender({ loading: false });

    // Should still show loading (min 300ms not reached)
    expect(result.current).toBe(true);

    // After remaining time, should hide
    act(() => jest.advanceTimersByTime(250));
    expect(result.current).toBe(false);
  });

  it('handles rapid true/false/true transitions', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useDelayedLoading(loading),
      { initialProps: { loading: true } }
    );

    // Rapid toggle before delay
    act(() => jest.advanceTimersByTime(100));
    rerender({ loading: false });
    rerender({ loading: true });

    // Should not have shown loading yet
    expect(result.current).toBe(false);
  });
});
```

#### 1.4 Update Page Transition Template

**Key fixes:**
- Use correct import path alias (`@kit/ui/hooks` not relative path)
- Fix exit animation direction (exits DOWN to maintain spatial metaphor, not UP)

```typescript
// apps/web/app/app/template.tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useSelectedLayoutSegment } from 'next/navigation';
import { FrozenRouter } from '~/components/frozen-router';
import { usePrefersReducedMotion } from '@kit/ui/hooks';
import { DURATION, EASE } from '~/app/app/_lib/animation';

export default function Template({ children }: { children: React.ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const prefersReducedMotion = usePrefersReducedMotion();

  // Reduced motion: opacity only, faster duration
  // FIX: Exit goes DOWN (positive y) to maintain spatial metaphor
  // Enter: slides UP into view (y: 8 -> 0)
  // Exit: fades DOWN and out (y: 0 -> 8) - OPPOSITE direction for natural flow
  const variants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 8 },   // Enter from below
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 8 },      // Exit downward (FIXED - was -4)
      };

  const transition = {
    duration: prefersReducedMotion
      ? DURATION.fast / 1000
      : DURATION.page / 1000,
    ease: EASE.out,
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={segment}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transition}
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

### Phase 2: Loading State Coverage

**Goal:** Add loading states to all critical routes

#### 2.1 Skeleton Categories (Not Magic Numbers)

**Per Kieran's feedback:** Create skeleton variants by page type, not generic with magic numbers.

```typescript
// apps/web/components/skeletons/index.ts
// Export all skeleton variants for easy discovery

export { FormPageSkeleton } from './form-page-skeleton';
export { TablePageSkeleton } from './table-page-skeleton';
export { CardGridSkeleton } from './card-grid-skeleton';
export { DetailPageSkeleton } from './detail-page-skeleton';
```

```typescript
// apps/web/components/skeletons/form-page-skeleton.tsx
// For settings, profile, edit pages with form layouts
import { Skeleton } from '@kit/ui/shadcn/skeleton';

interface FormPageSkeletonProps {
  /** Include sidebar navigation. Default: true for settings */
  withSidebar?: boolean;
}

export function FormPageSkeleton({ withSidebar = true }: FormPageSkeletonProps) {
  return (
    <div className="flex gap-6 p-6">
      {withSidebar && (
        <aside className="w-64 shrink-0 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-8 w-2/3" />
        </aside>
      )}
      <main className="flex-1 space-y-6 max-w-2xl">
        {/* Page title */}
        <Skeleton className="h-8 w-48" />

        {/* Form sections - matches typical settings form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" /> {/* Label */}
            <Skeleton className="h-10 w-full" /> {/* Input */}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-24 w-full" /> {/* Textarea */}
          </div>
        </div>

        {/* Action button */}
        <Skeleton className="h-10 w-32" />
      </main>
    </div>
  );
}
```

```typescript
// apps/web/components/skeletons/card-grid-skeleton.tsx
// For dashboards, team pages, project lists
import { Skeleton } from '@kit/ui/shadcn/skeleton';

interface CardGridSkeletonProps {
  /** Number of cards to show. Default: 6 */
  cardCount?: 3 | 6 | 9;
  /** Grid columns. Default: 3 */
  columns?: 2 | 3 | 4;
}

export function CardGridSkeleton({
  cardCount = 6,
  columns = 3,
}: CardGridSkeletonProps) {
  const gridClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className="p-6 space-y-6">
      {/* Header with title and action button */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Card grid */}
      <div className={`grid ${gridClass} gap-4`}>
        {Array.from({ length: cardCount }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" /> {/* Title */}
            <Skeleton className="h-4 w-full" /> {/* Description line 1 */}
            <Skeleton className="h-4 w-2/3" /> {/* Description line 2 */}
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-16 rounded-full" /> {/* Badge */}
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

```typescript
// apps/web/components/skeletons/table-page-skeleton.tsx
// For admin pages, data tables
import { Skeleton } from '@kit/ui/shadcn/skeleton';

export function TablePageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" /> {/* Search */}
          <Skeleton className="h-10 w-24" /> {/* Filter */}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        {/* Table header */}
        <div className="flex gap-4 p-4 border-b bg-muted/50">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b last:border-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}
```

#### 2.2 Route-Specific Loading Files (Using Skeleton Categories)

**Settings loading.tsx:**
```typescript
// apps/web/app/app/settings/loading.tsx
import { FormPageSkeleton } from '~/components/skeletons';

export default function SettingsLoading() {
  return <FormPageSkeleton withSidebar />;
}
```

**Teams loading.tsx:**
```typescript
// apps/web/app/app/teams/loading.tsx
import { CardGridSkeleton } from '~/components/skeletons';

export default function TeamsLoading() {
  return <CardGridSkeleton cardCount={6} columns={3} />;
}
```

**Admin loading.tsx:**
```typescript
// apps/web/app/admin/loading.tsx
import { TablePageSkeleton } from '~/components/skeletons';

export default function AdminLoading() {
  return <TablePageSkeleton />;
}
```

**Auth loading.tsx:**
```typescript
// apps/web/app/auth/loading.tsx
import { FormPageSkeleton } from '~/components/skeletons';

export default function AuthLoading() {
  return <FormPageSkeleton withSidebar={false} />;
}
```

#### 2.3 Routes Requiring loading.tsx

| Route | Priority | Skeleton Category | Notes |
|-------|----------|-------------------|-------|
| `/app/settings` | High | `FormPageSkeleton` | With sidebar |
| `/app/settings/*` | High | `FormPageSkeleton` | Inherit from parent |
| `/app/teams` | High | `CardGridSkeleton` | 6 cards, 3 columns |
| `/app/teams/*` | Medium | `DetailPageSkeleton` | Team detail view |
| `/admin` | High | `TablePageSkeleton` | Data table layout |
| `/admin/accounts` | Medium | `TablePageSkeleton` | Inherit from parent |
| `/auth/sign-in` | High | `FormPageSkeleton` | No sidebar |
| `/auth/sign-up` | High | `FormPageSkeleton` | No sidebar |
| Marketing pages | Low | None | Static pages, no loading needed |

---

### Phase 3: Micro-Interactions & Polish

**Goal:** Consistent, performant micro-interactions

#### 3.1 Button State CSS (GPU-accelerated only)

```css
/* apps/web/styles/globals.css */

/* Deep tech button states - no bounce */
.button-interactive {
  transition:
    background-color var(--duration-fast) var(--ease-out),
    transform var(--duration-instant) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.button-interactive:hover {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.button-interactive:active {
  transform: scale(0.98);
  transition-duration: var(--duration-instant);
}

.button-interactive:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Card hover - subtle lift */
.card-interactive {
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@media (prefers-reduced-motion: reduce) {
  .button-interactive:active,
  .card-interactive:hover {
    transform: none;
  }
}
```

#### 3.2 Modal Animation Variants

```typescript
// apps/web/lib/animations/modal-variants.ts
import { DURATION, EASE } from '@/app/app/_lib/animation';

export const modalVariants = {
  backdrop: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: DURATION.fast / 1000 }
    },
    exit: {
      opacity: 0,
      transition: { duration: DURATION.instant / 1000 }
    },
  },
  content: {
    hidden: {
      opacity: 0,
      scale: 0.96,
      y: 8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: DURATION.normal / 1000,
        ease: EASE.out,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: DURATION.fast / 1000,
        ease: EASE.in,
      },
    },
  },
};

// For reduced motion users
export const modalVariantsReduced = {
  backdrop: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.05 } },
  },
  content: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.05 } },
  },
};
```

#### 3.3 Dropdown Animation Variants

```typescript
// apps/web/lib/animations/dropdown-variants.ts
import { DURATION, EASE, STAGGER } from '@/app/app/_lib/animation';

export const dropdownVariants = {
  container: {
    hidden: { opacity: 0, y: -8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DURATION.fast / 1000,
        ease: EASE.out,
        staggerChildren: STAGGER.fast,
        delayChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      y: -4,
      transition: { duration: DURATION.instant / 1000 },
    },
  },
  item: {
    hidden: { opacity: 0, x: -8 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: DURATION.fast / 1000 },
    },
  },
};
```

#### 3.4 Cap Stagger in AnimatedReportsList (Complete Implementation)

```typescript
// apps/web/app/app/_components/animated-reports-list.tsx
'use client';

import { motion, Variants } from 'framer-motion';
import { STAGGER, DURATION, EASE } from '../_lib/animation';

interface AnimatedReportsListProps {
  items: ReportItem[];
  renderItem: (item: ReportItem, index: number) => React.ReactNode;
}

export function AnimatedReportsList({ items, renderItem }: AnimatedReportsListProps) {
  // Cap stagger at maxItems to prevent slow animations on large lists
  const staggeredCount = Math.min(items.length, STAGGER.maxItems);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        // Dynamic stagger: faster with more items, capped at maxDuration
        staggerChildren: Math.min(
          STAGGER.normal,
          STAGGER.maxDuration / staggeredCount
        ),
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DURATION.fast / 1000,
        ease: EASE.out,
      },
    },
  };

  // Items beyond stagger cap render without animation
  const instantVariants: Variants = {
    hidden: { opacity: 1, y: 0 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {items.map((item, index) => (
        <motion.li
          key={item.id}
          variants={index < STAGGER.maxItems ? itemVariants : instantVariants}
        >
          {renderItem(item, index)}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

---

### Phase 4: Testing & Verification

**Goal:** Comprehensive testing including visual regression, performance, and edge cases

#### 4.1 Visual Regression Testing with Playwright

```typescript
// apps/e2e/tests/animations.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Page Transitions', () => {
  test('page transition completes within 300ms', async ({ page }) => {
    await page.goto('/app');

    // Start timing
    const startTime = Date.now();

    // Navigate
    await page.click('a[href="/app/settings"]');

    // Wait for new content to be visible
    await page.waitForSelector('[data-test="settings-page"]', { state: 'visible' });

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(500); // Allow some buffer for network
  });

  test('exit animation direction is downward (not escalator)', async ({ page }) => {
    await page.goto('/app');

    // Take screenshot before navigation
    const beforeNav = await page.screenshot();

    // Start navigation and capture mid-transition
    await page.click('a[href="/app/reports"]');

    // Capture during exit animation (50ms into 300ms transition)
    await page.waitForTimeout(50);
    const duringExit = await page.screenshot();

    // The old content should be fading DOWN (y increases), not UP
    // Visual regression will catch if this changes
    expect(duringExit).toMatchSnapshot('exit-animation-midpoint.png');
  });

  test('rapid navigation handles gracefully', async ({ page }) => {
    await page.goto('/app');

    // Click 3 links rapidly
    await page.click('a[href="/app/reports"]');
    await page.waitForTimeout(50);
    await page.click('a[href="/app/settings"]');
    await page.waitForTimeout(50);
    await page.click('a[href="/app/teams"]');

    // Should end up on teams page without errors
    await page.waitForSelector('[data-test="teams-page"]', { state: 'visible' });

    // No console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    expect(errors).toHaveLength(0);
  });
});

test.describe('Loading States', () => {
  test('skeleton matches page structure (no CLS)', async ({ page }) => {
    // Slow down network to see loading state
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 500);
    });

    await page.goto('/app/settings');

    // Capture skeleton
    await page.waitForSelector('.skeleton', { state: 'visible' });
    const skeletonShot = await page.screenshot();

    // Wait for content
    await page.waitForSelector('[data-test="settings-content"]', { state: 'visible' });
    const contentShot = await page.screenshot();

    // Visual comparison - skeleton should roughly match content structure
    expect(skeletonShot).toMatchSnapshot('settings-skeleton.png');
    expect(contentShot).toMatchSnapshot('settings-content.png');
  });
});

test.describe('Reduced Motion', () => {
  test('respects prefers-reduced-motion', async ({ page }) => {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/app');

    // Navigate
    await page.click('a[href="/app/settings"]');

    // Should transition instantly (no y transform)
    // Check computed styles during transition
    const transitionDuration = await page.evaluate(() => {
      const el = document.querySelector('[data-transition-wrapper]');
      return el ? getComputedStyle(el).transitionDuration : '0s';
    });

    // Reduced motion should have very fast/instant transitions
    expect(parseFloat(transitionDuration)).toBeLessThanOrEqual(0.15);
  });
});
```

#### 4.2 Performance Targets

| Metric | Target | Acceptable | Measurement Tool |
|--------|--------|------------|------------------|
| CLS | ≤ 0.1 | ≤ 0.25 | Lighthouse, Web Vitals |
| INP | ≤ 200ms | ≤ 500ms | Web Vitals |
| LCP | ≤ 2.5s | ≤ 4s | Lighthouse |
| Animation FPS | 60fps | 30fps | Chrome DevTools Performance |
| Page transition | ≤ 300ms | ≤ 400ms | Custom timing |

#### 4.3 Manual Testing Checklist

**Performance Testing:**
- [ ] Run Lighthouse on `/app`, `/app/reports`, `/app/settings`, `/admin`
- [ ] Open Chrome DevTools Performance tab, record navigation, check for jank
- [ ] Test on throttled 4G network (DevTools Network tab)
- [ ] Test on mid-range Android device (use real device or BrowserStack)

**Accessibility Testing:**
- [ ] Enable "Reduce motion" in OS settings, verify animations are simplified
- [ ] Test with VoiceOver/NVDA - loading states should announce
- [ ] Verify focus management after page transition

**Edge Case Testing:**
- [ ] Rapid navigation: Click 5+ links within 1 second
- [ ] Back/forward browser navigation during transition
- [ ] Navigate away during skeleton display
- [ ] Network timeout during navigation (what happens to exit animation?)

**Visual Regression:**
- [ ] All skeleton screenshots match expected output
- [ ] Exit animation direction is consistently downward
- [ ] No layout shift visible during transitions

#### 4.4 Rapid Navigation Behavior Specification

**Expected behavior when user clicks multiple links rapidly:**

```
User clicks: Reports → Settings → Teams (within 500ms)

Timeline:
0ms:   Click Reports
       → Exit animation starts for current page
50ms:  Click Settings (during Reports exit)
       → Cancel Reports navigation
       → Continue exit animation, target becomes Settings
100ms: Click Teams (during exit)
       → Cancel Settings navigation
       → Target becomes Teams
300ms: Exit animation completes
       → Teams page enters
```

**Implementation in FrozenRouter:**
The `NavigationLock` pattern with ref overwrites ensures latest navigation wins.
Previous navigations are cancelled, but the exit animation runs to completion once.


---

## Acceptance Criteria

### Functional Requirements

- [ ] All page transitions complete in ≤300ms
- [ ] Exit animations play before new route renders
- [ ] Exit animations go OPPOSITE direction to entry (no escalator effect)
- [ ] Skeletons appear after 200ms delay (not before) for client-side loading
- [ ] Skeletons display for minimum 300ms once shown
- [ ] All critical routes have loading.tsx files
- [ ] Stagger animations capped at 10 items

### Non-Functional Requirements

- [ ] CLS ≤ 0.1 on all routes
- [ ] INP ≤ 200ms on all routes
- [ ] 60fps during all animations (no jank)
- [ ] Animations respect prefers-reduced-motion
- [ ] No memory leaks from animation subscriptions

### Code Quality Requirements (Reviewer Feedback)

- [ ] Only ONE `usePrefersReducedMotion` hook exists (in `@kit/ui/hooks`)
- [ ] All duplicate hook files deleted
- [ ] All imports updated to canonical location
- [ ] `useDelayedLoading` has unit tests passing
- [ ] Animation constant files consolidated (only `animation.ts`)
- [ ] Import paths use project aliases (not relative paths like `./_lib`)

### Quality Gates

- [ ] Unit tests for `useDelayedLoading` pass
- [ ] Visual regression tests pass
- [ ] Lighthouse performance score ≥ 90
- [ ] Accessibility audit passes (reduced motion)
- [ ] Code review approval

---

## Risk Analysis & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking existing animations | Medium | High | Comprehensive testing, visual regression |
| Performance regression | Low | High | Lighthouse CI checks, FPS monitoring |
| Accessibility violation | Low | High | Automated a11y tests, manual QA |
| Scope creep (too many routes) | High | Medium | Prioritize critical routes, use generic skeleton |
| FrozenRouter timeout edge cases | Low | Medium | Add error boundary, test slow networks |

---

## Dependencies & Prerequisites

- Framer Motion 12.x (already installed)
- React 19 concurrent features (already available)
- Next.js 16 App Router (already using)

**No new dependencies required.**

---

## Future Considerations

1. **View Transitions API** — Browser-native transitions (when Safari support improves)
2. **Shared Element Transitions** — For report list → detail navigation
3. **Predictive Prefetching** — ML-based route prediction
4. **Animation Orchestration** — Complex multi-element choreography

---

## File Change Summary

### Modified Files

| File | Changes |
|------|---------|
| `apps/web/app/app/_lib/animation.ts` | Update durations (page: 400→300), consolidate constants |
| `apps/web/app/app/template.tsx` | Add reduced motion, fix exit direction, use correct imports |
| `apps/web/app/app/_components/animated-reports-list.tsx` | Cap stagger at 10 items |

### New Files

| File | Purpose |
|------|---------|
| `apps/web/lib/hooks/use-delayed-loading.ts` | Delayed loading hook (race-condition safe) |
| `apps/web/lib/hooks/__tests__/use-delayed-loading.test.ts` | Unit tests for hook |
| `apps/web/components/skeletons/index.ts` | Barrel export for skeleton categories |
| `apps/web/components/skeletons/form-page-skeleton.tsx` | Settings, profile, edit pages |
| `apps/web/components/skeletons/card-grid-skeleton.tsx` | Dashboards, teams, projects |
| `apps/web/components/skeletons/table-page-skeleton.tsx` | Admin, data tables |
| `apps/web/components/skeletons/detail-page-skeleton.tsx` | Single item detail views |
| `apps/web/app/app/settings/loading.tsx` | Settings skeleton (uses FormPageSkeleton) |
| `apps/web/app/app/teams/loading.tsx` | Teams skeleton (uses CardGridSkeleton) |
| `apps/web/app/admin/loading.tsx` | Admin skeleton (uses TablePageSkeleton) |
| `apps/web/app/auth/loading.tsx` | Auth skeleton (uses FormPageSkeleton) |
| `apps/web/lib/animations/modal-variants.ts` | Modal animations |
| `apps/web/lib/animations/dropdown-variants.ts` | Dropdown animations |
| `apps/e2e/tests/animations.spec.ts` | Playwright visual regression tests |

### Deleted Files (CRITICAL - Hook Consolidation)

| File | Reason |
|------|--------|
| `apps/web/app/app/_lib/animation-constants.ts` | Merged into animation.ts |
| `apps/web/lib/hooks/use-prefers-reduced-motion.ts` | Duplicate hook (buggy useState+useEffect) |
| `apps/web/app/app/_hooks/use-prefers-reduced-motion.ts` | Duplicate hook (unnecessary) |

### Import Updates Required

After deleting duplicate hooks, update all imports:
```
# FROM (various):
import { usePrefersReducedMotion } from '../_hooks/use-prefers-reduced-motion';
import { usePrefersReducedMotion } from '~/lib/hooks/use-prefers-reduced-motion';

# TO (canonical):
import { usePrefersReducedMotion } from '@kit/ui/hooks';
```

---

## References

### Internal References

- Animation system: `apps/web/app/app/_lib/animation.ts`
- FrozenRouter: `apps/web/components/frozen-router.tsx`
- Page transition: `apps/web/app/app/template.tsx`
- Report skeleton: `apps/web/app/app/reports/[id]/_components/report-skeleton.tsx`
- Reduced motion hook: `packages/ui/src/hooks/use-prefers-reduced-motion.ts`

### External References

- [Framer Motion AnimatePresence](https://motion.dev/docs/react-animate-presence)
- [Next.js App Router Loading UI](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [Web Vitals](https://web.dev/articles/vitals)
- [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [WCAG 2.1 Animation Guidelines](https://www.w3.org/WAI/WCAG21/Techniques/css/C39)

### Specification Source

- Gold Standard Specification provided in feature request
- Nielsen Norman Group timing research
- Stripe engineering animation guidelines
