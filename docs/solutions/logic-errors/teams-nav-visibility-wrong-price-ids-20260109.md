---
module: Billing
date: 2026-01-09
problem_type: logic_error
component: payments
symptoms:
  - "Pro/Max subscribers cannot see Teams link in navigation"
  - "Navigating to /app/teams redirects to /app/billing"
  - "isPaidPlan returns false for valid Pro/Max subscriptions"
root_cause: config_error
resolution_type: code_fix
severity: high
tags: [stripe, subscription, feature-gating, teams, billing, price-ids]
---

# Troubleshooting: Teams Navigation Not Visible for Pro/Max Subscribers

## Problem

Pro and Max plan subscribers could not see the Teams link in the navigation sidebar, and navigating directly to `/app/teams` would redirect them to `/app/billing`. This was caused by a mismatch between hardcoded Stripe price IDs and the actual price IDs configured in `billing.config.ts`.

## Environment

- Module: Billing / Subscription Feature Gating
- Framework: Next.js 16 with App Router
- Affected Component: `load-user-workspace.ts`, `plan-limits.ts`, `nav-sidebar.tsx`, `teams/layout.tsx`
- Date: 2026-01-09

## Symptoms

- Pro/Max subscribers cannot see Teams link in navigation sidebar settings dropdown
- Direct navigation to `/app/teams` redirects to `/app/billing`
- `isPaidPlan` (now `hasTeamsAccess`) returns `false` for users with valid Pro/Max subscriptions
- Console shows no errors - silent failure

## What Didn't Work

**Direct solution:** The problem was identified through code review. The root cause was clear once the price ID mismatch was discovered.

## Solution

### 1. Fixed Price IDs in lookup map

The `PLAN_REPORT_LIMITS` map had old/sample Stripe price IDs that didn't match actual production values.

**Before (broken):**
```typescript
// apps/web/app/app/_lib/server/load-user-workspace.ts
const PLAN_REPORT_LIMITS: Record<string, number> = {
  free: 3,
  price_1NNwYHI1i3VnbZTqI2UzaHIe: 10,      // WRONG - doesn't exist
  'starter-yearly': 10,                     // WRONG - plan ID, not price ID
  price_1PGOAVI1i3VnbZTqc69xaypm: 50,      // WRONG - doesn't exist
  price_pro_yearly: 50,                     // WRONG - not a real price ID
  'price_enterprise-monthly': 999,          // WRONG format
  price_enterprise_yearly: 999,             // WRONG - doesn't exist
};
```

**After (fixed) - Centralized in `plan-limits.ts`:**
```typescript
// apps/web/lib/billing/plan-limits.ts
const PRODUCT_REPORT_LIMITS: Record<string, number> = {
  lite: 3,
  core: 10,
  pro: 25,
  max: 50,
};

// Build lookup maps once at module load from billing config
function buildLookupMaps() {
  const priceToReportLimit = new Map<string, number>();
  const priceToProductId = new Map<string, string>();

  for (const product of billingConfig.products) {
    const reportLimit = PRODUCT_REPORT_LIMITS[product.id] ?? 3;

    for (const plan of product.plans) {
      for (const lineItem of plan.lineItems) {
        priceToProductId.set(lineItem.id, product.id);
        priceToReportLimit.set(lineItem.id, reportLimit);
      }
    }
  }

  return { priceToReportLimit, priceToProductId };
}
```

### 2. Renamed `isPaidPlan` → `hasTeamsAccess`

The variable name was misleading - Lite and Core are also "paid" plans but don't have Teams access.

```typescript
// Before
const isPaidPlan = reportLimit >= 50;  // Vague - what does this control?

// After
const hasTeamsAccess = checkTeamsAccess(variantId);  // Explicit - Teams access
```

### 3. Added centralized `checkTeamsAccess()` function

```typescript
// apps/web/lib/billing/plan-limits.ts
const PRODUCTS_WITH_TEAMS_ACCESS = new Set(['pro', 'max']);

export function checkTeamsAccess(priceId: string): boolean {
  const productId = PRICE_TO_PRODUCT_MAP.get(priceId);
  return productId ? PRODUCTS_WITH_TEAMS_ACCESS.has(productId) : false;
}
```

### 4. Updated consumers

```typescript
// apps/web/app/app/teams/layout.tsx
if (!workspace.hasTeamsAccess) {
  redirect('/app/billing');
}

// apps/web/app/app/_components/navigation/nav-sidebar.tsx
{hasTeamsAccess && (
  <Link href={getPath(pathsConfig.app.personalAccountTeams)}>
    <Users /> Teams
  </Link>
)}
```

## Why This Works

### Root Cause

The `PLAN_REPORT_LIMITS` map in `load-user-workspace.ts` contained placeholder/sample Stripe price IDs (like `price_1NNwYHI1i3VnbZTqI2UzaHIe`) that didn't match the actual price IDs configured in `billing.config.ts` (like `price_1SlTLUEe4gCtTPhvwy9m7oKd`).

When a user's subscription `variant_id` (Stripe price ID) didn't match any key in the map:
1. `reportLimit` defaulted to 3
2. `isPaidPlan = reportLimit >= 50` evaluated to `false`
3. Teams link was hidden and route guard redirected to billing

### Why the Solution Addresses This

1. **Single Source of Truth**: Price IDs now come from `billing.config.ts` via dynamic map building
2. **O(1) Lookups**: Maps are built once at module load instead of triple-loop on every call
3. **Explicit Feature Gating**: `checkTeamsAccess()` explicitly checks product IDs, not report limits
4. **Clear Naming**: `hasTeamsAccess` accurately describes what the boolean controls

## Prevention

1. **Never hardcode Stripe price IDs** - Always derive from `billing.config.ts`
2. **Use descriptive variable names** - `hasTeamsAccess` not `isPaidPlan`
3. **Log unknown price IDs** - Add warnings for unrecognized subscription variants
4. **Test with real subscriptions** - Use Stripe test mode to verify feature gating works

### Recommended Pattern

```typescript
// GOOD: Derive from billing config
const productId = getProductIdFromPriceId(priceId);
const hasFeature = PRODUCTS_WITH_FEATURE.has(productId);

// BAD: Hardcode price IDs
const hasFeature = priceId === 'price_abc123';

// BAD: Infer from unrelated values
const hasFeature = reportLimit >= 50;
```

## Files Changed

| File | Change |
|------|--------|
| `apps/web/lib/billing/plan-limits.ts` | Added prebuilt Maps, `getReportLimit()`, `checkTeamsAccess()` |
| `apps/web/app/app/_lib/server/load-user-workspace.ts` | Removed hardcoded price IDs, use centralized functions |
| `apps/web/app/app/_components/navigation/nav-sidebar.tsx` | `isPaidPlan` → `hasTeamsAccess` |
| `apps/web/app/app/teams/layout.tsx` | `isPaidPlan` → `hasTeamsAccess` |

## Related Issues

No related issues documented yet.
