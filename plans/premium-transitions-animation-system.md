# Premium Transitions & Animation System for Sparlo

**Type:** Enhancement
**Priority:** High
**Impact:** User Experience, Premium Feel
**Date:** January 9, 2026

---

## Enhancement Summary

**Deepened on:** January 9, 2026
**Research agents used:** Framer Motion best practices, Next.js page transitions, Performance oracle, TypeScript reviewer, Architecture strategist, Simplicity reviewer, Pattern recognition, Race condition reviewer
**Sections enhanced:** 7 phases + new Critical Fixes section

### Key Improvements from Research

1. **Major simplification** - CSS can handle 70% of animations; Framer Motion only needed for `layoutId` tabs
2. **Critical race condition fixes** - 5 vectors identified and solutions provided
3. **Performance guardrails** - Memory cleanup, stagger caps, mobile-optimized springs
4. **Type safety** - Use `satisfies Variants` pattern throughout
5. **Consolidated architecture** - Single animation constants file, orchestration layer

### Critical Concerns Discovered

- FrozenRouter pattern has **memory leak risk** without cleanup
- Stagger animations **break at 20+ items** (frame budget exceeded)
- **Race conditions** on rapid navigation, tab switching, and data loading
- CSS/Framer Motion **timing desync** on sidebar

---

## Overview

Transform Sparlo's transition and loading experience from functional to premium. For a $249/mo deep tech product, every interaction should feel polished, intentional, and responsive.

**Key Insight from Research:** The "premium feel" comes from:
1. Consistent timing (150-200ms for most interactions)
2. Subtle movement (2-8px, not 20px)
3. Easing functions (ease-out for enters, ease-in for exits)
4. **Restraint** (not everything needs to animate)

---

## Problem Statement

### Current State Issues Identified

| Issue | Location | Severity | Description |
|-------|----------|----------|-------------|
| **Instant page transitions** | All route changes | High | Pages appear/disappear instantly with no fade or slide animation |
| **No route-level AnimatePresence** | `app/app/layout.tsx` | High | Exit animations never fire because AnimatePresence isn't wrapping routes |
| **Plain login transition** | `/auth/sign-in` | Medium | "Welcome back" text with no engaging loading animation |
| **No tab indicator animation** | New Analysis tabs | Medium | Tabs switch content instantly; no sliding indicator |
| **List items appear instantly** | Reports list | Medium | No stagger animation when list loads |
| **Sidebar expand/collapse** | Global sidebar | Low | Transitions could be smoother |

### What's Working Well

- Chat drawer ("Go Deeper") has slide-in animation
- New Analysis page has skeleton loading
- Report skeleton component exists with shimmer animation
- Animation constants file exists with timing values
- Framer Motion v12 is installed
- Reduced motion support via hooks

---

## Research Insights: Simplification Recommendation

> **From Simplicity Review:** "The proposed plan has 7 phases. After analysis, **CSS can handle 70%** of these without JavaScript animation libraries."

### What to Keep (Framer Motion Required)
- **Tab indicator animation with `layoutId`** - CSS cannot replicate this smoothly

### What to Convert to CSS
- Button hover states (4 lines of CSS)
- Card stagger (animation-delay on first 4 items)
- Sidebar collapse (CSS transition)
- Skeleton shimmer (CSS gradient animation)

### What to Remove or Defer
- **FrozenRouter page transitions** - Complexity not worth benefit; introduces race conditions
- **Authentication enhancements** - Users don't notice, happens once per session

---

## Technical Foundation

### Existing Infrastructure

**Animation Constants:** `apps/web/app/app/_lib/animation-constants.ts`

### Research Insight: Consolidated Constants

> **From Pattern Recognition:** "Merge `animation-system.ts` and `animation-constants.ts` into a single module. Rename `TIMING` to `DURATION` to avoid confusion with timing functions."

```typescript
// apps/web/app/app/_lib/animation.ts (CONSOLIDATED)

import { type Variants, type Transition } from 'framer-motion';

// Duration (in milliseconds)
export const DURATION = {
  instant: 100,      // toggles, checkboxes
  fast: 150,         // hover states
  normal: 200,       // standard UI
  moderate: 250,     // modals, dropdowns
  relaxed: 300,      // panels, cards (renamed from 'smooth' to avoid collision)
  page: 400,         // route changes
} as const satisfies Record<string, number>;

// Easing curves (cubic-bezier)
export const EASE = {
  out: [0.25, 1, 0.5, 1] as const,        // ease-out-quart (entering)
  in: [0.4, 0, 1, 1] as const,            // ease-in (exiting)
  inOut: [0.83, 0, 0.17, 1] as const,     // ease-in-out-quint (morphing)
  outExpo: [0.16, 1, 0.3, 1] as const,    // ease-out-expo (premium feel)
} satisfies Record<string, readonly [number, number, number, number]>;

// Spring presets
export const SPRING = {
  snappy: { type: "spring", stiffness: 500, damping: 35, mass: 1 } as Transition,
  smooth: { type: "spring", stiffness: 300, damping: 30, mass: 1 } as Transition,
  gentle: { type: "spring", stiffness: 200, damping: 25, mass: 1 } as Transition,
  // Mobile-optimized (faster settling)
  mobile: { type: "spring", stiffness: 500, damping: 35, mass: 0.8 } as Transition,
} as const;

// Stagger delays (in seconds)
export const STAGGER = {
  fast: 0.03,
  normal: 0.04,
  relaxed: 0.06,
  // Cap for performance
  maxItems: 20,
  maxDuration: 0.5, // 500ms total cap
} as const;
```

