# PostgreSQL Function Code Review Checklist

Use this checklist when reviewing PostgreSQL function PRs and migrations.

---

## Pre-Review: Function Identification

- [ ] Identify function name and purpose
- [ ] Locate function file: `/apps/web/supabase/migrations/` or `/schemas/`
- [ ] Check if function is new or modified
- [ ] Note the LANGUAGE (SQL, plpgsql, etc.)
- [ ] Identify if SECURITY DEFINER or INVOKER

---

## Section 1: Type Safety Review

### Return Type Verification

- [ ] **Find source table columns**
  - Query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'table_name'`
  - Identify columns returned by function

- [ ] **Verify function return types match exactly**
  - Check: `\df+ function_name` (in psql)
  - Compare return type to source column data_type
  - No INTEGER for columns defined as BIGINT
  - No TEXT for columns defined as UUID
  - No NUMERIC mismatch in precision

- [ ] **Check for silent type conversions**
  - Find: `::integer`, `::int` casts on BIGINT columns
  - Find: `::text` casts on UUID columns
  - Verify each cast is intentional and documented

- [ ] **BIGINT Safety for Large Numbers**
  ```
  Token/usage tracking columns:
  - tokens_used: Must be BIGINT (can exceed 2.1B)
  - tokens_limit: Must be BIGINT (can exceed 2.1B)
  - reports_count: Can be INTEGER or BIGINT
  - counters: BIGINT if cumulative across time
  ```
  - [ ] No INTEGER return types for token counts
  - [ ] No INTEGER return types for usage metrics
  - [ ] No INTEGER return types for cumulative counters

- [ ] **COALESCE Type Consistency**
  - Find all: `COALESCE(column, default_value)`
  - Verify: default_value type matches column type
  - Check: `COALESCE(bigint_col, 0)` should be `COALESCE(bigint_col, 0::bigint)`
  - Verify: explicit casting when mixing types

- [ ] **Aggregate Function Types**
  - `COUNT(*)` returns BIGINT (in PG 10+)
  - `SUM(bigint_col)` returns NUMERIC or BIGINT
  - `AVG(bigint_col)` returns NUMERIC
  - All aggregates explicitly cast to expected type
  - All aggregates with COALESCE have type-safe defaults

### Edge Case Testing

- [ ] Function tested with large values (>2.147 billion)
- [ ] Function tested with NULL values
- [ ] Function tested with 0/empty results
- [ ] Function tested with special characters (if applicable)

---

## Section 2: Security Context Review

### SECURITY DEFINER vs INVOKER Decision

**If SECURITY DEFINER:**

- [ ] **Explicit justification in PR comment**
  - Why elevated privileges needed
  - What data it accesses beyond caller's view
  - Why RLS policies insufficient

- [ ] **Authorization checks present and complete**
  - [ ] Authorization check is FIRST statement in function
  - [ ] No data access before auth check
  - [ ] Authorization uses `auth.uid()` to get current user
  - [ ] Authorization check queries accounts_memberships or similar
  - [ ] Check uses appropriate WHERE conditions (account_id AND user_id)
  - [ ] Error message informative: "Access denied: ...", not generic
  - [ ] Error uses `USING errcode = 'insufficient_privilege'`

- [ ] **search_path restriction present**
  - [ ] `SET search_path = ''` (empty, prevents injection)
  - [ ] Or `SET search_path = public` (with justification)
  - [ ] Not: `SET search_path = ...` (with custom schemas - security risk)

- [ ] **Grant statement is specific**
  - [ ] `GRANT EXECUTE ON FUNCTION ... TO authenticated;` (for RPC functions)
  - [ ] `GRANT EXECUTE ON FUNCTION ... TO service_role;` (for server functions)
  - [ ] Not: `GRANT EXECUTE ... TO public;`
  - [ ] Not: `GRANT ALL;`

- [ ] **Security comment exists**
  - [ ] Function has COMMENT ON explaining security context
  - [ ] Comment explains: "SECURITY DEFINER - Verify caller is ..."
  - [ ] Comment explains: "Authorization: checks ..."
  - [ ] Comment explains what data is exposed and why it's safe

**If SECURITY INVOKER:**

- [ ] **RLS policies verified on all accessed tables**
  - For each table accessed: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'table_name'`
  - Verify: rowsecurity = true
  - Verify: policies exist for SELECT, INSERT, UPDATE, DELETE as needed

- [ ] **Explicit verification of RLS coverage**
  - Query: `SELECT policyname FROM pg_policies WHERE tablename = 'table_name'`
  - For each operation (SELECT, INSERT, UPDATE, DELETE): policy exists
  - Check: Policies use `auth.uid()` or `has_role_on_account()`

