---
status: completed
priority: p2
issue_id: "166"
tags: [analytics, react, performance, tracking]
dependencies: ["164"]
---

# searchParams Hook Causing Double Pageview Tracking

## Problem Statement

Using `useSearchParams()` in the analytics tracking component triggers React Suspense boundaries, causing the component to re-render and potentially fire duplicate pageview events.

**Why it matters:**
- Inflated pageview metrics
- Incorrect analytics data
- Wasted PostHog quota

## Findings

### Performance Oracle Agent
The `TrackSignupStarted` component uses `useSearchParams()` which requires Suspense and can trigger re-renders during hydration, firing the tracking effect multiple times.

**Evidence:**
```typescript
// apps/web/components/analytics-events.tsx
export function TrackSignupStarted() {
  const searchParams = useSearchParams();  // ← Triggers Suspense
  const analytics = useAnalytics();

  useEffect(() => {
    // May fire twice due to Suspense re-render
    analytics.trackEvent('signup_started', {
      utm_source: searchParams.get('utm_source') ?? undefined,
      // ...
    });
  }, [analytics, searchParams]);  // ← searchParams in deps
}
```

## Proposed Solutions

### Option A: Debounce/dedupe tracking (Recommended)
**Pros:** Simple, handles all edge cases
**Cons:** Slight complexity
**Effort:** Low (30 minutes)
**Risk:** Very Low

```typescript
export function TrackSignupStarted() {
  const searchParams = useSearchParams();
  const analytics = useAnalytics();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    analytics.trackEvent('signup_started', { /* ... */ });
  }, [analytics, searchParams]);
}
```

### Option B: Read URL directly instead of useSearchParams
**Pros:** No Suspense involvement
**Cons:** Less React-idiomatic
**Effort:** Low (15 minutes)
**Risk:** Low

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  analytics.trackEvent('signup_started', {
    utm_source: params.get('utm_source') ?? undefined,
  });
}, [analytics]);  // No searchParams dependency
```

## Recommended Action

Implement Option A - use a ref to dedupe the tracking call.

## Technical Details

**Affected Files:**
- `apps/web/components/analytics-events.tsx`

## Acceptance Criteria

- [ ] signup_started fires exactly once per page load
- [ ] UTM parameters still captured correctly
- [ ] No console warnings about Suspense
- [ ] Works correctly on initial load and navigation

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | useSearchParams needs deduplication pattern |
