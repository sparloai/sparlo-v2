# Tabbed Analysis Mode Selection

## Overview

Convert the New Analysis page (`/home/reports/new`) into a unified interface with two tabs: "Solve a Problem" (existing Technical Analysis) and "Investor Due Diligence" (simplified DD form). Users can switch between modes via tabs with URL sync and localStorage persistence.

## Problem Statement

Currently, users navigate to separate routes for different analysis modes:
- `/home/reports/new` (Standard/Technical)
- `/home/reports/dd/new` (Due Diligence)

This creates fragmented UX. Users should be able to toggle between the two primary modes on a single page.

## Proposed Solution

Add a tabbed interface below the "New Analysis" page title with two tabs. Each tab shows its respective form while maintaining independent form states. URL params (`?mode=technical` or `?mode=dd`) enable direct linking, and localStorage remembers the user's last-used tab.

## Technical Approach

### Architecture

```
/home/reports/new/page.tsx (Server Component)
└── ReportModeSelector (Client Component)
    ├── Tabs with URL/localStorage sync
    │   ├── "Solve a Problem" tab
    │   └── "Investor Due Diligence" tab
    └── TabsContent (both forms stay mounted via forceMount)
        ├── TechnicalAnalysisForm (existing form, extracted)
        └── DueDiligenceAnalysisForm (simplified single-field form)
```

### Key Implementation Details

- **State priority**: URL param > localStorage > Default ("technical")
- **Form state preservation**: Use `forceMount` with CSS `hidden` - both forms stay mounted, preserving their own internal state
- **URL updates**: Use `replaceState` (no history pollution from tab switches)
- **No state lifting**: Each form manages its own state independently

## Implementation Phases

### Phase 1: Create Tab Infrastructure

**Files to modify:**
- `apps/web/app/home/(user)/reports/new/page.tsx`

**Files to create:**
- `apps/web/app/home/(user)/reports/new/_components/report-mode-selector.tsx`
- `apps/web/app/home/(user)/reports/new/_lib/use-analysis-mode.ts`

**Tasks:**
- [ ] Create `useAnalysisMode` hook for URL/localStorage sync
- [ ] Create `ReportModeSelector` component using `@kit/ui/tabs`
- [ ] Update page to use Suspense boundary for `useSearchParams`

#### use-analysis-mode.ts

```typescript
'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'sparlo-analysis-mode';

type AnalysisMode = 'technical' | 'dd';

// Type guard for safe validation
function isValidMode(value: string | null): value is AnalysisMode {
  return value === 'technical' || value === 'dd';
}

function getStoredMode(): AnalysisMode {
  if (typeof window === 'undefined') return 'technical';
  const stored = localStorage.getItem(STORAGE_KEY);
  return isValidMode(stored) ? stored : 'technical';
}

export function useAnalysisMode() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // URL param takes priority, then localStorage, then default
  const urlMode = searchParams.get('mode');
  const initialMode = isValidMode(urlMode) ? urlMode : getStoredMode();

  const [mode, setModeState] = useState<AnalysisMode>(initialMode);

  const setMode = useCallback((newMode: AnalysisMode) => {
    setModeState(newMode);

    // Update localStorage (silent fail is acceptable)
    localStorage.setItem(STORAGE_KEY, newMode);

    // Update URL (preserve other params)
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', newMode);
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
  }, [pathname, searchParams]);

  return { mode, setMode };
}
```

#### report-mode-selector.tsx

```typescript
'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@kit/ui/tabs';
import { useAnalysisMode } from '../_lib/use-analysis-mode';
import { TechnicalAnalysisForm } from './technical-analysis-form';
import { DueDiligenceAnalysisForm } from './due-diligence-analysis-form';

export function ReportModeSelector() {
  const { mode, setMode } = useAnalysisMode();

  return (
    <Tabs value={mode} onValueChange={(v) => setMode(v as 'technical' | 'dd')}>
      <TabsList className="mb-8 inline-flex h-12 items-center rounded-lg bg-zinc-100 p-1">
        <TabsTrigger
          value="technical"
          className="rounded-md px-6 py-2 text-[14px] font-medium tracking-[-0.02em] text-zinc-600 transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
        >
          <span className="hidden sm:inline">Solve a Problem</span>
          <span className="sm:hidden">Problem</span>
        </TabsTrigger>
        <TabsTrigger
          value="dd"
          className="rounded-md px-6 py-2 text-[14px] font-medium tracking-[-0.02em] text-zinc-600 transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
        >
          <span className="hidden sm:inline">Investor Due Diligence</span>
          <span className="sm:hidden">Due Diligence</span>
        </TabsTrigger>
      </TabsList>

      {/* forceMount keeps both forms in DOM, CSS hides inactive one */}
      {/* This preserves form state without lifting state to parent */}
      <TabsContent value="technical" forceMount className={mode !== 'technical' ? 'hidden' : ''}>
        <TechnicalAnalysisForm />
      </TabsContent>

      <TabsContent value="dd" forceMount className={mode !== 'dd' ? 'hidden' : ''}>
        <DueDiligenceAnalysisForm />
      </TabsContent>
    </Tabs>
  );
}
```

