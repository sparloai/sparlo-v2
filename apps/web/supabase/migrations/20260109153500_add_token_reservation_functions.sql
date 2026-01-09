-- Update check_usage_allowed to include reserved tokens from in-progress reports
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

GRANT EXECUTE ON FUNCTION try_reserve_tokens_for_report TO authenticated;
