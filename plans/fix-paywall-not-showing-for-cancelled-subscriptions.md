# fix: Paywall not showing for users without enough tokens

## Overview

The paywall should show to **anyone who doesn't have enough tokens (350k) to run a new report**. Currently, users with cancelled subscriptions can bypass the paywall due to complex subscription status logic with edge cases.

## Problem Statement

**Current Behavior:** Complex subscription + token checks with fallback logic that has bugs allowing cancelled users through.

**Desired Behavior:** Simple token-based gating - if user has < 350k tokens available, show paywall.

## Proposed Solution

Replace complex subscription/token logic with a single check:

```
tokens_available < 350k → show paywall
tokens_available >= 350k → allow access
```

This eliminates:
- Subscription status edge cases
- Fallback logic bugs
- First report freemium complexity (can keep separately if desired)

## Technical Approach

### Files to Modify

| File | Change |
|------|--------|
| `apps/web/app/app/_lib/server/usage.service.ts` | Simplify to pure token check |
| `apps/web/lib/usage/constants.ts` | Update `ESTIMATED_TOKENS_PER_REPORT` to 350k |

### Implementation

#### usage.service.ts - Simplified `checkUsageAllowed`

```typescript
export const checkUsageAllowed = cache(async function checkUsageAllowed(
  accountId: string,
  estimatedTokens: number = ESTIMATED_TOKENS_PER_REPORT, // 350_000
): Promise<UsageStatus> {
  const supabase = await getSupabaseServerClient();

  // 1. Super admin bypass (keep existing)
  const isSuperAdmin = await checkSuperAdmin(supabase);
  if (isSuperAdmin) {
    return { allowed: true, reason: 'ok', /* ... */ };
  }

  // 2. Get user's available tokens
  const { data: usagePeriod } = await supabase
    .from('usage_periods')
    .select('tokens_limit, tokens_used, period_end')
    .eq('account_id', accountId)
    .eq('status', 'active')
    .single();

  // No active period = no tokens
  if (!usagePeriod) {
    return {
      allowed: false,
      reason: 'subscription_required', // or 'limit_exceeded'
      tokensUsed: 0,
      tokensLimit: 0,
      /* ... */
    };
  }

  const tokensAvailable = usagePeriod.tokens_limit - usagePeriod.tokens_used;

  // 3. Simple check: do they have enough tokens?
  if (tokensAvailable < estimatedTokens) {
    return {
      allowed: false,
      reason: 'limit_exceeded',
      tokensUsed: usagePeriod.tokens_used,
      tokensLimit: usagePeriod.tokens_limit,
      /* ... */
    };
  }

  // 4. Allowed
  return {
    allowed: true,
    reason: 'ok',
    tokensUsed: usagePeriod.tokens_used,
    tokensLimit: usagePeriod.tokens_limit,
    /* ... */
  };
});
```

#### constants.ts

```typescript
export const ESTIMATED_TOKENS_PER_REPORT = 350_000; // Updated from 180_000
```

## Acceptance Criteria

- [ ] User with < 350k tokens available sees paywall (`limit_exceeded`)
- [ ] User with >= 350k tokens available can create new report
- [ ] User with no usage period sees paywall (`subscription_required`)
- [ ] Super admin bypass still works
- [ ] Existing E2E tests pass (may need threshold updates)

## Edge Cases Handled

| Scenario | Result |
|----------|--------|
| Active subscription, 400k tokens available | ALLOWED |
| Active subscription, 200k tokens available | BLOCKED (< 350k) |
| Cancelled subscription, 0 tokens | BLOCKED |
| Cancelled subscription, 400k tokens (stale period) | ALLOWED (they have tokens) |
| No subscription, no usage period | BLOCKED |
| Super admin | ALLOWED (bypass) |

## Questions to Consider

1. **Keep first report free?** - If yes, check `first_report_used_at` before token check
2. **What if cancelled user has tokens left from old period?** - Current plan allows them to use remaining tokens. Alternative: expire periods when subscription cancels.

## References

- `apps/web/app/app/_lib/server/usage.service.ts` - Main logic
- `apps/web/lib/usage/constants.ts:15` - Token threshold constant
- `apps/web/app/app/reports/new/_components/token-gate-screen.tsx` - Paywall UI
