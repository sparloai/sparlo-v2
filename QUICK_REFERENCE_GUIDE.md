# PostgreSQL Function Security: Quick Reference Guide

Fast lookup for common patterns and decision trees.

---

## Decision Tree: SECURITY DEFINER vs INVOKER

```
Does function access data outside caller's direct visibility?
├─ YES → SECURITY DEFINER required
│  ├─ Add explicit authorization check at start
│  ├─ Use SET search_path = ''
│  ├─ Grant to specific roles only
│  └─ Document why DEFINER is needed
│
└─ NO → Use SECURITY INVOKER
   ├─ Verify RLS policies exist on all tables
   ├─ Test that RLS blocks unauthorized access
   └─ Consider defense-in-depth application checks
```

---

## Type Safety Checklist

**Before committing any PostgreSQL function:**

```sql
-- 1. Check return types match source columns
\df+ my_function  -- Verify signature

-- 2. Spot-check with actual data
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'my_table'
  AND column_name IN ('tokens_used', 'tokens_limit');

-- 3. Test with large values (>2 billion)
SELECT my_function(account_id)
FROM my_function(some_account_id)
WHERE tokens_used > 2147483647;

-- 4. Verify no INTEGER return types for large numbers
SELECT routine_columns.data_type
FROM information_schema.routine_columns
WHERE routine_name = 'my_function'
  AND column_name IN ('tokens_used', 'tokens_limit');
```

---

## Authorization Check Template

**For SECURITY DEFINER functions:**

```sql
CREATE FUNCTION my_function(p_account_id uuid)
RETURNS TABLE (...)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- STEP 1: Authorization (always first!)
  IF NOT EXISTS (
    SELECT 1 FROM public.accounts_memberships am
    WHERE am.account_id = p_account_id
      AND am.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Not a member of this account'
      USING errcode = 'insufficient_privilege';
  END IF;

  -- STEP 2: Data access (only after auth passes)
  RETURN QUERY
  SELECT ... FROM ...
  WHERE account_id = p_account_id;
END;
$$;

-- STEP 3: Grant specifically
GRANT EXECUTE ON FUNCTION my_function(uuid) TO authenticated;

-- STEP 4: Document
COMMENT ON FUNCTION my_function(uuid) IS
  'Purpose: ...\n'
  'Security: SECURITY DEFINER - needs access to other users'' data\n'
  'Auth: Verifies caller is team member';
```

---

## Type Safety Pattern Library

### Pattern 1: BIGINT for Large Numbers

```sql
-- Table definition
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL,
  tokens_used BIGINT NOT NULL DEFAULT 0,    -- ✓ BIGINT
  tokens_limit BIGINT NOT NULL DEFAULT 3000000,  -- ✓ BIGINT
  ...
);

-- Function return
CREATE FUNCTION admin_get_usage_stats(...)
RETURNS TABLE (
  tokens_used BIGINT,     -- ✓ Match table
  tokens_limit BIGINT,    -- ✓ Match table
  ...
)
...
```

### Pattern 2: Explicit COALESCE Casting

```sql
-- WRONG: Type mismatch
SELECT COALESCE(up.tokens_used, 0)  -- What type is this?

-- CORRECT: Explicit types
SELECT COALESCE(up.tokens_used, 0::bigint)::bigint

-- CORRECT: Better - use matching column type
SELECT COALESCE(up.tokens_used, (SELECT 0::bigint))
```

### Pattern 3: Safe Aggregate Functions

```sql
-- Table
CREATE TABLE events (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL,
  duration_ms BIGINT NOT NULL,  -- Large numbers
  ...
);

-- WRONG: COUNT might overflow (no), SUM loses type
SELECT COUNT(*), SUM(duration_ms)
FROM events
WHERE account_id = p_account_id;

-- CORRECT: Explicit types
SELECT
  COUNT(*)::BIGINT,
  SUM(duration_ms)::BIGINT,
  COALESCE(AVG(duration_ms), 0)::BIGINT
FROM events
WHERE account_id = p_account_id;
```

### Pattern 4: NULL Handling with Defaults

```sql
-- WRONG: Type inconsistency
SELECT COALESCE(column_name, 0)  -- Is column BIGINT?

-- CORRECT: Type-safe default
SELECT COALESCE(
  column_name::BIGINT,
  0::BIGINT
)::BIGINT

-- CORRECT: Let PostgreSQL infer
SELECT COALESCE(column_name, 0::BIGINT)
```

---

## Authorization Pattern Reference

### Pattern 1: Simple Team Membership

```sql
-- Check if user is member of account
CREATE FUNCTION check_team_access(p_account_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.accounts_memberships am
    WHERE am.account_id = p_account_id
      AND am.user_id = auth.uid()
  );
$$;
```

