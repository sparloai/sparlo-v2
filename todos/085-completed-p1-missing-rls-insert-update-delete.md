---
status: pending
priority: p1
issue_id: "085"
tags: [security, database, rls]
dependencies: []
---

# Missing RLS Policies for INSERT/UPDATE/DELETE on usage_periods

The `usage_periods` table only has a SELECT policy; INSERT, UPDATE, and DELETE operations lack RLS protection.

## Problem Statement

While there is an RLS policy for SELECT on `usage_periods`, the table lacks policies for modification operations. This means:

1. Direct INSERT/UPDATE/DELETE may bypass intended access controls
2. Only SECURITY DEFINER functions provide write access currently
3. If functions are changed or new access patterns added, no safety net exists
4. Defense in depth principle violated

## Findings

- `usage_periods` table has RLS enabled
- SELECT policy exists for account owners/members
- No INSERT policy - relies on functions only
- No UPDATE policy - relies on functions only
- No DELETE policy - no deletion should be allowed

**Current state:**
```sql
-- Only this policy exists
CREATE POLICY "Users can view their account usage"
  ON usage_periods FOR SELECT
  USING (account_id = auth.uid() OR EXISTS (...membership check...));
```

## Proposed Solutions

### Option 1: Add Restrictive Policies

**Approach:** Add INSERT/UPDATE/DELETE policies that deny direct access, forcing all writes through SECURITY DEFINER functions.

**Pros:**
- Defense in depth
- Clear access pattern (functions only)
- Prevents accidental direct writes

**Cons:**
- May complicate debugging

**Effort:** 30 minutes

**Risk:** Low

**Implementation:**
```sql
-- Deny all direct inserts (must use functions)
CREATE POLICY "No direct inserts" ON usage_periods
  FOR INSERT WITH CHECK (false);

-- Deny all direct updates (must use functions)
CREATE POLICY "No direct updates" ON usage_periods
  FOR UPDATE USING (false);

-- Deny all deletes (usage history should never be deleted)
CREATE POLICY "No deletes" ON usage_periods
  FOR DELETE USING (false);
```

---

### Option 2: Service Role Only Access

**Approach:** Add policies that only allow service role to modify.

**Pros:**
- More explicit about intended access pattern
- Allows admin access if needed

**Cons:**
- Slightly more complex

**Effort:** 30 minutes

**Risk:** Low

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql`

**Migration required:** Yes - add new policies

## Acceptance Criteria

- [ ] INSERT policy added (restrictive)
- [ ] UPDATE policy added (restrictive)
- [ ] DELETE policy added (deny all)
- [ ] Functions still work correctly
- [ ] Direct access attempts are blocked
- [ ] Typecheck passes

## Work Log

### 2025-12-19 - Initial Discovery

**By:** Claude Code (Security Sentinel)

**Actions:**
- Audited RLS policies on usage_periods table
- Identified missing INSERT/UPDATE/DELETE policies
- Proposed restrictive policy approach
- Documented defense in depth gap

**Learnings:**
- RLS should cover all operation types
- SECURITY DEFINER functions bypass RLS by design
- Restrictive policies act as safety net

## Notes

- HIGH priority security hardening
- Part of broader RLS audit needed
- Consider similar review for other tables
