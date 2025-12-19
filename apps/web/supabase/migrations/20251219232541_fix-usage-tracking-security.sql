-- Fix usage tracking security and data integrity issues
-- Addresses: P1-071, P1-072, P1-073, P1-075, P2-076, P2-078, P2-079

-- ============================================================================
-- P1-073: Change CASCADE DELETE to RESTRICT (preserve billing data)
-- ============================================================================
ALTER TABLE usage_periods
  DROP CONSTRAINT IF EXISTS usage_periods_account_id_fkey;

ALTER TABLE usage_periods
  ADD CONSTRAINT usage_periods_account_id_fkey
    FOREIGN KEY (account_id)
    REFERENCES accounts(id)
    ON DELETE RESTRICT;

-- ============================================================================
-- P1-072: Add CHECK constraints for non-negative values
-- ============================================================================
ALTER TABLE usage_periods
  ADD CONSTRAINT usage_periods_tokens_non_negative CHECK (tokens_used >= 0),
  ADD CONSTRAINT usage_periods_reports_non_negative CHECK (reports_count >= 0),
  ADD CONSTRAINT usage_periods_chat_tokens_non_negative CHECK (chat_tokens_used >= 0),
  ADD CONSTRAINT usage_periods_limit_positive CHECK (tokens_limit > 0);

-- ============================================================================
-- P2-076: Add missing subscription indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_subscription_items_variant_id
  ON public.subscription_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_account_active
  ON public.subscriptions(account_id)
  WHERE active = true;

-- ============================================================================
-- P2-078: Add historical usage query function
-- ============================================================================
CREATE OR REPLACE FUNCTION get_usage_history(
  p_account_id UUID,
  p_limit INTEGER DEFAULT 12
)
RETURNS TABLE (
  id UUID,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  tokens_used BIGINT,
  tokens_limit BIGINT,
  reports_count INTEGER,
  chat_tokens_used BIGINT,
  status TEXT
)
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    id,
    period_start,
    period_end,
    tokens_used,
    tokens_limit,
    reports_count,
    chat_tokens_used,
    status
  FROM usage_periods
  WHERE account_id = p_account_id
  ORDER BY period_start DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_usage_history(UUID, INTEGER) TO authenticated;

-- Add index for historical queries
CREATE INDEX IF NOT EXISTS idx_usage_periods_history
  ON usage_periods(account_id, period_start DESC)
  WHERE status = 'completed';

-- ============================================================================
-- P1-071 & P1-072: Fix SECURITY DEFINER functions with authorization + validation
-- ============================================================================

-- Fix get_or_create_usage_period with authorization
CREATE OR REPLACE FUNCTION get_or_create_usage_period(
  p_account_id UUID,
  p_tokens_limit BIGINT DEFAULT 3000000
)
RETURNS usage_periods
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_period public.usage_periods;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- P1-071: Authorization check - caller must have access to this account
  IF p_account_id != auth.uid() AND NOT public.has_role_on_account(p_account_id) THEN
    RAISE EXCEPTION 'Unauthorized: You do not have access to this account';
  END IF;

  -- Try to get existing active period
  SELECT * INTO v_period
  FROM public.usage_periods
  WHERE account_id = p_account_id AND status = 'active'
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_period IS NOT NULL THEN
    -- Check if period has expired
    IF v_period.period_end <= NOW() THEN
      -- Atomic check-and-set with WHERE clause to prevent double-complete
      UPDATE public.usage_periods
      SET status = 'completed', updated_at = NOW()
      WHERE id = v_period.id
        AND status = 'active'
        AND period_end <= NOW();

      v_period := NULL;
    ELSE
      RETURN v_period;
    END IF;
  END IF;

  -- P2-079: Try to align with subscription billing period
  SELECT period_starts_at, period_ends_at INTO v_period_start, v_period_end
  FROM public.subscriptions
  WHERE account_id = p_account_id
    AND active = true
    AND status IN ('active', 'trialing')
  ORDER BY period_starts_at DESC
  LIMIT 1;

  -- Fall back to calendar month if no subscription
  IF v_period_start IS NULL THEN
    v_period_start := DATE_TRUNC('month', NOW());
    v_period_end := DATE_TRUNC('month', NOW()) + INTERVAL '1 month';
  END IF;

  -- Use INSERT with ON CONFLICT to handle race conditions
  INSERT INTO public.usage_periods (account_id, period_start, period_end, tokens_limit, status)
  VALUES (p_account_id, v_period_start, v_period_end, p_tokens_limit, 'active')
  ON CONFLICT (account_id) WHERE status = 'active'
  DO NOTHING;

  -- Fetch the period (either newly created or existing from conflict)
  SELECT * INTO v_period
  FROM public.usage_periods
  WHERE account_id = p_account_id AND status = 'active'
  LIMIT 1;

  RETURN v_period;
