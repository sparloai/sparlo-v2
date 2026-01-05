---
status: pending
priority: p1
issue_id: "157"
tags: [code-review, performance, bundle-size, analytics]
dependencies: []
---

# PostHog Bundle Size Impact - No Lazy Loading

## Problem Statement

PostHog SDK (54.4KB gzipped) is loaded synchronously on every page, including marketing pages, error pages, and for bot traffic. This significantly impacts Core Web Vitals and TTI.

**Why it matters:**
- +54.4KB to main bundle on every page
- +50-100ms Time to Interactive delay
- Poor Lighthouse performance scores
- Wasted bandwidth for users who decline cookies

## Findings

### Performance Oracle Agent
- PostHog imported at module level, no dynamic import
- 168KB raw / 54.4KB gzipped added to client bundle
- No code splitting strategy implemented
- Analytics loads on marketing pages (no tracking needed)
- Analytics loads for bot traffic (100% wasted)

**Evidence:**
```typescript
// packages/analytics/src/index.ts:3
import { PostHogClientService } from './posthog-client-service';  // ← Eager import

// packages/analytics/src/posthog-client-service.ts:3
import posthog from 'posthog-js';  // ← 54.4KB loaded immediately
```

## Proposed Solutions

### Option A: Dynamic import with lazy initialization (Recommended)
**Pros:** Zero bundle impact until needed, best performance
**Cons:** Slight complexity increase
**Effort:** Medium (3-4 hours)
**Risk:** Low

```typescript
const providers = posthogKey
  ? {
      posthog: async () => {
        const { PostHogClientService } = await import('./posthog-client-service');
        return PostHogClientService.create({ apiKey: posthogKey });
      },
    }
  : { null: () => NullAnalyticsService };
```

### Option B: Route-based code splitting
**Pros:** Clean separation, analytics only on authenticated routes
**Cons:** Requires layout restructuring
**Effort:** Medium (4-6 hours)
**Risk:** Low

### Option C: next/dynamic with ssr: false
**Pros:** Simple implementation
**Cons:** Still loads on authenticated pages even if not needed
**Effort:** Low (1-2 hours)
**Risk:** Low

## Recommended Action

Option A combined with route-based splitting. Load PostHog lazily AND only on authenticated routes.

## Technical Details

**Affected Files:**
- `packages/analytics/src/index.ts`
- `packages/analytics/src/analytics-manager.ts`
- `apps/web/components/root-providers.tsx`
- `apps/web/app/home/[account]/layout.tsx`

**Bundle Impact:**
| Page Type | Current | After | Savings |
|-----------|---------|-------|---------|
| Marketing | +54.4KB | 0KB | -54.4KB |
| Auth | +54.4KB | 0KB | -54.4KB |
| Dashboard | +54.4KB | +54.4KB (lazy) | Better TTI |

## Acceptance Criteria

- [ ] PostHog is NOT in main bundle (verify with bundle analyzer)
- [ ] Marketing pages load without PostHog
- [ ] Analytics only loads after user interaction or route change to authenticated area
- [ ] No functionality regression - all events still tracked
- [ ] Lighthouse performance score improves on marketing pages

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | 54.4KB bundle impact identified |

## Resources

- PostHog bundle: `node_modules/posthog-js/dist/module.js`
- Next.js dynamic imports: https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading
