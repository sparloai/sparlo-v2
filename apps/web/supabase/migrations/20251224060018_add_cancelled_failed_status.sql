-- Add 'cancelled' and 'failed' statuses to sparlo_reports
-- 'cancelled' - User cancelled report during processing/clarification
-- 'failed' - Report failed due to Claude refusal or other fatal error

-- Drop the old constraint (created inline with column definition)
ALTER TABLE public.sparlo_reports
DROP CONSTRAINT IF EXISTS triz_reports_status_check;

-- Add the new constraint with additional statuses
ALTER TABLE public.sparlo_reports
ADD CONSTRAINT sparlo_reports_status_check
CHECK (status IN ('clarifying', 'processing', 'complete', 'error', 'cancelled', 'failed', 'confirm_rerun'));
