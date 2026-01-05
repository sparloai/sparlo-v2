-- DD Mode v2: Idempotent Token Usage Increment Function

CREATE OR REPLACE FUNCTION public.increment_usage_idempotent(
  p_account_id uuid,
  p_tokens integer,
  p_idempotency_key text,
  p_report_id uuid DEFAULT NULL,
  p_is_report boolean DEFAULT true,
  p_is_chat boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $increment_usage_idempotent$
DECLARE
  v_already_processed boolean;
  v_result jsonb;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.token_usage_events
    WHERE idempotency_key = p_idempotency_key
  ) INTO v_already_processed;

  IF v_already_processed THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'tokens', p_tokens
    );
  END IF;

  INSERT INTO public.token_usage_events (idempotency_key, account_id, tokens, report_id)
  VALUES (p_idempotency_key, p_account_id, p_tokens, p_report_id)
  ON CONFLICT (idempotency_key) DO NOTHING;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'tokens', p_tokens
    );
  END IF;

  PERFORM public.increment_usage(
    p_account_id := p_account_id,
    p_tokens := p_tokens,
    p_is_report := p_is_report,
    p_is_chat := p_is_chat
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_processed', false,
    'tokens', p_tokens
  );
END;
$increment_usage_idempotent$;

GRANT EXECUTE ON FUNCTION public.increment_usage_idempotent(uuid, integer, text, uuid, boolean, boolean) TO authenticated;
