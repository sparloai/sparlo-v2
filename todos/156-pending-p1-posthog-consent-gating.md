---
status: pending
priority: p1
issue_id: "156"
tags: [code-review, security, privacy, gdpr, analytics]
dependencies: []
---

# Missing Cookie Consent Integration (GDPR/CCPA Violation)

## Problem Statement

The PostHog analytics integration starts tracking users immediately on page load without obtaining cookie consent first. This violates GDPR (EU), CCPA (California), and other privacy regulations.

**Why it matters:**
- GDPR fines up to 4% annual revenue or €20M
- CCPA fines up to $7,500 per intentional violation
- User trust erosion
- Legal liability exposure

## Findings

### Security Sentinel Agent
- PostHog `init()` called immediately at module import time
- `persistence: 'localStorage+cookie'` sets cookies without consent
- `capture_pageleave: true` tracks behavior without consent
- No integration with existing `CookieBanner` component

### Architecture Strategist Agent
- Eager module initialization prevents consent-first pattern
- Analytics fires before React even renders
- No deferred initialization mechanism exists

**Evidence:**
```typescript
// packages/analytics/src/posthog-client-service.ts:28-40
posthog.init(apiKey, {
  capture_pageleave: true,  // ← Tracks without consent
  persistence: 'localStorage+cookie',  // ← Sets cookies without consent
});

// packages/analytics/src/analytics-manager.ts:43
void service.initialize();  // ← Called at module import
```

## Proposed Solutions

### Option A: Defer initialization until consent (Recommended)
**Pros:** Clean separation, respects user choice, compliant
**Cons:** Requires refactoring analytics-manager
**Effort:** Medium (4-6 hours)
**Risk:** Low

```typescript
// Gate PostHog initialization on consent
const { status } = useCookieConsent();

useEffect(() => {
  if (status === 'accepted') {
    analytics.initialize();
  }
}, [status]);
```

### Option B: Use PostHog cookieless mode until consent
**Pros:** Partial tracking possible, less invasive
**Cons:** Still requires consent for full tracking
**Effort:** Low (2 hours)
**Risk:** Medium (may still violate some regulations)

### Option C: Queue events until consent, then flush
**Pros:** No lost events, compliant
**Cons:** More complex implementation
**Effort:** High (8+ hours)
**Risk:** Low

## Recommended Action

Option A - Defer initialization until consent. Integrate with existing `useCookieConsent` hook.

## Technical Details

**Affected Files:**
- `packages/analytics/src/index.ts`
- `packages/analytics/src/analytics-manager.ts`
- `packages/analytics/src/posthog-client-service.ts`
- `apps/web/components/analytics-provider.tsx`

**Components:**
- AnalyticsManager
- PostHogClientService
- AnalyticsProvider

## Acceptance Criteria

- [ ] Analytics does NOT initialize until user accepts cookies
- [ ] Cookie banner properly gates PostHog initialization
- [ ] No localStorage/cookies set before consent
- [ ] Page views only tracked after consent
- [ ] User identification only after consent
- [ ] Works correctly on page refresh after consent given

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | Multiple agents flagged as critical compliance issue |

## Resources

- PR: Current uncommitted changes
- PostHog GDPR docs: https://posthog.com/docs/privacy/gdpr-compliance
- Existing cookie banner: `packages/ui/src/makerkit/cookie-banner.tsx`
