# Billing Page Redesign: Individual/Team Toggle

## Overview

Redesign the billing page with an Individual/Team toggle. This plan addresses all affected systems: Stripe configuration, product IDs, token limits, usage tracking, and team access gating.

### Token Limits Summary

| Plan | Tokens | ~Reports/mo | Price |
|------|--------|-------------|-------|
| **Individual** |
| Lite | 1MM | ~3 | $99/mo |
| Core | 3MM | ~10 | $249/mo |
| Pro | 6MM | ~17 | $399/mo |
| **Team** |
| Team Pro | 7.5MM | ~21 | $499/mo |
| Team Max | 15MM | ~42 | $999/mo |
| Enterprise | Custom | Custom | Contact Sales |

*Reports estimated at ~350K tokens each*

---

## Part 1: Stripe Changes Required

### New Stripe Products/Prices to Create

You need to create these in Stripe Dashboard before implementation:

| Product | Price ID Placeholder | Amount | Interval |
|---------|---------------------|--------|----------|
| Individual Pro | `price_INDIVIDUAL_PRO_MONTHLY` | $399 | monthly |
| Individual Pro | `price_INDIVIDUAL_PRO_ANNUAL` | $3,990 | yearly |
| Team Pro | `price_TEAM_PRO_MONTHLY` | $499 | monthly |
| Team Pro | `price_TEAM_PRO_ANNUAL` | $4,990 | yearly |
| Team Max | `price_TEAM_MAX_MONTHLY` | $999 | monthly |
| Team Max | `price_TEAM_MAX_ANNUAL` | $9,990 | yearly |

### Existing Prices (Keep As-Is)

| Product | Price ID | Amount | Status |
|---------|----------|--------|--------|
| Lite | `price_1SnILKEe4gCtTPhv1Hv6KAhV` | $99/mo | Keep |
| Lite | `price_1SnIM1Ee4gCtTPhvm0oISMPo` | $990/yr | Keep |
| Core | `price_1Sng4XEe4gCtTPhv4OMZBGjq` | $249/mo | Keep |
| Core | `price_1Sng4xEe4gCtTPhvtS4Nd1Rk` | $2,490/yr | Keep |
| Pro (old) | `price_1SlTLUEe4gCtTPhvwy9m7oKd` | $499/mo | **Grandfather** |
| Pro (old) | `price_1SlTQ3Ee4gCtTPhvjZz8TuaA` | $4,990/yr | **Grandfather** |
| Max (old) | `price_1SlTMmEe4gCtTPhv4Uj5295n` | $999/mo | **Grandfather** |
| Max (old) | `price_1SlTPGEe4gCtTPhvv5of2HDt` | $9,990/yr | **Grandfather** |

### Grandfathering Strategy

Existing Pro ($499) and Max ($999) subscribers keep their current plans:
- Old price IDs remain in `plan-limits.ts` for lookups
- Old subscribers see "Pro (Legacy)" or "Max (Legacy)" in UI
- They can upgrade/downgrade via Stripe portal as normal
- New signups only see new tier structure

---

## Part 2: Product ID & Configuration Changes

### New Tier Structure

**File**: `apps/web/config/billing.config.ts`

