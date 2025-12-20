---
status: completed
priority: p2
issue_id: "076"
tags: [code-review, performance, database]
dependencies: []
---

# Missing Index on subscription_items.variant_id

## Problem Statement

The `getTokenLimitForAccount()` query filters on `variant_id` but there's no index on this column. As subscription data grows, this will cause significant performance degradation.

**Why it matters:**
- At 10,000 subscription items: ~50-100ms query time
- At 100,000 subscription items: ~500ms-1s query time
- Sequential scan on every usage check

## Findings

### Evidence from Performance Review

**Current Query Pattern:**
```typescript
const { data: subscription } = await client
  .from('subscriptions')
  .select(`active, subscription_items (variant_id)`)
  .eq('account_id', accountId)
  .eq('active', true)
  .maybeSingle();
```

**Missing indexes:**
- No index on `subscription_items.variant_id`
- No composite index on `(subscription_id, variant_id)`
- No partial index on `subscriptions` for active only

## Proposed Solutions

### Solution 1: Add Covering Index (Recommended)
**Pros:** Optimal for the query pattern, covers both lookups
**Cons:** Additional storage
**Effort:** Small (5 mins)
**Risk:** Low

```sql
CREATE INDEX CONCURRENTLY idx_subscription_items_subscription_variant
ON public.subscription_items(subscription_id, variant_id);
```

### Solution 2: Add Partial Index for Active Subscriptions
**Pros:** Smaller index, faster for common case
**Cons:** Only helps for active=true queries
**Effort:** Small (5 mins)
**Risk:** Low

```sql
CREATE INDEX CONCURRENTLY idx_subscriptions_account_active
ON public.subscriptions(account_id)
WHERE active = true;
```

## Recommended Action

Implement both indexes - they serve different query patterns.

## Technical Details

**Affected files:**
- New migration file

## Acceptance Criteria

- [ ] Index on subscription_items.variant_id exists
- [ ] Partial index on subscriptions.active exists
- [ ] Query explain shows index usage

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-19 | Created | From performance review |

## Resources

- PR Branch: `feat/token-based-usage-tracking`
- Performance Review Agent: Identified as HIGH severity
