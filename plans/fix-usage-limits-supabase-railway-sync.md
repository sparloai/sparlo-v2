# Fix: Usage Limits Not Enforced Between Supabase and Site

## Overview

User reports their account is set up for unlimited usage on Supabase, but when running a report, Railway logs show "usage max'd out" error. The site doesn't show usage as at capacity.

**Category:** Bug Fix
**Priority:** High
**Affected Users:** All users with usage-limited plans

---

## Problem Statement

The usage limit system has proper database functions but they are **not being called at the right time**. The current flow:

1. User triggers report → **No usage check** → Report starts processing
2. Report completes → `increment_usage()` called → Error if over limit (too late!)
3. Site displays usage via `check_usage_allowed()` → Shows capacity correctly

**The disconnect:** Usage is checked for *display* but not *enforcement* before report execution.

---

## Root Cause Analysis

### Database Layer (Working Correctly)

The database has the correct functions in `/apps/web/supabase/schemas/17-usage-periods.sql`:

| Function | Purpose | Used? |
|----------|---------|-------|
| `check_usage_allowed()` | Pre-check if operation allowed | Yes (display only) |
| `reserve_usage()` | Atomically reserve tokens before operation | **NO** |
| `increment_usage()` | Record actual usage after operation | Yes (post-execution) |
| `finalize_usage()` | Adjust reserved vs actual tokens | **NO** |
| `release_usage()` | Release reserved tokens on failure | **NO** |

### Application Layer (Missing Enforcement)

**API Endpoints - NO pre-check:**
- `/apps/web/app/api/hybrid/reports/route.ts:114-255` - Triggers Inngest without checking usage
- `/apps/web/app/api/discovery/reports/route.ts:41-156` - Same issue

**Inngest Functions - NO reserve/finalize pattern:**
- `/apps/web/lib/inngest/functions/generate-report.ts` - Only calls `increment_usage()` at line 682-696 AFTER completion
- `/apps/web/lib/inngest/functions/generate-hybrid-report.ts` - Same, lines 687-703

### User's Specific Scenario

The user sees:
1. **Site shows "not at capacity"** - `check_usage_allowed()` returns `allowed: true` for display
2. **Railway logs show error** - Likely from `increment_usage()` failing when:
   - No active usage period exists for the account
   - Usage period has expired (`period_end < NOW()`)
   - Token limit is set to 0 or NULL
   - Subscription data not synced to usage_periods table

---

## Investigation Steps

Before fixing, verify the actual state:

### 1. Check user's usage_periods table
```sql
SELECT * FROM usage_periods
WHERE account_id = '<user_account_id>'
ORDER BY created_at DESC;
```
- Is there an active period with `status = 'active'`?
- What is `tokens_limit`? Should be very high for "unlimited"
- Has `period_end` passed?

### 2. Check subscription data
```sql
SELECT s.*, si.variant_id, si.price_id
FROM subscriptions s
LEFT JOIN subscription_items si ON si.subscription_id = s.id
WHERE s.account_id = '<user_account_id>' AND s.active = true;
```
- Is subscription active?
- What plan variant/price ID?

### 3. Check billing webhook processing
```sql
SELECT * FROM processed_webhook_events
WHERE event_type = 'invoice.paid'
ORDER BY created_at DESC LIMIT 10;
```
- Are webhooks being processed?
- Did `reset_usage_period()` get called?

### 4. Check Railway logs for actual error
- Look for the specific error message
- Identify which function is throwing

---

## Proposed Solution

### Phase 1: Immediate Fix - Add Pre-Check to API Endpoints

**File:** `/apps/web/app/api/hybrid/reports/route.ts`

```typescript
// Before triggering Inngest event (around line 150)
import { checkUsageAllowed } from '@/app/home/(user)/_lib/server/usage.service';
import { ESTIMATED_TOKENS_PER_REPORT } from '@/lib/usage/constants';

// Add this check before creating report record
const usageStatus = await checkUsageAllowed(accountId, ESTIMATED_TOKENS_PER_REPORT);

if (usageStatus.type === 'not_allowed') {
  return NextResponse.json(
    {
      error: 'Usage limit exceeded',
      message: usageStatus.message,
      usage: {
        used: usageStatus.usage?.tokens_used,
        limit: usageStatus.usage?.tokens_limit,
        percentage: usageStatus.usage?.percentage
      }
    },
    { status: 429 }
  );
}
```

**File:** `/apps/web/app/api/discovery/reports/route.ts`
- Apply same pattern

### Phase 2: Implement Reserve-Finalize Pattern in Inngest

**File:** `/apps/web/lib/inngest/functions/generate-hybrid-report.ts`

