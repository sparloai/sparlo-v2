---
title: "Usage-Based Billing with Freemium Model"
category: features
tags:
  - billing
  - stripe
  - freemium
  - usage-tracking
  - subscription
severity: medium
component: Billing System
framework: Next.js 16, Stripe, Supabase
date: 2025-12-20
status: completed
---

# Usage-Based Billing with Freemium Model

## Feature Overview

Implemented a freemium billing model where:
- First report is free (no subscription required)
- Subsequent reports require an active subscription
- Subscription includes monthly token allowance
- Usage is tracked and displayed to users

## Implementation

### Usage Check Flow

```typescript
// apps/web/app/home/(user)/_lib/server/usage.service.ts

export async function checkUsageAllowed(
  userId: string,
  estimatedTokens: number
): Promise<UsageCheckResult> {
  const client = getSupabaseServerClient();

  // Check if first report is available
  const { data: profile } = await client
    .from('profiles')
    .select('first_report_used')
    .eq('id', userId)
    .single();

  if (!profile?.first_report_used) {
    return {
      allowed: true,
      isFirstReport: true,
      percentage: 0,
    };
  }

  // Check subscription status
  const subscription = await getActiveSubscription(userId);
  if (!subscription) {
    return {
      allowed: false,
      reason: 'subscription_required',
      percentage: 100,
    };
  }

  // Check usage limits
  const usage = await getCurrentPeriodUsage(userId, subscription);
  const wouldExceed = (usage.used + estimatedTokens) > usage.limit;

  return {
    allowed: !wouldExceed,
    reason: wouldExceed ? 'limit_exceeded' : undefined,
    percentage: (usage.used / usage.limit) * 100,
    periodEnd: subscription.current_period_end,
    isWarning: usage.percentage > 80,
  };
}
```

### First Report Tracking

```typescript
// Mark first report as used after successful creation
export async function markFirstReportUsed(userId: string): Promise<void> {
  const client = getSupabaseServerClient();

  await client
    .from('profiles')
    .update({ first_report_used: true })
    .eq('id', userId);
}
```

### Integration with Report Generation

```typescript
// apps/web/app/home/(user)/_lib/server/hybrid-reports-server-actions.ts

export const startHybridReportGeneration = enhanceAction(
  async (data, user) => {
    // Check usage limits FIRST
    const usage = await checkUsageAllowed(
      user.id,
      USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT,
    );

    if (!usage.allowed) {
      if (usage.reason === 'subscription_required') {
        throw new Error(
          'Your free report has been used. Please subscribe to generate more reports.',
        );
      }
      if (usage.reason === 'limit_exceeded') {
        throw new Error(
          `Usage limit reached (${usage.percentage.toFixed(0)}% used).`
        );
      }
    }

    // Track first report usage
    const isFirstReport = usage.isFirstReport;

    // ... create report ...

    // Mark first report as used after successful creation
    if (isFirstReport) {
      await markFirstReportUsed(user.id);
    }
  }
);
```

### Error Messages

```typescript
// User-friendly error messages
{
  subscription_required:
    'Your free report has been used. Please subscribe to generate more reports.',
  limit_exceeded:
    `Usage limit reached (${percentage}% used). Upgrade your plan or wait until ${periodEnd}.`,
}
```

## Database Schema

```sql
-- profiles table addition
ALTER TABLE profiles
ADD COLUMN first_report_used BOOLEAN DEFAULT FALSE;

-- Usage tracking in subscriptions table
-- current_period_start, current_period_end, usage_limit, usage_used
```

## UI Integration

The usage check happens before:
1. Creating a new report from `/home/reports/new`
2. API calls to `/api/hybrid/reports`

Users see clear error messages directing them to subscribe when needed.

## Files Changed

- `apps/web/app/home/(user)/_lib/server/usage.service.ts` - New usage check service
- `apps/web/app/home/(user)/_lib/server/hybrid-reports-server-actions.ts` - Integrated usage checks
- `apps/web/lib/usage/constants.ts` - Usage constants
- Database migration for `first_report_used` column

## Commits

- `a35ea8a` - feat(billing): implement usage-based billing with freemium model
- `bda8bf5` - Merge branch 'feat/billing-stripe-integration'

## Related

- `docs/solutions/features/token-based-usage-tracking.md` - Token tracking implementation
