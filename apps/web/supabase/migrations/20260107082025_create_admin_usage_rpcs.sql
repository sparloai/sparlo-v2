-- Rate limiting helper
CREATE OR REPLACE FUNCTION check_admin_adjustment_rate_limit(
  p_admin_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recent_count integer;
BEGIN
  -- Max 50 adjustments per admin per hour
  SELECT COUNT(*) INTO v_recent_count
  FROM token_limit_adjustments
  WHERE admin_user_id = p_admin_user_id
    AND created_at > NOW() - INTERVAL '1 hour';

  IF v_recent_count >= 50 THEN
    RAISE EXCEPTION 'Rate limit exceeded: maximum 50 adjustments per hour';
  END IF;
END;
$$;

-- Main adjustment function
CREATE OR REPLACE FUNCTION adjust_usage_period_limit(
  p_account_id uuid,
  p_additional_tokens integer,
  p_admin_user_id uuid,
  p_reason_type text,
  p_reason_details text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period usage_periods%ROWTYPE;
  v_old_limit integer;
  v_new_limit integer;
  v_cumulative_adjustments integer;
BEGIN
  -- Rate limit check
  PERFORM check_admin_adjustment_rate_limit(p_admin_user_id);

  -- Validate reason type
  IF p_reason_type NOT IN ('error_refund', 'upgrade_bonus', 'support_request', 'other') THEN
    RAISE EXCEPTION 'Invalid reason type: %', p_reason_type;
  END IF;

  -- Get current period for account (lock row)
  SELECT * INTO v_period
  FROM usage_periods
  WHERE account_id = p_account_id
    AND NOW() BETWEEN period_start AND period_end
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active usage period found for account';
  END IF;

  -- Calculate cumulative adjustments this period
  SELECT COALESCE(SUM(tokens_added), 0) INTO v_cumulative_adjustments
  FROM token_limit_adjustments
  WHERE usage_period_id = v_period.id;

  -- Safety cap: max 100M cumulative adjustments per period
  IF v_cumulative_adjustments + p_additional_tokens > 100000000 THEN
    RAISE EXCEPTION 'Cumulative adjustments would exceed 100M token safety limit (current: %)', v_cumulative_adjustments;
  END IF;

  v_old_limit := v_period.tokens_limit;
  v_new_limit := v_old_limit + p_additional_tokens;

  -- Validate new limit makes sense
  IF v_new_limit < v_period.tokens_used THEN
    RAISE EXCEPTION 'New limit (%) cannot be less than current usage (%)', v_new_limit, v_period.tokens_used;
  END IF;

  -- Update the limit
  UPDATE usage_periods
  SET tokens_limit = v_new_limit,
      updated_at = NOW()
  WHERE id = v_period.id;

  -- Log the adjustment
  INSERT INTO token_limit_adjustments (
    admin_user_id,
    usage_period_id,
    account_id,
    old_limit,
    new_limit,
    tokens_added,
    reason_type,
    reason_details
  ) VALUES (
    p_admin_user_id,
    v_period.id,
    p_account_id,
    v_old_limit,
    v_new_limit,
    p_additional_tokens,
    p_reason_type,
    p_reason_details
  );

  RETURN jsonb_build_object(
    'success', true,
    'period_id', v_period.id,
    'old_limit', v_old_limit,
    'new_limit', v_new_limit,
    'tokens_used', v_period.tokens_used
  );
END;
$$;

-- Search users by email (includes subscription status from existing join)
CREATE OR REPLACE FUNCTION admin_search_users_by_email(p_email text)
RETURNS TABLE (
  user_id uuid,
  email text,
  account_id uuid,
  account_name text,
  is_personal_account boolean,
  created_at timestamptz,
  tokens_used bigint,
  tokens_limit bigint,
  period_start timestamptz,
  period_end timestamptz,
  subscription_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id as user_id,
    u.email::text,
    a.id as account_id,
    a.name as account_name,
    a.is_personal_account,
    u.created_at,
    COALESCE(up.tokens_used, 0)::bigint as tokens_used,
    COALESCE(up.tokens_limit, 0)::bigint as tokens_limit,
    up.period_start,
    up.period_end,
    COALESCE(s.status::text, 'none') as subscription_status
  FROM auth.users u
  JOIN accounts_memberships am ON am.user_id = u.id
  JOIN accounts a ON a.id = am.account_id
  LEFT JOIN usage_periods up ON up.account_id = a.id
    AND NOW() BETWEEN up.period_start AND up.period_end
  LEFT JOIN subscriptions s ON s.account_id = a.id AND s.active = true
  WHERE LOWER(u.email) = LOWER(TRIM(p_email))
  ORDER BY a.is_personal_account DESC, a.created_at DESC;
END;
$$;
