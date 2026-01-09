---
title: "RLS Policies Silently Blocking SECURITY INVOKER Functions"
date: 2026-01-08
category: security-issues
severity: high
components:
  - mark_first_report_used RPC
  - try_claim_first_report RPC
  - admin_search_users_by_email RPC
  - usage.service.ts
  - hybrid-reports-server-actions.ts
symptoms:
  - Paywall not showing after first free report
  - Users can create unlimited "first" reports
  - Admin search returning 500 errors
  - first_report_used_at column staying NULL
root_cause: SECURITY INVOKER functions with internal auth checks still blocked by RLS UPDATE policies
resolution: Changed to SECURITY DEFINER with internal authorization checks
migrations:
  - 20260108135731_fix_admin_search_return_types.sql
  - 20260108154337_fix_mark_first_report_security.sql
related_docs:
  - docs/solutions/database-issues/supabase-rls-permission-errors-401-406-pgrst116.md
  - docs/solutions/security/usage-tracking-security-hardening.md
  - docs/solutions/security-issues/p1-security-fixes-code-review-20251223.md
tags:
  - postgresql
  - rls
  - security-definer
  - security-invoker
  - freemium
  - token-usage
---

# RLS Policies Silently Blocking SECURITY INVOKER Functions

## Problem Summary

Two critical issues were discovered in the admin/usage system:

1. **Admin Search 500 Error**: The `admin_search_users_by_email` RPC was casting BIGINT to INTEGER, causing overflow errors
2. **Paywall Bypass Bug**: Users could create unlimited "first" reports because `mark_first_report_used` silently failed due to RLS blocking

## Symptoms Observed

- Admin page at `/admin/usage` returned 500 when searching for users
- New users could generate multiple reports without seeing the paywall
- `first_report_used_at` column remained NULL even after report generation
- No error messages - failures were silent

## Root Cause Analysis

### Issue 1: Type Mismatch in Admin Search

The `admin_search_users_by_email` function returned `INTEGER` for token columns:

```sql
-- BEFORE: Integer return types
RETURNS TABLE (
  tokens_used integer,  -- Should be BIGINT
  tokens_limit integer, -- Should be BIGINT
  ...
)
```

The underlying `usage_periods` table uses `BIGINT`:

```sql
tokens_limit BIGINT NOT NULL DEFAULT 3000000,
tokens_used BIGINT NOT NULL DEFAULT 0,
```

When values exceeded 2,147,483,647, the cast failed with a 500 error.

### Issue 2: SECURITY INVOKER + RLS Conflict

The `mark_first_report_used` function had this structure:

```sql
CREATE FUNCTION mark_first_report_used(p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER  -- Problem: RLS applies to this function's operations
AS $$
BEGIN
  -- Authorization check passes...
  IF p_account_id != auth.uid() AND NOT has_role_on_account(p_account_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- But RLS blocks this UPDATE!
  UPDATE accounts SET first_report_used_at = NOW() WHERE id = p_account_id;

  RETURN FOUND;
END;
$$;
```

The RLS UPDATE policy on `accounts`:

```sql
CREATE POLICY accounts_self_update ON accounts FOR UPDATE
  USING (auth.uid() = primary_owner_user_id);
```

**What happened:**
1. User calls `mark_first_report_used(account_id)`
2. Internal auth check passes (user owns account or has team access)
3. UPDATE runs but RLS blocks it (SECURITY INVOKER = RLS applies)
4. `FOUND` is FALSE, function returns FALSE
5. TypeScript code treats FALSE as "already marked" not "failed"
6. `first_report_used_at` stays NULL
7. Next visit: user gets another "first report free"

## Solution

### Fix 1: Correct Return Types

Migration `20260108135731_fix_admin_search_return_types.sql`:

```sql
DROP FUNCTION IF EXISTS admin_search_users_by_email(text);

CREATE OR REPLACE FUNCTION admin_search_users_by_email(p_email text)
RETURNS TABLE (
  user_id uuid,
  email text,
  account_id uuid,
  account_name text,
  is_personal_account boolean,
  created_at timestamptz,
  tokens_used bigint,   -- Changed from INTEGER
  tokens_limit bigint,  -- Changed from INTEGER
  period_start timestamptz,
  period_end timestamptz,
  subscription_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id as user_id,
    u.email::text,
    a.id as account_id,
    a.name as account_name,
    a.is_personal_account,
    u.created_at,
    COALESCE(up.tokens_used, 0)::bigint as tokens_used,
    COALESCE(up.tokens_limit, 0)::bigint as tokens_limit,
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
```

