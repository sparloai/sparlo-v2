---
title: Admin Usage Page 500 Errors & Missing Paywall Issue
status: resolved
date: "2026-01-08"
severity: critical
problem_type:
  - database_issue
  - logic_error
  - race_condition
components_affected:
  - usage.service.ts
  - hybrid-reports-server-actions.ts
  - team-usage.loader.ts
  - mark_first_report_used RPC
  - try_claim_first_report RPC
  - admin_search_users_by_email RPC
  - admin-usage-search.tsx
keywords:
  - admin page
  - 500 error
  - paywall
  - free report
  - race condition
  - RLS
  - SECURITY DEFINER
  - token limit
  - usage tracking
tags:
  - bug-fix
  - security
  - database
  - user-experience
  - billing
---

## Problem Summary

Two separate but related issues affected the application:

1. **Admin Usage Page 500 Errors**: The admin search page failed to load user usage data when querying accounts
2. **Missing Paywall After First Report**: Users who consumed their free first report were not seeing the paywall and could potentially generate additional free reports due to a race condition

## Root Causes

### Issue 1: Admin Page 500 Errors

The admin search functionality (`admin_search_users_by_email` RPC) was failing with 500 errors due to authorization checks in the server action layer.

**File**: `/Users/alijangbar/Desktop/sparlo-v2/packages/features/admin/src/lib/server/admin-usage-actions.ts`
**Lines**: 91-131 (searchUserByEmailAction function)

The action used the standard Supabase client with RLS enforcement, which blocked the admin's ability to query user data even after passing the `isSuperAdmin` check.

### Issue 2: Race Condition in First Report Claiming

The freemium model checks if the first report is available, then marks it as used in separate operations:

1. `checkUsageAllowed()` queries `accounts.first_report_used_at`
2. Report generation proceeds
3. `markFirstReportUsed()` updates the field

**Files Affected**:
- `/Users/alijangbar/Desktop/sparlo-v2/apps/web/app/app/_lib/server/usage.service.ts` (lines 233-252)
- `/Users/alijangbar/Desktop/sparlo-v2/apps/web/app/app/_lib/server/hybrid-reports-server-actions.ts` (lines 279-288)

**Problem**: React's `cache()` function (line 3, usage.service.ts) only prevents duplicate calls within the same request, not across concurrent requests. Two simultaneous requests could both see `first_report_used_at = null`, pass the check, and both generate reports.

**Evidence from Todo**: `/Users/alijangbar/Desktop/sparlo-v2/todos/097-pending-p1-first-report-race-condition.md` documents the exact race condition scenario.

### Issue 3: Paywall Not Showing

When users tried to generate a second report after using their free one, the RPC functions for marking the first report as used were failing silently due to RLS blocking the UPDATE statement.

**Files Affected**:
- `mark_first_report_used()` function (usage.service.ts, lines 233-252)
- `try_claim_first_report()` RPC (migration 20251223114500)

The functions had proper authorization checks but used `SECURITY INVOKER`, which meant RLS policies would still block the UPDATE even after auth passed.

## Observed Symptoms

### Admin Page
- 500 Internal Server Error when searching for users by email
- Error message: "Failed to search for user"
- Occurred in `/admin/usage` page when using the search functionality

### User Paywall
- Users who completed their first free report could still attempt to generate additional reports
- No paywall/subscription prompt appeared
- System allowed multiple "free" reports instead of enforcing the 1-per-account limit

### Error Messages in Logs
- Admin search: `Failed to search for user: {database error}`
- First report marking: Silent failures - RLS blocking UPDATE operations

## Solution Components

### Fix 1: Admin Client Usage Pattern

Changed `searchUserByEmailAction` to use admin client with proper authorization:

**File**: `/Users/alijangbar/Desktop/sparlo-v2/packages/features/admin/src/lib/server/admin-usage-actions.ts`
**Changes**: Lines 114-128

```typescript
// Added admin client usage after isSuperAdmin check
const adminClient = getSupabaseServerAdminClient();

const { data: users, error } = await adminClient.rpc(
  'admin_search_users_by_email',
  {
    p_email: data.email,
  },
);
```

**Git Commit**: `8e72ed67` - "Fix admin usage actions - remove adminAction wrapper"

### Fix 2: SECURITY DEFINER RPC Functions

Changed both `mark_first_report_used` and `try_claim_first_report` from `SECURITY INVOKER` to `SECURITY DEFINER` to allow updates after authorization checks.

**File**: `/Users/alijangbar/Desktop/sparlo-v2/apps/web/supabase/migrations/20260108154337_fix_mark_first_report_security.sql`
**Changes**: Lines 1-56

The functions now:
- Check authorization first (lines 16-18)
- Use `SECURITY DEFINER` (line 9, 34) to bypass RLS after auth passes
- Maintain secure `search_path = public` (line 10, 35) to prevent SQL injection

### Fix 3: Atomic First Report Claiming

