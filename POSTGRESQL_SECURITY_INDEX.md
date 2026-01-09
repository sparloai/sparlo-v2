# PostgreSQL Function Security: Complete Documentation Index

Complete prevention strategies for PostgreSQL security issues in the Sparlo v2 codebase.

---

## Overview

This documentation suite prevents and addresses two critical PostgreSQL security issues:

1. **BIGINT to INTEGER Overflow** - Silent type casting causing data corruption
2. **RLS Blocking SECURITY INVOKER Functions** - Functions failing silently due to RLS policies

---

## Documentation Map

### For Quick Answers (5-10 minutes)
- **Start here**: `QUICK_REFERENCE_GUIDE.md`
  - Decision trees for security context
  - Common pattern library
  - Golden rules and best practices
  - Common mistakes with fixes

### For Comprehensive Understanding (30-60 minutes)
- **Complete guide**: `PREVENTION_STRATEGIES.md`
  - Detailed analysis of both issues
  - Prevention strategies for each
  - Code review checklist
  - Test cases with SQL examples
  - Real-world examples from codebase
  - When to use SECURITY DEFINER vs INVOKER

### For Code Review (During PR review)
- **Use this**: `CODE_REVIEW_CHECKLIST.md`
  - 8-section systematic review guide
  - Red flags for automatic rejection
  - Specific code review comments to copy/paste
  - Approval criteria

### For Testing
- **Run these tests**: `TEST_CASES_PREVENTION.sql`
  - pgTAP framework tests
  - 6 test suites covering all issues
  - Type safety validation
  - Authorization enforcement
  - RLS policy verification

### Summary Reference
- **Quick overview**: `PREVENTION_SUMMARY.txt`
  - Issue descriptions
  - Prevention strategies
  - Key principles
  - Decision trees
  - Red flags
  - Getting started guide

---

## Issue 1: BIGINT to INTEGER Overflow

### The Problem
PostgreSQL silently casts BIGINT to INTEGER, causing data loss for large numbers (>2.147 billion).

Example from codebase:
```sql
-- WRONG: Returns INTEGER instead of BIGINT
RETURNS TABLE (
  tokens_used INTEGER,      -- Should be BIGINT!
  tokens_limit INTEGER      -- Should be BIGINT!
)
```

The issue: usage_periods table has `tokens_limit BIGINT NOT NULL DEFAULT 3000000` but function returned INTEGER, causing overflow for values >2.1B.

### Prevention: Type Safety Checklist

**Use CODE_REVIEW_CHECKLIST.md, Section 1:**
- [ ] Return types match source column types EXACTLY
- [ ] No INTEGER for BIGINT columns
- [ ] COALESCE statements type-safe
- [ ] Test with large values (>2.147B)

**Use QUICK_REFERENCE_GUIDE.md, Type Safety Checklist:**
```sql
-- 1. Check return types match source columns
\df+ my_function

-- 2. Test with large values
SELECT my_function(account_id)
WHERE tokens_used > 2147483647

-- 3. Verify no INTEGER return types for large numbers
SELECT routine_columns.data_type
FROM information_schema.routine_columns
WHERE routine_name = 'my_function'
```

### Best Practices

From PREVENTION_STRATEGIES.md:
- Use BIGINT for all token/usage counters
- Explicit type casting: `COALESCE(col, 0::bigint)::bigint`
- Test with 9+ billion values
- Verify function signature: `\df+ function_name`

### Test Case

From TEST_CASES_PREVENTION.sql:
```sql
-- Test BIGINT Overflow Detection
SELECT plan(4);

-- Create account with large token limit
INSERT INTO usage_periods (account_id, tokens_limit, tokens_used)
VALUES ('550e8400-e29b-41d4-a716-446655440000'::uuid,
        9000000000::bigint,  -- 9 billion tokens
        8500000000::bigint);

-- Function should return full BIGINT without overflow
SELECT results_match(
  $$SELECT tokens_limit FROM admin_search_users_by_email('test@example.com')$$,
  $$SELECT 9000000000::bigint$$,
  'Function should return full BIGINT value'
);
```

