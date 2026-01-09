# PostgreSQL Function Security: Prevention Strategies

This document provides comprehensive prevention strategies for two critical issues that were fixed in the codebase:

1. **BIGINT to INTEGER overflow in PostgreSQL RPC functions**
2. **RLS blocking SECURITY INVOKER functions**

These issues caused silent failures in production and demonstrate why security context and type safety are critical in database functions.

---

## Issue 1: BIGINT to INTEGER Overflow

### The Problem

The `admin_search_users_by_email()` function attempted to return usage statistics with incorrect return types:

```sql
-- BROKEN: Returns INTEGER instead of BIGINT
RETURNS TABLE (
  ...
  tokens_used INTEGER,      -- Should be BIGINT
  tokens_limit INTEGER      -- Should be BIGINT
  ...
)
```

But the source table uses BIGINT:

```sql
CREATE TABLE usage_periods (
  tokens_limit BIGINT NOT NULL DEFAULT 3000000,
  tokens_used BIGINT NOT NULL DEFAULT 0,
  ...
)
```

### Why This Matters

PostgreSQL silently casts BIGINT → INTEGER without warning, causing overflow:
- INTEGER max: 2,147,483,647 (2.1 billion)
- BIGINT max: 9,223,372,036,854,775,807 (9.2 quintillion)
- 3 million tokens fits in INTEGER, but truncation is still possible

**The Real Danger**: No error is raised. The cast happens silently, and clients receive incorrect values.

### Fix Applied

```sql
-- CORRECT: Match actual column types
RETURNS TABLE (
  ...
  tokens_used BIGINT,       -- Matches usage_periods.tokens_used
  tokens_limit BIGINT       -- Matches usage_periods.tokens_limit
  ...
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ...
    COALESCE(up.tokens_used, 0)::bigint as tokens_used,
    COALESCE(up.tokens_limit, 0)::bigint as tokens_limit,
    ...
  FROM ...;
END;
$$;
```

---

## Issue 2: RLS Blocking SECURITY INVOKER Functions

### The Problem

The `get_team_member_usage()` function needed to access data across team members but was blocked by RLS:

**Broken Approach 1: SECURITY INVOKER with RLS**

```sql
-- BROKEN: SECURITY INVOKER with inherited RLS policies
CREATE FUNCTION get_team_member_usage(p_account_id uuid, ...)
RETURNS TABLE (...)
LANGUAGE sql
SECURITY INVOKER  -- Inherits caller's permissions
AS $$
  SELECT ... FROM sparlo_reports r
  WHERE r.account_id = p_account_id
    AND r.created_by = u.id  -- Can't see other users' reports!
$$;
```

Problem: With SECURITY INVOKER, RLS policies apply to the caller's context:
- User can only see their own reports
- Cannot see team members' reports
- Function fails silently or returns empty results

**Broken Approach 2: SECURITY DEFINER without authorization**

```sql
-- BROKEN: SECURITY DEFINER without access control
CREATE FUNCTION get_team_member_usage(p_account_id uuid, ...)
RETURNS TABLE (...)
LANGUAGE sql
SECURITY DEFINER  -- Runs as schema owner
AS $$
  SELECT ... FROM sparlo_reports r
  WHERE r.account_id = p_account_id;  -- Any authenticated user gets access!
$$;
```

Problem: No authorization check means any authenticated user can call this function and see ALL teams' data.

### Fix Applied

