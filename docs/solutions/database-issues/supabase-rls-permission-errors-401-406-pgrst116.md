---
title: Supabase RLS/Permission Errors (401/406 PGRST116)
category: database-issues
severity: high
date_solved: 2026-01-06
components:
  - supabase
  - database
  - rls
  - authentication
symptoms:
  - "permission denied for schema public" errors
  - 406 Not Acceptable with PGRST116 error code
  - Users unable to access sparlo_reports table
  - RLS policy violations on authenticated operations
tags:
  - supabase
  - rls
  - permissions
  - 406
  - pgrst116
  - schema-usage
  - row-level-security
related_files:
  - apps/web/supabase/migrations/20260106184542_fix_schema_usage_grant.sql
  - apps/web/supabase/migrations/20260106185149_add_sparlo_reports_rls_policies.sql
---

# Supabase RLS/Permission Errors (401/406 PGRST116)

## Problem Summary

Users were unable to access the `sparlo_reports` table, receiving "permission denied for schema public" and HTTP 406 errors with PGRST116 error codes from PostgREST. This prevented core functionality like viewing, creating, and managing reports.

### Symptoms

- **HTTP 406 Not Acceptable**: PostgREST returning PGRST116 error code
- **Permission Denied**: "permission denied for schema public" in database logs
- **RLS Violations**: Authenticated users unable to query their own data
- **Client Errors**: Frontend requests failing with 401/406 status codes

### Example Error Messages

```
Error: permission denied for schema public
Error Code: PGRST116
HTTP Status: 406 Not Acceptable
```

## Root Cause Analysis

The issue stemmed from three missing security configurations:

### 1. Missing Schema-Level Permissions

PostgreSQL requires explicit `USAGE` grants on schemas before roles can access any objects within them:

```sql
-- Missing permission:
GRANT USAGE ON SCHEMA public TO authenticated;
```

Without this grant, the `authenticated` role could not access ANY table in the `public` schema, even if table-level grants existed.

### 2. Missing Row-Level Security Policies

The `sparlo_reports` table had RLS enabled (`ENABLE ROW LEVEL SECURITY`) but no policies defined:

```sql
-- RLS was ON, but no policies = no access
ALTER TABLE public.sparlo_reports ENABLE ROW LEVEL SECURITY;
-- ❌ No CREATE POLICY statements
```

This created a "deny by default" situation where even authenticated users with table grants couldn't query data.

### 3. Missing Table-Level Grants

Even with schema access, the `authenticated` role needed explicit table permissions:

```sql
-- Missing grants:
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sparlo_reports TO authenticated;
```

## Solution

Two migrations were created to fix the permission chain from schema → table → row level.

### Migration 1: Schema and Table Grants

**File**: `apps/web/supabase/migrations/20260106184542_fix_schema_usage_grant.sql`

```sql
-- Fix schema-level permissions for authenticated role
-- Error: "permission denied for schema public"

-- Grant USAGE on public schema (required to access any objects in the schema)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Ensure the authenticated role can use sequences (for auto-generated IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Re-apply table grants to be safe
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sparlo_reports TO authenticated;
GRANT ALL ON public.sparlo_reports TO service_role;

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Schema and table grants applied for authenticated role';
END $$;
```

**Why This Works:**
- `GRANT USAGE ON SCHEMA` allows role to see objects in schema
- `GRANT ... ON ALL SEQUENCES` enables auto-increment ID columns
- Table grants provide CRUD permissions
- Service role gets full access for admin operations

### Migration 2: Row-Level Security Policies

**File**: `apps/web/supabase/migrations/20260106185149_add_sparlo_reports_rls_policies.sql`