- [ ] **No implicit data leakage**
  - Find: Views accessed - verify they have RLS
  - Find: CTEs - verify they don't bypass RLS
  - Find: Subqueries - verify they respect RLS
  - Check: Function doesn't use SECURITY DEFINER privileges

- [ ] **Comment documents RLS dependency**
  - [ ] Comment: "SECURITY INVOKER - RLS policies apply"
  - [ ] Comment: "Requires RLS on tables: ..."
  - [ ] Comment: "Policies must verify: ..."

---

## Section 3: Grant and Access Control

- [ ] **Grant statement exists**
  - [ ] After function definition, before comment
  - [ ] Specific role granted (not `public`)

- [ ] **Grant scope is appropriate**
  - Public RPC functions: `GRANT ... TO authenticated`
  - Admin functions: `GRANT ... TO service_role`
  - Internal functions: `GRANT ... TO postgres` (not public)

- [ ] **No overpermissioned grants**
  - [ ] Not granting to anonymous role (anon)
  - [ ] Not using `GRANT ALL PRIVILEGES`
  - [ ] Not using `WITH ADMIN OPTION`

- [ ] **COMMENT ON statement exists**
  - [ ] After GRANT statement
  - [ ] Explains purpose of function
  - [ ] Explains security context (DEFINER/INVOKER)
  - [ ] Explains authorization requirements
  - [ ] Explains what data is returned and why safe

---

## Section 4: SQL Injection Prevention

For SECURITY DEFINER functions:

- [ ] **No dynamic SQL without sanitization**
  - Find: `EXECUTE`, `FORMAT()` with string interpolation
  - Verify: All dynamic portions are properly quoted or cast
  - Check: No user input in SQL directly

- [ ] **search_path prevents name collisions**
  - [ ] `SET search_path = ''` present (for maximum safety)
  - [ ] Or: Explicit schema qualification in all queries: `public.table_name`

- [ ] **No string concatenation for SQL**
  - Find: `||` operators building SQL
  - Verify: Never concatenating user input
  - Change to: Use parameters instead

**Example - Wrong:**
```sql
-- DANGEROUS
CREATE FUNCTION bad_function(p_column text, p_value text)
RETURNS ... SECURITY DEFINER AS $$
BEGIN
  EXECUTE 'UPDATE my_table SET ' || p_column || ' = ' || quote_literal(p_value);
END;
$$;
```

**Example - Correct:**
```sql
-- SAFE
CREATE FUNCTION good_function(p_value text)
RETURNS ... SECURITY DEFINER AS $$
BEGIN
  UPDATE my_table SET my_column = p_value
  WHERE id = auth.uid();
END;
$$;
```

---

## Section 5: Business Logic Review

- [ ] **Parameter validation**
  - [ ] Non-null parameters validated
  - [ ] UUID parameters validated as valid UUIDs
  - [ ] String parameters length-checked if needed
  - [ ] Numeric parameters range-checked if needed

- [ ] **Error handling**
  - [ ] RAISE EXCEPTION for error conditions
  - [ ] Error messages specific and informative
  - [ ] Error codes appropriate ('insufficient_privilege', 'invalid_text_representation', etc.)

- [ ] **Data integrity**
  - [ ] No orphaned foreign keys possible
  - [ ] No duplicate key violations possible
  - [ ] Constraints enforced (CHECK, UNIQUE, PRIMARY KEY)
  - [ ] Audit trail maintained (created_at, updated_at)

- [ ] **Race conditions handled**
  - [ ] For concurrent writes: row locking (FOR UPDATE)
  - [ ] For creation: ON CONFLICT handling
  - [ ] For deletion: soft deletes if needed

---

## Section 6: Performance Review

- [ ] **Queries are efficient**
  - [ ] All WHERE conditions indexed
  - [ ] No full table scans unnecessary
  - [ ] JOIN conditions use indexed columns
  - [ ] Aggregates are necessary

- [ ] **Authorization checks are fast**
  - [ ] `EXISTS (SELECT 1 ...)` not `COUNT(*)`
  - [ ] LIMIT 1 on existence checks
  - [ ] Indexes on accounts_memberships for auth queries

- [ ] **No N+1 patterns**
  - [ ] Not calling function in loop in application
  - [ ] Function returns all needed data at once

---

## Section 7: Testing Coverage

- [ ] **Authorization tests exist**
  - [ ] Test authorized user can call
  - [ ] Test unauthorized user cannot call
  - [ ] Test different roles (owner, member, admin) if applicable

