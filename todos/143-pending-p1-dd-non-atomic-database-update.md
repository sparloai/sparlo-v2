---
status: pending
priority: p1
issue_id: "143"
tags: [data-integrity, dd-mode, database, atomicity, critical]
dependencies: []
---

# DD Mode v2: Non-Atomic Database Update - Data Loss Risk

## Problem Statement

The final database update writes all chain results in a single operation without transaction protection or partial state recovery. If this single UPDATE fails after 10 chain steps complete successfully, ALL computed results are permanently lost - hours of LLM computation (~$50 in API costs) wasted with no recovery possible.

## Findings

**Location:** `/apps/web/lib/inngest/functions/generate-dd-report.ts:860-875`

**Vulnerable code:**
```typescript
await updateProgress({
  status: 'complete',
  current_step: 'complete',
  phase_progress: 100,
  title: generatedTitle,
  headline,
  report_data: {
    mode: 'dd',
    version: '2.0.0',
    report: dd5Result.result,
    claim_extraction: dd0Result.result,
    // ... all 10 step results in single update
  },
});
```

**Data loss scenario:**
1. All 10 chain steps complete successfully (15-30 minutes, $50 cost)
2. Final `updateProgress()` call starts
3. Network failure during update
4. Supabase UPDATE fails (error logged but not thrown)
5. Report status remains "processing" indefinitely
6. ALL computed results permanently lost

**Evidence of silent failure:**
```typescript
// Line 250-262 - updateProgress does NOT throw on error
if (error) {
  console.error('Failed to update progress:', error);  // Only logs
}
```

## Proposed Solutions

### Option A: Database Transaction + Atomic RPC (Recommended)
- Create PostgreSQL function with explicit transaction
- Single atomic operation for all updates
- Automatic rollback on failure
- Pros: Strongest guarantee, proper atomicity
- Cons: Requires new database function
- Effort: Medium (3-4 hours)
- Risk: Low

### Option B: Checkpointing
- Store intermediate results after each step
- Enable resume from last checkpoint on retry
- Pros: No wasted work on failure
- Cons: More complex, more DB writes
- Effort: High (1-2 days)
- Risk: Medium

### Option C: Throw on Update Failure
- Change `updateProgress` to throw on error
- Let Inngest retry handle recovery
- Pros: Simple change
- Cons: Doesn't prevent data loss, just surfaces it
- Effort: Low (30 minutes)
- Risk: Low

## Recommended Action

[To be filled during triage]

## Acceptance Criteria

- [ ] Final update uses atomic database transaction
- [ ] Failure throws error instead of silent logging
- [ ] Inngest retry can recover from partial failures
- [ ] Report never stuck in "processing" state indefinitely
- [ ] Token usage increment included in atomic operation
- [ ] Tests verify atomic behavior

## Technical Details

**Affected files:**
- `apps/web/lib/inngest/functions/generate-dd-report.ts`
- New database function needed

**Recommended atomic RPC:**
```sql
CREATE FUNCTION complete_dd_report_atomic(
  p_report_id uuid,
  p_report_data jsonb,
  p_token_usage jsonb
) RETURNS void AS $$
BEGIN
  UPDATE sparlo_reports
  SET report_data = p_report_data,
      status = 'complete',
      updated_at = now()
  WHERE id = p_report_id;

  PERFORM increment_usage_with_lock(...);

  -- Implicit commit at end of function
EXCEPTION
  WHEN OTHERS THEN
    RAISE;  -- Automatic rollback
END;
$$ LANGUAGE plpgsql;
```

## Work Log

### 2026-01-03 - Issue Created

**By:** Claude Code

**Actions:**
- Identified during DD Mode v2 data integrity review
- Analyzed failure scenarios and data loss impact
- Proposed atomic transaction approach

**Learnings:**
- Silent error logging is dangerous for critical operations
- Expensive multi-step processes need atomic completion guarantees
