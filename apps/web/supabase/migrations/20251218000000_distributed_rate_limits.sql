-- Distributed rate limiting table for API endpoints
-- Works across all server instances in serverless/load-balanced environments

CREATE TABLE IF NOT EXISTS rate_limits (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_type TEXT NOT NULL CHECK (window_type IN ('hour', 'day')),
  request_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, endpoint, window_type)
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits (window_start);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own rate limit records
CREATE POLICY "Users can view own rate limits"
  ON rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rate limits"
  ON rate_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rate limits"
  ON rate_limits FOR UPDATE
  USING (auth.uid() = user_id);

/**
 * Check and increment rate limit atomically.
 * Returns whether the request is allowed and current counts.
 *
 * Uses UPSERT for atomic check-and-increment in a single query.
 * Window resets happen automatically when window_start is stale.
 */
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_hourly_limit INTEGER DEFAULT 30,
  p_daily_limit INTEGER DEFAULT 150
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hour_count INTEGER;
  v_day_count INTEGER;
  v_hour_reset TIMESTAMPTZ;
  v_day_reset TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
  v_hour_window_start TIMESTAMPTZ := DATE_TRUNC('hour', v_now);
  v_day_window_start TIMESTAMPTZ := DATE_TRUNC('day', v_now);
BEGIN
  -- Upsert hourly counter with window reset logic
  INSERT INTO rate_limits (user_id, endpoint, window_type, window_start, request_count)
  VALUES (p_user_id, p_endpoint, 'hour', v_hour_window_start, 1)
  ON CONFLICT (user_id, endpoint, window_type) DO UPDATE
  SET
    request_count = CASE
      WHEN rate_limits.window_start < v_hour_window_start THEN 1
      ELSE rate_limits.request_count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < v_hour_window_start THEN v_hour_window_start
      ELSE rate_limits.window_start
    END
  RETURNING request_count, window_start + INTERVAL '1 hour' INTO v_hour_count, v_hour_reset;

  -- Upsert daily counter with window reset logic
  INSERT INTO rate_limits (user_id, endpoint, window_type, window_start, request_count)
  VALUES (p_user_id, p_endpoint, 'day', v_day_window_start, 1)
  ON CONFLICT (user_id, endpoint, window_type) DO UPDATE
  SET
    request_count = CASE
      WHEN rate_limits.window_start < v_day_window_start THEN 1
      ELSE rate_limits.request_count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < v_day_window_start THEN v_day_window_start
      ELSE rate_limits.window_start
    END
  RETURNING request_count, window_start + INTERVAL '1 day' INTO v_day_count, v_day_reset;

  -- Return result with allowed status and retry info
  RETURN jsonb_build_object(
    'allowed', v_hour_count <= p_hourly_limit AND v_day_count <= p_daily_limit,
    'hourCount', v_hour_count,
    'dayCount', v_day_count,
    'hourlyLimit', p_hourly_limit,
    'dailyLimit', p_daily_limit,
    'hourReset', EXTRACT(EPOCH FROM v_hour_reset)::INTEGER,
    'dayReset', EXTRACT(EPOCH FROM v_day_reset)::INTEGER,
    'retryAfter', CASE
      WHEN v_hour_count > p_hourly_limit THEN EXTRACT(EPOCH FROM (v_hour_reset - v_now))::INTEGER
      WHEN v_day_count > p_daily_limit THEN EXTRACT(EPOCH FROM (v_day_reset - v_now))::INTEGER
      ELSE NULL
    END
  );
END;
$$;

-- Cleanup function to remove old rate limit records (run periodically via pg_cron or external scheduler)
CREATE OR REPLACE FUNCTION cleanup_stale_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '2 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Grant execute permission on rate limit function
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
