-- Sparlo Reports V2 Enhancements
-- Adds team account support and additional columns for Inngest integration

-- Add new columns for V2
ALTER TABLE sparlo_reports ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE sparlo_reports ADD COLUMN IF NOT EXISTS clarifications jsonb DEFAULT '[]'::jsonb;
ALTER TABLE sparlo_reports ADD COLUMN IF NOT EXISTS phase_progress integer DEFAULT 0;
ALTER TABLE sparlo_reports ADD COLUMN IF NOT EXISTS inngest_run_id text;
ALTER TABLE sparlo_reports ADD COLUMN IF NOT EXISTS error_message text;

-- Create index for created_by lookups
CREATE INDEX IF NOT EXISTS sparlo_reports_created_by_idx ON sparlo_reports(created_by);

-- Drop old personal-account-only RLS policies
DROP POLICY IF EXISTS "Users can view their own reports" ON sparlo_reports;
DROP POLICY IF EXISTS "Users can insert their own reports" ON sparlo_reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON sparlo_reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON sparlo_reports;

-- Create new team-account-aware RLS policies
-- Uses accounts_memberships to check if user is a member of the account

CREATE POLICY "Team members can view reports"
  ON sparlo_reports
  FOR SELECT
  USING (
    -- Personal account (account_id = user's personal account = auth.uid())
    account_id = auth.uid()
    OR
    -- Team account (user is a member of the account)
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert reports"
  ON sparlo_reports
  FOR INSERT
  WITH CHECK (
    -- Personal account
    account_id = auth.uid()
    OR
    -- Team account membership
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update reports"
  ON sparlo_reports
  FOR UPDATE
  USING (
    -- Personal account
    account_id = auth.uid()
    OR
    -- Team account membership
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can delete reports"
  ON sparlo_reports
  FOR DELETE
  USING (
    -- Personal account
    account_id = auth.uid()
    OR
    -- Team account membership
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Drop and recreate count function to support team accounts
DROP FUNCTION IF EXISTS public.count_completed_reports(uuid);

CREATE FUNCTION public.count_completed_reports(target_account_id uuid)
RETURNS integer AS $$
  SELECT count(*)::integer
  FROM public.sparlo_reports
  WHERE account_id = target_account_id AND status = 'complete' AND archived = false;
$$ LANGUAGE sql SECURITY INVOKER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.count_completed_reports(uuid) TO authenticated;
