# Redesign All Reports Page

## Overview

Redesign the All Reports page (`/home/reports`) to align with the Aura brand system established across New Analysis, report pages, landing page, and sidebar navigation. The goal is to create visual consistency while preserving all existing UX functionality.

**Current File:** `apps/web/app/home/(user)/_components/reports-dashboard.tsx`

## Problem Statement

The current All Reports page uses a visual language that doesn't match the refined Aura design system implemented elsewhere:
- Card styling uses vivid status colors (violet-500, amber-50) instead of the subtle near-monochrome palette
- Typography doesn't leverage the established hierarchy (SectionTitle, MonoLabel, BodyText primitives)
- Page title style differs from the "New Analysis" page pattern
- Cards are compact list items rather than the larger, more confident card patterns used elsewhere
- Missing the signature left border accent (border-l-2 border-zinc-900)

## Proposed Solution

Transform the All Reports page to use the Aura design system while maintaining all current functionality:

1. **Page Title**: Match New Analysis style (42px, font-normal, tracking-[-0.02em])
2. **Report Cards**: Larger cards with left border accent and proper typography hierarchy
3. **Status Colors**: Subtle near-monochrome with semantic color on text only
4. **Actions**: Refined button styling matching the brand system
5. **Responsive**: Mobile-first single column, expanding to grid on larger screens

## Technical Approach

### Architecture

The redesign modifies a single component file with no structural changes:

```
apps/web/app/home/(user)/_components/
├── reports-dashboard.tsx    # PRIMARY FILE - Complete visual redesign
├── shared/
│   ├── archive-toggle-button.tsx  # May need style updates
│   └── mode-label.tsx             # May need style updates
```

### Implementation Phases

#### Phase 1: Typography & Layout Foundation

**Files to modify:**
- `apps/web/app/home/(user)/_components/reports-dashboard.tsx`

**Changes:**
1. Update page title from monospace uppercase to New Analysis style:
   ```tsx
   // FROM:
   <h1 className="font-mono text-xs font-medium tracking-[0.2em] text-[--text-muted] uppercase">
     REPORTS
   </h1>

   // TO:
   <h1 className="font-heading text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
     Reports
   </h1>
   ```

2. Update container max-width and padding to match New Analysis:
   ```tsx
   // FROM: max-w-4xl mx-auto px-6 py-12
   // TO: max-w-3xl mx-auto px-8 pt-24 pb-16
   ```

3. Add back link to dashboard (matching New Analysis pattern):
   ```tsx
   <Link href="/home" className="mb-6 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600">
     <ArrowLeftIcon className="h-3.5 w-3.5" />
     Dashboard
   </Link>
   ```

#### Phase 2: Report Card Redesign

**Visual Structure for Each Card:**
```
┌─────────────────────────────────────────────────────────┐
│ ▌                                                       │
│ ▌  HYBRID MODE                         Dec 28, 2024    │
│ ▌  Reduce Manufacturing Defects by 25%                  │
│ ▌                                                       │
│ ▌  ○ Complete · 42 concepts                             │
│ ▌                                                [→]   │
└─────────────────────────────────────────────────────────┘
```

**Card States with Subtle Colors:**

| Status | Dot Color | Text Color | Background | Border Accent |
|--------|-----------|------------|------------|---------------|
| Processing | zinc-500 (pulsing) | zinc-500 | white | zinc-900 |
| Needs Clarification | amber-500 | zinc-600 | zinc-50 | zinc-900 |
| Complete | zinc-900 | zinc-900 | white | zinc-900 |
| Failed | zinc-400 | zinc-500 | white | zinc-300 |
| Cancelled | zinc-300 | zinc-400 | white | zinc-200 |

**Key Typography Mapping:**
- **Mode Label**: MonoLabel (13px, uppercase, tracking-wide, zinc-500)
- **Report Title**: 18px, font-medium, tracking-[-0.02em], zinc-900
- **Status Label**: MonoLabel (13px, uppercase, tracking-wide)
- **Date/Metadata**: MonoLabel variant (13px, zinc-500)
- **Concept Count**: MonoLabel (13px, uppercase, zinc-500)