### Fix 2: Change to SECURITY DEFINER

Migration `20260108154337_fix_mark_first_report_security.sql`:

```sql
CREATE OR REPLACE FUNCTION public.mark_first_report_used(p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Changed from SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  rows_updated INT;
BEGIN
  -- Authorization check: caller must own this account or have team access
  IF p_account_id != auth.uid() AND NOT public.has_role_on_account(p_account_id) THEN
    RAISE EXCEPTION 'Unauthorized: You do not have access to this account';
  END IF;

  UPDATE public.accounts
  SET first_report_used_at = NOW()
  WHERE id = p_account_id
    AND first_report_used_at IS NULL;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;

-- Same fix for try_claim_first_report
CREATE OR REPLACE FUNCTION public.try_claim_first_report(p_account_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER  -- Changed from SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_account_id != auth.uid() AND NOT public.has_role_on_account(p_account_id) THEN
    RETURN 'UNAUTHORIZED';
  END IF;

  UPDATE public.accounts
  SET first_report_used_at = NOW()
  WHERE id = p_account_id
    AND first_report_used_at IS NULL;

  IF FOUND THEN
    RETURN 'CLAIMED';
  ELSE
    RETURN 'ALREADY_USED';
  END IF;
END;
$$;
```

## Why SECURITY DEFINER Works

| Aspect | SECURITY INVOKER | SECURITY DEFINER |
|--------|------------------|------------------|
| RLS | Applies to function's queries | Bypassed |
| Runs as | Calling user | Function owner |
| Auth check | Must be in function | Must be in function |
| Use when | RLS is sufficient | Need cross-user access |

With SECURITY DEFINER:
1. Internal auth check validates caller has legitimate access
2. Once authorized, UPDATE bypasses RLS
3. `first_report_used_at` is properly set
4. User can only claim first report once

## Prevention Strategies

### Code Review Checklist

1. **Type Safety**
   - [ ] Return types match source column types exactly
   - [ ] Use BIGINT for any token/count columns
   - [ ] Explicit casts: `COALESCE(col, 0)::bigint`

2. **Security Context Decision**
   - [ ] Does function need to access data across users/teams?
   - [ ] If yes → SECURITY DEFINER with internal auth check
   - [ ] If no → SECURITY INVOKER (RLS sufficient)

3. **SECURITY DEFINER Requirements**
   - [ ] Authorization check is FIRST operation
   - [ ] `SET search_path = public` to prevent injection
   - [ ] Document why DEFINER is needed

4. **Silent Failure Detection**
   - [ ] Don't treat "0 rows affected" as success
   - [ ] Log when expected updates don't happen
   - [ ] Consider throwing errors instead of returning false

### Best Practices

```sql
-- Pattern: SECURITY DEFINER with auth check
CREATE OR REPLACE FUNCTION my_sensitive_function(p_account_id UUID)
RETURNS ...
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- Always set for DEFINER
AS $$
BEGIN
  -- Authorization FIRST
  IF NOT (
    p_account_id = auth.uid() OR
    public.has_role_on_account(p_account_id) OR
    public.is_super_admin()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Now safe to proceed with elevated privileges
  ...
END;
$$;
```

## Testing

To verify the fix works:

```sql
-- Check a user's first_report_used_at
SELECT id, email, first_report_used_at
FROM accounts a
JOIN auth.users u ON u.id = a.id
WHERE u.email = 'test@example.com';

-- Manually set for testing
UPDATE accounts
SET first_report_used_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
```

## Related Files

- `apps/web/app/app/_lib/server/usage.service.ts` - checkUsageAllowed, markFirstReportUsed
- `apps/web/app/app/_lib/server/hybrid-reports-server-actions.ts` - calls markFirstReportUsed
- `apps/web/supabase/schemas/03-accounts.sql` - RLS policies on accounts
- `apps/web/supabase/schemas/17-usage-periods.sql` - BIGINT column definitions