### Pattern 2: Role-Based Permissions

```sql
-- Check if user has specific role on account
CREATE FUNCTION check_admin_access(p_account_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.accounts_memberships am
    WHERE am.account_id = p_account_id
      AND am.user_id = auth.uid()
      AND am.account_role IN ('owner', 'admin')
  );
$$;
```

### Pattern 3: Multi-Table Authorization

```sql
-- Complex authorization with multiple checks
CREATE FUNCTION secure_update_billing(
  p_account_id uuid,
  p_new_limit integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check 1: User is member
  IF NOT EXISTS (
    SELECT 1 FROM public.accounts_memberships am
    WHERE am.account_id = p_account_id
      AND am.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member' USING errcode = 'insufficient_privilege';
  END IF;

  -- Check 2: User is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.accounts_memberships am
    WHERE am.account_id = p_account_id
      AND am.user_id = auth.uid()
      AND am.account_role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Not an admin' USING errcode = 'insufficient_privilege';
  END IF;

  -- Both checks passed, now proceed
  UPDATE public.usage_periods
  SET tokens_limit = p_new_limit
  WHERE account_id = p_account_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Billing limit updated'
  );
END;
$$;
```

---

## Testing Quick Start

### Test: Verify Return Types

```sql
-- Check function signature
\df+ admin_search_users_by_email

-- Expected output includes:
-- tokens_used | bigint
-- tokens_limit | bigint
```

### Test: Authorization Works

```sql
-- Create two test users
SELECT tests.create_supabase_user('alice', 'alice@test.com');
SELECT tests.create_supabase_user('bob', 'bob@test.com');

-- Alice creates team
SELECT makerkit.authenticate_as('alice');
SELECT public.create_team_account('Alices Team');

-- Bob tries to access (should fail)
SELECT makerkit.authenticate_as('bob');
SELECT * FROM get_team_member_usage(
  makerkit.get_account_id_by_slug('alices-team'),
  NOW() - INTERVAL '30 days',
  NOW()
);
-- Expected: Error or empty result

-- Add Bob to team
SELECT makerkit.authenticate_as('alice');
INSERT INTO public.accounts_memberships (account_id, user_id, account_role)
SELECT id, tests.get_supabase_uid('bob'), 'member'
FROM public.accounts WHERE slug = 'alices-team';

-- Bob tries again (should succeed)
SELECT makerkit.authenticate_as('bob');
SELECT * FROM get_team_member_usage(
  makerkit.get_account_id_by_slug('alices-team'),
  NOW() - INTERVAL '30 days',
  NOW()
);
-- Expected: Success, returns data
```

### Test: RLS Policies Apply

```sql
-- For SECURITY INVOKER functions
-- Verify RLS exists and is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('sparlo_reports', 'usage_periods');
-- Expected: rowsecurity = true for both

-- Verify policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('sparlo_reports', 'usage_periods');
```

---

## Common Mistakes & Fixes

### Mistake 1: Wrong Return Type

```sql
-- WRONG
RETURNS TABLE (
  tokens_used INTEGER,      -- Incorrect!
  tokens_limit INTEGER      -- Will overflow!
)

-- CORRECT
RETURNS TABLE (
  tokens_used BIGINT,
  tokens_limit BIGINT
)
```

### Mistake 2: Missing Authorization Check

```sql
-- WRONG: SECURITY DEFINER without check
CREATE FUNCTION get_user_data(p_user_id uuid)
RETURNS ... SECURITY DEFINER
AS $$
  SELECT * FROM user_sensitive_data
  WHERE user_id = p_user_id;
$$;
-- Any authenticated user can call this!

-- CORRECT: With authorization
CREATE FUNCTION get_user_data(p_user_id uuid)
RETURNS ... SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Can only access own data';
  END IF;
  RETURN QUERY
  SELECT * FROM user_sensitive_data
  WHERE user_id = p_user_id;
END;
$$;
```

### Mistake 3: Relying on RLS with SECURITY DEFINER

```sql
-- WRONG: DEFINER bypasses RLS
CREATE FUNCTION get_all_team_data(p_account_id uuid)
RETURNS SETOF data_table
SECURITY DEFINER
AS $$
  SELECT * FROM data_table WHERE account_id = p_account_id;
$$;
-- RLS won't apply because function runs as owner!

-- CORRECT: Add explicit check
CREATE FUNCTION get_all_team_data(p_account_id uuid)
RETURNS SETOF data_table
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT public.has_role_on_account(p_account_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
  SELECT * FROM data_table WHERE account_id = p_account_id;
END;
$$;
```