```typescript
// At the START of the function (before AN0 step)
const reserveResult = await supabaseAdmin.rpc('reserve_usage', {
  p_account_id: report.account_id,
  p_tokens: ESTIMATED_TOKENS_PER_REPORT
});

if (!reserveResult.data?.allowed) {
  // Update report status to error
  await supabaseAdmin
    .from('reports')
    .update({
      status: 'error',
      error_message: 'Usage limit exceeded'
    })
    .eq('id', report.id);

  return { success: false, error: 'Usage limit exceeded' };
}

const reservedTokens = reserveResult.data.reserved;

// ... existing report generation logic ...

// At the END (replace current increment_usage call)
try {
  await supabaseAdmin.rpc('finalize_usage', {
    p_account_id: report.account_id,
    p_reserved_tokens: reservedTokens,
    p_actual_tokens: actualTokensUsed,
    p_is_report: true,
    p_is_chat: false
  });
} catch (error) {
  // Log but don't fail - usage already reserved
  console.error('Failed to finalize usage:', error);
}

// On ERROR/FAILURE paths
await supabaseAdmin.rpc('release_usage', {
  p_account_id: report.account_id,
  p_tokens: reservedTokens
});
```

### Phase 3: Handle "Unlimited" Plans

**File:** `/apps/web/lib/billing/plan-limits.ts`

```typescript
export function getPlanTokenLimit(priceId: string): number {
  // Add explicit handling for unlimited plans
  if (priceId === 'unlimited' || priceId === 'enterprise-unlimited') {
    return 1_000_000_000; // 1 billion tokens (effectively unlimited)
  }

  return PLAN_TOKEN_LIMITS[priceId] ?? DEFAULT_TOKEN_LIMIT;
}
```

**File:** `/apps/web/lib/billing/handle-invoice-paid.ts`

Ensure `reset_usage_period()` is called with correct token limit for unlimited plans.

### Phase 4: Add Error Surfacing to Frontend

**File:** `/apps/web/app/home/(user)/_lib/use-report.ts` (or equivalent)

```typescript
// Handle 429 response from report creation
if (response.status === 429) {
  const data = await response.json();
  toast.error(data.message || 'Usage limit exceeded');
  // Optionally show upgrade modal
  showUpgradeModal();
}
```

---

## Acceptance Criteria

- [ ] API endpoints check usage BEFORE triggering report generation
- [ ] 429 response returned with clear message when limit exceeded
- [ ] Inngest functions use `reserve_usage()` before processing
- [ ] Inngest functions use `finalize_usage()` after completion
- [ ] Inngest functions use `release_usage()` on errors
- [ ] "Unlimited" plans have explicit high token limit (not NULL/0)
- [ ] Frontend displays error message when limit exceeded
- [ ] Railway logs no longer show "max'd out" error for valid unlimited accounts

---

## Files to Modify

| File | Change |
|------|--------|
| `/apps/web/app/api/hybrid/reports/route.ts` | Add `checkUsageAllowed()` pre-check |
| `/apps/web/app/api/discovery/reports/route.ts` | Add `checkUsageAllowed()` pre-check |
| `/apps/web/lib/inngest/functions/generate-report.ts` | Add reserve/finalize pattern |
| `/apps/web/lib/inngest/functions/generate-hybrid-report.ts` | Add reserve/finalize pattern |
| `/apps/web/lib/inngest/functions/generate-discovery-report.ts` | Add reserve/finalize pattern |
| `/apps/web/lib/billing/plan-limits.ts` | Handle unlimited plans explicitly |
| `/apps/web/lib/billing/handle-invoice-paid.ts` | Verify unlimited plan handling |

---

## Testing Plan

1. **Unit Tests:**
   - Mock `reserve_usage()` to return `allowed: false`
   - Verify API returns 429
   - Verify Inngest function exits early with error status

2. **Integration Tests:**
   - Create user with used-up limit
   - Attempt to generate report
   - Verify blocked at API level (not in Inngest)

3. **Manual Testing:**
   - Test with unlimited plan user
   - Test with standard plan at 99% usage
   - Test with expired usage period
   - Test concurrent report submissions

---

## References

### Internal Files
- Usage service: `/apps/web/app/home/(user)/_lib/server/usage.service.ts:47-171`
- Usage constants: `/apps/web/lib/usage/constants.ts`
- Database schema: `/apps/web/supabase/schemas/17-usage-periods.sql`
- Security migration: `/apps/web/supabase/migrations/20251219232541_fix-usage-tracking-security.sql`
- Billing webhook: `/apps/web/lib/billing/handle-invoice-paid.ts`

### Database Functions
- `check_usage_allowed`: schema line 153-204
- `reserve_usage`: migration line 230-310
- `increment_usage`: migration line 156-223
- `finalize_usage`: migration line 313-359
- `release_usage`: migration line 362-403
