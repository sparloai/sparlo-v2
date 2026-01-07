-- DD Mode v2: Cleanup Function for Old Data

CREATE OR REPLACE FUNCTION public.cleanup_old_tracking_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $cleanup_old_tracking_records$
BEGIN
  DELETE FROM public.token_usage_events
  WHERE created_at < now() - interval '7 days';

  DELETE FROM public.rate_limit_windows
  WHERE window_start < now() - interval '24 hours';
END;
$cleanup_old_tracking_records$;

GRANT EXECUTE ON FUNCTION public.cleanup_old_tracking_records() TO service_role;
