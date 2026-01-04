---
status: completed
priority: p2
issue_id: "174"
tags: [code-review, security, subdomain, validation]
dependencies: []
---

# Path Validation Missing in Redirect Logic

## Problem Statement

The `nextPath` parameter in auth callbacks is not validated against path traversal or open redirect attacks. Malicious URLs could redirect users to external sites.

**Why it matters**: Open redirect vulnerabilities can be used for phishing attacks or credential theft.

## Findings

**Agent**: security-sentinel

**Location**: `/apps/web/app/auth/callback/route.ts` and `/apps/web/app/auth/confirm/route.ts`

```typescript
// Current: Uses nextPath directly without validation
redirect(nextPath);
```

**Attack Vector**:
- User clicks malicious link with `?next=//evil.com`
- After auth, user redirected to attacker-controlled site
- User may not notice the redirect and enter credentials

## Proposed Solution

### Add path validation helper

```typescript
function isValidRedirectPath(path: string): boolean {
  // Must start with / and not contain protocol
  if (!path.startsWith('/')) return false;

  // Prevent protocol-relative URLs (//evil.com)
  if (path.startsWith('//')) return false;

  // Prevent URL with embedded credentials
  if (path.includes('@')) return false;

  // Only allow paths within the app
  try {
    const url = new URL(path, 'https://sparlo.ai');
    return url.hostname === 'sparlo.ai' || url.hostname.endsWith('.sparlo.ai');
  } catch {
    return false;
  }
}

// Usage
const safePath = isValidRedirectPath(nextPath) ? nextPath : '/';
redirect(safePath);
```

- **Pros**: Prevents open redirect attacks
- **Cons**: Slightly more validation overhead
- **Effort**: Small
- **Risk**: Low

## Recommended Action

<!-- Leave blank - to be filled during triage -->

## Technical Details

**Affected Files**:
- `apps/web/app/auth/callback/route.ts`
- `apps/web/app/auth/confirm/route.ts`

## Acceptance Criteria

- [ ] All redirect paths validated before use
- [ ] Protocol-relative URLs rejected
- [ ] External domain redirects rejected
- [ ] Tests cover malicious redirect attempts

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Found via security-sentinel agent |
| 2026-01-04 | Fixed | Implemented `isValidRedirectPath()` in shared config with protection against protocol-relative URLs, external protocols, and main domain paths. Used in `confirm/route.ts` for callback parameter validation. |

## Resources

- PR/Commit: 3042c09
- OWASP Open Redirect: https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html

