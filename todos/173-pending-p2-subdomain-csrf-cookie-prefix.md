---
status: pending
priority: p2
issue_id: "173"
tags: [code-review, security, subdomain, cookies]
dependencies: []
---

# CSRF Cookie Prefix Missing

## Problem Statement

CSRF protection cookies should use `__Host-` prefix for tighter security. Currently, cookies are set without this prefix, allowing potential cross-subdomain attacks.

**Why it matters**: Without `__Host-` prefix, cookies can be overwritten by sibling subdomains or parent domains, potentially enabling session fixation attacks.

## Findings

**Agent**: security-sentinel

**Current Implementation**: Standard cookie names without security prefix

**Security Risk**:
- Cookies without `__Host-` prefix can be overwritten from other subdomains
- Potential session fixation attack vector
- Not following browser cookie security best practices

## Proposed Solution

### Add `__Host-` prefix to security-critical cookies

```typescript
// Example for CSRF cookie
const csrfCookieName = '__Host-csrf-token';

// Set cookie with required attributes for __Host- prefix
cookies.set(csrfCookieName, token, {
  path: '/',
  secure: true, // Required for __Host-
  httpOnly: true,
  sameSite: 'strict',
  // Note: Cannot set domain with __Host- prefix
});
```

- **Pros**: Prevents cross-subdomain cookie attacks
- **Cons**: Requires Secure context (HTTPS), cannot set domain attribute
- **Effort**: Small
- **Risk**: Low

## Recommended Action

<!-- Leave blank - to be filled during triage -->

## Technical Details

**Affected Files**:
- Cookie setting logic in auth flows
- CSRF protection middleware

**Browser Requirements**:
- `__Host-` cookies require: `Secure=true`, `Path=/`, no `Domain` attribute

## Acceptance Criteria

- [ ] Security-critical cookies use `__Host-` prefix
- [ ] Cookies set with correct attributes for prefix
- [ ] Tests verify cookie security attributes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Found via security-sentinel agent |

## Resources

- PR/Commit: 3042c09
- MDN Cookie Prefixes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#cookie_prefixes