---

## Issue 2: RLS Blocking SECURITY INVOKER Functions

### The Problem
SECURITY INVOKER functions inherit the caller's RLS context, preventing access to data they need to see. Results in silent failure (empty results, no error).

Example from codebase:
```sql
-- BROKEN: SECURITY INVOKER with RLS
CREATE FUNCTION get_team_member_usage(...)
RETURNS TABLE (...)
LANGUAGE sql
SECURITY INVOKER  -- Inherits caller's RLS context
AS $$
  SELECT ... FROM sparlo_reports r
  WHERE r.account_id = p_account_id
    AND r.created_by = u.id  -- Can't see other users' reports!
$$;
```

The issue: Team owner calls function, but RLS only shows their own reports (created_by = auth.uid()), blocking access to team members' reports.

### Prevention: Authorization and RLS

**Use QUICK_REFERENCE_GUIDE.md, Decision Tree:**
```
Does function access data outside caller's view?
├─ YES → SECURITY DEFINER + authorization check
└─ NO → SECURITY INVOKER + verify RLS
```

**For SECURITY DEFINER:**
1. Authorization check FIRST
2. Add `SET search_path = ''`
3. Grant to specific roles
4. Document why DEFINER needed

**For SECURITY INVOKER:**
1. Verify RLS on all accessed tables
2. Verify policies cover all operations
3. Test with different user roles
4. Add application-level checks

### Best Practices

From PREVENTION_STRATEGIES.md:
- Authorization comes BEFORE any data access
- Use explicit: `IF NOT EXISTS (SELECT 1 FROM accounts_memberships WHERE ...)`
- Always: `SET search_path = ''` in SECURITY DEFINER
- Document in COMMENT ON why DEFINER needed

### Fixed Pattern

From codebase (SECURITY_FIX_get_team_member_usage.sql):
```sql
CREATE FUNCTION get_team_member_usage(...)
RETURNS TABLE (
  user_id uuid,
  reports_count bigint,
  ...
)
LANGUAGE plpgsql
SECURITY DEFINER           -- Elevated privileges
SET search_path = ''       -- Prevent SQL injection
AS $$
BEGIN
  -- CRITICAL: Authorization check FIRST
  if not exists (
    select 1 from public.accounts_memberships am
    where am.account_id = p_account_id
      and am.user_id = auth.uid()
  ) then
    raise exception 'Access denied: Not a member'
      using errcode = 'insufficient_privilege';
  end if;

  -- Now safe to query team data
  return query
  select ... from sparlo_reports r
  where r.account_id = p_account_id;
end;
$$;
```

### Test Case

From TEST_CASES_PREVENTION.sql:
```sql
-- Test SECURITY INVOKER RLS Enforcement
SELECT plan(4);

-- Create two users
SELECT tests.create_supabase_user('user1', 'user1@test.com');
SELECT tests.create_supabase_user('user2', 'user2@test.com');

-- User1 creates team, User2 tries to access (should fail)
SELECT tests.authenticate_as_user('user2');
SELECT is_empty(
  'SELECT * FROM get_team_member_usage(...)',
  'User2 should not see data (not a member)'
);

-- User2 added to team, tries again (should succeed)
SELECT tests.authenticate_as_user('user1');
INSERT INTO accounts_memberships (account_id, user_id, account_role)
VALUES (...);

SELECT tests.authenticate_as_user('user2');
SELECT isnt_empty(
  'SELECT * FROM get_team_member_usage(...)',
  'User2 should see data after joining team'
);
```

---

## Decision Framework

### When to Use SECURITY DEFINER

Use SECURITY DEFINER when:
- Function needs to access data outside caller's view
- Function needs elevated privileges
- Function implements business logic authorization
- Team/cross-user data needs to be aggregated

Required elements:
- Explicit authorization check (FIRST statement)
- `SET search_path = ''` (prevent SQL injection)
- COMMENT ON explaining why
- Specific GRANT (not to `public`)

See: PREVENTION_STRATEGIES.md > "When to Use SECURITY DEFINER"

### When to Use SECURITY INVOKER

