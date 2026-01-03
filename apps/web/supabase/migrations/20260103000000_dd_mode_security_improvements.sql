-- DD Mode v2 Security & Performance Improvements
-- This migration adds:
-- 1. JSONB indexes for version/mode queries
-- 2. Idempotency tracking for token usage
-- 3. Atomic report completion function
-- 4. Rate limiting support table

-- =============================================================================
-- 1. JSONB Indexes for sparlo_reports
-- =============================================================================

-- Index on report_data->>'version' for migration queries
-- Note: Using regular CREATE INDEX instead of CONCURRENTLY for migration compatibility
CREATE INDEX IF NOT EXISTS idx_sparlo_reports_version
  ON public.sparlo_reports ((report_data->>'version'));

-- Index on report_data->>'mode' for filtering by report type
CREATE INDEX IF NOT EXISTS idx_sparlo_reports_mode
  ON public.sparlo_reports ((report_data->>'mode'));

-- Compound index for mode + version queries
CREATE INDEX IF NOT EXISTS idx_sparlo_reports_mode_version
  ON public.sparlo_reports ((report_data->>'mode'), (report_data->>'version'));

-- =============================================================================
-- 2. Idempotency Tracking for Token Usage
-- =============================================================================

-- Table to track processed token usage events (prevents double-counting on retries)
CREATE TABLE IF NOT EXISTS public.token_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  tokens integer NOT NULL,
  report_id uuid REFERENCES public.sparlo_reports(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for cleanup of old idempotency records
CREATE INDEX IF NOT EXISTS idx_token_usage_events_created_at
  ON public.token_usage_events (created_at);

-- Index for account lookups
CREATE INDEX IF NOT EXISTS idx_token_usage_events_account_id
  ON public.token_usage_events (account_id);

-- RLS policies
ALTER TABLE public.token_usage_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (internal use only)
CREATE POLICY "Service role only" ON public.token_usage_events
  FOR ALL USING (false);

-- =============================================================================
-- 3. Idempotent Token Usage Increment Function
-- =============================================================================

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
AS $$
DECLARE
  v_already_processed boolean;
  v_result jsonb;
BEGIN
  -- Check if this operation was already processed
  SELECT EXISTS(
    SELECT 1 FROM public.token_usage_events
    WHERE idempotency_key = p_idempotency_key
  ) INTO v_already_processed;

  IF v_already_processed THEN
    -- Already processed - return success without incrementing
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'tokens', p_tokens
    );
  END IF;

  -- Record idempotency key first (this also provides row-level locking via unique constraint)
  INSERT INTO public.token_usage_events (idempotency_key, account_id, tokens, report_id)
  VALUES (p_idempotency_key, p_account_id, p_tokens, p_report_id)
  ON CONFLICT (idempotency_key) DO NOTHING;

  -- Check if insert succeeded (another concurrent request might have inserted)
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'tokens', p_tokens
    );
  END IF;

  -- Call the existing increment_usage function
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
$$;

-- =============================================================================
-- 4. Atomic Report Completion Function
-- =============================================================================

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
  -- Verify report exists and belongs to account
  SELECT EXISTS(
    SELECT 1 FROM public.sparlo_reports
    WHERE id = p_report_id AND account_id = p_account_id
  ) INTO v_report_exists;

  IF NOT v_report_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Report not found or unauthorized'
    );
  END IF;

  -- Update report atomically
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
    -- Report might already be complete or in wrong state
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Report not in processing state or already completed'
    );
  END IF;

  -- Increment token usage with idempotency
  SELECT public.increment_usage_idempotent(
    p_account_id := p_account_id,
    p_tokens := p_total_tokens,
    p_idempotency_key := p_idempotency_key,
    p_report_id := p_report_id,
    p_is_report := true,
    p_is_chat := false
  ) INTO v_usage_result;

  RETURN jsonb_build_object(
    'success', true,
    'usage_result', v_usage_result
  );
END;
$$;

-- =============================================================================
-- 5. Rate Limiting Support Table
-- =============================================================================

-- Table to track rate limit windows per account per resource
CREATE TABLE IF NOT EXISTS public.rate_limit_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  resource_type text NOT NULL, -- 'dd_report', 'hybrid_report', etc.
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  UNIQUE (account_id, resource_type, window_start)
);

-- Index for rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_windows_lookup
  ON public.rate_limit_windows (account_id, resource_type, window_start);

-- RLS policies
ALTER TABLE public.rate_limit_windows ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Service role only" ON public.rate_limit_windows
  FOR ALL USING (false);

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_account_id uuid,
  p_resource_type text,
  p_limit integer,
  p_window_minutes integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start timestamptz;
  v_current_count integer;
  v_allowed boolean;
BEGIN
  -- Calculate the start of the current window
  v_window_start := date_trunc('hour', now()) +
    (floor(extract(minute from now()) / p_window_minutes) * p_window_minutes) * interval '1 minute';

  -- Try to insert or increment the counter
  INSERT INTO public.rate_limit_windows (account_id, resource_type, window_start, request_count)
  VALUES (p_account_id, p_resource_type, v_window_start, 1)
  ON CONFLICT (account_id, resource_type, window_start)
  DO UPDATE SET request_count = rate_limit_windows.request_count + 1
  RETURNING request_count INTO v_current_count;

  v_allowed := v_current_count <= p_limit;

  -- If not allowed, decrement the counter (we shouldn't have counted this request)
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
$$;

-- =============================================================================
-- 6. Cleanup Job for Old Data
-- =============================================================================

-- Function to clean up old idempotency and rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_tracking_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete idempotency records older than 7 days
  DELETE FROM public.token_usage_events
  WHERE created_at < now() - interval '7 days';

  -- Delete rate limit windows older than 24 hours
  DELETE FROM public.rate_limit_windows
  WHERE window_start < now() - interval '24 hours';
END;
$$;

-- =============================================================================
-- 7. Grant Permissions
-- =============================================================================

-- Grant execute on new functions to authenticated users (functions use SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION public.increment_usage_idempotent TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_dd_report_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_tracking_records TO service_role;
