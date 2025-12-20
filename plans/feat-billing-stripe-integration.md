# feat: Stripe Billing Integration with Tiered Subscriptions

## Overview

Set up Stripe billing using the existing Makerkit boilerplate, manage tiered subscriptions (Starter/Pro/Enterprise), track token usage per tier, reset monthly, and implement a freemium model where the first report is free.

## Security & Reliability Improvements

This plan addresses critical issues identified in code review:

| Issue | Fix |
|-------|-----|
| **Type Safety** | Zod schema validation on all RPC/database responses |
| **Error Handling** | Explicit error checks on all billing-critical queries (no silent failures) |
| **Race Conditions** | `markFirstReportUsed` verifies update succeeded before returning |
| **SQL Function Security** | `reset_usage_period` only granted to `service_role`, not `authenticated` |
| **DRY Violation** | Token limits derived from single source (`plan-limits.ts` + `billing.config.ts`) |
| **Webhook Idempotency** | `processed_webhook_events` table prevents duplicate processing |
| **Subscription Grace Period** | Canceled subscriptions with remaining time still allow access |

## Problem Statement

Users can currently generate unlimited reports without payment. We need to:
1. Gate report generation behind subscriptions after the first free report
2. Track token usage per subscription tier with monthly limits
3. Reset usage at the start of each billing cycle
4. Provide a seamless upgrade path when users hit limits

## Technical Context

### Existing Infrastructure (Already Built)

| Component | Location | Status |
|-----------|----------|--------|
| Stripe package | `packages/billing/stripe/` | Ready - includes SDK, webhooks, billing strategy |
| Billing config | `apps/web/config/billing.config.ts` | Exists but uses sample data |
| Webhook handler | `apps/web/app/api/billing/webhook/route.ts` | Ready - handles subscription events |
| Usage tracking | `apps/web/lib/usage/` | Ready - `usage_periods` table, `increment_usage()` function |
| Token limits | `apps/web/lib/usage/constants.ts` | Defined: Starter 3M, Pro 10M, Enterprise 30M |
| Billing pages | `apps/web/app/home/(user)/billing/` | Ready - uses Makerkit components |
| Pricing page | `apps/web/app/(marketing)/pricing/page.tsx` | Ready - renders from billing config |

### Missing Pieces

| Component | Required Action |
|-----------|-----------------|
| Stripe env vars | Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Real Stripe products | Create products in Stripe Dashboard, get Price IDs |
| Billing config | Replace sample config with real Price IDs |
| First-report-free logic | Add `first_report_used` tracking |
| Subscription paywall | Block second report without subscription |
| Usage-tier sync | Link subscription tier to token limits |

## Acceptance Criteria

- [ ] Environment variables configured for Stripe (test mode)
- [ ] Stripe products created with correct pricing
- [ ] `billing.config.ts` updated with real Price IDs
- [ ] First report generates without subscription
- [ ] Second report attempt shows subscription paywall
- [ ] Subscription purchase flow works end-to-end
- [ ] Token usage tracked against tier limits
- [ ] Usage resets at billing cycle renewal
- [ ] Users can view usage in dashboard
- [ ] Users can upgrade/downgrade tiers
- [ ] Cancellation preserves access until period end

## Implementation

### Phase 1: Stripe Configuration

#### 1.1 Create Stripe Products

In Stripe Dashboard (test mode), create:

| Product | Monthly Price | Yearly Price | Token Limit |
|---------|--------------|--------------|-------------|
| Starter | $29/mo | $290/yr | 3,000,000 |
| Pro | $99/mo | $990/yr | 10,000,000 |
| Enterprise | $299/mo | $2,990/yr | 30,000,000 |

#### 1.2 Environment Variables

```bash
# apps/web/.env.local (create this file)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### 1.3 Update Billing Config

```typescript
// apps/web/config/billing.config.ts
import { BillingProviderSchema, createBillingSchema } from '@kit/billing';

const provider = BillingProviderSchema.parse(
  process.env.NEXT_PUBLIC_BILLING_PROVIDER,
);

