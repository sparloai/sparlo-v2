---
status: ready
priority: p0
issue_id: "026"
tags: [security, inngest, api]
dependencies: []
---

# Add Inngest Signature Verification to API Route

Critical security vulnerability: The Inngest API route accepts unverified requests.

## Problem Statement

The `/api/inngest/route.ts` endpoint handles webhook calls from Inngest Cloud but does not verify the signature of incoming requests. This allows attackers to send malicious payloads that could trigger arbitrary report generation or manipulate workflow state.

**Impact:** Any external attacker can invoke Inngest functions by sending POST requests to this endpoint, potentially causing:
- Unauthorized report generation consuming LLM credits
- Database state manipulation
- Resource exhaustion (DoS)

## Findings

- File: `apps/web/app/api/inngest/route.ts`
- Current implementation uses `serve()` from `inngest/next` but no signature validation
- The `INNGEST_SIGNING_KEY` environment variable exists but is not being used for verification
- Inngest SDK provides built-in signature verification that should be enabled

```typescript
// Current (vulnerable):
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
```

## Proposed Solutions

### Option 1: Enable Inngest SDK Signature Verification (Recommended)

**Approach:** The Inngest SDK's `serve()` function automatically verifies signatures when `INNGEST_SIGNING_KEY` is set in the environment. Verify it's being picked up correctly.

**Pros:**
- Zero code changes if env var is correctly configured
- SDK handles all cryptographic verification
- Industry standard approach

**Cons:**
- Requires proper env var deployment

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Manual Signature Verification Middleware

**Approach:** Add explicit signature verification before processing.

**Pros:**
- Explicit control over verification
- Can add custom logging

**Cons:**
- More code to maintain
- Risk of implementation errors

**Effort:** 2 hours

**Risk:** Medium

## Recommended Action

Verify `INNGEST_SIGNING_KEY` is correctly set in production environment. The Inngest SDK automatically uses this for signature verification. Add explicit verification check if needed:

```typescript
import { serve } from 'inngest/next';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
```

Test by sending an unsigned request - it should be rejected with 401.

## Technical Details

**Affected files:**
- `apps/web/app/api/inngest/route.ts` - API route handler

**Environment variables required:**
- `INNGEST_SIGNING_KEY` - Must be set in Railway production

**Verification command:**
```bash
curl -X POST https://your-app.railway.app/api/inngest \
  -H "Content-Type: application/json" \
  -d '{"name": "test"}'
# Should return 401 Unauthorized
```

## Resources

- Inngest SDK docs: https://www.inngest.com/docs/sdk/serve
- Signature verification: https://www.inngest.com/docs/security

## Acceptance Criteria

- [ ] `INNGEST_SIGNING_KEY` verified in production environment
- [ ] Unsigned requests return 401 Unauthorized
- [ ] Valid Inngest requests still work correctly
- [ ] Test with curl to verify rejection

## Work Log

### 2025-12-16 - Security Review Discovery

**By:** Claude Code (Security Sentinel Agent)

**Actions:**
- Identified missing signature verification in code review
- Classified as P0 (critical) security vulnerability
- Documented fix approach using SDK built-in verification

**Learnings:**
- Inngest SDK has built-in signature verification when env var is set
- Must verify environment variable is deployed to production
