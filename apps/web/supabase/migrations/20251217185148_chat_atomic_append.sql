-- Migration: chat_atomic_append
-- P0-042: Add atomic JSONB append function to prevent race conditions on concurrent chat messages

-- Create function for atomic chat message append
-- This prevents lost updates when multiple messages are sent concurrently
CREATE OR REPLACE FUNCTION public.append_chat_messages(
  p_report_id UUID,
  p_messages JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_updated_history JSONB;
  v_max_messages INTEGER := 100;  -- P1-046: Limit history to 100 messages (50 exchanges)
BEGIN
  -- Atomic update: append messages and trim to max size in single operation
  UPDATE sparlo_reports
  SET chat_history = (
    SELECT jsonb_agg(msg)
    FROM (
      SELECT msg
      FROM (
        -- Get existing messages
        SELECT jsonb_array_elements(COALESCE(chat_history, '[]'::jsonb)) AS msg
        UNION ALL
        -- Add new messages
        SELECT jsonb_array_elements(p_messages) AS msg
      ) combined
      -- Keep only the last v_max_messages
      ORDER BY 1
    ) limited
    OFFSET GREATEST(0, (
      SELECT COUNT(*) FROM (
        SELECT 1 FROM jsonb_array_elements(COALESCE(chat_history, '[]'::jsonb))
        UNION ALL
        SELECT 1 FROM jsonb_array_elements(p_messages)
      ) total
    ) - v_max_messages)
  )
  WHERE id = p_report_id
  RETURNING chat_history INTO v_updated_history;

  -- Return the updated history (or null if report not found/not authorized)
  RETURN v_updated_history;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Grant execute permission to authenticated users
-- RLS on sparlo_reports table will enforce authorization
GRANT EXECUTE ON FUNCTION public.append_chat_messages(UUID, JSONB) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.append_chat_messages IS
'Atomically appends chat messages to a report, preventing race conditions on concurrent writes.
Automatically limits history to 100 messages (50 exchanges) to prevent unbounded growth.
Uses SECURITY INVOKER so RLS policies on sparlo_reports are enforced.';
