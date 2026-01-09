# Fix: Subscription Token Limit Not Updating on Backend

## Enhancement Summary

**Deepened on:** 2026-01-08
**Research agents used:** 10 (Stripe best practices, Supabase patterns, TypeScript review, Security audit, Architecture review, Data integrity, Code simplicity, 3x documented learnings)

### Key Improvements from Research
1. **CRITICAL:** Race condition identified in `reset_usage_period` - needs advisory lock
2. **CRITICAL:** Security - return page needs ownership validation before sync
3. **HIGH:** Missing partial unique index may cause ON CONFLICT to fail
4. **HIGH:** Supabase RPC errors not being checked in proposed code
5. **MEDIUM:** Consider simpler fix - root cause may be webhook misconfiguration

### New Considerations Discovered
- Dual-path (webhook + return page) is valid architecture, not a code smell
- TOCTOU protection pattern needed for concurrent webhook/return page execution
- Idempotency should use Stripe event ID, not period boundaries
- Token limit fallback to 1M masks configuration errors in production

---

## Problem Statement

When a user subscribes to a plan, their token limit is not being increased on the backend. Users remain at the default 3M token limit regardless of which plan they subscribed to.

## Root Cause Analysis

After tracing through the codebase, I identified **two issues** that work together to cause this bug:

### Issue 1: Missing Fallback in Return Page

**File:** `apps/web/app/app/billing/return/page.tsx`

When a user completes Stripe checkout and returns to the app:
1. The return page syncs the subscription to the database (lines 108-133)
2. BUT it does **NOT** create/update the usage period with the correct token limit

This creates a race condition:
- If `invoice.paid` webhook hasn't fired yet, no usage period exists
- User generates a report → `get_or_create_usage_period` creates period with **default 3M limit**
- When `invoice.paid` finally fires → it may or may not update the limit (depending on timing)

### Issue 2: `invoice.paid` Webhook May Not Be Configured

**File:** `packages/billing/stripe/src/services/stripe-webhook-handler.service.ts` (line 165)

The code handles `invoice.paid`, but this event must be explicitly enabled in the Stripe Dashboard webhook configuration. If not enabled:
- `handleInvoicePaid` is never called
- Usage period is never created with correct limits
- All users get stuck at default 3M tokens

### Flow Diagram

```
Current (Buggy) Flow:
────────────────────
User Completes Checkout
       │
       ├──► Return Page loads
       │    └──► Syncs subscription ✓
       │         (NO usage period created) ✗
       │
       ├──► User tries to generate report
       │    └──► get_or_create_usage_period()
       │         └──► Creates period with DEFAULT 3M limit ✗
       │
       └──► invoice.paid webhook (maybe never fires)
            └──► handleInvoicePaid()
                 └──► reset_usage_period() (if webhook fires)
```

## Proposed Solution

### Fix 1: Add Usage Period Sync to Return Page

After syncing the subscription on the return page, also create/update the usage period with the correct token limit.

**File to modify:** `apps/web/app/app/billing/return/page.tsx`

```typescript
// After line 133, add:

// Also sync usage period with correct token limit
const priceId = subscriptionData.line_items?.[0]?.variant_id;
if (priceId && subscriptionData.period_starts_at && subscriptionData.period_ends_at) {
  try {
    const tokenLimit = getPlanTokenLimit(priceId);
    await supabase.rpc('reset_usage_period', {
      p_account_id: user.id,
      p_tokens_limit: tokenLimit,
      p_period_start: subscriptionData.period_starts_at,
      p_period_end: subscriptionData.period_ends_at,
    });
    console.log('[Billing] Usage period synced on return page:', { tokenLimit });
  } catch (error) {
    console.error('[Billing] Failed to sync usage period on return:', error);
    // Don't fail the page - webhook will handle it as fallback
  }
}
```

### Fix 2: Verify Stripe Webhook Configuration

Ensure the following webhook events are enabled in Stripe Dashboard:
- `checkout.session.completed` ✓
- `customer.subscription.updated` ✓
- `customer.subscription.deleted` ✓
- **`invoice.paid`** ← Must be enabled!
- `checkout.session.async_payment_succeeded` ✓
- `checkout.session.async_payment_failed` ✓

### Fix 3: Add Logging to Diagnose Production Issues

Add more detailed logging to track when usage periods are created/updated:

**File:** `apps/web/lib/billing/handle-invoice-paid.ts`

```typescript
// At the start of handleInvoicePaid:
console.log('[Billing] handleInvoicePaid called with:', {
  accountId: payload.target_account_id,
  priceId: payload.line_items[0]?.variant_id,
  periodStart: payload.period_starts_at,
  periodEnd: payload.period_ends_at,
});
```

## Implementation Checklist

- [ ] Add usage period sync to return page (`apps/web/app/app/billing/return/page.tsx`)
- [ ] Add `getPlanTokenLimit` import to return page
- [ ] Add `getSupabaseServerAdminClient` import for RPC call (needs service_role)
- [ ] Verify `invoice.paid` is enabled in Stripe webhook settings
- [ ] Add enhanced logging to `handleInvoicePaid`
- [ ] Test with a fresh subscription to verify fix

