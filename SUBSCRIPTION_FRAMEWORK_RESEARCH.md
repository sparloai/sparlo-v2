# Subscription & Token Management Framework Research

**Project:** sparlo-v2
**Date:** 2026-01-08
**Purpose:** Comprehensive documentation of subscription and token management architecture

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema](#database-schema)
5. [Stripe Integration](#stripe-integration)
6. [Supabase Patterns](#supabase-patterns)
7. [Usage Tracking System](#usage-tracking-system)
8. [API Routes & Webhooks](#api-routes--webhooks)
9. [Billing Package Structure](#billing-package-structure)
10. [Best Practices & Patterns](#best-practices--patterns)

---

## Executive Summary

Sparlo-v2 uses a **sophisticated multi-tenant subscription system** with token-based usage tracking. The architecture is built on:

- **Stripe** for payment processing and subscription management
- **Supabase** for database, RLS-based security, and real-time features
- **Custom usage tracking** with atomic operations and race-condition protection
- **Monorepo billing packages** providing abstraction over multiple payment providers

**Key Features:**
- Freemium model (first report free, then subscription required)
- Token-based usage limits tied to subscription tiers
- Automatic billing cycle synchronization with usage periods
- Webhook-driven subscription lifecycle management
- Multi-provider support (Stripe, LemonSqueezy, with gateway pattern)

---

## Technology Stack

### Core Dependencies

```json
{
  "payment": {
    "stripe": "^20.0.0",
    "@stripe/stripe-js": "^8.5.3",
    "@stripe/react-stripe-js": "^5.4.1"
  },
  "database": {
    "@supabase/supabase-js": "catalog:",
    "postgres": "15+"
  },
  "framework": {
    "next": "catalog: (16.x)",
    "react": "catalog: (19.x)"
  },
  "validation": {
    "zod": "catalog:",
    "@hookform/resolvers": "catalog:"
  }
}
```

### Package Structure

```
packages/
├── billing/
│   ├── core/          # Provider-agnostic billing abstractions
│   ├── stripe/        # Stripe-specific implementation
│   ├── lemon-squeezy/ # LemonSqueezy implementation
│   └── gateway/       # Unified billing interface
└── supabase/          # Database client & types
```

---

## Architecture Overview

### Multi-Tenant Model

Sparlo-v2 supports two account types:

1. **Personal Accounts** (`accounts.is_personal_account = true`)
   - Individual user workspaces
   - Account ID matches `auth.users.id`

2. **Team Accounts** (`accounts.is_personal_account = false`)
   - Shared workspaces with role-based access
   - Multiple members with permissions

### Billing Flow

```
┌─────────────┐
│   User      │
│  Creates    │
│ Subscription│
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Stripe Checkout Session            │
│  - Collects payment method          │
│  - Creates subscription             │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Stripe Webhook (invoice.paid)      │
│  - Validates event signature        │
│  - Updates subscription record      │
│  - Resets usage period              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Database                  │
│  - subscriptions table              │
│  - usage_periods table              │
│  - RLS policies enforce access      │
└─────────────────────────────────────┘
```

---

## Database Schema

### Key Tables

#### 1. `subscriptions`

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,

  -- Subscription details
  status subscription_status NOT NULL, -- active, trialing, canceled, etc.
  active BOOLEAN DEFAULT true,
  cancel_at_period_end BOOLEAN DEFAULT false,
  currency TEXT,

  -- Billing cycle
  period_starts_at TIMESTAMPTZ NOT NULL,
  period_ends_at TIMESTAMPTZ NOT NULL,

  -- Stripe identifiers
  subscription_id TEXT UNIQUE, -- Stripe subscription ID
  customer_id TEXT,            -- Stripe customer ID

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Subscription Status Enum:**
```sql
CREATE TYPE subscription_status AS ENUM(
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused'
);
```

#### 2. `usage_periods`

**Purpose:** Track token usage per billing cycle (denormalized for performance)

```sql
CREATE TABLE usage_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- Period boundaries (aligned with subscription billing)
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Token limits (from subscription tier)
  tokens_limit BIGINT NOT NULL DEFAULT 3000000, -- Tier default

  -- Current usage (denormalized for fast reads)
  tokens_used BIGINT NOT NULL DEFAULT 0,
  reports_count INTEGER NOT NULL DEFAULT 0,
  chat_tokens_used BIGINT NOT NULL DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_period CHECK (period_end > period_start)
);

-- Unique constraint: only one active period per account
CREATE UNIQUE INDEX idx_usage_periods_unique_active
  ON usage_periods(account_id)
  WHERE status = 'active';
```

**Indexes:**
```sql
CREATE INDEX idx_usage_periods_account ON usage_periods(account_id, period_start DESC);
CREATE INDEX idx_usage_periods_active ON usage_periods(account_id) WHERE status = 'active';
CREATE INDEX idx_usage_periods_expiration ON usage_periods(period_end) WHERE status = 'active';
```

#### 3. `subscription_items`

```sql
CREATE TABLE subscription_items (
  id UUID PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Product & pricing
  product_id TEXT,
  variant_id TEXT,    -- Stripe price ID
  price_amount BIGINT,

  -- Quantity & type
  quantity INTEGER DEFAULT 1,
  type subscription_item_type, -- 'flat', 'per_seat', 'metered'

  -- Billing interval
  interval TEXT,      -- 'month', 'year'
  interval_count INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `processed_webhook_events`

**Purpose:** Idempotency tracking to prevent duplicate webhook processing

```sql
CREATE TABLE processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,     -- Stripe event ID (evt_*)
  event_type TEXT NOT NULL,          -- e.g., 'invoice.paid'
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_processed_webhook_events_event_id
  ON processed_webhook_events(event_id);

CREATE INDEX idx_processed_webhook_events_created_at
  ON processed_webhook_events(created_at);
```

### Critical Database Functions

#### 1. `get_or_create_usage_period()`

**Purpose:** Atomic function to retrieve or create active usage period (handles race conditions)

```sql
CREATE OR REPLACE FUNCTION get_or_create_usage_period(
  p_account_id UUID,
  p_tokens_limit BIGINT DEFAULT 3000000
)
RETURNS usage_periods
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period usage_periods;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Try to get existing active period
  SELECT * INTO v_period
  FROM usage_periods
  WHERE account_id = p_account_id AND status = 'active'
  FOR UPDATE SKIP LOCKED  -- Prevent race conditions
  LIMIT 1;

  IF v_period IS NOT NULL THEN
    -- Check if period has expired
    IF v_period.period_end <= NOW() THEN
      UPDATE usage_periods SET status = 'completed', updated_at = NOW()
      WHERE id = v_period.id;
      v_period := NULL;
    ELSE
      RETURN v_period;
    END IF;
  END IF;

  -- Create new period (start of current month to start of next month)
  v_period_start := DATE_TRUNC('month', NOW());
  v_period_end := DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

  -- Use INSERT with ON CONFLICT to handle race conditions
  INSERT INTO usage_periods (account_id, period_start, period_end, tokens_limit, status)
  VALUES (p_account_id, v_period_start, v_period_end, p_tokens_limit, 'active')
  ON CONFLICT (account_id) WHERE status = 'active'
  DO UPDATE SET updated_at = NOW()
  RETURNING * INTO v_period;

  RETURN v_period;
END;
$$;
```

**Key Features:**
- `FOR UPDATE SKIP LOCKED` prevents concurrent requests from blocking
- `ON CONFLICT` handles race condition where two requests create period simultaneously
- Automatically expires old periods

#### 2. `increment_usage()`

**Purpose:** Atomically increment token usage (race-condition safe)

```sql
CREATE OR REPLACE FUNCTION increment_usage(
  p_account_id UUID,
  p_tokens BIGINT,
  p_is_report BOOLEAN DEFAULT FALSE,
  p_is_chat BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_total BIGINT;
  v_limit BIGINT;
  v_reports_count INTEGER;
  v_chat_tokens BIGINT;
  v_percentage NUMERIC;
BEGIN
  -- Ensure period exists first
  PERFORM get_or_create_usage_period(p_account_id, 3000000);

  -- Atomic increment with RETURNING (single statement = no race condition)
  UPDATE usage_periods
  SET
    tokens_used = tokens_used + p_tokens,
    reports_count = reports_count + CASE WHEN p_is_report THEN 1 ELSE 0 END,
    chat_tokens_used = chat_tokens_used + CASE WHEN p_is_chat THEN p_tokens ELSE 0 END,
    updated_at = NOW()
  WHERE account_id = p_account_id AND status = 'active'
  RETURNING
    tokens_used,
    tokens_limit,
    reports_count,
    chat_tokens_used
  INTO v_new_total, v_limit, v_reports_count, v_chat_tokens;

  v_percentage := ROUND((v_new_total::numeric / v_limit) * 100, 1);

  RETURN jsonb_build_object(
    'tokens_used', v_new_total,
    'tokens_limit', v_limit,
    'reports_count', v_reports_count,
    'chat_tokens_used', v_chat_tokens,
    'percentage', v_percentage
  );
END;
$$;
```

#### 3. `check_usage_allowed()`

**Purpose:** Check if account has sufficient tokens for operation

```sql
CREATE OR REPLACE FUNCTION check_usage_allowed(
  p_account_id UUID,
  p_estimated_tokens BIGINT DEFAULT 180000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER  -- Inherits RLS policies
SET search_path = public
AS $$
DECLARE
  v_period usage_periods;
  v_remaining BIGINT;
  v_percentage NUMERIC;
BEGIN
  SELECT * INTO v_period
  FROM usage_periods
  WHERE account_id = p_account_id AND status = 'active'
  LIMIT 1;

  IF v_period IS NULL THEN
    -- No period yet, allow (will be created on first use)
    RETURN jsonb_build_object(
      'allowed', true,
      'tokens_used', 0,
      'tokens_limit', 3000000,
      'remaining', 3000000,
      'percentage', 0.0,
      'period_end', DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
    );
  END IF;

  v_remaining := v_period.tokens_limit - v_period.tokens_used;
  v_percentage := ROUND((v_period.tokens_used::numeric / v_period.tokens_limit) * 100, 1);

  RETURN jsonb_build_object(
    'allowed', v_remaining >= p_estimated_tokens,
    'tokens_used', v_period.tokens_used,
    'tokens_limit', v_period.tokens_limit,
    'remaining', v_remaining,
    'percentage', v_percentage,
    'period_end', v_period.period_end
  );
END;
$$;
```

#### 4. `reset_usage_period()`

**Purpose:** Reset usage for new billing cycle (called by webhook handler)

```sql
CREATE OR REPLACE FUNCTION reset_usage_period(
  p_account_id UUID,
  p_tokens_limit BIGINT,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark existing active period as completed
  UPDATE usage_periods
  SET status = 'completed', updated_at = NOW()
  WHERE account_id = p_account_id AND status = 'active';

  -- Create new active period
  INSERT INTO usage_periods (
    account_id, period_start, period_end, tokens_limit,
    tokens_used, reports_count, chat_tokens_used, status
  ) VALUES (
    p_account_id, p_period_start, p_period_end, p_tokens_limit,
    0, 0, 0, 'active'
  )
  ON CONFLICT (account_id) WHERE status = 'active'
  DO UPDATE SET
    tokens_limit = EXCLUDED.tokens_limit,
    period_start = EXCLUDED.period_start,
    period_end = EXCLUDED.period_end,
    updated_at = NOW();
END;
$$;

-- SECURITY: Only service_role can call this (prevents users from resetting usage)
REVOKE ALL ON FUNCTION reset_usage_period FROM PUBLIC;
REVOKE ALL ON FUNCTION reset_usage_period FROM authenticated;
GRANT EXECUTE ON FUNCTION reset_usage_period TO service_role;
```

### Row Level Security (RLS)

**Philosophy:** RLS automatically enforces access control - no manual auth checks needed in application code

#### Example: `usage_periods` RLS

```sql
ALTER TABLE usage_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage period"
  ON usage_periods FOR SELECT
  USING (
    account_id = auth.uid()
    OR public.has_role_on_account(account_id)
  );
```

**Key Pattern:**
- Personal accounts: `account_id = auth.uid()`
- Team accounts: `has_role_on_account(account_id)` checks membership

---

## Stripe Integration

### Stripe Node SDK (v20.0.0)

**Installation:**
```bash
pnpm add stripe @stripe/stripe-js @stripe/react-stripe-js
```

### Service Architecture

```
packages/billing/stripe/src/services/
├── stripe-sdk.ts                           # Stripe client initialization
├── create-stripe-checkout.ts               # Checkout session creation
├── create-stripe-billing-portal-session.ts # Customer portal
├── stripe-webhook-handler.service.ts       # Webhook event processing
├── stripe-billing-strategy.service.ts      # Core billing operations
└── stripe-subscription-payload-builder.service.ts
```

### Key Implementation Files

#### 1. Stripe SDK Initialization

**File:** `/packages/billing/stripe/src/services/stripe-sdk.ts`

```typescript
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});
```

#### 2. Webhook Handler

**File:** `/apps/web/app/api/billing/webhook/route.ts`

```typescript
import { enhanceRouteHandler } from '@kit/next/routes';
import { getBillingEventHandlerService } from '@kit/billing-gateway';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { handleInvoicePaid } from '~/lib/billing/handle-invoice-paid';

export const POST = enhanceRouteHandler(
  async ({ request }) => {
    const supabaseClientProvider = () => getSupabaseServerAdminClient();

    const service = await getBillingEventHandlerService(
      supabaseClientProvider,
      'stripe',
      getPlanTypesMap(billingConfig)
    );

    await service.handleWebhookEvent(request, {
      // Track new subscriptions
      onCheckoutSessionCompleted: async (payload) => {
        if (!('target_order_id' in payload)) {
          trackSubscriptionActivated(payload);
        }
      },

      // Reset usage period when invoice is paid
      onInvoicePaid: async (payload) => {
        await handleInvoicePaid(payload);
      },
    });

    return new Response('OK', { status: 200 });
  },
  { auth: false }
);
```

#### 3. Invoice Paid Handler

**File:** `/apps/web/lib/billing/handle-invoice-paid.ts`

```typescript
import { UpsertSubscriptionParams } from '@kit/billing/types';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getPlanTokenLimit } from './plan-limits';

export async function handleInvoicePaid(
  payload: UpsertSubscriptionParams
): Promise<void> {
  const supabase = getSupabaseServerAdminClient();

  const accountId = payload.target_account_id;
  const periodStart = payload.period_starts_at;
  const periodEnd = payload.period_ends_at;
  const priceId = payload.line_items[0]?.variant_id;

  // Get token limit from price ID (single source of truth)
  const tokenLimit = getPlanTokenLimit(priceId);

  // Check if period already exists (idempotency)
  const { data: existingPeriod } = await supabase
    .from('usage_periods')
    .select('id')
    .eq('account_id', accountId)
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .maybeSingle();

  if (existingPeriod) {
    return; // Already processed
  }

  // Create new usage period (or reset existing)
  await supabase.rpc('reset_usage_period', {
    p_account_id: accountId,
    p_tokens_limit: tokenLimit,
    p_period_start: periodStart,
    p_period_end: periodEnd,
  });
}
```

### Billing Configuration

**File:** `/apps/web/config/billing.config.ts`

```typescript
import { createBillingSchema } from '@kit/billing';

export default createBillingSchema({
  provider: 'stripe',
  products: [
    {
      id: 'lite',
      name: 'Lite',
      description: 'Occasional use',
      currency: 'USD',
      plans: [
        {
          name: 'Lite Monthly',
          id: 'lite-monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_1SnILKEe4gCtTPhv1Hv6KAhV', // Stripe price ID
              name: 'Lite',
              cost: 9900, // $99.00 in cents
              type: 'flat',
            },
          ],
        },
        {
          name: 'Lite Annual',
          id: 'lite-annual',
          paymentType: 'recurring',
          interval: 'year',
          lineItems: [
            {
              id: 'price_1SnIM1Ee4gCtTPhvm0oISMPo',
              name: 'Lite',
              cost: 99000, // $990.00 in cents
              type: 'flat',
            },
          ],
        },
      ],
      features: ['~3 problems/month', '1 seat', 'Email support'],
    },
    // ... more products (core, pro, max)
  ],
});
```

### Plan Token Limits

**File:** `/apps/web/lib/billing/plan-limits.ts`

```typescript
import billingConfig from '~/config/billing.config';
import { PLAN_TOKEN_LIMITS } from '~/lib/usage/constants';

// Maps Stripe price IDs to token limits
function buildPriceToLimitMap(): Map<string, number> {
  const priceToLimit = new Map<string, number>();

  for (const product of billingConfig.products) {
    for (const plan of product.plans) {
      const limit = PLAN_TOKEN_LIMITS[plan.id];
      if (!limit) continue;

      for (const lineItem of plan.lineItems) {
        priceToLimit.set(lineItem.id, limit);
      }
    }
  }

  return priceToLimit;
}

const PRICE_TO_LIMIT_MAP = buildPriceToLimitMap();

export function getPlanTokenLimit(priceId: string): number {
  const limit = PRICE_TO_LIMIT_MAP.get(priceId);

  if (!limit) {
    throw new Error(`Unknown price ID: ${priceId}`);
  }

  return limit;
}
```

### Token Limits Per Plan

**File:** `/apps/web/lib/usage/constants.ts`

```typescript
export const PLAN_TOKEN_LIMITS: Record<string, number> = {
  // Lite tier (~5 reports/month)
  'lite-monthly': 1_000_000,
  'lite-annual': 1_000_000,

  // Core tier (~16 reports/month)
  'core-monthly': 3_000_000,
  'core-annual': 3_000_000,

  // Pro tier (~55 reports/month)
  'pro-monthly': 10_000_000,
  'pro-annual': 10_000_000,

  // Max tier (~111 reports/month)
  'max-monthly': 20_000_000,
  'max-annual': 20_000_000,
} as const;

export const USAGE_CONSTANTS = {
  DEFAULT_TOKEN_LIMIT: 3_000_000,
  ESTIMATED_TOKENS_PER_REPORT: 180_000,
  ESTIMATED_TOKENS_PER_CHAT_MESSAGE: 2_000,
  USAGE_BAR_VISIBLE_THRESHOLD: 25,
  WARNING_THRESHOLD: 80,
  CRITICAL_THRESHOLD: 95,
  HARD_LIMIT_THRESHOLD: 100,
} as const;
```

---

## Supabase Patterns

### Client Initialization

#### Server Components (Preferred)

```typescript
import { getSupabaseServerClient } from '@kit/supabase/server-client';

async function MyServerComponent() {
  const client = getSupabaseServerClient();

  // RLS automatically enforces access control
  const { data, error } = await client
    .from('usage_periods')
    .select('*')
    .eq('account_id', accountId);

  return <div>{/* render data */}</div>;
}
```

**Key Insight:** Server components automatically inherit RLS protection - no additional authorization checks needed!

#### Admin Client (Use Sparingly)

```typescript
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

async function adminOperation() {
  const adminClient = getSupabaseServerAdminClient();

  // BYPASSES RLS - Manual authorization required!
  // Only use for webhooks, migrations, or admin operations

  const { error } = await adminClient.rpc('reset_usage_period', {
    p_account_id: accountId,
    p_tokens_limit: tokenLimit,
    p_period_start: periodStart,
    p_period_end: periodEnd,
  });
}
```

### RLS Best Practices

#### 1. Enable RLS on All Tables

```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
```

#### 2. Revoke Default Permissions

```sql
REVOKE ALL ON my_table FROM authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE my_table TO authenticated;
```

#### 3. Create Granular Policies

```sql
-- Read: User can see their own data or team data
CREATE POLICY "users_read_own_data" ON my_table FOR SELECT
  USING (
    account_id = auth.uid()
    OR has_role_on_account(account_id)
  );

-- Write: User must have specific permission
CREATE POLICY "users_write_with_permission" ON my_table FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), account_id, 'feature.manage'::app_permissions)
  );
```

### Security Functions

#### 1. `has_role_on_account()`

Checks if current user is a member of the account (for team access)

```sql
CREATE OR REPLACE FUNCTION has_role_on_account(target_account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM accounts_memberships
    WHERE account_id = target_account_id
    AND user_id = auth.uid()
  );
$$;
```

#### 2. `has_permission()`

Checks if user has specific permission on account

```sql
CREATE OR REPLACE FUNCTION has_permission(
  user_id UUID,
  target_account_id UUID,
  required_permission app_permissions
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM accounts_memberships am
    JOIN roles r ON r.id = am.role_id
    JOIN role_permissions rp ON rp.role_id = r.id
    WHERE am.account_id = target_account_id
    AND am.user_id = user_id
    AND rp.permission = required_permission
  );
$$;
```

---

## Usage Tracking System

### Core Service

**File:** `/apps/web/app/app/_lib/server/usage.service.ts`

```typescript
import { cache } from 'react';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { USAGE_CONSTANTS } from '~/lib/usage/constants';

export type UsageStatus =
  | {
      allowed: true;
      reason: 'ok' | 'first_report_available';
      tokensUsed: number;
      tokensLimit: number;
      percentage: number;
      isFirstReport: boolean;
      hasActiveSubscription: boolean;
      isAtLimit: false;
    }
  | {
      allowed: false;
      reason: 'subscription_required' | 'limit_exceeded';
      tokensUsed: number;
      tokensLimit: number;
      percentage: number;
      isFirstReport: false;
      hasActiveSubscription: boolean;
      isAtLimit: true;
    };

// Wrapped with React cache() for request-level deduplication
export const checkUsageAllowed = cache(
  async function checkUsageAllowedImpl(
    accountId: string,
    estimatedTokens: number = USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT
  ): Promise<UsageStatus> {
    const client = getSupabaseServerClient();

    // Super admins bypass all limits
    const { data: isSuperAdmin } = await client.rpc('is_super_admin');
    if (isSuperAdmin) {
      return {
        allowed: true,
        reason: 'ok',
        tokensUsed: 0,
        tokensLimit: Number.MAX_SAFE_INTEGER,
        percentage: 0,
        isFirstReport: false,
        hasActiveSubscription: true,
        isAtLimit: false,
      };
    }

    // Check first report status and subscription in parallel
    const [accountResult, subscriptionResult] = await Promise.all([
      client
        .from('accounts')
        .select('id, first_report_used_at')
        .eq('id', accountId)
        .single(),
      client
        .from('subscriptions')
        .select('id, status, period_ends_at, active')
        .eq('account_id', accountId)
        .or('active.eq.true,and(status.eq.canceled,period_ends_at.gte.now())')
        .maybeSingle(),
    ]);

    const hasUsedFirstReport = !!accountResult.data?.first_report_used_at;
    const hasActiveSubscription = !!subscriptionResult.data;

    // First report is free
    if (!hasUsedFirstReport) {
      return {
        allowed: true,
        reason: 'first_report_available',
        tokensUsed: 0,
        tokensLimit: USAGE_CONSTANTS.DEFAULT_TOKEN_LIMIT,
        percentage: 0,
        isFirstReport: true,
        hasActiveSubscription,
        isAtLimit: false,
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
        isFirstReport: false,
        hasActiveSubscription: false,
        isAtLimit: true,
      };
    }

    // Check usage against subscription tier
    const { data: usage } = await client.rpc('check_usage_allowed', {
      p_account_id: accountId,
      p_estimated_tokens: estimatedTokens,
    });

    if (usage.allowed) {
      return {
        allowed: true,
        reason: 'ok',
        tokensUsed: usage.tokens_used,
        tokensLimit: usage.tokens_limit,
        percentage: usage.percentage,
        isFirstReport: false,
        hasActiveSubscription: true,
        isAtLimit: false,
      };
    }

    return {
      allowed: false,
      reason: 'limit_exceeded',
      tokensUsed: usage.tokens_used,
      tokensLimit: usage.tokens_limit,
      percentage: usage.percentage,
      isFirstReport: false,
      hasActiveSubscription: true,
      isAtLimit: true,
    };
  }
);
```

### Freemium Model Implementation

**Business Logic:**
1. **First Report Free:** All users get one free report (tracked via `accounts.first_report_used_at`)
2. **Subscription Required:** After first report, subscription is mandatory
3. **Super Admin Bypass:** Super admins have unlimited access

**Race Condition Protection:**

```typescript
// Atomic claim of first free report
export async function tryClaimFirstReport(
  accountId: string
): Promise<'CLAIMED' | 'ALREADY_USED' | 'UNAUTHORIZED'> {
  const client = getSupabaseServerClient();

  const { data, error } = await client.rpc('try_claim_first_report', {
    p_account_id: accountId,
  });

  if (error) {
    throw new Error(`Failed to claim first report: ${error.message}`);
  }

  return data as 'CLAIMED' | 'ALREADY_USED' | 'UNAUTHORIZED';
}
```

**SQL Function:**
```sql
CREATE OR REPLACE FUNCTION try_claim_first_report(p_account_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  -- Check authorization
  IF NOT (auth.uid() = p_account_id OR has_role_on_account(p_account_id)) THEN
    RETURN 'UNAUTHORIZED';
  END IF;

  -- Atomic conditional update
  UPDATE accounts
  SET first_report_used_at = NOW()
  WHERE id = p_account_id
    AND first_report_used_at IS NULL
  RETURNING true INTO v_updated;

  IF v_updated THEN
    RETURN 'CLAIMED';
  ELSE
    RETURN 'ALREADY_USED';
  END IF;
END;
$$;
```

---

## API Routes & Webhooks

### Stripe Webhook Endpoint

**URL:** `/api/billing/webhook`
**Method:** `POST`
**Authentication:** None (validates webhook signature)

#### Webhook Events Handled

1. **`checkout.session.completed`**
   - Creates initial subscription record
   - Tracks subscription activation in analytics
   - Creates initial usage period

2. **`invoice.paid`**
   - Resets usage period for new billing cycle
   - Updates subscription period boundaries
   - Applies new token limits based on plan

3. **`customer.subscription.updated`**
   - Updates subscription status
   - Handles plan changes/upgrades
   - Manages cancellation scheduling

4. **`customer.subscription.deleted`**
   - Marks subscription as inactive
   - Preserves historical data

#### Webhook Signature Verification

```typescript
import { stripe } from '@kit/stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.post('/webhook',
  express.raw({type: 'application/json'}),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret,
        300 // tolerance in seconds
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Process event...
    res.json({received: true});
  }
);
```

#### Idempotency Protection

```typescript
// Check if event already processed
const { data: alreadyProcessed } = await supabase.rpc(
  'check_webhook_processed',
  { p_event_id: event.id }
);

if (alreadyProcessed) {
  return new Response('Already processed', { status: 200 });
}

// Process event...

// Mark as processed
await supabase.rpc('mark_webhook_processed', {
  p_event_id: event.id,
  p_event_type: event.type,
});
```

### Stripe CLI for Local Testing

```bash
# Start local webhook listener
pnpm stripe:listen

# Docker-based listener (from package.json)
docker run --rm -it --name=stripe \
  -v ~/.config/stripe:/root/.config/stripe \
  stripe/stripe-cli:latest listen \
  --forward-to http://host.docker.internal:3000/api/billing/webhook
```

---

## Billing Package Structure

### Multi-Provider Architecture

```
packages/billing/
├── core/                 # Provider-agnostic abstractions
│   ├── src/
│   │   ├── schema/       # Zod validation schemas
│   │   ├── services/     # Core billing logic
│   │   └── types/        # TypeScript interfaces
│   └── package.json
│
├── stripe/               # Stripe implementation
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── schema/       # Stripe-specific schemas
│   │   └── services/     # Stripe API integration
│   └── package.json
│
├── lemon-squeezy/        # LemonSqueezy implementation
│   └── src/
│       └── services/
│
└── gateway/              # Unified billing interface
    ├── src/
    │   ├── components/   # Provider-agnostic UI
    │   └── server/       # Service selection logic
    └── package.json
```

### Gateway Pattern

**File:** `/packages/billing/gateway/src/server/index.ts`

```typescript
import { BillingProvider } from '@kit/billing';
import { StripeService } from '@kit/stripe';
import { LemonSqueezyService } from '@kit/lemon-squeezy';

export async function getBillingEventHandlerService(
  supabaseClient: () => SupabaseClient,
  provider: BillingProvider,
  planTypesMap: Map<string, string>
) {
  switch (provider) {
    case 'stripe':
      return new StripeWebhookHandlerService(
        supabaseClient,
        planTypesMap
      );

    case 'lemon-squeezy':
      return new LemonSqueezyWebhookHandlerService(
        supabaseClient,
        planTypesMap
      );

    default:
      throw new Error(`Unsupported billing provider: ${provider}`);
  }
}
```

**Benefits:**
- Switch payment providers via environment variable
- Consistent API across providers
- Easy A/B testing of providers
- Vendor independence

---

## Best Practices & Patterns

### 1. Security-First Database Design

✅ **Always enable RLS:**
```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
```

✅ **Use `SECURITY DEFINER` carefully:**
```sql
CREATE FUNCTION sensitive_operation()
SECURITY DEFINER  -- Runs with elevated privileges
SET search_path = public  -- Prevent SQL injection
AS $$
BEGIN
  -- MUST validate permissions manually!
  IF NOT has_permission(auth.uid(), target_id, 'required.permission') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Safe to proceed
END;
$$;
```

✅ **Grant minimal permissions:**
```sql
-- Only grant what's needed
GRANT EXECUTE ON FUNCTION reset_usage_period TO service_role;
-- DO NOT grant to authenticated or public
```

### 2. Race Condition Protection

✅ **Use atomic operations:**
```sql
-- Single UPDATE with RETURNING (atomic)
UPDATE usage_periods
SET tokens_used = tokens_used + p_tokens
WHERE account_id = p_account_id AND status = 'active'
RETURNING tokens_used, tokens_limit INTO v_new_total, v_limit;
```

✅ **Use `FOR UPDATE SKIP LOCKED`:**
```sql
SELECT * FROM usage_periods
WHERE account_id = p_account_id AND status = 'active'
FOR UPDATE SKIP LOCKED  -- Prevents blocking on concurrent requests
LIMIT 1;
```

✅ **Use `ON CONFLICT` for idempotency:**
```sql
INSERT INTO usage_periods (account_id, ...)
VALUES (p_account_id, ...)
ON CONFLICT (account_id) WHERE status = 'active'
DO UPDATE SET updated_at = NOW()  -- No-op, just return existing row
RETURNING *;
```

### 3. Webhook Idempotency

✅ **Track processed events:**
```sql
CREATE TABLE processed_webhook_events (
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);
```

✅ **Check before processing:**
```typescript
const alreadyProcessed = await checkWebhookProcessed(event.id);
if (alreadyProcessed) {
  return new Response('OK', { status: 200 });
}

// Process event...

await markWebhookProcessed(event.id, event.type);
```

### 4. Performance Optimization

✅ **Denormalize for reads:**
```sql
-- Store aggregated data in usage_periods for fast reads
CREATE TABLE usage_periods (
  tokens_used BIGINT,      -- Denormalized total
  reports_count INTEGER,   -- Denormalized count
  chat_tokens_used BIGINT  -- Denormalized total
);
```

✅ **Parallel data fetching:**
```typescript
// Execute queries in parallel
const [account, subscription, usage] = await Promise.all([
  loadAccount(),
  loadSubscription(),
  loadUsage(),
]);
```

✅ **Request-level caching:**
```typescript
import { cache } from 'react';

// Deduplicate within single request
export const checkUsageAllowed = cache(async function(...) {
  // Expensive operation only runs once per request
});
```

### 5. Type Safety

✅ **Validate external data:**
```typescript
import { z } from 'zod';

const UsageResponseSchema = z.object({
  allowed: z.boolean(),
  tokens_used: z.number(),
  tokens_limit: z.number(),
  percentage: z.number(),
});

const validated = UsageResponseSchema.safeParse(data);
if (!validated.success) {
  console.error('Invalid response:', validated.error);
  // Handle error gracefully
}
```

✅ **Generate types from schema:**
```bash
# Generate TypeScript types from Supabase schema
pnpm supabase:web:typegen
```

### 6. Error Handling

✅ **Graceful degradation:**
```typescript
try {
  const usage = await checkUsageAllowed(accountId);
} catch (error) {
  // Don't throw - return safe default
  return {
    allowed: false,
    reason: 'limit_exceeded',
    // ... safe defaults
  };
}
```

✅ **Informative error messages:**
```typescript
if (!priceId) {
  throw new Error(
    `Unknown price ID: ${priceId}. ` +
    `Ensure billing.config.ts has this price ID.`
  );
}
```

---

## Additional Resources

### Official Documentation

- **Stripe API:** https://docs.stripe.com/api
- **Stripe Node SDK:** https://github.com/stripe/stripe-node
- **Supabase JS:** https://supabase.com/docs/reference/javascript
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **Next.js 16:** https://nextjs.org/docs

### Project-Specific Guides

- **CLAUDE.md** - Project conventions and patterns
- **apps/web/CLAUDE.md** - Web app specific guidance
- **apps/web/supabase/CLAUDE.md** - Database schema management
- **SPARLO-DESIGN-SYSTEM.md** - Design system reference

### Key Migration Files

- `20221215192558_schema.sql` - Initial schema
- `20251219000000_add_usage_tracking.sql` - Usage tracking system
- `20251220231233_add_billing_webhook_support.sql` - Webhook idempotency
- `20260107082024_create_token_limit_adjustments.sql` - Token limit management

---

## Conclusion

Sparlo-v2's subscription and token management system is built on proven patterns:

- **Stripe** handles payment processing with robust webhook integration
- **Supabase RLS** provides automatic, database-level security
- **Atomic SQL functions** prevent race conditions in high-concurrency scenarios
- **Multi-provider architecture** via gateway pattern enables vendor flexibility
- **Denormalized usage tracking** optimizes for read performance
- **Freemium model** with first-report-free reduces friction

The system is designed for **reliability** (idempotent webhooks, atomic operations), **security** (RLS policies, minimal permissions), and **performance** (parallel queries, request caching).

---

**Last Updated:** 2026-01-08
**Maintained By:** Development Team
**Questions?** See project CLAUDE.md files or reach out to team
