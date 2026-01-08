# ✨ feat: Showcase Gallery with Inline Expansion

> Replace the full inline BrandSystemReport with a card-based progressive disclosure pattern that shows report depth without overwhelming users.

---

## 🔬 Research Insights (from 12 parallel agents)

### Critical Architectural Decision: Reuse Existing Section Components

**Finding**: The codebase already has section renderers in `brand-system/sections/`. Instead of creating 10 new content renderers, add a `variant="preview"` prop to existing components.

```tsx
// INSTEAD OF creating new files like executive-summary-content.tsx
// REUSE existing: brand-system/sections/executive-summary-section.tsx
<ExecutiveSummarySection
  data={data.executive_summary}
  variant="preview"  // NEW: Controls compact vs full rendering
/>
```

**Benefits**:
- Zero content duplication across preview and full report
- Single source of truth for each section's rendering logic
- Easier maintenance when report structure changes

### Simplified File Structure (from 18 → 5 files)

The code simplicity review revealed massive over-engineering. Revised structure:

```
showcase-gallery/
├── showcase-gallery.tsx      # Container + all state
├── use-showcase-state.ts     # Custom hook for state machine
├── section-card.tsx          # Card with Shadcn Accordion primitive
├── report-tabs.tsx           # Tab navigation (using Radix Tabs)
└── types.ts                  # Discriminated union types
```

**Key Simplifications**:
- Use **Shadcn Dialog** instead of custom `full-report-modal.tsx`
- Use **Shadcn Accordion** instead of custom expand/collapse
- Inline the Exit Ramp CTA in main component (not worth separate file)
- No `section-content/` folder - reuse existing section components

### Performance Optimizations

| Original | Optimized | Savings |
|----------|-----------|---------|
| `framer-motion` full (34kb) | `LazyMotion` + `domAnimation` | 78% bundle reduction |
| Spring physics everywhere | CSS transitions for simple fades | CPU savings |
| Re-render all cards on expand | `React.memo` + stable callbacks | Fewer re-renders |

```tsx
// Before: Heavy spring physics for everything
transition={{ type: 'spring', stiffness: 200, damping: 25 }}

// After: CSS for simple transitions, spring only for layoutId
// Expand/collapse: CSS transition-[height] duration-300 ease-out
// Tab indicator: layoutId with spring (the one place it matters)
```

### TypeScript Type Safety

**Problem identified**: Non-null assertions (`!`) and loose types create runtime risks.

```tsx
// ❌ DANGEROUS (in original plan)
const activeReport = REPORTS_CONFIG.find(r => r.id === activeReportId)!;

// ✅ SAFE: Discriminated union + exhaustive check
type SectionType =
  | { type: 'executive-summary'; data: ExecutiveSummaryData }
  | { type: 'problem-analysis'; data: ProblemAnalysisData }
  // ... etc

function assertNever(x: never): never {
  throw new Error(`Unhandled section type: ${x}`);
}
```

### Race Condition Handling

**Issue**: Rapid clicking during animations causes state corruption.

**Solution**: Per-section state machine:

```tsx
type CardState = 'collapsed' | 'expanding' | 'expanded' | 'collapsing';

const handleExpand = useCallback((sectionId: string) => {
  if (cardStates[sectionId] === 'expanding' || cardStates[sectionId] === 'collapsing') {
    return; // Ignore clicks during animation
  }
  // ... proceed with state change
}, [cardStates]);
```

### Accessibility Requirements (WAI-ARIA Accordion)

```tsx
// Required ARIA attributes for accordion pattern
<div role="region" aria-labelledby={`section-${id}-header`}>
  <button
    id={`section-${id}-header`}
    aria-expanded={isExpanded}
    aria-controls={`section-${id}-content`}
  />
  <div
    id={`section-${id}-content`}
    role="region"
    aria-labelledby={`section-${id}-header`}
    hidden={!isExpanded}
  />
</div>

// Modal focus trap (use existing Dialog from Shadcn)
<Dialog>
  <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
    {/* Focus trap handled automatically by Radix */}
  </DialogContent>
</Dialog>
```

