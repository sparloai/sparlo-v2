---
title: "Inngest Long-Running Function Cancellation"
category: integration-issues
tags: [inngest, cancellation, async, long-running]
severity: medium
date_documented: 2025-12-24
---

# Inngest Long-Running Function Cancellation

## Problem

Users couldn't cancel long-running report generation operations that took approximately 25 minutes to complete. Reports would become stuck in a "generating" state with no way for users to stop the operation, leading to poor user experience and wasted resources.

## Root Cause

The initial Inngest function implementation lacked a mechanism to:
1. Listen for cancellation events
2. Match cancellation events to specific running function instances
3. Update the database state when cancellation occurred
4. Provide UI controls for users to trigger cancellation

## Solution Overview

Implemented graceful cancellation for long-running Inngest functions using the `cancelOn` configuration option, combined with database state tracking and user-facing UI controls.

## Implementation Details

### 1. Database Schema Updates

Added new status values to the report generation status constraint:

```sql
-- Add 'cancelled' and 'failed' statuses to the reports table constraint
ALTER TABLE reports
ADD CONSTRAINT check_valid_status
CHECK (status IN ('idle', 'generating', 'generated', 'cancelled', 'failed'));
```

### 2. Inngest Function Configuration

Configure the Inngest function to listen for cancellation events:

```typescript
// app/inngest/functions/reports.ts
import { inngest } from '@/inngest/client';

export const generateHybridReport = inngest.createFunction(
  {
    id: 'generate-hybrid-report',
    cancelOn: [
      {
        event: 'report/generation.cancelled',
        match: 'data.reportId',
      },
    ],
  },
  { event: 'report/generation.requested' },
  async ({ event, step }) => {
    const { reportId, userId } = event.data;

    try {
      // Step 1: Initialize report generation
      const report = await step.run('fetch-report', async () => {
        return await db.query.reports.findFirst({
          where: eq(reports.id, reportId),
        });
      });

      if (!report) {
        throw new Error(`Report ${reportId} not found`);
      }

      // Step 2: Generate report (long-running operation)
      const reportData = await step.run('generate-data', async () => {
        return await generateReportData(reportId);
      });

      // Step 3: Save results
      await step.run('save-results', async () => {
        await db
          .update(reports)
          .set({
            status: 'generated',
            data: reportData,
            completedAt: new Date(),
          })
          .where(eq(reports.id, reportId));
      });
    } catch (error) {
      // Handle cancellation
      if (error instanceof inngest.StepError && error.code === 'CANCELLED') {
        await db
          .update(reports)
          .set({
            status: 'cancelled',
            cancelledAt: new Date(),
          })
          .where(eq(reports.id, reportId));
        return;
      }

      // Handle other errors
      await db
        .update(reports)
        .set({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date(),
        })
        .where(eq(reports.id, reportId));

      throw error;
    }
  }
);
```

### 3. Server Action for Cancellation

Create a server action that triggers the cancellation event:

```typescript
// app/actions/reports.ts
'use server';

import { inngest } from '@/inngest/client';
import { db } from '@/db';
import { reports } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function cancelReportGeneration(reportId: string) {
  // Verify report exists and is in generating state
  const report = await db.query.reports.findFirst({
    where: eq(reports.id, reportId),
  });

  if (!report) {
    throw new Error('Report not found');
  }

  if (report.status !== 'generating') {
    throw new Error('Report is not currently generating');
  }

  // Send cancellation event to Inngest
  await inngest.send({
    name: 'report/generation.cancelled',
    data: {
      reportId,
    },
  });

  // Revalidate the reports page to show updated status
  revalidatePath('/reports');
}
```

### 4. UI Component with Cancel Button

Implement a cancel button with confirmation dialog:

```typescript
// app/components/ReportCard.tsx
'use client';

import { useState } from 'react';
import { cancelReportGeneration } from '@/app/actions/reports';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ReportCardProps {
  reportId: string;
  status: 'idle' | 'generating' | 'generated' | 'cancelled' | 'failed';
  title: string;
}

export function ReportCard({ reportId, status, title }: ReportCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await cancelReportGeneration(reportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel report');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-gray-600">Status: {status}</p>
        </div>

        {status === 'generating' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isLoading}>
                {isLoading ? 'Cancelling...' : 'Cancel'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Cancel Report Generation?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this report? This action cannot
                be undone.
              </AlertDialogDescription>
              <div className="flex justify-end gap-2">
                <AlertDialogCancel>Keep Generating</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Cancel Report
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
```

## How It Works

### Event Flow

1. **User Action**: User clicks "Cancel" button on a generating report
2. **Server Action**: `cancelReportGeneration` is called with the report ID
3. **Inngest Event**: A `report/generation.cancelled` event is sent with the reportId
4. **Cancellation Matching**: Inngest's `cancelOn` matcher compares `data.reportId` from the event with running function instances
5. **Function Cancellation**: The matching function instance is cancelled
6. **Error Handling**: The function catches the `StepError` with code `CANCELLED`
7. **Database Update**: Report status is updated to `cancelled`
8. **UI Refresh**: Frontend revalidates and shows updated status

### Key Inngest Concepts

- **`cancelOn`**: Configuration option that defines which events can cancel a function and how to match them to instances
- **`match` property**: Specifies the event data path to match against running function context (e.g., `'data.reportId'`)
- **Cancellation Error**: When a function is cancelled, it throws a `StepError` with code `CANCELLED`

## Error Handling

The solution handles three states:

1. **Successful Generation**: Function completes normally, status set to `generated`
2. **Cancellation**: User cancels, function caught by `cancelOn`, status set to `cancelled`
3. **Error**: Any other error during generation, status set to `failed` with error message

## Benefits

- **Better UX**: Users can stop long-running operations instead of waiting
- **Resource Efficiency**: Cancelled operations don't waste compute resources
- **State Consistency**: Database accurately reflects cancellation status
- **Graceful Degradation**: Function can clean up resources before stopping
- **Audit Trail**: Timestamp of cancellation recorded in database

## Testing

To test the cancellation flow:

```typescript
// Test cancelling a report generation
async function testCancellation() {
  // 1. Trigger report generation
  await inngest.send({
    name: 'report/generation.requested',
    data: {
      reportId: 'test-123',
      userId: 'user-456',
    },
  });

  // 2. Wait a moment for function to start
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 3. Send cancellation event
  await inngest.send({
    name: 'report/generation.cancelled',
    data: {
      reportId: 'test-123',
    },
  });

  // 4. Verify status changed to 'cancelled'
  const report = await db.query.reports.findFirst({
    where: eq(reports.id, 'test-123'),
  });

  console.assert(report?.status === 'cancelled');
}
```

## Common Pitfalls

1. **Missing match field**: Without proper `match` configuration, wrong function instances might be cancelled
2. **Status not updated**: Ensure database is updated in the error handler for cancelled functions
3. **User confirmation**: Always show confirmation dialog to prevent accidental cancellations
4. **Not handling StepError**: Must specifically catch `StepError` with code `CANCELLED` to differentiate from other errors

## Related Documentation

- [Inngest Function Cancellation](https://www.inngest.com/docs/functions/cancel)
- [Inngest Event Matching](https://www.inngest.com/docs/functions/event-matching)
- [Long-Running Operations Best Practices](https://www.inngest.com/docs/patterns/long-running)
