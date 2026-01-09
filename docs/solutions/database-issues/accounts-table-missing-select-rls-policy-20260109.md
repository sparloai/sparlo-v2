---
module: Accounts
date: 2026-01-09
problem_type: database_issue
component: database
symptoms:
  - "406 Not Acceptable error when loading settings page"
  - "Supabase REST API returns 406 for accounts table queries"
  - "Page won't load - accounts data fetch fails silently"
root_cause: missing_permission
resolution_type: migration
severity: high
tags: [supabase, rls, 406, accounts, select-policy, row-level-security]
---

# Troubleshooting: Accounts Table Missing SELECT RLS Policy

## Problem

Settings page fails to load with 406 errors in console. The accounts table had RLS enabled with UPDATE, INSERT, and DELETE policies, but **no SELECT policy** was ever created, blocking all read operations.

## Environment

- Module: Accounts (core MakerKit table)
- Supabase PostgREST
- Affected Component: `public.accounts` table
- Date: 2026-01-09

## Symptoms

- Console shows: `Failed to load resource: the server responded with a status of 406 ()`
- Request URL pattern: `[project].supabase.co/rest/v1/accounts?select=id,name,picture_url,public_data&primary_owner_user_id=eq.[uuid]&is_personal_account=eq.true`
- Settings page renders blank or fails to load
- No PGRST error code in response (different from PGRST116)

## What Didn't Work

**Direct solution:** The problem was identified and fixed on the first attempt after investigation revealed the missing SELECT policy.

**Initial confusion:** The existing documentation pointed to schema cache issues (different 406 cause), but this was an authorization issue at the RLS layer.

## Solution

Created migration to add the missing SELECT policy for the accounts table.

**Migration file**: `apps/web/supabase/migrations/20260109143224_add-accounts-select-policy.sql`

```sql
-- Add missing SELECT RLS policy to accounts table
-- This fixes 406 errors when querying accounts directly

-- Policy: Users can SELECT their own personal account
-- OR accounts where they are a member (team accounts)
create policy accounts_select on public.accounts
for select
  to authenticated using (
    -- Personal account: user is the primary owner
    (is_personal_account = true and primary_owner_user_id = auth.uid())
    or
    -- Team account: user is a member of the account
    (is_personal_account = false and exists (
      select 1 from public.accounts_memberships
      where account_id = accounts.id
      and user_id = auth.uid()
    ))
  );
```

**Schema file update**: Also updated `apps/web/supabase/schemas/03-accounts.sql` to keep schema and migrations in sync.

**Commands to apply:**

```bash
# Push to production (no local Docker needed)
pnpm --filter web supabase db push --linked

# Or apply to local Supabase
pnpm --filter web supabase migrations up
```

## Why This Works

### Root Cause

The `accounts` table had:
- RLS enabled (line 39: `ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY`)
- SELECT grants (line 49: `GRANT SELECT ... ON table public.accounts TO authenticated`)
- UPDATE policy (`accounts_self_update`)
- INSERT policy (`create_org_account`)
- DELETE policy (`delete_team_account`)
- **NO SELECT policy** - this was the gap

PostgREST enforces RLS at query time. Even with SELECT grants, without a SELECT policy, all read queries return 406.

### Why Views Worked But Direct Queries Didn't

The codebase had views (`user_account_workspace`, `user_accounts`) that used `security_invoker = true`. These worked because:
1. Views with `security_invoker` inherit the caller's permissions
2. The view queries already filtered to the user's own data
3. But direct table queries through the API failed because no SELECT policy existed

### Permission Chain Review

```
Schema → Table → Row Level
  ✓        ✓         ✗ (SELECT was missing)
```

All three levels must be configured for access.

## Prevention

### 1. Always Create All CRUD Policies

When creating RLS-enabled tables, use this checklist:

```sql
-- [ ] SELECT policy (most commonly forgotten!)
-- [ ] INSERT policy
-- [ ] UPDATE policy
-- [ ] DELETE policy
-- [ ] Service role bypass (if needed)
```

### 2. Test Direct Table Queries

Views can mask missing policies. Always test direct table access:

```typescript
// Test in browser console
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .limit(1);

console.log({ data, error }); // Should not be 406
```

### 3. Audit Existing Tables

Check all tables for missing SELECT policies:

```sql
-- Find tables with RLS but no SELECT policy
SELECT t.tablename
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
  AND c.relrowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.tablename = t.tablename
    AND p.cmd = 'r'  -- 'r' = SELECT
  );
```

### 4. MakerKit Template Pattern

For accounts table specifically, the SELECT policy should cover:

| Account Type | Access Rule |
|-------------|-------------|
| Personal | `primary_owner_user_id = auth.uid()` |
| Team | `EXISTS (membership check)` |

## Differentiating 406 Errors

| Symptom | Cause | Solution |
|---------|-------|----------|
| 406 with no PGRST code + valid columns | Missing RLS SELECT policy | Add policy (this doc) |
| 406 with no PGRST code + invalid columns | Stale schema cache | Reload schema |
| 406 with PGRST116 | No RLS policies at all | Add all policies |

## Related Issues

- See also: [Supabase RLS/Permission Errors (401/406 PGRST116)](./supabase-rls-permission-errors-401-406-pgrst116.md) - Comprehensive RLS guide
- See also: [Supabase 406 Error - Stale Schema Cache](./supabase-406-stale-schema-cache-20260107.md) - Different cause: PostgREST cache

## Files Changed

```
apps/web/supabase/migrations/20260109143224_add-accounts-select-policy.sql (created)
apps/web/supabase/schemas/03-accounts.sql (updated - added SELECT policy)
```

---

**Version**: 1.0 | **Date Solved**: 2026-01-09 | **Severity**: High