### Research Insight: Type-Safe Variants Factory

> **From TypeScript Review:** "Create reusable variant factories with `satisfies Variants` for compile-time safety."

```typescript
// Variant factory for page transitions
export function createFadeSlideVariants(
  yOffset: number = 8
): Variants {
  return {
    initial: { opacity: 0, y: yOffset },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DURATION.relaxed / 1000,
        ease: EASE.out,
      },
    },
    exit: {
      opacity: 0,
      y: -yOffset / 2,
      transition: {
        duration: DURATION.fast / 1000,
        ease: EASE.in,
      },
    },
  } satisfies Variants;
}

// Preset variants
export const fadeVariants = createFadeSlideVariants(0);
export const slideUpVariants = createFadeSlideVariants(8);
```

---

## Critical Fixes Required Before Implementation

> **From Race Condition Review:** "Your animation plan has **five distinct race condition vectors** that WILL manifest in production."

### Fix 1: Navigation Lock for Page Transitions

**Problem:** User navigates during exit animation, causing state desync.

```typescript
// components/NavigationLock.tsx
'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface NavigationContextValue {
  isTransitioning: boolean;
  navigate: (href: string) => void;
  onTransitionComplete: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pendingNavigation = useRef<string | null>(null);

  const navigate = useCallback((href: string) => {
    if (isTransitioning) {
      // Queue navigation, don't fight ongoing animation
      pendingNavigation.current = href;
      return;
    }
    setIsTransitioning(true);
    router.push(href);
  }, [isTransitioning, router]);

  const onTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
    if (pendingNavigation.current) {
      const next = pendingNavigation.current;
      pendingNavigation.current = null;
      router.push(next);
    }
  }, [router]);

  return (
    <NavigationContext.Provider value={{ isTransitioning, navigate, onTransitionComplete }}>
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within NavigationProvider');
  return context;
};
```

### Fix 2: Memory-Safe FrozenRouter

**Problem:** FrozenRouter keeps stale components in memory indefinitely.

```typescript
// components/FrozenRouter.tsx
'use client';

import { LayoutRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useContext, useEffect, useRef } from 'react';

const MAX_ANIMATION_DURATION = 500; // Force cleanup after 500ms

export function FrozenRouter({ children }: { children: React.ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const frozen = useRef(context);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Force cleanup if animation stalls
    timeoutRef.current = setTimeout(() => {
      frozen.current = null;
    }, MAX_ANIMATION_DURATION);

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!frozen.current) {
    return <>{children}</>;
  }

  return (
    <LayoutRouterContext.Provider value={frozen.current}>
      {children}
    </LayoutRouterContext.Provider>
  );
}
```

### Fix 3: Live Reduced Motion Subscription

**Problem:** `usePrefersReducedMotion` checked once, not subscribed to changes.

```typescript
// hooks/usePrefersReducedMotion.ts
'use client';

import { useEffect, useState } from 'react';

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handler = (event: MediaQueryListEvent): void => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
```

### Fix 4: Adaptive Spring for Device Capability

**Problem:** Spring physics too heavy for mobile devices.

```typescript
// hooks/useAdaptiveSpring.ts
'use client';

import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { SPRING } from '../_lib/animation';

export function useAdaptiveSpring() {
  const prefersReduced = usePrefersReducedMotion();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (prefersReduced) {
    return { duration: 0.01 }; // Instant for accessibility
  }

  if (isMobile) {
    return SPRING.mobile; // Faster settling
  }

  return SPRING.smooth; // Full spring for desktop
}
```

---

## Implementation Plan (Revised)

### Phase 1: CSS-First Micro-Interactions (Quick Wins)

> **From Simplicity Review:** "Button hover states achieve 95% of premium feel with 0 JavaScript."

**File:** `apps/web/styles/globals.css`

