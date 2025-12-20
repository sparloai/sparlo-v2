-- ============================================================================
-- Billing Webhook Support: Idempotency + Usage Reset
-- ============================================================================

-- Table for tracking processed webhook events (prevents duplicate processing)
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_event_id
  ON public.processed_webhook_events(event_id);

-- Auto-cleanup old events (keep 30 days) - index for scheduled cleanup
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_created_at
  ON public.processed_webhook_events(created_at);

-- RLS: Only service_role can access this table (webhooks use admin client)
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- No policies for authenticated users - only admin client can access
COMMENT ON TABLE public.processed_webhook_events IS
  'Tracks processed Stripe webhook events for idempotency. Only accessible via service_role.';

-- ============================================================================
-- Reset Usage Period Function (for billing cycle reset)
-- ============================================================================

-- SECURITY: This function uses SECURITY DEFINER but is NOT granted to authenticated users.
-- Only the admin client (service_role) should call this from webhook handlers.
CREATE OR REPLACE FUNCTION public.reset_usage_period(
  p_account_id UUID,
  p_tokens_limit BIGINT,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark any existing active period as completed
  UPDATE public.usage_periods
  SET status = 'completed',
      updated_at = NOW()
  WHERE account_id = p_account_id
    AND status = 'active';

  -- Create new active period
  INSERT INTO public.usage_periods (
    account_id,
    period_start,
    period_end,
    tokens_limit,
    tokens_used,
    reports_count,
    chat_tokens_used,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_account_id,
    p_period_start,
    p_period_end,
    p_tokens_limit,
    0,
    0,
    0,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (account_id) WHERE status = 'active'
  DO UPDATE SET
    tokens_limit = EXCLUDED.tokens_limit,
    period_start = EXCLUDED.period_start,
    period_end = EXCLUDED.period_end,
    updated_at = NOW();
END;
$$;

-- SECURITY FIX: Only grant to service_role, NOT authenticated users
-- This prevents any authenticated user from resetting anyone's usage
REVOKE ALL ON FUNCTION public.reset_usage_period(UUID, BIGINT, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_usage_period(UUID, BIGINT, TIMESTAMPTZ, TIMESTAMPTZ) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reset_usage_period(UUID, BIGINT, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

COMMENT ON FUNCTION public.reset_usage_period IS
  'Resets usage period for an account. Called by webhook handler only (service_role).';

-- ============================================================================
-- Helper Functions for Webhook Idempotency (service_role only)
-- ============================================================================

-- Check if a webhook event has been processed
CREATE OR REPLACE FUNCTION public.check_webhook_processed(p_event_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.processed_webhook_events WHERE event_id = p_event_id
  );
END;
$$;

-- Mark a webhook event as processed
CREATE OR REPLACE FUNCTION public.mark_webhook_processed(
  p_event_id TEXT,
  p_event_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.processed_webhook_events (event_id, event_type, processed_at)
  VALUES (p_event_id, p_event_type, NOW())
  ON CONFLICT (event_id) DO NOTHING;
END;
$$;

-- Grant to service_role only
REVOKE ALL ON FUNCTION public.check_webhook_processed(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_webhook_processed(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_webhook_processed(TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.mark_webhook_processed(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_webhook_processed(TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.mark_webhook_processed(TEXT, TEXT) TO service_role;