export default createBillingSchema({
  provider,
  products: [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for individuals exploring technical solutions',
      currency: 'USD',
      badge: 'Popular',
      plans: [
        {
          name: 'Starter Monthly',
          id: 'starter-monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_STARTER_MONTHLY_ID', // Replace with real Stripe Price ID
              name: 'Starter Plan',
              cost: 29,
              type: 'flat',
            },
          ],
        },
        {
          name: 'Starter Yearly',
          id: 'starter-yearly',
          paymentType: 'recurring',
          interval: 'year',
          lineItems: [
            {
              id: 'price_STARTER_YEARLY_ID', // Replace with real Stripe Price ID
              name: 'Starter Plan',
              cost: 290,
              type: 'flat',
            },
          ],
        },
      ],
      features: [
        '~15 reports per month',
        '3 million tokens',
        'Full-spectrum analysis',
        'Export to PDF',
        'Email support',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For teams and power users',
      currency: 'USD',
      badge: 'Best Value',
      highlighted: true,
      plans: [
        {
          name: 'Pro Monthly',
          id: 'pro-monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_PRO_MONTHLY_ID', // Replace with real Stripe Price ID
              name: 'Pro Plan',
              cost: 99,
              type: 'flat',
            },
          ],
        },
        {
          name: 'Pro Yearly',
          id: 'pro-yearly',
          paymentType: 'recurring',
          interval: 'year',
          lineItems: [
            {
              id: 'price_PRO_YEARLY_ID', // Replace with real Stripe Price ID
              name: 'Pro Plan',
              cost: 990,
              type: 'flat',
            },
          ],
        },
      ],
      features: [
        '~50 reports per month',
        '10 million tokens',
        'Full-spectrum analysis',
        'Priority processing',
        'Export to PDF',
        'Priority support',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For organizations with high-volume needs',
      currency: 'USD',
      plans: [
        {
          name: 'Enterprise Monthly',
          id: 'enterprise-monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_ENTERPRISE_MONTHLY_ID', // Replace with real Stripe Price ID
              name: 'Enterprise Plan',
              cost: 299,
              type: 'flat',
            },
          ],
        },
        {
          name: 'Enterprise Yearly',
          id: 'enterprise-yearly',
          paymentType: 'recurring',
          interval: 'year',
          lineItems: [
            {
              id: 'price_ENTERPRISE_YEARLY_ID', // Replace with real Stripe Price ID
              name: 'Enterprise Plan',
              cost: 2990,
              type: 'flat',
            },
          ],
        },
      ],
      features: [
        '~150 reports per month',
        '30 million tokens',
        'Full-spectrum analysis',
        'Priority processing',
        'Export to PDF',
        'Dedicated support',
        'Custom integrations',
      ],
    },
  ],
});
```

### Phase 2: First Report Free Logic

#### 2.1 Database Migration

```sql
-- apps/web/supabase/migrations/YYYYMMDDHHMMSS_add_first_report_tracking.sql

-- Track first report usage per account
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS first_report_used_at TIMESTAMPTZ DEFAULT NULL;

-- Comment for clarity
COMMENT ON COLUMN public.accounts.first_report_used_at IS
  'Timestamp when the account used their free first report. NULL means not yet used.';
```

#### 2.2 Update Usage Service

```typescript
// apps/web/app/home/(user)/_lib/server/usage.service.ts

import 'server-only';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { USAGE_CONSTANTS } from '~/lib/usage/constants';
import { getPlanTokenLimit } from '~/lib/billing/plan-limits';

// Schema validation for RPC response (type safety fix)
const UsageCheckResultSchema = z.object({
  allowed: z.boolean(),
  tokens_used: z.number().int().nonnegative(),
  tokens_limit: z.number().int().positive(),
  remaining: z.number().int(),
  percentage: z.number().min(0).max(100),
  reports_count: z.number().int().nonnegative(),
  chat_tokens_used: z.number().int().nonnegative(),
});

export interface UsageStatus {
  allowed: boolean;
  reason: 'ok' | 'first_report_available' | 'subscription_required' | 'limit_exceeded';
  tokensUsed: number;
  tokensLimit: number;
  percentage: number;
  periodEnd: string | null;
  isFirstReport: boolean;
  hasActiveSubscription: boolean;
}