```sql
-- Add RLS policies for sparlo_reports table
-- Users can only access their own reports (account_id = auth.uid())

-- Enable RLS if not already enabled
ALTER TABLE public.sparlo_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own reports" ON public.sparlo_reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON public.sparlo_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON public.sparlo_reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON public.sparlo_reports;
DROP POLICY IF EXISTS "Service role full access" ON public.sparlo_reports;

-- SELECT: Users can read their own reports
CREATE POLICY "Users can view own reports" ON public.sparlo_reports
  FOR SELECT TO authenticated
  USING (account_id = auth.uid());

-- INSERT: Users can create reports for themselves
CREATE POLICY "Users can insert own reports" ON public.sparlo_reports
  FOR INSERT TO authenticated
  WITH CHECK (account_id = auth.uid());

-- UPDATE: Users can update their own reports
CREATE POLICY "Users can update own reports" ON public.sparlo_reports
  FOR UPDATE TO authenticated
  USING (account_id = auth.uid())
  WITH CHECK (account_id = auth.uid());

-- DELETE: Users can delete their own reports
CREATE POLICY "Users can delete own reports" ON public.sparlo_reports
  FOR DELETE TO authenticated
  USING (account_id = auth.uid());

-- Service role bypass for backend operations (Inngest, etc.)
CREATE POLICY "Service role full access" ON public.sparlo_reports
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'RLS policies created for sparlo_reports';
END $$;
```

**Policy Breakdown:**

| Policy | Operation | Condition | Purpose |
|--------|-----------|-----------|---------|
| `Users can view own reports` | SELECT | `account_id = auth.uid()` | Users see only their reports |
| `Users can insert own reports` | INSERT | `account_id = auth.uid()` | Users create reports for themselves |
| `Users can update own reports` | UPDATE | `account_id = auth.uid()` | Users edit only their reports |
| `Users can delete own reports` | DELETE | `account_id = auth.uid()` | Users delete only their reports |
| `Service role full access` | ALL | `true` | Backend services bypass RLS |

### Personal vs Team Account Pattern

The policies implement **personal account** access control where `account_id = auth.uid()`. For team accounts with shared access, use the `has_role_on_account()` helper:

```sql
-- Team account access (alternative pattern)
CREATE POLICY "Team members can view reports" ON public.sparlo_reports
  FOR SELECT TO authenticated
  USING (
    account_id = auth.uid() OR                    -- Personal account
    public.has_role_on_account(account_id)        -- Team member
  );
```

## The PostgreSQL Permission Chain

Understanding the three-level permission model:

```
┌──────────────────────────────────────────────────────┐
│ 1. SCHEMA LEVEL                                       │
│    GRANT USAGE ON SCHEMA public TO authenticated;    │
│    ↓ Allows role to see tables/functions in schema   │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│ 2. TABLE LEVEL                                        │
│    GRANT SELECT, INSERT ON table TO authenticated;   │
│    ↓ Allows role to perform CRUD operations          │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│ 3. ROW LEVEL (RLS Policies)                          │
│    CREATE POLICY ... USING (account_id = auth.uid());│
│    ↓ Restricts which specific rows user can access   │
└──────────────────────────────────────────────────────┘
```

**All three levels must be configured** for users to successfully query data.

## Testing the Fix

### Verification Queries

```sql
-- 1. Check schema permissions
SELECT
  schema_name,
  schema_owner,
  has_schema_privilege('authenticated', schema_name, 'USAGE') as can_use_schema
FROM information_schema.schemata
WHERE schema_name = 'public';

-- 2. Check table grants
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'sparlo_reports'
  AND grantee = 'authenticated';

-- 3. Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'sparlo_reports';

-- 4. Test data access as authenticated user
SET ROLE authenticated;
SET request.jwt.claims.sub = '<user_uuid>';
SELECT * FROM sparlo_reports LIMIT 1;
RESET ROLE;
```

### Frontend Testing

```typescript
// Test in browser console or component
const { data, error } = await supabase
  .from('sparlo_reports')
  .select('*')
  .limit(1);

if (error) {
  console.error('Error:', error);
  // Should now succeed without 406/PGRST116
} else {
  console.log('Success:', data);
}
```

## Prevention Strategies

### 1. Always Follow the Permission Checklist

When creating new tables, apply this checklist in order:

