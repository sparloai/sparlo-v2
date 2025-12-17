# Fix: Design Challenge Waiting Screen Not Updating

## Summary

The design challenge submission flow breaks after submitting a problem. The waiting screen appears but never updates with progress and never navigates to the report when Inngest completes.

**Root Causes Identified:**

1. **Missing auto-navigation** - `ProcessingScreen` shows "View Full Report" button on completion but doesn't auto-navigate
2. **No elapsed time display** - Requirement specifies showing time elapsed, but it's not implemented

## Acceptance Criteria

- [ ] Waiting screen shows elapsed time (MM:SS format)
- [ ] When status changes to `complete`, auto-navigate to report page
- [ ] User can leave and return to `/home/reports/[id]` - page reconnects to realtime
- [ ] Inngest flow continues in background regardless of user navigation
- [ ] Clarification questions display and submit correctly (existing - verify works)

## Simplified Approach (Post-Review)

After reviews from DHH, Kieran, and Simplicity reviewers, this plan has been simplified:

- **2 files changed** (down from 5)
- **~30 lines of code** (down from ~140)
- **No interface changes** - use client-side timestamp for elapsed time
- **Single source of truth** - auto-navigation logic in ProcessingScreen only
- **Phase 5 removed** - dashboard banner is scope creep

## Technical Analysis

### Current Flow

```
User submits → startReportGeneration() → Creates report (status: 'processing')
                                       → Triggers Inngest event
                                       → Returns reportId

Page sets phase='processing', reportId=X
↓
useReportProgress(reportId) subscribes to Supabase Realtime
↓
ProcessingScreen displays progress
↓
When status='complete' → Shows "View Full Report" button (REQUIRES CLICK)
```

### Bugs

1. **`new/page.tsx:63-67`** - `handleViewReport` is passed to `ProcessingScreen` but only called when user clicks button. No auto-navigation.

2. **`processing-screen.tsx:60-114`** - Complete status shows button, doesn't call `onComplete` automatically.

3. **`reports/[id]/page.tsx:64-67`** - Server component checks status, but if status is still `processing`, it passes `isProcessing` but `ReportDisplay` starts realtime subscription. However, if user refreshes when status is `processing`, it works. But the **realtime callback doesn't trigger navigation** - it just updates `progress` state.

4. **`report-display.tsx:231-233`** - Shows `ProcessingScreen` when `isProcessing && progress`, but doesn't handle `onComplete` callback for navigation/refetch.

5. **No elapsed time** - Neither `ProcessingScreen` nor the new report page shows elapsed time.

## Implementation Plan

### Phase 1: Fix Auto-Navigation on Completion

**File: `apps/web/app/home/(user)/reports/new/page.tsx`**

Add `useEffect` to watch `progress.status` and auto-navigate when complete:

```typescript
// Add after line 30
useEffect(() => {
  if (progress?.status === 'complete' && reportId) {
    router.push(`/home/reports/${reportId}`);
  }
}, [progress?.status, reportId, router]);
```

**File: `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx`**

Add auto-reload when status changes to complete:

```typescript
// Add after line 94
const router = useRouter();

useEffect(() => {
  if (isProcessing && progress?.status === 'complete') {
    // Refresh the page to get updated server data
    router.refresh();
  }
}, [isProcessing, progress?.status, router]);
```

### Phase 2: Add Elapsed Time Display

**File: `apps/web/app/home/(user)/_components/processing-screen.tsx`**

Add elapsed time state and interval:

```typescript
// Add prop for startTime
interface ProcessingScreenProps {
  progress: ReportProgress;
  onComplete?: () => void;
  startTime?: string; // ISO timestamp
}

// Add inside component
const [elapsedTime, setElapsedTime] = useState(0);

useEffect(() => {
  const startTimestamp = startTime ? new Date(startTime).getTime() : Date.now();

  const interval = setInterval(() => {
    setElapsedTime(Math.floor((Date.now() - startTimestamp) / 1000));
  }, 1000);

  return () => clearInterval(interval);
}, [startTime]);

// Format helper
const formatElapsed = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Add to UI (around line 272)
<p className="text-center text-sm text-[#8A8A8A]">
  {formatElapsed(elapsedTime)} elapsed
</p>
```

**File: `apps/web/app/home/(user)/_lib/use-report-progress.ts`**

Add `createdAt` to `ReportProgress` interface and fetch:

