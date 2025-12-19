# feat: Token-Based Usage Tracking with Soft Limits

## Overview

Implement token-based usage tracking for Sparlo. Users see a usage bar showing consumption against their monthly limit.

**Philosophy**: Simple soft limits. No anxiety-inducing complexity.

## Problem Statement

- Inngest tracks tokens per report but doesn't persist to database
- Chat has no usage tracking
- Users have no visibility into consumption

## Solution

### Token Limits Per Plan

| Plan | Monthly Token Limit |
|------|---------------------|
| Free | 1,000,000 (1M) |
| Starter | 5,000,000 (5M) |
| Pro | 20,000,000 (20M) |

No rollover. No grace buffers. Simple monthly reset.

### Warning Levels

| Percentage | Level | Action |
|------------|-------|--------|
| < 75% | ok | No message |
| 75-99% | warning | Yellow alert |
| 100%+ | blocked | Red alert, upgrade CTA |

## Technical Approach

### Phase 1: Database Schema

Create migration: `20251218000000_token_usage_tracking.sql`

```sql
-- Single table for usage tracking (one row per account per month)
CREATE TABLE public.account_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  period_start timestamptz NOT NULL,
  tokens_used bigint NOT NULL DEFAULT 0,
  tokens_limit bigint NOT NULL,
  report_tokens bigint NOT NULL DEFAULT 0,
  chat_tokens bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(account_id, period_start)
);

-- Index for fast lookups
CREATE INDEX idx_account_usage_lookup ON public.account_usage(account_id, period_start DESC);

-- RLS
ALTER TABLE public.account_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view usage for their accounts"
  ON public.account_usage FOR SELECT
  USING (
    account_id = auth.uid() OR
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Simple upsert function for recording usage
CREATE OR REPLACE FUNCTION public.record_token_usage(
  p_account_id uuid,
  p_usage_type text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_tokens_limit bigint DEFAULT 1000000
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period_start timestamptz := date_trunc('month', now());
  v_total_tokens integer := p_input_tokens + p_output_tokens;
  v_new_total bigint;
  v_percentage numeric;
BEGIN
  -- Upsert usage record
  INSERT INTO public.account_usage (account_id, period_start, tokens_limit, tokens_used, report_tokens, chat_tokens)
  VALUES (p_account_id, v_period_start, p_tokens_limit, v_total_tokens,
    CASE WHEN p_usage_type = 'report' THEN v_total_tokens ELSE 0 END,
    CASE WHEN p_usage_type = 'chat' THEN v_total_tokens ELSE 0 END)
  ON CONFLICT (account_id, period_start) DO UPDATE SET
    tokens_used = account_usage.tokens_used + v_total_tokens,
    report_tokens = account_usage.report_tokens + CASE WHEN p_usage_type = 'report' THEN v_total_tokens ELSE 0 END,
    chat_tokens = account_usage.chat_tokens + CASE WHEN p_usage_type = 'chat' THEN v_total_tokens ELSE 0 END,
    updated_at = now()
  RETURNING tokens_used INTO v_new_total;

  v_percentage := (v_new_total::numeric / p_tokens_limit::numeric) * 100;

  RETURN jsonb_build_object(
    'tokens_used', v_new_total,
    'tokens_limit', p_tokens_limit,
    'percentage', round(v_percentage, 1),
    'status', CASE
      WHEN v_percentage >= 100 THEN 'blocked'
      WHEN v_percentage >= 75 THEN 'warning'
      ELSE 'ok'
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_token_usage(uuid, text, integer, integer, bigint) TO authenticated;
```

### Phase 2: Backend Integration

**Inngest** (`apps/web/lib/inngest/functions/generate-report.ts`):

After report completion, add:

```typescript
await step.run('record-usage', async () => {
  const totalUsage = getTotalUsage();
  await supabase.rpc('record_token_usage', {
    p_account_id: accountId,
    p_usage_type: 'report',
    p_input_tokens: totalUsage.inputTokens,
    p_output_tokens: totalUsage.outputTokens,
  });
});
```

**Chat** (`apps/web/app/api/sparlo/chat/route.ts`):

After response, add:

```typescript
await client.rpc('record_token_usage', {
  p_account_id: report.account_id,
  p_usage_type: 'chat',
  p_input_tokens: inputTokens,
  p_output_tokens: outputTokens,
});
```

### Phase 3: Frontend

**Usage Bar** (`apps/web/app/home/(user)/_components/usage-bar.tsx`):