```sql
-- CORRECT: SECURITY DEFINER with explicit authorization
CREATE FUNCTION get_team_member_usage(
  p_account_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz
)
RETURNS TABLE (
  user_id uuid,
  user_name text,
  user_email text,
  reports_count bigint,
  is_current_member boolean
)
LANGUAGE plpgsql
SECURITY DEFINER           -- Bypass RLS for data access
SET search_path = ''       -- Prevent SQL injection
AS $$
BEGIN
  -- CRITICAL: Verify caller is a member of the account
  if not exists (
    select 1
    from public.accounts_memberships am
    where am.account_id = p_account_id
      and am.user_id = auth.uid()
  ) then
    raise exception 'Access denied: You are not a member of this account'
      using errcode = 'insufficient_privilege';
  end if;

  -- Now safe to query across the team's data
  return query
  select
    u.id as user_id,
    coalesce(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(u.email, '@', 1)
    ) as user_name,
    u.email as user_email,
    count(r.id) as reports_count,
    exists(
      select 1 from public.accounts_memberships am2
      where am2.account_id = p_account_id
      and am2.user_id = u.id
    ) as is_current_member
  from auth.users u
  inner join public.sparlo_reports r on r.created_by = u.id
    and r.account_id = p_account_id
    and r.status = 'complete'
    and r.created_at >= p_period_start
    and r.created_at <= p_period_end
  group by u.id, u.email, u.raw_user_meta_data
  order by count(r.id) desc;
end;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_member_usage(uuid, timestamptz, timestamptz)
  TO authenticated;
```

### Defense-in-Depth at Application Layer

Even with correct database functions, add verification in the application:

```typescript
// SECURITY_FIX_team-usage.loader.ts
async function teamUsageLoader(accountId: string): Promise<TeamUsageResult> {
  const client = getSupabaseServerClient();

  try {
    // Defense-in-depth: Verify membership BEFORE calling RPC
    const { data: membership, error: membershipError } = await client
      .from('accounts_memberships')
      .select('account_id')
      .eq('account_id', accountId)
      .eq('user_id', (await client.auth.getUser()).data.user?.id ?? '')
      .single();

    if (membershipError || !membership) {
      console.error('Unauthorized access attempt to account:', accountId);
      return {
        data: null,
        error: 'You do not have permission to access this account'
      };
    }

    // Now call RPC with confidence
    const { data: memberData, error: memberError } = await client.rpc(
      'get_team_member_usage',
      {
        p_account_id: accountId,
        p_period_start: periodStart.toISOString(),
        p_period_end: periodEnd.toISOString(),
      },
    );

    if (memberError) {
      console.error('Member usage query failed:', memberError);
      // Non-fatal - continue without member breakdown
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error loading team usage:', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
}
```

---

## Code Review Checklist

Use this checklist when reviewing PostgreSQL functions:

### Type Safety Checks

- [ ] **Return types match source columns**: Verify all return types in RETURNS TABLE match actual column types in source tables
  - [ ] Check for BIGINT columns being returned as INTEGER
  - [ ] Verify NUMERIC precision matches between table and function
  - [ ] Confirm UUID types are not accidentally cast to TEXT
  - [ ] Ensure array/aggregate types are correctly declared

- [ ] **Explicit type casting**: All implicit casts should be explicit and intentional
  - [ ] COALESCE defaults have matching types
  - [ ] Aggregates return correct types (COUNT returns INTEGER, not BIGINT)
  - [ ] String/JSONB extractions are properly typed

- [ ] **No silent overflow potential**: Large numbers are stored in appropriate types
  - [ ] Token counts use BIGINT
  - [ ] Usage metrics use BIGINT for cumulative values
  - [ ] Rate limits use BIGINT if values can grow large

### Security Context Checks (CRITICAL)

- [ ] **Authorization before execution**:
  - [ ] SECURITY DEFINER functions explicitly verify caller permissions
  - [ ] Authorization checks happen FIRST, before any data access
  - [ ] Auth checks use `auth.uid()` and verify membership/permissions
  - [ ] No data is exposed before authorization passes

- [ ] **Proper use of SECURITY DEFINER vs INVOKER**:
  - [ ] SECURITY DEFINER: Used when function needs elevated privileges to access data
  - [ ] SECURITY INVOKER: Used when RLS policies should apply to caller's context
  - [ ] Team data functions: Always SECURITY DEFINER + authorization check
  - [ ] User-specific data: Consider SECURITY INVOKER when safe