```typescript
// Add category to each product - NO schema change needed
// Category is a UI concern, derive from product ID

// INDIVIDUAL PLANS (single-seat, personal billing)
{
  id: 'lite',
  name: 'Lite',
  description: 'For occasional use',
  currency: 'USD',
  features: ['~3 problems per month', '1 seat', 'Email support'],
  plans: [
    {
      id: 'lite-monthly',
      name: 'Lite Monthly',
      interval: 'month',
      paymentType: 'recurring',
      lineItems: [{
        id: 'price_1SnILKEe4gCtTPhv1Hv6KAhV', // existing
        name: 'Lite',
        cost: 9900,
        type: 'flat',
      }],
    },
    {
      id: 'lite-annual',
      name: 'Lite Annual',
      interval: 'year',
      paymentType: 'recurring',
      lineItems: [{
        id: 'price_1SnIM1Ee4gCtTPhvm0oISMPo', // existing
        name: 'Lite',
        cost: 99000,
        type: 'flat',
      }],
    },
  ],
},

{
  id: 'core',
  name: 'Core',
  description: 'For individuals',
  currency: 'USD',
  features: ['~10 problems per month', '1 seat', 'Email support'],
  plans: [/* existing plans unchanged */],
},

{
  id: 'individual-pro',
  name: 'Pro',
  description: 'For power users',
  currency: 'USD',
  highlighted: true,
  features: ['~17 problems per month', '1 seat', 'Priority support'],  // 6MM tokens
  plans: [
    {
      id: 'individual-pro-monthly',
      name: 'Pro Monthly',
      interval: 'month',
      paymentType: 'recurring',
      lineItems: [{
        id: 'price_INDIVIDUAL_PRO_MONTHLY', // NEW - replace with actual
        name: 'Pro',
        cost: 39900, // $399
        type: 'flat',
      }],
    },
    {
      id: 'individual-pro-annual',
      name: 'Pro Annual',
      interval: 'year',
      paymentType: 'recurring',
      lineItems: [{
        id: 'price_INDIVIDUAL_PRO_ANNUAL', // NEW - replace with actual
        name: 'Pro',
        cost: 399000, // $3,990
        type: 'flat',
      }],
    },
  ],
},

// TEAM PLANS (multi-seat, requires team account)
{
  id: 'team-pro',
  name: 'Team Pro',
  description: 'For small teams',
  currency: 'USD',
  highlighted: true,
  features: ['~21 problems per month', '5 team seats', 'Priority support', 'Team dashboard'],  // 7.5MM tokens
  plans: [
    {
      id: 'team-pro-monthly',
      name: 'Team Pro Monthly',
      interval: 'month',
      paymentType: 'recurring',
      lineItems: [{
        id: 'price_TEAM_PRO_MONTHLY', // NEW - replace with actual
        name: 'Team Pro',
        cost: 49900, // $499
        type: 'flat',
      }],
    },
    {
      id: 'team-pro-annual',
      name: 'Team Pro Annual',
      interval: 'year',
      paymentType: 'recurring',
      lineItems: [{
        id: 'price_TEAM_PRO_ANNUAL', // NEW - replace with actual
        name: 'Team Pro',
        cost: 499000, // $4,990
        type: 'flat',
      }],
    },
  ],
},

{
  id: 'team-max',
  name: 'Team Max',
  description: 'For organizations',
  currency: 'USD',
  features: ['~42 problems per month', '10 team seats', 'Dedicated support', 'Team dashboard'],  // 15MM tokens
  plans: [
    {
      id: 'team-max-monthly',
      name: 'Team Max Monthly',
      interval: 'month',
      paymentType: 'recurring',
      lineItems: [{
        id: 'price_TEAM_MAX_MONTHLY', // NEW - replace with actual
        name: 'Team Max',
        cost: 99900, // $999
        type: 'flat',
      }],
    },
    {
      id: 'team-max-annual',
      name: 'Team Max Annual',
      interval: 'year',
      paymentType: 'recurring',
      lineItems: [{
        id: 'price_TEAM_MAX_ANNUAL', // NEW - replace with actual
        name: 'Team Max',
        cost: 999000, // $9,990
        type: 'flat',
      }],
    },
  ],
},

// ENTERPRISE (no checkout, contact sales)
{
  id: 'enterprise',
  name: 'Enterprise',
  description: 'For large organizations',
  currency: 'USD',
  features: ['Custom problem limits', 'Unlimited seats', 'SSO/SAML', 'Dedicated account manager'],
  plans: [], // Empty = no checkout, contact sales
},

// LEGACY PLANS (hidden from new signups, kept for existing subscribers)
{
  id: 'pro-legacy',
  name: 'Pro (Legacy)',
  description: 'Legacy plan',
  currency: 'USD',
  hidden: true, // Don't show in pricing page
  features: ['~25 problems per month', '5 team seats', 'Priority support'],
  plans: [
    {
      id: 'pro-monthly',
      lineItems: [{ id: 'price_1SlTLUEe4gCtTPhvwy9m7oKd', cost: 49900, type: 'flat' }],
    },
    {
      id: 'pro-annual',
      lineItems: [{ id: 'price_1SlTQ3Ee4gCtTPhvjZz8TuaA', cost: 499000, type: 'flat' }],
    },
  ],
},

{
  id: 'max-legacy',
  name: 'Max (Legacy)',
  description: 'Legacy plan',
  currency: 'USD',
  hidden: true,
  features: ['~50 problems per month', '10 team seats', 'Dedicated support'],
  plans: [
    {
      id: 'max-monthly',
      lineItems: [{ id: 'price_1SlTMmEe4gCtTPhv4Uj5295n', cost: 99900, type: 'flat' }],
    },
    {
      id: 'max-annual',
      lineItems: [{ id: 'price_1SlTPGEe4gCtTPhvv5of2HDt', cost: 999000, type: 'flat' }],
    },
  ],
},
```

