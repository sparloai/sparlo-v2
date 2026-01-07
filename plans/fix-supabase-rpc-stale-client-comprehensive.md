# fix: Comprehensive Supabase RPC Stale Client Fix & Token Tracking Verification

**Priority**: P1 (Critical)
**Type**: Bug Fix + Verification
**Created**: 2026-01-07
**Cost Impact**: $15 per debug session avoided

---

## Overview

The `TypeError: Cannot read properties of undefined (reading 'rest')` error at the end of due diligence flow is caused by **stale Supabase client references** in long-running Inngest functions. While an initial fix was applied to `increment_usage` RPC calls, **the fix is incomplete** - other database operations still use stale clients.

This plan ensures:
1. All RPC/database calls use fresh Supabase clients
2. Token tracking is verified to actually work
3. Proper monitoring is in place to detect future issues

---

## Problem Statement

### Root Cause (Confirmed)

Inngest functions execute **step-by-step across multiple HTTP requests**. Each `step.run()` is a separate invocation where:
1. Function re-executes from the beginning
2. Completed steps return memoized results (skipped)
3. Next incomplete step executes

When a Supabase client is created at function start (line ~104-113), by the time execution reaches the completion step (line ~679-770), the client reference can be:
- Stale due to serverless container freeze/thaw cycles
- Invalid due to connection timeout (1-2 min idle)
- Corrupted due to module caching issues

### Current State After Initial Fix

| Component | DD Report | Standard | Discovery | Hybrid |
|-----------|:---------:|:--------:|:---------:|:------:|
| Fresh client for `increment_usage` | ✅ | ✅ | ✅ | ✅ |
| Try-catch on `increment_usage` | ✅ | ✅ | ✅ | ✅ |
| Fresh client for `updateProgress` | ✅ | ❌ | ❌ | ❌ |
| Fresh client for rate limit check | ❌ | N/A | N/A | N/A |
| Atomic completion | ✅ | ❌ | ❌ | ❌ |
| Idempotency key | ✅ | ❌ | ❌ | ❌ |

**Critical Gap**: The `updateProgress({status: 'complete', ...})` call in Standard, Discovery, and Hybrid reports still uses the outer stale `supabase` client. This means **3 of 4 report types can still crash** with the same error.

---

## Technical Approach

### Phase 1: Complete the Stale Client Fix

#### 1.1 Fix updateProgress in generate-report.ts

**File**: `apps/web/lib/inngest/functions/generate-report.ts`
**Issue**: `updateProgress` function (lines 189-201) uses outer `supabase` variable

```typescript
// CURRENT (lines 189-201) - VULNERABLE
async function updateProgress(updates: Record<string, unknown>) {
  const { error } = await supabase  // <-- Stale client reference
    .from('sparlo_reports')
    .update({...updates, updated_at: new Date().toISOString()})
    .eq('id', reportId);
  // ...
}

// FIX: Create fresh client inside function
async function updateProgress(updates: Record<string, unknown>) {
  const freshSupabase = getSupabaseServerAdminClient();
  const { error } = await freshSupabase
    .from('sparlo_reports')
    .update({...updates, updated_at: new Date().toISOString()})
    .eq('id', reportId);
  // ...
}
```

#### 1.2 Fix updateProgress in generate-discovery-report.ts

**File**: `apps/web/lib/inngest/functions/generate-discovery-report.ts`
**Issue**: Same pattern - `updateProgress` uses outer `supabase` (defined at line 113)

Apply identical fix as 1.1.

#### 1.3 Fix updateProgress in generate-hybrid-report.ts

**File**: `apps/web/lib/inngest/functions/generate-hybrid-report.ts`
**Issue**: Same pattern - `updateProgress` uses outer `supabase` (defined at line 111)

Apply identical fix as 1.1.

#### 1.4 Fix rate limit check in generate-dd-report.ts

**File**: `apps/web/lib/inngest/functions/generate-dd-report.ts`
**Lines**: 367-395

```typescript
// CURRENT (line 370) - POTENTIALLY VULNERABLE
const rateLimitResult = await step.run('check-rate-limit', async () => {
  try {
    const rpc = supabase.rpc as any;  // <-- Uses outer supabase
    // ...

// FIX: Use fresh client
const rateLimitResult = await step.run('check-rate-limit', async () => {
  try {
    const freshSupabase = getSupabaseServerAdminClient();
    const rpc = freshSupabase.rpc as any;
    // ...
```

### Phase 2: Add Token Tracking Verification

#### 2.1 Add verification logging

After each `increment_usage` call, log the result for debugging:

