# Bulletproof Billing Subscriber View

## Overview

Fix the billing page to correctly show subscribers their Current Plan with a "Manage billing" button that leads to Stripe's billing portal. Non-subscribers continue to see the pricing page.

## Problem Statement

**Root Cause Identified**: The RLS policy on `subscriptions` table requires `public.is_set('enable_account_billing')` to return `true`. The `config` table either:
1. Has `enable_account_billing = false`
2. Is missing the required row entirely

**Evidence**: Debug logging shows subscription exists via admin client (bypasses RLS) but returns NULL via regular client (blocked by RLS).

## The Fix: 2-Minute Database Update

### Step 1: Run SQL Fix in Production

Execute via Supabase Dashboard SQL Editor:

```sql
-- Ensure config row exists with billing enabled
INSERT INTO public.config (enable_team_accounts, enable_account_billing, enable_team_account_billing)
VALUES (true, true, true)
ON CONFLICT DO NOTHING;

-- Ensure enable_account_billing is true
UPDATE public.config SET enable_account_billing = true;

-- Verify fix
SELECT * FROM public.config;
```

### Step 2: Verify Fix

1. Navigate to `/app/billing` as a subscribed user
2. Should see `SubscriberBillingPage` with:
   - Current plan info
   - Usage limits (tokens used/limit)
   - "Manage billing" button
3. Click "Manage billing" → redirects to Stripe Customer Portal

### Step 3: Clean Up Debug Code

Remove debug logging from `apps/web/app/app/billing/page.tsx:25-39`:

```typescript
// REMOVE these lines:
const { getSupabaseServerAdminClient } = await import('@kit/supabase/server-admin-client');
const adminClient = getSupabaseServerAdminClient();
const { data: adminSub } = await adminClient
  .from('subscriptions')
  .select('id, account_id, status, active')
  .eq('account_id', user.id)
  .maybeSingle();

console.log('[Billing Page] User ID:', user.id);
console.log('[Billing Page] Subscription (via loader/RLS):', subscription ? {
  id: subscription.id,
  status: subscription.status,
} : 'NULL');
console.log('[Billing Page] Subscription (via admin/no RLS):', adminSub);
```

### Step 4: Deploy and Verify

```bash
git add -A
git commit -m "chore: remove billing debug logging"
git push origin main
```

## Why This Works

The existing code is **already correct**:

1. **`page.tsx`** - Already has conditional rendering:
   - `hasActiveSubscription = true` → shows `SubscriberBillingPage`
   - `hasActiveSubscription = false` → shows `SparloBillingPricing`

2. **`SubscriberBillingPage`** - Already has:
   - Usage display (`PlanUsageLimits` component)
   - "Manage billing" button that triggers `createPersonalAccountBillingPortalSession`

3. **`createBillingPortalSession`** - Already works:
   - Gets customer ID from accounts API
   - Creates Stripe portal session
   - Redirects user to Stripe

The ONLY issue was RLS blocking subscription reads.

## Architecture Diagram

```
User clicks "Billing" in nav
         |
         v
/app/billing (page.tsx)
         |
         v
loadPersonalAccountBillingPageData()
         |
         v
api.getSubscription() via Supabase client
         |
    RLS Policy checks:
    account_id = auth.uid()
    AND is_set('enable_account_billing') <-- NOW TRUE
         |
         v
    [Subscription found]
         |
         v
hasActiveSubscription = true
         |
         v
<SubscriberBillingPage>
  - Shows plan info
  - Shows usage limits
  - "Manage billing" button
         |
         v
User clicks "Manage billing"
         |
         v
createPersonalAccountBillingPortalSession()
         |
         v
Stripe Customer Portal (external)
```

## Acceptance Criteria

- [ ] Subscribers see their current plan info on /app/billing
- [ ] Usage limits display correctly (tokens used/limit)
- [ ] "Manage billing" button redirects to Stripe Customer Portal
- [ ] Non-subscribers still see pricing page
- [ ] Debug logging removed from billing page

## Files Changed

| File | Change |
|------|--------|
| `apps/web/app/app/billing/page.tsx` | Remove debug logging (lines 25-39) |
| Database | `UPDATE config SET enable_account_billing = true` |

## Testing Checklist

- [ ] As subscriber: see SubscriberBillingPage with usage and manage button
- [ ] As subscriber: click "Manage billing" → Stripe portal opens
- [ ] As subscriber: return from Stripe portal → back to billing page
- [ ] As non-subscriber: see pricing page
- [ ] No console errors in browser
- [ ] No error logs in Railway

## Why NOT Changing Navigation URLs

The original request mentioned potentially using different URLs (`/plans` vs `/billing`). This is **not necessary** because:

1. The existing conditional rendering already handles both cases
2. Single `/app/billing` URL is simpler to maintain
3. URL stays consistent for all users (just content changes)
4. No nav config changes needed

## Future Improvements (Not Required Today)

1. Add migration to prevent config regression
2. Add monitoring for RLS policy failures
3. Improve webhook race condition handling on return page
4. Add E2E test for subscriber billing flow

## References

- `apps/web/supabase/schemas/09-subscriptions.sql` - RLS policy definition
- `apps/web/supabase/schemas/02-config.sql` - Config table and `is_set()` function
- `packages/features/accounts/src/server/api.ts:77-90` - `getSubscription` method
- `apps/web/app/app/billing/_components/subscriber-billing-page.tsx` - Subscriber UI