## Files to Modify

| File | Change |
|------|--------|
| `apps/web/app/app/billing/return/page.tsx` | Add usage period sync after subscription sync |
| `apps/web/lib/billing/handle-invoice-paid.ts` | Add debug logging |
| Stripe Dashboard | Verify `invoice.paid` webhook is enabled |

## Testing Plan

1. **Fresh Subscription Test:**
   - Create a new account
   - Subscribe to Pro plan
   - Verify usage period is created with 10M tokens (not 3M)
   - Check database: `SELECT tokens_limit FROM usage_periods WHERE account_id = ?`

2. **Webhook Test:**
   - Use Stripe CLI to simulate `invoice.paid` event
   - Verify `handleInvoicePaid` is called and logs correctly
   - Verify usage period is created/updated

3. **Return Page Test:**
   - Block webhooks temporarily
   - Complete checkout
   - Verify return page creates usage period with correct limit

## Additional Issues Found (SpecFlow Analysis)

### Issue 3: Plan Upgrades Don't Update Usage Period Mid-Cycle

When a user upgrades from Lite (1M) to Pro (10M), the `customer.subscription.updated` webhook fires, but there's NO handler that updates the usage period token limit. Users have to wait until next billing cycle.

**Fix:** Add `onSubscriptionUpdated` callback to webhook route that updates token limits:

```typescript
// In apps/web/app/api/billing/webhook/route.ts, add:
onSubscriptionUpdated: async (payload) => {
  // Get the new price ID and update usage period limit
  const priceId = payload.line_items[0]?.variant_id;
  if (priceId && payload.target_account_id) {
    const tokenLimit = getPlanTokenLimit(priceId);
    await supabaseAdmin.from('usage_periods')
      .update({ tokens_limit: tokenLimit, updated_at: new Date().toISOString() })
      .eq('account_id', payload.target_account_id)
      .eq('status', 'active');
  }
},
```

### Issue 4: Idempotency Check May Skip Needed Updates

The idempotency check in `handleInvoicePaid` returns early if a period exists for the billing cycle, even if that period has the WRONG token limit. This means existing users with default limits (from trial) won't get upgraded.

**Fix:** Modify idempotency check to verify limit matches expected:

```typescript
// Instead of just checking existence, also verify limit
const { data: existingPeriod } = await supabase
  .from('usage_periods')
  .select('id, tokens_limit')
  .eq('account_id', accountId)
  .eq('period_start', periodStart)
  .eq('period_end', periodEnd)
  .maybeSingle();

// Only skip if period exists AND has correct limit
if (existingPeriod && existingPeriod.tokens_limit === tokenLimit) {
  console.log('[Billing] Usage period already exists with correct limit');
  return;
}
```

### Issue 5: Return Page Needs Admin Client

The `reset_usage_period` RPC is only granted to `service_role`, not `authenticated` users. The proposed fix needs to use `getSupabaseServerAdminClient` instead of the regular client.

**Security Note:** This is safe because we're using `user.id` (authenticated user's own ID) as the account ID - users can only set their own usage period.

## Updated Implementation Checklist

- [ ] Add usage period sync to return page using **admin client**
- [ ] Add `getSupabaseServerAdminClient` import (for `reset_usage_period` RPC)
- [ ] Add `getPlanTokenLimit` import
- [ ] Modify `handleInvoicePaid` idempotency check to verify limit value
- [ ] Add `onSubscriptionUpdated` callback to webhook route for plan upgrades
- [ ] Verify `invoice.paid` is enabled in Stripe webhook settings
- [ ] Add enhanced logging
- [ ] Test with fresh subscription
- [ ] Test with existing trial user upgrading to paid

## Risk Assessment

- **Low Risk:** Adding usage period sync to return page is idempotent (uses `reset_usage_period`)
- **Low Risk:** Adding logging has no functional impact
- **No Data Loss:** `reset_usage_period` creates new period, doesn't delete data
- **Security:** Using admin client is safe since we validate user owns the account

## Research Insights (from /deepen-plan)

### Stripe Webhook Best Practices

**Recommended Pattern: Fetch Latest State**
> "Don't trust event ordering... always fetch the latest object state directly via the API before performing any side effects."

```typescript
// Instead of trusting webhook payload, fetch fresh from Stripe
const subscription = await stripe.subscriptions.retrieve(subscriptionId);
const tokenLimit = getPlanTokenLimit(subscription.items.data[0].price.id);
```

**Idempotency Implementation:**
```typescript
// Use Stripe event ID for idempotency, not period boundaries
const eventId = stripeEvent.id; // e.g., "evt_1234..."
const { data: processed } = await supabase.rpc('check_webhook_processed', {
  p_event_id: eventId
});
if (processed) return;
```

### Security Requirements (from Security Audit)

