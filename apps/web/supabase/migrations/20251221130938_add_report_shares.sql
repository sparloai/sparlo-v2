-- Minimal share token table for public report sharing
CREATE TABLE public.report_shares (
  share_token UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.sparlo_reports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for looking up shares by report
CREATE INDEX idx_report_shares_report_id ON report_shares(report_id);

-- RLS: Owners can manage shares for their reports
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_shares_owner_manage" ON report_shares
  FOR ALL TO authenticated
  USING (
    report_id IN (
      SELECT id FROM sparlo_reports
      WHERE account_id = auth.uid()
      OR account_id IN (
        SELECT account_id FROM accounts_memberships WHERE user_id = auth.uid()
      )
    )
  );