### Category Derivation (No Schema Change)

Instead of modifying the billing schema, derive category from product ID:

```typescript
// apps/web/lib/billing/plan-categories.ts (NEW FILE)

export type PlanCategory = 'individual' | 'team';

const INDIVIDUAL_PRODUCT_IDS = new Set(['lite', 'core', 'individual-pro']);
const TEAM_PRODUCT_IDS = new Set(['team-pro', 'team-max', 'enterprise']);

export function getProductCategory(productId: string): PlanCategory {
  if (TEAM_PRODUCT_IDS.has(productId)) return 'team';
  return 'individual'; // Default to individual (includes legacy)
}

export function isEnterpriseProduct(productId: string): boolean {
  return productId === 'enterprise';
}

export function filterProductsByCategory(
  products: Product[],
  category: PlanCategory
): Product[] {
  const targetSet = category === 'team' ? TEAM_PRODUCT_IDS : INDIVIDUAL_PRODUCT_IDS;
  return products.filter(p => targetSet.has(p.id) && !p.hidden);
}
```

---

## Part 3: Token Limits & Usage Updates

### Update PLAN_TOKEN_LIMITS

**File**: `apps/web/lib/usage/constants.ts`

```typescript
export const PLAN_TOKEN_LIMITS: Record<string, number> = {
  // Individual plans
  'lite-monthly': 1_000_000,    // 1MM
  'lite-annual': 1_000_000,
  'core-monthly': 3_000_000,    // 3MM
  'core-annual': 3_000_000,
  'individual-pro-monthly': 6_000_000,  // 6MM
  'individual-pro-annual': 6_000_000,

  // Team plans
  'team-pro-monthly': 7_500_000,   // 7.5MM
  'team-pro-annual': 7_500_000,
  'team-max-monthly': 15_000_000,  // 15MM
  'team-max-annual': 15_000_000,

  // Legacy plans (keep for existing subscribers)
  'pro-monthly': 10_000_000,   // Legacy - keep at 10MM
  'pro-annual': 10_000_000,
  'max-monthly': 20_000_000,   // Legacy - keep at 20MM
  'max-annual': 20_000_000,
};
```

### Update PRODUCT_REPORT_LIMITS

**File**: `apps/web/lib/billing/plan-limits.ts`

```typescript
const PRODUCT_REPORT_LIMITS: Record<string, number> = {
  // Individual
  lite: 3,
  core: 10,
  'individual-pro': 17,

  // Team
  'team-pro': 21,
  'team-max': 42,

  // Legacy (keep for existing subscribers)
  pro: 25,
  max: 50,
  'pro-legacy': 25,
  'max-legacy': 50,
};
```

### Update PRODUCTS_WITH_TEAMS_ACCESS

**File**: `apps/web/lib/billing/plan-limits.ts`

```typescript
// Products that grant access to /app/teams and team features
const PRODUCTS_WITH_TEAMS_ACCESS = new Set([
  // New team plans
  'team-pro',
  'team-max',
  // Legacy plans (grandfathered)
  'pro',
  'max',
  'pro-legacy',
  'max-legacy',
]);

// checkTeamsAccess() already uses this set - no change needed to function
```

### How Token Limits Flow Works

```
1. User subscribes → Stripe webhook fires
2. handleInvoicePaid() called with line_items[0].variant_id (Stripe price ID)
3. getPlanIdFromPriceId(priceId) → returns plan ID (e.g., 'team-pro-monthly')
4. getPlanTokenLimit(planId) → returns 10_000_000
5. get_or_create_usage_period(account_id, 10_000_000) → creates/updates usage_periods row
6. User starts report → check_usage_allowed() verifies tokens available
7. Report completes → increment_usage() deducts tokens
```

**No database schema changes needed** - the system already stores `tokens_limit` per billing period.

---

## Part 4: Team Selection Flow

### Current State

- Personal billing page: `/app/billing` → uses `createPersonalAccountCheckoutSession`
- Team billing page: `/app/[account]/billing` → uses `createTeamAccountCheckoutSession`
- Team plans require a team account to exist

