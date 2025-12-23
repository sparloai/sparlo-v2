# Fix Report Rendering to Match Aura Design

## Overview

Update React report rendering components to match the Aura HTML design templates. This involves refactoring 16+ components across 5 report sections (Problem Analysis, Solution Concepts, Innovation Concepts, Critical Analysis, Frontier Technologies) to implement consistent styling, proper data handling, and graceful degradation for missing data.

## Problem Statement

Current report rendering components don't match the Aura HTML design templates. The visual hierarchy, component styling, and data display patterns need to be aligned with the reference designs while maintaining React Server Component architecture and existing schema validation.

## Reference Files

**Aura HTML Templates Location:**
- Source: User-provided HTML templates in conversation context
- Pages: Problem Analysis, Solution Concepts, Innovation Concepts, Critical Analysis, Frontier Technologies
- Design Owner: Product/Design team sign-off required before completion

**How to Access:**
- Reference the HTML templates provided in the original feature request
- Compare rendered React output side-by-side with HTML reference

## Technical Context

### Current Architecture
- **Framework**: Next.js 16 with React 19, TypeScript
- **Styling**: Tailwind CSS v4 (CSS-based config, not JS)
- **Components**: Shadcn UI (43 components available)
- **Icons**: lucide-react v0.556.0
- **Validation**: Zod schemas in `sparlo-report.schema.ts`
- **Fonts**: Söhne (primary), JetBrains Mono (monospace)
- **Runtime**: React Server Components (default), Client Components when needed

### Key Files
- Report sections: `apps/web/app/home/(user)/reports/[id]/_components/report/sections/`
- Shared components: `apps/web/app/home/(user)/reports/[id]/_components/report/shared/`
- Schema: `apps/web/app/home/(user)/reports/[id]/_lib/schema/sparlo-report.schema.ts`
- Tokens: `apps/web/styles/sparlo-tokens.css`, `apps/web/styles/report-tokens.css`

### Design Token Strategy

**DO NOT create token aliases.** Use existing tokens directly and document the mapping:

| Aura Token | Use This Tailwind Class | Semantic Meaning |
|------------|------------------------|------------------|
| `ink` | `text-zinc-900` | Primary text color |
| `subtle` | `text-zinc-500` | Secondary/muted text |
| `hairline` | `border-zinc-200` | Light borders |
| `canvas` | `bg-zinc-100` | Background surfaces |
| `paper` | `bg-white` | Card backgrounds |

**Status Colors (use Tailwind directly):**
| Status | Background | Text | Border |
|--------|------------|------|--------|
| Success | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` |
| Warning | `bg-amber-50` | `text-amber-700` | `border-amber-200` |
| Error | `bg-rose-50` | `text-rose-700` | `border-rose-200` |
| Info | `bg-blue-50` | `text-blue-700` | `border-blue-200` |

## Component Runtime Strategy

**Server Components (default):**
- All section components (problem-analysis, solution-concepts, etc.)
- All card components
- All table components
- All list components

**Client Components (only when needed):**
- Interactive filters (future)
- Expandable/collapsible sections (if added)
- Copy-to-clipboard buttons (if added)

## Implementation Plan

### Phase 1: Shared Components (Foundation)

#### 1.1 File Organization

**Restructure shared components - one component per file:**

```
shared/
├── badges/
│   ├── confidence-badge.tsx
│   ├── viability-badge.tsx
│   ├── track-badge.tsx
│   ├── likelihood-badge.tsx
│   ├── impact-badge.tsx
│   ├── status-badge.tsx
│   └── index.ts                # Re-exports
├── cards/
│   ├── base-card.tsx           # Base styling primitive
│   ├── solution-concept-card.tsx
│   ├── innovation-concept-card.tsx
│   ├── recommendation-card.tsx
│   ├── root-cause-card.tsx
│   ├── insight-card.tsx
│   ├── technology-card.tsx
│   └── index.ts
├── tables/
│   ├── constraints-table.tsx
│   ├── comparison-table.tsx
│   └── index.ts
├── lists/
│   ├── key-insights-list.tsx
│   ├── feature-list.tsx
│   ├── bullet-list.tsx
│   └── index.ts
├── section-header.tsx
└── report-icon.tsx             # Icon wrapper for consistency
```

#### 1.2 SectionHeader Component
**File:** `shared/section-header.tsx`

**Changes:**
- Update to match Aura pattern: `text-2xl font-semibold text-zinc-900 mb-6`
- Support optional icon prop using Lucide React
- Support optional badge/count display

**Aura Reference:**
```html
<h2 class="text-2xl font-semibold text-ink mb-6">Problem Analysis</h2>
```

#### 1.3 ReportIcon Wrapper (New)
**File:** `shared/report-icon.tsx`

**Purpose:** Consistent icon rendering with Aura aesthetics

```tsx
import { LucideIcon } from 'lucide-react';
import { cn } from '@kit/ui/utils';

