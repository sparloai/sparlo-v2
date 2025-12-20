---
status: pending
priority: p0
issue_id: "083"
tags: [security, usage-tracking, api, critical]
dependencies: []
---

# Discovery API Endpoint Missing Usage Limit Checks

The discovery mode API endpoint does not check usage limits before generating reports, providing a bypass for usage restrictions.

## Problem Statement

While the standard report generation flow checks `checkUsageAllowed()` before starting, the discovery mode API endpoint (`/api/discovery` or similar) does not perform this check. This means:

1. Users can bypass usage limits by using discovery mode
2. Unlimited report generation possible through discovery API
3. Usage tracking feature is incomplete
4. Potential for abuse and cost overruns

## Findings

- Discovery mode uses a separate code path for report generation
- Standard reports check `checkUsageAllowed()` before proceeding
- Discovery endpoint lacks equivalent check
- Both endpoints consume LLM tokens and should be rate-limited equally

**Affected files:**
- Discovery API endpoint (needs investigation to locate exact file)
- Related Inngest function for discovery mode

## Proposed Solutions

### Option 1: Add checkUsageAllowed() to Discovery Endpoint

**Approach:** Add the same usage check used in standard report generation to the discovery API.

**Pros:**
- Consistent enforcement across all endpoints
- Uses existing infrastructure
- Simple fix

**Cons:**
- None significant

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Centralized Usage Check Middleware

**Approach:** Create middleware or wrapper that enforces usage checks for all report-generating endpoints.

**Pros:**
- Prevents future endpoints from missing the check
- Single point of enforcement
- Easier to audit

**Cons:**
- More refactoring required
- May not fit all endpoint patterns

**Effort:** 2-3 hours

**Risk:** Medium

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- Discovery API endpoint (locate and document)
- Discovery Inngest function

**Implementation:**
```typescript
// At start of discovery endpoint/function
const { allowed, reason, remaining } = await checkUsageAllowed(accountId);
if (!allowed) {
  throw new Error(`Usage limit exceeded: ${reason}`);
}
```

## Acceptance Criteria

- [ ] Discovery API checks usage limits before generating
- [ ] Consistent error response when limit exceeded
- [ ] Same token limits apply to both standard and discovery modes
- [ ] Typecheck passes
- [ ] Test verifies discovery mode respects usage limits

## Work Log

### 2025-12-19 - Initial Discovery

**By:** Claude Code (Multi-Agent Review)

**Actions:**
- Identified discovery mode as separate code path
- Confirmed usage checks missing in discovery flow
- Documented bypass vector
- Proposed remediation options

**Learnings:**
- All LLM-consuming endpoints must check usage limits
- Centralized enforcement would prevent future gaps
- Discovery mode should count toward same quota

## Notes

- CRITICAL security gap - usage limits easily bypassed
- Consider rate limiting as additional protection layer
- May need to audit for other endpoints that consume tokens
