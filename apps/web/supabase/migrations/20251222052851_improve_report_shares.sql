-- Migration: Improve report_shares table
-- Adds UNIQUE constraint, audit columns, and splits RLS policies

-- Add UNIQUE constraint on report_id (prevents duplicate shares per report)
-- First drop the existing non-unique index
DROP INDEX IF EXISTS idx_report_shares_report_id;

-- Create unique index
CREATE UNIQUE INDEX idx_report_shares_report_id ON report_shares(report_id);

-- Add audit columns
ALTER TABLE report_shares
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS access_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

-- Create index for active shares lookup (excludes revoked)
CREATE INDEX IF NOT EXISTS idx_report_shares_active
  ON report_shares(share_token)
  WHERE revoked_at IS NULL;

-- Drop the existing catch-all policy
DROP POLICY IF EXISTS "report_shares_owner_manage" ON report_shares;

-- Create separate policies for better security and performance

-- Read access: Team members can view shares for their reports
CREATE POLICY "report_shares_select" ON report_shares
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sparlo_reports r
      WHERE r.id = report_shares.report_id
      AND (
        r.account_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM accounts_memberships m
          WHERE m.account_id = r.account_id
          AND m.user_id = auth.uid()
        )
      )
    )
  );

-- Insert access: Team members can create shares for their reports
CREATE POLICY "report_shares_insert" ON report_shares
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sparlo_reports r
      WHERE r.id = report_shares.report_id
      AND (
        r.account_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM accounts_memberships m
          WHERE m.account_id = r.account_id
          AND m.user_id = auth.uid()
        )
      )
    )
  );

-- Update access: Team members can update shares (for revocation)
CREATE POLICY "report_shares_update" ON report_shares
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sparlo_reports r
      WHERE r.id = report_shares.report_id
      AND (
        r.account_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM accounts_memberships m
          WHERE m.account_id = r.account_id
          AND m.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sparlo_reports r
      WHERE r.id = report_shares.report_id
      AND (
        r.account_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM accounts_memberships m
          WHERE m.account_id = r.account_id
          AND m.user_id = auth.uid()
        )
      )
    )
  );

-- Delete access: Team members can delete shares for their reports
CREATE POLICY "report_shares_delete" ON report_shares
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sparlo_reports r
      WHERE r.id = report_shares.report_id
      AND (
        r.account_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM accounts_memberships m
          WHERE m.account_id = r.account_id
          AND m.user_id = auth.uid()
        )
      )
    )
  );