```css
/* Button micro-interactions - CSS only */
.btn {
  transition: transform 100ms ease-out, box-shadow 100ms ease-out;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn:active {
  transform: translateY(0);
}

/* Input focus animation */
input:focus,
textarea:focus {
  transition: box-shadow 200ms cubic-bezier(0.25, 1, 0.5, 1),
              border-color 200ms cubic-bezier(0.25, 1, 0.5, 1);
}
```

---

### Phase 2: CSS Stagger Animation (Capped)

> **From Performance Review:** "Cap stagger to max 20 items or 500ms total duration."

**File:** `apps/web/styles/report-list.css`

```css
/* Stagger animation - first 4 items only */
.report-card {
  opacity: 0;
  animation: fadeSlideIn 200ms ease-out forwards;
}

.report-card:nth-child(1) { animation-delay: 0ms; }
.report-card:nth-child(2) { animation-delay: 40ms; }
.report-card:nth-child(3) { animation-delay: 80ms; }
.report-card:nth-child(4) { animation-delay: 120ms; }
.report-card:nth-child(n+5) { animation-delay: 160ms; } /* Cap at 160ms */

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .report-card {
    animation: none;
    opacity: 1;
  }
}
```

---

### Phase 3: Tab Indicator Animation (Framer Motion Required)

> **From Simplicity Review:** "`layoutId` for tab indicators is one of the few things Framer Motion does that CSS cannot easily replicate."

**File:** `apps/web/components/ui/animated-tabs.tsx`

```typescript
'use client';

import { motion, LayoutGroup } from 'framer-motion';
import { useState } from 'react';
import { SPRING } from '@/app/app/_lib/animation';

interface Tab {
  id: string;
  label: string;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  children: (activeTab: string) => React.ReactNode;
}

export function AnimatedTabs({
  tabs,
  defaultTab,
  onTabChange,
  children,
}: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <LayoutGroup>
      <div className="flex border-b border-zinc-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className="relative px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: activeTab === tab.id ? '#18181b' : '#71717a',
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900"
                transition={SPRING.snappy}
              />
            )}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {children(activeTab)}
      </div>
    </LayoutGroup>
  );
}
```

---

### Phase 4: Skeleton Loading (CSS Only)

> **From Performance Review:** "Single shimmer layer reduces GPU memory by 60-80%."

**File:** `apps/web/styles/skeleton.css`

```css
/* Single shimmer layer - shared across all skeletons */
.skeleton-container {
  position: relative;
  overflow: hidden;
}

.skeleton-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: shimmer 1.5s infinite;
  will-change: transform;
  z-index: 1;
}

@keyframes shimmer {
  to {
    transform: translateX(100%);
  }
}

.skeleton-item {
  background: #f4f4f5;
  border-radius: 8px;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .skeleton-container::before {
    animation: none;
  }
}
```

---

### Phase 5: Sidebar Animation (CSS with Framer Motion Orchestration)

> **From Race Condition Review:** "Pick ONE animation system. CSS width transitions cause layout thrashing."

**Recommended Approach:** Use Framer Motion for orchestrated sidebar animation.

**File:** `apps/web/app/app/_components/navigation/sidebar.tsx`

```typescript
'use client';

import { motion } from 'framer-motion';
import { DURATION, EASE } from '@/app/app/_lib/animation';

interface SidebarProps {
  isExpanded: boolean;
  children: React.ReactNode;
}

const sidebarVariants = {
  expanded: { width: 280 },
  collapsed: { width: 64 },
};

const contentVariants = {
  expanded: {
    opacity: 1,
    transition: { delay: 0.1, duration: DURATION.fast / 1000 },
  },
  collapsed: {
    opacity: 0,
    transition: { duration: DURATION.fast / 1000 },
  },
};

export function Sidebar({ isExpanded, children }: SidebarProps) {
  const state = isExpanded ? 'expanded' : 'collapsed';

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={state}
      transition={{
        duration: DURATION.relaxed / 1000,
        ease: EASE.out,
      }}
      className="flex-shrink-0 border-r border-zinc-200 bg-white"
    >
      <motion.div
        variants={contentVariants}
        animate={state}
        className="p-4"
      >
        {children}
      </motion.div>
    </motion.aside>
  );
}
```

---

### Phase 6: Page Transitions (Optional - High Complexity)

> **From Simplicity Review:** "FrozenRouter page transitions add 80% complexity for 20% perceived value. Consider deferring."

**If implementing, use with caution:**

**File:** `apps/web/app/app/template.tsx`

