---
status: pending
priority: p2
issue_id: "090"
tags: [usage-tracking, reliability, inngest]
dependencies: []
---

# No Idempotency Protection for Token Increments

Retried Inngest functions can double-count token usage due to missing idempotency keys.

## Problem Statement

Inngest functions may be retried on transient failures. If `incrementUsage()` is called and the function retries:

1. Usage is incremented again for the same report
2. User charged for tokens they didn't consume
3. No way to detect or prevent double-counting
4. Silent billing errors

## Findings

- `incrementUsage()` has no idempotency protection
- Inngest retries on network failures, timeouts
- Report ID could serve as idempotency key
- No deduplication mechanism in current design

## Proposed Solutions

### Option 1: Report-Based Idempotency Key

**Approach:** Store report_id with usage increment, reject duplicates.

**Pros:**
- Prevents double-counting
- Simple to implement
- Uses existing data

**Cons:**
- Requires schema addition

**Effort:** 1-2 hours

**Risk:** Low

**Implementation:**
```sql
ALTER TABLE usage_periods ADD COLUMN processed_reports jsonb DEFAULT '[]';

-- In increment_usage():
IF p_report_id = ANY(SELECT jsonb_array_elements_text(processed_reports)
                     FROM usage_periods WHERE ...) THEN
  RETURN; -- Already processed, skip
END IF;
```

---

### Option 2: Separate Usage Log Table

**Approach:** Create a usage_log table with unique constraint on report_id.

**Pros:**
- Clear audit trail
- Natural idempotency via unique constraint

**Cons:**
- Additional table
- More complex aggregation

**Effort:** 2-3 hours

**Risk:** Low

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/supabase/migrations/` - New migration needed
- `apps/web/lib/inngest/functions/generate-report.ts` - Pass report_id
- `apps/web/app/home/(user)/_lib/server/usage.service.ts` - Accept report_id

## Acceptance Criteria

- [ ] Retried increments don't double-count
- [ ] Report ID tracked with usage
- [ ] Duplicate attempts silently succeed (idempotent)
- [ ] Typecheck passes

## Work Log

### 2025-12-19 - Initial Discovery

**By:** Claude Code (Data Integrity Guardian)

**Actions:**
- Analyzed Inngest retry behavior
- Identified missing idempotency protection
- Proposed report-based deduplication

**Learnings:**
- Inngest functions should be idempotent
- Usage tracking needs deduplication
- Report ID is natural idempotency key

## Notes

- IMPORTANT for billing accuracy
- Should be implemented with usage tracking fix
- Consider usage_log table for better auditing