```typescript
try {
  const freshSupabase = getSupabaseServerAdminClient();
  const { data, error: usageError } = await freshSupabase.rpc('increment_usage', {
    p_account_id: accountId,
    p_tokens: totalUsage.totalTokens,
    p_is_report: true,
    p_is_chat: false,
  });

  if (usageError) {
    console.error('[Usage] RPC returned error:', {
      accountId,
      tokens: totalUsage.totalTokens,
      error: usageError.message,
      code: usageError.code,
    });
  } else {
    console.log('[Usage] Successfully tracked:', {
      accountId,
      tokens: totalUsage.totalTokens,
      reportId,
      result: data,  // Log the RPC return value
    });
  }
} catch (usageError) {
  console.error('[Usage] Exception during increment_usage:', {
    accountId,
    tokens: totalUsage.totalTokens,
    error: usageError instanceof Error ? usageError.message : String(usageError),
    stack: usageError instanceof Error ? usageError.stack : undefined,
  });
}
```

#### 2.2 Create database verification query

**New file**: `apps/web/lib/inngest/utils/verify-token-tracking.ts`

```typescript
import 'server-only';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

export async function verifyTokenTracking(
  accountId: string,
  expectedMinTokens: number
): Promise<{ success: boolean; actualTokens: number; error?: string }> {
  const supabase = getSupabaseServerAdminClient();

  const { data, error } = await supabase
    .from('usage_periods')
    .select('tokens_used')
    .eq('account_id', accountId)
    .eq('status', 'active')
    .single();

  if (error) {
    return { success: false, actualTokens: 0, error: error.message };
  }

  return {
    success: (data?.tokens_used ?? 0) >= expectedMinTokens,
    actualTokens: data?.tokens_used ?? 0,
  };
}
```

### Phase 3: Add Integration Tests

#### 3.1 Test file structure

**New file**: `apps/web/lib/inngest/functions/__tests__/token-tracking.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

describe('Token Tracking', () => {
  const testAccountId = 'test-account-uuid';
  let initialTokenCount: number;

  beforeEach(async () => {
    const supabase = getSupabaseServerAdminClient();
    const { data } = await supabase
      .from('usage_periods')
      .select('tokens_used')
      .eq('account_id', testAccountId)
      .eq('status', 'active')
      .single();
    initialTokenCount = data?.tokens_used ?? 0;
  });

  it('increment_usage RPC should increase token count', async () => {
    const supabase = getSupabaseServerAdminClient();
    const tokensToAdd = 1000;

    const { error } = await supabase.rpc('increment_usage', {
      p_account_id: testAccountId,
      p_tokens: tokensToAdd,
      p_is_report: true,
      p_is_chat: false,
    });

    expect(error).toBeNull();

    // Verify the count increased
    const { data } = await supabase
      .from('usage_periods')
      .select('tokens_used')
      .eq('account_id', testAccountId)
      .eq('status', 'active')
      .single();

    expect(data?.tokens_used).toBe(initialTokenCount + tokensToAdd);
  });

  it('fresh Supabase client should have valid rest property', () => {
    const supabase = getSupabaseServerAdminClient();

    // This is what fails when client is stale
    expect(supabase).toBeDefined();
    expect(typeof supabase.rpc).toBe('function');

    // Access internal rest property (what causes the error)
    // @ts-expect-error - accessing internal property for validation
    expect(supabase.rest).toBeDefined();
  });

  it('should handle concurrent increment_usage calls', async () => {
    const supabase1 = getSupabaseServerAdminClient();
    const supabase2 = getSupabaseServerAdminClient();

    // Simulate concurrent calls
    const [result1, result2] = await Promise.all([
      supabase1.rpc('increment_usage', {
        p_account_id: testAccountId,
        p_tokens: 500,
        p_is_report: true,
        p_is_chat: false,
      }),
      supabase2.rpc('increment_usage', {
        p_account_id: testAccountId,
        p_tokens: 500,
        p_is_report: true,
        p_is_chat: false,
      }),
    ]);

    expect(result1.error).toBeNull();
    expect(result2.error).toBeNull();

    // Both should have been counted
    const { data } = await supabase1
      .from('usage_periods')
      .select('tokens_used')
      .eq('account_id', testAccountId)
      .eq('status', 'active')
      .single();

    expect(data?.tokens_used).toBe(initialTokenCount + 1000);
  });
});
```

### Phase 4: Add Monitoring & Alerting

#### 4.1 Structured error logging for alerting

Replace `console.warn` with structured logging that can trigger alerts:

```typescript
// In each report generator's catch block for increment_usage
} catch (usageError) {
  // Structured log that can be picked up by monitoring
  console.error(JSON.stringify({
    level: 'error',
    event: 'token_tracking_failed',
    accountId,
    reportId,
    tokens: totalUsage.totalTokens,
    error: usageError instanceof Error ? usageError.message : String(usageError),
    timestamp: new Date().toISOString(),
    reportType: 'dd', // or 'standard', 'discovery', 'hybrid'
  }));
}
```

#### 4.2 Health check for RPC functions

