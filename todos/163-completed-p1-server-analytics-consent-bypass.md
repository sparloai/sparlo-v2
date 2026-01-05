---
status: completed
priority: p1
issue_id: "163"
tags: [security, privacy, gdpr, analytics, consent]
dependencies: []
---

# Server-Side Analytics Bypasses Cookie Consent

## Problem Statement

Server-side analytics tracking in Inngest functions sends events to PostHog without checking if the user has consented to analytics cookies. This violates GDPR/CCPA requirements where consent must be obtained before tracking.

**Why it matters:**
- Legal compliance risk (GDPR fines up to 4% of annual revenue)
- User trust violation
- Tracking users who explicitly opted out

## Findings

### Security Sentinel Agent
Server-side `trackReportCompleted()` in Inngest functions fires analytics events without any consent check. The cookie consent state is only available client-side, but server functions have no access to this state.

**Evidence:**
```typescript
// apps/web/lib/inngest/utils/analytics.ts
export async function trackReportCompleted({
  reportId, reportType, accountId, ...
}: TrackReportCompletedParams): Promise<void> {
  // No consent check! Just sends the event.
  await analytics.trackEvent('report_completed', properties);
}
```

## Proposed Solutions

### Option A: Store consent preference in database (Recommended)
**Pros:** Consistent consent state across client/server
**Cons:** Requires schema change, migration
**Effort:** Medium (2-3 hours)
**Risk:** Low

1. Add `analytics_consent` column to accounts table
2. Update consent on client when user changes preference
3. Check consent in server-side tracking before sending

### Option B: Pass consent via Inngest event payload
**Pros:** No schema change
**Cons:** Requires modifying all event triggers
**Effort:** Low (1 hour)
**Risk:** Medium (could be bypassed)

### Option C: Disable server-side analytics for GDPR regions
**Pros:** Simple implementation
**Cons:** Loses analytics for EU users
**Effort:** Low
**Risk:** Medium (still non-compliant for opted-out users)

## Recommended Action

Implement Option A - store consent in database for consistent server/client behavior.

## Technical Details

**Affected Files:**
- `apps/web/lib/inngest/utils/analytics.ts`
- `apps/web/lib/inngest/functions/generate-*.ts` (3 files)
- `supabase/migrations/` (new migration needed)
- `packages/analytics/src/posthog-server-service.ts`

**Database Change:**
```sql
ALTER TABLE public.accounts
ADD COLUMN analytics_consent boolean DEFAULT false;
```

## Acceptance Criteria

- [ ] Consent preference stored in database
- [ ] Client updates database when consent changes
- [ ] Server-side tracking checks consent before sending
- [ ] Users who haven't consented are not tracked server-side
- [ ] Existing users default to no consent (GDPR-safe default)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | Server-side tracking needs consent propagation |