Use SECURITY INVOKER when:
- RLS policies already protect the access
- Caller's permissions should apply
- Function doesn't need elevated privileges
- Query is straightforward filtering

Required elements:
- RLS enabled on ALL accessed tables
- RLS policies complete (SELECT, INSERT, UPDATE, DELETE)
- Tests verifying RLS works with different roles
- COMMENT ON explaining RLS dependency

See: PREVENTION_STRATEGIES.md > "When to Use SECURITY INVOKER"

### The RLS+DEFINER Trap

Most common mistake:
```sql
-- DANGEROUS: DEFINER without auth check
CREATE FUNCTION get_secret_data(p_account_id uuid)
RETURNS ... SECURITY DEFINER
AS $$
  SELECT * FROM secret_table WHERE account_id = p_account_id;
$$;
-- RLS doesn't apply because function runs as owner!
-- Any authenticated user can call this!
```

Solution: Add explicit authorization check inside function.

See: QUICK_REFERENCE_GUIDE.md > "Mistake 3: Relying on RLS with SECURITY DEFINER"

---

## Code Review Process

### Step 1: Use the Checklist

Open `CODE_REVIEW_CHECKLIST.md` and go through sections:
1. Type Safety Review
2. Security Context Review
3. Grant and Access Control
4. SQL Injection Prevention
5. Business Logic Review
6. Performance Review
7. Testing Coverage
8. Documentation Review

### Step 2: Check for Red Flags

From CODE_REVIEW_CHECKLIST.md > "Red Flags: Automatic Rejection":
- SECURITY DEFINER without authorization check → REJECT
- SECURITY INVOKER without verified RLS → REJECT
- INTEGER return type for BIGINT columns → REJECT
- No SET search_path in SECURITY DEFINER → REJECT
- Grant to `public` or `anon` → REJECT

### Step 3: Run Tests

```bash
# Run the test suite
psql -f TEST_CASES_PREVENTION.sql

# Or specific test
psql << EOF
SELECT plan(4);
-- Test content
SELECT * FROM finish();
EOF
```

### Step 4: Leave Specific Comments

Copy/paste from CODE_REVIEW_CHECKLIST.md > "Comments to Leave":

Example for type issues:
```
Function returns INTEGER but source column is BIGINT.
This will cause silent overflow for values >2.1B.
Change line X from INTEGER to BIGINT.
```

Example for missing authorization:
```
SECURITY DEFINER function without authorization check.
Add this as first statement:
  IF NOT EXISTS (SELECT 1 FROM accounts_memberships WHERE account_id = ? AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied' USING errcode = 'insufficient_privilege';
  END IF;
```

### Step 5: Verify Approval Criteria

From CODE_REVIEW_CHECKLIST.md > "Approval Criteria":
- [ ] All type safety issues resolved
- [ ] All security issues resolved
- [ ] All documentation present
- [ ] Tests verify authorization works
- [ ] No red flags remaining

---

## Implementation Guide

### For Creating New Functions

**Phase 1: Design** (CODE_REVIEW_CHECKLIST.md)
- [ ] Determine security context (DEFINER or INVOKER?)
- [ ] Plan authorization checks (if DEFINER)
- [ ] Define precise return types
- [ ] Document security decisions

**Phase 2: Implementation** (QUICK_REFERENCE_GUIDE.md)
- [ ] Write authorization check FIRST
- [ ] Add SET search_path = '' (if DEFINER)
- [ ] Verify return types match schema
- [ ] Add COMMENT ON with security explanation
- [ ] Grant appropriately

**Phase 3: Testing** (TEST_CASES_PREVENTION.sql)
- [ ] Unit tests: authorization and data access
- [ ] Integration tests: multiple user roles
- [ ] Edge cases: NULL, empty results
- [ ] Type tests: large values, precision
- [ ] Security tests: unauthorized access

**Phase 4: Code Review**
- [ ] Use CODE_REVIEW_CHECKLIST.md
- [ ] Run TEST_CASES_PREVENTION.sql
- [ ] Verify type safety with `\df+ function_name`
- [ ] Check RLS policies (if INVOKER)