**Card Implementation:**
```tsx
<div className={cn(
  'group relative bg-white transition-all duration-200',
  'border-l-2 border-zinc-900 pl-8 pr-6 py-6',
  isClickable && 'cursor-pointer hover:bg-zinc-50',
  !isLast && 'border-b border-zinc-100',
)}>
  {/* Content */}
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0 flex-1">
      {/* Mode label */}
      <ModeLabel mode={report.mode} />

      {/* Title */}
      <h3 className="text-[18px] font-medium tracking-[-0.02em] text-zinc-900 mt-2">
        {displayTitle}
      </h3>

      {/* Status row */}
      <div className="mt-4 flex items-center gap-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className={cn(
            'h-1.5 w-1.5 rounded-full',
            statusDotClasses[report.status],
          )} />
          <span className="text-[13px] font-medium tracking-[0.06em] uppercase text-zinc-500">
            {statusLabels[report.status]}
          </span>
        </div>

        <span className="text-zinc-300">·</span>

        {/* Concept count or elapsed time */}
        <span className="text-[13px] tracking-[-0.02em] text-zinc-500">
          {isProcessing ? formatElapsed(elapsed) : `${conceptCount} concepts`}
        </span>
      </div>
    </div>

    {/* Date and actions */}
    <div className="flex flex-col items-end gap-3">
      <span className="text-[13px] tracking-[-0.02em] text-zinc-400">
        {formatReportDate(report.created_at)}
      </span>

      {/* Action buttons - shown on hover or always for processing */}
      <div className="flex items-center gap-2">
        {isProcessing && <CancelButton reportId={report.id} />}
        {!isProcessing && <ArchiveToggleButton reportId={report.id} />}
      </div>
    </div>
  </div>

  {/* Navigation chevron - complete reports only */}
  {isComplete && (
    <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100" />
  )}
</div>
```

#### Phase 3: Search Bar Refinement

Match the search pattern from reports dashboard but with refined styling:

```tsx
<div className="mt-10 mb-8">
  <div className="group relative">
    <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 transition-colors group-focus-within:text-zinc-600" />
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search reports..."
      className="w-full border-b border-zinc-200 bg-transparent py-3 pl-7 pr-4 text-[16px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none transition-colors"
    />
  </div>
</div>
```

#### Phase 4: Header Actions Refinement

**New Analysis Button:**
```tsx
<Link href="/home/reports/new" className="group">
  <button className="flex items-center gap-2 text-[13px] font-medium tracking-[-0.02em] text-zinc-600 transition-colors hover:text-zinc-900">
    New Analysis
    <span className="flex h-5 w-5 items-center justify-center rounded border border-zinc-300 transition-colors group-hover:border-zinc-900 group-hover:bg-zinc-900 group-hover:text-white">
      <Plus className="h-3 w-3" />
    </span>
  </button>
</Link>
```

**Archived Link:**
```tsx
<Link
  href="/home/archived"
  className="flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600"
>
  <Archive className="h-3.5 w-3.5" />
  Archived
</Link>
```

#### Phase 5: Empty & No Results States

**Empty State (No Reports):**
```tsx
<div className="mt-16 text-center">
  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-100">
    <FileText className="h-8 w-8 text-zinc-400" />
  </div>
  <p className="mt-6 text-[18px] tracking-[-0.02em] text-zinc-500">
    No reports yet
  </p>
  <p className="mt-2 text-[15px] tracking-[-0.02em] text-zinc-400">
    Get started by creating your first analysis
  </p>
  <Link
    href="/home/reports/new"
    className="mt-8 inline-flex items-center gap-2 bg-zinc-900 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-zinc-800"
  >
    <Plus className="h-4 w-4" />
    New Analysis
  </Link>
</div>
```

**No Results State (Search):**
```tsx
<div className="mt-12 text-center">
  <p className="text-[16px] tracking-[-0.02em] text-zinc-500">
    No reports match "{search}"
  </p>
  <button
    onClick={() => setSearch('')}
    className="mt-4 text-[14px] tracking-[-0.02em] text-zinc-400 underline transition-colors hover:text-zinc-600"
  >
    Clear search
  </button>
</div>
```

#### Phase 6: Button Component Updates

**CancelButton Refinement:**
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={handleCancel}
  disabled={isPending}
  className="h-8 gap-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
>
  {isPending ? (
    <Loader2 className="h-3.5 w-3.5 animate-spin" />
  ) : (
    <X className="h-3.5 w-3.5" />
  )}
  Cancel
