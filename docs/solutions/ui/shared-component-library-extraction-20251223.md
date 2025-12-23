---
module: Sparlo Web
date: 2025-12-23
problem_type: ui_bug
component: frontend_stimulus
symptoms:
  - "Duplicate badge components across report sections"
  - "Inconsistent styling between similar UI elements"
  - "Large section files with repeated UI patterns"
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags: [react, components, ui, refactoring, design-system]
---

# Shared Component Library Extraction for Report UI

## Problem

Report section components had duplicated UI elements (badges, cards, lists, tables) with slight variations. This led to inconsistent styling, maintenance burden, and bloated section files.

## Environment

- Module: Sparlo Web - Report Display
- Framework: Next.js 16, React 19, Tailwind CSS
- Date: 2025-12-23

## Symptoms

- Multiple implementations of confidence badges
- Repeated card patterns in different sections
- Inconsistent spacing/colors across sections
- ~300+ lines of UI code duplicated per section
- Difficult to update styling consistently

## What Didn't Work

**Direct solution:** Systematic extraction identified during code review.

## Solution

### Created Shared Component Structure

```
reports/[id]/_components/report/shared/
├── badges/
│   ├── index.ts
│   ├── confidence-badge.tsx
│   ├── impact-badge.tsx
│   ├── likelihood-badge.tsx
│   ├── status-badge.tsx
│   ├── track-badge.tsx
│   └── viability-badge.tsx
├── cards/
│   ├── index.ts
│   ├── base-card.tsx
│   ├── innovation-concept-card.tsx
│   ├── insight-card.tsx
│   ├── recommendation-card.tsx
│   ├── root-cause-card.tsx
│   ├── solution-concept-card.tsx
│   └── technology-card.tsx
├── lists/
│   ├── index.ts
│   ├── bullet-list.tsx
│   ├── feature-list.tsx
│   └── key-insights-list.tsx
├── tables/
│   ├── index.ts
│   ├── comparison-table.tsx
│   └── constraints-table.tsx
├── report-icon.tsx
├── section-header.tsx
└── section-skeleton.tsx
```

### Badge Component Pattern

```typescript
// badges/viability-badge.tsx
import { cn } from '@kit/ui/utils';
import type { ViabilityVerdictType } from '../../../../_lib/schema/sparlo-report.schema';

interface ViabilityBadgeProps {
  viability: ViabilityVerdictType;
  label?: string;
  className?: string;
}

const viabilityConfig = {
  GREEN: {
    container: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    defaultLabel: 'Viable',
  },
  YELLOW: {
    container: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    defaultLabel: 'Conditional',
  },
  RED: {
    container: 'bg-rose-50 border-rose-200',
    dot: 'bg-rose-500',
    text: 'text-rose-700',
    defaultLabel: 'Not Viable',
  },
} as const;

export function ViabilityBadge({ viability, label, className }: ViabilityBadgeProps) {
  const config = viabilityConfig[viability] ?? viabilityConfig.YELLOW;

  return (
    <span className={cn(
      'inline-flex items-center gap-2 rounded-full border px-3 py-1',
      config.container,
      className
    )}>
      <span className={cn('h-2 w-2 rounded-full', config.dot)} />
      <span className={cn('text-sm font-medium', config.text)}>
        {label ?? config.defaultLabel}
      </span>
    </span>
  );
}
```

### Index File Pattern

```typescript
// badges/index.ts
export { ConfidenceBadge } from './confidence-badge';
export { ImpactBadge } from './impact-badge';
export { LikelihoodBadge } from './likelihood-badge';
export { StatusBadge } from './status-badge';
export { TrackBadge } from './track-badge';
export { ViabilityBadge } from './viability-badge';
```

### Section Usage

```typescript
// sections/executive-summary.tsx
import { ViabilityBadge } from '../shared/badges/viability-badge';
import { SectionHeader } from '../shared/section-header';
import { SectionEmptyState } from '../shared/section-skeleton';

export function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
  if (!data) {
    return (
      <section id="executive-summary" className="space-y-8">
        <SectionHeader title="Executive Summary" icon={FileText} />
        <SectionEmptyState message="Executive summary being prepared" />
      </section>
    );
  }
  // ... render with shared components
}
```

## Why This Works

1. **Single Source of Truth**: Each UI element defined once
2. **Consistent Styling**: All instances use same colors/spacing
3. **Easy Updates**: Change once, reflected everywhere
4. **Smaller Section Files**: Focus on data rendering, not UI details
5. **Type Safety**: Shared props interfaces

## Prevention

- **Component Threshold**: If a UI pattern appears 2+ times, extract it
- **Directory Structure**: Use `shared/` directory for cross-section components
- **Index Files**: Always create index.ts for clean imports
- **Config Objects**: Use config objects for variants (colors, labels)
- **Empty States**: Include empty/loading states in shared components

## Metrics

| Metric | Before | After |
|--------|--------|-------|
| Badge implementations | 6 duplicates | 1 each |
| Card implementations | 4+ duplicates | 1 each |
| Avg section file size | ~400 lines | ~150 lines |
| Total shared components | 0 | 24 |

## Related Issues

- See also: [design-system-extraction-pattern-20241222.md](../architecture/design-system-extraction-pattern-20241222.md) - Initial Aura design system extraction
- See also: [aura-inspired-redesign.md](../ui/aura-inspired-redesign.md) - Aura design language reference
- See also: [structured-executive-summary-rendering.md](../ui/structured-executive-summary-rendering.md) - Component rendering patterns
- See also: [type-extraction-large-components-20251223.md](../best-practices/type-extraction-large-components-20251223.md) - Companion type extraction
- See also: [p1-security-fixes-code-review-20251223.md](../security-issues/p1-security-fixes-code-review-20251223.md) - Related code review fixes
