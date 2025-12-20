---
status: completed
priority: p2
issue_id: "078"
tags: [code-review, agent-native, feature-gap]
dependencies: []
---

# No Historical Usage Query Capability

## Problem Statement

The `usage_periods` table stores historical data (completed periods), but there's no RPC function or API to query it. Only the active period is accessible. This prevents:

1. "How much did I use in November?" queries
2. Month-over-month usage comparison
3. Usage trend analysis
4. Agent-assisted usage optimization

**Why it matters:** Historical data exists but is completely inaccessible. This affects both human users and AI agents trying to help users understand their usage patterns.

## Findings

### Evidence from Agent-Native Review

**Current State:**
- `check_usage_allowed` - Only returns active period
- No `get_usage_history` function
- No `/api/usage/history` endpoint
- RLS allows SELECT but no query mechanism exposed

**Impact:**
- Agent-Native Score: 44% (4/9 capabilities accessible)
- Users cannot verify billing accuracy
- No programmatic access for analytics
- Cannot export usage reports

## Proposed Solutions

### Solution 1: Add RPC Function for History (Recommended)
**Pros:** Simple, follows existing patterns
**Cons:** None
**Effort:** Small (1-2 hours)
**Risk:** Low

```sql
CREATE OR REPLACE FUNCTION get_usage_history(
  p_account_id UUID,
  p_limit INTEGER DEFAULT 12
)
RETURNS TABLE (
  id UUID,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  tokens_used BIGINT,
  tokens_limit BIGINT,
  reports_count INTEGER,
  status TEXT
)
LANGUAGE SQL SECURITY INVOKER AS $$
  SELECT id, period_start, period_end, tokens_used, tokens_limit, reports_count, status
  FROM usage_periods
  WHERE account_id = p_account_id
  ORDER BY period_start DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_usage_history TO authenticated;
```

### Solution 2: Add REST API Endpoint
**Pros:** Enables external integration
**Cons:** Additional code
**Effort:** Medium (2-3 hours)
**Risk:** Low

## Recommended Action

Implement Solution 1 first, then optionally add API endpoint.

## Technical Details

**Affected files:**
- `apps/web/supabase/migrations/` - New function
- Optionally: `apps/web/app/api/usage/history/route.ts`

## Acceptance Criteria

- [ ] RPC function `get_usage_history` exists
- [ ] Returns last N billing periods
- [ ] Respects RLS (user can only see own history)
- [ ] API endpoint exposes history (optional)

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-19 | Created | From agent-native review |

## Resources

- PR Branch: `feat/token-based-usage-tracking`
- Agent-Native Review Agent: Identified as P1 severity