### Mistake 4: No search_path in SECURITY DEFINER

```sql
-- WRONG: Vulnerable to SQL injection
CREATE FUNCTION my_function()
RETURNS ... SECURITY DEFINER
AS $$
  -- Could be hijacked by malicious schema in search_path
$$;

-- CORRECT: Explicit search_path
CREATE FUNCTION my_function()
RETURNS ... SECURITY DEFINER SET search_path = ''
AS $$
  -- Safe from schema injection
$$;
```

### Mistake 5: Wrong Grant Statement

```sql
-- WRONG: Grant to all authenticated
GRANT EXECUTE ON FUNCTION admin_function(...) TO authenticated;
-- Now every user can call admin_function!

-- CORRECT: Grant to service_role only (for server-side)
GRANT EXECUTE ON FUNCTION admin_function(...) TO service_role;

-- CORRECT: Grant with authorization checks inside
GRANT EXECUTE ON FUNCTION secure_function(...) TO authenticated;
-- Authorization checks inside function ensure safety
```

---

## Performance Considerations

### When Using SECURITY DEFINER

```sql
-- GOOD: Direct authorization check (fast)
CREATE FUNCTION get_team_usage(p_account_id uuid)
RETURNS ...
SECURITY DEFINER
AS $$
BEGIN
  -- Single existence check
  IF NOT EXISTS (SELECT 1 FROM accounts_memberships ...) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY SELECT ...;
END;
$$;

-- SLOW: Multiple authorization checks (add when needed)
CREATE FUNCTION get_team_usage(p_account_id uuid)
RETURNS ...
SECURITY DEFINER
AS $$
BEGIN
  -- Check 1: Membership
  IF NOT EXISTS (SELECT 1 FROM accounts_memberships ...) THEN ...
  END IF;

  -- Check 2: Has permission
  IF NOT EXISTS (SELECT 1 FROM role_permissions ...) THEN ...
  END IF;

  -- Check 3: Account not deleted
  IF NOT EXISTS (SELECT 1 FROM accounts WHERE id = p_account_id AND deleted_at IS NULL) THEN ...
  END IF;

  RETURN QUERY SELECT ...;
END;
$$;
```

### Index Considerations for Authorization

```sql
-- Create indexes to speed up authorization checks
CREATE INDEX idx_accounts_memberships_user
  ON accounts_memberships(user_id, account_id);

CREATE INDEX idx_accounts_memberships_account
  ON accounts_memberships(account_id, user_id);

-- This speeds up:
-- SELECT * FROM accounts_memberships WHERE user_id = ? AND account_id = ?
```

---

## Debugging Commands

```sql
-- Check function security context
\df+ function_name

-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'my_table';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, qual
FROM pg_policies
WHERE tablename = 'my_table';

-- Check what role function runs as
SELECT definition
FROM pg_proc
WHERE proname = 'my_function';

-- Check grants
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'my_table';

-- Check function grants
\dp+ function_name
```

---

## Integration with Application

### Before calling RPC function:

```typescript
// Always verify membership client-side (defense-in-depth)
const { data: membership } = await client
  .from('accounts_memberships')
  .select('*')
  .eq('account_id', accountId)
  .eq('user_id', currentUserId)
  .single();

if (!membership) {
  throw new Error('Access denied');
}

// Now safe to call RPC
const { data } = await client.rpc('get_team_data', {
  p_account_id: accountId,
});
```

### Validate response types:

```typescript
// Use Zod to verify types match
const UsageStatsSchema = z.object({
  tokens_used: z.number().int(),    // Not string!
  tokens_limit: z.number().int(),
  percentage: z.number(),
});

const { data, error } = await client.rpc('check_usage_allowed', {
  p_account_id: accountId,
  p_estimated_tokens: estimatedTokens,
});

const validated = UsageStatsSchema.safeParse(data);
if (!validated.success) {
  console.error('Type validation failed', validated.error);
  // Schema may have changed!
}
```

---

## Summary: The Golden Rules

1. **Match return types exactly** - No silent casts
2. **Authorization comes first** - Check before accessing data
3. **DEFINER + explicit check** - Don't rely on RLS alone with DEFINER
4. **INVOKER + RLS policies** - Always verify RLS exists
5. **Set search_path = ''** - Prevent SQL injection in DEFINER
6. **Test with different roles** - Don't assume RLS works
7. **Grant specifically** - Never grant to `anon` unintentionally
8. **Document security decisions** - Explain why you chose DEFINER/INVOKER
9. **Defense-in-depth** - Add application-level checks too
10. **Test with real data** - Large numbers, edge cases, NULL values

---

**Last Updated**: January 8, 2026
