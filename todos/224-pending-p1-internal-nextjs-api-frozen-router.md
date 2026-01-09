---
status: pending
priority: p1
issue_id: "224"
tags:
  - code-review
  - animation
  - nextjs
  - fragility
dependencies: []
---

# Internal Next.js API Usage in FrozenRouter

## Problem Statement

The `FrozenRouter` component imports from an internal Next.js distribution path (`next/dist/shared/lib/app-router-context.shared-runtime`). This is not a public API and will likely break on Next.js version upgrades.

**Why it matters**: Internal APIs can change without notice between Next.js versions. When the team upgrades Next.js, this component may silently break, causing page transitions to fail or throw runtime errors.

## Findings

### Evidence

File: `/apps/web/components/frozen-router.tsx` (Line 5)
```typescript
import { LayoutRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
```

### Agent Reports

- **TypeScript Reviewer**: Flagged as CRITICAL - "This imports from Next.js internal distribution paths. This is extremely fragile: Will break on Next.js version upgrades, Not part of the public API, Path may change without notice."

- **Security Sentinel**: Rated as MEDIUM risk - "This is a stability risk - internal APIs can change without notice between Next.js versions."

- **Architecture Strategist**: Noted this is "a known pattern for FrozenRouter implementations, but it should be documented prominently that this is a breaking-change risk."

## Proposed Solutions

### Solution 1: Add Documentation and Pin Version (Recommended)
**Description**: Document the fragility risk prominently and add version-specific comments.

**Pros**:
- Minimal code change
- Makes the risk explicit for future developers
- Can add Next.js version to CLAUDE.md for upgrade checklist

**Cons**:
- Does not eliminate the risk
- Still requires manual verification on upgrades

**Effort**: Small (15 minutes)
**Risk**: Low

**Implementation**:
```typescript
/**
 * IMPORTANT: This imports from Next.js internal API.
 * Verify compatibility when upgrading Next.js versions.
 * Tested with Next.js 16.x
 *
 * Alternative: Check if future Next.js versions expose a public API
 * for freezing router context during exit animations.
 */
import { LayoutRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
```

### Solution 2: Create Abstraction Layer
**Description**: Create a wrapper module that encapsulates the internal import, making it easier to update in one place.

**Pros**:
- Single point of change for upgrades
- Can add runtime version checking

**Cons**:
- More code complexity
- Still depends on internal API

**Effort**: Medium (1 hour)
**Risk**: Low

### Solution 3: Remove Page Transitions
**Description**: Delete FrozenRouter and template.tsx, using CSS-only transitions instead.

**Pros**:
- Eliminates fragility risk entirely
- Smaller bundle size

**Cons**:
- Loses smooth exit animations
- Reduces premium feel
- Significant UX regression

**Effort**: Small (30 minutes)
**Risk**: High (UX impact)

## Recommended Action

<!-- Leave blank - to be filled during triage -->

## Technical Details

### Affected Files
- `apps/web/components/frozen-router.tsx`
- `apps/web/app/app/template.tsx` (depends on FrozenRouter)

### Dependencies
- Next.js 16.x (current)
- framer-motion

### Testing Required
- Verify page transitions work after any Next.js upgrade
- Test exit animations between routes

## Acceptance Criteria

- [ ] FrozenRouter includes prominent documentation about internal API usage
- [ ] CLAUDE.md includes Next.js upgrade checklist item for FrozenRouter
- [ ] Page transitions continue to work smoothly

## Work Log

| Date | Action | Outcome | Learnings |
|------|--------|---------|-----------|
| 2026-01-09 | Code review identified | Found internal API usage | This is a known pattern but fragile |

## Resources

- [Next.js App Router internals](https://github.com/vercel/next.js/tree/canary/packages/next/src/shared/lib)
- [Framer Motion AnimatePresence with Next.js](https://www.framer.com/motion/animate-presence/)