---

## Reference Materials

### PostgreSQL Documentation
- [CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [Security Definer Functions](https://www.postgresql.org/docs/current/sql-createrole.html#SQL-CREATEROLE-SECURITY)

### Supabase Documentation
- [RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Functions Guide](https://supabase.com/docs/guides/database/functions)

### Related Files in Codebase

**Security Fixes (Reference Implementations):**
- `/Users/alijangbar/Desktop/sparlo-v2/SECURITY_FIX_get_team_member_usage.sql` - Correct SECURITY DEFINER + auth pattern
- `/Users/alijangbar/Desktop/sparlo-v2/SECURITY_FIX_team-usage.loader.ts` - Application-level defense-in-depth

**Migrations with Fixes:**
- `apps/web/supabase/migrations/20260108135731_fix_admin_search_return_types.sql` - BIGINT type fix
- `apps/web/supabase/migrations/20260107082025_create_admin_usage_rpcs.sql` - SECURITY DEFINER + auth pattern
- `apps/web/supabase/migrations/20260107200826_fix-sparlo-reports-rls-team-access.sql` - RLS policy fix

**Schema Definitions:**
- `apps/web/supabase/schemas/17-usage-periods.sql` - BIGINT usage for tokens_used, tokens_limit

---

## Common Patterns

### Pattern 1: Read-Only Team Data Access

```sql
CREATE FUNCTION get_team_stats(p_account_id uuid)
RETURNS TABLE (user_count INTEGER, report_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.accounts_memberships
                 WHERE account_id = p_account_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not a member' USING errcode = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(DISTINCT created_by)::INTEGER,
    COUNT(*)::BIGINT
  FROM public.sparlo_reports
  WHERE account_id = p_account_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_team_stats(uuid) TO authenticated;
```

See: QUICK_REFERENCE_GUIDE.md > "Pattern Library"

### Pattern 2: RLS with SECURITY INVOKER

```sql
CREATE FUNCTION get_my_reports(p_account_id uuid)
RETURNS SETOF public.sparlo_reports
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT * FROM public.sparlo_reports
  WHERE account_id = p_account_id
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_my_reports(uuid) TO authenticated;
```

See: QUICK_REFERENCE_GUIDE.md > "Authorization Pattern Reference"

---

## Quick Troubleshooting

### Function returns empty results

Check:
1. Is it SECURITY INVOKER? → Verify RLS policies
2. Is it SECURITY DEFINER? → Verify authorization check
3. Test with different user roles
4. Check application logs for RPC errors

See: PREVENTION_STRATEGIES.md > "Detecting Silent RLS Failures"

### Type mismatch errors

Check:
1. Verify return type with `\df+ function_name`
2. Compare return types to source columns
3. Check all COALESCE statements
4. Test with actual table data

See: QUICK_REFERENCE_GUIDE.md > "Type Safety Checklist"

### Authorization not working

Check:
1. Is authorization check FIRST in function?
2. Does it use `auth.uid()`?
3. Does it query accounts_memberships?
4. Is error message clear?

See: QUICK_REFERENCE_GUIDE.md > "Authorization Check Template"

---

## Summary

This documentation provides:

1. **Understanding**: Why these issues happen and how to avoid them
2. **Prevention**: Checklists and best practices for new functions
3. **Review**: Systematic code review process with red flags
4. **Testing**: Test cases covering all issue types
5. **Patterns**: Ready-to-use code patterns for common scenarios
6. **Reference**: Quick lookup guides and decision trees

**Next Steps:**

- New to PostgreSQL security? Start with QUICK_REFERENCE_GUIDE.md
- Reviewing a PR? Use CODE_REVIEW_CHECKLIST.md
- Creating a new function? Follow patterns in QUICK_REFERENCE_GUIDE.md
- Need detailed explanation? See PREVENTION_STRATEGIES.md

---

**Documentation Version**: 1.0
**Last Updated**: January 8, 2026
**Status**: Production Ready
**Created for**: Sparlo v2 Codebase
**Applies to**: All PostgreSQL functions in supabase/migrations and supabase/schemas
