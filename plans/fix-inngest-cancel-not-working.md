# fix: Inngest Cancel Button Not Actually Cancelling Runs

## Overview

The Cancel button on the frontend sends a `report/cancel.requested` event to Inngest, but running functions are **not being cancelled**. The database status updates to 'cancelled', but the Inngest function continues running until completion.

## Problem Statement

**User Report:** "The event is calling on Inngest, but it's not cancelling the run"

**Current Behavior:**
1. User clicks Cancel button
2. Server action updates database status to 'cancelled' ✅
3. Server action sends `report/cancel.requested` event to Inngest ✅
4. Inngest function **continues running** ❌

**Expected Behavior:**
- Inngest function should stop at the next step boundary when cancel event is received

## Root Cause Analysis

Based on comprehensive research, the most likely causes are:

### 🔴 CRITICAL: Inngest App Not Synced After Deployment

From Inngest documentation and GitHub issues:
> "I didn't know you needed to re-sync the app when workflow changes are deployed"

**The `cancelOn` configuration in code is NOT automatically synced to Inngest's production environment.**

After deploying code with `cancelOn` changes, you must manually sync the Inngest app:
- Via Inngest dashboard: Apps → Sync App → Paste endpoint URL
- Via curl: `curl -X PUT https://your-app.com/api/inngest`
- Via Vercel/Netlify integrations (automatic if configured)

### 🟡 SECONDARY: No Explicit Cancellation Error Handling

The Inngest functions have `cancelOn` configured but do NOT catch the cancellation error:

```typescript
// CURRENT (missing handler)
cancelOn: [{ event: 'report/cancel.requested', match: 'data.reportId' }],

// MISSING in the function body:
catch (error) {
  if (error.name === 'NonRetriableError') {
    // Handle cancellation
  }
}
```

### 🟡 SECONDARY: Cancellation Only Happens Between Steps

Inngest documentation:
> "Functions are cancelled _between steps_, meaning that if there is a `step.run` currently executing, it will finish before the function is cancelled."

Long-running steps (like AN4 LLM calls taking 60+ seconds) will complete before cancellation takes effect.

## Technical Approach

### Phase 1: Verify and Fix Inngest Sync (CRITICAL)

**Task 1.1: Check Current Sync Status**
```bash
# Check if cancelOn appears in Inngest dashboard
# Navigate to: https://app.inngest.com/env/production/functions
# Look for: sparlo-hybrid-report-generator, sparlo-report-generator, sparlo-discovery-report-generator
# Verify: cancelOn configuration is visible
```

**Task 1.2: Force Sync Inngest App**
```bash
# Option A: Via curl
curl -X PUT https://sparlo.ai/api/inngest --fail-with-body

# Option B: Via Inngest dashboard
# Apps → Your App → Sync App
```

**Task 1.3: Add Sync to Deployment Pipeline**

Update deployment configuration to auto-sync Inngest after deploy.

### Phase 2: Add Cancellation Error Handling

**File: `apps/web/lib/inngest/functions/generate-hybrid-report.ts`**

```typescript
// Around line 80, wrap the main execution in try/catch
async ({ event, step }) => {
  const reportId = event.data.reportId;

  try {
    // ... existing step execution code ...
    return await runHybridGeneration(event, step);
  } catch (error) {
    // Handle cancellation
    if (error && typeof error === 'object' && 'name' in error) {
      if (error.name === 'NonRetriableError' || error.name === 'CancelledError') {
        console.log(`[Cancel] Report ${reportId} cancelled by user`);
        // Status already updated by server action, just log and return
        return { success: false, reportId, cancelled: true };
      }
    }

    // Re-throw other errors for normal error handling
    throw error;
  }
}
```

Apply same pattern to:
- `generate-report.ts`
- `generate-discovery-report.ts`

### Phase 3: Add Logging for Debugging

**File: `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`**

```typescript
// Around line 373, add detailed logging
console.log('[Cancel] Sending Inngest event:', {
  reportId: data.reportId,
  accountId: report.account_id,
  timestamp: new Date().toISOString(),
});

const result = await inngest.send({
  name: 'report/cancel.requested',
  data: {
    reportId: data.reportId,
    accountId: report.account_id,
    cancelledBy: user.id,
  },
});

console.log('[Cancel] Inngest event sent, result:', result);
```

### Phase 4: Add Inngest Function Logging

**File: All three Inngest function files**

Add at the start of the function:
```typescript
async ({ event, step }) => {
  console.log(`[Report ${event.data.reportId}] Function started, cancelOn active`);

  // ... existing code ...
}
```

## Acceptance Criteria

### Functional Requirements
- [ ] Cancel button stops Inngest function within one step boundary
- [ ] Database status matches Inngest function state
- [ ] Cancelled reports do not continue processing
- [ ] UI shows accurate cancellation status

### Verification Steps
1. Start a new report generation
2. Wait for processing to begin (check Inngest dashboard)
3. Click Cancel button
4. Verify in Inngest dashboard that function shows "Cancelled" status
5. Verify database status is 'cancelled'
6. Verify no further steps execute after cancellation

## Files to Modify

| File | Change |
|------|--------|
| `apps/web/lib/inngest/functions/generate-hybrid-report.ts` | Add cancellation error handler |
| `apps/web/lib/inngest/functions/generate-report.ts` | Add cancellation error handler |
| `apps/web/lib/inngest/functions/generate-discovery-report.ts` | Add cancellation error handler |
| `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts` | Add logging |

## Deployment Checklist

- [ ] Deploy code changes to production
- [ ] **CRITICAL: Sync Inngest app after deployment**
  - Via dashboard: Apps → Sync App
  - Or via curl: `curl -X PUT https://sparlo.ai/api/inngest`
- [ ] Verify sync in Inngest dashboard (check `cancelOn` visible)
- [ ] Test cancellation end-to-end
- [ ] Monitor logs for `[Cancel]` messages

## Edge Cases to Handle

1. **Cancel during long step** - User sees "Cancelled" but step continues for up to 60s
   - Mitigation: Add UI message "Cancelling... may take up to 60 seconds"

2. **Cancel after completion** - Race condition where function finishes as user cancels
   - Mitigation: Server action already handles this (idempotent check)

3. **Network failure** - Cancel event doesn't reach Inngest
   - Mitigation: Database is updated first, function will see 'cancelled' status on next step

4. **Cancel during clarification** - User cancels while waiting for their input
   - Current: Cancel is allowed, `waitForEvent` times out naturally
   - Mitigation: Consider cancelling the `waitForEvent` explicitly

## References

### Internal
- `apps/web/app/home/(user)/_components/reports-dashboard.tsx:48-96` - CancelButton component
- `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts:327-397` - Server action
- `apps/web/lib/inngest/client.ts:76-81` - Event schema
- `docs/solutions/integration-issues/inngest-report-cancellation.md` - Implementation guide

### External
- [Inngest Cancellation Docs](https://www.inngest.com/docs/features/inngest-functions/cancellation)
- [Inngest cancelOn Reference](https://www.inngest.com/docs/reference/typescript/functions/cancel-on)
- [Inngest App Syncing](https://www.inngest.com/docs/apps/cloud)
- [GitHub Issue #1276 - Cancel running functions](https://github.com/inngest/inngest/issues/1276)

## Success Metrics

- Cancel success rate: >99% of cancel requests result in stopped functions
- Cancel latency: <5 seconds to stop (excluding current step completion)
- Zero reports showing 'cancelled' status while function continues running
