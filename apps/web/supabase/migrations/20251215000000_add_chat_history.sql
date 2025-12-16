-- Add chat_history column for persistent post-report Q&A
ALTER TABLE sparlo_reports ADD COLUMN chat_history JSONB DEFAULT '[]'::jsonb;
