-- Usage periods table (one per billing cycle)
-- Denormalized for fast reads at scale (like Claude's usage tracking)
CREATE TABLE IF NOT EXISTS usage_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- Period boundaries (aligned with subscription billing)
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Token limits (from subscription tier)
  tokens_limit BIGINT NOT NULL DEFAULT 3000000, -- Tier 1 default

  -- Current usage (denormalized for fast reads)
  tokens_used BIGINT NOT NULL DEFAULT 0,
  reports_count INTEGER NOT NULL DEFAULT 0,
  chat_tokens_used BIGINT NOT NULL DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_period CHECK (period_end > period_start)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_periods_account ON usage_periods(account_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_usage_periods_active ON usage_periods(account_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_usage_periods_expiration ON usage_periods(period_end) WHERE status = 'active';

-- Unique constraint: only one active period per account (prevents race condition duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_periods_unique_active
  ON usage_periods(account_id)
  WHERE status = 'active';

-- RLS policies
ALTER TABLE usage_periods ENABLE ROW LEVEL SECURITY;

-- Users can view their own active usage period
CREATE POLICY "Users can view own usage period"
  ON usage_periods FOR SELECT
  USING (
    account_id = auth.uid()
    OR public.has_role_on_account(account_id)
  );

-- Function to get or create active usage period (handles race conditions with ON CONFLICT)
CREATE OR REPLACE FUNCTION get_or_create_usage_period(
  p_account_id UUID,
  p_tokens_limit BIGINT DEFAULT 3000000
)
RETURNS usage_periods
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period usage_periods;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Try to get existing active period
  SELECT * INTO v_period
  FROM usage_periods
  WHERE account_id = p_account_id AND status = 'active'
  FOR UPDATE SKIP LOCKED  -- Prevent race conditions
  LIMIT 1;

  IF v_period IS NOT NULL THEN
    -- Check if period has expired
    IF v_period.period_end <= NOW() THEN
      -- Mark as completed
      UPDATE usage_periods SET status = 'completed', updated_at = NOW()
      WHERE id = v_period.id;
      v_period := NULL;
    ELSE
      RETURN v_period;
    END IF;
  END IF;

  -- Create new period (start of current month to start of next month)
  v_period_start := DATE_TRUNC('month', NOW());
  v_period_end := DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

  -- Use INSERT with ON CONFLICT to handle race conditions
  INSERT INTO usage_periods (account_id, period_start, period_end, tokens_limit, status)
  VALUES (p_account_id, v_period_start, v_period_end, p_tokens_limit, 'active')
  ON CONFLICT (account_id) WHERE status = 'active'
  DO UPDATE SET updated_at = NOW()  -- No-op update to return the existing row
  RETURNING * INTO v_period;

  RETURN v_period;
END;
$$;

-- Function to increment usage atomically (race-condition safe)
CREATE OR REPLACE FUNCTION increment_usage(
  p_account_id UUID,
  p_tokens BIGINT,
  p_is_report BOOLEAN DEFAULT FALSE,
  p_is_chat BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_total BIGINT;
  v_limit BIGINT;
  v_reports_count INTEGER;
  v_chat_tokens BIGINT;
  v_percentage NUMERIC;
BEGIN
  -- Ensure period exists first (idempotent, handles race conditions)
  PERFORM get_or_create_usage_period(p_account_id, 3000000);

  -- Atomic increment with RETURNING (single statement = no race condition)
  UPDATE usage_periods
  SET
    tokens_used = tokens_used + p_tokens,
    reports_count = reports_count + CASE WHEN p_is_report THEN 1 ELSE 0 END,
    chat_tokens_used = chat_tokens_used + CASE WHEN p_is_chat THEN p_tokens ELSE 0 END,
    updated_at = NOW()
  WHERE account_id = p_account_id AND status = 'active'
  RETURNING
    tokens_used,
    tokens_limit,
    reports_count,
    chat_tokens_used
  INTO v_new_total, v_limit, v_reports_count, v_chat_tokens;

  -- Handle case where no active period (shouldn't happen after get_or_create, but defensive)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active usage period for account %', p_account_id;
  END IF;

  v_percentage := ROUND((v_new_total::numeric / v_limit) * 100, 1);

  RETURN jsonb_build_object(
    'tokens_used', v_new_total,
    'tokens_limit', v_limit,
    'reports_count', v_reports_count,
    'chat_tokens_used', v_chat_tokens,
    'percentage', v_percentage
  );
END;
$$;

-- Function to check if usage is allowed (includes reserved tokens from in-progress reports)
CREATE OR REPLACE FUNCTION check_usage_allowed(
  p_account_id UUID,
  p_estimated_tokens BIGINT DEFAULT 180000 -- ~1 report worth
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_period usage_periods;
  v_reserved BIGINT;
  v_available BIGINT;
  v_percentage NUMERIC;
BEGIN
  SELECT * INTO v_period
  FROM usage_periods
  WHERE account_id = p_account_id AND status = 'active'
  LIMIT 1;

  IF v_period IS NULL THEN
    -- No period yet, allow (will be created on first use)
    RETURN jsonb_build_object(
      'allowed', true,
      'tokens_used', 0,
      'tokens_limit', 3000000,
      'remaining', 3000000,
      'tokens_reserved', 0,
      'percentage', 0.0,
      'reports_count', 0,
      'chat_tokens_used', 0,
      'period_end', DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
    );
  END IF;

  -- Calculate reserved tokens from in-progress reports
  SELECT COALESCE(SUM(tokens_reserved), 0) INTO v_reserved
  FROM sparlo_reports
  WHERE account_id = p_account_id
    AND status IN ('pending', 'processing', 'clarifying');

  -- Available = limit - used - reserved
  v_available := v_period.tokens_limit - v_period.tokens_used - v_reserved;
  v_percentage := ROUND((v_period.tokens_used::numeric / v_period.tokens_limit) * 100, 1);

  RETURN jsonb_build_object(
    'allowed', v_available >= p_estimated_tokens,
    'tokens_used', v_period.tokens_used,
    'tokens_limit', v_period.tokens_limit,
    'remaining', v_available,
    'tokens_reserved', v_reserved,
    'percentage', v_percentage,
    'reports_count', v_period.reports_count,
    'chat_tokens_used', v_period.chat_tokens_used,
    'period_end', v_period.period_end
  );
END;
$$;

-- Atomic check-and-reserve for starting a report
-- Returns NULL if insufficient tokens, otherwise returns the tokens to reserve
CREATE OR REPLACE FUNCTION try_reserve_tokens_for_report(
  p_account_id UUID,
  p_estimated_tokens BIGINT DEFAULT 350000
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period usage_periods;
  v_reserved BIGINT;
  v_available BIGINT;
BEGIN
  -- Lock the account's period row to prevent concurrent reservations
  SELECT * INTO v_period
  FROM usage_periods
  WHERE account_id = p_account_id AND status = 'active'
  FOR UPDATE;

  -- Get or create period if none exists
  IF v_period IS NULL THEN
    v_period := get_or_create_usage_period(p_account_id, 3000000);
  END IF;

  -- Calculate reserved from in-progress reports (this is consistent due to FOR UPDATE)
  SELECT COALESCE(SUM(tokens_reserved), 0) INTO v_reserved
  FROM sparlo_reports
  WHERE account_id = p_account_id
    AND status IN ('pending', 'processing', 'clarifying');

  v_available := v_period.tokens_limit - v_period.tokens_used - v_reserved;

  IF v_available < p_estimated_tokens THEN
    -- Insufficient tokens
    RETURN NULL;
  END IF;

  -- Return the amount to reserve (caller will set tokens_reserved on report insert)
  RETURN p_estimated_tokens;
END;
$$;

GRANT EXECUTE ON FUNCTION get_or_create_usage_period TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_allowed TO authenticated;
GRANT EXECUTE ON FUNCTION try_reserve_tokens_for_report TO authenticated;
