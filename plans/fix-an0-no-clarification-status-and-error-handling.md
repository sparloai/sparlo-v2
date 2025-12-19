# fix: AN0 Clarification Check UX, Dashboard Processing State, and Error Handling

## Overview

Improve the engineering challenge submission UX by:
1. Showing a brief "analyzing for clarification" waiting state during AN0
2. Redirecting to dashboard when no clarification is needed (let user do other things)
3. Adding time elapsed counter on dashboard for processing reports
4. Properly handling Inngest failures with error messages

**Type:** Bug Fix + UX Improvement
**Priority:** High

## Problem Statement

Current issues:
1. User stares at generic "processing" spinner for entire report generation (~3-5 min)
2. No indication whether clarification will be needed
3. When AN0 decides no clarification needed, user still watches the spinner
4. Inngest failures don't update the UI properly

## Proposed Solution

### New User Flow

```
Submit Challenge
    ↓
"Analyzing your problem to see if clarification is needed..." (AN0 running)
    ↓
┌─────────────────────────────────────────────────────┐
│ AN0 needs clarification?                            │
├─────────────────────────────────────────────────────┤
│ YES → Show clarification question                   │
│       User answers → Continue processing on screen  │
├─────────────────────────────────────────────────────┤
│ NO  → Redirect to /home dashboard                   │
│       Dashboard shows report with elapsed timer     │
│       User can do other things while it processes   │
└─────────────────────────────────────────────────────┘
    ↓
Report completes → User clicks to view from dashboard
```

### Key Changes

1. **AN0 Waiting State**: New UI for the ~30-60 second AN0 phase with psychological "almost ready" messaging
2. **Smart Redirect**: When AN0 completes without needing clarification, redirect to dashboard
3. **Dashboard Timer**: Show elapsed time for processing reports so user knows it's working
4. **Error Handling**: Add Inngest `onFailure` handler to update status to 'failed'

## Acceptance Criteria

- [ ] During AN0, show "Analyzing your problem to see if clarification is needed..." with engaging waiting UI
- [ ] When AN0 completes without needing clarification, redirect to `/home` dashboard
- [ ] Dashboard shows time elapsed (e.g., "Processing • 2:34") for reports in 'processing' state
- [ ] When Inngest fails, status becomes 'failed' with error message
- [ ] Failed reports show error message and "Submit New Request" option

## Technical Implementation

### 1. Update Processing Screen - AN0 Waiting State

**File:** `apps/web/app/home/(user)/_components/processing-screen.tsx`

Add a distinct UI for the AN0 phase that psychologically prepares user to wait:

```tsx
// Detect AN0 phase
const isAnalyzingForClarification =
  progress?.status === 'processing' &&
  progress?.currentStep === 'an0';

// Detect clarification phase (already exists)
const needsClarification =
  progress?.status === 'awaiting_input' &&
  progress?.clarifications?.length > 0;

// Detect post-AN0 processing (user answered or no clarification needed)
const isProcessingReport =
  progress?.status === 'processing' &&
  progress?.currentStep !== 'an0';

{isAnalyzingForClarification && (
  <div className="space-y-6 text-center max-w-md mx-auto">
    {/* Animated analyzing indicator */}
    <div className="relative w-20 h-20 mx-auto">
      <div className="absolute inset-0 rounded-full border-4 border-muted" />
      <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
      <Brain className="absolute inset-0 m-auto w-8 h-8 text-primary" />
    </div>

    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Analyzing Your Problem</h3>
      <p className="text-muted-foreground">
        We're reviewing your challenge to see if we need any clarification before proceeding.
      </p>
    </div>

    {/* Progress hints that set expectations */}
    <div className="text-sm text-muted-foreground space-y-1">
      <p>This usually takes about a minute.</p>
      <p className="text-xs opacity-70">
        We'll either ask a clarifying question or start the full analysis.
      </p>
    </div>
  </div>
)}
```

### 2. Redirect to Dashboard When No Clarification Needed

**File:** `apps/web/app/home/(user)/_components/processing-screen.tsx`

When AN0 completes and moves to AN1 (no clarification needed), redirect to dashboard:

```tsx
const router = useRouter();
const hasRedirectedRef = useRef(false);

useEffect(() => {
  // When AN0 completes without needing clarification, redirect to dashboard
  const movedPastAN0 =
    progress?.status === 'processing' &&
    progress?.currentStep !== 'an0' &&
    progress?.currentStep !== null;

  // Only redirect if we haven't already and there's no pending clarification
  const noClarificationNeeded =
    movedPastAN0 &&
    (progress?.clarifications?.length === 0);

  if (noClarificationNeeded && !hasRedirectedRef.current) {
    hasRedirectedRef.current = true;
    router.push('/home');
  }
}, [progress?.status, progress?.currentStep, progress?.clarifications, router]);
```

