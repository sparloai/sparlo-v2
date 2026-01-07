-- Fix missing GRANT statements for sparlo_reports table
-- The table has RLS policies but was never granted to authenticated role

-- Grant table permissions to authenticated users
-- RLS policies will restrict which rows they can access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sparlo_reports TO authenticated;

-- Also grant to service_role for backend operations
GRANT ALL ON public.sparlo_reports TO service_role;
