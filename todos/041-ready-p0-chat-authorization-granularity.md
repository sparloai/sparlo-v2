---
status: ready
priority: p0
issue_id: "041"
tags: [security, authorization, chat, rls]
dependencies: []
---

# Chat API Missing Report-Level Authorization

## Problem Statement

The chat API endpoint at `apps/web/app/api/sparlo/chat/route.ts` relies solely on RLS to authorize access, but the current RLS policy only checks team membership, not report ownership. This means any team member can chat with any other team member's report.

**Security Impact:** HIGH - Data confidentiality breach between team members.

## Findings

- **File:** `apps/web/app/api/sparlo/chat/route.ts:35-40`
- RLS query checks `sparlo_reports` table but policy only verifies user is authenticated
- No explicit check that `report.created_by === current_user.id` or similar ownership validation
- Team workspace context means multiple users share account access
- Personal reports should not be accessible by other team members

**Code in question:**
```typescript
const { data: report, error } = await client
  .from('sparlo_reports')
  .select('id, status, report_data, chat_history')
  .eq('id', reportId)
  .single();
```

The RLS policy likely allows access based on team membership rather than report ownership.

## Proposed Solutions

### Option 1: Add RLS Policy for Report Ownership

**Approach:** Create/update RLS policy on `sparlo_reports` to check `created_by = auth.uid()` for personal reports.

**Pros:**
- Defense in depth at database layer
- Consistent with existing security model
- No application code changes needed

**Cons:**
- Need to verify team reports vs personal reports distinction
- May need different policies for different contexts

**Effort:** 1-2 hours

**Risk:** Low

---

### Option 2: Explicit Ownership Check in Route

**Approach:** Add explicit check in route handler: `if (report.created_by !== user.id) return 403`

**Pros:**
- Clear, explicit authorization
- Easy to audit and test
- Works regardless of RLS configuration

**Cons:**
- Duplicates what RLS should do
- Requires fetching user context

**Effort:** 30 minutes

**Risk:** Low

---

### Option 3: Both (Defense in Depth)

**Approach:** Fix RLS policy AND add explicit check in route.

**Pros:**
- Maximum security
- Catches any policy drift

**Cons:**
- Slight performance overhead from duplicate check

**Effort:** 2 hours

**Risk:** Low

## Recommended Action

Implement Option 3 (both). This is a P0 security issue requiring defense in depth:

1. Verify current RLS policy on `sparlo_reports`
2. Add/update policy to enforce `created_by = auth.uid()` for SELECT
3. Add explicit ownership check in route handler as backup
4. Add test coverage for cross-user access denial

## Technical Details

**Affected files:**
- `apps/web/app/api/sparlo/chat/route.ts:35-44` - Add ownership check
- `apps/web/supabase/migrations/` - New migration for RLS policy update

**Related components:**
- `sparlo_reports` table RLS policies
- Report display page (should also verify ownership)

## Resources

- **Commit:** `fefb735` (fix: chat API)
- **Related:** `enhanceRouteHandler` provides `user` context via `{ auth: true }`

## Acceptance Criteria

- [ ] RLS policy updated to check `created_by = auth.uid()`
- [ ] Route handler includes explicit ownership validation
- [ ] Returns 404 (not 403) for unauthorized access (prevents enumeration)
- [ ] Test: User A cannot chat with User B's report
- [ ] Test: User can chat with their own report

## Work Log

### 2025-12-17 - Initial Discovery

**By:** Claude Code (Code Review)

**Actions:**
- Identified authorization gap during security-sentinel review
- Analyzed RLS policy requirements
- Documented 3 solution approaches

**Learnings:**
- Current RLS may only check authentication, not ownership
- Team context creates multi-user scenarios requiring careful authorization
