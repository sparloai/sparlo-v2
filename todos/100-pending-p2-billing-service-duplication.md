---
status: pending
priority: p2
issue_id: "100"
tags:
  - code-review
  - architecture
  - duplication
dependencies: []
---

# Billing Service Code Duplication (90%+)

## Problem Statement

The UserBillingService and TeamBillingService share 90%+ similar code, creating maintenance burden and inconsistency risks.

## Findings

- **Files:**
  - `apps/web/app/home/(user)/billing/_lib/server/user-billing.service.ts`
  - `apps/web/app/home/[account]/billing/_lib/server/team-billing.service.ts`
- **Agent:** Pattern Recognition Specialist

**Duplicated Patterns:**
1. Plan validation logic (~15 lines)
2. Billing portal session creation (~50 lines)
3. Checkout session creation (~40 lines)
4. Error handling patterns (~20 lines)

**Total duplicated code:** ~200+ lines

## Proposed Solutions

### Option A: Base Class Extraction (Recommended)
**Pros:** Clear inheritance, type-safe
**Cons:** Class-based approach
**Effort:** 3-4 hours
**Risk:** Low

```typescript
export abstract class BillingServiceBase {
  protected async validatePlanAndProduct(planId: string, productId: string) {
    const product = billingConfig.products.find(p => p.id === productId);
    if (!product) throw new Error('Product not found');
    const plan = product.plans.find(p => p.id === planId);
    if (!plan) throw new Error('Plan not found for this product');
    return { plan, product };
  }

  protected async createBillingPortalSessionCommon(...) { ... }
}
```

### Option B: Utility Functions
**Pros:** Simpler, functional approach
**Cons:** Less structured
**Effort:** 2 hours
**Risk:** Low

## Technical Details

### Affected Files
- `apps/web/app/home/(user)/billing/_lib/server/user-billing.service.ts`
- `apps/web/app/home/[account]/billing/_lib/server/team-billing.service.ts`
- New: `apps/web/app/home/_lib/server/billing-service-base.ts` or `billing-utils.ts`

## Acceptance Criteria

- [ ] Shared logic extracted to single location
- [ ] Both services use shared code
- [ ] Bug fixes apply to both services automatically
- [ ] Type safety maintained

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-23 | Created from pattern review | - |

## Resources

- PR: Current uncommitted changes
- Related: Pattern Recognition Specialist findings