</Button>
```

**Archive Button Refinement (update shared component):**
```tsx
// In shared/archive-toggle-button.tsx
className="h-8 gap-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
```

## Acceptance Criteria

### Functional Requirements
- [ ] All existing functionality preserved (search, archive, cancel, navigation)
- [ ] Status indicators correctly reflect Processing, Needs Clarification, Complete, Failed, Cancelled
- [ ] Optimistic UI for archiving works correctly with error rollback
- [ ] Search filters reports in real-time
- [ ] Report cards navigate to detail page on click
- [ ] Cancel button only appears for processing reports
- [ ] Archive button appears for eligible reports

### Visual Requirements
- [ ] Page title matches New Analysis style (42px, font-normal, tracking-[-0.02em])
- [ ] Cards use left border accent (border-l-2 border-zinc-900)
- [ ] Typography uses primitives (MonoLabel for labels, proper body text sizing)
- [ ] Status colors are subtle (near-monochrome with semantic text color only)
- [ ] Hover states are refined (zinc-50 background, smooth transitions)
- [ ] Empty state and no-results state are properly styled

### Responsive Requirements
- [ ] Single column layout on mobile
- [ ] Proper touch targets (44x44px minimum for buttons)
- [ ] Text remains readable at all breakpoints
- [ ] Search bar remains functional on mobile

### Accessibility Requirements
- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible (2px ring)
- [ ] Status colors meet WCAG AA contrast (4.5:1)
- [ ] Screen reader labels for status indicators
- [ ] Search results count announced

## MVP Implementation

### reports-dashboard.tsx

```tsx
'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Archive,
  ArrowLeft,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

import { cancelReportGeneration } from '../_lib/server/sparlo-reports-server-actions';
import type { ConversationStatus, DashboardReport } from '../_lib/types';
import { formatElapsed, useElapsedTime } from '../_lib/utils/elapsed-time';
import { formatReportDate, truncateText } from '../_lib/utils/report-utils';
import { ArchiveToggleButton } from './shared/archive-toggle-button';
import { ModeLabel } from './shared/mode-label';

// Status configuration - subtle near-monochrome palette
const statusConfig = {
  processing: {
    label: 'Processing',
    dotClass: 'bg-zinc-500 animate-pulse',
    textClass: 'text-zinc-500',
    bgClass: 'bg-white',
    borderClass: 'border-l-zinc-900',
  },
  clarifying: {
    label: 'Needs Clarification',
    dotClass: 'bg-amber-500 animate-pulse',
    textClass: 'text-zinc-600',
    bgClass: 'bg-zinc-50',
    borderClass: 'border-l-zinc-900',
  },
  complete: {
    label: 'Complete',
    dotClass: 'bg-zinc-900',
    textClass: 'text-zinc-900',
    bgClass: 'bg-white',
    borderClass: 'border-l-zinc-900',
  },
  failed: {
    label: 'Failed',
    dotClass: 'bg-zinc-400',
    textClass: 'text-zinc-500',
    bgClass: 'bg-white',
    borderClass: 'border-l-zinc-300',
  },
  cancelled: {
    label: 'Cancelled',
    dotClass: 'bg-zinc-300',
    textClass: 'text-zinc-400',
    bgClass: 'bg-white',
    borderClass: 'border-l-zinc-200',
  },
  error: {
    label: 'Error',
    dotClass: 'bg-zinc-400',
    textClass: 'text-zinc-500',
    bgClass: 'bg-white',
    borderClass: 'border-l-zinc-300',
  },
  confirm_rerun: {
    label: 'Processing',
    dotClass: 'bg-zinc-500 animate-pulse',
    textClass: 'text-zinc-500',
    bgClass: 'bg-white',
    borderClass: 'border-l-zinc-900',
  },
};

function getStatusConfig(status: ConversationStatus) {
  return statusConfig[status] || statusConfig.complete;
}

// ElapsedTime component
function ElapsedTime({ createdAt }: { createdAt: string }) {
  const elapsed = useElapsedTime(createdAt);
  return (
    <span className="text-[13px] tracking-[-0.02em] text-zinc-500 tabular-nums">
      {formatElapsed(elapsed)}
    </span>
  );
}

