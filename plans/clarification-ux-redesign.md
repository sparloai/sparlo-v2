# feat: Clarification Question UX Redesign (Simplified)

## Overview

Simplify the analysis waiting UX to show elapsed time only and ensure the clarification flow works reliably with Inngest + Supabase.

## Problem Statement

**UX Issues:**
1. Waiting screen shows confusing technical details (AN0, AN1, percentages)
2. Users don't know they can leave during 15-minute analysis
3. Clarification questions appear unexpectedly

**Technical Issues (from v1):**
1. In-memory Python state was lost on restart → **Fixed in v2 with Inngest durable execution**
2. Schema validation failed on `null` vs `undefined` → **Fixed with `.nullish()`**
3. Race conditions between report creation and workflow → **Fixed with atomic Inngest events**

## Solution

### What Users See

**During Analysis:**
```
┌─────────────────────────────────────────┐
│                                         │
│              ◆ (rotating)               │
│                                         │
│      Analyzing your question...         │
│              4:32 elapsed               │
│                                         │
│   Analyses typically take ~15 minutes   │
│                                         │
│   ✓ Safe to close this page             │
│   We'll email you when complete.        │
│                                         │
└─────────────────────────────────────────┘
```

**If Clarification Needed:**
```
┌─────────────────────────────────────────┐
│                                         │
│         One quick question              │
│                                         │
│   "[Question from AN0]"                 │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  [Your answer...]               │   │
│   └─────────────────────────────────┘   │
│                                         │
│   [Skip]              [Continue →]      │
│                                         │
└─────────────────────────────────────────┘
```

**What's REMOVED:**
- ❌ Stage indicators (AN0, AN1, AN2...)
- ❌ Percentage progress
- ❌ Progress bars
- ❌ Phase labels that rotate

## Technical Approach

### How Clarification Works (Inngest + Supabase)

```
User submits question
        ↓
┌─────────────────────────────────────────────────────────────┐
│  Inngest Workflow: generate-report                          │
│                                                             │
│  1. step.run('an0') → Claude analyzes question              │
│     ↓                                                       │
│  2. IF an0Result.need_question === true:                    │
│     - updateProgress({ status: 'clarifying' })              │
│     - step.waitForEvent('report/clarification-answered')    │
│       ↓ (PAUSES - survives restarts)                        │
│                                                             │
│  [User sees clarification UI, submits answer]               │
│                                                             │
│  3. answerClarification() server action:                    │
│     - Updates Supabase clarifications array                 │
│     - Sets status back to 'processing'                      │
│     - inngest.send('report/clarification-answered')         │
│       ↓ (RESUMES workflow)                                  │
│                                                             │
│  4. step.run('an0-with-clarification') → Re-analyzes        │
│  5. Continue AN1 → AN2 → AN3 → AN4 → AN5                    │
│  6. updateProgress({ status: 'complete', report_data })     │
└─────────────────────────────────────────────────────────────┘
        ↓
Frontend: useReportProgress() receives realtime update
        ↓
User sees completed report
```

**Key files:**
- Inngest workflow: `apps/web/lib/inngest/functions/generate-report.ts:95-192`
- Answer submission: `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts:391-458`
- Event matching: `step.waitForEvent()` matches on `data.reportId`

### Single Component Refactor

**File:** `apps/web/app/home/(user)/_components/processing-screen.tsx`

Keep single component, refactor internally:

```typescript
export function ProcessingScreen({ progress }: ProcessingScreenProps) {
  // FIX: Calculate elapsed from database timestamp, not Date.now()
  const elapsedSeconds = useElapsedTime(progress.created_at);

  // Derive UI state from database status
  const needsClarification = progress.status === 'clarifying' &&
    progress.clarifications?.some(c => !c.answer);

  if (needsClarification) {
    const pendingQuestion = progress.clarifications.find(c => !c.answer);
    return (
      <ClarificationView
        reportId={progress.id}
        question={pendingQuestion.question}
        onSubmit={handleSubmitClarification}
        onSkip={handleSkip}
      />
    );
  }

  if (progress.status === 'complete') {
    return <CompleteView />;
  }

  if (progress.status === 'error') {
    return <ErrorView error={progress.errorMessage} />;
  }

  // Default: processing or analyzing
  return (
    <ProcessingView
      elapsedSeconds={elapsedSeconds}
    />
  );
}

// Internal components (NOT separate files)
function ProcessingView({ elapsedSeconds }: { elapsedSeconds: number }) {
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <RotatingDiamond />
      <p className="text-lg font-light">Analyzing your question...</p>
      <p className="text-sm tabular-nums text-muted-foreground">
        {formatElapsed(elapsedSeconds)} elapsed
      </p>
      <p className="text-sm text-muted-foreground">
        Analyses typically take ~15 minutes
      </p>
      <div className="mt-4 text-sm text-muted-foreground">
        <p>✓ Safe to close this page</p>
        <p>We'll email you when complete.</p>
      </div>
    </div>
  );
}

function ClarificationView({ reportId, question, onSubmit, onSkip }) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-light mb-4">One quick question</h2>
      <p className="text-muted-foreground mb-4">{question}</p>
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Your answer..."
        disabled={isSubmitting}
      />
      <div className="flex justify-between mt-4">
        <Button variant="ghost" onClick={onSkip} disabled={isSubmitting}>
          Skip
        </Button>
        <Button
          onClick={() => onSubmit(answer)}
          disabled={!answer.trim() || isSubmitting}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
```

