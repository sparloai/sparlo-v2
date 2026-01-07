---
title: Unclickable Buttons During Hydration on Analysis Page
category: ui-bugs
severity: high
symptoms:
  - Buttons appear unclickable for 10-15 seconds after page load
  - Gray skeleton placeholders shown instead of interactive tab buttons
  - Button elements visually present but not responsive to clicks
  - Issue occurs on pages using useSearchParams() hook
components:
  - page-skeleton.tsx
  - report-mode-selector.tsx
  - useSearchParams hook (client-side hydration trigger)
  - Suspense boundaries with nested fallbacks
tags:
  - suspense
  - hydration
  - skeleton-loading
  - client-side-rendering
  - interactive-components
  - useSearchParams
  - react-19
  - next-js-16
date_solved: 2026-01-07
---

# Suspense Fallback Hides Interactive Elements

## Problem

On the new analysis page (`/app/reports/new`), the "Investor Due Diligence" button appeared unclickable for 10-15 seconds after page load. Users saw gray skeleton placeholders where interactive tab buttons should be.

### Symptoms

- Tab buttons ("Solve a Problem" / "Investor Due Diligence") not clickable immediately
- Gray animated skeleton boxes displayed instead of real buttons
- 10-15 second delay before interactivity
- No error messages - just unresponsive UI

### Root Cause

Nested Suspense boundaries with skeleton fallbacks showed placeholder elements instead of real tab buttons. The `useSearchParams()` hook in `useAnalysisMode()` requires client-side hydration, triggering Suspense. During this time, users saw:

```
BEFORE (broken):
┌─────────────────────────────────┐
│ ████████████  (gray skeleton)   │  ← Not clickable
│ ████████████  (gray skeleton)   │  ← Not clickable
└─────────────────────────────────┘
```

Instead of:

```
AFTER (fixed):
┌─────────────────────────────────┐
│ [Solve a Problem] [Due Diligence]│  ← Real buttons, visible immediately
└─────────────────────────────────┘
```

## Solution

**Key insight**: Show real (static) UI elements in Suspense fallbacks instead of skeleton placeholders.

### Files Modified

1. `apps/web/app/app/reports/new/_components/page-skeleton.tsx`
2. `apps/web/app/app/reports/new/_components/report-mode-selector.tsx`

### Code Changes

#### page-skeleton.tsx

Changed from skeleton placeholders to real tab buttons:

```tsx
// BEFORE: Gray skeleton placeholders
<div className="mb-8 h-12 w-80 animate-pulse rounded-lg bg-zinc-100" />

// AFTER: Real tab buttons (static, non-functional during loading)
<div className="mb-8 inline-flex h-12 items-center rounded-lg bg-zinc-100 p-1">
  <button
    type="button"
    className="rounded-md bg-white px-6 py-2 text-[14px] font-medium tracking-[-0.02em] text-zinc-900 shadow-sm"
  >
    <span className="hidden sm:inline">Solve a Problem</span>
    <span className="sm:hidden">Problem</span>
  </button>
  <button
    type="button"
    className="rounded-md px-6 py-2 text-[14px] font-medium tracking-[-0.02em] text-zinc-600"
  >
    <span className="hidden sm:inline">Investor Due Diligence</span>
    <span className="sm:hidden">Due Diligence</span>
  </button>
</div>
```

#### report-mode-selector.tsx

Added `ReportModeSelectorFallback` component with real buttons:

```tsx
/**
 * Fallback component that shows real tab buttons while useSearchParams loads.
 * This eliminates the perceived delay where buttons appear unclickable.
 */
function ReportModeSelectorFallback() {
  return (
    <main className="flex flex-col bg-white">
      <div className="px-8 pt-24 pb-4">
        <div className="mx-auto w-full max-w-3xl">
          {/* Back link - static */}
          <span className="mb-6 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400">
            {/* ... arrow icon ... */}
            All Reports
          </span>

          {/* Page title - static */}
          <h1 className="font-heading mb-8 text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
            New Analysis
          </h1>

          {/* Tab buttons - real, visible immediately */}
          <div className="mb-8 inline-flex h-12 items-center rounded-lg bg-zinc-100 p-1">
            <button type="button" className="...">Solve a Problem</button>
            <button type="button" className="...">Investor Due Diligence</button>
          </div>

          {/* Form skeleton - only form content is skeleton */}
          <div className="h-96 animate-pulse rounded-lg border border-zinc-200 bg-zinc-50" />
        </div>
      </div>
    </main>
  );
}

export function ReportModeSelector({ prefill, error }: ReportModeSelectorProps) {
  return (
    <Suspense fallback={<ReportModeSelectorFallback />}>
      <ReportModeSelectorContent prefill={prefill} error={error} />
    </Suspense>
  );
}
```

### Why This Works

1. **Immediate Visual Feedback**: Tab buttons render synchronously in the fallback before `useSearchParams()` completes
2. **Perceived Performance**: Users see real UI elements immediately, eliminating perceived delay
3. **No Layout Shift**: Fallback has identical structure to final UI
4. **Graceful Transition**: React swaps fallback for real content seamlessly

## Prevention

### Best Practices for Suspense Fallbacks

1. **Show real UI elements** in fallbacks for navigation and controls
2. **Use skeletons only for content** that genuinely loads asynchronously
3. **Match layout exactly** between fallback and actual content
4. **Test with network throttling** to see what users experience

### Pattern to Follow

```tsx
// Three-component pattern for Suspense boundaries

// 1. Content Component (uses async hooks)
function FeatureContent() {
  const data = useAsyncHook(); // This triggers Suspense
  return <InteractiveUI data={data} />;
}

// 2. Fallback Component (static, real UI)
function FeatureFallback() {
  return (
    <div>
      {/* Real UI elements - visible immediately */}
      <button type="button">Real Button Text</button>

      {/* Skeleton only for async content */}
      <div className="h-48 animate-pulse rounded bg-zinc-50" />
    </div>
  );
}

// 3. Wrapper Component (exports for use)
export function Feature() {
  return (
    <Suspense fallback={<FeatureFallback />}>
      <FeatureContent />
    </Suspense>
  );
}
```

### Anti-Patterns to Avoid

```tsx
// DON'T: Gray box for interactive elements
<div className="h-12 w-80 animate-pulse rounded bg-zinc-100" />

// DO: Real button elements (static)
<button type="button" className="...">Button Text</button>
```

## Related

- `useSearchParams()` requires Suspense in Next.js 16
- Similar pattern may be needed for other pages using client-side hooks
- See: `apps/web/app/app/reports/new/_lib/use-analysis-mode.ts` for the hook that triggers this

## Testing

1. Open DevTools → Network → Slow 3G
2. Navigate to `/app/reports/new`
3. Verify tab buttons are visible immediately (not gray boxes)
4. Verify buttons become interactive after hydration completes
