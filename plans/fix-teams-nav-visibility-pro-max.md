# fix: Teams navigation not visible for Pro/Max plan subscribers

## Problem

Pro/Max subscribers cannot see Teams link. Root cause: `PLAN_REPORT_LIMITS` has wrong Stripe price IDs.

## Solution (DHH + Kieran approach)

### 1. Add `hasTeamsAccess` to billing config products

```typescript
// billing.config.ts - add to each product
{
  id: 'pro',
  name: 'Pro',
  hasTeamsAccess: true,  // <-- Add this
  // ...
}
```

### 2. Add utility function in plan-limits.ts

```typescript
export function hasTeamsAccess(priceId: string): boolean {
  for (const product of billingConfig.products) {
    for (const plan of product.plans) {
      for (const lineItem of plan.lineItems) {
        if (lineItem.id === priceId) {
          return product.hasTeamsAccess ?? false;
        }
      }
    }
  }
  return false;
}
```

### 3. Update load-user-workspace.ts

- Import `hasTeamsAccess` utility
- Rename `isPaidPlan` to `hasTeamsAccess`
- Keep `reportLimit` working via updated price ID map
- Add error logging

### 4. Update consumers

- `nav-sidebar.tsx`: Change `isPaidPlan` prop to `hasTeamsAccess`
- `teams/layout.tsx`: Change `isPaidPlan` check to `hasTeamsAccess`
- `app-workspace-context.tsx`: Update type and value

## Files to modify

| File | Change |
|------|--------|
| `apps/web/config/billing.config.ts` | Add `hasTeamsAccess` to products |
| `apps/web/lib/billing/plan-limits.ts` | Add `hasTeamsAccess()` utility |
| `apps/web/app/app/_lib/server/load-user-workspace.ts` | Fix price IDs, rename var, add logging |
| `apps/web/app/app/_lib/app-workspace-context.tsx` | Rename `isPaidPlan` to `hasTeamsAccess` |
| `apps/web/app/app/_components/navigation/nav-sidebar.tsx` | Use `hasTeamsAccess` |
| `apps/web/app/app/teams/layout.tsx` | Use `hasTeamsAccess` |

## Acceptance criteria

- [ ] Pro/Max subscribers see Teams link
- [ ] Core/Lite/Free users don't see Teams link
- [ ] `/app/teams` access works for Pro/Max, redirects for others
- [ ] `hasTeamsAccess` is the single source of truth in billing config
