# feat: Feed Error Messages to Users When Reports Fail

## Overview

When Inngest report processing fails, update report status to 'failed' with an error message instead of leaving it stuck at 'processing'.

## Problem

- `generate-discovery-report.ts` and `generate-hybrid-report.ts` lack `onFailure` handlers
- Failed reports stay stuck in 'processing' status indefinitely
- Users don't know their report failed

## Solution

Add `onFailure` handlers to both functions using a shared utility.

## Implementation

### File 1: Create shared handler

**`apps/web/lib/inngest/utils/report-failure-handler.ts`**

```typescript
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

export async function handleReportFailure(
  reportId: string,
  error: Error,
  step: any
) {
  console.error('Report generation failed:', {
    reportId,
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });

  await step.run('update-failed-status', async () => {
    const supabase = getSupabaseServerAdminClient();
    const { error: updateError } = await supabase
      .from('sparlo_reports')
      .update({
        status: 'failed',
        error_message:
          'Your report failed. Please submit a new analysis request and contact support if it happens repeatedly.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .eq('status', 'processing'); // Prevent race condition with cancellation

    if (updateError) {
      console.error('[onFailure] Failed to update report status:', {
        reportId,
        updateError,
      });
    }
  });
}
```

### File 2: Update generate-discovery-report.ts

Add import and `onFailure` handler to function config.

### File 3: Update generate-hybrid-report.ts

Add import and `onFailure` handler to function config.

### File 4: Refactor generate-report.ts

Replace existing `onFailure` handler with shared utility for consistency.

## Acceptance Criteria

- [ ] Failed discovery reports show status 'failed' with error message
- [ ] Failed hybrid reports show status 'failed' with error message
- [ ] Database errors in onFailure are logged (not silent)
- [ ] Race condition prevented: won't overwrite 'cancelled' status
