---
status: pending
priority: p2
issue_id: "176"
tags: [code-review, security, subdomain]
dependencies: []
---

# Referer Validation Missing for Sensitive Operations

## Problem Statement

Sensitive operations like MFA verification and session exchange don't validate the Referer header. This could allow cross-site request forgery attacks.

**Why it matters**: Combined with other vulnerabilities, missing referer validation weakens defense-in-depth against CSRF attacks.

## Findings

**Agent**: security-sentinel

**Current State**: No referer validation on auth callback routes

**Risk Level**: Medium (SameSite cookies provide primary protection, but referer adds defense-in-depth)

## Proposed Solution

### Add referer validation for sensitive endpoints

```typescript
function validateReferer(request: NextRequest): boolean {
  const referer = request.headers.get('referer');

  if (!referer) {
    // Allow direct navigation (no referer)
    return true;
  }

  try {
    const url = new URL(referer);
    const allowedOrigins = [
      'sparlo.ai',
      'app.sparlo.ai',
      'localhost',
    ];

    return allowedOrigins.some(origin =>
      url.hostname === origin || url.hostname.endsWith(`.${origin}`)
    );
  } catch {
    return false;
  }
}

// Usage in auth routes
if (!validateReferer(request)) {
  return new Response('Invalid referer', { status: 403 });
}
```

- **Pros**: Defense-in-depth against CSRF
- **Cons**: May block legitimate requests with stripped referers
- **Effort**: Small
- **Risk**: Low

## Recommended Action

<!-- Leave blank - to be filled during triage -->

## Technical Details

**Affected Files**:
- `apps/web/app/auth/callback/route.ts`
- `apps/web/app/auth/confirm/route.ts`
- `apps/web/proxy.ts`

## Acceptance Criteria

- [ ] Referer validation added to sensitive endpoints
- [ ] Allowed origins properly configured
- [ ] Direct navigation still works
- [ ] Tests cover referer validation

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Found via security-sentinel agent |

## Resources

- PR/Commit: 3042c09

