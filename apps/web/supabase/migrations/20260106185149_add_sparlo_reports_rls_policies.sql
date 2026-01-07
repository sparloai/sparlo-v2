-- Add RLS policies for sparlo_reports table
-- Users can only access their own reports (account_id = auth.uid())

-- Enable RLS if not already enabled
ALTER TABLE public.sparlo_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own reports" ON public.sparlo_reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON public.sparlo_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON public.sparlo_reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON public.sparlo_reports;
DROP POLICY IF EXISTS "Service role full access" ON public.sparlo_reports;

-- SELECT: Users can read their own reports
CREATE POLICY "Users can view own reports" ON public.sparlo_reports
  FOR SELECT TO authenticated
  USING (account_id = auth.uid());

-- INSERT: Users can create reports for themselves
CREATE POLICY "Users can insert own reports" ON public.sparlo_reports
  FOR INSERT TO authenticated
  WITH CHECK (account_id = auth.uid());

-- UPDATE: Users can update their own reports
CREATE POLICY "Users can update own reports" ON public.sparlo_reports
  FOR UPDATE TO authenticated
  USING (account_id = auth.uid())
  WITH CHECK (account_id = auth.uid());

-- DELETE: Users can delete their own reports
CREATE POLICY "Users can delete own reports" ON public.sparlo_reports
  FOR DELETE TO authenticated
  USING (account_id = auth.uid());

-- Service role bypass for backend operations (Inngest, etc.)
CREATE POLICY "Service role full access" ON public.sparlo_reports
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'RLS policies created for sparlo_reports';
END $$;