interface ReportIconProps {
  icon: LucideIcon;
  className?: string;
  label?: string;
}

export function ReportIcon({ icon: Icon, className, label }: ReportIconProps) {
  return (
    <Icon
      className={cn("w-4 h-4", className)}
      strokeWidth={1.5}
      aria-label={label}
      aria-hidden={!label}
    />
  );
}
```

#### 1.4 Badge Components

**Files:** `shared/badges/*.tsx`

**Components:**
- `ConfidenceBadge`: emerald/amber/rose based on High/Medium/Low
- `ViabilityBadge`: emerald/amber/rose percentage-based
- `TrackBadge`: violet-based track indicator
- `LikelihoodBadge`: percentage with color scale
- `ImpactBadge`: severity indicator (high/medium/low)
- `StatusBadge`: general status indicator

**Aura Pattern:**
```html
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
  <svg class="w-3.5 h-3.5">...</svg>
  High Confidence
</span>
```

#### 1.5 Card Components

**Files:** `shared/cards/*.tsx`

**Base Card Composition Strategy:**

Cards share common styling but have semantic differences. Use a base primitive with variants:

```tsx
// base-card.tsx
interface BaseCardProps {
  variant?: 'default' | 'lead' | 'innovation';
  emphasis?: 'high' | 'subtle';
  children: React.ReactNode;
  className?: string;
}

export function BaseCard({ variant = 'default', emphasis = 'subtle', children, className }: BaseCardProps) {
  return (
    <div className={cn(
      "rounded-xl p-6 space-y-4",
      {
        'bg-white border border-zinc-200': variant === 'default' && emphasis === 'subtle',
        'bg-emerald-50/30 border-2 border-emerald-100': variant === 'lead' && emphasis === 'high',
        'bg-purple-50/30 border-2 border-purple-100': variant === 'innovation' && emphasis === 'high',
      },
      className
    )}>
      {children}
    </div>
  );
}
```

**Semantic Card Components:**
- `SolutionConceptCard` - For solution concepts with viability score
- `InnovationConceptCard` - For innovation concepts with disruption indicator
- `RecommendationCard` - For recommendations with priority
- `RootCauseCard` - For problem analysis root causes
- `InsightCard` - For key insights display
- `TechnologyCard` - For frontier technologies

#### 1.6 Table Components

**Files:** `shared/tables/*.tsx`

- `ConstraintsTable`: Two-column layout for constraints
- `ComparisonTable`: Side-by-side comparison with sticky first column on mobile

**Mobile Strategy for Tables:**
- Use horizontal scroll with sticky first column
- Add visual indicator for scrollable content
- Consider card-based fallback for very small screens

**Pattern:**
```html
<div class="overflow-x-auto">
  <table class="w-full text-sm min-w-[600px]">
    <thead>
      <tr class="border-b border-zinc-200">
        <th class="text-left py-3 px-4 font-medium text-zinc-500 sticky left-0 bg-white">Header</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-zinc-200">
      <tr><td class="py-3 px-4 text-zinc-900">Content</td></tr>
    </tbody>
  </table>
</div>
```

#### 1.7 List Components

**Files:** `shared/lists/*.tsx`

- `KeyInsightsList`: Numbered insights with icons
- `FeatureList`: Checkmark-style feature lists
- `BulletList`: Standard bullet lists with proper styling

### Phase 2: Section Components

#### 2.1 Problem Analysis Section
**File:** `sections/problem-analysis.tsx`

**Updates:**
- Use `RootCauseCard` for each root cause
- Display contributing factors as inline badges
- Show constraints in `ConstraintsTable`
- Graceful degradation with loading/error/empty states

#### 2.2 Solution Concepts Section
**File:** `sections/solution-concepts.tsx`

**Updates:**
- Use `SolutionConceptCard` for each solution
- Display viability score with visual indicator
- Show key features as checkmark list
- Display constraints inline
- Graceful degradation with loading/error/empty states

#### 2.3 Innovation Concepts Section
**File:** `sections/innovation-concepts.tsx`

**Updates:**
- Use `InnovationConceptCard` for concepts
- Show disruption potential indicator
- Display technology requirements
- Graceful degradation with loading/error/empty states

#### 2.4 Critical Analysis Section
**File:** `sections/critical-analysis.tsx`

**Updates:**
- Use structured cards for each analysis point
- Show impact/likelihood indicators
- Display recommendations with priority badges
- Graceful degradation with loading/error/empty states

#### 2.5 Frontier Technologies Section
**File:** `sections/frontier-technologies.tsx`

**Updates:**
- Use `TechnologyCard` for each technology
- Show maturity level indicator
- Display potential applications
- Graceful degradation with loading/error/empty states

### Phase 3: Graceful Degradation

**Enhanced Pattern with Loading/Error/Empty States:**

```tsx
interface SectionProps {
  data: SectionData | null;
  isLoading?: boolean;
  error?: Error | null;
}

function Section({ data, isLoading, error }: SectionProps) {
  if (isLoading) {
    return <SectionSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-rose-50 rounded-xl border border-rose-200 p-8 text-center">
        <p className="text-rose-700">Unable to load section</p>
      </div>
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="bg-zinc-100 rounded-xl border border-zinc-200 p-8 text-center">
        <p className="text-zinc-500">Section content pending</p>
      </div>
    );
  }

  return <SectionContent data={data} />;
}
```

**Empty State Messages:**
| Section | Message |
|---------|---------|
| Root Causes | "Root cause analysis pending" |
| Solutions | "Solution concepts being developed" |
| Innovations | "Innovation concepts pending" |
| Critical Analysis | "Critical analysis in progress" |
| Technologies | "Technology scan pending" |
| Recommendations | "Recommendations being formulated" |

### Phase 4: Responsive Design

**Breakpoint Strategy:**

| Breakpoint | Layout |
|------------|--------|
| Mobile (<640px) | Single column, stacked cards, horizontal scroll tables |
| Tablet (640-1024px) | 2-column grids for cards |
| Desktop (>1024px) | Multi-column layouts per Aura design |

**Mobile-Specific Patterns:**
- Cards: Stack vertically with full width
- Tables: Horizontal scroll with sticky first column
- Comparison views: Tab-based switching instead of side-by-side
- Typography: Slightly smaller headings

**Implementation:**
```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards */}
</div>
```

### Phase 5: Icon Migration

**Icon Wrapper Usage:**
Replace Iconify icons inline while updating each component. Use the `ReportIcon` wrapper for consistency.

**Icon Mapping (Iconify to Lucide):**
| Aura (Iconify) | Lucide React | Usage |
|----------------|--------------|-------|
| `mdi:target` | `Target` | Goals, objectives |
| `mdi:lightbulb` | `Lightbulb` | Ideas, insights |
| `mdi:check-circle` | `CheckCircle` | Success, completed |
| `mdi:alert-circle` | `AlertCircle` | Warnings |
| `mdi:information` | `Info` | Information |
| `mdi:chart-line` | `TrendingUp` | Trends, growth |
| `mdi:cog` | `Settings` | Configuration |
| `mdi:shield` | `Shield` | Security, protection |
| `mdi:rocket` | `Rocket` | Innovation, launch |
| `mdi:brain` | `Brain` | Intelligence, thinking |

## Component Checklist

| Component | Status | File |
|-----------|--------|------|
| SectionHeader | Update | `shared/section-header.tsx` |
| ReportIcon | Create | `shared/report-icon.tsx` |
| ConfidenceBadge | Update | `shared/badges/confidence-badge.tsx` |
| ViabilityBadge | Update | `shared/badges/viability-badge.tsx` |
| TrackBadge | Update | `shared/badges/track-badge.tsx` |
| LikelihoodBadge | Create | `shared/badges/likelihood-badge.tsx` |
| ImpactBadge | Create | `shared/badges/impact-badge.tsx` |
| StatusBadge | Create | `shared/badges/status-badge.tsx` |
| BaseCard | Create | `shared/cards/base-card.tsx` |
| SolutionConceptCard | Create | `shared/cards/solution-concept-card.tsx` |
| InnovationConceptCard | Create | `shared/cards/innovation-concept-card.tsx` |
| RecommendationCard | Create | `shared/cards/recommendation-card.tsx` |
| RootCauseCard | Create | `shared/cards/root-cause-card.tsx` |
| InsightCard | Create | `shared/cards/insight-card.tsx` |
| TechnologyCard | Create | `shared/cards/technology-card.tsx` |
| ConstraintsTable | Create | `shared/tables/constraints-table.tsx` |
| ComparisonTable | Create | `shared/tables/comparison-table.tsx` |
| KeyInsightsList | Create | `shared/lists/key-insights-list.tsx` |
| FeatureList | Create | `shared/lists/feature-list.tsx` |
| BulletList | Create | `shared/lists/bullet-list.tsx` |
| SectionSkeleton | Create | `shared/section-skeleton.tsx` |
| ProblemAnalysis | Update | `sections/problem-analysis.tsx` |
| SolutionConcepts | Update | `sections/solution-concepts.tsx` |
| InnovationConcepts | Update | `sections/innovation-concepts.tsx` |
| CriticalAnalysis | Update | `sections/critical-analysis.tsx` |
| FrontierTechnologies | Update | `sections/frontier-technologies.tsx` |

## TypeScript Requirements

**Strict Mode Enforcement:**
- All components must pass strict TypeScript checking
- No `any` types allowed
- Use Zod schema types for data props

**Data Prop Patterns:**
```tsx
// Parent handles null - child receives valid data
interface SectionProps {
  data: SectionData;  // Required, parent filters
}

