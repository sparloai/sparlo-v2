-- Add tokens_reserved column to track per-report reservation
-- This prevents concurrent analyses from bypassing token limits
ALTER TABLE public.sparlo_reports
ADD COLUMN IF NOT EXISTS tokens_reserved BIGINT NOT NULL DEFAULT 0;

-- Index for efficient SUM aggregation when checking available tokens
CREATE INDEX IF NOT EXISTS idx_sparlo_reports_reserved_sum
ON sparlo_reports(account_id, status)
WHERE status IN ('pending', 'processing', 'clarifying');

COMMENT ON COLUMN sparlo_reports.tokens_reserved IS 'Estimated tokens reserved for this report. Used to prevent concurrent analyses from exceeding limits.';