### Phase 2: Extract Technical Form

**Files to modify:**
- `apps/web/app/home/(user)/reports/new/_components/new-analysis-form.tsx`

**Files to create:**
- `apps/web/app/home/(user)/reports/new/_components/technical-analysis-form.tsx`

**Tasks:**
- [ ] Extract existing form logic into `TechnicalAnalysisForm` component
- [ ] Keep all existing functionality: file attachments, detection indicators, keyboard shortcuts
- [ ] Keep form managing its own state (no props for state)
- [ ] Ensure button text is "Run Analysis"
- [ ] Helper chips: Problem, Constraints, Success criteria
- [ ] Placeholder: "Describe your technical challenge."

### Phase 3: Create DD Form

**Files to create:**
- `apps/web/app/home/(user)/reports/new/_components/due-diligence-analysis-form.tsx`

**Tasks:**
- [ ] Create single-field DD form (NO company name, NO VC notes fields)
- [ ] Form manages its own state internally
- [ ] Placeholder: "Paste the startup's pitch materials, technical claims, product description, and any relevant technical documentation..."
- [ ] Helper chips: Company Info, Tech Claims, Product Details
- [ ] Button text: "Run Due Diligence"
- [ ] Same footer pattern: ~25 min, Attach file, Min chars, Submit button
- [ ] Submit to existing DD backend endpoint

#### due-diligence-analysis-form.tsx

```typescript
'use client';

import { useState, useTransition } from 'react';
import { Textarea } from '@kit/ui/textarea';
import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

const MIN_CHARS = 200;

const HELPER_CHIPS = [
  { label: 'Company Info', pattern: /company|startup|founded|team/i },
  { label: 'Tech Claims', pattern: /technology|patent|proprietary|algorithm/i },
  { label: 'Product Details', pattern: /product|feature|solution|platform/i },
];

export function DueDiligenceAnalysisForm() {
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();

  const charCount = content.length;
  const isValid = charCount >= MIN_CHARS;

  // Detect which chips are satisfied
  const detectedChips = HELPER_CHIPS.map(chip => ({
    ...chip,
    detected: chip.pattern.test(content),
  }));

  const handleSubmit = () => {
    if (!isValid) return;
    startTransition(async () => {
      // Submit to DD endpoint
      // Backend extracts company name from content
    });
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
      {/* Detection indicators */}
      <div className="mb-6 flex items-center gap-6">
        {detectedChips.map(chip => (
          <div key={chip.label} className="flex items-center gap-2">
            <div className={cn(
              'h-1.5 w-1.5 rounded-full transition-colors duration-300',
              chip.detected ? 'bg-zinc-900' : 'bg-zinc-300',
            )} />
            <span className={cn(
              'text-[13px] tracking-[-0.02em] transition-colors duration-300',
              chip.detected ? 'text-zinc-700' : 'text-zinc-400',
            )}>
              {chip.label}
            </span>
          </div>
        ))}
      </div>

      {/* Main textarea */}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste the startup's pitch materials, technical claims, product description, and any relevant technical documentation..."
        className="min-h-[300px] resize-none text-[18px] leading-[1.3] tracking-[-0.02em]"
      />

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[13px] text-zinc-500">
          <span>~25 min analysis</span>
          <span>{charCount}/{MIN_CHARS} chars</span>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isPending}
          className="bg-zinc-900 px-8 py-4 text-[15px] font-medium text-white hover:bg-zinc-800"
        >
          {isPending ? 'Processing...' : 'Run Due Diligence'}
        </Button>
      </div>
    </div>
  );
}
```

### Phase 4: Styling & Responsiveness

