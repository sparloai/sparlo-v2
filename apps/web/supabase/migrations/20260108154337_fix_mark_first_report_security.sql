-- Fix mark_first_report_used to use SECURITY DEFINER
-- The function already has proper authorization checks, but SECURITY INVOKER
-- causes RLS to block the UPDATE even when auth check passes.
-- Using SECURITY DEFINER allows the UPDATE to bypass RLS after the auth check.

CREATE OR REPLACE FUNCTION public.mark_first_report_used(p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_updated INT;
BEGIN
  -- Authorization check: caller must own this account or have access via team membership
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

-- Also fix try_claim_first_report for the same reason
CREATE OR REPLACE FUNCTION public.try_claim_first_report(p_account_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorization check: caller must own this account or have access via team membership
  IF p_account_id != auth.uid() AND NOT public.has_role_on_account(p_account_id) THEN
    RETURN 'UNAUTHORIZED';
  END IF;

  -- Atomic update with row-level lock
  UPDATE public.accounts
  SET first_report_used_at = NOW()
  WHERE id = p_account_id
    AND first_report_used_at IS NULL;

  -- Check if we actually updated (claimed) the row
  IF FOUND THEN
    RETURN 'CLAIMED';
  ELSE
    RETURN 'ALREADY_USED';
  END IF;
END;
$$;