- [ ] **SET search_path = ''**:
  - [ ] All SECURITY DEFINER functions include this to prevent SQL injection
  - [ ] Empty search_path forces explicit schema qualification in subqueries
  - [ ] Related example: `SET search_path = public` only if necessary

- [ ] **RLS policy verification**:
  - [ ] For SECURITY INVOKER: Verify RLS policies exist on all accessed tables
  - [ ] For SECURITY DEFINER: Verify that inherited RLS policies aren't being relied upon
  - [ ] Test that function doesn't accidentally expose data due to RLS bypass

### Grant and Access Control

- [ ] **Grants are specific**:
  - [ ] Functions granted to `authenticated`, `service_role`, or specific roles only
  - [ ] Never grant to `anon` unless intentionally public
  - [ ] Grant permissions in separate GRANT statements after function creation

- [ ] **Comments explain authorization**:
  - [ ] Function has security comment explaining who can access it and why
  - [ ] Authorization requirements are documented in code comments

### Practical Checks

- [ ] **Test with actual data types**: Functions tested with realistic data:
  - [ ] Large numbers to catch overflow issues
  - [ ] NULL values to test COALESCE branches
  - [ ] Special characters to catch injection risks

- [ ] **Error messages are informative**:
  - [ ] RAISE EXCEPTION messages explain what failed
  - [ ] Use appropriate errcode for errors (e.g., 'insufficient_privilege')
  - [ ] Don't expose sensitive information in error messages

---

## PostgreSQL Function Security Guidelines

### When to Use SECURITY DEFINER

Use SECURITY DEFINER when:

1. **Elevated Privileges Needed**: Function needs to access data beyond what caller can normally see
   ```sql
   -- Get aggregated team usage (caller shouldn't see all team members' data directly)
   CREATE FUNCTION get_team_member_usage(...) ... SECURITY DEFINER ...
   ```

2. **Enforcing Custom Authorization**: Function implements business logic authorization
   ```sql
   -- Allow action only if certain conditions are met
   CREATE FUNCTION admin_adjust_usage_limit(p_account_id uuid, p_tokens integer, p_admin_user_id uuid)
   ... SECURITY DEFINER ... (with admin check inside)
   ```

3. **Protecting System Functions**: Internal system functions that shouldn't be called directly
   ```sql
   CREATE FUNCTION _internal_system_update(...) ... SECURITY DEFINER ...
   ```

**Must Always Include**:
- Authorization checks at the start of function
- `SET search_path = ''` to prevent SQL injection
- Detailed comments explaining why DEFINER is needed
- Explicit GRANT statements to specific roles

### When to Use SECURITY INVOKER

Use SECURITY INVOKER when:

1. **RLS Policies Are Sufficient**: Table already has complete RLS policies
   ```sql
   -- Users can only see their own notes via RLS
   CREATE FUNCTION get_my_notes(p_account_id uuid)
   RETURNS SETOF notes
   LANGUAGE plpgsql
   SECURITY INVOKER  -- RLS will filter results
   ...
   ```

2. **Caller's Permissions Should Apply**: Function behavior changes based on caller
   ```sql
   -- Function returns different results for different roles
   CREATE FUNCTION list_visible_items(p_category text)
   RETURNS SETOF items
   LANGUAGE plpgsql
   SECURITY INVOKER  -- RLS applies to auth context
   ...
   ```

3. **Custom Filtering is Acceptable**: Function implementation already has explicit WHERE clauses
   ```sql
   CREATE FUNCTION get_team_projects(p_account_id uuid)
   RETURNS SETOF projects
   LANGUAGE sql
   SECURITY INVOKER  -- Caller must be team member (enforced by RLS)
   ...
   ```

**Important Caveat**:
- RLS **must** be enabled on all accessed tables
- RLS policies **must** cover all operations (SELECT, INSERT, UPDATE, DELETE)
- Test extensively with different user roles
- Consider defense-in-depth with application-level checks

