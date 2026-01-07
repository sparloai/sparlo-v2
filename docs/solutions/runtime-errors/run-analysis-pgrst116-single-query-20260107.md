---
title: Run Analysis Flow - PGRST116 and TypeError Fixes
date: 2026-01-07
problem_type: runtime_error
component: supabase_query
module: Report Generation
symptoms:
  - "Run Analysis button does nothing when clicked"
  - "406 PGRST116 error when polling report progress"
  - "TypeError: Cannot read properties of undefined (reading 'split')"
  - "Inngest events not triggering locally"
root_cause: incorrect_query_method
severity: critical
tags: [supabase, single, maybeSingle, inngest, playwright, e2e-tests]
related:
  - docs/solutions/database-issues/supabase-rls-permission-errors-401-406-pgrst116.md
---

# Run Analysis Flow - PGRST116 and TypeError Fixes

## Problem Summary

The "Run Analysis" button on `/app/reports/new` appeared to do nothing when clicked locally. Investigation revealed three distinct but related issues preventing the analysis flow from working.

## Symptoms

1. **Button click appeared unresponsive** - No visible feedback or navigation
2. **Console showed 406 PGRST116 errors** - When polling for report progress
3. **TypeError in console** - `Cannot read properties of undefined (reading 'split')` in calculateReadingTime
4. **Inngest dashboard empty** - Events not being triggered locally

## Root Causes

### 1. Inngest Dev Server Not Running

The Inngest dev server must be running locally to process `report/generate-hybrid` events. Without it, the server action creates the report record but the background processing never starts.

### 2. `.single()` Throws on Zero Rows

In `use-report-progress.ts`, the query used `.single()` which throws a PGRST116 error when the query returns 0 rows. This happens during the race condition between report creation and the first poll.

```typescript
// ❌ WRONG - throws PGRST116 when report doesn't exist yet
const { data, error } = await supabase
  .from('sparlo_reports')
  .select('*')
  .eq('id', reportId)
  .single();
```

### 3. Missing Null Check in calculateReadingTime

The `calculateReadingTime()` function didn't check if report was undefined before calling `JSON.stringify()`:

```typescript
// ❌ WRONG - crashes when report is undefined
function calculateReadingTime(report: DDReport | null | undefined): number {
  const text = JSON.stringify(report);  // TypeError if report is undefined
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / WPM);
}
```

## Solution

### Fix 1: Start Inngest Dev Server

```bash
# Run from project root
pnpm dlx inngest-cli dev -u http://localhost:3000/api/inngest
```

This starts the Inngest dev server on port 8288 and syncs with your Next.js app's `/api/inngest` endpoint.

### Fix 2: Use `.maybeSingle()` + Null Check

**File:** `apps/web/app/home/(user)/_lib/use-report-progress.ts`

```typescript
// ✅ CORRECT - returns null instead of throwing when 0 rows
const { data, error: fetchError } = await supabase
  .from('sparlo_reports')
  .select(
    'id, status, current_step, phase_progress, title, clarifications, report_data, error_message, created_at',
  )
  .eq('id', reportId)
  .maybeSingle();

if (fetchError) {
  throw fetchError;
}

if (!mountedRef.current) return;

// Handle case where report doesn't exist yet (race condition)
if (!data) {
  console.log(
    '[useReportProgress] Report not found yet, will retry on next poll',
  );
  return;
}
```

### Fix 3: Guard calculateReadingTime

**File:** `apps/web/app/home/(user)/reports/[id]/_components/brand-system/dd-report-display.tsx`

```typescript
// ✅ CORRECT - returns 0 if report is undefined
function calculateReadingTime(report: DDReport | null | undefined): number {
  if (!report) return 0;
  const WPM = 150;
  const text = JSON.stringify(report);
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / WPM);
}
```

## E2E Tests Created

Created comprehensive Playwright tests to verify the full flow:

**File:** `apps/e2e/tests/run-analysis-flow.spec.ts`

```typescript
test('should show processing screen and handle clarification flow', async ({ page }) => {
  // Bootstrap user and login
  await auth.bootstrapUser({...});
  await auth.loginAsUser({...});

  // Navigate and fill form
  await page.goto('/app/reports/new');
  await page.getByTestId('challenge-input').fill(VALID_CHALLENGE_TEXT);

  // Submit and verify processing screen appears
  await page.getByTestId('challenge-submit').click({ force: true });

  // Verify "Reviewing your challenge" screen shows
  const processingText = page.locator('text=/Reviewing your challenge|Analyzing/');
  await expect(processingText.first()).toBeVisible({ timeout: 30000 });
});
```

## Prevention

### 1. Always Use `.maybeSingle()` for Optional Records

```typescript
// When the record might not exist
.maybeSingle()  // Returns null if 0 rows

// When exactly 1 row is guaranteed
.single()       // Throws if 0 or >1 rows
```

### 2. Guard Functions That Process Potentially Undefined Data

```typescript
function processData(data: T | null | undefined): Result {
  if (!data) return defaultValue;
  // ... process data
}
```

### 3. Run Inngest Dev Server for Local Testing

Add to your development workflow:
```bash
# Terminal 1: Next.js dev server
pnpm dev

# Terminal 2: Inngest dev server
pnpm dlx inngest-cli dev -u http://localhost:3000/api/inngest
```

## Verification

After fixes, run the E2E tests:

```bash
cd apps/e2e
pnpm exec playwright test tests/run-analysis-flow.spec.ts --headed
```

Expected output:
```
✓ should show processing screen and handle clarification flow
✓ should display processing screen elements correctly

2 passed
```

## Related Issues

- [PGRST116 RLS/Permission Errors](../database-issues/supabase-rls-permission-errors-401-406-pgrst116.md) - Different cause (RLS policies vs query method)

## Key Takeaways

1. **PGRST116 has multiple causes** - Can be RLS issues OR `.single()` on empty results
2. **Race conditions in polling** - Always handle the "not yet created" case
3. **Null guards before operations** - Especially for JSON.stringify, .split(), etc.
4. **E2E tests catch integration issues** - Unit tests wouldn't have caught the Inngest integration gap
