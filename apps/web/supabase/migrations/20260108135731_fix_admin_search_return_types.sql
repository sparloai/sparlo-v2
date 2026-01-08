-- Fix admin_search_users_by_email to use BIGINT return types
-- This matches the actual column types in usage_periods table and prevents overflow errors

-- Must drop first because we're changing return types
DROP FUNCTION IF EXISTS admin_search_users_by_email(text);

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