### Reduced Motion Support

```tsx
// Check user preference
const prefersReducedMotion = usePrefersReducedMotion();

// Apply accordingly
<motion.div
  animate={{ height: isExpanded ? 'auto' : 0 }}
  transition={prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 200, damping: 25 }
  }
/>
```

### Security Considerations

- **XSS via localStorage**: Report data should be sanitized before rendering (existing TODO-014)
- **Reference URLs**: Validate `Reference.url` fields before rendering as links
- **Modal escape handling**: Use Radix Dialog which handles this securely

---

## Overview

The current Example Reports section displays full reports inline, creating a 15+ page scroll experience that can overwhelm visitors. This feature introduces a **progressive disclosure pattern** with:

- **Gallery view**: 4 report cards (Carbon Removal, Green H2, Materials, Energy)
- **Section previews**: 8-10 cards showing headlines + key metrics per report
- **Inline expansion**: Accordion behavior with spring animations
- **Full report modal**: BrandSystemReport in modal for deep exploration
- **Exit ramp CTA**: Conversion point after demonstrating value

---

## Problem Statement

**Current state**: The Example Reports section uses `ExampleReportsFull` which renders the complete `BrandSystemReport` inline. While this shows report depth, it:

1. Creates cognitive overload with 15+ pages of content
2. Buries the CTA at the very bottom
3. Makes it hard for users to quickly assess report quality
4. Doesn't let users explore specific sections of interest

**User need**: Visitors want to understand what a Sparlo report contains and judge its quality, without committing to reading everything. They need progressive disclosure that:
- Shows breadth (all sections at a glance)
- Demonstrates depth (one section expanded by default)
- Enables exploration (expand any section)
- Provides escape hatch (full report modal)
- Drives action (CTA prominently placed)

---

## Proposed Solution

### Component Architecture

```
ShowcaseGallery/
├── showcase-gallery.tsx          # Main container + state management
├── report-tab-bar.tsx            # Sticky tabs for 4 reports
├── section-cards-grid.tsx        # Grid of 8-10 section preview cards
├── section-card.tsx              # Individual card with expand trigger
├── expanded-section.tsx          # Animated section content
├── full-report-modal.tsx         # Modal wrapper for BrandSystemReport
└── exit-ramp-cta.tsx             # Conversion CTA component
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ShowcaseGallery                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ State:                                                    │   │
│  │  - activeReportId: 'carbon-removal' | 'green-h2' | ...   │   │
│  │  - expandedSectionId: 'executive-summary' | ...          │   │
│  │  - isModalOpen: boolean                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│              ┌───────────────┴───────────────┐                  │
│              ▼                               ▼                   │
│  ┌────────────────────┐          ┌─────────────────────┐        │
│  │   ReportTabBar     │          │  SectionCardsGrid   │        │
│  │  (sticky nav)      │          │  (8-10 cards)       │        │
│  │                    │          │                     │        │
│  │  Props:            │          │  Props:             │        │
│  │  - reports[]       │          │  - sections[]       │        │
│  │  - activeId        │          │  - expandedId       │        │
│  │  - onSelect        │          │  - onExpand         │        │
│  └────────────────────┘          │  - onViewFull       │        │
│                                  └─────────────────────┘        │
│                                             │                    │
│                              ┌──────────────┴──────────────┐    │
│                              ▼                              ▼    │
│                  ┌─────────────────┐            ┌───────────┐   │
│                  │  SectionCard    │            │ Expanded  │   │
│                  │  (collapsed)    │            │ Section   │   │
│                  └─────────────────┘            └───────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    FullReportModal                        │   │
│  │  - Uses existing BrandSystemReport                       │   │
│  │  - Props: showToc={true}, hasAppSidebar={false}          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Approach (Revised)

> **Note**: This approach incorporates findings from 12 specialized review agents. Key changes from original: use Shadcn primitives, reuse existing section components, simplified file structure.

### Phase 1: Types & State Hook

**Goal**: Create type-safe foundation with discriminated unions and state machine

#### 1.1 Types with Discriminated Unions

```tsx
// showcase-gallery/types.ts
import type { HybridReportData } from '@/app/app/reports/[id]/_components/brand-system/types';