### Critical Bug Fix: Timer Persistence

**Current bug:** Timer resets to 0:00 on page refresh because it uses `Date.now()` on mount.

**Fix:**

```typescript
// apps/web/app/home/(user)/_components/processing-screen.tsx

function useElapsedTime(createdAt: string | null): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!createdAt) return;

    const startTime = new Date(createdAt).getTime();

    // Calculate initial elapsed immediately
    setElapsed(Math.floor((Date.now() - startTime) / 1000));

    // Update every second
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  return elapsed;
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

### Clarification Submission Flow

The server action already works correctly. Key points:

```typescript
// apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts

export const answerClarification = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();

    // 1. Get current report
    const { data: report } = await client
      .from('sparlo_reports')
      .select('*')
      .eq('id', data.reportId)
      .single();

    // 2. Validate status is 'clarifying'
    if (report.status !== 'clarifying') {
      throw new Error('Report is not waiting for clarification');
    }

    // 3. Update clarifications array with answer
    const clarifications = report.clarifications ?? [];
    const lastClarification = clarifications[clarifications.length - 1];
    if (lastClarification) {
      lastClarification.answer = data.answer;
      lastClarification.answeredAt = new Date().toISOString();
    }

    // 4. Update Supabase
    await client
      .from('sparlo_reports')
      .update({
        status: 'processing',
        clarifications,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.reportId);

    // 5. Resume Inngest workflow
    await inngest.send({
      name: 'report/clarification-answered',
      data: {
        reportId: data.reportId,
        answer: data.answer,
      },
    });

    return { success: true };
  },
  {
    schema: z.object({
      reportId: z.string().uuid(),
      answer: z.string().min(1),
    }),
  }
);
```

## Acceptance Criteria

### Functional
- [ ] Processing screen shows only: rotating animation + "Analyzing..." + elapsed time + "~15 min" + "safe to leave"
- [ ] Elapsed timer persists correctly across page refresh (uses `created_at`)
- [ ] Clarification UI appears when `status === 'clarifying'`
- [ ] Clarification answer resumes Inngest workflow (not restart)
- [ ] Skip option proceeds without answer
- [ ] Max 1 clarification question (enforced by existing `hasAskedClarification` check)

### Technical
- [ ] No separate component files - keep internal to `ProcessingScreen`
- [ ] Timer calculated from `progress.created_at`, not `Date.now()`
- [ ] Supabase realtime subscription continues to work
- [ ] Inngest event matching on `data.reportId` continues to work

### What's NOT Included
- ❌ Progress bars
- ❌ Percentage indicators
- ❌ Stage names (AN0, AN1, etc.)
- ❌ Rotating phase labels
- ❌ Separate Analyzing/Processing screens (same screen)
- ❌ Polling fallback (Supabase realtime is reliable)
- ❌ Artificial minimum display times

## Implementation

**Single PR. Estimated: 1-2 days.**

### Changes to Make

1. **Remove from `processing-screen.tsx`:**
   - Stage indicator UI (lines 304-359)
   - Progress percentage display
   - `PHASES` constant usage
   - `stepDescriptions` mapping

2. **Add to `processing-screen.tsx`:**
   - `useElapsedTime(progress.created_at)` hook
   - `formatElapsed()` helper
   - "Safe to leave" messaging
   - Simplified `ProcessingView` internal component

3. **Keep existing:**
   - Clarification UI (lines 168-239) - works correctly
   - `answerClarification` server action - works correctly
   - `useReportProgress` hook - works correctly
   - Inngest workflow - works correctly

### Files to Touch

| File | Change |
|------|--------|
| `apps/web/app/home/(user)/_components/processing-screen.tsx` | Remove stages, add elapsed time, keep clarification |
| `apps/web/lib/constants/phases.ts` | Can delete or leave (not used in simplified UI) |

### Files to NOT Touch

| File | Reason |
|------|--------|
| `apps/web/lib/inngest/functions/generate-report.ts` | Already works correctly |
| `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts` | Already works correctly |
| `apps/web/app/home/(user)/_lib/use-report-progress.ts` | Already works correctly |

## Testing Checklist

Before merging, verify:

1. **Happy path (no clarification):**
   - Submit question → see elapsed timer → report completes
   - Timer shows correct time after page refresh

2. **Clarification path:**
   - Submit question → AN0 requests clarification → UI shows question
   - Submit answer → workflow RESUMES (check Inngest dashboard - should NOT restart)
   - Report completes with clarification incorporated

3. **Skip clarification:**
   - Click "Skip" → workflow continues without answer
   - Report completes

4. **Edge cases:**
   - Close tab during processing → return later → shows correct state
   - Close tab during clarification → return later → shows clarification UI
   - Network disconnect → reconnect → UI updates correctly

## References

### Internal Files
- Inngest workflow: `apps/web/lib/inngest/functions/generate-report.ts:95-192`
- Clarification server action: `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts:391-458`
- Current processing screen: `apps/web/app/home/(user)/_components/processing-screen.tsx`
- Progress hook: `apps/web/app/home/(user)/_lib/use-report-progress.ts`

### V1 Issues (Now Fixed)
- State loss: Fixed by Inngest durable execution + `step.waitForEvent()`
- Schema validation: Fixed with `.nullish()` in Zod schemas
- Race conditions: Fixed with atomic Inngest event sending
