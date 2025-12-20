-- Track first report usage per account for freemium billing model
-- First report is free, subsequent reports require subscription

ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS first_report_used_at TIMESTAMPTZ DEFAULT NULL;

-- Comment for clarity
COMMENT ON COLUMN public.accounts.first_report_used_at IS
  'Timestamp when the account used their free first report. NULL means not yet used.';

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_accounts_first_report_used
  ON public.accounts(first_report_used_at)
  WHERE first_report_used_at IS NOT NULL;

-- Function to mark first report as used (handles race conditions)
-- Returns true if marked, false if already marked
CREATE OR REPLACE FUNCTION public.mark_first_report_used(p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  rows_updated INT;
BEGIN
  UPDATE public.accounts
  SET first_report_used_at = NOW()
  WHERE id = p_account_id
    AND first_report_used_at IS NULL;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;

-- Grant to authenticated users
GRANT EXECUTE ON FUNCTION public.mark_first_report_used(UUID) TO authenticated;
