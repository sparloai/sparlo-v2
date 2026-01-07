# Fix: Run Analysis Button Does Nothing (406 PGRST116 Error)

## Overview

When clicking "Run Analysis" on the new analysis page, nothing happens. The console shows:
1. `TypeError: Cannot read properties of undefined (reading 'split')` - Crashes the render
2. `406 Not Acceptable` with `PGRST116: The result contains 0 rows` - Supabase query failure

**Root Cause**: Two interconnected bugs prevent the flow from working.

## Problem Analysis

### Error Chain

```
User clicks "Run Analysis"
        ↓
startReportGeneration() server action
        ↓
Returns { success: true, reportId: "..." }
        ↓
Form sets reportId → triggers useReportProgress(reportId)
        ↓
useReportProgress calls .single() on sparlo_reports
        ↓
❌ PGRST116: .single() throws when 0 rows (report not found/RLS blocks)
        ↓
Error caught but progress = null
        ↓
ProcessingScreen may attempt to render DD report with undefined data
        ↓
❌ TypeError: calculateReadingTime(undefined).split() crashes
```

### Bug 1: `useReportProgress` Uses `.single()` Which Throws on 0 Rows

**File**: `apps/web/app/app/_lib/use-report-progress.ts:90`

```typescript
const { data, error: fetchError } = await supabase
  .from('sparlo_reports')
  .select('...')
  .eq('id', reportId)
  .single();  // ← THROWS PGRST116 when 0 rows returned
```

**Problem**: `.single()` expects exactly 1 row. If the report:
- Doesn't exist yet (race condition)
- Was deleted
- RLS blocks access

It throws `PGRST116` instead of returning `null`.

**Fix**: Use `.maybeSingle()` which returns `null` on 0 rows instead of throwing.

### Bug 2: `dd-report-display.tsx` Doesn't Guard Against Undefined Report

**File**: `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx:100,112,117`

```typescript
const report = reportData.report;  // Line 112 - Can be undefined

// Line 117 - Crashes if report is undefined
reportTitle: title || report.header.company_name,

// Line 120 - useMemo calls this with undefined report
const readingTime = useMemo(() => calculateReadingTime(report), [report]);

// Line 100 - calculateReadingTime crashes
function calculateReadingTime(report: DDReport): number {
  const text = JSON.stringify(report);  // "undefined" string or undefined value?
  const wordCount = text.split(/\s+/).length;  // ← CRASH if text is undefined
}
```

**Problem**: `JSON.stringify(undefined)` returns `undefined` (not the string "undefined"), so `undefined.split()` throws.

**Fix**: Add early return guard in `calculateReadingTime` and null checks throughout the component.

## Implementation Plan

### Step 1: Fix `use-report-progress.ts`

**File**: `apps/web/app/app/_lib/use-report-progress.ts`

**Change** (line 84-90):

```typescript
// BEFORE
const { data, error: fetchError } = await supabase
  .from('sparlo_reports')
  .select(
    'id, status, current_step, phase_progress, title, clarifications, report_data, error_message, created_at',
  )
  .eq('id', reportId)
  .single();

// AFTER
const { data, error: fetchError } = await supabase
  .from('sparlo_reports')
  .select(
    'id, status, current_step, phase_progress, title, clarifications, report_data, error_message, created_at',
  )
  .eq('id', reportId)
  .maybeSingle();  // ← Returns null instead of throwing on 0 rows
```

**Add null check** (after line 91):

```typescript
if (fetchError) {
  throw fetchError;
}

// Handle case where report doesn't exist yet (race condition)
if (!data) {
  console.log('[useReportProgress] Report not found yet, will retry on next poll');
  return;  // Don't update state, let polling retry
}
```

### Step 2: Fix `dd-report-display.tsx`

**File**: `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx`

**Change 1** - Guard `calculateReadingTime` (line 97-102):

```typescript
// BEFORE
function calculateReadingTime(report: DDReport): number {
  const WPM = 150;
  const text = JSON.stringify(report);
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / WPM);
}

// AFTER
function calculateReadingTime(report: DDReport | null | undefined): number {
  if (!report) return 0;  // Guard against undefined
  const WPM = 150;
  const text = JSON.stringify(report);
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / WPM);
}
```

**Change 2** - Early return for undefined report (after line 112):

```typescript
const report = reportData.report;

// Early return if report data is not ready
if (!report || !report.header || !report.executive_summary) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-zinc-500">Loading report data...</div>
    </div>
  );
}
```

**Change 3** - Fix `useReportActions` title (line 115-118):

```typescript
// BEFORE
const { handleShare, handleExport, isExporting } = useReportActions({
  reportId: reportId || '',
  reportTitle: title || report.header.company_name,  // ← Crashes if report undefined
});

// AFTER - Move AFTER the guard check
const { handleShare, handleExport, isExporting } = useReportActions({
  reportId: reportId || '',
  reportTitle: title || report.header?.company_name || 'Report',
});
```

### Step 3: Verify RLS Policies Are Working

Run this SQL in Supabase dashboard to verify the policies:

```sql
-- Check current policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'sparlo_reports';

-- Test INSERT+SELECT as authenticated user
-- (Run in SQL editor with auth context)
```

### Step 4: Add Defensive Logging to Debug

If issues persist, add logging to `startReportGeneration`:

```typescript
// After insert (line 526)
console.log('[startReportGeneration] Report created:', {
  reportId: report.id,
  accountId: report.account_id,
  userId: user.id,
  accountIdMatchesUserId: report.account_id === user.id,
});
```

## Files to Modify

| File | Line(s) | Change |
|------|---------|--------|
| `apps/web/app/app/_lib/use-report-progress.ts` | 90 | `.single()` → `.maybeSingle()` |
| `apps/web/app/app/_lib/use-report-progress.ts` | 92-94 | Add null check for `data` |
| `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx` | 97-102 | Guard `calculateReadingTime` |
| `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx` | 112-118 | Add early return for undefined report |

## Why Previous Fixes May Have Failed

1. **Only fixed one bug**: Both bugs must be fixed together - the 406 error prevents data loading, and the undefined guard prevents the crash.

2. **Fixed the wrong `.single()` call**: There are multiple `.single()` calls in the codebase. The critical one is in `use-report-progress.ts:90`.

3. **Didn't add the early return guard**: Just fixing `.maybeSingle()` means `progress` could be `null`, but downstream code (like DD report display) still crashes on undefined.

4. **Race condition not handled**: Even with `.maybeSingle()`, if the report isn't created yet when polling starts, we need to gracefully wait for the next poll cycle.

## Validation Steps

1. Run `pnpm typecheck` to ensure no type errors
2. Start dev server: `pnpm dev`
3. Navigate to new analysis page
4. Enter a problem description and click "Run Analysis"
5. Verify:
   - No console errors
   - Processing screen appears
   - Progress polling works
   - Redirect to home happens after AN0 check

## Acceptance Criteria

- [ ] "Run Analysis" button triggers report creation
- [ ] No 406 errors in console
- [ ] No TypeError for `.split()`
- [ ] Processing screen renders correctly
- [ ] Report progress polling works
- [ ] User is redirected after clarification check passes
