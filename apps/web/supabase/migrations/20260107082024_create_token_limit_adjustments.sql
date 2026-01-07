-- Audit table for token limit adjustments (specific, not generic)
CREATE TABLE token_limit_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,

  -- Who
  admin_user_id uuid NOT NULL,

  -- What was changed
  usage_period_id uuid REFERENCES usage_periods(id) ON DELETE CASCADE NOT NULL,
  account_id uuid NOT NULL,

  -- The change
  old_limit integer NOT NULL,
  new_limit integer NOT NULL,
  tokens_added integer NOT NULL,

  -- Why (structured)
  reason_type text NOT NULL,  -- 'error_refund', 'upgrade_bonus', 'support_request', 'other'
  reason_details text  -- Optional additional context
);

-- Indexes for common queries
CREATE INDEX idx_token_adjustments_created ON token_limit_adjustments(created_at DESC);
CREATE INDEX idx_token_adjustments_account ON token_limit_adjustments(account_id);
CREATE INDEX idx_token_adjustments_admin ON token_limit_adjustments(admin_user_id);

-- RLS: Only super admins can access
ALTER TABLE token_limit_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view adjustments"
  ON token_limit_adjustments FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can insert adjustments"
  ON token_limit_adjustments FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());
