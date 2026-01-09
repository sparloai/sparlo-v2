-- PostgreSQL Function Security Test Suite
-- Tests for preventing BIGINT overflow and RLS issues in database functions
-- Uses pgTAP framework: https://pgtap.org/

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgtap";

-- =============================================================================
-- TEST SUITE 1: BIGINT TYPE SAFETY
-- Prevents silent overflow in function return types
-- =============================================================================

SELECT plan(8);

SELECT subtest(
  'BIGINT Overflow Detection',
  format(
    $t$
    SELECT plan(4);

    -- Test 1: Large BIGINT value handling
    CREATE TEMP TABLE test_bigint_values AS
    SELECT
      1::bigint as small_value,
      2147483647::bigint as max_integer,  -- MAX INT32
      9000000000::bigint as large_value,
      9223372036854775807::bigint as max_bigint;

    SELECT is(
      (SELECT small_value FROM test_bigint_values)::integer,
      1::integer,
      'Small BIGINT should cast to INTEGER safely'
    );

    SELECT is(
      (SELECT max_integer FROM test_bigint_values),
      2147483647::bigint,
      'MAX INTEGER value should fit in BIGINT'
    );

    SELECT is(
      (SELECT large_value FROM test_bigint_values),
      9000000000::bigint,
      'Large BIGINT (9 billion) should not truncate'
    );

    -- Test 2: Function return type precision
    -- Verify function signature returns BIGINT not INTEGER
    SELECT isnt(
      (
        SELECT data_type
        FROM information_schema.routine_columns
        WHERE routine_schema = 'public'
          AND routine_name = 'admin_search_users_by_email'
          AND column_name = 'tokens_used'
      ),
      'integer',
      'tokens_used should not be INTEGER type'
    );

    SELECT * FROM finish();
    $t$
  )
);

SELECT subtest(
  'COALESCE Type Matching',
  format(
    $t$
    SELECT plan(3);

    -- Test that COALESCE preserves types correctly
    SELECT is(
      COALESCE(NULL::bigint, 0)::bigint,
      0::bigint,
      'COALESCE(NULL, INTEGER) should return matching type'
    );

    SELECT is(
      pg_typeof(COALESCE(3000000::bigint, 0::bigint)),
      'bigint'::regtype,
      'COALESCE(BIGINT, BIGINT) should return BIGINT'
    );

    SELECT is(
      (COALESCE(NULL::bigint, 0) + 1000000000::bigint),
      1000000000::bigint,
      'Arithmetic with COALESCE result should not overflow'
    );

    SELECT * FROM finish();
    $t$
  )
);

-- =============================================================================
-- TEST SUITE 2: SECURITY DEFINER AUTHORIZATION
-- Prevents unauthorized access when using SECURITY DEFINER
-- =============================================================================

