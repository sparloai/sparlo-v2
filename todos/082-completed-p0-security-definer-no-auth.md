---
status: pending
priority: p0
issue_id: "082"
tags: [security, database, rls, critical]
dependencies: []
---

# SECURITY DEFINER Functions Lack Authorization Checks

Database functions use SECURITY DEFINER but have no authorization checks, allowing any authenticated user to manipulate any account's usage data.

## Problem Statement

The migration `20251219000000_add_usage_tracking.sql` creates PostgreSQL functions with `SECURITY DEFINER` that bypass Row Level Security. These functions accept an `account_id` parameter directly without verifying the caller has permission to access that account. This means:

1. Any authenticated user can increment usage for ANY account
2. Any user can check usage limits for ANY account
3. Potential for billing manipulation and data corruption
4. Complete bypass of account isolation

## Findings

**Vulnerable functions:**
- `get_or_create_usage_period(p_account_id uuid)` - No auth check
- `increment_usage(p_account_id uuid, ...)` - No auth check
- `check_usage_allowed(p_account_id uuid)` - No auth check

All functions use `SECURITY DEFINER` which runs with the privileges of the function owner (postgres), bypassing RLS entirely.

**Attack scenario:**
```sql
-- Any authenticated user can do this:
SELECT increment_usage('victim-account-id', 999999, 999999);
-- This would exhaust the victim's usage quota
```

## Proposed Solutions

### Option 1: Add Authorization Check in Each Function

**Approach:** Add a check at the start of each function that verifies `auth.uid()` has access to the specified account.

**Pros:**
- Fixes the vulnerability directly
- Authorization logic in one place (the function)
- Clear security boundary

**Cons:**
- Requires additional query per function call
- Must keep in sync with account membership logic

**Effort:** 1-2 hours

**Risk:** Low

**Implementation:**
```sql
CREATE OR REPLACE FUNCTION increment_usage(p_account_id uuid, ...)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Authorization check: verify caller has access to this account
  IF NOT EXISTS (
    SELECT 1 FROM accounts_memberships
    WHERE account_id = p_account_id
    AND user_id = auth.uid()
  ) AND auth.uid() != p_account_id THEN
    RAISE EXCEPTION 'Unauthorized: no access to account %', p_account_id;
  END IF;

  -- ... rest of function
END;
$$;
```

---

### Option 2: Use SECURITY INVOKER + RLS

**Approach:** Change functions to SECURITY INVOKER and rely on RLS policies for authorization.

**Pros:**
- Simpler functions
- Uses existing RLS infrastructure

**Cons:**
- Harder to use advisory locks with RLS
- May not work for all use cases

**Effort:** 2-3 hours

**Risk:** Medium

---

### Option 3: Server-Side Only Access Pattern

**Approach:** Ensure these functions are only ever called from server-side code with the admin client, which already verifies authorization.

**Pros:**
- No database changes needed
- Authorization in TypeScript

**Cons:**
- Doesn't protect against direct database access
- Defense in depth recommends database-level protection

**Effort:** 1 hour

**Risk:** Medium (incomplete protection)

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql`

**Migration required:** Yes - need to create new migration to add auth checks

## Acceptance Criteria

- [ ] `increment_usage()` verifies caller has access to account
- [ ] `check_usage_allowed()` verifies caller has access to account
- [ ] `get_or_create_usage_period()` verifies caller has access to account
- [ ] Unauthorized access attempts raise exceptions
- [ ] Typecheck passes
- [ ] Test demonstrates authorization is enforced

## Work Log

### 2025-12-19 - Initial Discovery

**By:** Claude Code (Security Sentinel Agent)

**Actions:**
- Analyzed SECURITY DEFINER functions in usage tracking migration
- Identified missing authorization checks
- Documented attack scenarios
- Proposed three remediation options

**Learnings:**
- SECURITY DEFINER should always include authorization logic
- Functions accepting account_id must verify caller's access
- Defense in depth requires database-level protection

## Notes

- CRITICAL security vulnerability - must fix before deployment
- Consider audit logging for usage manipulation attempts
- Related to broader RLS policy review needed