// OR component handles null
interface SectionProps {
  data: SectionData | null;  // Explicit null handling
}
```

**Field-Level Optionals:**
- Use optional chaining for optional fields
- Provide sensible defaults for missing values
- Document which fields can be undefined

## Testing Strategy

### Visual Regression Testing
- **Tool**: Playwright visual comparison
- **Baseline**: Screenshots of Aura HTML templates
- **Test each component** in isolation
- **Test full report** with all sections populated
- **Test empty states** for each section

### Unit Testing
- **Tool**: Vitest + Testing Library
- **Test each shared component with:**
  - Happy path (all data present)
  - Empty data scenarios
  - Partial data scenarios
  - Edge cases (very long text, special characters)

### Type Safety
- Run `pnpm typecheck` - must pass with zero errors
- No `any` types allowed
- All props properly typed from Zod schemas

### Manual Testing Checklist
- [ ] Desktop Chrome (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)
- [ ] Tablet landscape/portrait
- [ ] Dark mode support (if applicable)
- [ ] Print stylesheet (if applicable)

## Schema Change Protocol

**If schema changes during implementation:**

1. Schema changes MUST be communicated before merging
2. Before merging schema changes, run:
   - `pnpm typecheck` across all report components
   - Visual comparison with Aura templates
3. If schema changes during this work:
   - Pause component work
   - Update types first
   - Update affected components
   - Re-test everything

## Migration Strategy

### Phase A: New Components (Non-Breaking)
1. Create new shared components in restructured directories
2. Don't modify existing section components yet
3. Test components in isolation

### Phase B: Incremental Migration
1. Update one section at a time
2. Test each section after update
3. Verify visual match with Aura template

### Phase C: Cleanup
1. Remove unused old components
2. Update all imports
3. Final visual verification

### Rollback Plan
- Keep old components until all sections verified
- Use git branches for incremental changes
- Each section update is a separate commit

## Success Criteria

1. All 5 report sections render identically to Aura HTML templates
2. Empty/missing data displays appropriate fallback UI
3. All TypeScript types pass strict mode (`pnpm typecheck` passes)
4. Responsive layouts work on mobile/tablet/desktop
5. Components are reusable across report modes (Standard, Discovery, Hybrid)
6. Design owner sign-off on visual match

## Dependencies

- Schema fixes happening in parallel (graceful handling of optional fields)
- Tailwind CSS v4 configuration (already set up)
- Lucide React icons (already installed v0.556.0)
- Design owner available for visual sign-off