```typescript
// Line 21-30 - Add createdAt
export interface ReportProgress {
  // ... existing fields
  createdAt: string;
}

// Line 76 - Add created_at to select
.select('id, status, current_step, phase_progress, title, clarifications, report_data, last_message, created_at')

// Line 88-98 - Add to setProgress
setProgress({
  // ... existing fields
  createdAt: data.created_at,
});
```

### Phase 3: Update Page Components to Pass Start Time

**File: `apps/web/app/home/(user)/reports/new/page.tsx`**

Pass `startTime` to ProcessingScreen:

```typescript
// Line 70-76
if (phase === 'processing' && progress) {
  return (
    <div className="min-h-[calc(100vh-120px)]">
      <ProcessingScreen
        progress={progress}
        onComplete={handleViewReport}
        startTime={progress.createdAt}
      />
    </div>
  );
}
```

**File: `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx`**

Pass `startTime` to ProcessingScreen:

```typescript
// Line 231-233
if (isProcessing && progress) {
  return (
    <ProcessingScreen
      progress={progress}
      startTime={report.created_at}
    />
  );
}
```

### Phase 4: Handle User Return Flow

The current architecture already handles this well:
- Report ID is in URL (`/home/reports/[id]`)
- Server component loads report state on page load
- Client component (`ReportDisplay`) subscribes to realtime if `isProcessing`
- User can bookmark URL and return anytime

**Verify:** When user navigates away during processing:
1. Inngest continues (server-side, decoupled from frontend)
2. Database updates happen via Inngest
3. User returns to `/home/reports/[id]` → server loads current state
4. If still processing, realtime subscription resumes
5. If complete, report displays immediately

### Phase 5: Add Resume Banner to Dashboard (Nice-to-have)

**File: `apps/web/app/home/(user)/page.tsx`**

Add query for in-progress reports and show banner:

```typescript
// In loader
const inProgressReport = await client
  .from('sparlo_reports')
  .select('id, title, created_at')
  .in('status', ['processing', 'clarifying'])
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

// In component, show banner if exists
{inProgressReport && (
  <Link href={`/home/reports/${inProgressReport.id}`}>
    <div className="mb-6 rounded-lg bg-[#7C3AED]/10 p-4">
      <p className="text-sm font-medium text-[#7C3AED]">
        Report in progress: {inProgressReport.title}
      </p>
    </div>
  </Link>
)}
```

## File Changes Summary

| File | Changes |
|------|---------|
| `apps/web/app/home/(user)/reports/new/page.tsx` | Add auto-navigation useEffect, pass startTime |
| `apps/web/app/home/(user)/_components/processing-screen.tsx` | Add elapsed time display |
| `apps/web/app/home/(user)/_lib/use-report-progress.ts` | Add createdAt to interface and fetch |
| `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx` | Add auto-refresh on completion, pass startTime |
| `apps/web/app/home/(user)/page.tsx` | (Optional) Add in-progress banner |

## Testing Plan

1. **Submit new problem**
   - Verify waiting screen shows elapsed time
   - Verify progress updates appear in real-time
   - Wait for completion → verify auto-navigation to report

2. **Navigate away during processing**
   - Submit problem, go to dashboard
   - Verify Inngest continues (check Inngest dashboard)
   - Return to `/home/reports/[id]` → verify realtime reconnects
   - Wait for completion → verify auto-refresh shows report

3. **Refresh during processing**
   - Submit problem, refresh page during processing
   - Verify page reconnects and shows current progress
   - Verify elapsed time is accurate (based on `created_at`)

4. **Clarification flow**
   - Submit problem that triggers clarification
   - Verify clarification question displays
   - Submit answer
   - Verify processing resumes
   - Verify auto-navigation on completion

5. **Error handling**
   - Trigger error in Inngest (if possible)
   - Verify error status displays correctly
   - Verify user can retry or navigate away

## References

- `apps/web/app/home/(user)/reports/new/page.tsx` - New report page with submission
- `apps/web/app/home/(user)/_components/processing-screen.tsx` - Processing UI component
- `apps/web/app/home/(user)/_lib/use-report-progress.ts` - Realtime subscription hook
- `apps/web/lib/inngest/functions/generate-report.ts` - Inngest function (updates DB)
- `apps/web/app/home/(user)/reports/[id]/page.tsx` - Report detail page (server)
- `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx` - Report display (client)