**CRITICAL: Add ownership validation to return page:**
```typescript
// Before syncing subscription, verify session belongs to user
if (session.client_reference_id !== user.id) {
  console.error('[Billing] Session belongs to different user');
  redirect('/app/billing');
}
```

**Use Admin Client Correctly:**
```typescript
import 'server-only'; // Prevents client-side import
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

// Only after ownership validation
const adminClient = getSupabaseServerAdminClient();
const { error } = await adminClient.rpc('reset_usage_period', {...});
if (error) throw error; // Don't swallow errors!
```

### Data Integrity Fix (Race Condition)

**CRITICAL: Add advisory lock to prevent concurrent execution:**

```sql
CREATE OR REPLACE FUNCTION public.reset_usage_period(...)
RETURNS void AS $$
BEGIN
  -- Advisory lock prevents concurrent execution for same account
  PERFORM pg_advisory_xact_lock(hashtext(p_account_id::text));

  -- Now safe to proceed
  UPDATE public.usage_periods
  SET status = 'completed', updated_at = NOW()
  WHERE account_id = p_account_id AND status = 'active';

  INSERT INTO public.usage_periods (...)
  ON CONFLICT (account_id) WHERE status = 'active'
  DO UPDATE SET ...;
END;
$$ LANGUAGE plpgsql;
```

**REQUIRED: Verify partial unique index exists:**
```sql
-- The ON CONFLICT clause requires this index!
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_periods_one_active_per_account
ON public.usage_periods (account_id)
WHERE status = 'active';
```

### TypeScript Code Quality

**Always check Supabase RPC results:**
```typescript
// WRONG - ignores errors
await supabase.rpc('reset_usage_period', {...});

// CORRECT - check result
const { error } = await supabase.rpc('reset_usage_period', {...});
if (error) {
  console.error('[Billing] Failed to reset usage period:', error);
  throw error; // Or handle appropriately
}
```

**Type the webhook payload:**
```typescript
interface SubscriptionPayload {
  target_account_id: string | null;
  line_items: Array<{ variant_id: string }>;
  period_starts_at: string;
  period_ends_at: string;
}

onSubscriptionUpdated: async (payload: SubscriptionPayload) => {...}
```

### Simplification Consideration

**Code Simplicity Review raised important question:**
> "Before implementing 5 fixes across multiple files, identify the root cause first."

**Diagnostic steps before coding:**
1. Check Stripe Dashboard - is `invoice.paid` webhook enabled?
2. Add one log line to `handleInvoicePaid` - is it being called?
3. Check database - are usage_periods being created at all?

If webhook isn't configured, **zero code changes needed** - just enable it in Stripe.

### Architecture Validation

**The dual-path approach (webhook + return page) is valid:**
- Webhook = primary, authoritative path
- Return page = fallback for webhook latency/failures
- Both converge on same idempotent sync function

**Recommended: Centralize sync logic**
```typescript
// Single function, multiple triggers
async function syncSubscriptionState(customerId: string) {
  // 1. Fetch fresh state from Stripe API
  // 2. Compare with database
  // 3. Apply changes idempotently
}

// Called from: webhook handler, return page, reconciliation job
```

---

## Updated Implementation Checklist

### Before Coding (Diagnostic)
- [ ] Check Stripe Dashboard: Is `invoice.paid` webhook enabled?
- [ ] Check logs: Is `handleInvoicePaid` being called?
- [ ] Check database: Do usage_periods exist? With what token_limit?

### Database Changes (if webhook IS firing but limits wrong)
- [ ] Verify partial unique index exists: `idx_usage_periods_one_active_per_account`
- [ ] Add advisory lock to `reset_usage_period` function
- [ ] Create migration for index + function update

### Code Changes
- [ ] Add ownership validation to return page (security critical)
- [ ] Add usage period sync to return page using **admin client**
- [ ] Check Supabase RPC errors (don't swallow)
- [ ] Modify `handleInvoicePaid` idempotency to use Stripe event ID
- [ ] Add `onSubscriptionUpdated` callback for plan upgrades
- [ ] Type webhook payloads explicitly
- [ ] Change token limit fallback to throw in production

### Testing
- [ ] Test with fresh subscription
- [ ] Test with existing trial user upgrading
- [ ] Test concurrent webhook + return page (race condition)
- [ ] Test with Stripe CLI: `stripe trigger invoice.paid`

---

## References

- `apps/web/lib/billing/handle-invoice-paid.ts:16-83` - Invoice paid handler
- `apps/web/lib/billing/plan-limits.ts:36-47` - Price ID to token limit mapping
- `apps/web/supabase/migrations/20251220231233_add_billing_webhook_support.sql:35-85` - reset_usage_period function
- `apps/web/lib/usage/constants.ts:46-58` - PLAN_TOKEN_LIMITS configuration
- `docs/solutions/features/usage-based-billing-freemium.md` - Usage tracking architecture
- `docs/solutions/security/usage-tracking-security-hardening.md` - TOCTOU protection patterns