```sql
-- [ ] Step 1: Create table
CREATE TABLE public.new_table (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- [ ] Step 2: Enable RLS
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- [ ] Step 3: Revoke default permissions (principle of least privilege)
REVOKE ALL ON public.new_table FROM authenticated, anon;

-- [ ] Step 4: Grant specific table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.new_table TO authenticated;
GRANT ALL ON public.new_table TO service_role;

-- [ ] Step 5: Create RLS policies
CREATE POLICY "users_read_own" ON public.new_table
  FOR SELECT TO authenticated
  USING (account_id = auth.uid() OR public.has_role_on_account(account_id));

CREATE POLICY "users_write_own" ON public.new_table
  FOR INSERT TO authenticated
  WITH CHECK (account_id = auth.uid());

CREATE POLICY "users_update_own" ON public.new_table
  FOR UPDATE TO authenticated
  USING (account_id = auth.uid())
  WITH CHECK (account_id = auth.uid());

CREATE POLICY "users_delete_own" ON public.new_table
  FOR DELETE TO authenticated
  USING (account_id = auth.uid());

CREATE POLICY "service_role_bypass" ON public.new_table
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- [ ] Step 6: Grant sequence access if using auto-increment IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

### 2. Schema Usage Grants Should Be One-Time Setup

The schema-level grant is typically done once during initial setup:

```sql
-- apps/web/supabase/migrations/YYYYMMDDHHMMSS_initial_schema_permissions.sql
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

### 3. Use Migration Templates

Create a template file for new tables:

```bash
# apps/web/supabase/migration-templates/new-table-template.sql
-- Save this as a reference when creating new tables

-- 1. CREATE TABLE
-- 2. ENABLE RLS
-- 3. REVOKE defaults
-- 4. GRANT table permissions
-- 5. CREATE POLICY for each operation (SELECT/INSERT/UPDATE/DELETE)
-- 6. Service role bypass policy
```

### 4. Test Locally Before Production

```bash
# Reset local database to test migrations from scratch
pnpm supabase:web:reset

# Apply new migration
pnpm --filter web supabase migrations up

# Run tests
pnpm --filter web supabase:test

# Generate types (must run after migrations)
pnpm supabase:web:typegen
```

## Common RLS/Permission Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `permission denied for schema public` | Missing `GRANT USAGE ON SCHEMA` | Add schema-level grant |
| `PGRST116` (406) | RLS enabled but no policies | Create RLS policies |
| `new row violates row-level security policy` | INSERT policy `WITH CHECK` failed | Fix policy condition or data |
| `42501: permission denied for table` | Missing table-level grants | Add `GRANT SELECT/INSERT/...` |
| RLS policies not working | Using service/admin client | Switch to standard client for RLS |

## RLS Policy Patterns

### Personal Account (Single User)

```sql
CREATE POLICY "personal_access" ON table_name
  FOR SELECT TO authenticated
  USING (account_id = auth.uid());
```

### Team Account (Multi-User)

```sql
CREATE POLICY "team_access" ON table_name
  FOR SELECT TO authenticated
  USING (
    account_id = auth.uid() OR                    -- Owner
    public.has_role_on_account(account_id)        -- Team member
  );
```

### Permission-Based Access

```sql
CREATE POLICY "permission_required" ON table_name
  FOR UPDATE TO authenticated
  USING (
    public.has_permission(
      auth.uid(),
      account_id,
      'reports.edit'::app_permissions
    )
  );
```

### Admin Override

```sql
CREATE POLICY "admin_or_owner" ON table_name
  FOR ALL TO authenticated
  USING (
    account_id = auth.uid() OR
    public.is_super_admin()
  );
```

## Architecture Context

### Why RLS Instead of API Authorization?

Supabase uses **Row-Level Security (RLS)** as the primary authorization layer instead of traditional API middleware checks.

**Benefits:**
1. **Defense in Depth**: Authorization enforced at database layer, not application layer
2. **Consistency**: Same rules apply whether accessing via API, Functions, or direct SQL
3. **Performance**: PostgreSQL enforces policies efficiently in the query planner
4. **Auditability**: Policies are declarative and version-controlled in migrations
5. **No Bypass Risk**: Even compromised API keys can't bypass RLS (except service role)

**Tradeoff:**
- More complex to debug (errors can be cryptic)
- Requires understanding of PostgreSQL RBAC
- Policies must be carefully designed to avoid performance issues on large tables

### Service Role vs Authenticated Role

