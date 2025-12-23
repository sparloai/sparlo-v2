-- Migration: Add expires_at column to report_shares
-- This enables share link expiration and fixes the missing column error

-- Add expires_at column with default 30-day expiry from creation
ALTER TABLE public.report_shares
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ
    DEFAULT (NOW() + INTERVAL '30 days');

-- Backfill existing rows to expire 30 days from creation
UPDATE public.report_shares
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL;

-- Make expires_at NOT NULL after backfill
ALTER TABLE public.report_shares
  ALTER COLUMN expires_at SET NOT NULL;

-- Create index for efficient expiry lookups
CREATE INDEX IF NOT EXISTS idx_report_shares_expires_at
  ON public.report_shares(expires_at)
  WHERE revoked_at IS NULL;
