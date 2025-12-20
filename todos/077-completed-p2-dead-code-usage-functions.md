---
status: completed
priority: p2
issue_id: "077"
tags: [code-review, code-quality, yagni]
dependencies: ["074"]
---

# Dead Code - 57% of usage.service.ts Never Called

## Problem Statement

Three exported functions in usage.service.ts are never called anywhere in the codebase:
- `incrementUsage()` (lines 126-161)
- `ensureUsagePeriod()` (lines 167-184)
- `getTokenLimitForAccount()` (lines 80-121, only called by ensureUsagePeriod)

**Why it matters:** 106 lines of dead code (57% of the file) that must be maintained, tested, and kept in sync with changing requirements. Classic YAGNI violation.

## Findings

### Evidence from Code Simplicity Review

```bash
# Search for function usage
$ grep -rn "incrementUsage\|ensureUsagePeriod" apps/web/
# Only finds declarations, no calls
```

**Root Cause:** These functions were built for a future phase (token increment after report completion) that was never integrated. The infrastructure exists but isn't connected.

## Proposed Solutions

### Solution 1: Integrate the Functions (Recommended if #074 is implemented)
**Pros:** Functions become useful, feature works as designed
**Cons:** Requires #074 to be done first
**Effort:** Part of #074
**Risk:** Low

### Solution 2: Delete Dead Code (If #074 is deferred)
**Pros:** Reduces maintenance burden, cleaner codebase
**Cons:** Need to rebuild if feature is needed later
**Effort:** Small (30 mins)
**Risk:** Low

## Recommended Action

If #074 is implemented, keep the functions. Otherwise, delete them and rebuild when needed.

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/server/usage.service.ts`

## Acceptance Criteria

- [ ] Either functions are used (if #074 done) OR deleted (if deferred)
- [ ] No exported functions that are never imported

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-19 | Created | From code simplicity review |

## Resources

- PR Branch: `feat/token-based-usage-tracking`
- Code Simplicity Review Agent: 106 lines dead code identified
