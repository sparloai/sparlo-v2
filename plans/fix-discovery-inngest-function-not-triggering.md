# fix: Discovery Inngest Function Not Triggering

## Overview

Discovery workflow triggers an Inngest event successfully (confirmed in dashboard with event IDs), but no function runs. The event has all the correct data, there are no error logs in Railway or console - the function simply doesn't execute.

## Problem Statement

**Symptoms:**
- Event `report/generate-discovery` IS being sent (logs show event IDs returned)
- Inngest endpoint returns `function_count: 2` (both functions appear registered)
- Standard report function (`generate-report`) works fine with identical setup
- Discovery function (`discovery-report-generator`) never triggers
- No errors anywhere - Railway logs, console, Inngest dashboard

**Key Observation:** The function ID was recently renamed from `generate-discovery-report` to `discovery-report-generator` in an attempt to force re-registration - this is likely related to the issue.

## Root Cause Analysis

Based on research, the most likely cause is **stale function registration in Inngest Cloud**:

1. When function IDs change, Inngest Cloud needs to re-sync to recognize the new function
2. The `/api/inngest` endpoint returning `function_count: 2` only shows what the **local SDK** knows, not what **Inngest Cloud** has registered
3. Events are matched to functions by Inngest Cloud's registry, not the local SDK

### Evidence Supporting This Theory

| Factor | Observation | Implication |
|--------|-------------|-------------|
| Standard function works | Same registration mechanism | Proves Inngest integration is functional |
| Event sent successfully | Dashboard shows event with IDs | Event emission pipeline works |
| No function triggered | 0 runs in Runs tab | Event not matching any function |
| Recent ID change | From `generate-discovery-report` → `discovery-report-generator` | Cloud registry likely has stale ID |

## Proposed Solution

### Phase 1: Diagnostic Verification

Before fixing, confirm the root cause by checking Inngest Cloud's actual function registry.

#### Step 1.1: Check Inngest Dashboard Functions Tab

1. Navigate to Inngest Cloud dashboard
2. Go to **Functions** tab
3. Search for both:
   - `discovery-report-generator` (new ID)
   - `generate-discovery-report` (old ID)
4. Note which one exists (or if neither exists)

#### Step 1.2: Check Event Details in Dashboard

1. Go to **Events** tab
2. Find a recent `report/generate-discovery` event
3. Click to view details
4. Check the **"Functions Triggered"** count - should show `0`
5. Check if there's any error message

#### Step 1.3: Add Diagnostic Logging

Add logging to verify exactly what functions are being served:

```typescript
// apps/web/lib/inngest/functions/index.ts
import { generateDiscoveryReport } from './generate-discovery-report';
import { generateReport } from './generate-report';

// Log function registration for debugging
console.log('[Inngest] Registering functions:', [
  { id: 'generate-report', fn: !!generateReport },
  { id: 'discovery-report-generator', fn: !!generateDiscoveryReport },
]);

export const functions = [generateReport, generateDiscoveryReport];
```

### Phase 2: Force Function Re-Registration

The key fix is forcing Inngest Cloud to recognize the new function ID.

#### Step 2.1: Ensure Clean Function Definition

```typescript
// apps/web/lib/inngest/functions/generate-discovery-report.ts:57-62

// Verify function is correctly defined
export const generateDiscoveryReport = inngest.createFunction(
  {
    id: 'discovery-report-generator',  // Must match exactly
    retries: 2,
  },
  { event: 'report/generate-discovery' },  // Event name must match sender
  async ({ event, step }) => {
    // ... handler
  }
);
```

#### Step 2.2: Add `server-only` Import Back

The standard function has this import; the discovery function is missing it. This could affect module loading:

```typescript
// apps/web/lib/inngest/functions/generate-discovery-report.ts:1
import 'server-only';  // ADD THIS BACK

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
// ... rest of imports
```

#### Step 2.3: Force Sync via Dashboard

1. Go to Inngest Cloud dashboard
2. Navigate to **Apps** tab
3. Find your app (`sparlo-v2`)
4. Click **"Resync App"** or **"Sync Now"**
5. Wait for sync to complete
6. Verify `discovery-report-generator` appears in Functions tab

#### Step 2.4: Alternative - Force Sync via curl

```bash
# Hit the PUT endpoint to trigger re-registration
curl -X PUT "https://sparlo-v2.up.railway.app/api/inngest" \
  -H "Content-Type: application/json"
```

### Phase 3: Verify Fix

#### Step 3.1: Check Function Registration