**Tasks:**
- [ ] Style tabs to match Sparlo design system (monochrome, zinc palette)
- [ ] Responsive tab labels for mobile (shorter text on sm breakpoint)
- [ ] Ensure footer wraps properly on small screens
- [ ] Test at 375px, 640px, 1024px breakpoints

### Phase 5: Testing & Verification

**Tasks:**
- [ ] Test tab switching preserves form content in both tabs
- [ ] Test page refresh remembers last active tab
- [ ] Test direct URL access (`?mode=dd`) works
- [ ] Test invalid URL params fall back gracefully
- [ ] Test both forms submit to correct backends
- [ ] Test mobile responsiveness (375px, 640px)

## Acceptance Criteria

### Functional Requirements
- [ ] Two tabs appear below "New Analysis" title: "Solve a Problem" and "Investor Due Diligence"
- [ ] "Solve a Problem" tab shows existing Technical Analysis form unchanged
- [ ] "Investor Due Diligence" tab shows simplified single-field form
- [ ] Switching tabs does NOT clear form content in either tab
- [ ] Active tab preference persists in localStorage across sessions
- [ ] First-time users default to "Solve a Problem" tab
- [ ] URL updates to `?mode=technical` or `?mode=dd` when switching tabs
- [ ] Direct navigation to `?mode=dd` shows correct tab
- [ ] Invalid URL params (e.g., `?mode=invalid`) gracefully fall back to default
- [ ] "Run Analysis" button on Technical tab, "Run Due Diligence" on DD tab
- [ ] Both forms submit to their respective backend endpoints

### Non-Functional Requirements
- [ ] Tab switch is instant (no loading spinner needed)
- [ ] URL updates use `replaceState` (no history pollution)
- [ ] Tabs are keyboard accessible (Radix handles this)
- [ ] Mobile: tabs fit on 375px screen width
- [ ] Footer elements wrap gracefully on small screens

## Files Summary

### Modified Files
| File | Changes |
|------|---------|
| `apps/web/app/home/(user)/reports/new/page.tsx` | Add Suspense, use `ReportModeSelector` |
| `apps/web/app/home/(user)/reports/new/_components/new-analysis-form.tsx` | Extract to `TechnicalAnalysisForm` |

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/reports/new/_lib/use-analysis-mode.ts` | Hook for URL/localStorage sync |
| `apps/web/app/home/(user)/reports/new/_components/report-mode-selector.tsx` | Main tabbed container |
| `apps/web/app/home/(user)/reports/new/_components/technical-analysis-form.tsx` | Extracted technical form |
| `apps/web/app/home/(user)/reports/new/_components/due-diligence-analysis-form.tsx` | New simplified DD form |

## What NOT to Change

- Underlying analysis logic/API calls for either mode
- The All Reports page
- The sidebar navigation
- The output/results pages
- Other analysis routes (`/discovery/new`, `/hybrid/new`)

## Dependencies & Risks

### Dependencies
- Existing `@kit/ui/tabs` component (Radix-based, supports `forceMount`)
- Existing DD backend endpoint for submission
- Sparlo design system tokens

### Risks
| Risk | Mitigation |
|------|------------|
| localStorage unavailable (private browsing) | Silent fallback to default tab |
| Backend company name extraction fails | Show helpful error message prompting user to include company name |

## References

### Internal
- Design System: `docs/SPARLO-DESIGN-SYSTEM.md`
- Tabs Component: `packages/ui/src/shadcn/tabs.tsx`
- Existing DD Form: `apps/web/app/home/(user)/reports/dd/new/page.tsx`
- localStorage Pattern: `apps/web/app/home/(user)/_lib/sidebar-context.tsx`
- New Analysis Form: `apps/web/app/home/(user)/reports/new/_components/new-analysis-form.tsx`

### External
- [Radix UI Tabs](https://www.radix-ui.com/primitives/docs/components/tabs)
- [WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [Next.js useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params)

---

## Reviewer Feedback Applied

Changes from plan review:

1. **Fixed type safety** - Replaced unsafe `as` casts with proper type guard `isValidMode()`
2. **Removed useEffect mount sync** - Redundant with initial mode calculation
3. **Deleted Phase 4 (state lifting)** - Using `forceMount` + CSS `hidden` instead, forms keep their own state
4. **Renamed components** - `AnalysisModeTabs` → `ReportModeSelector`, `DDAnalysisForm` → `DueDiligenceAnalysisForm`
5. **Simplified hook** - Removed try-catch (silent fail acceptable), removed unnecessary callback deps
6. **Reduced phases** - From 6 to 5 (removed state lifting phase)
