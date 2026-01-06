-- DD Mode v2: Idempotency Tracking for Token Usage

CREATE TABLE IF NOT EXISTS public.token_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  tokens integer NOT NULL,
  report_id uuid REFERENCES public.sparlo_reports(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_token_usage_events_created_at
  ON public.token_usage_events (created_at);

CREATE INDEX IF NOT EXISTS idx_token_usage_events_account_id
  ON public.token_usage_events (account_id);

ALTER TABLE public.token_usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only" ON public.token_usage_events;
CREATE POLICY "Service role only" ON public.token_usage_events
  FOR ALL USING (false);
