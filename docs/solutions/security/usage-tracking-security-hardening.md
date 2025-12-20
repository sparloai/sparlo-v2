# Usage Tracking Security Hardening

**Solution Documentation**

Security hardening for token-based usage tracking (P1/P2 fixes).

## P1 Issues Fixed

| Issue | Solution |
|-------|----------|
| Missing authorization | Added auth checks in SECURITY DEFINER |
| No input validation | CHECK constraints for non-negative |
| CASCADE DELETE | Changed to RESTRICT for billing data |

## P2 Issues Fixed

| Issue | Solution |
|-------|----------|
| TOCTOU vulnerability | Reserve/finalize/release pattern |
| Missing indexes | Added composite indexes |
| Period misalignment | Aligned with subscription dates |

## TOCTOU Protection Pattern

```sql
-- Step 1: Reserve before operation
SELECT reserve_usage(account_id, estimated_tokens);

-- Step 2: Run expensive operation
-- ...

-- Step 3a: Finalize on success
SELECT finalize_usage(reservation_id, actual_tokens);

-- Step 3b: Release on failure
SELECT release_usage(reservation_id);
```

## Authorization Pattern

```sql
IF NOT (
  auth.uid() = p_account_id OR
  public.has_role_on_account(p_account_id) OR
  public.is_super_admin()
) THEN
  RAISE EXCEPTION 'Not authorized';
END IF;
```

## Key Files

- `/apps/web/supabase/migrations/20251219232541_fix-usage-tracking-security.sql`

**Version**: 1.0 | **Updated**: 2025-12-19
