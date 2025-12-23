---
status: pending
priority: p1
issue_id: "096"
tags:
  - code-review
  - security
  - rate-limiting
dependencies: []
---

# Share Token Enumeration Risk

## Problem Statement

The share token lookup endpoint has no rate limiting or brute force protection, allowing attackers to potentially enumerate valid share tokens.

## Findings

- **File:** `apps/web/app/share/[token]/_lib/server/shared-report.loader.ts`
- **Agent:** Security Sentinel

The share token lookup uses simple string matching without protection:
```typescript
const { data, error } = await adminClient
  .from('report_shares')
  .select(...)
  .eq('share_token', token)
  .is('revoked_at', null)
  .gte('expires_at', new Date().toISOString())
  .single();
```

**Risks:**
1. Token enumeration attacks
2. Information disclosure via error responses
3. No rate limiting on lookup attempts

## Proposed Solutions

### Option A: Rate Limiting per IP (Recommended)
**Pros:** Effective, low complexity
**Cons:** Shared IPs may be affected
**Effort:** 2 hours
**Risk:** Low

Implement rate limiting (e.g., 10 attempts per minute per IP).

### Option B: CAPTCHA After Failures
**Pros:** Good user experience for legitimate users
**Cons:** More implementation complexity
**Effort:** 4 hours
**Risk:** Medium

## Technical Details

### Affected Files
- `apps/web/app/share/[token]/_lib/server/shared-report.loader.ts`
- Potentially middleware for rate limiting

### Token Entropy Check
Ensure tokens have at least 32 bytes of entropy:
```typescript
crypto.randomBytes(32).toString('hex')
```

## Acceptance Criteria

- [ ] Rate limiting implemented on share token lookups
- [ ] Failed access attempts are logged
- [ ] Identical error responses for invalid/expired/revoked tokens
- [ ] Token generation uses cryptographically secure randomness

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-23 | Created from security review | - |

## Resources

- PR: Current uncommitted changes
- Related: Security Sentinel findings