| Role | Use Case | RLS Applied? | When to Use |
|------|----------|--------------|-------------|
| `authenticated` | Frontend clients | ✅ Yes | Standard user operations |
| `anon` | Public access | ✅ Yes | Unauthenticated reads |
| `service_role` | Backend services | ❌ No (bypasses RLS) | Admin operations, scheduled jobs, migrations |

**Critical**: Never expose `service_role` key to frontend. It bypasses all RLS.

## Related Documentation

- **Supabase RLS Guide**: `apps/web/supabase/CLAUDE.md` - Security patterns
- **Migration Workflow**: `apps/web/supabase/CLAUDE.md` - Creating/applying migrations
- **Account Context**: `/Users/alijangbar/Desktop/sparlo-v2/CLAUDE.md` - Personal vs team accounts
- **Authorization Patterns**: `docs/solutions/security/usage-tracking-security-hardening.md` - SECURITY DEFINER functions

## Commit Reference

```bash
# Migration 1: Schema and table grants
apps/web/supabase/migrations/20260106184542_fix_schema_usage_grant.sql

# Migration 2: RLS policies
apps/web/supabase/migrations/20260106185149_add_sparlo_reports_rls_policies.sql
```

## Key Learnings

1. **Permission chain matters**: Schema → Table → Row-level permissions must ALL be configured
2. **RLS + No policies = No access**: Enabling RLS without policies blocks all access by default
3. **Test with real users**: `service_role` bypasses RLS, so test with `authenticated` role
4. **Schema grants are foundational**: Without `GRANT USAGE ON SCHEMA`, nothing else works
5. **PGRST116 is cryptic**: PostgREST 406 errors often mean missing RLS policies, not HTTP content negotiation
6. **Service role is powerful**: Only use for backend operations where RLS must be bypassed
7. **Personal accounts are simplest**: `account_id = auth.uid()` is the baseline pattern
8. **Team accounts add complexity**: Use `has_role_on_account()` helper for multi-user access

## Quick Reference

### Debugging Permission Issues

```bash
# 1. Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'your_table';

# 2. Check existing policies
\d+ your_table  -- psql command
# or
SELECT * FROM pg_policies WHERE tablename = 'your_table';

# 3. Check grants
SELECT * FROM information_schema.table_privileges
WHERE table_name = 'your_table';

# 4. Test as specific role
SET ROLE authenticated;
SET request.jwt.claims.sub = 'user-uuid-here';
SELECT * FROM your_table LIMIT 1;
RESET ROLE;
```

### Creating RLS-Enabled Tables (Full Example)

```sql
-- Complete example with all permission layers
BEGIN;

-- 1. Table
CREATE TABLE public.example_table (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. RLS
ALTER TABLE public.example_table ENABLE ROW LEVEL SECURITY;

-- 3. Revoke defaults
REVOKE ALL ON public.example_table FROM authenticated, anon;

-- 4. Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.example_table TO authenticated;
GRANT ALL ON public.example_table TO service_role;

-- 5. RLS policies
CREATE POLICY "select_own" ON public.example_table
  FOR SELECT TO authenticated
  USING (account_id = auth.uid());

CREATE POLICY "insert_own" ON public.example_table
  FOR INSERT TO authenticated
  WITH CHECK (account_id = auth.uid());

CREATE POLICY "update_own" ON public.example_table
  FOR UPDATE TO authenticated
  USING (account_id = auth.uid())
  WITH CHECK (account_id = auth.uid());

CREATE POLICY "delete_own" ON public.example_table
  FOR DELETE TO authenticated
  USING (account_id = auth.uid());

CREATE POLICY "service_bypass" ON public.example_table
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 6. Indexes
CREATE INDEX idx_example_table_account_id ON public.example_table(account_id);
CREATE INDEX idx_example_table_created_at ON public.example_table(created_at DESC);

COMMIT;
```

---

## Related Issues

- [Supabase 406 Error - Stale Schema Cache](./supabase-406-stale-schema-cache-20260107.md) - Different cause: stale PostgREST schema cache (no PGRST error code)
- [Accounts Table Missing SELECT RLS Policy](./accounts-table-missing-select-rls-policy-20260109.md) - Specific case: accounts table had UPDATE/INSERT/DELETE policies but no SELECT policy

---

**Version**: 1.0 | **Date Solved**: 2026-01-06 | **Severity**: High
