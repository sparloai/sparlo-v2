---
status: pending
priority: p2
issue_id: "161"
tags: [code-review, security, privacy, pii, analytics]
dependencies: ["156"]
---

# Sensitive Data Leakage - Email Addresses Tracked

## Problem Statement

User email addresses are automatically sent to PostHog via the `identify()` call during sign-in. URL parameters (which may contain tokens) are also tracked in page views.

**Why it matters:**
- PII transmitted to third-party without explicit consent
- If PostHog account compromised, emails exposed
- Password reset tokens in URLs could be logged
- Violates data minimization principle (GDPR)

## Findings

### Security Sentinel Agent
- Email automatically included in identify traits
- URL search params captured without sanitization
- May include password reset tokens, verification tokens

**Evidence:**
```typescript
// apps/web/components/auth-provider.tsx:16-18
const onEvent = useCallback(
  (event: AuthChangeEvent, session: Session | null) => {
    dispatchEvent(event, session?.user.id, {
      email: session?.user.email ?? '',  // ← Email sent to PostHog
    });
  },
);

// apps/web/components/analytics-provider.tsx:119
const url = [pathname, searchParams.toString()].filter(Boolean).join('?');
// ← All URL params including tokens sent to PostHog
```

## Proposed Solutions

### Option A: Remove email from identify, sanitize URLs (Recommended)
**Pros:** Minimizes PII exposure, compliant
**Cons:** Less data for user segmentation
**Effort:** Low (2-3 hours)
**Risk:** Low

```typescript
// Remove email from traits
'user.signedIn': (event) => {
  const { userId, email, ...safeTraits } = event.payload;
  if (userId) {
    return analytics.identify(userId, safeTraits);
  }
},

// Sanitize URLs
const sanitizeUrl = (pathname: string, searchParams: URLSearchParams) => {
  const allowedParams = ['utm_source', 'utm_medium', 'utm_campaign', 'ref'];
  const safe = new URLSearchParams();
  allowedParams.forEach(key => {
    if (searchParams.has(key)) safe.set(key, searchParams.get(key)!);
  });
  return [pathname, safe.toString()].filter(Boolean).join('?');
};
```

### Option B: Hash email before sending
**Pros:** Can still segment by user, less PII
**Cons:** More complex
**Effort:** Medium
**Risk:** Low

## Recommended Action

Option A - Remove email entirely and sanitize URLs to only allow marketing params.

## Technical Details

**Affected Files:**
- `apps/web/components/auth-provider.tsx`
- `apps/web/components/analytics-provider.tsx`

## Acceptance Criteria

- [ ] Email not sent in identify() calls
- [ ] URL parameters filtered to allowlist
- [ ] No password reset tokens in analytics
- [ ] Marketing UTM params still tracked
- [ ] Privacy policy updated to reflect changes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | PII leakage identified |