### The RLS+SECURITY INVOKER Trap

The most common security issue is combining SECURITY INVOKER with incomplete RLS:

```sql
-- DANGEROUS PATTERN
CREATE FUNCTION get_team_data(p_account_id uuid)
RETURNS SETOF data_table
LANGUAGE sql
SECURITY INVOKER  -- Relies on RLS
AS $$
  SELECT * FROM data_table
  WHERE account_id = p_account_id;
$$;
```

This fails when:
- RLS is disabled on data_table
- RLS policies don't cover this particular query pattern
- Function is called by a privileged user (e.g., admin client)
- Team member joins after function is created

**Solution**: Always verify RLS with explicit tests

---

## Detecting Silent RLS Failures

RLS failures can be silent—you get no error, just unexpected empty results. Here's how to detect them:

### 1. Monitoring & Logging

```sql
-- Log all function calls for auditing
CREATE TABLE function_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  called_by UUID NOT NULL,
  account_id UUID,
  called_at TIMESTAMPTZ DEFAULT NOW(),
  had_results boolean,
  error_message text
);

-- Add logging to functions
CREATE FUNCTION get_team_member_usage(...) ... AS $$
BEGIN
  -- ... authorization check ...

  -- Log the call
  INSERT INTO function_audit_log (function_name, called_by, account_id, had_results)
  VALUES ('get_team_member_usage', auth.uid(), p_account_id, true);

  RETURN QUERY ...;
END;
$$;
```

### 2. Application-Level Validation

```typescript
// Always verify function returns expected shape
async function getTeamUsage(accountId: string) {
  const { data, error } = await client.rpc('get_team_member_usage', {
    p_account_id: accountId,
    p_period_start: start.toISOString(),
    p_period_end: end.toISOString(),
  });

  if (error) {
    console.error('Function call failed:', error);
    return null;
  }

  // IMPORTANT: Verify we got expected results
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('Function returned no results - verify RLS policies');
    // Log for investigation
    logUnexpectedEmptyResult('get_team_member_usage', accountId);
  }

  return data;
}
```

### 3. Test Cases for RLS Issues

```sql
-- Test that SECURITY INVOKER function respects RLS
BEGIN;
SELECT plan(4);

-- Create two users
SELECT tests.create_supabase_user('user1', 'user1@test.com');
SELECT tests.create_supabase_user('user2', 'user2@test.com');

-- User1 creates team
SELECT makerkit.authenticate_as('user1');
SELECT public.create_team_account('Team A');

-- User1 creates report
INSERT INTO sparlo_reports (account_id, created_by, status)
VALUES (makerkit.get_account_id_by_slug('team-a'), tests.get_supabase_uid('user1'), 'complete');

-- User2 tries to access - should fail or be empty
SELECT makerkit.authenticate_as('user2');
SELECT is_empty(
  'SELECT * FROM get_team_member_usage(makerkit.get_account_id_by_slug(''team-a''), NOW(), NOW())',
  'User2 should not see User1''s team reports'
);

ROLLBACK;
```

### 4. Type System Validation

```typescript
// Validate return types match schema expectations
import { z } from 'zod';

const TeamMemberUsageSchema = z.object({
  user_id: z.string().uuid(),
  user_name: z.string(),
  user_email: z.string().email(),
  reports_count: z.number().int().min(0),  // Not BIGINT!
  is_current_member: z.boolean(),
});

// This will catch type mismatches
const result = TeamMemberUsageSchema.safeParse(data);
if (!result.success) {
  console.error('Type validation failed - database schema may have changed');
}
```

---

## Test Cases for Type Safety

### Test Case 1: BIGINT Overflow Detection

