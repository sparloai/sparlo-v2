-- Add mode column to sparlo_reports for faster dashboard loading
-- This extracts mode from report_data JSONB to avoid loading large column

-- Add mode column with default 'standard'
ALTER TABLE public.sparlo_reports
ADD COLUMN IF NOT EXISTS mode text DEFAULT 'standard';

-- Backfill existing reports from report_data JSONB
UPDATE public.sparlo_reports
SET mode = COALESCE(report_data->>'mode', 'standard')
WHERE mode IS NULL OR mode = 'standard';

-- Create index for filtering by mode
CREATE INDEX IF NOT EXISTS idx_sparlo_reports_mode
ON public.sparlo_reports (mode);

-- Add comment
COMMENT ON COLUMN public.sparlo_reports.mode IS 'Report mode: discovery or standard';
