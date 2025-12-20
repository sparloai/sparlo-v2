---
status: pending
priority: p0
issue_id: "081"
tags: [usage-tracking, inngest, critical, billing]
dependencies: []
---

# Token Usage Never Persisted to Database

Token usage is tracked in-memory during report generation but `incrementUsage()` is never called to persist the data to the database.

## Problem Statement

The `generate-report.ts` Inngest function tracks token usage via `trackUsage()` and `getTotalUsage()` functions, but this data is only returned in the function result - it's never persisted to the `usage_periods` table. This means:

1. All token usage data is lost after report generation
2. Usage limits cannot be enforced
3. Billing is impossible without accurate usage data
4. The entire usage tracking feature is non-functional

## Findings

- `generate-report.ts` has `trackUsage()` and `getTotalUsage()` helper functions for in-memory tracking
- Token counts are accumulated during LLM calls
- The `getTotalUsage()` result is returned in the function response but never saved
- `usage.service.ts` has a well-designed `incrementUsage()` function that is never called
- The database functions `increment_usage()` and `check_usage_allowed()` exist but are unused

**Affected files:**
- `/apps/web/lib/inngest/functions/generate-report.ts` - Missing `incrementUsage()` call
- `/apps/web/app/home/(user)/_lib/server/usage.service.ts` - Unused service

## Proposed Solutions

### Option 1: Add incrementUsage() Call After Report Completion

**Approach:** Add a call to `incrementUsage()` after the report is successfully generated, passing the total token counts.

**Pros:**
- Simple, targeted fix
- Uses existing infrastructure
- Minimal code changes

**Cons:**
- None significant

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Track Usage Per-Step with Periodic Saves

**Approach:** Increment usage after each major step (research, analysis, writing) rather than at the end.

**Pros:**
- More granular tracking
- Partial usage recorded if report fails mid-way

**Cons:**
- More database writes
- More complex implementation

**Effort:** 2-3 hours

**Risk:** Medium

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/lib/inngest/functions/generate-report.ts` - Add `incrementUsage()` call
- `apps/web/app/home/(user)/_lib/server/usage.service.ts` - Service to use

**Code location for fix:**
After successful report completion, before returning success:
```typescript
// After report is complete, persist usage
await incrementUsage(accountId, {
  input_tokens: totalInputTokens,
  output_tokens: totalOutputTokens
});
```

## Acceptance Criteria

- [ ] `incrementUsage()` is called after successful report generation
- [ ] Token counts from `getTotalUsage()` are passed to the service
- [ ] Usage data appears in `usage_periods` table after report completion
- [ ] Failed reports do not increment usage (or increment partial usage)
- [ ] Typecheck passes
- [ ] Integration test verifies usage persistence

## Work Log

### 2025-12-19 - Initial Discovery

**By:** Claude Code (Multi-Agent Review)

**Actions:**
- Identified complete absence of `incrementUsage()` calls in codebase
- Traced token tracking flow from LLM calls to function result
- Confirmed usage service exists but is never invoked
- Classified as P0 due to billing/feature impact

**Learnings:**
- The infrastructure for usage tracking exists and is well-designed
- Only the final integration step is missing
- This is a simple fix with major impact

## Notes

- This is a CRITICAL bug - the entire usage tracking feature is non-functional
- Must be fixed before production deployment of usage tracking
- Consider adding telemetry to verify usage is being recorded
