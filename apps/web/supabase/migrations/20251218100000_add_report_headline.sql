-- Add headline column to sparlo_reports
-- AI-generated scannable headline for completed reports

ALTER TABLE sparlo_reports ADD COLUMN IF NOT EXISTS headline text;

-- Create index for headline search
CREATE INDEX IF NOT EXISTS idx_sparlo_reports_headline ON sparlo_reports USING gin(to_tsvector('english', coalesce(headline, '') || ' ' || coalesce(title, '')));

COMMENT ON COLUMN sparlo_reports.headline IS 'AI-generated scannable headline (4-8 words) describing the core technical challenge';