### Problem

User on personal billing page clicks "Team Pro" but has no team account.

### Solution: Disable with Explanation (MVP)

For MVP, disable team plan buttons with a clear message:

```typescript
// In sparlo-billing-pricing.tsx

const isTeamProduct = TEAM_PRODUCT_IDS.has(product.id);
const hasTeamAccount = userAccounts.length > 0; // From workspace loader

// For team products when user has no team
{isTeamProduct && !hasTeamAccount && (
  <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
    <a href="/app/teams" className="font-medium underline">Create a team</a> to subscribe to team plans
  </div>
)}

<button
  disabled={isTeamProduct && !hasTeamAccount}
  className={cn(
    'w-full rounded-lg px-6 py-3 text-sm font-medium',
    isTeamProduct && !hasTeamAccount && 'cursor-not-allowed opacity-50'
  )}
>
  {isTeamProduct && !hasTeamAccount ? 'Requires Team Account' : 'Get Started'}
</button>
```

### Future Enhancement (Post-MVP)

Full redirect flow:
1. User clicks Team Pro → redirect to `/app/teams/new?return=/app/billing&plan=team-pro`
2. User creates team → redirect back to billing with plan pre-selected
3. Checkout uses team account

---

## Part 5: UI Implementation (Simplified)

### Single File Approach