Introduced `try_claim_first_report()` RPC for atomic claiming to prevent race conditions:

**File**: `/Users/alijangbar/Desktop/sparlo-v2/apps/web/supabase/migrations/20251223114500_add_atomic_first_report_claim.sql`
**Changes**: Lines 1-39

This function:
- Uses `FOR UPDATE` locking (implied in UPDATE statement)
- Returns `'CLAIMED'` if this request marked it
- Returns `'ALREADY_USED'` if another request beat us to it
- Returns `'UNAUTHORIZED'` for access violations
- Prevents concurrent claims atomically at the database level

**Updated server action** to use this function:
- `/Users/alijangbar/Desktop/sparlo-v2/apps/web/app/app/_lib/server/usage.service.ts` (lines 270-291)

### Fix 4: Authorization Boundary Enforcement

Added explicit membership checks in team-usage loader to prevent information disclosure:

**File**: `/Users/alijangbar/Desktop/sparlo-v2/apps/web/app/app/[account]/_lib/server/team-usage.loader.ts`
**Changes**: Lines 40-54

```typescript
// Check user is member before accessing usage data
const { data: membership } = await client
  .from('accounts_memberships')
  .select('account_id')
  .eq('account_id', accountId)
  .eq('user_id', (await client.auth.getUser()).data.user?.id ?? '')
  .single();
```

## Database Migrations Applied

1. **Migration 20251220231212**: Initial `mark_first_report_used` RPC
2. **Migration 20251222185452**: Fix authorization checks in `mark_first_report_used`
3. **Migration 20251223114500**: Add atomic `try_claim_first_report` RPC
4. **Migration 20260107082025**: Create admin usage RPCs and adjustment functions
5. **Migration 20260108154337**: Fix SECURITY DEFINER on first report functions

## Key Architectural Insights

### RLS + SECURITY INVOKER Problem
Functions using `SECURITY INVOKER` inherit the caller's RLS context, so even if the function has authorization checks, RLS policies still apply to statements within the function. For admin operations that need to bypass normal RLS, `SECURITY DEFINER` is required after explicit auth checks.

### Race Condition Prevention
The atomic claim pattern at the database level (UPDATE with condition + FOUND check) is more reliable than application-level deduplication because:
- Database serialization is stronger than application-level locking
- Prevents issues across different server instances
- Works reliably in concurrent/distributed scenarios

### Freemium Model Security
The system enforces: 1 free report per account, then requires subscription. This requires:
1. Atomic claiming at DB level
2. Proper authorization checks
3. Subscription status validation
4. Clear error messaging for users at limit

## Files Changed Summary

| File | Type | Issue | Fix |
|------|------|-------|-----|
| `apps/web/app/app/_lib/server/usage.service.ts` | TypeScript | Race condition, RLS blocking | Added `tryClaimFirstReport()`, changed to `SECURITY DEFINER` |
| `apps/web/app/app/_lib/server/hybrid-reports-server-actions.ts` | TypeScript | Using old marking function | Updated to use `tryClaimFirstReport()` |
| `apps/web/app/app/[account]/_lib/server/team-usage.loader.ts` | TypeScript | Missing auth boundary | Added membership verification before usage query |
| `packages/features/admin/src/lib/server/admin-usage-actions.ts` | TypeScript | Admin client not used | Changed to use admin client after auth check |
| `apps/web/supabase/migrations/20260107082025_*.sql` | SQL | 500 error on admin search | Added proper admin search RPC with correct schema |
| `apps/web/supabase/migrations/20260108154337_*.sql` | SQL | Paywall bypassed, race condition | Changed RPC to SECURITY DEFINER |

## Testing Validation

### Admin Page Fix
- Test: Search for user by email on `/admin/usage`
- Expected: User data returns with usage stats, no 500 error
- Status: Fixed in commit `52c320b4`

### First Report Claiming Fix
- Test: Attempt concurrent first report generation
- Expected: Only one succeeds, second shows error
- Status: Atomic DB operations prevent race condition

### Paywall Display Fix
- Test: Generate first report, attempt second report
- Expected: Second attempt shows "Please subscribe" error
- Status: RLS bypass allows proper update after auth

## Related Todos

- `/Users/alijangbar/Desktop/sparlo-v2/todos/097-pending-p1-first-report-race-condition.md` - Detailed race condition analysis

## Prevention for Future Development

When implementing freemium features:
1. Always use atomic operations at database level for claim/mark operations
2. For admin operations, remember SECURITY DEFINER + SECURITY INVOKER implications
3. Use explicit membership/authorization checks as defense-in-depth
4. Add rate limiting and safety caps to prevent abuse (see `adjust_usage_period_limit` function)
5. Log all authorization failures for audit trail

---

**Last Updated**: 2026-01-08
**Fixed By**: PR #9 - fix/admin-usage-page branch
**Commits**: 52c320b4, 47b7184f, 6f697b4c, 8e72ed67
