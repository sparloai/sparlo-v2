---
status: pending
priority: p2
issue_id: "160"
tags: [code-review, ssr, nextjs, analytics]
dependencies: []
---

# Insufficient SSR Guards in Analytics Methods

## Problem Statement

The `trackEvent` and `identify` methods lack SSR safety checks. If called server-side, they will attempt to access `posthog` global which doesn't exist in Node.js context.

**Why it matters:**
- Server-side calls will crash
- Inconsistent with `trackPageView` which has guards
- Silent failures if PostHog not initialized

## Findings

### Architecture Strategist Agent
- `trackPageView` has SSR check, others don't
- `trackEvent` and `identify` assume browser context
- No initialization state validation

**Evidence:**
```typescript
// packages/analytics/src/posthog-client-service.ts
async trackPageView(path: string) {
  if (typeof window === 'undefined') return;  // ✅ Has guard
  posthog.capture('$pageview', { ... });
},

async trackEvent(eventName: string, eventProperties?: Record<string, string | string[]>) {
  posthog.capture(eventName, eventProperties);  // ❌ No guard!
},

async identify(userId: string, traits?: Record<string, string>) {
  posthog.identify(userId, traits);  // ❌ No guard!
}
```

## Proposed Solutions

### Option A: Add window check to all methods (Recommended)
**Pros:** Consistent, simple
**Cons:** Slightly repetitive
**Effort:** Low (30 minutes)
**Risk:** Low

```typescript
async trackEvent(eventName: string, eventProperties?: Record<string, string | string[]>) {
  if (typeof window === 'undefined' || !initialized) return;
  posthog.capture(eventName, eventProperties);
}
```

## Recommended Action

Option A - Add SSR guards to all methods.

## Technical Details

**Affected Files:**
- `packages/analytics/src/posthog-client-service.ts`

## Acceptance Criteria

- [ ] All methods check `typeof window === 'undefined'`
- [ ] All methods check initialization state
- [ ] No errors when called from server components
- [ ] Debug logging when skipped due to SSR

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | SSR safety gap identified |
