---
status: ready
priority: p2
issue_id: "058"
tags: [react, error-handling, resilience, animation]
dependencies: []
---

# Missing Error Boundaries for Animation Components

## Problem Statement

Animation-heavy components have no error boundaries. If Framer Motion throws an error (e.g., invalid variant), the entire page crashes instead of gracefully degrading.

**Resilience Impact:** Animation bugs crash entire pages instead of showing fallback UI.

## Findings

- **Files missing boundaries:**
  - `apps/web/app/home/(user)/_components/animated-reports-list.tsx`
  - `apps/web/app/home/(user)/_components/page-transition.tsx`
  - `apps/web/app/home/(user)/_components/processing-screen.tsx`

**Risk scenarios:**
1. Invalid animation variant passed
2. Framer Motion version mismatch
3. Browser incompatibility with Web Animations API
4. Memory exhaustion during heavy animations

**Current behavior:**
- Error → React error boundary at app level → White screen or generic error
- User loses all page context

**Desired behavior:**
- Error → Component error boundary → Static fallback UI
- User can still interact with page

**Reviewers identifying this:**
- Pattern Recognition: P2 - Missing Error Boundaries

## Proposed Solutions

### Option 1: Wrap Each Animation Component

**Approach:** Add error boundary around each animated component.

```tsx
// components/animation-error-boundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AnimationErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Animation error:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Usage
<AnimationErrorBoundary fallback={<StaticReportsList reports={reports} />}>
  <AnimatedReportsList reports={reports} />
</AnimationErrorBoundary>
```

**Pros:**
- Graceful degradation
- Animation failures don't crash page
- Can show static version as fallback

**Cons:**
- Boilerplate at each use site

**Effort:** 2 hours

**Risk:** Very Low

---

### Option 2: Higher-Order Component Wrapper

**Approach:** Create HOC that adds error boundary automatically.

```tsx
export function withAnimationFallback<P extends object>(
  AnimatedComponent: React.ComponentType<P>,
  StaticComponent: React.ComponentType<P>,
) {
  return function WrappedComponent(props: P) {
    return (
      <AnimationErrorBoundary fallback={<StaticComponent {...props} />}>
        <AnimatedComponent {...props} />
      </AnimationErrorBoundary>
    );
  };
}

// Usage
const SafeAnimatedReportsList = withAnimationFallback(
  AnimatedReportsList,
  StaticReportsList,
);
```

**Pros:**
- Reusable pattern
- Cleaner at call sites
- Enforces fallback definition

**Cons:**
- Requires static version of each component
- More abstraction

**Effort:** 3 hours

**Risk:** Low

## Recommended Action

Implement Option 1 (explicit boundaries):

1. Create `AnimationErrorBoundary` component
2. Wrap `AnimatedReportsList` in page.tsx
3. Wrap `PageTransition` in layout
4. Wrap animation sections in `ProcessingScreen`
5. Define static fallbacks for each

## Technical Details

**New file:**
- `apps/web/app/home/(user)/_components/animation-error-boundary.tsx`

**Files to update:**
- `apps/web/app/home/(user)/page.tsx` - wrap AnimatedReportsList
- `apps/web/app/home/(user)/layout.tsx` - wrap PageTransition
- `apps/web/app/home/(user)/_components/processing-screen.tsx` - wrap animation sections

**Fallback strategy:**
- AnimatedReportsList → Static list without animations
- PageTransition → Plain div wrapper
- ProcessingScreen → Static spinner without pulse animation

## Acceptance Criteria

- [ ] AnimationErrorBoundary component created
- [ ] All animation components wrapped
- [ ] Static fallbacks defined
- [ ] Error logged to console
- [ ] Page remains functional after animation error
- [ ] TypeScript compiles without errors

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Parallel Review Agents)

**Actions:**
- Identified by Pattern Recognition reviewer
- Listed animation components at risk
- Documented fallback strategy

**Learnings:**
- Client components need explicit error boundaries
- Animation libraries can fail silently or loudly
- Static fallback is better than crash
