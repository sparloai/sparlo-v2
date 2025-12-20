---
status: completed
priority: p1
issue_id: "071"
tags: [code-review, security, database, usage-tracking]
dependencies: []
---

# SECURITY DEFINER Functions Missing Authorization Checks

## Problem Statement

Both `get_or_create_usage_period()` and `increment_usage()` PostgreSQL functions are declared as `SECURITY DEFINER` but do NOT validate that the caller has permission to act on the provided `p_account_id`. This allows any authenticated user to:

1. Create usage periods for other users' accounts
2. Increment token usage for arbitrary accounts (griefing attack)
3. Potentially exhaust other users' quotas maliciously

**Why it matters:** This is a critical security vulnerability that allows authorization bypass. Any authenticated user can manipulate another user's usage data, leading to denial of service, billing fraud, and data integrity issues.

## Findings

### Evidence from Security Review

**File:** `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql` (Lines 54-100, 103-154)

**Attack Scenario:**
```typescript
// Attacker can call this for ANY account_id, not just their own
await client.rpc('increment_usage', {
  p_account_id: 'victim-uuid-here',  // No authorization check!
  p_tokens: 999999999,
  p_is_report: true
});
```

**Impact:**
- Privilege Escalation: Users can manipulate other accounts' usage data
- Denial of Service: Attackers can exhaust victims' token quotas
- Data Integrity: Usage statistics become unreliable
- Billing Fraud: Attackers can game the system

## Proposed Solutions

### Solution 1: Add Authorization Checks to Both Functions (Recommended)
**Pros:** Direct fix, minimal code change, follows existing patterns
**Cons:** None
**Effort:** Small (1-2 hours)
**Risk:** Low

```sql
-- Add at start of BOTH functions:
IF p_account_id != auth.uid() AND NOT public.has_role_on_account(p_account_id) THEN
  RAISE EXCEPTION 'Unauthorized: You do not have access to this account';
END IF;
```

### Solution 2: Create Wrapper Server Actions
**Pros:** Authorization at application layer, more flexible
**Cons:** Doesn't protect direct RPC calls, requires more code
**Effort:** Medium (3-4 hours)
**Risk:** Medium - someone could still call RPC directly

### Solution 3: Revoke EXECUTE from authenticated, Grant Only to service_role
**Pros:** Complete protection at database level
**Cons:** Requires all calls to go through admin client, more complex
**Effort:** Medium (2-3 hours)
**Risk:** Low but requires architecture change

## Recommended Action

Solution 1 - Add authorization checks to both functions. This is the standard pattern used throughout the codebase (see `public.has_role_on_account` usage in other SECURITY DEFINER functions).

## Technical Details

**Affected files:**
- `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql`

**Database changes required:**
- Modify `get_or_create_usage_period()` function
- Modify `increment_usage()` function

## Acceptance Criteria

- [ ] Both functions validate caller has access to account_id
- [ ] Unauthorized calls raise clear exception
- [ ] Unit tests verify unauthorized access is blocked
- [ ] Cannot manipulate other users' usage via RPC

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-19 | Created | From code review of usage tracking feature |

## Resources

- PR Branch: `feat/token-based-usage-tracking`
- Security Review Agent: Identified as CRITICAL-1
- Related: CLAUDE.md security guidelines for SECURITY DEFINER functions
