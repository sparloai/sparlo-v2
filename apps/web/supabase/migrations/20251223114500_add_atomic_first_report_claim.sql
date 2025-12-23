-- Migration: Add atomic first report claim function
-- Prevents race condition where two concurrent requests could both claim the first free report

-- New function that atomically claims the first report if available
-- Returns 'CLAIMED' if successfully claimed, 'ALREADY_USED' if already claimed,
-- 'UNAUTHORIZED' if no access to account
CREATE OR REPLACE FUNCTION public.try_claim_first_report(p_account_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  was_null BOOLEAN;
BEGIN
  -- Authorization check: caller must own this account or have access via team membership
  IF p_account_id != auth.uid() AND NOT public.has_role_on_account(p_account_id) THEN
    RETURN 'UNAUTHORIZED';
  END IF;

  -- Atomic update with row-level lock
  -- Uses FOR UPDATE to prevent concurrent claims
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

-- Grant to authenticated users
GRANT EXECUTE ON FUNCTION public.try_claim_first_report(UUID) TO authenticated;
