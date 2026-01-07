---
title: "Supabase Client Stale Reference in Inngest Functions"
date: 2026-01-07
category: runtime-errors
tags:
  - supabase
  - inngest
  - client-lifecycle
  - async-execution
  - rpc-calls
  - step-functions
severity: critical
cost_per_debug: $15
components_affected:
  - apps/web/lib/inngest/functions/generate-report.ts
  - apps/web/lib/inngest/functions/generate-discovery-report.ts
  - apps/web/lib/inngest/functions/generate-hybrid-report.ts
  - apps/web/lib/inngest/functions/generate-dd-report.ts
status: resolved
---

# Supabase Client Stale Reference in Inngest Functions

## Problem

`TypeError: Cannot read properties of undefined (reading 'rest')` at Supabase RPC call during report generation completion steps.

```
TypeError: Cannot read properties of undefined (reading 'rest')
    at rpc (/app/apps/web/.next/standalone/node_modules/.pnpm/@supabase+supabase-js@2.87.1/node_modules/@supabase/supabase-js/dist/main/SupabaseClient.js:146:21)
```

**Cost**: $15 per debugging session due to long-running report generation flows.

## Root Cause

Supabase clients created at the start of Inngest functions became stale when used in deeply nested `step.run()` callbacks.

**Why this happens:**

1. Inngest functions execute **step-by-step across multiple HTTP requests**
2. Each `step.run()` is a separate invocation where completed steps return memoized results
3. A client created at function start (line ~104) is captured in closures
4. By the time completion steps run (line ~680+), the client's internal `rest` property is undefined
5. The closure holds a reference to a client whose internal state has been invalidated

**Simple analogy**: Like leaving a phone call on hold for 10 minutes - the line disconnects, but you're still holding a dead phone.

## Solution

Replace stale client references with fresh `getSupabaseServerAdminClient()` calls inside each step.

### Before (Broken)

```typescript
const supabase = getSupabaseServerAdminClient(); // Created once at function start

async function updateProgress(updates) {
  await supabase.from('sparlo_reports').update(updates)... // Stale by completion step
}
```

### After (Fixed)

```typescript
async function updateProgress(updates) {
  const freshSupabase = getSupabaseServerAdminClient(); // Fresh every call
  await freshSupabase.from('sparlo_reports').update(updates)...
}
```

### Places Fixed (11 total)

| File | Location | Change |
|------|----------|--------|
| `generate-report.ts` | Line 126 | ClaudeRefusalError handler |
| `generate-report.ts` | Line 192 | updateProgress() |
| `generate-report.ts` | Line 686 | increment_usage RPC |
| `generate-discovery-report.ts` | Line 122 | ClaudeRefusalError handler |
| `generate-discovery-report.ts` | Line 176 | updateProgress() |
| `generate-discovery-report.ts` | Line 642 | increment_usage RPC |
| `generate-hybrid-report.ts` | Line 176 | ClaudeRefusalError handler |
| `generate-hybrid-report.ts` | Line 249 | updateProgress() |
| `generate-hybrid-report.ts` | Line 772 | increment_usage RPC |
| `generate-dd-report.ts` | Line 573 | updateProgress() |
| `generate-dd-report.ts` | Line 1437 | increment_usage fallback |

## Why the Fix Works

1. `getSupabaseServerAdminClient()` creates a **new client instance** with fresh internal state
2. No stale closure references from function start
3. Each Inngest step replay gets a working client
4. The client is lightweight - just config, no persistent connection until query

## Prevention Strategies

### Pattern to FOLLOW

```typescript
// Helper functions create fresh clients internally
async function updateProgress(updates: Record<string, unknown>) {
  const freshSupabase = getSupabaseServerAdminClient(); // Fresh every call
  const { error } = await freshSupabase
    .from('sparlo_reports')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', reportId);
}

// Use helpers inside step.run()
await step.run('step-name', async () => {
  await updateProgress({ current_step: 'processing' });
});
```

### Pattern to AVOID

```typescript
// DON'T: Create client outside steps and reuse in callbacks
const supabase = getSupabaseServerAdminClient(); // Created once

await step.run('step-name', async () => {
  await supabase.from('table')... // STALE - will fail!
});
```

### Detection

Watch for these error patterns:
- `TypeError: Cannot read property 'rest' of undefined`
- `client.rest is undefined`
- Errors at end of long-running Inngest functions

### Code Review Checklist

- [ ] No `const supabase = ...` outside all `step.run()` blocks
- [ ] All DB operations happen inside `step.run()` callbacks
- [ ] Helper functions create fresh clients internally
- [ ] Error handlers use fresh clients
- [ ] Comments mark fresh client creation with `// P1 FIX`

## Testing

Unit tests won't catch this - the issue only manifests with Inngest's serialization/deserialization between steps.

**Integration testing approach:**
1. Trigger multi-step report generation
2. Wait for completion through all step boundaries
3. Verify no TypeErrors in logs
4. Check report completes successfully

## Related Documentation

- [Supabase Client Bundling Standalone](../build-errors/supabase-client-bundling-standalone.md) - Similar `rest` property issue from tree-shaking
- [Token-Based Usage Tracking](../features/token-based-usage-tracking.md) - increment_usage RPC patterns
- [Inngest Report Cancellation](../integration-issues/inngest-report-cancellation.md) - Related Inngest patterns

## Related TODOs

- `todos/089-completed-p2-check-usage-stale-data.md` - TOCTOU race condition in usage tracking
- `todos/074-completed-p1-missing-usage-increment-in-inngest.md` - Token tracking implementation

## Commit Reference

```
fix(inngest): use fresh Supabase clients to prevent stale reference crashes

Commit: 6d30c38
Date: 2026-01-07
```
