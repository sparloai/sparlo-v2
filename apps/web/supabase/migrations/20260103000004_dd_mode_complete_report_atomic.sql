CREATE OR REPLACE FUNCTION public.complete_dd_report_atomic(
  p_report_id uuid,
  p_report_data jsonb,
  p_title text,
  p_headline text,
  p_account_id uuid,
  p_total_tokens integer,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage_result jsonb;
  v_report_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.sparlo_reports
    WHERE id = p_report_id AND account_id = p_account_id
  ) INTO v_report_exists;

  IF NOT v_report_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Report not found or unauthorized');
  END IF;

  UPDATE public.sparlo_reports
  SET
    status = 'complete',
    current_step = 'complete',
    phase_progress = 100,
    title = p_title,
    headline = p_headline,
    report_data = p_report_data,
    updated_at = now()
  WHERE id = p_report_id
    AND account_id = p_account_id
    AND status = 'processing';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Report not in processing state or already completed');
  END IF;

  SELECT public.increment_usage_idempotent(
    p_account_id,
    p_total_tokens,
    p_idempotency_key,
    p_report_id,
    true,
    false
  ) INTO v_usage_result;

  RETURN jsonb_build_object('success', true, 'usage_result', v_usage_result);
END;
$$;