```sql
-- Test that large token values don't overflow
BEGIN;
SELECT plan(2);

-- Create account with large token limit
INSERT INTO usage_periods (account_id, period_start, period_end, tokens_limit, tokens_used)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  NOW(),
  NOW() + INTERVAL '30 days',
  9000000000::bigint,  -- 9 billion tokens
  8500000000::bigint   -- 8.5 billion used
);

-- Call function that returns these values
SELECT results_match(
  $$SELECT tokens_limit::bigint FROM admin_search_users_by_email('test@example.com')$$,
  $$SELECT 9000000000::bigint$$,
  'Function should return full BIGINT value without overflow'
);

SELECT results_match(
  $$SELECT tokens_used::bigint FROM admin_search_users_by_email('test@example.com')$$,
  $$SELECT 8500000000::bigint$$,
  'Function should return BIGINT without truncation'
);

SELECT * FROM finish();
ROLLBACK;
```

### Test Case 2: RLS Policy Enforcement

```sql
-- Test that SECURITY INVOKER function respects team membership
BEGIN;
SELECT plan(3);

-- Setup users and team
SELECT tests.create_supabase_user('alice', 'alice@test.com');
SELECT tests.create_supabase_user('bob', 'bob@test.com');

SELECT makerkit.authenticate_as('alice');
SELECT public.create_team_account('Alices Team');
DECLARE
  v_team_id uuid := makerkit.get_account_id_by_slug('alices-team');
BEGIN
  -- Alice creates a report
  INSERT INTO sparlo_reports (account_id, created_by, status, created_at)
  VALUES (v_team_id, tests.get_supabase_uid('alice'), 'complete', NOW());

  -- Alice should see her team's data
  SELECT makerkit.authenticate_as('alice');
  SELECT isnt_empty(
    format('SELECT * FROM get_team_member_usage(%L::uuid, NOW() - INTERVAL ''1 month'', NOW())', v_team_id),
    'Alice should see team member usage for her team'
  );

  -- Bob should NOT see Alice's team data
  SELECT makerkit.authenticate_as('bob');
  SELECT throws_ok(
    format('SELECT * FROM get_team_member_usage(%L::uuid, NOW() - INTERVAL ''1 month'', NOW())', v_team_id),
    'Access denied',
    'Bob should not be able to access Alice''s team usage'
  );

  -- Add Bob as team member, now he should see it
  INSERT INTO accounts_memberships (account_id, user_id, account_role)
  VALUES (v_team_id, tests.get_supabase_uid('bob'), 'member');

  SELECT makerkit.authenticate_as('bob');
  SELECT isnt_empty(
    format('SELECT * FROM get_team_member_usage(%L::uuid, NOW() - INTERVAL ''1 month'', NOW())', v_team_id),
    'Bob should see team usage after joining team'
  );
END;

SELECT * FROM finish();
ROLLBACK;
```

### Test Case 3: Type Casting Integrity

```sql
-- Test that intermediate casts don't lose precision
BEGIN;
SELECT plan(2);

-- Insert a usage period with large numbers
INSERT INTO usage_periods (account_id, period_start, period_end, tokens_limit, tokens_used)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  NOW(),
  NOW() + INTERVAL '30 days',
  3000000::bigint,
  2850000::bigint
);

-- Test direct column selection
SELECT is(
  (SELECT tokens_limit::bigint FROM usage_periods WHERE account_id = '550e8400-e29b-41d4-a716-446655440001'::uuid),
  3000000::bigint,
  'Direct BIGINT selection should preserve value'
);

-- Test through COALESCE (like in admin functions)
SELECT is(
  COALESCE((SELECT tokens_limit FROM usage_periods WHERE account_id = '550e8400-e29b-41d4-a716-446655440001'::uuid), 0)::bigint,
  3000000::bigint,
  'COALESCE(BIGINT, INTEGER) should return BIGINT'
);

SELECT * FROM finish();
ROLLBACK;
```

---

## Implementation Checklist for New Functions

When creating new PostgreSQL functions, follow this checklist:

### Phase 1: Design