export async function checkUsageAllowed(
  accountId: string,
  estimatedTokens: number = USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT,
): Promise<UsageStatus> {
  const client = getSupabaseServerClient();

  // Check if account has used first free report (explicit error handling)
  const { data: account, error: accountError } = await client
    .from('accounts')
    .select('first_report_used_at')
    .eq('id', accountId)
    .single();

  if (accountError) {
    throw new Error(`Failed to check first report status: ${accountError.message}`);
  }

  const hasUsedFirstReport = !!account?.first_report_used_at;

  // Check for active subscription OR canceled subscription still in paid period (grace period fix)
  const { data: subscription, error: subError } = await client
    .from('subscriptions')
    .select('id, status, period_ends_at')
    .eq('account_id', accountId)
    .or('active.eq.true,and(status.eq.canceled,period_ends_at.gte.now())')
    .maybeSingle();

  if (subError) {
    throw new Error(`Failed to check subscription status: ${subError.message}`);
  }

  const hasActiveSubscription = !!subscription;

  // First report is free
  if (!hasUsedFirstReport) {
    return {
      allowed: true,
      reason: 'first_report_available',
      tokensUsed: 0,
      tokensLimit: USAGE_CONSTANTS.DEFAULT_TOKEN_LIMIT,
      percentage: 0,
      periodEnd: null,
      isFirstReport: true,
      hasActiveSubscription,
    };
  }

  // No subscription after first report
  if (!hasActiveSubscription) {
    return {
      allowed: false,
      reason: 'subscription_required',
      tokensUsed: 0,
      tokensLimit: 0,
      percentage: 100,
      periodEnd: null,
      isFirstReport: false,
      hasActiveSubscription: false,
    };
  }

  // Check usage against subscription tier
  const { data: rawUsageData, error: usageError } = await client.rpc('check_usage_allowed', {
    p_account_id: accountId,
    p_estimated_tokens: estimatedTokens,
  });

  if (usageError) {
    throw new Error(`Failed to check usage: ${usageError.message}`);
  }

  if (!rawUsageData) {
    throw new Error('No usage data returned from check_usage_allowed');
  }

  // Validate response schema (type safety)
  const usageData = UsageCheckResultSchema.parse(rawUsageData);

  return {
    allowed: usageData.allowed,
    reason: usageData.allowed ? 'ok' : 'limit_exceeded',
    tokensUsed: usageData.tokens_used,
    tokensLimit: usageData.tokens_limit,
    percentage: usageData.percentage,
    periodEnd: subscription.period_ends_at,
    isFirstReport: false,
    hasActiveSubscription: true,
  };
}

export async function markFirstReportUsed(accountId: string): Promise<void> {
  const client = getSupabaseServerClient();

  // Verify the update succeeded (race condition fix)
  const { data, error } = await client
    .from('accounts')
    .update({ first_report_used_at: new Date().toISOString() })
    .eq('id', accountId)
    .is('first_report_used_at', null)
    .select('id')
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned (already set by another request)
    throw new Error(`Failed to mark first report used: ${error.message}`);
  }

  if (!data) {
    // Already marked by concurrent request - this is fine, just log
    console.warn('[Usage] First report already marked for account:', accountId);
  }
}
```

#### 2.3 Update Report Creation

```typescript
// apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts
// Add to createReport function:

import { checkUsageAllowed, markFirstReportUsed } from './usage.service';

// Inside createReport action, before creating the report:
const usageStatus = await checkUsageAllowed(accountId);

if (!usageStatus.allowed) {
  if (usageStatus.reason === 'subscription_required') {
    return {
      success: false,
      error: 'subscription_required',
      message: 'Please subscribe to generate more reports.',
    };
  }
  if (usageStatus.reason === 'limit_exceeded') {
    return {
      success: false,
      error: 'limit_exceeded',
      message: 'You have reached your monthly token limit. Please upgrade your plan.',
    };
  }
}

// After successful report creation, if it was the first report:
if (usageStatus.isFirstReport) {
  await markFirstReportUsed(accountId);
}
```

### Phase 3: Subscription Paywall Component

#### 3.1 Create Paywall Component

```typescript
// apps/web/app/home/(user)/_components/subscription-required-modal.tsx
'use client';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Trans } from '@kit/ui/trans';
import Link from 'next/link';

interface SubscriptionRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: 'subscription_required' | 'limit_exceeded';
}

