# Fix Archive Button and Add Cancel Button for Reports

## Overview

The archive button on the reports dashboard is not working, and users need the ability to cancel report generation in progress.

---

## Problem Statement

1. **Archive Button Not Working**: The archive server action may be failing silently due to database constraint issues
2. **No Cancel Functionality**: Users cannot stop a long-running report generation

---

## Root Cause Analysis

### Archive Button Issue
The database constraint for `status` column only allows: `'clarifying', 'processing', 'complete', 'error', 'confirm_rerun'`

However, TypeScript code references additional statuses like `'failed'` that don't exist in the database. This mismatch may cause issues when archiving reports in certain states.

### Cancel Functionality Gap
Currently, `generate-hybrid-report.ts` has no `cancelOn` configuration, meaning there's no event-driven way to cancel a running function.

---

## Implementation Plan

### Phase 1: Database Migration (Critical Fix)

**File**: `apps/web/supabase/migrations/YYYYMMDDHHMMSS_add_cancelled_status.sql`

Add 'cancelled' and 'failed' to the status constraint:

```sql
-- Add cancelled and failed statuses to triz_reports
ALTER TABLE triz_reports
DROP CONSTRAINT IF EXISTS triz_reports_status_check;

ALTER TABLE triz_reports
ADD CONSTRAINT triz_reports_status_check
CHECK (status IN ('clarifying', 'processing', 'complete', 'error', 'cancelled', 'failed', 'confirm_rerun'));

-- Add index for cancelled reports queries
CREATE INDEX IF NOT EXISTS idx_triz_reports_cancelled
ON triz_reports(account_id, status)
WHERE status = 'cancelled';
```

### Phase 2: Inngest Cancellation Configuration

**File**: `apps/web/lib/inngest/functions/generate-hybrid-report.ts`

Add cancelOn configuration to the Inngest function:

```typescript
export const generateHybridReport = inngest.createFunction(
  {
    id: 'generate-hybrid-report',
    retries: 2,
    cancelOn: [
      {
        event: 'report/cancel.requested',
        match: 'data.reportId',
      },
    ],
  },
  { event: 'report/generate.requested' },
  async ({ event, step }) => {
    // existing implementation
  }
);
```

### Phase 3: Cancel Event and Server Action

**File**: `apps/web/lib/inngest/events.ts`

Add cancel event type:

```typescript
export type ReportCancelRequested = {
  name: 'report/cancel.requested';
  data: {
    reportId: string;
    accountId: string;
    cancelledBy: string;
  };
};
```

**File**: `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`

Add cancel server action:

```typescript
export const cancelReportGeneration = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();

    // Verify report is in processing state and user has access
    const { data: report, error: fetchError } = await client
      .from('triz_reports')
      .select('id, status, account_id')
      .eq('id', data.reportId)
      .single();

    if (fetchError || !report) {
      throw new Error('Report not found');
    }

    if (report.status !== 'processing') {
      throw new Error('Can only cancel reports that are processing');
    }

    // Send cancellation event to Inngest
    await inngest.send({
      name: 'report/cancel.requested',
      data: {
        reportId: data.reportId,
        accountId: report.account_id,
        cancelledBy: data.userId,
      },
    });

    // Update status to cancelled immediately for UI feedback
    const { error: updateError } = await client
      .from('triz_reports')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.reportId);

    if (updateError) {
      throw updateError;
    }

    return { success: true };
  },
  {
    schema: z.object({
      reportId: z.string().uuid(),
      userId: z.string().uuid(),
    }),
  }
);
```

### Phase 4: UI Components

**File**: `apps/web/app/home/(user)/_components/reports-dashboard.tsx`

Add Cancel button for processing reports:

```typescript
// In the report row actions area (around line 267-271)
{report.status === 'processing' && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => handleCancel(report.id)}
    className="text-amber-600 hover:text-amber-700"
  >
    <X className="h-4 w-4 mr-1" />
    Cancel
  </Button>
)}

// In the status display area
{report.status === 'cancelled' && (
  <Badge variant="outline" className="text-zinc-500">
    Cancelled
  </Badge>
)}
```

Add cancel handler:

```typescript
const handleCancel = async (reportId: string) => {
  try {
    await cancelReportGeneration({ reportId, userId: user.id });
    // Optimistic update or refetch
    router.refresh();
  } catch (error) {
    toast.error('Failed to cancel report');
  }
};
```

### Phase 5: Update Archive Logic

**File**: `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`

Update `archiveReport` to allow archiving cancelled reports:

```typescript
// In archiveReport function, update the status check
if (!['complete', 'error', 'cancelled', 'failed'].includes(report.status)) {
  throw new Error('Can only archive completed, errored, or cancelled reports');
}
```

---

## Files to Modify

1. `apps/web/supabase/migrations/YYYYMMDDHHMMSS_add_cancelled_status.sql` (new)
2. `apps/web/lib/inngest/functions/generate-hybrid-report.ts` - Add cancelOn
3. `apps/web/lib/inngest/events.ts` - Add cancel event type
4. `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts` - Add cancel action, update archive
5. `apps/web/app/home/(user)/_components/reports-dashboard.tsx` - Add Cancel button and handler

---

## Edge Cases and Error Handling

### Race Conditions
- User clicks cancel just as report completes → Check status before updating
- Multiple cancel clicks → Idempotent operation (second click sees 'cancelled' status)

### Cleanup After Cancellation
- Inngest automatically handles cleanup via `inngest/function.cancelled` system event if needed
- No partial data cleanup required - atomic step completion means data is valid

### UI States
- Processing → Cancel button visible
- Cancelled → Show "Cancelled" badge, allow Archive
- Optimistic update on cancel click for immediate feedback

---

## Acceptance Criteria

- [ ] Database migration adds 'cancelled' and 'failed' statuses
- [ ] Archive button works for completed, error, cancelled, and failed reports
- [ ] Cancel button appears for processing reports
- [ ] Clicking cancel stops report generation and shows "Cancelled" status
- [ ] Cancelled reports can be archived
- [ ] TypeScript types match database constraints

---

## Test Plan

1. **Archive Button**
   - Create a report that errors out → Archive it → Verify archived
   - Create a report that completes → Archive it → Verify archived

2. **Cancel Functionality**
   - Start report generation → Click cancel while processing → Verify status changes to "Cancelled"
   - Verify Inngest function stops processing

3. **Edge Cases**
   - Click cancel rapidly multiple times → Only one cancellation processed
   - Cancel just as report completes → Handle gracefully (either cancelled or complete, not error)