// Report configuration type
export interface ReportConfig {
  id: ReportId;
  title: string;
  shortTitle: string;
  hybridData: HybridReportData;
}

// Discriminated union for type-safe report selection
export type ReportId = 'carbon-removal' | 'green-h2' | 'materials' | 'energy';

// Section IDs derived from HybridReportData keys
export type SectionId =
  | 'executive-summary'
  | 'problem-analysis'
  | 'constraints'
  | 'innovation-analysis'
  | 'solution-concepts'
  | 'innovation-concepts'
  | 'frontier-tech'
  | 'risks'
  | 'self-critique'
  | 'recommendation';

// Card animation state machine
export type CardState = 'collapsed' | 'expanding' | 'expanded' | 'collapsing';

// State shape
export interface ShowcaseState {
  activeReportId: ReportId;
  expandedSectionId: SectionId | null;
  cardStates: Record<SectionId, CardState>;
  isModalOpen: boolean;
}
```

#### 1.2 State Management Hook with Race Condition Protection

```tsx
// showcase-gallery/use-showcase-state.ts
'use client';

import { useState, useCallback, useRef } from 'react';
import type { ReportId, SectionId, CardState, ShowcaseState } from './types';

const DEFAULT_SECTION: SectionId = 'executive-summary';
const ANIMATION_DURATION = 300; // ms

function createInitialCardStates(): Record<SectionId, CardState> {
  const sections: SectionId[] = [
    'executive-summary', 'problem-analysis', 'constraints',
    'innovation-analysis', 'solution-concepts', 'innovation-concepts',
    'frontier-tech', 'risks', 'self-critique', 'recommendation'
  ];
  return Object.fromEntries(
    sections.map(id => [id, id === DEFAULT_SECTION ? 'expanded' : 'collapsed'])
  ) as Record<SectionId, CardState>;
}

export function useShowcaseState(initialReport: ReportId) {
  const [state, setState] = useState<ShowcaseState>({
    activeReportId: initialReport,
    expandedSectionId: DEFAULT_SECTION,
    cardStates: createInitialCardStates(),
    isModalOpen: false,
  });

  // Animation lock to prevent race conditions
  const animatingRef = useRef<Set<SectionId>>(new Set());

  const expandSection = useCallback((sectionId: SectionId) => {
    // Block if this section is mid-animation
    if (animatingRef.current.has(sectionId)) return;

    setState(prev => {
      const updates: Partial<ShowcaseState> = {};
      const newCardStates = { ...prev.cardStates };

      // Collapse currently expanded section
      if (prev.expandedSectionId && prev.expandedSectionId !== sectionId) {
        newCardStates[prev.expandedSectionId] = 'collapsing';
        animatingRef.current.add(prev.expandedSectionId);
      }

      // Toggle or expand clicked section
      if (prev.expandedSectionId === sectionId) {
        newCardStates[sectionId] = 'collapsing';
        updates.expandedSectionId = null;
      } else {
        newCardStates[sectionId] = 'expanding';
        updates.expandedSectionId = sectionId;
      }
      animatingRef.current.add(sectionId);

      // Clear animation state after duration
      setTimeout(() => {
        animatingRef.current.delete(sectionId);
        if (prev.expandedSectionId) {
          animatingRef.current.delete(prev.expandedSectionId);
        }
        setState(s => ({
          ...s,
          cardStates: Object.fromEntries(
            Object.entries(s.cardStates).map(([id, state]) =>
              [id, state === 'expanding' ? 'expanded' :
                   state === 'collapsing' ? 'collapsed' : state]
            )
          ) as Record<SectionId, CardState>,
        }));
      }, ANIMATION_DURATION);

      return { ...prev, ...updates, cardStates: newCardStates };
    });
  }, []);

  const selectReport = useCallback((reportId: ReportId) => {
    setState(prev => ({
      ...prev,
      activeReportId: reportId,
      expandedSectionId: DEFAULT_SECTION,
      cardStates: createInitialCardStates(),
    }));
  }, []);

  const openModal = useCallback(() => {
    setState(prev => ({ ...prev, isModalOpen: true }));
  }, []);

  const closeModal = useCallback(() => {
    setState(prev => ({ ...prev, isModalOpen: false }));
  }, []);

  return {
    state,
    actions: { expandSection, selectReport, openModal, closeModal },
  };
}
```

### Phase 2: Section Card with Shadcn Accordion

**Goal**: Use Shadcn Accordion primitive for accessible expand/collapse

#### 2.1 Section Card Component

```tsx
// showcase-gallery/section-card.tsx
'use client';

