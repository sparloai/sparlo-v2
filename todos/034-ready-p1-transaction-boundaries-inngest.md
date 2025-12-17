---
status: ready
priority: p1
issue_id: "034"
tags: [database, data-integrity, inngest, transactions]
dependencies: []
---

# Add Transaction Boundaries in Inngest Function

Database updates happen without transaction boundaries, risking partial state corruption.

## Problem Statement

The `generate-report.ts` Inngest function makes multiple database updates during report generation without wrapping them in transactions. If an error occurs mid-update:
- Report status may be inconsistent
- `report_data` partially updated
- `current_phase` not matching actual state
- Difficult to recover or retry

## Findings

- File: `apps/web/lib/inngest/functions/generate-report.ts`
- Multiple `.update()` calls scattered through function
- No transaction boundaries between related updates
- Inngest retries may cause duplicate partial updates

**Current pattern (vulnerable):**
```typescript
// Update 1: status
await client.from('sparlo_reports').update({ status: 'processing' }).eq('id', reportId);

// ... LLM call that might fail ...

// Update 2: data (may never run if LLM fails)
await client.from('sparlo_reports').update({ report_data: data }).eq('id', reportId);

// If LLM fails, status is 'processing' but no data - inconsistent!
```

## Proposed Solutions

### Option 1: Use Supabase RPC for Atomic Updates (Recommended)

**Approach:** Create a database function for atomic state updates.

```sql
-- Migration
CREATE OR REPLACE FUNCTION update_report_state(
  p_report_id UUID,
  p_status TEXT DEFAULT NULL,
  p_current_phase TEXT DEFAULT NULL,
  p_phase_progress INTEGER DEFAULT NULL,
  p_report_data JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE sparlo_reports SET
    status = COALESCE(p_status, status),
    current_phase = COALESCE(p_current_phase, current_phase),
    phase_progress = COALESCE(p_phase_progress, phase_progress),
    report_data = COALESCE(p_report_data, report_data),
    error_message = COALESCE(p_error_message, error_message),
    updated_at = NOW()
  WHERE id = p_report_id;
END;
$$ LANGUAGE plpgsql;
```

```typescript
// Usage in Inngest
await client.rpc('update_report_state', {
  p_report_id: reportId,
  p_status: 'processing',
  p_current_phase: 'AN0',
  p_phase_progress: 25,
});
```

**Pros:**
- Single atomic update
- All fields updated together or none
- Simpler error handling
- Can add validation in DB function

**Cons:**
- Requires migration
- Less flexible than raw updates

**Effort:** 2-3 hours

**Risk:** Low

---

### Option 2: Wrap Related Updates in Single Update Call

**Approach:** Combine related field updates into single `.update()` call.

```typescript
// ✅ Single atomic update
await client.from('sparlo_reports').update({
  status: 'processing',
  current_phase: 'AN0',
  phase_progress: 25,
  report_data: newData,
}).eq('id', reportId);
```

**Pros:**
- No migration needed
- Simple change
- Still atomic at row level

**Cons:**
- Must remember to combine updates
- Doesn't help with cross-table updates

**Effort:** 1 hour

**Risk:** Low

## Recommended Action

Implement Option 2 immediately, Option 1 for production:

**Immediate:** Consolidate updates into single `.update()` calls where possible
**Follow-up:** Create `update_report_state` RPC for standardized updates

## Technical Details

**Affected files:**
- `apps/web/lib/inngest/functions/generate-report.ts`
- Create: `apps/web/supabase/migrations/20251217_add_update_report_state.sql`

**Current update locations:**
- After AN0 clarification check (~line 150)
- After each phase completion (~lines 180, 220, 260, etc.)
- On error (~line 500)
- On completion (~line 520)

## Acceptance Criteria

- [ ] Related updates consolidated into single `.update()` calls
- [ ] RPC function created for standardized updates (follow-up)
- [ ] No partial state possible on error
- [ ] Inngest retries don't cause duplicate updates
- [ ] Report state always consistent

## Work Log

### 2025-12-16 - Data Integrity Review Discovery

**By:** Claude Code (Data Integrity Guardian Agent)

**Actions:**
- Identified scattered updates without transaction boundaries
- Analyzed failure scenarios and inconsistent state risks
- Documented atomic update patterns for Supabase

**Learnings:**
- Single `.update()` call is atomic at row level in PostgreSQL
- RPC functions provide better encapsulation for complex updates
- Inngest retries require idempotent database operations