export function SubscriptionRequiredModal({
  open,
  onOpenChange,
  reason,
}: SubscriptionRequiredModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {reason === 'subscription_required'
              ? 'Subscribe to Continue'
              : 'Usage Limit Reached'}
          </DialogTitle>
          <DialogDescription>
            {reason === 'subscription_required' ? (
              <>
                You've used your free report. Subscribe to generate unlimited
                reports with our AI-powered analysis engine.
              </>
            ) : (
              <>
                You've reached your monthly token limit. Upgrade your plan to
                continue generating reports this month.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button asChild>
            <Link href="/home/billing">
              {reason === 'subscription_required' ? 'View Plans' : 'Upgrade Plan'}
            </Link>
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Phase 4: Usage Reset on Billing Cycle

#### 4.1 Single Source of Truth for Plan Limits (DRY Fix)

```typescript
// apps/web/lib/billing/plan-limits.ts
import 'server-only';
import billingConfig from '~/config/billing.config';
import { PLAN_TOKEN_LIMITS } from '~/lib/usage/constants';

/**
 * Maps Stripe price IDs to plan IDs using billing config as single source of truth.
 * This avoids hardcoding price IDs in multiple places.
 */
function buildPriceToLimitMap(): Map<string, number> {
  const priceToLimit = new Map<string, number>();

  for (const product of billingConfig.products) {
    const planId = product.id as keyof typeof PLAN_TOKEN_LIMITS;
    const limit = PLAN_TOKEN_LIMITS[planId];

    if (!limit) continue;

    for (const plan of product.plans) {
      for (const lineItem of plan.lineItems) {
        priceToLimit.set(lineItem.id, limit);
      }
    }
  }

  return priceToLimit;
}

// Build once at module load
const PRICE_TO_LIMIT_MAP = buildPriceToLimitMap();

/**
 * Get token limit for a Stripe price ID.
 * Throws if price ID is unknown (fail-fast instead of silent fallback).
 */
export function getPlanTokenLimit(priceId: string): number {
  const limit = PRICE_TO_LIMIT_MAP.get(priceId);

  if (!limit) {
    throw new Error(
      `Unknown price ID: ${priceId}. ` +
      `Ensure billing.config.ts has this price ID and PLAN_TOKEN_LIMITS has the plan.`
    );
  }

  return limit;
}

/**
 * Get plan ID (starter/pro/enterprise) from price ID.
 */
export function getPlanIdFromPriceId(priceId: string): string | null {
  for (const product of billingConfig.products) {
    for (const plan of product.plans) {
      for (const lineItem of plan.lineItems) {
        if (lineItem.id === priceId) {
          return product.id;
        }
      }
    }
  }
  return null;
}
```

#### 4.2 Extend Webhook Handler (with Idempotency)

The existing webhook at `apps/web/app/api/billing/webhook/route.ts` handles `invoice.paid`. Add usage reset logic:

```typescript
// apps/web/lib/billing/handle-invoice-paid.ts
import 'server-only';
import { z } from 'zod';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getPlanTokenLimit } from './plan-limits';

// Schema for webhook input validation
const InvoicePaidInputSchema = z.object({
  eventId: z.string().min(1),
  customerId: z.string().min(1),
  subscriptionId: z.string().uuid(),
  priceId: z.string().min(1),
});

export async function handleInvoicePaid(
  eventId: string,
  customerId: string,
  subscriptionId: string,
  priceId: string,
): Promise<void> {
  // Validate input
  const input = InvoicePaidInputSchema.parse({
    eventId,
    customerId,
    subscriptionId,
    priceId,
  });

  const supabase = getSupabaseServerAdminClient();

  // IDEMPOTENCY CHECK: Skip if we already processed this event
  const { data: existingEvent, error: eventCheckError } = await supabase
    .from('processed_webhook_events')
    .select('id')
    .eq('event_id', input.eventId)
    .maybeSingle();

  if (eventCheckError) {
    throw new Error(`Failed to check webhook idempotency: ${eventCheckError.message}`);
  }

  if (existingEvent) {
    console.log('[Billing] Already processed event:', input.eventId);
    return;
  }

  // Get account from billing customer
  const { data: billingCustomer, error: customerError } = await supabase
    .from('billing_customers')
    .select('account_id')
    .eq('customer_id', input.customerId)
    .single();

  if (customerError || !billingCustomer) {
    throw new Error(`No billing customer found for ${input.customerId}`);
  }

  const accountId = billingCustomer.account_id;

  // Determine token limit from price ID (uses single source of truth)
  const tokenLimit = getPlanTokenLimit(input.priceId);

  // Get subscription period dates
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('period_starts_at, period_ends_at')
    .eq('id', input.subscriptionId)
    .single();

  if (subError || !subscription) {
    throw new Error(`No subscription found for ${input.subscriptionId}`);
  }

  // IDEMPOTENCY CHECK: Skip if usage period already exists for this billing cycle
  const { data: existingPeriod } = await supabase
    .from('usage_periods')
    .select('id')
    .eq('account_id', accountId)
    .eq('period_start', subscription.period_starts_at)
    .eq('period_end', subscription.period_ends_at)
    .maybeSingle();

  if (existingPeriod) {
    console.log('[Billing] Usage period already exists for this billing cycle');
  } else {
    // Create new usage period (or reset existing)
    const { error: resetError } = await supabase.rpc('reset_usage_period', {
      p_account_id: accountId,
      p_tokens_limit: tokenLimit,
      p_period_start: subscription.period_starts_at,
      p_period_end: subscription.period_ends_at,
    });

    if (resetError) {
      throw new Error(`Failed to reset usage period: ${resetError.message}`);
    }

    console.log('[Billing] Reset usage period for account:', accountId);
  }

  // Mark event as processed (idempotency)
  const { error: insertError } = await supabase
    .from('processed_webhook_events')
    .insert({
      event_id: input.eventId,
      event_type: 'invoice.paid',
      processed_at: new Date().toISOString(),
    });

  if (insertError) {
    // Log but don't fail - the main work is done
    console.error('[Billing] Failed to mark event as processed:', insertError);
  }
}
```

#### 4.3 Database Migrations for Usage Reset

```sql
-- apps/web/supabase/migrations/YYYYMMDDHHMMSS_add_webhook_idempotency.sql

-- Table for tracking processed webhook events (prevents duplicate processing)
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_event_id
  ON public.processed_webhook_events(event_id);

-- Auto-cleanup old events (keep 30 days)
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_created_at
  ON public.processed_webhook_events(created_at);

-- RLS: Only service_role can access this table (webhooks use admin client)
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- No policies for authenticated users - only admin client can access
COMMENT ON TABLE public.processed_webhook_events IS
  'Tracks processed Stripe webhook events for idempotency. Only accessible via service_role.';
```

```sql
-- apps/web/supabase/migrations/YYYYMMDDHHMMSS_add_reset_usage_period.sql

-- SECURITY: This function uses SECURITY DEFINER but is NOT granted to authenticated users.
-- Only the admin client (service_role) should call this from webhook handlers.
CREATE OR REPLACE FUNCTION public.reset_usage_period(
  p_account_id UUID,
  p_tokens_limit INTEGER,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark any existing active period as completed
  UPDATE public.usage_periods
  SET status = 'completed',
      updated_at = NOW()
  WHERE account_id = p_account_id
    AND status = 'active';

  -- Create new active period
  INSERT INTO public.usage_periods (
    account_id,
    period_start,
    period_end,
    tokens_limit,
    tokens_used,
    reports_count,
    chat_tokens_used,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_account_id,
    p_period_start,
    p_period_end,
    p_tokens_limit,
    0,
    0,
    0,
    'active',
    NOW(),
    NOW()
  );
END;
$$;

-- SECURITY FIX: Only grant to service_role, NOT authenticated users
-- This prevents any authenticated user from resetting anyone's usage
REVOKE ALL ON FUNCTION public.reset_usage_period(UUID, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_usage_period(UUID, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reset_usage_period(UUID, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

COMMENT ON FUNCTION public.reset_usage_period IS
  'Resets usage period for an account. Called by webhook handler only (service_role).';
```

### Phase 5: Usage Display

#### 5.1 Usage Bar Component

```typescript
// apps/web/app/home/(user)/_components/usage-bar.tsx
'use client';

import { Progress } from '@kit/ui/progress';
import { cn } from '@kit/ui/utils';
import { USAGE_CONSTANTS } from '~/lib/usage/constants';

interface UsageBarProps {
  tokensUsed: number;
  tokensLimit: number;
  className?: string;
}

export function UsageBar({ tokensUsed, tokensLimit, className }: UsageBarProps) {
  const percentage = Math.min((tokensUsed / tokensLimit) * 100, 100);
  const isWarning = percentage >= USAGE_CONSTANTS.WARNING_THRESHOLD;
  const isCritical = percentage >= USAGE_CONSTANTS.CRITICAL_THRESHOLD;

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(1)}M`;
    }
    if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Token Usage</span>
        <span className={cn(
          isCritical && 'text-destructive font-medium',
          isWarning && !isCritical && 'text-warning font-medium',
        )}>
          {formatTokens(tokensUsed)} / {formatTokens(tokensLimit)}
        </span>
      </div>
      <Progress
        value={percentage}
        className={cn(
          isCritical && '[&>div]:bg-destructive',
          isWarning && !isCritical && '[&>div]:bg-warning',
        )}
      />
      {isWarning && (
        <p className="text-xs text-muted-foreground">
          {isCritical
            ? 'You are approaching your limit. Consider upgrading.'
            : `${Math.round(100 - percentage)}% of your monthly tokens remaining.`
          }
        </p>
      )}
    </div>
  );
}
```

#### 5.2 Update Usage Constants

```typescript
// apps/web/lib/usage/constants.ts (add these thresholds)

