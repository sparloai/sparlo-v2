-- Fix authorization in mark_first_report_used function
-- Security issue: Any authenticated user could mark another user's first report as used

CREATE OR REPLACE FUNCTION public.mark_first_report_used(p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
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
