-- Fix RLS policies for sparlo_reports to support team accounts
-- Previous policy only allowed account_id = auth.uid() which doesn't work for team accounts
-- Now includes public.has_role_on_account(account_id) for team member access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own reports" ON public.sparlo_reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON public.sparlo_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON public.sparlo_reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON public.sparlo_reports;

-- SELECT: Users can read reports for accounts they have access to
CREATE POLICY "Users can view own reports" ON public.sparlo_reports
  FOR SELECT TO authenticated
  USING (
    account_id = auth.uid() OR
    public.has_role_on_account(account_id)
  );

-- INSERT: Users can create reports for accounts they have access to
CREATE POLICY "Users can insert own reports" ON public.sparlo_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    account_id = auth.uid() OR
    public.has_role_on_account(account_id)
  );

-- UPDATE: Users can update reports for accounts they have access to
CREATE POLICY "Users can update own reports" ON public.sparlo_reports
  FOR UPDATE TO authenticated
  USING (
    account_id = auth.uid() OR
    public.has_role_on_account(account_id)
  )
  WITH CHECK (
    account_id = auth.uid() OR
    public.has_role_on_account(account_id)
  );

-- DELETE: Users can delete reports for accounts they have access to
CREATE POLICY "Users can delete own reports" ON public.sparlo_reports
  FOR DELETE TO authenticated
  USING (
    account_id = auth.uid() OR
    public.has_role_on_account(account_id)
  );

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Updated RLS policies for sparlo_reports to support team accounts';
END $$;
