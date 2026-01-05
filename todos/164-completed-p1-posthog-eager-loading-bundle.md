---
status: completed
priority: p1
issue_id: "164"
tags: [performance, bundle-size, analytics, lazy-loading]
dependencies: []
---

# Eager PostHog Loading Adds 70KB to Initial Bundle

## Problem Statement

PostHog SDK is eagerly loaded even for users who haven't consented to analytics, adding ~70KB to the initial JavaScript bundle and blocking page interactivity.

**Why it matters:**
- 70KB added to every page load
- Degrades Core Web Vitals (FCP, TTI, LCP)
- Wastes bandwidth for users who will never consent
- Mobile users on slow connections most affected

## Findings

### Performance Oracle Agent
The current implementation imports PostHog at module initialization time, before any consent check occurs. This means the entire SDK is downloaded and parsed for every visitor.

**Evidence:**
```typescript
// packages/analytics/src/posthog-client-service.ts
import posthog from 'posthog-js';  // ← Eagerly loaded!

export function createPostHogClientService(config: PostHogClientConfig) {
  // Consent check happens AFTER import
  if (!config.apiKey) return;
```

**Bundle Impact:**
- posthog-js: ~70KB minified
- Loads on every page, even for opted-out users

## Proposed Solutions

### Option A: Dynamic import on consent (Recommended)
**Pros:** Zero cost for non-consenting users
**Cons:** Slight delay when consent given
**Effort:** Medium (2 hours)
**Risk:** Low

```typescript
export async function createPostHogClientService(config: PostHogClientConfig) {
  if (!config.apiKey || !hasConsent()) return NullService;

  const { default: posthog } = await import('posthog-js');
  posthog.init(config.apiKey, { /* options */ });
  return createService(posthog);
}
```

### Option B: Script tag injection
**Pros:** Completely separate from bundle
**Cons:** More complex, requires script loading orchestration
**Effort:** High (4+ hours)
**Risk:** Medium

## Recommended Action

Implement Option A - dynamic import on consent grant.

## Technical Details

**Affected Files:**
- `packages/analytics/src/posthog-client-service.ts`
- `apps/web/components/analytics-provider.tsx`

**Performance Improvement:**
- Initial bundle: -70KB (~15-20% reduction for analytics code)
- Non-consenting users: 0KB analytics overhead
- Time to Interactive: ~200-400ms improvement

## Acceptance Criteria

- [ ] PostHog only imported after consent granted
- [ ] Null analytics service used before consent
- [ ] No flash or delay visible to user
- [ ] Analytics events queued during import (optional)
- [ ] Bundle size verified with `pnpm build && npx @next/bundle-analyzer`

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | Dynamic imports essential for consent-gated features |
