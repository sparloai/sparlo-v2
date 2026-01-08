---
title: "Step-Level Token Tracking for Partial Billing"
category: features
tags: [tokens, billing, inngest, partial-billing, usage-tracking]
severity: moderate
date_documented: 2026-01-08
related:
  - token-based-usage-tracking.md
  - ../security/usage-tracking-security-hardening.md
  - ../integration-issues/inngest-report-cancellation.md
---

# Step-Level Token Tracking for Partial Billing

## Problem

Users were charged for full report token usage even when:
- Reports failed mid-generation
- Users cancelled reports partway through
- Inngest crashed during processing

This resulted in lost revenue on failures and unfair charges to users who didn't receive complete reports.

## Root Cause

The original implementation only tracked tokens in-memory during Inngest function execution, with a single database write at the very end:

```
Step 1 → Step 2 → Step 3 → ... → Step 7 → WRITE TO DB (all or nothing)
```

If anything failed before Step 7, zero tokens were recorded.

## Solution: DHH's Simple Approach

Instead of complex reservation systems, we added a single JSONB column to track tokens as they're consumed:

### 1. Database Migration

**File**: `apps/web/supabase/migrations/20260108000000_add_step_tokens_column.sql`

```sql
-- Add step_tokens column to track per-step token usage
ALTER TABLE public.sparlo_reports
ADD COLUMN IF NOT EXISTS step_tokens JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.sparlo_reports.step_tokens IS
  'Per-step token usage tracked during generation. Format: {"an0": 12345, "an1.5": 8900, ...}';
```

### 2. TypeScript Helper

**File**: `apps/web/lib/inngest/utils/step-tokens.ts`

```typescript
export async function persistStepTokens(
  reportId: string,
  stepName: string,
  usage: TokenUsage,
): Promise<void> {
  const supabase = getSupabaseServerAdminClient();

  // Read current, merge, write back
  const { data: report } = await supabase
    .from('sparlo_reports')
    .select('step_tokens')
    .eq('id', reportId)
    .single();

  const currentTokens = report?.step_tokens ?? {};
  const updatedTokens = { ...currentTokens, [stepName]: usage.totalTokens };

  await supabase
    .from('sparlo_reports')
    .update({ step_tokens: updatedTokens })
    .eq('id', reportId);
}

export async function sumStepTokens(reportId: string): Promise<number> {
  // Sum all values from step_tokens JSONB
}

export async function billCompletedStepsOnFailure(
  reportId: string,
  accountId: string,
  errorMessage: string,
): Promise<void> {
  const totalTokens = await sumStepTokens(reportId);
  if (totalTokens > 0) {
    await supabase.rpc('increment_usage', { ... });
  }
}
```

### 3. Integration with Inngest

**File**: `apps/web/lib/inngest/functions/generate-report.ts`

After each LLM call:
```typescript
const an0Result = await step.run('an0-problem-framing', async () => {
  const { content, usage } = await callClaude({ ... });

  // NEW: Persist immediately
  await persistStepTokens(reportId, 'an0', usage);

  return { result: validated, usage };
});
```

On failure:
```typescript
onFailure: async ({ error, event, step }) => {
  const { reportId, accountId } = failureEvent.event.data;

  await step.run('bill-completed-steps', async () => {
    await billCompletedStepsOnFailure(
      reportId,
      accountId,
      'Charged for completed steps only.',
    );
  });
},
```

## How It Works

```
Report Generation Flow:
─────────────────────────────────────────────────────────────────
Step AN0 completes → UPDATE step_tokens = {"an0": 12345}
Step AN1.5 completes → UPDATE step_tokens = {"an0": 12345, "an1.5": 8900}
Step AN1.7 completes → ... adds "an1.7"
... continues for all 7 steps ...
─────────────────────────────────────────────────────────────────

On Success:
  → Sum step_tokens → call increment_usage() → bill account

On Failure/Cancel:
  → onFailure handler fires
  → Sum step_tokens for completed work only
  → Bill for partial usage
  → Update report status with "charged for completed steps only"
```

## Key Design Decisions

### Why JSONB Column Instead of Separate Table?

DHH's principle: "Data lives where it belongs."

| Approach | Pros | Cons |
|----------|------|------|
| Separate `report_step_usage` table | Normalized, queryable | Extra joins, orphan cleanup, RLS complexity |
| **JSONB column on report** | Simple, auto-cleanup on delete, no joins | Less queryable (acceptable tradeoff) |

### Why Not Full Reservation System?

At soft launch scale (~50-100 users, ~10-20 reports/hour), the gaming scenario (user starts 3 reports with tokens for 1) is statistically rare. A 110% hard cap on completion handles edge cases without reservation complexity.

**Defer reservation system until**: >5% overage rate observed in production.

## Security Fix Included

The migration also fixes admin function authorization:

```sql
-- Added to adjust_usage_period_limit and admin_search_users_by_email
IF NOT public.is_super_admin() THEN
  RAISE EXCEPTION 'Unauthorized: super admin access required';
END IF;
```

## Key Files

| File | Purpose |
|------|---------|
| `migrations/20260108000000_add_step_tokens_column.sql` | Adds column + admin security fix |
| `lib/inngest/utils/step-tokens.ts` | Helper functions |
| `lib/inngest/functions/generate-report.ts` | Integration with Inngest steps |

## Testing

### Verify Step Tracking
```sql
SELECT id, step_tokens, status
FROM sparlo_reports
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Verify Partial Billing
```sql
-- Reports that failed but were partially billed
SELECT r.id, r.status, r.step_tokens, r.token_usage
FROM sparlo_reports r
WHERE r.status = 'failed'
  AND r.step_tokens != '{}'
ORDER BY r.created_at DESC;
```

## Related Documentation

- [Token-Based Usage Tracking](./token-based-usage-tracking.md) - Original usage tracking architecture
- [Usage Tracking Security Hardening](../security/usage-tracking-security-hardening.md) - TOCTOU protection patterns
- [Inngest Report Cancellation](../integration-issues/inngest-report-cancellation.md) - Cancellation handling

**Version**: 1.0 | **Updated**: 2026-01-08
