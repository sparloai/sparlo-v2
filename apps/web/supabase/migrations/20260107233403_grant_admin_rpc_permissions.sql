-- Grant execute permissions on admin RPC functions to authenticated users
-- The functions themselves have SECURITY DEFINER and use is_super_admin() for authorization

GRANT EXECUTE ON FUNCTION admin_search_users_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION adjust_usage_period_limit(uuid, integer, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_admin_adjustment_rate_limit(uuid) TO authenticated;