END;
$$;

-- Fix increment_usage with authorization + validation
CREATE OR REPLACE FUNCTION increment_usage(
  p_account_id UUID,
  p_tokens BIGINT,
  p_is_report BOOLEAN DEFAULT FALSE,
  p_is_chat BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new_total BIGINT;
  v_limit BIGINT;
  v_reports_count INTEGER;
  v_chat_tokens BIGINT;
  v_percentage NUMERIC;
BEGIN
  -- P1-071: Authorization check - caller must have access to this account
  IF p_account_id != auth.uid() AND NOT public.has_role_on_account(p_account_id) THEN
    RAISE EXCEPTION 'Unauthorized: You do not have access to this account';
  END IF;

  -- P1-072: Validate positive token value
  IF p_tokens <= 0 THEN
    RAISE EXCEPTION 'Invalid token value: must be positive (got %)', p_tokens;
  END IF;

  -- P1-072: Validate token value is reasonable (DoS prevention)
  IF p_tokens > 1000000 THEN  -- Max 1M tokens per call (~$15)
    RAISE EXCEPTION 'Token value exceeds maximum allowed: %', p_tokens;
  END IF;

  -- Ensure period exists first (idempotent, handles race conditions)
  PERFORM public.get_or_create_usage_period(p_account_id, 3000000);

  -- Atomic increment with RETURNING (single statement = no race condition)
  UPDATE public.usage_periods
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

-- ============================================================================
-- P1-075: Add token reservation functions for TOCTOU protection
-- ============================================================================

-- Reserve tokens atomically (prevents concurrent bypass)
CREATE OR REPLACE FUNCTION reserve_usage(
  p_account_id UUID,
  p_tokens BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_period public.usage_periods;
  v_new_total BIGINT;
  v_remaining BIGINT;
  v_percentage NUMERIC;
BEGIN
  -- Authorization check
  IF p_account_id != auth.uid() AND NOT public.has_role_on_account(p_account_id) THEN
    RAISE EXCEPTION 'Unauthorized: You do not have access to this account';
  END IF;

  -- Validate positive token value
  IF p_tokens <= 0 THEN
    RAISE EXCEPTION 'Invalid token value: must be positive (got %)', p_tokens;
  END IF;

  -- Ensure period exists
  PERFORM public.get_or_create_usage_period(p_account_id, 3000000);

  -- Atomically check AND increment in single operation
  -- This prevents TOCTOU race condition
  UPDATE public.usage_periods
  SET
    tokens_used = tokens_used + p_tokens,
    updated_at = NOW()
  WHERE account_id = p_account_id
    AND status = 'active'
    AND tokens_used + p_tokens <= tokens_limit  -- Enforce limit in UPDATE
  RETURNING * INTO v_period;

  IF NOT FOUND THEN
    -- Either no period or would exceed limit - check which
    SELECT * INTO v_period
    FROM public.usage_periods
    WHERE account_id = p_account_id AND status = 'active'
    LIMIT 1;

    IF v_period IS NULL THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'no_active_period'
      );
    END IF;

    v_remaining := v_period.tokens_limit - v_period.tokens_used;
    v_percentage := ROUND((v_period.tokens_used::numeric / v_period.tokens_limit) * 100, 1);

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'limit_exceeded',
      'tokens_used', v_period.tokens_used,
      'tokens_limit', v_period.tokens_limit,
      'remaining', v_remaining,
      'percentage', v_percentage,
      'requested', p_tokens
    );
  END IF;

  v_remaining := v_period.tokens_limit - v_period.tokens_used;
  v_percentage := ROUND((v_period.tokens_used::numeric / v_period.tokens_limit) * 100, 1);

  RETURN jsonb_build_object(
    'allowed', true,
    'reserved', p_tokens,
    'tokens_used', v_period.tokens_used,
    'tokens_limit', v_period.tokens_limit,
    'remaining', v_remaining,
    'percentage', v_percentage,
    'period_end', v_period.period_end
  );