**New file**: `apps/web/app/api/health/rpc/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

export async function GET() {
  const supabase = getSupabaseServerAdminClient();
  const results: Record<string, { exists: boolean; error?: string }> = {};

  const rpcFunctions = [
    'increment_usage',
    'increment_usage_idempotent',
    'complete_dd_report_atomic',
    'check_rate_limit',
  ];

  for (const fn of rpcFunctions) {
    try {
      // Try to call with invalid params - we just want to check function exists
      const { error } = await supabase.rpc(fn as any, {});

      // If error is about invalid params, function exists
      if (error?.message?.includes('argument') || error?.message?.includes('parameter')) {
        results[fn] = { exists: true };
      } else if (error?.message?.includes('does not exist')) {
        results[fn] = { exists: false, error: 'Function not found' };
      } else {
        results[fn] = { exists: true }; // Some other error, but function exists
      }
    } catch (e) {
      results[fn] = {
        exists: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      };
    }
  }

  const allExist = Object.values(results).every(r => r.exists);

  return NextResponse.json({
    status: allExist ? 'healthy' : 'degraded',
    functions: results,
    timestamp: new Date().toISOString(),
  }, { status: allExist ? 200 : 503 });
}
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] All 4 report generators use fresh Supabase clients for ALL database operations in `step.run()` callbacks
- [ ] No `TypeError: Cannot read properties of undefined (reading 'rest')` errors in production logs
- [ ] Token usage is correctly tracked and persisted for all report types
- [ ] Rate limit check in DD reports uses fresh client

### Non-Functional Requirements

- [ ] Integration tests pass for `increment_usage` RPC
- [ ] Health check endpoint returns 200 when all RPC functions exist
- [ ] Structured error logs are emitted on token tracking failures

### Quality Gates

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint:fix` passes
- [ ] Manual verification: Generate a DD report and confirm `tokens_used` increased in `usage_periods` table

---

## Implementation Checklist

### Phase 1: Complete Stale Client Fix
- [ ] Fix `updateProgress` in `generate-report.ts` (line 189-201)
- [ ] Fix `updateProgress` in `generate-discovery-report.ts`
- [ ] Fix `updateProgress` in `generate-hybrid-report.ts`
- [ ] Fix rate limit check in `generate-dd-report.ts` (line 370)

### Phase 2: Token Tracking Verification
- [ ] Add detailed logging to all `increment_usage` calls
- [ ] Create `verify-token-tracking.ts` utility
- [ ] Add logging of RPC return values

### Phase 3: Integration Tests
- [ ] Create `token-tracking.test.ts`
- [ ] Test fresh client has valid `rest` property
- [ ] Test concurrent `increment_usage` calls

### Phase 4: Monitoring
- [ ] Add structured JSON error logging
- [ ] Create `/api/health/rpc` endpoint
- [ ] Configure alerts on `token_tracking_failed` events

---

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Fix causes performance regression (extra client creation) | Low | Low | `getSupabaseServerAdminClient()` is lightweight - just creates client config, no actual DB connection until query |
| Missing other stale client patterns | Medium | High | Search codebase for all `supabase.` usages in Inngest functions |
| increment_usage RPC doesn't exist in some environments | Low | Medium | Fallback already exists; add health check |
| Tests require database access | Medium | Low | Use test database or mocks |

---

## Files to Modify

| File | Changes |
|------|---------|
| `apps/web/lib/inngest/functions/generate-report.ts` | Fresh client in `updateProgress`, enhanced logging |
| `apps/web/lib/inngest/functions/generate-discovery-report.ts` | Fresh client in `updateProgress`, enhanced logging |
| `apps/web/lib/inngest/functions/generate-hybrid-report.ts` | Fresh client in `updateProgress`, enhanced logging |
| `apps/web/lib/inngest/functions/generate-dd-report.ts` | Fresh client in rate limit check, enhanced logging |
| `apps/web/lib/inngest/utils/verify-token-tracking.ts` | **NEW** - Verification utility |
| `apps/web/lib/inngest/functions/__tests__/token-tracking.test.ts` | **NEW** - Integration tests |
| `apps/web/app/api/health/rpc/route.ts` | **NEW** - Health check endpoint |

---

## References

### Internal References
- Initial fix applied: `generate-dd-report.ts:1385-1448`
- Supabase admin client: `packages/supabase/src/clients/server-admin-client.ts:16-29`
- Token tracking migration: `supabase/migrations/20251219000000_add_usage_tracking.sql`
- Idempotent tracking: `supabase/migrations/20260103000003_dd_mode_increment_usage_idempotent.sql`

### External References
- [Inngest: How Functions Are Executed](https://www.inngest.com/docs/learn/how-functions-are-executed)
- [Supabase: Connection Management](https://supabase.com/docs/guides/database/connection-management)
- [Supabase SSR: Per-request client creation](https://supabase.com/docs/guides/auth/server-side/creating-a-client)

### Related Work
- TODO 081: Usage tracking never persisted (completed)
- TODO 143: Non-atomic database update (addressed with atomic completion)
- TODO 145: DD token usage race condition (addressed with idempotency)