// CancelButton component
function CancelButton({
  reportId,
  onComplete,
}: {
  reportId: string;
  onComplete: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this report?',
    );
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await cancelReportGeneration({ reportId });
        onComplete();
      } catch (error) {
        console.error('Failed to cancel report:', error);
        alert(
          error instanceof Error ? error.message : 'Failed to cancel report',
        );
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        handleCancel();
      }}
      disabled={isPending}
      className="h-8 gap-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <X className="h-3.5 w-3.5" />
      )}
      Cancel
    </Button>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className="mt-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-100">
        <FileText className="h-8 w-8 text-zinc-400" />
      </div>
      <p className="mt-6 text-[18px] tracking-[-0.02em] text-zinc-500">
        No reports yet
      </p>
      <p className="mt-2 text-[15px] tracking-[-0.02em] text-zinc-400">
        Get started by creating your first analysis
      </p>
      <Link
        href="/home/reports/new"
        className="mt-8 inline-flex items-center gap-2 bg-zinc-900 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-zinc-800"
      >
        <Plus className="h-4 w-4" />
        New Analysis
      </Link>
    </div>
  );
}

// No results state
function NoResultsState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="mt-12 text-center">
      <p className="text-[16px] tracking-[-0.02em] text-zinc-500">
        No reports match &ldquo;{query}&rdquo;
      </p>
      <button
        onClick={onClear}
        className="mt-4 text-[14px] tracking-[-0.02em] text-zinc-400 underline transition-colors hover:text-zinc-600"
      >
        Clear search
      </button>
    </div>
  );
}