All changes in `apps/web/app/app/billing/_components/sparlo-billing-pricing.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@kit/ui/utils';
import { Check } from 'lucide-react';
import { filterProductsByCategory, isEnterpriseProduct, type PlanCategory } from '~/lib/billing/plan-categories';
import { DURATION, EASE } from '~/app/app/_lib/animation';

// Local component - no separate file
function PlanCategoryToggle({
  value,
  onChange
}: {
  value: PlanCategory;
  onChange: (v: PlanCategory) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-zinc-100 p-1">
      <button
        onClick={() => onChange('individual')}
        className={cn(
          'rounded-full px-6 py-2.5 text-sm font-medium transition-colors',
          value === 'individual'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700'
        )}
      >
        Individual
      </button>
      <button
        onClick={() => onChange('team')}
        className={cn(
          'rounded-full px-6 py-2.5 text-sm font-medium transition-colors',
          value === 'team'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700'
        )}
      >
        Team
      </button>
    </div>
  );
}

export function SparloBillingPricing({
  products,
  customerId,
  pending,
  hasTeamAccount, // Add to props
}) {
  const [category, setCategory] = useState<PlanCategory>('individual');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  // Filter products by category
  const visibleProducts = filterProductsByCategory(products, category);

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Category Toggle */}
      <div className="mb-8 flex justify-center">
        <PlanCategoryToggle value={category} onChange={setCategory} />
      </div>

      {/* Billing Period Toggle (existing) */}
      <div className="mb-10 flex justify-center">
        {/* ... existing billing period toggle ... */}
      </div>

      {/* Pricing Cards with Framer Motion crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: DURATION.normal / 1000, ease: EASE.out }}
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
        {visibleProducts.map((product) => {
          const isEnterprise = isEnterpriseProduct(product.id);
          const isTeam = category === 'team';
          const needsTeam = isTeam && !hasTeamAccount && !isEnterprise;

          if (isEnterprise) {
            return (
              <div key={product.id} className="flex flex-col rounded-xl border border-zinc-200 bg-white p-8">
                <h3 className="text-xl font-semibold text-zinc-900">{product.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-bold text-zinc-900">Custom</span>
                </div>
                <a
                  href="mailto:sales@sparlo.ai?subject=Enterprise%20Inquiry"
                  className="mb-8 flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:border-zinc-900"
                >
                  Contact Sales
                </a>
                <div className="mt-auto border-t border-zinc-100 pt-6">
                  <p className="mb-4 text-sm text-zinc-500">Everything in Team Max, plus:</p>
                  <ul className="space-y-3">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-zinc-600">
                        <Check className="mt-0.5 h-4 w-4 text-zinc-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          }

          // Regular pricing card
          const plan = product.plans.find(p =>
            billingPeriod === 'monthly' ? p.interval === 'month' : p.interval === 'year'
          );
          const price = plan?.lineItems[0]?.cost ? plan.lineItems[0].cost / 100 : 0;

          return (
            <div
              key={product.id}
              className={cn(
                'flex flex-col rounded-xl border bg-white p-8 transition-all',
                product.highlighted
                  ? 'border-zinc-900 shadow-lg'
                  : 'border-zinc-200 hover:border-zinc-300'
              )}
            >
              <h3 className="text-xl font-semibold text-zinc-900">{product.name}</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold tracking-tight text-zinc-900">
                  ${price}
                </span>
                <span className="text-zinc-500">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
              </div>

              {needsTeam && (
                <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <a href="/app/teams" className="font-medium underline">Create a team</a> to subscribe
                </div>
              )}

              <button
                disabled={needsTeam || pending}
                onClick={() => handleSelectPlan(product.id, plan?.id)}
                className={cn(
                  'w-full rounded-lg px-6 py-3 text-sm font-medium transition-colors',
                  needsTeam && 'cursor-not-allowed opacity-50',
                  product.highlighted
                    ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                    : 'border border-zinc-300 text-zinc-900 hover:border-zinc-900'
                )}
              >
                {needsTeam ? 'Requires Team' : 'Get Started'}
              </button>

              <div className="mt-8 border-t border-zinc-100 pt-6">
                <ul className="space-y-3">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-zinc-600">
                      <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

---

## Part 6: File Changes Summary

| File | Change | Purpose |
|------|--------|---------|
| `apps/web/config/billing.config.ts` | Edit | Add new products, mark legacy as hidden |
| `apps/web/lib/billing/plan-categories.ts` | **Create** | Category derivation functions |
| `apps/web/lib/billing/plan-limits.ts` | Edit | Update `PRODUCTS_WITH_TEAMS_ACCESS`, `PRODUCT_REPORT_LIMITS` |
| `apps/web/lib/usage/constants.ts` | Edit | Update `PLAN_TOKEN_LIMITS` with new plan IDs |
| `apps/web/app/app/billing/_components/sparlo-billing-pricing.tsx` | Edit | Add toggle, category filtering, team gating |
| `apps/web/app/app/billing/page.tsx` | Edit | Pass `hasTeamAccount` to pricing component |

---

## Part 7: Acceptance Criteria

- [ ] Individual/Team toggle appears at top of billing page
- [ ] Individual tab shows: Lite, Core, Pro (3 cards)
- [ ] Team tab shows: Team Pro, Team Max, Enterprise (3 cards)
- [ ] Enterprise card has "Contact Sales" mailto link
- [ ] Team plans disabled with message when user has no team
- [ ] Cards stack on mobile (1 column)
- [ ] Monthly/Annual toggle works for both categories
- [ ] Existing Pro/Max subscribers see their plan in subscriber page
- [ ] Token limits work correctly for all new plan IDs
- [ ] Teams access works for new team plan product IDs

---

## Part 8: Pre-Implementation Checklist

### User Must Complete Before Implementation

1. **Create Stripe prices** and provide actual price IDs:
   - [ ] Individual Pro Monthly ($399) → `price_...`
   - [ ] Individual Pro Annual ($3,990) → `price_...`
   - [ ] Team Pro Monthly ($499) → `price_...`
   - [ ] Team Pro Annual ($4,990) → `price_...`
   - [ ] Team Max Monthly ($999) → `price_...`
   - [ ] Team Max Annual ($9,990) → `price_...`

2. **Confirm grandfathering approach**:
   - [ ] Keep existing Pro/Max subscribers on current prices (recommended)
   - [ ] OR migrate them to Team Pro/Team Max (requires communication)

---

## References

### Internal Files
- Billing config: `apps/web/config/billing.config.ts`
- Plan limits: `apps/web/lib/billing/plan-limits.ts`
- Usage constants: `apps/web/lib/usage/constants.ts`
- Pricing component: `apps/web/app/app/billing/_components/sparlo-billing-pricing.tsx`
- Team creation: `packages/features/team-accounts/src/components/create-team-account-dialog.tsx`
- Usage tracking: `apps/web/supabase/schemas/17-usage-periods.sql`

### How Systems Connect

```
billing.config.ts (products, plans, price IDs)
        ↓
plan-limits.ts (builds lookup maps at module load)
        ↓
    ┌───────────────────────────────────────┐
    │                                       │
    ↓                                       ↓
checkTeamsAccess()                  getPlanTokenLimit()
    ↓                                       ↓
loadUserWorkspace()                 handleInvoicePaid()
(gates /app/teams)                  (sets token limit)
```