- [ ] **RLS enforcement tests (INVOKER functions)**
  - [ ] Test user cannot access other user's data
  - [ ] Test user can access own account's data
  - [ ] Test team member can access team data

- [ ] **Type safety tests**
  - [ ] Test with large numbers (>2.147B)
  - [ ] Test with NULL values
  - [ ] Test with empty results

- [ ] **Edge case tests**
  - [ ] Test with special characters
  - [ ] Test with very long strings
  - [ ] Test with unicode characters

- [ ] **Integration tests (if applicable)**
  - [ ] Function works end-to-end from application
  - [ ] Return types match application schema expectations
  - [ ] Error handling works as expected

---

## Section 8: Documentation Review

- [ ] **Code comments present**
  - [ ] Authorization logic explained
  - [ ] Non-obvious business logic commented
  - [ ] Type conversions commented

- [ ] **COMMENT ON statement**
  - [ ] Purpose of function
  - [ ] Security context explained
  - [ ] Authorization requirements clear
  - [ ] Return type documentation
  - [ ] Any important caveats or gotchas

- [ ] **PR description explains**
  - [ ] Why function was created/modified
  - [ ] What security considerations were made
  - [ ] What testing was performed
  - [ ] Any related issues (link to issue)

---

## Red Flags: Automatic Rejection

Reject PR if any of these are true:

### Critical Security Issues

- [ ] SECURITY DEFINER without authorization check
- [ ] SECURITY DEFINER accessing user data without `auth.uid()` validation
- [ ] No SET search_path in SECURITY DEFINER
- [ ] Grant EXECUTE to `public` or `anon` (unless intentionally public API)
- [ ] Dynamic SQL with user input (string concatenation)
- [ ] SECURITY INVOKER without verified RLS policies

### Critical Type Issues

- [ ] INTEGER return type for columns defined as BIGINT in schema
- [ ] No explicit type cast in COALESCE with mixed types
- [ ] Implicit type conversions on numeric columns

### Critical Design Issues

- [ ] No authorization check for sensitive data access
- [ ] Function returns more data than caller should see
- [ ] Breaks existing RLS policies
- [ ] Silent failure possibility (empty result when error should occur)

### Missing Documentation

- [ ] No COMMENT ON statement
- [ ] No explanation of security choices
- [ ] No test cases for authorization

---

## Review Checklist Steps

### Before Review

1. [ ] Clone PR and examine files
2. [ ] Identify all functions being created/modified
3. [ ] Check if functions are tested
4. [ ] Review related migrations

### During Review

1. [ ] Go through Section 1-8 systematically
2. [ ] Mark questions with specific file:line references
3. [ ] Test locally if possible
4. [ ] Verify function signature: `\df+ function_name`

### Comments to Leave

**For Type Issues:**
```
Function returns INTEGER but source column is BIGINT.
This will cause silent overflow for values >2.1B.
Change line X from INTEGER to BIGINT.
```

**For Missing Authorization:**
```
SECURITY DEFINER function without authorization check.
Any authenticated user can call this and access other accounts' data.
Add authorization check as first statement:
  IF NOT EXISTS (SELECT 1 FROM accounts_memberships WHERE ...) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
```

**For RLS Questions:**
```
SECURITY INVOKER function. Verify RLS is properly enforced.
Can you confirm:
1. RLS is enabled on sparlo_reports table
2. SELECT policy allows only account members
3. Current tests verify non-members get empty results
```

**For search_path:**
```
SECURITY DEFINER function without search_path restriction.
Add SET search_path = '' to prevent SQL injection via schema manipulation.
```

---

## Approval Criteria

Approve PR when:

- [ ] All type safety issues resolved
- [ ] All security issues resolved
- [ ] All documentation present
- [ ] Tests verify authorization works
- [ ] Checklist items completed (as applicable)
- [ ] No red flags remaining

---

## Quick Reference: What to Look For

```
SECURITY DEFINER function? → Need:
  ✓ Authorization check (first!)
  ✓ SET search_path = ''
  ✓ GRANT to specific role
  ✓ COMMENT ON explaining why DEFINER

SECURITY INVOKER function? → Need:
  ✓ Verify RLS exists on tables
  ✓ Verify RLS policies are complete
  ✓ GRANT to authenticated or specific role
  ✓ COMMENT ON explaining RLS dependency

Returning large numbers? → Need:
  ✓ BIGINT return type (not INTEGER)
  ✓ Type-safe COALESCE
  ✓ Test with values >2.1B

Any function? → Need:
  ✓ Clear purpose
  ✓ Proper error handling
  ✓ Authorization or RLS enforcement
  ✓ Tests verifying access control
```

---

**Last Updated**: January 8, 2026
**Version**: 1.0