```typescript
'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useNavigation } from '@/components/NavigationLock';
import { FrozenRouter } from '@/components/FrozenRouter';
import { DURATION, EASE } from './_lib/animation';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.page / 1000,
      ease: EASE.outExpo,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: DURATION.moderate / 1000,
      ease: EASE.in,
    },
  },
} satisfies Variants;

interface TemplateProps {
  readonly children: React.ReactNode;
}

export default function Template({ children }: TemplateProps) {
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { onTransitionComplete } = useNavigation();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={onTransitionComplete}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## Files to Create/Modify

### New Files

| File | Purpose | Complexity |
|------|---------|------------|
| `apps/web/app/app/_lib/animation.ts` | Consolidated animation constants | Low |
| `apps/web/components/ui/animated-tabs.tsx` | Reusable animated tab component | Medium |
| `apps/web/components/NavigationLock.tsx` | Race condition prevention | Medium |
| `apps/web/components/FrozenRouter.tsx` | Memory-safe context freezing | Medium |
| `apps/web/hooks/usePrefersReducedMotion.ts` | Live reduced motion subscription | Low |
| `apps/web/hooks/useAdaptiveSpring.ts` | Device-aware spring config | Low |

### Modified Files

| File | Changes |
|------|---------|
| `apps/web/styles/globals.css` | Add CSS micro-interactions |
| `apps/web/app/app/_components/animated-reports-list.tsx` | Use CSS stagger, cap at 4 items |
| `apps/web/app/app/reports/new/_components/*.tsx` | Use AnimatedTabs component |
| `apps/web/app/app/_components/navigation/sidebar.tsx` | Orchestrated Framer Motion animation |

### Files to Remove/Consolidate

| File | Action |
|------|--------|
| `apps/web/app/app/_lib/animation-constants.ts` | Merge into `animation.ts` |
| `apps/web/app/app/_lib/animation-system.ts` | Merge into `animation.ts` |

---

## Acceptance Criteria

### Functional Requirements

- [ ] Tab switching has sliding indicator animation with `layoutId`
- [ ] Skeleton loading states use single shimmer layer (CSS)
- [ ] Button hover states have subtle lift effect (CSS)
- [ ] First 4 list items stagger in on load (CSS)
- [ ] Sidebar expand/collapse is smooth (Framer Motion)
- [ ] Page transitions work without race conditions (if implemented)

### Non-Functional Requirements

- [ ] All animations use transform/opacity only (GPU-accelerated)
- [ ] No animation exceeds 500ms duration
- [ ] `prefers-reduced-motion` subscription is live (not just checked once)
- [ ] No memory leaks from FrozenRouter (500ms cleanup timeout)
- [ ] Stagger capped at 4 items / 160ms total
- [ ] Lighthouse performance score maintained >90

### Quality Gates

- [ ] Visual QA on Chrome, Safari, Firefox
- [ ] Mobile performance verified (60fps on mid-range device)
- [ ] Accessibility audit passes
- [ ] Race condition scenarios tested (rapid clicks, back button)

---

## Risk Analysis & Mitigation (Enhanced)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Memory leaks from FrozenRouter | High | Add 500ms cleanup timeout |
| Race conditions on navigation | High | Implement navigation lock context |
| Stagger breaks at 20+ items | High | Cap at 4 items with CSS |
| Mobile performance degradation | Medium | Use adaptive springs, lighter configs |
| CSS/JS timing desync | Medium | Pick ONE animation system per component |
| Accessibility preference ignored | Medium | Subscribe to live media query changes |
| Bundle size increase | Low | CSS handles 70%; lazy-load Framer Motion |

---

## Implementation Priority

### Must Have (Ship First)
1. **CSS micro-interactions** (buttons, inputs) - 0 JavaScript, immediate impact
2. **CSS stagger** for report list - capped at 4 items
3. **Skeleton CSS shimmer** - single layer, performant

### Should Have (Sprint 2)
4. **AnimatedTabs** with `layoutId` - the one thing requiring Framer Motion
5. **Sidebar** with orchestrated animation
6. **Adaptive springs** for mobile

### Could Have (Defer)
7. **Page transitions** with FrozenRouter - high complexity, moderate value
8. **Auth enhancements** - users don't notice

---

## References

### Internal Files
- `apps/web/app/app/_lib/animation-constants.ts:1` - Existing timing constants
- `apps/web/app/app/_components/page-transition.tsx:1` - Current page transition
- `apps/web/app/app/reports/[id]/_components/report-skeleton.tsx:1` - Premium skeleton example
- `docs/SPARLO-DESIGN-SYSTEM.md` - Design system guidelines

### External References (from Research)
- [Motion Performance Guide](https://motion.dev/docs/performance)
- [Motion AnimatePresence](https://motion.dev/docs/react-animate-presence)
- [Next.js App Router Transitions](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [FrozenRouter Pattern](https://www.imcorfitz.com/posts/adding-framer-motion-page-transitions-to-next-js-app-router)
- [Nielsen Norman Group - Animation Duration](https://www.nngroup.com/articles/animation-duration/)
- [Spring Physics Guide](https://blog.maximeheckel.com/posts/the-physics-behind-spring-animations/)

---

*Plan deepened with Claude Code using 8 parallel research and review agents.*
