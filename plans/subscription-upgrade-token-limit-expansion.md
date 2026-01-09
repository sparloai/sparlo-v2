# Feature: Subscription Upgrade Token Limit Expansion

## Overview

When a user upgrades their subscription tier (e.g., Core → Pro), their token limit should immediately expand to the new tier's limit **without resetting usage counters or changing billing cycle dates**.

**Current State:** Handler exists at `apps/web/lib/billing/handle-subscription-updated.ts` but needs refactoring per code review.

**Required Fixes (from Kieran's review):**
1. Fix `count` usage - Supabase requires `.select()` to return count
2. Throw errors instead of silent returns (enables webhook retry)
3. Add early return for non-plan-change events (avoid unnecessary DB calls)
4. Better type safety for payload validation

## Problem Statement

When a user upgrades from Core (3M tokens) to Pro (10M tokens) mid-cycle:

```
Current Flow (Buggy):
─────────────────────
User on Core: 2M/3M tokens used (day 15 of 30)
       │
       ├──► User clicks "Upgrade to Pro"
       │
       ├──► Stripe processes upgrade
       │
       ├──► `customer.subscription.updated` webhook fires
       │    └──► Subscription updated in DB ✓
       │         Token limit NOT updated ✗ (still 3M)
       │
       └──► Day 30: `invoice.paid` fires
            └──► reset_usage_period() called
                 └──► New period: 0/10M tokens ✓

Result: User waits 15 days for their upgrade to take effect!
```

## Proposed Solution

### Approach: Update Token Limit Without Resetting Usage

Create a new database function `update_usage_period_limit` that ONLY updates the `tokens_limit` column without resetting any usage counters. Then add an `onSubscriptionUpdated` callback to the webhook route.

```
Proposed Flow (Fixed):
──────────────────────
User on Core: 2M/3M tokens used (day 15 of 30)
       │
       ├──► User clicks "Upgrade to Pro"
       │
       ├──► Stripe processes upgrade
       │
       ├──► `customer.subscription.updated` webhook fires
       │    └──► onSubscriptionUpdated callback
       │         └──► update_usage_period_limit(10M) ✓
       │              └──► Now: 2M/10M tokens used ✓
       │
       └──► Day 30: `invoice.paid` fires
            └──► reset_usage_period() called
                 └──► New period: 0/10M tokens ✓

Result: User gets increased limit IMMEDIATELY!
```

## Technical Approach

### 1. Refactor handleSubscriptionUpdated (Kieran's Review Fixes)

**File:** `apps/web/lib/billing/handle-subscription-updated.ts`

Key changes needed:
1. **Fix count check** - Add `.select()` to get actual count, or check `data.length`
2. **Throw on errors** - Replace silent `return` with `throw` for webhook retry
3. **Log structured data** - Use consistent logging format

```typescript
import 'server-only';

import { UpsertSubscriptionParams } from '@kit/billing/types';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { getPlanTokenLimit } from './plan-limits';

/**
 * Handle customer.subscription.updated webhook from Stripe.
 * Updates the token limit immediately when a user upgrades/downgrades mid-cycle.
 *
 * THROWS on failure to trigger webhook retry.
 */
export async function handleSubscriptionUpdated(
  payload: UpsertSubscriptionParams,
): Promise<void> {
  const accountId = payload.target_account_id;
  const priceId = payload.line_items?.[0]?.variant_id;

  // Early validation - throw to signal invalid webhook payload
  if (!accountId || !priceId) {
    console.warn('[Billing] handleSubscriptionUpdated: Missing required fields', {
      hasAccountId: !!accountId,
      hasPriceId: !!priceId,
    });
    return; // Not an error - just incomplete data, don't retry
  }

  // Get token limit - throws if unknown priceId (config error)
  const tokenLimit = getPlanTokenLimit(priceId);

  const supabase = getSupabaseServerAdminClient();

  // Update with .select() to get actual row count
  const { data, error } = await supabase
    .from('usage_periods')
    .update({
      tokens_limit: tokenLimit,
      updated_at: new Date().toISOString(),
    })
    .eq('account_id', accountId)
    .eq('status', 'active')
    .select('id');

  if (error) {
    console.error('[Billing] Failed to update token limit:', { error, accountId, priceId });
    throw new Error(`Failed to update token limit: ${error.message}`);
  }

  if (!data || data.length === 0) {
    // No active period - not an error, invoice.paid will create it
    console.log('[Billing] No active usage period to update (transitioning)', { accountId });
    return;
  }

  console.log('[Billing] Token limit updated:', { accountId, priceId, tokenLimit });
}
```

### 3. Handle Downgrade Edge Case

When downgrading (e.g., Pro 10M → Core 3M), if current usage exceeds new limit:
- Token limit is still updated to new value
- User is "over limit" but NOT locked out of existing data
- They cannot generate NEW reports until under limit
- Usage check already handles this via `checkUsageAllowed()`

No additional code needed - existing usage check handles gracefully.

## Acceptance Criteria

### Functional Requirements

- [ ] When user upgrades (Core → Pro), token limit increases immediately
- [ ] When user upgrades, usage counters are preserved (not reset)
- [ ] When user upgrades, billing period dates are preserved
- [ ] When user downgrades, token limit decreases immediately
- [ ] When user downgrades with usage > new limit, they're over-limit but not locked out
- [ ] `invoice.paid` still resets usage for new billing cycles (unchanged)

### Non-Functional Requirements

- [ ] `update_usage_period_limit` only callable by service_role
- [ ] Webhook handler logs all limit changes
- [ ] Error handling doesn't crash the webhook

### Testing Requirements

- [ ] Test upgrade: Core (2M used) → Pro = 2M/10M
- [ ] Test downgrade: Pro (5M used) → Core = 5M/3M (over limit)
- [ ] Test downgrade: Pro (1M used) → Core = 1M/3M (under limit)
- [ ] Test rapid upgrade: Core → Pro → Max in quick succession
- [ ] Verify `invoice.paid` still resets usage correctly

## Files to Modify

| File | Change |
|------|--------|
| `apps/web/lib/billing/handle-subscription-updated.ts` | Refactor: fix count check, throw on errors |

## Implementation Checklist

- [ ] Refactor `handleSubscriptionUpdated` with Kieran's fixes:
  - [ ] Add `.select('id')` to get actual row count
  - [ ] Check `data.length` instead of `count`
  - [ ] Throw error on DB failure (enables webhook retry)
  - [ ] Simplify logging
- [ ] Run typecheck: `pnpm typecheck`
- [ ] Test upgrade flow end-to-end

## Edge Cases Addressed

### 1. Upgrade at Billing Cycle Boundary

**Scenario:** User upgrades on day 29, `invoice.paid` fires on day 30.

**Handling:**
- Day 29: `subscription.updated` → limit increases to Pro
- Day 30: `invoice.paid` → `reset_usage_period` creates new period with Pro limit
- Both work correctly because they're independent operations

### 2. Multiple Rapid Upgrades

**Scenario:** User upgrades Core → Pro → Max in 5 minutes.

**Handling:**
- Each `subscription.updated` webhook calls `update_usage_period_limit`
- Final state is Max tier limit
- Usage is preserved throughout

### 3. Webhook Delivery Delay

**Scenario:** Webhook is delayed by 2 hours.

**Handling:**
- User sees old limit until webhook arrives
- Once webhook processes, limit updates immediately
- No data loss or corruption

### 4. Downgrade Over-Limit

**Scenario:** Pro user with 8M used downgrades to Core (3M limit).

**Handling:**
- Limit changes to 3M, usage stays at 8M
- `checkUsageAllowed()` returns `allowed: false, reason: 'limit_exceeded'`
- User sees upgrade prompt, can't generate new reports
- Existing reports/data remain accessible

## Risk Assessment

- **Low Risk:** New function is idempotent and only updates one column
- **Low Risk:** Existing `reset_usage_period` unchanged
- **Low Risk:** Webhook handler is isolated from other callbacks
- **No Data Loss:** Never deletes or resets usage counters
- **Reversible:** Can easily revert by removing the callback

## References

- `apps/web/lib/billing/handle-invoice-paid.ts:16-99` - Invoice paid handler (for comparison)
- `apps/web/supabase/migrations/20251220231233_add_billing_webhook_support.sql:35-94` - `reset_usage_period` function
- `apps/web/app/api/billing/webhook/route.ts:36-85` - Webhook route
- `packages/billing/stripe/src/services/stripe-webhook-handler.service.ts:307-343` - Subscription updated handler
- `apps/web/lib/usage/constants.ts:46-59` - Token limits per plan