// Report card component
function ReportCard({
  report,
  isLast,
  onArchiveStart,
  onArchiveError,
  onRefresh,
}: {
  report: DashboardReport;
  isLast: boolean;
  onArchiveStart: () => void;
  onArchiveError: () => void;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const config = getStatusConfig(report.status);

  const isProcessing = report.status === 'processing' || report.status === 'confirm_rerun';
  const isClarifying = report.status === 'clarifying';
  const isComplete = report.status === 'complete';
  const isFailed = report.status === 'failed' || report.status === 'error';
  const isCancelled = report.status === 'cancelled';
  const isClickable = isComplete || isClarifying;

  const displayTitle = report.headline || truncateText(report.title, 80);

  const handleClick = () => {
    if (isClickable) {
      router.push(`/home/reports/${report.id}`);
    }
  };

  return (
    <div
      data-test={`report-card-${report.id}`}
      className={cn(
        'group relative transition-all duration-200',
        'border-l-2 pl-8 pr-6 py-6',
        config.borderClass,
        config.bgClass,
        isClickable && 'cursor-pointer hover:bg-zinc-50',
        !isLast && 'border-b border-zinc-100',
      )}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left content */}
        <div className="min-w-0 flex-1">
          <ModeLabel mode={report.mode} />

          <h3 className="mt-2 text-[18px] font-medium tracking-[-0.02em] text-zinc-900">
            {displayTitle}
          </h3>

          {/* Status row */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)} />
              <span className={cn(
                'text-[13px] font-medium tracking-[0.06em] uppercase',
                config.textClass,
              )}>
                {config.label}
              </span>
            </div>

            <span className="text-zinc-300">·</span>

            {isProcessing ? (
              <ElapsedTime createdAt={report.created_at} />
            ) : (
              <span className="text-[13px] tracking-[-0.02em] text-zinc-500">
                {report.concept_count > 0
                  ? `${report.concept_count} ${report.concept_count === 1 ? 'concept' : 'concepts'}`
                  : formatReportDate(report.created_at)
                }
              </span>
            )}
          </div>

          {/* Additional messages */}
          {isClarifying && (
            <p className="mt-3 text-[14px] tracking-[-0.02em] text-zinc-500">
              We need more information to continue
            </p>
          )}
          {isFailed && (
            <p className="mt-3 text-[14px] tracking-[-0.02em] text-zinc-500">
              {report.error_message || 'Report generation failed. Please try again.'}
            </p>
          )}
        </div>

        {/* Right content */}
        <div className="flex flex-col items-end gap-3" onClick={(e) => e.stopPropagation()}>
          <span className="text-[13px] tracking-[-0.02em] text-zinc-400">
            {formatReportDate(report.created_at)}
          </span>

          <div className="flex items-center gap-2">
            {isProcessing && (
              <CancelButton reportId={report.id} onComplete={onRefresh} />
            )}
            {(isComplete || isCancelled || isFailed) && (
              <ArchiveToggleButton
                reportId={report.id}
                isArchived={false}
                onOptimisticStart={onArchiveStart}
                onOptimisticError={onArchiveError}
                onComplete={onRefresh}
              />
            )}
          </div>
        </div>
      </div>

      {/* Navigation chevron */}
      {isClickable && (
        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  );
}

// Main component
interface ReportsDashboardProps {
  reports: DashboardReport[];
}

export function ReportsDashboard({ reports }: ReportsDashboardProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [optimisticallyHidden, setOptimisticallyHidden] = useState<Set<string>>(
    () => new Set(),
  );

  const filteredReports = useMemo(() => {
    const filtered = reports.filter((r) => !optimisticallyHidden.has(r.id));

    if (!search.trim()) return filtered;

    const query = search.toLowerCase();
    return filtered.filter(
      (report) =>
        report.headline?.toLowerCase().includes(query) ||
        report.title.toLowerCase().includes(query),
    );
  }, [search, reports, optimisticallyHidden]);

  const handleOptimisticArchive = (reportId: string) => {
    setOptimisticallyHidden((prev) => new Set(prev).add(reportId));
  };

  const handleArchiveError = (reportId: string) => {
    setOptimisticallyHidden((prev) => {
      const next = new Set(prev);
      next.delete(reportId);
      return next;
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-8 pt-24 pb-16">
      {/* Back link */}
      <Link
        href="/home"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-end justify-between">
        <h1 className="font-heading text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
          Reports
        </h1>

        <div className="flex items-center gap-6">
          <Link
            href="/home/archived"
            className="flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600"
          >
            <Archive className="h-3.5 w-3.5" />
            Archived
          </Link>

          <Link href="/home/reports/new" className="group">
            <button
              data-test="new-report-button"
              className="flex items-center gap-2 text-[13px] font-medium tracking-[-0.02em] text-zinc-600 transition-colors hover:text-zinc-900"
            >
              New Analysis
              <span className="flex h-5 w-5 items-center justify-center rounded border border-zinc-300 transition-all group-hover:border-zinc-900 group-hover:bg-zinc-900 group-hover:text-white">
                <Plus className="h-3 w-3" />
              </span>
            </button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mt-10 mb-8">
        <div className="group relative">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 transition-colors group-focus-within:text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="w-full border-b border-zinc-200 bg-transparent py-3 pl-7 pr-4 text-[16px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none transition-colors"
            data-test="search-reports-input"
          />
        </div>
      </div>

      {/* Report List */}
      {reports.length === 0 ? (
        <EmptyState />
      ) : filteredReports.length === 0 ? (
        <NoResultsState query={search} onClear={() => setSearch('')} />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            {filteredReports.map((report, index) => (
              <ReportCard
                key={report.id}
                report={report}
                isLast={index === filteredReports.length - 1}
                onArchiveStart={() => handleOptimisticArchive(report.id)}
                onArchiveError={() => handleArchiveError(report.id)}
                onRefresh={() => router.refresh()}
              />
            ))}
          </div>

          {/* Footer count */}
          <div className="mt-4 px-1">
            <span className="text-[13px] tracking-[-0.02em] text-zinc-400">
              Showing {filteredReports.length} of {reports.length} reports
            </span>
          </div>
        </>
      )}
    </div>
  );
}
```

## Dependencies & Risks

### Dependencies
- Existing `ModeLabel` component (may need style updates)
- Existing `ArchiveToggleButton` component (may need style updates)
- Animation constants from `_lib/animation-constants.ts`
- Utility functions from `_lib/utils/`

### Risks
- **Visual regression**: Other pages using reports-dashboard may be affected
- **Accessibility**: New colors must meet WCAG AA contrast ratios
- **Performance**: Larger cards may impact scroll performance with many reports

### Mitigation
- Test all affected pages after implementation
- Verify contrast ratios with accessibility tools
- Test with 100+ reports to ensure performance

## References

### Internal References
- New Analysis page: `apps/web/app/home/(user)/reports/new/page.tsx`
- Primitives: `apps/web/app/home/(user)/reports/[id]/_components/brand-system/primitives.tsx`
- Design tokens: `docs/brand-system/tailwind.config.js`
- Animation constants: `apps/web/app/home/(user)/_lib/animation-constants.ts`

### Design System
- Typography baseline: 18px body, 13px labels, -0.02em tracking
- Color palette: Near-monochrome (zinc-50 through zinc-950)
- Signature pattern: border-l-2 border-zinc-900
- Page title: 42px, font-normal, tracking-[-0.02em]

### External References
- Tailwind CSS v4 documentation
- WCAG 2.1 AA accessibility guidelines