- [ ] **Determine security context**
  - [ ] Who should be able to call this function?
  - [ ] What data will it access?
  - [ ] Does existing RLS protect this access?
  - [ ] Is SECURITY DEFINER or INVOKER appropriate?

- [ ] **Plan authorization checks**
  - [ ] Write explicit authorization logic (if SECURITY DEFINER)
  - [ ] Identify all RLS policies that must apply (if SECURITY INVOKER)
  - [ ] Plan error responses for unauthorized access

- [ ] **Define precise return types**
  - [ ] Match return types exactly to source table column types
  - [ ] Document any type conversions needed and why
  - [ ] Plan for NULL handling (COALESCE, default values)

### Phase 2: Implementation

- [ ] **Write authorization check first**
  ```sql
  CREATE FUNCTION ... SECURITY DEFINER ... AS $$
  BEGIN
    -- FIRST: Authorization check
    IF NOT public.has_permission(...) THEN
      RAISE EXCEPTION 'Access denied' USING errcode = 'insufficient_privilege';
    END IF;

    -- THEN: Data access
    RETURN QUERY ...;
  END;
  $$;
  ```

- [ ] **Set search_path if SECURITY DEFINER**
  ```sql
  CREATE FUNCTION ...
  SECURITY DEFINER
  SET search_path = ''  -- Or 'public' if necessary
  ...
  ```

- [ ] **Verify return types**
  - [ ] Check each return column against source table
  - [ ] Use pgAdmin or `\df+` to verify function signature
  - [ ] Test with actual data values

- [ ] **Add comprehensive comments**
  ```sql
  COMMENT ON FUNCTION function_name(...) IS
  'Purpose: Describe what this does

  Security: SECURITY DEFINER - Explain why elevated privileges needed
  Authorization: Verify auth.uid() is team member (implementation detail)

  Returns: Table with columns (list types)

  Example: SELECT * FROM function_name(...) WHERE ...';
  ```

- [ ] **Grant appropriately**
  ```sql
  GRANT EXECUTE ON FUNCTION function_name(...)
    TO authenticated;  -- or service_role, or specific role
  ```

### Phase 3: Testing

- [ ] **Unit tests**: Test authorization and data access separately
- [ ] **Integration tests**: Test with multiple user roles and account memberships
- [ ] **Edge cases**: NULL values, empty results, permission changes
- [ ] **Type tests**: Large values, precision, casting
- [ ] **Security tests**: Try unauthorized access, SQL injection, privilege escalation

### Phase 4: Review & Documentation

- [ ] **Code review checklist** (see above)
- [ ] **Security review**: Authorization logic is sound
- [ ] **Type review**: Return types verified
- [ ] **Documentation**: Security context explained
- [ ] **Monitoring**: Add logging if sensitive data accessed

---

## Real-World Example: Complete Secure Function

This example implements a secure, well-tested function following all best practices:

