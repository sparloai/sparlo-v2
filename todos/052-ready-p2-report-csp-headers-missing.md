---
status: ready
priority: p2
issue_id: "052"
tags: [security, headers, csp, middleware]
dependencies: []
---

# Missing Content Security Policy Headers

## Problem Statement

The application has no Content-Security-Policy headers configured. This removes a critical defense-in-depth layer against XSS attacks, clickjacking, and unauthorized script injection.

## Findings

**Security Review findings:**
- No CSP headers detected in application
- No X-Frame-Options header
- No security headers middleware present

**Risk assessment:**
- No defense-in-depth against XSS
- External scripts could be injected
- No protection against clickjacking

## Proposed Solutions

### Option 1: Next.js Middleware Security Headers

**Approach:** Create middleware.ts to set security headers on all responses.

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.anthropic.com",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}
```

**Pros:**
- Applies to all routes
- Single configuration point
- Standard Next.js pattern

**Cons:**
- May require CSP nonces for inline scripts
- Testing needed to ensure app still works

**Effort:** 2-4 hours

**Risk:** Medium (may break inline scripts)

---

### Option 2: next.config.js Headers

**Approach:** Configure headers in next.config.js for static header setting.

**Pros:**
- Simpler configuration
- No middleware needed

**Cons:**
- Less flexible
- Can't dynamically set nonces

**Effort:** 1-2 hours

**Risk:** Low

## Recommended Action

Implement Option 1 (middleware) for flexibility. Start with a permissive CSP and tighten over time.

## Technical Details

**Files to create:**
- `apps/web/middleware.ts` (if not exists) or update existing

**CSP considerations:**
- Anthropic API domain for chat
- Supabase domains for auth/storage
- Any CDN domains for assets

## Acceptance Criteria

- [ ] CSP header present on all responses
- [ ] X-Frame-Options: DENY set
- [ ] X-Content-Type-Options: nosniff set
- [ ] Application functionality unaffected
- [ ] CSP violations logged but not blocking (report-only mode first)
- [ ] Security audit validates headers

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Security Review Agent)

**Actions:**
- Scanned codebase for security header configuration
- Identified missing CSP as defense gap
- Proposed middleware-based solution

**Learnings:**
- Security headers should be part of initial project setup
- CSP requires iterative tuning based on app needs
