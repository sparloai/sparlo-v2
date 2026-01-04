---
status: pending
priority: p3
issue_id: "178"
tags: [code-review, observability, subdomain]
dependencies: []
---

# Security Event Logging Missing

## Problem Statement

Auth failures and security-relevant events are not logged, making incident investigation and security monitoring difficult.

**Why it matters**: Without proper logging, it's impossible to detect attacks, investigate incidents, or understand auth flow issues in production.

## Findings

**Agent**: security-sentinel, pattern-recognition-specialist

**Current State**: No structured logging for auth events

**Missing Logs**:
- Failed authentication attempts
- Session exchange failures
- MFA verification attempts
- Subdomain routing decisions
- CSRF validation failures

## Proposed Solution

### Add structured security logging

```typescript
import { logger } from '@kit/monitoring';

// In auth routes
logger.info('auth.callback.started', {
  ip: request.ip,
  userAgent: request.headers.get('user-agent'),
  hasAuthCode: Boolean(authCode),
});

// On success
logger.info('auth.callback.success', {
  userId: user.id,
  redirectPath: nextPath,
});

// On failure
logger.warn('auth.callback.failed', {
  error: error.message,
  ip: request.ip,
});

// Security events
logger.security('csrf.validation.failed', {
  ip: request.ip,
  origin: request.headers.get('origin'),
});
```

- **Pros**: Enables security monitoring and incident response
- **Cons**: Additional log storage costs
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

- [ ] Auth events logged with structured format
- [ ] Security events have distinct log level/type
- [ ] Logs include relevant context (IP, user agent, etc.)
- [ ] PII not logged (no passwords, tokens)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Found via multiple agents |

## Resources

- PR/Commit: 3042c09