END;
$$;

-- Finalize usage with actual tokens (adjusts difference from reserved)
CREATE OR REPLACE FUNCTION finalize_usage(
  p_account_id UUID,
  p_reserved_tokens BIGINT,
  p_actual_tokens BIGINT,
  p_is_report BOOLEAN DEFAULT FALSE,
  p_is_chat BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_adjustment BIGINT;
  v_period public.usage_periods;
BEGIN
  -- Authorization check
  IF p_account_id != auth.uid() AND NOT public.has_role_on_account(p_account_id) THEN
    RAISE EXCEPTION 'Unauthorized: You do not have access to this account';
  END IF;

  -- Calculate adjustment (actual - reserved)
  v_adjustment := p_actual_tokens - p_reserved_tokens;

  -- Adjust tokens and increment counters
  UPDATE public.usage_periods
  SET
    tokens_used = tokens_used + v_adjustment,
    reports_count = reports_count + CASE WHEN p_is_report THEN 1 ELSE 0 END,
    chat_tokens_used = chat_tokens_used + CASE WHEN p_is_chat THEN p_actual_tokens ELSE 0 END,
    updated_at = NOW()
  WHERE account_id = p_account_id AND status = 'active'
  RETURNING * INTO v_period;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active usage period for account %', p_account_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'adjustment', v_adjustment,
    'tokens_used', v_period.tokens_used,
    'tokens_limit', v_period.tokens_limit,
    'reports_count', v_period.reports_count
  );
END;
$$;

-- Release reserved tokens (for cancelled/failed operations)
CREATE OR REPLACE FUNCTION release_usage(
  p_account_id UUID,
  p_tokens BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_period public.usage_periods;
BEGIN
  -- Authorization check
  IF p_account_id != auth.uid() AND NOT public.has_role_on_account(p_account_id) THEN
    RAISE EXCEPTION 'Unauthorized: You do not have access to this account';
  END IF;

  -- Validate positive token value
  IF p_tokens <= 0 THEN
    RAISE EXCEPTION 'Invalid token value: must be positive (got %)', p_tokens;
  END IF;

  -- Release tokens (subtract from used)
  UPDATE public.usage_periods
  SET
    tokens_used = GREATEST(0, tokens_used - p_tokens),  -- Prevent negative
    updated_at = NOW()
  WHERE account_id = p_account_id AND status = 'active'
  RETURNING * INTO v_period;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active usage period for account %', p_account_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'released', p_tokens,
    'tokens_used', v_period.tokens_used,
    'tokens_limit', v_period.tokens_limit
  );
END;
$$;

-- Grant execute on new functions
GRANT EXECUTE ON FUNCTION reserve_usage(UUID, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_usage(UUID, BIGINT, BIGINT, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION release_usage(UUID, BIGINT) TO authenticated;

-- ============================================================================
-- Add updated_at trigger for usage_periods
-- ============================================================================
CREATE OR REPLACE FUNCTION update_usage_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_usage_periods_updated_at ON usage_periods;
CREATE TRIGGER update_usage_periods_updated_at
  BEFORE UPDATE ON usage_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_periods_updated_at();
