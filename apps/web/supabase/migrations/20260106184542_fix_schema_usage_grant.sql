-- Fix schema-level permissions for authenticated role
-- Error: "permission denied for schema public"

-- Grant USAGE on public schema (required to access any objects in the schema)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Ensure the authenticated role can use sequences (for auto-generated IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Re-apply table grants to be safe
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sparlo_reports TO authenticated;
GRANT ALL ON public.sparlo_reports TO service_role;

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Schema and table grants applied for authenticated role';
END $$;
