---
status: pending
priority: p2
issue_id: "061"
tags: [code-review, architecture, duplication, discovery-mode]
dependencies: []
---

# 70% Code Duplication in Discovery Server Actions

## Problem Statement

The discovery server actions file duplicates ~70% of the standard report server actions code. Rate limiting logic, report creation, and Inngest triggering are nearly identical between modes. This violates DRY principle and creates maintenance burden where bug fixes must be applied twice.

## Findings

**From architecture-strategist:**

**Duplicated Code Blocks:**
1. Rate limiting logic (lines 38-67) - Identical checks for window and daily limits
2. Report record creation (lines 72-95) - Nearly identical insert with only mode flag difference
3. Inngest trigger pattern (lines 102-125) - Same error handling pattern
4. Clarification answer handling (lines 148-215) - Nearly identical flow

**Evidence:**
- `discovery-reports-server-actions.ts`: 216 lines
- `sparlo-reports-server-actions.ts`: 459 lines
- Estimated overlap: ~150 lines (70% of discovery file)

**Impact:**
- Bug fixes must be applied twice
- Rate limit changes require two edits
- Inconsistency risk as code drifts
- Double test coverage needed

## Proposed Solutions

### Option A: Extract Report Service Layer (Recommended)
Create a shared service that both server actions use:

```typescript
// apps/web/app/home/(user)/_lib/server/report-service.ts
interface ReportConfig {
  mode: 'standard' | 'discovery';
  eventName: string;
  titlePrefix?: string;
  initialStep: string;
}

export async function createReportWorkflow(
  designChallenge: string,
  user: User,
  config: ReportConfig
) {
  await enforceRateLimits(user);
  const report = await createReportRecord(designChallenge, user, config);
  await triggerInngestWorkflow(report, config);
  return report;
}
```

**Pros:** DRY, single source of truth, easier testing
**Cons:** Requires refactoring existing code
**Effort:** Medium (4-6 hours)
**Risk:** Low

### Option B: Factory Function
Create a factory that generates server actions with mode-specific config.

**Pros:** Very DRY, minimal changes to action signatures
**Cons:** More abstract, harder to read
**Effort:** Medium (4-5 hours)
**Risk:** Medium

### Option C: Leave As-Is with Shared Utilities
Extract only the shared utilities (rate limiting, etc.) but keep separate actions.

**Pros:** Less invasive refactor
**Cons:** Still some duplication, partial solution
**Effort:** Low (2-3 hours)
**Risk:** Low

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected Files:**
- `apps/web/app/home/(user)/_lib/server/discovery-reports-server-actions.ts`
- `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`
- New: `apps/web/app/home/(user)/_lib/server/report-service.ts`

**Components:** None

**Database Changes:** None

## Acceptance Criteria

- [ ] Rate limiting logic exists in single location
- [ ] Report creation logic exists in single location
- [ ] Both server actions use shared service
- [ ] All existing tests pass
- [ ] No behavioral changes to either mode

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-19 | Created | Identified during code review |

## Resources

- PR: Discovery Mode commit f8b0587
- File: `discovery-reports-server-actions.ts:34-134`