import { memo } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@kit/ui/cn';
import type { SectionId, CardState } from './types';

interface SectionCardProps {
  id: SectionId;
  title: string;
  headline: string;
  metrics: Array<{ label: string; value: string | number }>;
  cardState: CardState;
  children: React.ReactNode;
}

export const SectionCard = memo(function SectionCard({
  id,
  title,
  headline,
  metrics,
  cardState,
  children,
}: SectionCardProps) {
  const isExpanded = cardState === 'expanded' || cardState === 'expanding';

  return (
    <Accordion.Item
      value={id}
      className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
    >
      <Accordion.Header>
        <Accordion.Trigger
          className={cn(
            'w-full px-6 py-5 text-left',
            'flex items-start justify-between gap-4',
            'transition-colors duration-200',
            'hover:bg-zinc-50/50',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900',
            '[&[data-state=open]>div:last-child]:rotate-180'
          )}
        >
          <div className="flex-1 min-w-0">
            <span className="text-[13px] font-semibold tracking-[0.06em] uppercase text-zinc-500">
              {title}
            </span>
            <p className="mt-1.5 text-[15px] leading-snug text-zinc-900 line-clamp-2">
              {headline}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {metrics.map((metric, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500"
                >
                  <span className="font-medium text-zinc-700">{metric.value}</span>
                  <span>{metric.label}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0 mt-1 transition-transform duration-300">
            <ChevronDown className="h-5 w-5 text-zinc-400" />
          </div>
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Content
        className={cn(
          'overflow-hidden',
          'data-[state=open]:animate-accordion-down',
          'data-[state=closed]:animate-accordion-up'
        )}
      >
        <div className="px-6 pb-6 pt-2 border-t border-zinc-100">
          {children}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
});
```

### Phase 3: Report Tabs with Radix Tabs

```tsx
// showcase-gallery/report-tabs.tsx
'use client';

import { memo } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { cn } from '@kit/ui/cn';
import type { ReportId } from './types';

interface ReportTabsProps {
  reports: Array<{ id: ReportId; title: string; shortTitle: string }>;
  activeId: ReportId;
  onSelect: (id: ReportId) => void;
}

export const ReportTabs = memo(function ReportTabs({
  reports,
  activeId,
  onSelect,
}: ReportTabsProps) {
  return (
    <Tabs.Root value={activeId} onValueChange={(v) => onSelect(v as ReportId)}>
      <Tabs.List
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-zinc-200"
        aria-label="Select a report"
      >
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-3">
            {reports.map((report) => {
              const isActive = activeId === report.id;
              return (
                <Tabs.Trigger
                  key={report.id}
                  value={report.id}
                  className={cn(
                    'relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap',
                    'transition-colors duration-150',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900',
                    isActive
                      ? 'text-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                  )}
                >
                  <span className="hidden sm:inline">{report.title}</span>
                  <span className="sm:hidden">{report.shortTitle}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeReportIndicator"
                      className="absolute inset-0 bg-zinc-100 rounded-lg -z-10"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Tabs.Trigger>
              );
            })}
          </div>
        </div>
      </Tabs.List>
    </Tabs.Root>
  );
});
```

### Phase 4: Section Content (Reusing Existing Components)

**CRITICAL**: Instead of creating 10 new content renderers, add `variant` prop to existing section components.

```tsx
// Modify existing: brand-system/sections/executive-summary-section.tsx
// ADD this prop to the interface:
interface ExecutiveSummarySectionProps {
  data: HybridReportData['executive_summary'];
  variant?: 'full' | 'preview';  // NEW
}

export function ExecutiveSummarySection({
  data,
  variant = 'full',
}: ExecutiveSummarySectionProps) {
  // Preview: show condensed version
  if (variant === 'preview') {
    return (
      <div className="space-y-4">
        <ViabilityBadge viability={data.viability} label={data.viability_label} />
        <p className="text-[17px] leading-relaxed text-zinc-700">
          {data.narrative_lead}
        </p>
        <div className="border-l-2 border-zinc-900 pl-4">
          <p className="text-[15px] font-medium text-zinc-900">
            Primary Recommendation
          </p>
          <p className="mt-1 text-[15px] text-zinc-600">
            {data.primary_recommendation}
          </p>
        </div>
      </div>
    );
  }

  // Full: existing implementation unchanged
  return (
    // ... existing full implementation
  );
}
```

**Apply this pattern to all 10 section components**:
1. `executive-summary-section.tsx`
2. `problem-analysis-section.tsx`
3. `constraints-section.tsx`
4. `innovation-analysis-section.tsx`
5. `solution-concepts-section.tsx`
6. `innovation-portfolio-section.tsx`
7. `frontier-tech-section.tsx`
8. `risks-section.tsx`
9. `self-critique-section.tsx`
10. `recommendation-section.tsx`

### Phase 5: Main Gallery Component (Revised)

**Goal**: Compose all components using the state hook

```tsx
// showcase-gallery/showcase-gallery.tsx
'use client';

import { Suspense, lazy, useMemo } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { AnimatePresence, motion, LazyMotion, domAnimation } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@kit/ui/shadcn/dialog';
import { useShowcaseState } from './use-showcase-state';
import { ReportTabs } from './report-tabs';
import { SectionCard } from './section-card';
import { REPORTS_CONFIG, SECTION_CONFIG } from './config';
import type { ReportId, SectionId } from './types';

// Lazy load BrandSystemReport (heavy component)
const BrandSystemReport = lazy(() =>
  import('@/app/app/reports/[id]/_components/brand-system/brand-system-report')
    .then(m => ({ default: m.BrandSystemReport }))
);

// Preload on hover for faster modal open
function preloadBrandSystemReport() {
  import('@/app/app/reports/[id]/_components/brand-system/brand-system-report');
}

export function ShowcaseGallery() {
  const { state, actions } = useShowcaseState('carbon-removal');

  const activeReport = useMemo(
    () => REPORTS_CONFIG.find(r => r.id === state.activeReportId),
    [state.activeReportId]
  );

  if (!activeReport) return null;

  return (
    <LazyMotion features={domAnimation}>
      <section className="py-20 bg-zinc-50/50">
        <div className="max-w-4xl mx-auto px-4">
          {/* Section Header */}
          <header className="text-center mb-12">
            <h2 className="text-[36px] font-semibold tracking-tight text-zinc-900">
              Example Reports
            </h2>
            <p className="mt-4 text-[18px] text-zinc-600 max-w-2xl mx-auto">
              Explore the depth and rigor of Sparlo's analysis across different industries.
            </p>
          </header>

          {/* Report Tabs */}
          <ReportTabs
            reports={REPORTS_CONFIG.map(r => ({
              id: r.id,
              title: r.title,
              shortTitle: r.shortTitle,
            }))}
            activeId={state.activeReportId}
            onSelect={actions.selectReport}
          />

          {/* Section Cards Accordion */}
          <AnimatePresence mode="wait">
            <motion.div
              key={state.activeReportId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-8"
            >
              <Accordion.Root
                type="single"
                value={state.expandedSectionId ?? undefined}
                onValueChange={(v) => actions.expandSection(v as SectionId)}
                collapsible
                className="space-y-4"
              >
                {SECTION_CONFIG.map((section) => {
                  const sectionData = activeReport.hybridData[section.dataKey];
                  const SectionComponent = section.Component;

                  return (
                    <SectionCard
                      key={section.id}
                      id={section.id}
                      title={section.title}
                      headline={section.getHeadline(activeReport.hybridData)}
                      metrics={section.getMetrics(activeReport.hybridData)}
                      cardState={state.cardStates[section.id]}
                    >
                      <SectionComponent data={sectionData} variant="preview" />
                    </SectionCard>
                  );
                })}
              </Accordion.Root>
            </motion.div>
          </AnimatePresence>

          {/* View Full Report Button */}
          <div className="mt-8 text-center">
            <button
              onClick={actions.openModal}
              onMouseEnter={preloadBrandSystemReport}
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-lg text-[15px] font-medium hover:bg-zinc-800 transition-colors"
            >
              View Full Report
            </button>
          </div>

          {/* Exit Ramp CTA (inlined - not worth separate file) */}
          <div className="mt-16 relative rounded-2xl bg-zinc-900 p-8 md:p-12 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-10%,_#fff_0%,_transparent_50%)]" />
            </div>
            <div className="relative">
              <h3 className="text-[28px] md:text-[32px] font-semibold text-white">
                Ready for reports like these?
              </h3>
              <p className="mt-3 text-[17px] text-zinc-300 max-w-lg mx-auto">
                Get AI-powered analysis for your toughest technical challenges.
                From problem diagnosis to implementation roadmap.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/auth/sign-up"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-zinc-900 rounded-lg text-[15px] font-semibold hover:bg-zinc-100 transition-colors"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-8 py-4 text-white border border-zinc-700 rounded-lg text-[15px] font-medium hover:bg-zinc-800 transition-colors"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Full Report Modal (using Shadcn Dialog) */}
        <Dialog open={state.isModalOpen} onOpenChange={(open) => !open && actions.closeModal()}>
          <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
              <DialogTitle>{activeReport.title}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading report...</div>}>
                <BrandSystemReport
                  reportData={activeReport.hybridData}
                  showToc={true}
                  showActions={false}
                  hasAppSidebar={false}
                  compactTitle={true}
                />
              </Suspense>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </LazyMotion>
  );
}
```

### Phase 6: Section Configuration Registry

**Goal**: Type-safe mapping from section IDs to components and data extractors

```tsx
// showcase-gallery/config.ts
import type { HybridReportData } from '@/app/app/reports/[id]/_components/brand-system/types';
import type { SectionId, ReportConfig } from './types';

// Import existing section components (will add variant prop)
import { ExecutiveSummarySection } from '@/app/app/reports/[id]/_components/brand-system/sections/executive-summary-section';
import { ProblemAnalysisSection } from '@/app/app/reports/[id]/_components/brand-system/sections/problem-analysis-section';
// ... other section imports

// Report data imports
import { carbonRemovalHybridData } from '@/app/(marketing)/_components/example-reports/carbon-removal-hybrid-data';
// ... other report data imports

export const REPORTS_CONFIG: ReportConfig[] = [
  {
    id: 'carbon-removal',
    title: 'Carbon Removal Technology',
    shortTitle: 'Carbon',
    hybridData: carbonRemovalHybridData,
  },
  {
    id: 'green-h2',
    title: 'Green Hydrogen Production',
    shortTitle: 'Green H2',
    hybridData: greenH2HybridData,
  },
  // ... other reports
];

interface SectionConfigItem {
  id: SectionId;
  title: string;
  dataKey: keyof HybridReportData;
  Component: React.ComponentType<{ data: unknown; variant?: 'full' | 'preview' }>;
  getHeadline: (data: HybridReportData) => string;
  getMetrics: (data: HybridReportData) => Array<{ label: string; value: string | number }>;
}

export const SECTION_CONFIG: SectionConfigItem[] = [
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    dataKey: 'executive_summary',
    Component: ExecutiveSummarySection,
    getHeadline: (d) => d.executive_summary.narrative_lead.split('.')[0] + '.',
    getMetrics: (d) => [{ label: 'viability', value: d.executive_summary.viability_label }],
  },
  {
    id: 'problem-analysis',
    title: 'Problem Analysis',
    dataKey: 'problem_analysis',
    Component: ProblemAnalysisSection,
    getHeadline: (d) => d.problem_analysis.whats_wrong.prose.split('.')[0] + '.',
    getMetrics: (d) => [{ label: 'insight', value: d.problem_analysis.first_principles_insight.headline }],
  },
  // ... remaining 8 sections with same pattern
];
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] Gallery displays 4 report tabs (Carbon Removal, Green H2, Materials, Energy)
- [ ] Clicking a report tab switches the displayed section cards
- [ ] Executive Summary is expanded by default when a report is selected
- [ ] Clicking "Expand" on a card opens that section with spring animation
- [ ] Expanding one section automatically collapses any previously expanded section
- [ ] "View Full Report" button opens modal with complete BrandSystemReport
- [ ] Modal can be closed via X button, backdrop click, or Escape key
- [ ] Exit ramp CTA links to `/auth/sign-up`
- [ ] Tab bar becomes sticky when scrolling past it

### Non-Functional Requirements

- [ ] Spring animations complete in ~300ms with smooth easing
- [ ] No layout shifts during expand/collapse transitions
- [ ] Mobile-responsive: cards stack vertically on screens < 640px
- [ ] Tab bar scrolls horizontally on mobile if tabs overflow
- [ ] Respects `prefers-reduced-motion` by disabling animations
- [ ] All interactive elements are keyboard accessible
- [ ] ARIA attributes properly applied for accordion pattern

### Quality Gates

- [ ] TypeScript strict mode passes with no errors
- [ ] Lighthouse accessibility score ≥ 95
- [ ] No hydration mismatches in client components
- [ ] E2E tests cover accordion behavior and modal interactions

---

## Risk Analysis & Mitigation (Enhanced)

| Risk | Severity | Mitigation | Research Source |
|------|----------|------------|-----------------|
| Animation performance on low-end devices | Medium | Use `LazyMotion` + `domAnimation` (34kb → 4.6kb); CSS transitions for simple fades; reserve springs for layoutId only | Performance Oracle |
| Rapid clicking during animations | High | Per-section state machine with animation lock via `useRef`; ignore clicks on sections in 'expanding'/'collapsing' state | Frontend Races Review |
| Non-null assertion runtime errors | Medium | Use discriminated unions for section types; safe find with fallback instead of `!` operator | TypeScript Review |
| Modal focus management timing | Medium | Use Shadcn Dialog (Radix primitive) which handles focus trap automatically; no custom implementation | Accessibility Research |
| XSS via report data | Low | Existing TODO-014 addresses this; ensure DOMPurify applied before rendering user content | Security Sentinel |
| 10 duplicate content renderers | High | **ELIMINATED**: Reuse existing section components with `variant="preview"` prop | Architecture Strategist |
| Mobile sticky header conflicts | Low | Test with existing page navigation; adjust z-index as needed | - |
| Bundle size bloat | Medium | `LazyMotion` + lazy-loaded `BrandSystemReport` modal; preload on hover | Performance Oracle |
| Reduced motion not respected | Medium | `usePrefersReducedMotion` hook; instant transitions when enabled | Accessibility Research |

---

## Files to Create/Modify (Revised)

> **Simplified from 18 files to 5 new files + 10 modified files**

### New Files (5 total)

```
apps/web/app/(marketing)/_components/showcase-gallery/
├── showcase-gallery.tsx      # Main container (160 lines)
├── use-showcase-state.ts     # State hook with race condition protection (80 lines)
├── section-card.tsx          # Card component using Radix Accordion (50 lines)
├── report-tabs.tsx           # Tab navigation using Radix Tabs (40 lines)
├── config.ts                 # Reports + section configuration registry (100 lines)
└── types.ts                  # Discriminated unions, state types (30 lines)
```

**Total: ~460 lines of new code** (vs ~900+ in original plan)

### Modified Files (10 section components)

Add `variant?: 'full' | 'preview'` prop to each existing section component:

```
apps/web/app/app/reports/[id]/_components/brand-system/sections/
├── executive-summary-section.tsx    # +30 lines for preview variant
├── problem-analysis-section.tsx     # +25 lines for preview variant
├── constraints-section.tsx          # +20 lines for preview variant
├── innovation-analysis-section.tsx  # +20 lines for preview variant
├── solution-concepts-section.tsx    # +25 lines for preview variant
├── innovation-portfolio-section.tsx # +25 lines for preview variant
├── frontier-tech-section.tsx        # +20 lines for preview variant
├── risks-section.tsx                # +20 lines for preview variant
├── self-critique-section.tsx        # +20 lines for preview variant
└── recommendation-section.tsx       # +15 lines for preview variant
```

### Integration Point

```
apps/web/app/(marketing)/_components/example-reports/
└── example-reports-section.tsx  # Replace ExampleReportsFull with ShowcaseGallery
```

### Optional: Additional Report Data Files

If other example reports don't exist yet:

```
apps/web/app/(marketing)/_components/example-reports/
├── green-h2-hybrid-data.ts       # New
├── materials-hybrid-data.ts      # New
└── energy-hybrid-data.ts         # New
```

---

## References

### Internal
- `apps/web/app/(marketing)/_components/example-reports/example-reports-full.tsx` - Current implementation
- `apps/web/app/(marketing)/_components/example-reports/carbon-removal-hybrid-data.ts` - Report data structure
- `apps/web/app/app/reports/[id]/_components/brand-system/brand-system-report.tsx` - Full report renderer
- `apps/web/app/app/reports/[id]/_components/brand-system/primitives.tsx` - Reusable UI primitives
- `docs/SPARLO-DESIGN-SYSTEM.md` - Design tokens and patterns

### External
- [Radix UI Accordion](https://www.radix-ui.com/primitives/docs/components/accordion) - Accessible accordion pattern
- [Framer Motion AnimatePresence](https://www.framer.com/motion/animate-presence/) - Enter/exit animations
- [WAI-ARIA Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) - Accessibility requirements

---

## 📋 Summary: Key Decisions from Research

### Architecture Decisions
| Decision | Original Plan | Revised (Post-Research) | Rationale |
|----------|--------------|-------------------------|-----------|
| Section content renderers | 10 new files | Reuse existing + add variant prop | Zero duplication, single source of truth |
| Modal implementation | Custom full-report-modal.tsx | Shadcn Dialog | Accessible by default, less code |
| Accordion implementation | Custom with Framer Motion | Radix Accordion primitive | Built-in accessibility, keyboard nav |
| Tab implementation | Custom report-tab-bar.tsx | Radix Tabs primitive | WAI-ARIA compliant out of box |
| Exit Ramp CTA | Separate component | Inline in main component | Not worth file overhead |

### Performance Decisions
| Decision | Original | Revised | Impact |
|----------|----------|---------|--------|
| Motion library | Full framer-motion (34kb) | LazyMotion + domAnimation | 78% bundle reduction |
| Animation type | Springs everywhere | CSS for fades, spring for layoutId only | CPU savings |
| Modal loading | Eager | Lazy + preload on hover | Faster initial load |
| Re-renders | Unoptimized | React.memo + stable callbacks | Fewer re-renders |

### Safety Decisions
| Decision | Issue Addressed | Solution |
|----------|-----------------|----------|
| Type safety | Non-null assertions crash | Discriminated unions + safe fallbacks |
| Race conditions | Rapid click state corruption | Animation lock with useRef |
| Focus management | Modal focus timing | Use Radix Dialog (handles automatically) |
| Reduced motion | Accessibility violation | usePrefersReducedMotion hook |

---

## Implementation Order (Recommended)

1. **Types & State Hook** (Phase 1) - Foundation, no dependencies
2. **Section Card** (Phase 2) - Uses types from Phase 1
3. **Report Tabs** (Phase 3) - Parallel to Phase 2
4. **Add variant prop to existing section components** (Phase 4) - Can start in parallel
5. **Configuration registry** (Phase 6) - After section components updated
6. **Main gallery component** (Phase 5) - Composes all pieces
7. **Integration** - Replace ExampleReportsFull with ShowcaseGallery

**Estimated implementation time**: Focus on quality, not speed. Each phase should typecheck before moving on.
