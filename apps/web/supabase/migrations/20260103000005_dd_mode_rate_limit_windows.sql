-- DD Mode v2: Rate Limiting Support Table

CREATE TABLE IF NOT EXISTS public.rate_limit_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  UNIQUE (account_id, resource_type, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_windows_lookup
  ON public.rate_limit_windows (account_id, resource_type, window_start);

ALTER TABLE public.rate_limit_windows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only" ON public.rate_limit_windows;
CREATE POLICY "Service role only" ON public.rate_limit_windows
  FOR ALL USING (false);