```sql
-- Get aggregated usage statistics for a team account
-- This function demonstrates best practices for:
-- 1. Type safety (BIGINT for large numbers)
-- 2. Security context (SECURITY DEFINER + authorization)
-- 3. Defense-in-depth
-- 4. Clear error handling

CREATE OR REPLACE FUNCTION admin_search_users_by_email(p_email text)
RETURNS TABLE (
  user_id uuid,
  email text,
  account_id uuid,
  account_name text,
  is_personal_account boolean,
  created_at timestamptz,
  tokens_used bigint,           -- ✓ BIGINT for large numbers
  tokens_limit bigint,          -- ✓ BIGINT for large numbers
  period_start timestamptz,
  period_end timestamptz,
  subscription_status text
)
LANGUAGE plpgsql
SECURITY DEFINER              -- ✓ Elevated privileges to access usage_periods
SET search_path = public      -- ✓ Prevent SQL injection
AS $$
BEGIN
  -- ✓ Implicit authorization: Only admins can call this function
  -- (Verified by Supabase RLS on grant, but could add explicit check)

  RETURN QUERY
  SELECT
    u.id as user_id,
    u.email::text,
    a.id as account_id,
    a.name as account_name,
    a.is_personal_account,
    u.created_at,
    COALESCE(up.tokens_used, 0)::bigint as tokens_used,    -- ✓ Explicit BIGINT cast
    COALESCE(up.tokens_limit, 0)::bigint as tokens_limit,  -- ✓ Explicit BIGINT cast
    up.period_start,
    up.period_end,
    COALESCE(s.status::text, 'none') as subscription_status
  FROM auth.users u
  JOIN accounts_memberships am ON am.user_id = u.id
  JOIN accounts a ON a.id = am.account_id
  LEFT JOIN usage_periods up ON up.account_id = a.id
    AND NOW() BETWEEN up.period_start AND up.period_end
  LEFT JOIN subscriptions s ON s.account_id = a.id AND s.active = true
  WHERE LOWER(u.email) = LOWER(TRIM(p_email))
  ORDER BY a.is_personal_account DESC, a.created_at DESC;
END;
$$;

-- ✓ Specific grant to authenticated (admin verification elsewhere)
GRANT EXECUTE ON FUNCTION admin_search_users_by_email(text) TO authenticated;

-- ✓ Clear security comment
COMMENT ON FUNCTION admin_search_users_by_email(text) IS
  'Admin function: Search user accounts by email with usage statistics.

   Security: SECURITY DEFINER required to access usage_periods without RLS filtering.
   Authorization: Implicitly verified - only users with admin privileges should have
   access to call this function (verified in application layer).

   Returns: User and account details with token usage statistics (BIGINT for safety).
   Period boundaries show current billing cycle.

   Returns BIGINT types for tokens_* columns to prevent overflow.
   Type-safe COALESCE with defaults prevents NULL in aggregates.';
```

---

## Summary of Key Principles

### Type Safety
1. **Match return types to source column types** - No silent casts
2. **Use BIGINT for aggregates** - Prevents overflow on large numbers
3. **Be explicit with COALESCE** - Match types precisely
4. **Test with edge values** - Large numbers, NULL values, special characters

### Security Context
1. **Choose DEFINER vs INVOKER deliberately** - Not by accident
2. **Authorization comes first** - Before any data access
3. **Set search_path = ''** - Prevent SQL injection in SECURITY DEFINER
4. **Grant to specific roles** - Principle of least privilege
5. **Comment security decisions** - Explain why you chose this approach

### Defense-in-Depth
1. **Add application-level checks** - Don't rely solely on database security
2. **Verify membership before RPC calls** - Client-side confirmation
3. **Log sensitive operations** - Detect and investigate issues
4. **Test with different user roles** - Ensure RLS works as expected
5. **Validate return types in application** - Catch schema changes early

### Testing
1. **Test authorization separately** - Verify access control works
2. **Test RLS policies** - Ensure inherited policies apply correctly
3. **Test with large values** - Catch overflow issues
4. **Test error cases** - Ensure appropriate error messages
5. **Test cross-user access** - Team members, non-members, admins

---

## References

- [PostgreSQL Security Documentation](https://www.postgresql.org/docs/current/sql-createrole.html)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)

---

## Quick Reference: Decision Tree

```
New PostgreSQL function?
├─ Data only from user's own account?
│  └─ SECURITY INVOKER (RLS filters results)
│
├─ Need access to data from multiple accounts/users?
│  ├─ Searching/aggregating team data?
│  │  └─ SECURITY DEFINER + explicit authorization check
│  │
│  ├─ Admin operation?
│  │  └─ SECURITY DEFINER + admin verification
│  │
│  └─ System internal function?
│     └─ SECURITY DEFINER + no public grant
│
└─ Returning large numbers (>2 billion)?
   └─ Use BIGINT return type explicitly
```

---

**Last Updated**: January 8, 2026
**Version**: 1.0
**Status**: Production Ready