export const USAGE_CONSTANTS = {
  // ... existing constants ...

  /** Percentage at which to show warning state */
  WARNING_THRESHOLD: 80,

  /** Percentage at which to show critical state */
  CRITICAL_THRESHOLD: 95,

  /** Hard limit - block generation at this percentage */
  HARD_LIMIT_THRESHOLD: 100,
} as const;
```

## Files Changed

| File | Change |
|------|--------|
| `apps/web/.env.local` | NEW - Stripe environment variables |
| `apps/web/config/billing.config.ts` | UPDATE - Real Stripe Price IDs |
| `apps/web/supabase/migrations/*_add_first_report_tracking.sql` | NEW - First report tracking column |
| `apps/web/supabase/migrations/*_add_webhook_idempotency.sql` | NEW - Webhook event tracking table |
| `apps/web/supabase/migrations/*_add_reset_usage_period.sql` | NEW - Usage reset function (service_role only) |
| `apps/web/lib/billing/plan-limits.ts` | NEW - Single source of truth for plan token limits |
| `apps/web/lib/billing/handle-invoice-paid.ts` | NEW - Invoice webhook handler with idempotency |
| `apps/web/lib/usage/constants.ts` | UPDATE - Add warning/critical thresholds |
| `apps/web/app/home/(user)/_lib/server/usage.service.ts` | NEW - Usage checking with error handling |
| `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts` | UPDATE - Usage check before report creation |
| `apps/web/app/home/(user)/_components/subscription-required-modal.tsx` | NEW - Paywall modal |
| `apps/web/app/home/(user)/_components/usage-bar.tsx` | NEW - Usage display component |

## Testing Checklist

### Local Testing with Stripe CLI

```bash
# Terminal 1: Start the app
pnpm dev

# Terminal 2: Forward Stripe webhooks (requires Stripe CLI)
stripe listen --forward-to localhost:3000/api/billing/webhook
```

### Test Scenarios

1. **First Report Free**
   - [ ] New user can generate first report without subscription
   - [ ] `first_report_used_at` is set after generation
   - [ ] Second report attempt shows subscription modal

2. **Subscription Flow**
   - [ ] User can view pricing at `/pricing`
   - [ ] Checkout redirects to Stripe
   - [ ] Successful payment creates subscription in database
   - [ ] User can immediately generate reports after subscribing

3. **Usage Tracking**
   - [ ] Token usage increments correctly
   - [ ] Usage bar displays in dashboard
   - [ ] Warning shown at 80% usage
   - [ ] Hard block at 100% usage

4. **Billing Cycle Reset**
   - [ ] `invoice.paid` webhook triggers usage reset
   - [ ] New usage period created with fresh limits
   - [ ] Old period marked as completed

5. **Tier Changes**
   - [ ] Upgrade increases token limit immediately
   - [ ] Downgrade schedules for next billing cycle
   - [ ] Customer portal accessible for subscription management

## Rollback

1. Remove environment variables from `.env.local`
2. Revert `billing.config.ts` to sample config
3. Revert migrations (in reverse order):
   ```sql
   -- Drop usage reset function
   DROP FUNCTION IF EXISTS public.reset_usage_period(UUID, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ);

   -- Drop webhook idempotency table
   DROP TABLE IF EXISTS public.processed_webhook_events;

   -- Drop first report tracking column
   ALTER TABLE public.accounts DROP COLUMN IF EXISTS first_report_used_at;
   ```
4. Remove usage check from report creation action
5. Delete new files:
   - `apps/web/lib/billing/plan-limits.ts`
   - `apps/web/lib/billing/handle-invoice-paid.ts`
   - `apps/web/app/home/(user)/_lib/server/usage.service.ts`
   - `apps/web/app/home/(user)/_components/subscription-required-modal.tsx`
   - `apps/web/app/home/(user)/_components/usage-bar.tsx`

**WARNING**: Rolling back in production requires preserving `first_report_used_at` data to prevent users from getting additional free reports.

## References

- [Makerkit Stripe Configuration](https://makerkit.dev/docs/next-supabase-turbo/billing/stripe)
- [Stripe Webhooks Best Practices](https://docs.stripe.com/webhooks)
- [Stripe Customer Portal](https://docs.stripe.com/customer-management)
- Existing usage tracking: `apps/web/lib/usage/`
- Existing billing gateway: `packages/billing/gateway/`
