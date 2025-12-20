# AN0 Auto-Redirect and Error Handling Improvements

**Problem:** Users were waiting unnecessarily on the AN0 processing screen when no clarification was needed, leading to confusion about whether the system was working.

**Solution:** Implemented intelligent auto-redirect, improved error handling, and consolidated navigation logic to create a smoother user experience.

---

## Table of Contents

1. [The UX Problem](#the-ux-problem)
2. [Auto-Redirect Solution](#auto-redirect-solution)
3. [Failed Report Status Display](#failed-report-status-display)
4. [Inngest onFailure Handler](#inngest-onfailure-handler)
5. [Code Quality Improvements](#code-quality-improvements)
6. [Technical Implementation](#technical-implementation)

---

## The UX Problem

### Original Behavior

Users would submit a design challenge and land on the AN0 processing screen. The system would analyze whether clarification was needed, which took about 60 seconds. However:

1. **If clarification WAS needed**: User would see a clarification form (correct behavior)
2. **If clarification was NOT needed**: User would continue watching the spinner indefinitely, not knowing the system had moved on to the full analysis

This created confusion: "Is the system stuck? Should I refresh? Is my report being generated?"

### Root Cause

The processing screen didn't detect when AN0 completed WITHOUT requesting clarification. The screen only handled three states:
- Processing at AN0
- Clarification needed (transition to clarifying status)
- Complete (final state)

There was no logic to handle the fourth state: **AN0 complete, no clarification needed, proceeding to analysis**.

---

## Auto-Redirect Solution

### Implementation

**File:** `apps/web/app/home/(user)/_components/processing-screen.tsx`

The solution detects when the report has moved past AN0 without needing clarification and automatically redirects to the dashboard.

```typescript
// Consolidated navigation effect - prevents race condition between two effects
useEffect(() => {
  if (hasNavigatedRef.current) return;

  // Priority 1: Report complete - navigate to report
  if (progress.status === 'complete' && onComplete) {
    hasNavigatedRef.current = true;
    onComplete();
    return;
  }

  // Priority 2: AN0 bypass - redirect to dashboard when no clarification needed
  const movedPastAN0 =
    progress.status === 'processing' &&
    progress.currentStep !== 'an0' &&
    progress.currentStep !== null;
  const noClarificationNeeded =
    movedPastAN0 && progress.clarifications?.length === 0;

  if (noClarificationNeeded) {
    hasNavigatedRef.current = true;
    router.push('/home');
  }
}, [
  progress.status,
  progress.currentStep,
  progress.clarifications,
  onComplete,
  router,
]);
```

### Detection Logic

**Condition 1: Moved Past AN0**
```typescript
const movedPastAN0 =
  progress.status === 'processing' &&
  progress.currentStep !== 'an0' &&
  progress.currentStep !== null;
```

This detects that:
- Report is still processing (not complete or failed)
- Current step is no longer 'an0' (e.g., 'an1', 'an2', etc.)
- Current step has been set (not null)

**Condition 2: No Clarification Needed**
```typescript
const noClarificationNeeded =
  movedPastAN0 && progress.clarifications?.length === 0;
```

This confirms:
- System has moved past AN0
- No clarifications were requested (empty or undefined clarifications array)

When both conditions are met, the user is redirected to `/home` where they'll see their report in "Processing" state with live elapsed time.

### Navigation Safety

A `hasNavigatedRef` is used to prevent duplicate navigation calls:

```typescript
const hasNavigatedRef = useRef(false);

// Before any navigation
if (hasNavigatedRef.current) return;

// When navigating
hasNavigatedRef.current = true;
router.push('/home');
```

This prevents race conditions where multiple navigation triggers could fire simultaneously.

---

## Failed Report Status Display

### Dashboard Integration

**File:** `apps/web/app/home/(user)/_components/reports-dashboard.tsx`

Failed reports now display prominently on the dashboard with actionable error messages and a "New Analysis" button.

```typescript
if (isFailed) {
  // Failed state - red theme, shows error and retry button
  return (
    <div
      key={report.id}
      data-test={`report-card-${report.id}`}
      className={cn(
        'relative block cursor-default bg-red-500/5 p-5 dark:bg-red-900/10',
        !isLast && 'border-b border-[--border-subtle]',
      )}
    >
      <div className="flex items-start gap-4">
        {/* Status Dot (Red) */}
        <div className="mt-1.5 flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-red-500" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3
            className="truncate pr-8 text-sm font-medium text-[--text-secondary] opacity-90"
            style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
          >
            {displayTitle}
          </h3>
          <div className="mt-2 flex items-center gap-3">
            <span
              className="font-mono text-xs tracking-wider text-red-600 uppercase dark:text-red-400"
              style={{
                fontFamily: 'Soehne Mono, JetBrains Mono, monospace',
              }}
            >
              Failed
            </span>
          </div>
          <p className="mt-2 text-sm text-[--text-muted]">
            {report.error_message ||
              'Your report failed. Please submit a new analysis request and contact support for help if it happens repeatedly.'}
          </p>
        </div>

        {/* Retry Button */}
        <div className="flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/home/reports/new')}
            className="gap-1.5"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            New Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Visual Design

Failed reports feature:
- **Red background** (`bg-red-500/5` light, `bg-red-900/10` dark)
- **Red status dot** (solid, non-animated)
- **"FAILED" badge** in monospace font
- **Error message** from database or default fallback
- **Action button** to create new analysis

This matches the design pattern for processing reports (purple theme) and complete reports (green theme).

---

## Inngest onFailure Handler

### Pattern Implementation

**File:** `apps/web/lib/inngest/functions/generate-report.ts`

The Inngest function now includes a proper `onFailure` handler that updates the database when report generation fails.

```typescript
export const generateReport = inngest.createFunction(
  {
    id: 'generate-report',
    retries: 2,
    onFailure: async ({ error, event, step }) => {
      // Type assertion for failure event which wraps the original event
      const failureEvent = event as unknown as {
        event: { data: { reportId: string } };
      };
      const reportId = failureEvent.event.data.reportId;

      console.error('Report generation failed:', {
        reportId,
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      });

      await step.run('update-failed-status', async () => {
        const supabase = getSupabaseServerAdminClient();
        await supabase
          .from('sparlo_reports')
          .update({
            status: 'failed',
            error_message:
              'Your report failed. Please submit a new analysis request and contact support for help if it happens repeatedly.',
            updated_at: new Date().toISOString(),
          })
          .eq('id', reportId);
      });
    },
  },
  { event: 'report/generate' },
  async ({ event, step }) => {
    // ... function implementation
  },
);
```

### Key Features

1. **Type Assertion**: Inngest wraps the original event in a failure event structure, requiring type assertion to access the original data:
   ```typescript
   const failureEvent = event as unknown as {
     event: { data: { reportId: string } };
   };
   const reportId = failureEvent.event.data.reportId;
   ```

2. **Structured Logging**: Errors are logged with reportId and stack trace (in development):
   ```typescript
   console.error('Report generation failed:', {
     reportId,
     error: error.message,
     ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
   });
   ```

3. **Database Update**: Uses Inngest's `step.run` to ensure idempotent database updates:
   ```typescript
   await step.run('update-failed-status', async () => {
     // Update database
   });
   ```

4. **User-Friendly Error**: Provides actionable guidance instead of technical error details:
   ```typescript
   error_message: 'Your report failed. Please submit a new analysis request and contact support for help if it happens repeatedly.'
   ```

### Error Flow

```
Report Generation Error
  ↓
Inngest Retry (2 attempts)
  ↓
All Retries Failed
  ↓
onFailure Handler Triggered
  ↓
Database Updated (status: 'failed')
  ↓
User Sees Failed Report on Dashboard
```

---

## Code Quality Improvements

### 1. Consolidated Navigation Effects

**Problem:** Two separate `useEffect` hooks handled navigation, creating potential race conditions.

**Before:**
```typescript
// Effect 1: Handle report completion
useEffect(() => {
  if (progress.status === 'complete' && onComplete) {
    onComplete();
  }
}, [progress.status, onComplete]);

// Effect 2: Handle AN0 bypass
useEffect(() => {
  // Redirect logic
}, [progress.currentStep]);
```

**After:**
```typescript
// Single consolidated effect with priority system
useEffect(() => {
  if (hasNavigatedRef.current) return;

  // Priority 1: Report complete
  if (progress.status === 'complete' && onComplete) {
    hasNavigatedRef.current = true;
    onComplete();
    return;
  }

  // Priority 2: AN0 bypass
  const movedPastAN0 = /* ... */;
  const noClarificationNeeded = /* ... */;

  if (noClarificationNeeded) {
    hasNavigatedRef.current = true;
    router.push('/home');
  }
}, [progress.status, progress.currentStep, progress.clarifications, onComplete, router]);
```

**Benefits:**
- Single source of truth for navigation logic
- Clear priority ordering
- Prevents duplicate navigation calls
- Easier to reason about and maintain

### 2. Shared Elapsed Time Utility

**File:** `apps/web/app/home/(user)/_lib/utils/elapsed-time.ts`

Created shared utilities for elapsed time calculation and formatting, used by both the processing screen and dashboard.

```typescript
/**
 * Calculate elapsed seconds from a timestamp string.
 */
export function calculateElapsed(createdAt: string | null): number {
  if (!createdAt) return 0;
  const startTime = new Date(createdAt).getTime();
  if (isNaN(startTime)) return 0;
  return Math.max(0, Math.floor((Date.now() - startTime) / 1000));
}

/**
 * Format elapsed seconds as M:SS
 * Note: Hour format intentionally omitted - reports typically take ~15 minutes.
 * Add hour support when needed (YAGNI).
 */
export function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Hook to calculate elapsed time from a timestamp.
 * Updates every second. Persists correctly across page refresh.
 */
export function useElapsedTime(createdAt: string | null): number {
  const [elapsed, setElapsed] = useState(() => calculateElapsed(createdAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(calculateElapsed(createdAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return elapsed;
}
```

**Usage in Dashboard:**
```typescript
function ElapsedTime({ createdAt }: { createdAt: string }) {
  const elapsed = useElapsedTime(createdAt);

  return (
    <span className="font-mono text-xs text-violet-600 tabular-nums">
      {formatElapsed(elapsed)}
    </span>
  );
}
```

**Benefits:**
- DRY principle: no duplicated time logic
- Consistent formatting across the app
- Database-based timestamps persist across page refreshes
- Well-documented with YAGNI principle noted

### 3. Error Pattern Constants

**File:** `apps/web/app/home/(user)/_lib/utils/error-constants.ts`

Centralized error pattern detection to avoid brittle string matching throughout the codebase.

```typescript
/**
 * Centralized error pattern constants.
 * Used for error type detection to avoid brittle string matching.
 */
export const ERROR_PATTERNS = {
  /** Error message indicating AI refused to process the query */
  REFUSAL: 'could not be processed',
} as const;
```

**Usage in Processing Screen:**
```typescript
const isRefusalError = progress.errorMessage?.includes(ERROR_PATTERNS.REFUSAL);

if (isRefusalError) {
  return (
    // Special UI for refusal errors with guidance
  );
}
```

**Benefits:**
- Single source of truth for error patterns
- Easy to update error detection logic
- Type-safe with TypeScript
- Self-documenting with JSDoc comments

---

## Technical Implementation

### State Flow Diagram

```
User Submits Challenge
  ↓
Processing Screen (AN0)
  ↓
┌─────────────────────────────────────┐
│   AN0 Analysis Complete             │
│                                     │
│   ┌─────────────┐  ┌──────────────┐│
│   │Clarification│  │No Clarification│
│   │   Needed    │  │    Needed     ││
│   └──────┬──────┘  └──────┬────────┘│
│          │                │         │
│          ↓                ↓         │
│   Show Question      Auto-redirect  │
│   Form              to Dashboard    │
└─────────┬───────────────────────────┘
          │
          ↓
  Dashboard (Processing State)
```

### Database Schema Changes

No database schema changes were required. The solution leverages existing fields:

```sql
-- Existing schema (no changes)
sparlo_reports (
  id UUID PRIMARY KEY,
  status TEXT, -- 'processing' | 'clarifying' | 'complete' | 'failed'
  current_step TEXT, -- 'an0' | 'an1' | 'an2' | ... | null
  clarifications JSONB, -- Array of { question, answer, askedAt, answeredAt }
  error_message TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Progress Detection Logic

The system detects progress transitions by monitoring `current_step`:

| `current_step` | `status` | `clarifications` | User Sees |
|----------------|----------|------------------|-----------|
| `'an0'` | `'processing'` | `undefined` | AN0 spinner |
| `null` | `'clarifying'` | `[{ question, ... }]` | Clarification form |
| `'an1'` | `'processing'` | `[]` | Dashboard (auto-redirect) |
| `'an2'` | `'processing'` | `[]` | Dashboard |
| `null` | `'complete'` | `[]` | Report view |
| `null` | `'failed'` | `[]` | Dashboard (failed card) |

### Performance Considerations

1. **useRef for Navigation**: Prevents redundant navigation calls and React state updates
2. **Single useEffect**: Consolidating navigation logic reduces effect overhead
3. **Shared Utilities**: Elapsed time logic is reused without duplication
4. **Database Timestamps**: Using `created_at` from database ensures consistency across page refreshes

---

## Related Files

### Modified
- `/apps/web/app/home/(user)/_components/processing-screen.tsx` - Auto-redirect logic
- `/apps/web/app/home/(user)/_components/reports-dashboard.tsx` - Failed state display
- `/apps/web/lib/inngest/functions/generate-report.ts` - onFailure handler

### Created
- `/apps/web/app/home/(user)/_lib/utils/elapsed-time.ts` - Shared time utilities
- `/apps/web/app/home/(user)/_lib/utils/error-constants.ts` - Error pattern constants

---

## Testing Checklist

- [ ] User submits challenge requiring clarification → sees clarification form
- [ ] User submits challenge NOT requiring clarification → auto-redirected to dashboard
- [ ] Processing report shows live elapsed time on dashboard
- [ ] Failed report shows error message and retry button
- [ ] Page refresh maintains correct elapsed time
- [ ] No duplicate navigation calls (check React DevTools)
- [ ] Error patterns correctly detect refusal errors
- [ ] Inngest onFailure handler updates database on failure

---

## Future Improvements

1. **Real-time Progress Updates**: Add Supabase subscriptions to show live step transitions
2. **Progress Bar**: Visual indicator showing which step (AN0 → AN5) is currently running
3. **Estimated Time Remaining**: Machine learning model to predict completion time based on challenge complexity
4. **Error Recovery**: Automatic retry with adjusted parameters for certain error types
5. **Notification System**: Email/push notifications when long-running reports complete

---

## Conclusion

This solution transformed a confusing "waiting screen" into an intelligent system that:
- Automatically redirects users when appropriate
- Shows clear status for all report states
- Handles errors gracefully with actionable messages
- Maintains code quality with shared utilities and consolidated logic

The improvements create a smoother user experience while maintaining clean, maintainable code architecture.