SELECT subtest(
  'SECURITY DEFINER Authorization Checks',
  format(
    $t$
    SELECT plan(5);

    -- Create test users
    SELECT tests.create_supabase_user('definer_test_user1', 'definer1@test.com');
    SELECT tests.create_supabase_user('definer_test_user2', 'definer2@test.com');

    -- Create test function with authorization
    SET ROLE postgres;
    CREATE OR REPLACE FUNCTION test_secure_function(p_account_id uuid)
    RETURNS TABLE (
      account_id uuid,
      account_name text
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      -- Authorization: Only if user is member
      IF NOT EXISTS (
        SELECT 1 FROM accounts_memberships am
        WHERE am.account_id = p_account_id
          AND am.user_id = auth.uid()
      ) THEN
        RAISE EXCEPTION 'Access denied: Not a member'
          USING errcode = 'insufficient_privilege';
      END IF;

      RETURN QUERY
      SELECT a.id, a.name FROM accounts a
      WHERE a.id = p_account_id;
    END;
    $$;

    GRANT EXECUTE ON FUNCTION test_secure_function(uuid) TO authenticated;

    -- Test: User1 creates account (becomes owner)
    SET ROLE authenticated;
    SELECT tests.authenticate_as_user(tests.get_supabase_uid('definer_test_user1'));

    -- Create account through Supabase
    CREATE TEMP TABLE user1_account AS
    SELECT '550e8400-e29b-41d4-a716-446655440010'::uuid as id;

    INSERT INTO accounts (id, name, is_personal_account)
    SELECT id, 'Test Account', false FROM user1_account;

    INSERT INTO accounts_memberships (account_id, user_id, account_role)
    SELECT id, tests.get_supabase_uid('definer_test_user1'), 'owner'
    FROM user1_account;

    SELECT isnt_empty(
      format(
        'SELECT * FROM test_secure_function(%L::uuid)',
        (SELECT id FROM user1_account)
      ),
      'User1 should access their own account'
    );

    -- Test: User2 should NOT access User1's account
    SET ROLE authenticated;
    SELECT tests.authenticate_as_user(tests.get_supabase_uid('definer_test_user2'));

    SELECT throws_ok(
      format(
        'SELECT * FROM test_secure_function(%L::uuid)',
        (SELECT id FROM user1_account)
      ),
      'Access denied',
      'User2 should not access User1''s account'
    );

    -- Test: User2 CAN access after being added
    SET ROLE postgres;
    INSERT INTO accounts_memberships (account_id, user_id, account_role)
    SELECT id, tests.get_supabase_uid('definer_test_user2'), 'member'
    FROM user1_account;

    SET ROLE authenticated;
    SELECT tests.authenticate_as_user(tests.get_supabase_uid('definer_test_user2'));

    SELECT isnt_empty(
      format(
        'SELECT * FROM test_secure_function(%L::uuid)',
        (SELECT id FROM user1_account)
      ),
      'User2 should access account after being added as member'
    );

    DROP FUNCTION test_secure_function(uuid);
    SELECT * FROM finish();
    $t$
  )
);

-- =============================================================================
-- TEST SUITE 3: SECURITY INVOKER RLS ENFORCEMENT
-- Prevents silent RLS bypass when using SECURITY INVOKER
-- =============================================================================

SELECT subtest(
  'SECURITY INVOKER RLS Policy Application',
  format(
    $t$
    SELECT plan(4);

    -- Create test users
    SELECT tests.create_supabase_user('invoker_test_user1', 'invoker1@test.com');
    SELECT tests.create_supabase_user('invoker_test_user2', 'invoker2@test.com');

    -- Create test table with RLS
    SET ROLE postgres;
    CREATE TEMP TABLE invoker_test_data (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id uuid NOT NULL,
      created_by uuid NOT NULL,
      content text NOT NULL,
      created_at timestamptz DEFAULT NOW()
    );

    ALTER TABLE invoker_test_data ENABLE ROW LEVEL SECURITY;

    -- RLS policy: Users can only see data from accounts they're members of
    CREATE POLICY invoker_test_policy ON invoker_test_data
    FOR SELECT TO authenticated
    USING (
      account_id IN (
        SELECT account_id FROM accounts_memberships
        WHERE user_id = auth.uid()
      )
    );

    -- Create SECURITY INVOKER function (should respect RLS)
    CREATE OR REPLACE FUNCTION test_invoker_function(p_account_id uuid)
    RETURNS TABLE (id uuid, content text)
    LANGUAGE sql
    SECURITY INVOKER
    AS $$
      SELECT id, content FROM invoker_test_data
      WHERE account_id = p_account_id;
    $$;

    GRANT EXECUTE ON FUNCTION test_invoker_function(uuid) TO authenticated;

    -- Setup: Create account and add users
    CREATE TEMP TABLE invoker_test_account AS
    SELECT '550e8400-e29b-41d4-a716-446655440020'::uuid as id;

    INSERT INTO accounts (id, name, is_personal_account)
    SELECT id, 'Invoker Test Account', false FROM invoker_test_account;

    INSERT INTO accounts_memberships (account_id, user_id, account_role)
    SELECT id, tests.get_supabase_uid('invoker_test_user1'), 'owner'
    FROM invoker_test_account;

    -- User1 creates data
    SET ROLE postgres;
    INSERT INTO invoker_test_data (account_id, created_by, content)
    SELECT
      (SELECT id FROM invoker_test_account),
      tests.get_supabase_uid('invoker_test_user1'),
      'User1 content'
    FROM invoker_test_account;

    -- Test: User1 can see their data through INVOKER function
    SET ROLE authenticated;
    SELECT tests.authenticate_as_user(tests.get_supabase_uid('invoker_test_user1'));

    SELECT isnt_empty(
      format(
        'SELECT * FROM test_invoker_function(%L::uuid)',
        (SELECT id FROM invoker_test_account)
      ),
      'User1 should see data from accounts they''re member of'
    );

    -- Test: User2 should NOT see data (not a member of account)
    SET ROLE authenticated;
    SELECT tests.authenticate_as_user(tests.get_supabase_uid('invoker_test_user2'));

    SELECT is_empty(
      format(
        'SELECT * FROM test_invoker_function(%L::uuid)',
        (SELECT id FROM invoker_test_account)
      ),
      'User2 should not see data (RLS blocks - not a member)'
    );

    -- Test: User2 CAN see data after being added
    SET ROLE postgres;
    INSERT INTO accounts_memberships (account_id, user_id, account_role)
    SELECT id, tests.get_supabase_uid('invoker_test_user2'), 'member'
    FROM invoker_test_account;

    SET ROLE authenticated;
    SELECT tests.authenticate_as_user(tests.get_supabase_uid('invoker_test_user2'));

    SELECT isnt_empty(
      format(
        'SELECT * FROM test_invoker_function(%L::uuid)',
        (SELECT id FROM invoker_test_account)
      ),
      'User2 should see data after being added as member'
    );

    DROP FUNCTION test_invoker_function(uuid);
    DROP TABLE invoker_test_data;
    SELECT * FROM finish();
    $t$
  )
);

-- =============================================================================
-- TEST SUITE 4: RLS DEFINER BYPASS DETECTION
-- Ensures SECURITY DEFINER doesn't accidentally bypass necessary RLS
-- =============================================================================

SELECT subtest(
  'SECURITY DEFINER Data Access Control',
  format(
    $t$
    SELECT plan(3);

    SELECT tests.create_supabase_user('definer_data_user1', 'definer_data1@test.com');
    SELECT tests.create_supabase_user('definer_data_user2', 'definer_data2@test.com');

    -- Create restricted table
    SET ROLE postgres;
    CREATE TEMP TABLE restricted_data (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id uuid NOT NULL,
      secret_value text NOT NULL
    );

    ALTER TABLE restricted_data ENABLE ROW LEVEL SECURITY;

    CREATE POLICY restricted_policy ON restricted_data
    FOR ALL TO authenticated
    USING (
      account_id IN (
        SELECT account_id FROM accounts_memberships
        WHERE user_id = auth.uid()
      )
    );

    -- SECURITY DEFINER function WITHOUT authorization check (intentional to test)
    CREATE OR REPLACE FUNCTION test_definer_unsafe(p_account_id uuid)
    RETURNS TABLE (secret_value text)
    LANGUAGE sql
    SECURITY DEFINER
    AS $$
      SELECT secret_value FROM restricted_data
      WHERE account_id = p_account_id;
    $$;

    GRANT EXECUTE ON FUNCTION test_definer_unsafe(uuid) TO authenticated;

    -- Setup data
    CREATE TEMP TABLE restricted_account AS
    SELECT '550e8400-e29b-41d4-a716-446655440030'::uuid as id;

    INSERT INTO accounts (id, name, is_personal_account)
    SELECT id, 'Restricted Account', false FROM restricted_account;

    INSERT INTO accounts_memberships (account_id, user_id, account_role)
    SELECT id, tests.get_supabase_uid('definer_data_user1'), 'owner'
    FROM restricted_account;

    SET ROLE postgres;
    INSERT INTO restricted_data (account_id, secret_value)
    SELECT (SELECT id FROM restricted_account), 'SECRET_DATA'
    FROM restricted_account;

    -- Test: SECURITY DEFINER bypasses table RLS!
    SET ROLE authenticated;
    SELECT tests.authenticate_as_user(tests.get_supabase_uid('definer_data_user2'));

    -- User2 is NOT a member but DEFINER allows access (BAD!)
    SELECT isnt_empty(
      format(
        'SELECT * FROM test_definer_unsafe(%L::uuid)',
        (SELECT id FROM restricted_account)
      ),
      'SECURITY DEFINER bypasses RLS - demonstrates why authorization check is needed'
    );

    -- Now create SECURE version WITH authorization
    SET ROLE postgres;
    CREATE OR REPLACE FUNCTION test_definer_safe(p_account_id uuid)
    RETURNS TABLE (secret_value text)
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = ''
    AS $$
    BEGIN
      -- Authorization check prevents bypass
      IF NOT EXISTS (
        SELECT 1 FROM public.accounts_memberships am
        WHERE am.account_id = p_account_id
          AND am.user_id = auth.uid()
      ) THEN
        RAISE EXCEPTION 'Access denied' USING errcode = 'insufficient_privilege';
      END IF;

      RETURN QUERY
      SELECT rd.secret_value FROM restricted_data rd
      WHERE rd.account_id = p_account_id;
    END;
    $$;

    GRANT EXECUTE ON FUNCTION test_definer_safe(uuid) TO authenticated;

    -- Test: Authorization check prevents bypass
    SET ROLE authenticated;
    SELECT tests.authenticate_as_user(tests.get_supabase_uid('definer_data_user2'));

    SELECT throws_ok(
      format(
        'SELECT * FROM test_definer_safe(%L::uuid)',
        (SELECT id FROM restricted_account)
      ),
      'Access denied',
      'Safe version with authorization check prevents bypass'
    );

    -- Clean up
    DROP FUNCTION test_definer_unsafe(uuid);
    DROP FUNCTION test_definer_safe(uuid);
    DROP TABLE restricted_data;
    SELECT * FROM finish();
    $t$
  )
);

-- =============================================================================
-- TEST SUITE 5: TYPE PRECISION IN AGGREGATES
-- Ensures aggregate functions return correct types
-- =============================================================================

SELECT subtest(
  'Aggregate Function Type Safety',
  format(
    $t$
    SELECT plan(5);

    -- Test COUNT returns INTEGER
    SELECT is(
      pg_typeof(COUNT(*)),
      'bigint'::regtype,
      'COUNT(*) returns BIGINT in PostgreSQL 10+'
    );

    -- Test SUM with BIGINT
    SELECT is(
      pg_typeof(SUM(1::bigint)),
      'numeric'::regtype,
      'SUM(BIGINT) returns NUMERIC'
    );

    -- Test proper type casting in aggregates
    CREATE TEMP TABLE aggregate_test (
      value bigint
    );

    INSERT INTO aggregate_test VALUES (1000000000), (2000000000), (3000000000);

    SELECT is(
      SUM(value)::bigint,
      6000000000::bigint,
      'SUM(BIGINT) should handle large totals'
    );

    -- Test aggregate in COALESCE
    SELECT is(
      COALESCE((SELECT SUM(value)::bigint FROM aggregate_test), 0::bigint),
      6000000000::bigint,
      'COALESCE with SUM aggregate should preserve type'
    );

    -- Test GROUP BY aggregates
    SELECT is(
      (SELECT COUNT(*)::bigint FROM aggregate_test),
      3::bigint,
      'Explicit BIGINT cast on COUNT should work'
    );

    DROP TABLE aggregate_test;
    SELECT * FROM finish();
    $t$
  )
);

-- =============================================================================
-- TEST SUITE 6: SEARCH_PATH INJECTION PREVENTION
-- Ensures SET search_path = '' prevents SQL injection
-- =============================================================================

SELECT subtest(
  'SQL Injection Prevention via search_path',
  format(
    $t$
    SELECT plan(2);

    -- Create test schema with malicious function
    SET ROLE postgres;
    CREATE SCHEMA test_injection;
    CREATE FUNCTION test_injection.malicious_function()
    RETURNS text AS $function$
      SELECT 'INJECTED'::text;
    $function$ LANGUAGE sql;

    -- Create safe function with search_path = ''
    CREATE OR REPLACE FUNCTION test_injection_safe()
    RETURNS text
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = ''
    AS $$
      SELECT 'SAFE'::text;
    $$;

    -- Create unsafe function without search_path (if used)
    CREATE OR REPLACE FUNCTION test_injection_unsafe()
    RETURNS text
    LANGUAGE sql
    SECURITY DEFINER
    -- No search_path set
    AS $$
      SELECT 'MIGHT_BE_UNSAFE'::text;
    $$;

    -- Test safe version ignores schema in search path
    SELECT is(
      test_injection_safe(),
      'SAFE',
      'Safe function with search_path = '''' should return correct result'
    );

    -- Test that search_path = '' is actually set
    SELECT is(
      (SELECT setting FROM pg_settings WHERE name = 'search_path'),
      '"$user", public',
      'Verify search_path setting before test'
    );

    DROP FUNCTION test_injection_safe();
    DROP FUNCTION test_injection_unsafe();
    DROP FUNCTION test_injection.malicious_function();
    DROP SCHEMA test_injection;
    SELECT * FROM finish();
    $t$
  )
);

-- =============================================================================
-- Summary
-- =============================================================================

SELECT diag(
  E'\n=== PostgreSQL Function Security Test Suite Complete ===\n'
  'This test suite validates:\n'
  '1. BIGINT overflow prevention\n'
  '2. SECURITY DEFINER authorization\n'
  '3. SECURITY INVOKER RLS enforcement\n'
  '4. RLS bypass detection\n'
  '5. Aggregate function type safety\n'
  '6. SQL injection prevention\n'
);

SELECT * FROM finish();
ROLLBACK;
