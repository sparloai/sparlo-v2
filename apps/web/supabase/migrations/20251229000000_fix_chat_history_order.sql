-- Migration: fix_chat_history_order
-- Fix chat message ordering to preserve chronological order instead of sorting alphabetically

CREATE OR REPLACE FUNCTION public.append_chat_messages(
  p_report_id UUID,
  p_messages JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_updated_history JSONB;
  v_max_messages INTEGER := 100;  -- Limit history to 100 messages (50 exchanges)
  v_current_history JSONB;
  v_new_messages JSONB;
  v_combined JSONB;
  v_total_count INTEGER;
BEGIN
  -- Get current history
  SELECT COALESCE(chat_history, '[]'::jsonb) INTO v_current_history
  FROM sparlo_reports
  WHERE id = p_report_id;

  -- Concatenate arrays (preserves order: existing + new)
  v_combined := v_current_history || p_messages;

  -- Count total messages
  v_total_count := jsonb_array_length(v_combined);

  -- If over limit, trim from the beginning (keep most recent)
  IF v_total_count > v_max_messages THEN
    v_combined := (
      SELECT jsonb_agg(elem)
      FROM (
        SELECT elem
        FROM jsonb_array_elements(v_combined) WITH ORDINALITY AS t(elem, ord)
        ORDER BY ord
        OFFSET (v_total_count - v_max_messages)
      ) trimmed
    );
  END IF;

  -- Atomic update
  UPDATE sparlo_reports
  SET chat_history = v_combined
  WHERE id = p_report_id
  RETURNING chat_history INTO v_updated_history;

  RETURN v_updated_history;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Comment explaining the fix
COMMENT ON FUNCTION public.append_chat_messages IS
'Atomically appends chat messages to a report, preserving chronological order.
Uses array concatenation to maintain insertion order (user question followed by assistant answer).
Automatically limits history to 100 messages (50 exchanges) by trimming oldest messages.
Uses SECURITY INVOKER so RLS policies on sparlo_reports are enforced.';