### 3. Dashboard - Reports List with Elapsed Timer

**File:** `apps/web/app/home/(user)/_components/reports-list.tsx` (or wherever reports are listed)

Add elapsed time display for processing reports:

```tsx
// Hook to calculate elapsed time
function useElapsedTime(createdAt: string | null, isActive: boolean) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!createdAt || !isActive) {
      setElapsed('');
      return;
    }

    const start = new Date(createdAt).getTime();

    const updateElapsed = () => {
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setElapsed(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [createdAt, isActive]);

  return elapsed;
}

// In the report list item component
function ReportListItem({ report }: { report: Report }) {
  const isProcessing = report.status === 'processing';
  const elapsed = useElapsedTime(report.createdAt, isProcessing);

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <h4 className="font-medium">{report.title || 'New Report'}</h4>
        {isProcessing ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Processing</span>
            {elapsed && (
              <span className="font-mono text-xs">• {elapsed}</span>
            )}
          </div>
        ) : report.status === 'failed' ? (
          <span className="text-sm text-red-500">Failed</span>
        ) : (
          <span className="text-sm text-muted-foreground">
            {formatDate(report.createdAt)}
          </span>
        )}
      </div>

      {isProcessing ? (
        <Badge variant="secondary">In Progress</Badge>
      ) : report.status === 'failed' ? (
        <Button variant="outline" size="sm" asChild>
          <Link href="/home/reports/new">Retry</Link>
        </Button>
      ) : (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/home/reports/${report.id}`}>View</Link>
        </Button>
      )}
    </div>
  );
}
```

### 4. Inngest onFailure Handler

**File:** `apps/web/lib/inngest/functions/generate-report.ts`

Add failure handler to update status when processing fails:

```typescript
export const generateReport = inngest.createFunction(
  {
    id: 'generate-report',
    retries: 2,
    onFailure: async ({ error, event, step }) => {
      const { reportId } = event.data;

      console.error('Report generation failed:', {
        reportId,
        error: error.message,
        stack: error.stack,
      });

      await step.run('update-failed-status', async () => {
        const supabase = getSupabaseServerAdminClient();
        const { error: updateError } = await supabase
          .from('sparlo_reports')
          .update({
            status: 'failed',
            error_message: 'Your report failed. Please submit a new analysis request and contact support for help if it happens repeatedly.',
            updated_at: new Date().toISOString(),
          })
          .eq('id', reportId);

        if (updateError) {
          console.error('Failed to update report status:', updateError);
        }
      });
    },
  },
  { event: 'report/generate' },
  async ({ event, step }) => {
    // ... existing implementation
  }
);
```

### 5. Dashboard - Failed Report Display

Show failed reports with helpful error message:

```tsx
{report.status === 'failed' && (
  <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 rounded-lg">
    <div className="flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-medium text-red-700 dark:text-red-400">
          Report Generation Failed
        </h4>
        <p className="text-sm text-red-600 dark:text-red-300 mt-1">
          {report.errorMessage || 'Your report failed. Please submit a new analysis request and contact support for help if it happens repeatedly.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          asChild
        >
          <Link href="/home/reports/new">Submit New Request</Link>
        </Button>
      </div>
    </div>
  </div>
)}
```

## Files to Modify

1. **`apps/web/app/home/(user)/_components/processing-screen.tsx`**
   - Add AN0 "analyzing for clarification" UI
   - Add redirect to dashboard when no clarification needed

2. **`apps/web/app/home/(user)/_components/reports-list.tsx`** (or equivalent)
   - Add `useElapsedTime` hook
   - Show elapsed timer for processing reports
   - Show failed state with error message

3. **`apps/web/lib/inngest/functions/generate-report.ts`**
   - Add `onFailure` handler

## No Database Changes Required

This implementation uses existing fields:
- `status`: 'processing' | 'awaiting_input' | 'complete' | 'failed'
- `current_step`: 'an0' | 'an1' | ... | 'complete'
- `clarifications`: array of clarification questions
- `error_message`: string for failure details
- `created_at`: timestamp for elapsed time calculation

## References

### Internal
- Processing screen: `apps/web/app/home/(user)/_components/processing-screen.tsx`
- Inngest function: `apps/web/lib/inngest/functions/generate-report.ts`
- Realtime hook: `apps/web/app/home/(user)/_lib/use-report-progress.ts`

### External
- Inngest onFailure: https://www.inngest.com/docs/features/inngest-functions/error-retries/failure-handlers