```typescript
'use client';

import { Progress } from '@kit/ui/progress';
import { Alert, AlertDescription } from '@kit/ui/alert';
import { AlertCircle, Zap } from 'lucide-react';
import { cn } from '@kit/ui/utils';
import Link from 'next/link';

interface UsageBarProps {
  tokensUsed: number;
  tokensLimit: number;
  daysUntilReset: number;
}

export function UsageBar({ tokensUsed, tokensLimit, daysUntilReset }: UsageBarProps) {
  const percentUsed = (tokensUsed / tokensLimit) * 100;
  const status = percentUsed >= 100 ? 'blocked' : percentUsed >= 75 ? 'warning' : 'ok';

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
    return tokens.toString();
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">Token Usage</span>
        </div>
        <span className="text-sm text-muted-foreground">Resets in {daysUntilReset} days</span>
      </div>

      <div className="space-y-1.5">
        <Progress
          value={Math.min(percentUsed, 100)}
          className={cn(
            "h-2.5",
            status === 'blocked' && "[&>div]:bg-red-500",
            status === 'warning' && "[&>div]:bg-amber-500",
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTokens(tokensUsed)} used</span>
          <span>{formatTokens(tokensLimit)} limit</span>
        </div>
      </div>

      {status === 'blocked' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Monthly limit reached.</span>
            <Link href="/home/settings/billing" className="font-medium underline">Upgrade</Link>
          </AlertDescription>
        </Alert>
      )}

      {status === 'warning' && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            {percentUsed.toFixed(0)}% of monthly tokens used.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

**Usage Loader** (`apps/web/app/home/(user)/_lib/server/usage.loader.ts`):

```typescript
import 'server-only';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

export interface UsageData {
  tokensUsed: number;
  tokensLimit: number;
  daysUntilReset: number;
  status: 'ok' | 'warning' | 'blocked';
}

export async function loadUsageData(accountId: string): Promise<UsageData> {
  const client = getSupabaseServerClient();
  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  const { data } = await client
    .from('account_usage')
    .select('tokens_used, tokens_limit')
    .eq('account_id', accountId)
    .eq('period_start', periodStart.toISOString())
    .single();

  const tokensUsed = data?.tokens_used ?? 0;
  const tokensLimit = data?.tokens_limit ?? 1_000_000;
  const percentage = (tokensUsed / tokensLimit) * 100;

  const nextMonth = new Date(periodStart);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const daysUntilReset = Math.ceil((nextMonth.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return {
    tokensUsed,
    tokensLimit,
    daysUntilReset,
    status: percentage >= 100 ? 'blocked' : percentage >= 75 ? 'warning' : 'ok',
  };
}
```

## Files to Create/Modify

### New Files
- `apps/web/supabase/migrations/20251218000000_token_usage_tracking.sql`
- `apps/web/app/home/(user)/_components/usage-bar.tsx`
- `apps/web/app/home/(user)/_lib/server/usage.loader.ts`

### Modified Files
- `apps/web/lib/inngest/functions/generate-report.ts` - Add usage recording step
- `apps/web/app/api/sparlo/chat/route.ts` - Add chat usage tracking
- `apps/web/app/home/(user)/layout.tsx` - Add usage bar

## Acceptance Criteria

- [ ] Token usage recorded for report generation
- [ ] Token usage recorded for chat messages
- [ ] Usage bar displays on dashboard
- [ ] Warning at 75%, blocked message at 100%
- [ ] Monthly reset works correctly

## Implementation Timeline

### Phase 1: Database (Day 1)
1. Create migration
2. Run migration and generate types

### Phase 2: Backend (Day 2)
1. Update Inngest to persist usage
2. Update chat to track usage
3. Test in development

### Phase 3: Frontend (Day 3)
1. Create usage bar component
2. Create usage loader
3. Add to dashboard layout

## What We Removed (YAGNI)

Based on reviewer feedback:
- **Audit trail table** - Not needed for MVP, can add later if required
- **Rollover system** - Complexity without customer demand
- **Cost tracking in DB** - Calculate on-demand using existing `calculateCost()`
- **5 warning levels** - Simplified to 3 (ok/warning/blocked)
- **Grace buffers** - Unnecessary complexity

## References

- Token tracking: `apps/web/lib/inngest/functions/generate-report.ts:104-124`
- LLM client: `apps/web/lib/llm/client.ts:36-54`
- Chat route: `apps/web/app/api/sparlo/chat/route.ts`
