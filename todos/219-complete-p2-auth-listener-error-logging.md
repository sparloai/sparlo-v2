---
status: complete
priority: p2
issue_id: "219"
tags: [code-review, security, logging]
dependencies: []
---

# Replace Console.error with Structured Logging in Auth Listener

## Problem Statement

The auth listener uses `console.error` for circuit breaker and error logging, which:
1. Exposes internal configuration (window timing, redirect counts) to client console
2. Doesn't integrate with the app's logging infrastructure
3. Provides no monitoring/alerting capability

## Findings

- `packages/supabase/src/hooks/use-auth-change-listener.ts:109` - Exposes error details
- `packages/supabase/src/hooks/use-auth-change-listener.ts:162-165` - Exposes domain validation info
- `packages/supabase/src/hooks/use-auth-change-listener.ts:361-367` - Exposes circuit breaker config

**Security concern:** Attackers can learn:
- Allowed redirect domains
- Circuit breaker thresholds (3 redirects in 10s)
- Internal timing configurations

## Proposed Solutions

### Option 1: Use @kit/shared/logger (Recommended)

**Approach:** Replace `console.error` with structured logger from `@kit/shared/logger`.

```typescript
const logger = await getLogger();
logger.error({
  name: 'auth-circuit-breaker-triggered',
  redirectCount: redirectCountRef.current,
}, 'Circuit breaker triggered');
```

**Pros:**
- Consistent with codebase patterns
- Integrates with log aggregation
- Can trigger alerts
- Structured data for analysis

**Cons:**
- Async logger initialization needed
- Slight complexity increase

**Effort:** 1 hour

**Risk:** Low

---

### Option 2: Environment-Aware Logging

**Approach:** Log details in development, sanitize in production.

```typescript
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
if (IS_PRODUCTION) {
  console.error('[AuthListener] Circuit breaker triggered');
} else {
  console.error('[AuthListener] Circuit breaker', { redirectCount, windowMs });
}
```

**Pros:**
- Simple implementation
- No new dependencies

**Cons:**
- Still uses console.error
- No monitoring integration
- Code duplication

**Effort:** 30 minutes

**Risk:** Low

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `packages/supabase/src/hooks/use-auth-change-listener.ts`

**Related components:**
- `packages/shared/src/logger/logger.ts`

## Resources

- **Codebase pattern:** `apps/web/lib/security/rate-limit.ts` uses `getLogger()`

## Acceptance Criteria

- [ ] Console.error replaced with structured logger
- [ ] No sensitive config exposed in production
- [ ] Logging integrates with monitoring
- [ ] Error context preserved for debugging

## Work Log

### 2026-01-05 - Security Review Discovery

**By:** Claude Code (Security Sentinel Agent)

**Actions:**
- Identified 3 locations with sensitive console.error logging
- Analyzed information disclosure risk
- Compared with codebase logging patterns