After sync, verify in Inngest dashboard:
- [ ] `discovery-report-generator` appears in Functions tab
- [ ] Function shows correct event trigger: `report/generate-discovery`
- [ ] Function status is "Active" (not paused)

#### Step 3.2: Test Discovery Mode

1. Trigger a discovery report from the UI
2. Check Inngest dashboard **Runs** tab
3. Should see a new run for `discovery-report-generator`
4. Check Railway logs for `[Discovery Function] Starting with event:` message

#### Step 3.3: Verify Event-Function Matching

In Inngest dashboard Events tab:
1. Find the new `report/generate-discovery` event
2. Click to view details
3. Confirm **"Functions Triggered: 1"** (not 0)

## Technical Considerations

### Why This Happened

Inngest's function registration works as follows:

1. **Local SDK** defines functions and serves them via `/api/inngest`
2. **Inngest Cloud** syncs with your endpoint to discover functions
3. **Event matching** happens in Inngest Cloud, not locally

When you rename a function ID:
- Local SDK immediately knows the new ID
- Inngest Cloud still has the old ID until re-synced
- Events sent match against Cloud's registry (old ID)
- No function matches → no execution

### Prevention Going Forward

1. **Always resync after function ID changes** - either via dashboard or CI/CD
2. **Add CI/CD step to trigger sync** after deployment:
   ```yaml
   - name: Sync Inngest functions
     run: curl -X PUT "${{ secrets.APP_URL }}/api/inngest"
   ```
3. **Monitor function count** - add alerting if registered functions < expected

### Impact of `server-only` Import

The `server-only` package:
- Throws an error if code runs in browser context
- Ensures module is only loaded server-side
- May affect how Next.js tree-shakes the module

Without it, the module might be included in client bundles (error) or excluded entirely during build (silent failure).

## Acceptance Criteria

- [ ] `discovery-report-generator` function appears in Inngest Cloud Functions tab
- [ ] New discovery events show "Functions Triggered: 1" in Events tab
- [ ] Discovery mode creates runs visible in Runs tab
- [ ] Railway logs show `[Discovery Function] Starting with event:` when triggered
- [ ] `server-only` import restored to discovery function
- [ ] No TypeScript errors after changes

## Files to Modify

### apps/web/lib/inngest/functions/generate-discovery-report.ts

Add back `server-only` import:

```typescript
import 'server-only';  // Line 1 - ADD THIS

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
// ... rest unchanged
```

### apps/web/lib/inngest/functions/index.ts

Add diagnostic logging (optional, can remove after fix confirmed):

```typescript
import { generateDiscoveryReport } from './generate-discovery-report';
import { generateReport } from './generate-report';

// Diagnostic logging - remove after fix confirmed
if (process.env.NODE_ENV !== 'production') {
  console.log('[Inngest] Functions being registered:', {
    generateReport: generateReport?.id,
    generateDiscoveryReport: generateDiscoveryReport?.id,
  });
}

export const functions = [generateReport, generateDiscoveryReport];
```

## Success Metrics

1. Discovery mode runs complete successfully in Inngest
2. Reports are generated and saved to database
3. User sees processing screen and completed report

## References

### Internal References
- `apps/web/lib/inngest/functions/generate-discovery-report.ts` - Discovery function
- `apps/web/lib/inngest/functions/generate-report.ts` - Working standard function
- `apps/web/lib/inngest/functions/index.ts` - Function registry
- `apps/web/lib/inngest/client.ts` - Inngest client with event schemas
- `apps/web/app/api/inngest/route.ts` - Inngest API handler
- `apps/web/app/home/(user)/_lib/server/discovery-reports-server-actions.ts` - Event sender

### External References
- [Inngest Function Sync Documentation](https://www.inngest.com/docs/apps/cloud)
- [Inngest Events & Triggers](https://www.inngest.com/docs/features/events-triggers)
- [Inngest Debugging Guide](https://www.inngest.com/docs/platform/monitor/inspecting-function-runs)

### Related Work
- Recent commit `2320e27` renamed function ID (attempted fix that didn't work)
- Recent commit removed `server-only` import (potential cause)

---

## Quick Fix Checklist

If you want to try the fastest fix:

1. [ ] Add `import 'server-only';` to top of `generate-discovery-report.ts`
2. [ ] Deploy to Railway
3. [ ] Run: `curl -X PUT "https://sparlo-v2.up.railway.app/api/inngest"`
4. [ ] Check Inngest dashboard Functions tab for `discovery-report-generator`
5. [ ] Test discovery mode
