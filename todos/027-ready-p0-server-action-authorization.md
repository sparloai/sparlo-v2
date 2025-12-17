---
status: ready
priority: p0
issue_id: "027"
tags: [security, authorization, server-actions]
dependencies: []
---

# Add Authorization Checks to Server Actions

Critical: Server actions for update, delete, rename, and archive operations lack ownership verification.

## Problem Statement

The server actions in `sparlo-reports-server-actions.ts` perform database mutations without verifying that the authenticated user owns the report they're modifying. While RLS provides some protection, explicit authorization checks are required for defense-in-depth.

**Current vulnerable actions:**
- `updateReport` - No ownership check before update
- `deleteReport` - No ownership check before delete
- `renameReport` - No ownership check before rename
- `archiveReport` - No ownership check before archive

**Impact:** A malicious user could potentially modify or delete other users' reports if they know the report ID.

## Findings

- File: `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`
- `createReport` correctly captures `created_by: user.id`
- Update/delete actions trust the reportId parameter without verifying ownership
- RLS policy checks `account_id` membership but not individual ownership within account

**Vulnerable code pattern:**
```typescript
export const updateReport = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    // ❌ No check that user owns this report
    const { error } = await client
      .from('sparlo_reports')
      .update({ ... })
      .eq('id', data.reportId);
  }
);
```

## Proposed Solutions

### Option 1: Add Ownership Verification to Each Action (Recommended)

**Approach:** Before any mutation, verify the authenticated user created the report.

```typescript
export const updateReport = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const { data: { user } } = await client.auth.getUser();

    // ✅ Verify ownership
    const { data: report } = await client
      .from('sparlo_reports')
      .select('id, created_by')
      .eq('id', data.reportId)
      .single();

    if (!report || report.created_by !== user?.id) {
      throw new Error('Unauthorized: You do not own this report');
    }

    // Now safe to update
    const { error } = await client
      .from('sparlo_reports')
      .update({ ... })
      .eq('id', data.reportId);
  }
);
```

**Pros:**
- Explicit authorization at application layer
- Clear audit trail
- Defense-in-depth with RLS

**Cons:**
- Extra database query per action
- Code duplication across actions

**Effort:** 1-2 hours

**Risk:** Low

---

### Option 2: Create Reusable Authorization Utility

**Approach:** Extract ownership check into reusable function.

```typescript
async function verifyReportOwnership(client: SupabaseClient, reportId: string, userId: string) {
  const { data } = await client
    .from('sparlo_reports')
    .select('id')
    .eq('id', reportId)
    .eq('created_by', userId)
    .single();

  if (!data) throw new Error('Unauthorized');
  return data;
}
```

**Pros:**
- DRY principle
- Consistent error handling
- Easy to extend with role checks

**Cons:**
- Slight abstraction overhead

**Effort:** 2 hours

**Risk:** Low

## Recommended Action

Implement Option 2 - Create a `verifyReportOwnership` utility and apply it to all mutation actions:
1. Create utility function in `_lib/server/`
2. Add ownership check to `updateReport`
3. Add ownership check to `deleteReport`
4. Add ownership check to `renameReport`
5. Add ownership check to `archiveReport`

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`

**Actions requiring fix:**
- `updateReport` (lines ~50-70)
- `deleteReport` (lines ~72-90)
- `renameReport` (lines ~92-110)
- `archiveReport` (lines ~112-130)

## Acceptance Criteria

- [ ] `verifyReportOwnership` utility created
- [ ] `updateReport` verifies ownership before mutation
- [ ] `deleteReport` verifies ownership before mutation
- [ ] `renameReport` verifies ownership before mutation
- [ ] `archiveReport` verifies ownership before mutation
- [ ] Test: User A cannot modify User B's report
- [ ] Test: Owner can still modify their own report

## Work Log

### 2025-12-16 - Security Review Discovery

**By:** Claude Code (Security Sentinel Agent)

**Actions:**
- Identified missing authorization checks in 4 server actions
- Classified as P0 (critical) - unauthorized data modification
- Documented reusable utility pattern for fix

**Learnings:**
- RLS provides database-level protection but application-layer checks add defense-in-depth
- Team accounts allow shared access - ownership within account still needs verification
