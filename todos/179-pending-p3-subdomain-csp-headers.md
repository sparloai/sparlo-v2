---
status: pending
priority: p3
issue_id: "179"
tags: [code-review, security, subdomain]
dependencies: []
---

# Content Security Policy Headers Missing

## Problem Statement

No Content-Security-Policy header is configured, leaving the application vulnerable to XSS attacks via injected scripts.

**Why it matters**: CSP provides defense-in-depth against XSS by controlling which scripts can execute on the page.

## Findings

**Agent**: security-sentinel

**Current Headers** (from `next.config.mjs`):
- X-Frame-Options: DENY ✅
- X-Content-Type-Options: nosniff ✅
- X-XSS-Protection: 1; mode=block ✅
- Referrer-Policy: strict-origin-when-cross-origin ✅
- Permissions-Policy: payment=(self "https://js.stripe.com") ✅
- **Content-Security-Policy: MISSING** ❌

## Proposed Solution

### Add Content-Security-Policy header

```javascript
// In next.config.mjs securityHeaders
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com",
    "frame-ancestors 'none'",
  ].join('; '),
},
```

- **Pros**: Strong XSS protection
- **Cons**: May require tuning for third-party scripts
- **Effort**: Medium (need to identify all script sources)
- **Risk**: Medium (overly strict CSP can break functionality)

## Recommended Action

<!-- Leave blank - to be filled during triage -->

## Technical Details

**Affected Files**:
- `apps/web/next.config.mjs`

**Steps to Implement**:
1. Start with Report-Only mode to identify violations
2. Audit all third-party scripts and resources
3. Gradually tighten policy
4. Switch to enforcement mode

## Acceptance Criteria

- [ ] CSP header configured
- [ ] All legitimate scripts/resources allowed
- [ ] No console violations in development
- [ ] Report-URI configured for production monitoring

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Found via security-sentinel agent |

## Resources

- PR/Commit: 3042c09
- CSP Evaluator: https://csp-evaluator.withgoogle.com/

