---
id: "005"
title: "Change rate limit to fail-secure"
priority: P2
status: completed
category: security
created: 2024-12-30
files:
  - app/api/reports/[id]/pdf/route.tsx
---

# High: Rate Limit "Fail Open" Strategy

## Problem

The current implementation catches rate limit errors and continues (fail-open):

```typescript
try {
  const { data: rateLimitData, error: rateLimitError } = await client.rpc(
    'check_rate_limit',
    // ...
  );

  if (!rateLimitError) {
    // Only check limit if no error
  }
} catch (err) {
  // Fail open - log and continue if rate limit check fails
  console.error('[PDF Export] Rate limit check error:', err);
}
```

This means if the database is unavailable or the RPC fails, rate limiting is bypassed entirely. This could allow abuse.

## Required Fix

Change to fail-secure pattern:

```typescript
try {
  const { data: rateLimitData, error: rateLimitError } = await client.rpc(
    'check_rate_limit',
    // ...
  );

  if (rateLimitError) {
    console.error('[PDF Export] Rate limit check failed:', rateLimitError);
    return NextResponse.json(
      { error: 'Service temporarily unavailable', code: 'SERVICE_ERROR' },
      { status: 503, headers: { 'Retry-After': '30' } }
    );
  }

  const result = rateLimitData as unknown as RateLimitResult;
  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
      // ... existing headers
    );
  }
} catch (err) {
  // Fail secure - deny request if rate limit check fails
  console.error('[PDF Export] Rate limit check error:', err);
  return NextResponse.json(
    { error: 'Service temporarily unavailable', code: 'SERVICE_ERROR' },
    { status: 503, headers: { 'Retry-After': '30' } }
  );
}
```

## Acceptance Criteria

- [ ] Rate limit errors return 503 instead of allowing the request
- [ ] Appropriate Retry-After header is included
- [ ] Logging is maintained for debugging
