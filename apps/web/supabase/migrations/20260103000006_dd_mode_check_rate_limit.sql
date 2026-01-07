-- DD Mode v2: Rate Limit Check Function
-- Named check_dd_rate_limit to avoid conflict with existing check_rate_limit function

CREATE OR REPLACE FUNCTION public.check_dd_rate_limit(
  p_account_id uuid,
  p_resource_type text,
  p_limit integer,
  p_window_minutes integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $check_dd_rate_limit$
DECLARE
  v_window_start timestamptz;
  v_current_count integer;
  v_allowed boolean;
BEGIN
  v_window_start := date_trunc('hour', now()) +
    (floor(extract(minute from now()) / p_window_minutes) * p_window_minutes) * interval '1 minute';

  INSERT INTO public.rate_limit_windows (account_id, resource_type, window_start, request_count)
  VALUES (p_account_id, p_resource_type, v_window_start, 1)
  ON CONFLICT (account_id, resource_type, window_start)
  DO UPDATE SET request_count = rate_limit_windows.request_count + 1
  RETURNING request_count INTO v_current_count;

  v_allowed := v_current_count <= p_limit;

  IF NOT v_allowed THEN
    UPDATE public.rate_limit_windows
    SET request_count = request_count - 1
    WHERE account_id = p_account_id
      AND resource_type = p_resource_type
      AND window_start = v_window_start;
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'current_count', CASE WHEN v_allowed THEN v_current_count ELSE v_current_count - 1 END,
    'limit', p_limit,
    'window_start', v_window_start,
    'window_end', v_window_start + (p_window_minutes * interval '1 minute'),
    'reset_at', v_window_start + (p_window_minutes * interval '1 minute')
  );
END;
$check_dd_rate_limit$;

GRANT EXECUTE ON FUNCTION public.check_dd_rate_limit(uuid, text, integer, integer) TO authenticated;
