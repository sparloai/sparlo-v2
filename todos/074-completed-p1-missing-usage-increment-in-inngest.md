---
status: completed
priority: p1
issue_id: "074"
tags: [code-review, architecture, usage-tracking, inngest]
dependencies: []
---

# Usage Increment Never Called - Feature Non-Functional

## Problem Statement

The `incrementUsage()` function and `increment_usage` database function exist but are NEVER called anywhere in the application. This means:

1. Usage tracking shows 0% forever (only checked, never incremented)
2. Users can generate unlimited reports despite tier limits
3. The entire metering system is completely bypassed
4. Billing mismatch between usage displayed and actual consumption

**Why it matters:** The core purpose of the usage tracking feature is not implemented. The feature is architecturally complete but functionally broken.

## Findings

### Evidence from Architecture Review

**Search Results:**
```bash
$ grep -rn "incrementUsage\|ensureUsagePeriod" apps/web/lib/inngest/
# (No output - these functions are never called)
```

**File:** `apps/web/lib/inngest/functions/generate-report.ts`
- No calls to `incrementUsage()` after report completion
- No tracking of actual token consumption

**From Code Simplicity Review:**
- `incrementUsage()` exported but never called (106 lines of dead code)
- `ensureUsagePeriod()` exported but never called
- 57% of usage.service.ts is dead code

### Current vs Expected Behavior

**Current:**
1. Pre-flight check: `checkUsageAllowed()` - WORKS
2. Report generation: Runs in Inngest
3. Token tracking: NEVER HAPPENS
4. Usage display: Always shows 0% used

**Expected:**
1. Pre-flight check: `checkUsageAllowed()`
2. Report generation: Runs in Inngest
3. After completion: `incrementUsage(actualTokens)`
4. Usage display: Shows accurate percentage

## Proposed Solutions

### Solution 1: Add incrementUsage to Inngest Final Step (Recommended)
**Pros:** Direct fix, correct location, integrates with existing token tracking
**Cons:** None
**Effort:** Small (1-2 hours)
**Risk:** Low

```typescript
// In generate-report.ts, after AN5 completion:
await step.run('save-token-usage', async () => {
  const totalUsage = getTotalUsage();

  // Update report with token usage
  await supabase
    .from('sparlo_reports')
    .update({ token_usage: totalUsage })
    .eq('id', reportId);

  // INCREMENT USAGE (MISSING)
  await incrementUsage(accountId, totalUsage.totalTokens, {
    isReport: true,
    isChat: false,
  });
});
```

### Solution 2: Delete Dead Code, Implement When Needed
**Pros:** Follows YAGNI, removes complexity
**Cons:** Feature remains non-functional
**Effort:** Small (30 mins to delete)
**Risk:** Low but feature doesn't work

### Solution 3: Use Database Trigger Instead
**Pros:** Automatic, can't be forgotten
**Cons:** More complex, less flexible
**Effort:** Medium (2-3 hours)
**Risk:** Medium - harder to debug

## Recommended Action

Solution 1 - Add `incrementUsage()` call to Inngest function after report completion. This completes the feature as designed.

## Technical Details

**Affected files:**
- `apps/web/lib/inngest/functions/generate-report.ts`
- `apps/web/lib/inngest/functions/generate-discovery-report.ts` (if exists)

**Integration points:**
- After final step saves report data
- Use `token_usage` JSONB from report to get actual tokens
- Call `incrementUsage(accountId, totalTokens, { isReport: true })`

## Acceptance Criteria

- [ ] `incrementUsage()` called after report completion
- [ ] Actual token usage recorded (not estimated)
- [ ] Usage percentage increases after each report
- [ ] Same applies to discovery reports
- [ ] Chat token tracking works when chat messages are sent

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-19 | Created | From architecture and simplicity reviews |

## Resources

- PR Branch: `feat/token-based-usage-tracking`
- Architecture Review Agent: Identified as CRITICAL (P0) - feature non-functional
- Code Simplicity Review Agent: Identified as dead code (YAGNI violation)
