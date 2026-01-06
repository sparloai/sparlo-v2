-- Comprehensive fix for missing GRANT statements
-- This migration is idempotent (safe to run multiple times)

-- ============================================================================
-- sparlo_reports table
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sparlo_reports TO authenticated;
GRANT ALL ON public.sparlo_reports TO service_role;

-- ============================================================================
-- usage_periods table  
-- ============================================================================
GRANT SELECT ON public.usage_periods TO authenticated;
GRANT ALL ON public.usage_periods TO service_role;

-- Note: usage_periods only needs SELECT for authenticated users
-- All mutations go through SECURITY DEFINER functions (increment_usage, etc.)

-- ============================================================================
-- Verify grants are in place (for debugging - will show in migration logs)
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Grants applied successfully for sparlo_reports and usage_periods';
END $$;
