-- Add partial indexes for archived column to optimize filtered queries
-- These indexes are critical for performance at scale (10K+ reports per user)

-- Index for active (non-archived) reports - used by main dashboard
CREATE INDEX IF NOT EXISTS idx_sparlo_reports_active
  ON public.sparlo_reports(account_id, created_at DESC)
  WHERE archived = false;

-- Index for archived reports - used by archived page
CREATE INDEX IF NOT EXISTS idx_sparlo_reports_archived
  ON public.sparlo_reports(account_id, updated_at DESC)
  WHERE archived = true;

-- Comment explaining the indexes
COMMENT ON INDEX public.idx_sparlo_reports_active IS
  'Partial index for active reports dashboard - filters archived=false';
COMMENT ON INDEX public.idx_sparlo_reports_archived IS
  'Partial index for archived reports page - filters archived=true';
