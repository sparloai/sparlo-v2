# Report Presentation Craft Improvements

**Type:** Enhancement
**Priority:** High
**Created:** 2025-12-25
**Status:** Planning

## Overview

Transform the Sparlo report presentation from "well-made SaaS" to "craft-obsessed product" by closing the gaps identified in the UX design audit. The goal is to shift perception from "$79/month presentation" to "$199/month premium technical product."

## Problem Statement

The UX audit identified six key gaps undermining premium perception:

1. **Visual Authority**: Playing it safe with generic AI wrapper aesthetic (dark theme + white cards)
2. **Craft Parity**: No micro-interactions, generic loading, default table styling
3. **Density Through Craft**: Density tolerated not elevated
4. **Structural Honesty**: Visual weight doesn't track intellectual importance
5. **Domain Authenticity**: Presentation doesn't match content's gravity
6. **Singular Identity**: No distinctive visual language

**Target Users:**
- Climate tech startup CTOs solving hard physics problems
- Deep tech VCs evaluating 50+ deals/year across unfamiliar domains

**Design Target:** Palantir density + Linear craft. Future-forward, opinionated, not generic.

## Technical Context

### Existing Infrastructure

**Component Libraries:**
- `packages/ui/src/shadcn/` - Shadcn UI components (button, card, table, skeleton, etc.)
- `packages/ui/src/makerkit/` - Makerkit components (data-table, spinner, loading-overlay)
- `packages/ui/src/aura/` - Custom Aura design system (SectionHeader, CardWithHeader, AuraTable)

**Report Components:**
- `apps/web/app/home/(user)/reports/[id]/_components/` - Report section components
- `apps/web/app/home/(user)/_components/processing-screen.tsx` - Current loading implementation
- `apps/web/app/home/(user)/_components/navigation/nav-sidebar.tsx` - Sidebar navigation

**Styling System:**
- Tailwind CSS v4 with CSS-first configuration
- Custom design tokens in `apps/web/styles/sparlo-tokens.css`
- Animation system in `apps/web/styles/sparlo-animations.css`
- Framer Motion already installed and used for animations
- Font: Soehne (sans) and Soehne Mono

**Animation Constants:** `apps/web/app/home/(user)/_lib/animation-constants.ts`
```typescript
EASING = { easeIn, easeOut, easeInOut, custom }
DURATION = { fast: 0.15, normal: 0.3, slow: 0.5 }
STAGGER = { fast: 0.05, normal: 0.08, slow: 0.12 }
```

---

## Implementation Phases

### Phase 1: Foundation (Closes "Craft Parity" gap)

The fastest path from "template" to "crafted." These changes are visible everywhere and immediately shift perception.

#### 1.1 Skeleton Loading States

**Gap:** Single spinner on blank dark screen signals "early stage"

**Files to Modify:**
- `apps/web/app/home/(user)/reports/[id]/loading.tsx` (create)
- `apps/web/app/home/(user)/reports/[id]/_components/report-skeleton.tsx` (create)
- `packages/ui/src/shadcn/skeleton.tsx` (enhance)

**Implementation:**

```tsx
// apps/web/app/home/(user)/reports/[id]/_components/report-skeleton.tsx
'use client';

import { Skeleton } from '@kit/ui/shadcn/skeleton';
import { motion } from 'framer-motion';

export function ReportSkeleton() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar skeleton */}
      <aside className="w-64 border-r border-[--border-subtle] p-6">
        <Skeleton className="h-6 w-32 mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 p-8 space-y-8">
        {/* Title skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Brief card skeleton */}
        <div className="bg-[--surface-elevated] rounded-lg p-6">
          <Skeleton className="h-5 w-20 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>

        {/* Executive summary skeleton */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Recommendation skeleton */}
        <div className="bg-[--surface-elevated] rounded-lg p-6">
          <Skeleton className="h-5 w-48 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </main>
    </div>
  );
}
```

```tsx
// apps/web/app/home/(user)/reports/[id]/loading.tsx
import { ReportSkeleton } from './_components/report-skeleton';

export default function Loading() {
  return <ReportSkeleton />;
}
```

**Acceptance Criteria:**
- [ ] Skeleton mirrors actual report structure (sidebar, title, brief, summary, recommendation)
- [ ] Uses shimmer animation (not pulse) matching design tokens
- [ ] Skeleton appears within 100ms of navigation
- [ ] Smooth transition from skeleton to content (no flash)

---

#### 1.2 Hover States & Micro-interactions

**Gap:** Everything feels static, "generated" rather than "crafted"

**Files to Modify:**
- `apps/web/styles/sparlo-interactions.css` (create)
- `apps/web/app/home/(user)/_components/navigation/nav-sidebar.tsx`
- `packages/ui/src/shadcn/button.tsx`
- `packages/ui/src/shadcn/card.tsx`

**Implementation:**

```css
/* apps/web/styles/sparlo-interactions.css */

/* Premium button interactions */
.btn-premium {
  @apply relative overflow-hidden;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-premium:hover {
  @apply -translate-y-0.5;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.btn-premium:active {
  @apply translate-y-0 scale-[0.98];
}

/* Card hover with controlled lift */
.card-interactive {
  @apply transition-all duration-200 ease-out;
  transform: translateY(0) translateZ(0);
  will-change: transform, box-shadow;
}

.card-interactive:hover {
  transform: translateY(-2px) translateZ(0);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Sidebar navigation item */
.nav-item {
  @apply relative transition-all duration-150;
}

.nav-item::before {
  content: '';
  @apply absolute inset-0 rounded-md bg-violet-500/0 transition-all duration-150;
}

.nav-item:hover::before {
  @apply bg-violet-500/5;
}

.nav-item:hover {
  @apply translate-x-0.5;
}

/* Focus ring for accessibility */
.focus-ring {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[--surface-base];
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .btn-premium,
  .card-interactive,
  .nav-item {
    transition: none;
    transform: none;
  }
}
```

```tsx
// Framer Motion sidebar item enhancement
// apps/web/app/home/(user)/_components/navigation/nav-sidebar.tsx

const navItemVariants = {
  initial: { x: 0, backgroundColor: 'transparent' },
  hover: {
    x: 2,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  tap: { scale: 0.98 }
};

// Usage in component
<motion.a
  href={`/home/reports/${report.id}`}
  variants={navItemVariants}
  initial="initial"
  whileHover="hover"
  whileTap="tap"
  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm"
>
  {/* content */}
</motion.a>
```

**Acceptance Criteria:**
- [ ] All buttons have hover lift (-2px) and press feedback (scale 0.98)
- [ ] Sidebar items have spring animation on hover
- [ ] Cards lift slightly with shadow increase on hover
- [ ] All interactive elements have visible focus states
- [ ] Animations respect `prefers-reduced-motion`

---

#### 1.3 Card Shadows & Depth Hierarchy

**Gap:** White cards on dark background feel flat—"tolerated density" rather than elevated

**Files to Modify:**
- `apps/web/styles/sparlo-tokens.css`
- `packages/ui/src/aura/index.tsx`
- Report section components in `apps/web/app/home/(user)/reports/[id]/_components/report/sections/`

**Implementation:**

```css
/* apps/web/styles/sparlo-tokens.css - Add elevation system */

:root {
  /* Elevation shadows */
  --elevation-0: none;
  --elevation-1: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --elevation-2: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --elevation-3: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --elevation-4: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

  /* Semantic elevation */
  --shadow-card: var(--elevation-1);
  --shadow-card-hover: var(--elevation-2);
  --shadow-section-primary: var(--elevation-2);
  --shadow-section-secondary: var(--elevation-1);
  --shadow-modal: var(--elevation-4);
}

/* Dark mode adjustments */
.dark {
  --elevation-1: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3);
  --elevation-2: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
  --elevation-3: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4);
  --elevation-4: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
}
```

**Elevation Hierarchy for Report:**
| Element | Elevation | Usage |
|---------|-----------|-------|
| Background | 0 | Base surface |
| Brief card (dark) | 1 | Supporting content |
| Executive Summary | 2 | Primary content |
| Primary Recommendation | 3 | Most important, actionable |
| Modals/Overlays | 4 | Highest z-index |

**Acceptance Criteria:**
- [ ] Elevation tokens defined in design system
- [ ] Executive Summary has more prominent shadow than supporting sections
- [ ] Primary Recommendation card has subtle glow effect
- [ ] Dark cards have subtle border (1px zinc-800) for definition
- [ ] Hover states increase elevation by 1 level

---

### Phase 2: Information Density (Closes "Density Through Craft" gap)

Make the data-rich elements feel premium—where the intellectual value is most concentrated.

#### 2.1 Table Styling Overhaul

**Gap:** Tables use browser defaults with no visual distinction for hierarchy

**Files to Modify:**
- `apps/web/styles/report-tables.css`
- `packages/ui/src/aura/index.tsx` (AuraTable component)
- Report sections that use tables

**Implementation:**

```css
/* apps/web/styles/report-tables.css */

.aura-table {
  @apply w-full border-collapse;

  /* Dense spacing */
  --table-header-height: 2.5rem;
  --table-row-height: 3rem;
  --table-cell-padding-x: 1rem;
  --table-cell-padding-y: 0.75rem;
}

.aura-table thead {
  @apply sticky top-0 z-10;
  background: linear-gradient(to bottom, var(--surface-elevated) 0%, var(--surface-elevated) 90%, transparent 100%);
}

.aura-table th {
  @apply text-left text-xs font-semibold uppercase tracking-wider;
  color: var(--text-secondary);
  padding: var(--table-cell-padding-y) var(--table-cell-padding-x);
  height: var(--table-header-height);
  border-bottom: 2px solid var(--border-default);
}

.aura-table td {
  @apply text-sm;
  color: var(--text-primary);
  padding: var(--table-cell-padding-y) var(--table-cell-padding-x);
  height: var(--table-row-height);
  border-bottom: 1px solid var(--border-subtle);
}

/* Row hover state */
.aura-table tbody tr {
  @apply transition-colors duration-100;
}

.aura-table tbody tr:hover {
  background-color: rgba(139, 92, 246, 0.03);
}

/* Alternating row colors (subtle) */
.aura-table tbody tr:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.02);
}

/* Source column styling */
.aura-table .source-link {
  @apply text-xs text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline transition-colors;
}

/* Performance column with inline visualization */
.aura-table .performance-cell {
  @apply flex items-center gap-2;
}

.aura-table .performance-bar {
  @apply h-1.5 rounded-full bg-emerald-500/30;
}

.aura-table .performance-bar-fill {
  @apply h-full rounded-full bg-emerald-500 transition-all duration-300;
}
```

```tsx
// packages/ui/src/aura/index.tsx - Enhanced AuraTable

export function AuraTable({
  columns,
  data,
  caption
}: AuraTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[--border-subtle]">
      <table className="aura-table">
        {caption && (
          <caption className="sr-only">{caption}</caption>
        )}
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td key={col.key} className={col.cellClassName}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Header row has distinct styling (heavier weight, accent border)
- [ ] Row hover state with subtle violet tint
- [ ] Alternating row backgrounds (very subtle)
- [ ] Source links styled as proper citations
- [ ] Sticky headers for tables exceeding viewport
- [ ] Mobile: horizontal scroll with shadow indicators

---

#### 2.2 Section Header Hierarchy

**Gap:** All section headers have same visual prominence regardless of importance

**Files to Modify:**
- `packages/ui/src/aura/index.tsx`
- `apps/web/styles/report-sections.css`
- All report section components

**Implementation:**

```tsx
// packages/ui/src/aura/index.tsx

// Primary sections: Executive Summary, Primary Recommendation
export function PrimarySectionHeader({
  icon: Icon,
  children
}: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {Icon && (
        <div className="p-2 rounded-lg bg-violet-500/10">
          <Icon className="h-5 w-5 text-violet-400" />
        </div>
      )}
      <h2 className="text-xl font-semibold tracking-tight text-[--text-primary]">
        {children}
      </h2>
    </div>
  );
}

// Secondary sections: What's Wrong, Why It's Hard, Constraints
export function SecondarySectionHeader({
  icon: Icon,
  children
}: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon className="h-4 w-4 text-[--text-secondary]" />}
      <h3 className="text-sm font-medium uppercase tracking-wider text-[--text-secondary]">
        {children}
      </h3>
    </div>
  );
}

// Transitional labels: "The bottom line", "Understanding the landscape"
export function TransitionalLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-[--text-muted] uppercase tracking-widest mb-2 opacity-60">
      {children}
    </p>
  );
}
```

**Section Classification:**

| Section | Type | Styling |
|---------|------|---------|
| Executive Summary | Primary | Large text, icon in colored bg, prominent |
| Primary Recommendation | Primary | Large text, icon in colored bg, prominent |
| Brief | Secondary | Uppercase, smaller, muted |
| What's Wrong | Secondary | Uppercase, smaller, with warning icon |
| Why It's Hard | Secondary | Uppercase, smaller, with warning icon |
| Constraints | Secondary | Uppercase, smaller |
| Current State of Art | Secondary | Uppercase, smaller |
| The bottom line | Transitional | Extra small, very muted, no icon |

**Acceptance Criteria:**
- [ ] Two-tier header system implemented (Primary/Secondary)
- [ ] Executive Summary visually prominent (larger, icon badge)
- [ ] Transitional labels very muted (60% opacity)
- [ ] Consistent icon usage per section type

---

#### 2.3 Constraint List Enhancement

**Gap:** Constraint lists are functional but don't feel like a considered design system

**Files to Modify:**
- `apps/web/app/home/(user)/reports/[id]/_components/report/sections/constraints.tsx`
- `packages/ui/src/aura/index.tsx`

**Implementation:**

```tsx
// packages/ui/src/aura/index.tsx

export function ConstraintList({
  type,
  items
}: {
  type: 'hard' | 'soft';
  items: string[]
}) {
  const config = {
    hard: {
      icon: <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />,
      borderColor: 'border-l-red-500/30',
      bgColor: 'bg-red-500/5',
      headerIcon: AlertCircle,
      headerText: 'HARD CONSTRAINTS',
      headerColor: 'text-red-400'
    },
    soft: {
      icon: <div className="w-2 h-2 rounded-full bg-amber-500/60 mt-1.5" />,
      borderColor: 'border-l-amber-500/30',
      bgColor: 'bg-amber-500/5',
      headerIcon: Target,
      headerText: 'SOFT CONSTRAINTS',
      headerColor: 'text-amber-400'
    }
  };

  const { icon, borderColor, bgColor, headerIcon: HeaderIcon, headerText, headerColor } = config[type];

  return (
    <div className={`rounded-lg ${bgColor} border-l-2 ${borderColor} p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <HeaderIcon className={`h-4 w-4 ${headerColor}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${headerColor}`}>
          {headerText}
        </span>
      </div>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3">
            {icon}
            <span className="text-sm text-[--text-primary] leading-relaxed">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Hard constraints: red accent, filled circle icon, red-tinted background
- [ ] Soft constraints: amber accent, different icon, amber-tinted background
- [ ] Left border accent matching constraint type
- [ ] Increased spacing between items (12px)
- [ ] Distinct header styling per constraint type

---

### Phase 3: Polish (Closes "Visual Authority" gap)

Typography and navigation refinement that compounds on Phases 1-2.

#### 3.1 Typography Refinement

**Gap:** Typography is "fine" but not distinctive

**Files to Modify:**
- `apps/web/styles/sparlo-tokens.css`
- `apps/web/styles/report-base.css`

**Implementation:**

```css
/* apps/web/styles/sparlo-tokens.css - Typography scale */

:root {
  /* Type scale (optimized for density) */
  --text-xs: 0.6875rem;    /* 11px - labels, metadata */
  --text-sm: 0.8125rem;    /* 13px - table cells, dense body */
  --text-base: 0.875rem;   /* 14px - default body */
  --text-md: 0.9375rem;    /* 15px - emphasized body */
  --text-lg: 1.125rem;     /* 18px - h4 */
  --text-xl: 1.25rem;      /* 20px - h3 */
  --text-2xl: 1.5rem;      /* 24px - h2 */
  --text-3xl: 1.875rem;    /* 30px - h1 */
  --text-display: 2.25rem; /* 36px - report title */

  /* Line heights (tighter for density) */
  --leading-tight: 1.2;
  --leading-snug: 1.35;
  --leading-normal: 1.5;
  --leading-relaxed: 1.65;

  /* Letter spacing */
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.02em;
  --tracking-wider: 0.05em;
}

/* Section headers - tighter letterspacing */
.section-header-primary {
  font-size: var(--text-xl);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  font-weight: 600;
}

.section-header-secondary {
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-wide);
  font-weight: 600;
  text-transform: uppercase;
}

/* Body text - increased line height */
.body-text {
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  letter-spacing: var(--tracking-normal);
}

/* Math equations - proper rendering */
.math-equation {
  font-family: 'Soehne Mono', 'JetBrains Mono', monospace;
  font-size: var(--text-md);
  background: rgba(139, 92, 246, 0.05);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border-left: 2px solid rgba(139, 92, 246, 0.3);
}

/* Tabular figures for data */
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
```

**Acceptance Criteria:**
- [ ] Section headers have reduced letterspacing (-0.02em)
- [ ] Body text line-height increased to 1.65
- [ ] Math equations have proper mono font and highlight
- [ ] Numbers in tables use tabular figures
- [ ] All typography using design token variables

---

#### 3.2 Sidebar Navigation Polish

**Gap:** Sidebar is functional but feels like a default component

**Files to Modify:**
- `apps/web/app/home/(user)/_components/navigation/nav-sidebar.tsx`
- `apps/web/styles/sparlo-navigation.css` (create)

**Implementation:**

```tsx
// Sidebar with scroll position indicator
// apps/web/app/home/(user)/_components/navigation/nav-sidebar.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function ReportTableOfContents({ sections, activeSection }: TOCProps) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / scrollHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="relative">
      {/* Scroll progress indicator */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[--border-subtle]">
        <motion.div
          className="w-full bg-violet-500"
          style={{ height: `${scrollProgress}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>

      <ul className="space-y-1 pl-4">
        {sections.map((section) => (
          <motion.li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-150
                ${activeSection === section.id
                  ? 'bg-violet-500/10 text-violet-400 font-medium'
                  : 'text-[--text-secondary] hover:text-[--text-primary] hover:bg-[--surface-elevated]'
                }
              `}
            >
              <section.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{section.title}</span>
            </a>
          </motion.li>
        ))}
      </ul>
    </nav>
  );
}
```

**Section Icons Mapping:**
| Section | Icon |
|---------|------|
| Brief | FileText |
| Executive Summary | Sparkles |
| What's Wrong | AlertTriangle |
| Why It's Hard | AlertTriangle |
| Constraints | Target |
| Current State | Database |
| Challenge Frame | Lightbulb |
| Innovation Analysis | Search |
| Solution Concepts | Beaker |
| Recommendation | CheckCircle |
| Risks | Shield |

**Acceptance Criteria:**
- [ ] Scroll progress indicator on left edge
- [ ] Active section highlighted with violet tint
- [ ] Consistent icons for each section type
- [ ] Smooth scroll to section on click
- [ ] Hover state with background highlight

---

#### 3.3 Status Badge System

**Gap:** Status badges are functional but generic

**Files to Modify:**
- `packages/ui/src/aura/index.tsx`
- Report header component

**Implementation:**

```tsx
// packages/ui/src/aura/index.tsx

export function StatusBadge({
  status
}: {
  status: 'complete' | 'processing' | 'failed' | 'uncertain' | 'viable' | 'not-viable'
}) {
  const config = {
    complete: {
      icon: CheckCircle,
      label: 'COMPLETE',
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    processing: {
      icon: Loader2,
      label: 'PROCESSING',
      className: 'bg-violet-500/10 text-violet-400 border-violet-500/20 animate-pulse'
    },
    failed: {
      icon: XCircle,
      label: 'FAILED',
      className: 'bg-red-500/10 text-red-400 border-red-500/20'
    },
    uncertain: {
      icon: HelpCircle,
      label: 'UNCERTAIN',
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    },
    viable: {
      icon: CheckCircle,
      label: 'VIABLE',
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    'not-viable': {
      icon: XCircle,
      label: 'NOT VIABLE',
      className: 'bg-red-500/10 text-red-400 border-red-500/20'
    }
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1
      text-xs font-medium uppercase tracking-wider
      rounded-full border ${className}
    `}>
      <Icon className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {label}
    </span>
  );
}

// Viability badge with tooltip
export function ViabilityBadge({
  viability,
  explanation
}: {
  viability: 'viable' | 'uncertain' | 'not-viable';
  explanation?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <StatusBadge status={viability} />
      </TooltipTrigger>
      {explanation && (
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{explanation}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
```

**Acceptance Criteria:**
- [ ] Consistent badge styling across all status types
- [ ] Processing badge has subtle pulse animation
- [ ] Viability badge has explanatory tooltip
- [ ] All badges use semantic color tokens

---

### Phase 4: Rhythm & Flow (Closes "Structural Honesty" gap)

Make the reading experience feel intentional.

#### 4.1 Section Transitions

**Gap:** Scrolling between sections feels like continuous scroll—no sense of progression

**Implementation:**

```css
/* apps/web/styles/report-sections.css */

/* Section rhythm */
.report-section {
  @apply relative py-12;
}

.report-section::before {
  content: '';
  @apply absolute top-0 left-1/2 -translate-x-1/2 w-16 h-px bg-gradient-to-r from-transparent via-[--border-subtle] to-transparent;
}

/* First section has no top divider */
.report-section:first-child::before {
  @apply hidden;
}

/* Scroll snap (optional - test carefully) */
.report-container {
  scroll-snap-type: y proximity;
}

.report-section {
  scroll-snap-align: start;
  scroll-margin-top: 2rem;
}
```

```tsx
// Section enter animation
// apps/web/app/home/(user)/reports/[id]/_components/report/section-wrapper.tsx

export function SectionWrapper({
  children,
  id
}: {
  children: React.ReactNode;
  id: string
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="report-section"
    >
      {children}
    </motion.section>
  );
}
```

---

#### 4.2 Equation Block Styling

**Gap:** Mathematical notation is present but doesn't feel like a first-class content type

**Implementation:**

```tsx
// packages/ui/src/aura/index.tsx

export function EquationBlock({
  label,
  equation,
  description
}: EquationBlockProps) {
  return (
    <div className="rounded-lg bg-[--surface-elevated] border-l-2 border-blue-500/30 p-5 my-6">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="h-4 w-4 text-blue-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
          {label}
        </span>
        <button
          className="ml-auto text-xs text-[--text-muted] hover:text-[--text-secondary] transition-colors"
          onClick={() => navigator.clipboard.writeText(equation)}
        >
          Copy
        </button>
      </div>
      <code className="block font-mono text-base text-[--text-primary] mb-3">
        {equation}
      </code>
      {description && (
        <p className="text-sm text-[--text-secondary] leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
```

---

#### 4.3 Chat Button Integration

**Gap:** "Ask about this report" feels bolted on

**Implementation:**

```tsx
// Integrated into sidebar bottom
// apps/web/app/home/(user)/reports/[id]/_components/report-chat-button.tsx

export function ReportChatButton({ reportId }: { reportId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.3 }}
        onClick={() => setIsOpen(true)}
        className="
          w-full flex items-center gap-3 px-4 py-3
          bg-violet-500/10 hover:bg-violet-500/20
          text-violet-400 text-sm font-medium
          rounded-lg border border-violet-500/20
          transition-all duration-200
          hover:-translate-y-0.5
        "
      >
        <MessageSquare className="h-4 w-4" />
        <span>Ask about this report</span>
        <kbd className="ml-auto text-xs bg-violet-500/20 px-1.5 py-0.5 rounded">
          ⌘K
        </kbd>
      </motion.button>

      <ReportChatDialog open={isOpen} onOpenChange={setIsOpen} reportId={reportId} />
    </>
  );
}
```

---

### Phase 5: Architecture (Closes "Singular Identity" gap)

Structural changes that create distinctive identity.

#### 5.1 Information Architecture - Section Grouping

**Gap:** 10+ flat sections create cognitive overhead

**Implementation:**

Organize sections into "Acts" with visual breaks:

```
ACT 1: THE PROBLEM (collapsed by default for returning users)
├── Brief
├── What's Wrong
└── Why It's Hard

ACT 2: THE ANALYSIS
├── Constraints
├── Challenge the Frame
├── Innovation Analysis
└── Current State of Art

ACT 3: THE SOLUTION
├── Solution Concepts
├── Innovation Concepts
└── Primary Recommendation

ACT 4: THE REALITY CHECK
├── Self-Critique
├── Risks & Watchouts
└── What I'd Actually Do
```

```tsx
// apps/web/app/home/(user)/reports/[id]/_components/report/act-container.tsx

export function ActContainer({
  title,
  children,
  defaultOpen = true
}: ActContainerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-12">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 mb-6 group"
      >
        <ChevronRight className={`
          h-4 w-4 text-[--text-muted] transition-transform duration-200
          ${isOpen ? 'rotate-90' : ''}
        `} />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[--text-muted] group-hover:text-[--text-secondary] transition-colors">
          {title}
        </h2>
        <div className="flex-1 h-px bg-[--border-subtle]" />
      </button>

      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="overflow-hidden"
      >
        {children}
      </motion.div>
    </div>
  );
}
```

---

#### 5.2 Table Interactivity

**Gap:** Tables are static displays, not analysis tools

**Implementation:**

```tsx
// Enhanced table with sorting
// Using existing DataTable from packages/ui/src/makerkit/data-table.tsx

// Add to "Current State of Art" table:
// - Column sorting (click header)
// - Performance column with inline bar visualization
// - Expandable rows for additional detail
// - Source links that open in new tab
```

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Time to first meaningful paint | 2.5s | <1s (skeleton) |
| User-perceived loading (qualitative) | "Slow" | "Instant" |
| Design audit score (6 dimensions) | 3/10 avg | 7/10 avg |
| Interaction feedback latency | 0ms | <100ms (spring) |

## Testing Plan

1. **Visual regression tests** - Playwright screenshots at each phase
2. **Performance tests** - Lighthouse scores before/after
3. **Accessibility audit** - axe-core, keyboard navigation
4. **User testing** - 3-5 target persona interviews (CTOs, VCs)

## Dependencies & Risks

**Dependencies:**
- Existing Framer Motion installation
- Tailwind CSS v4 configuration
- shadcn/ui component library

**Risks:**
- Animation performance on lower-end devices → Mitigation: `prefers-reduced-motion`
- Typography changes affecting content layout → Mitigation: Test with longest reports
- Dark mode inconsistencies → Mitigation: Test both themes at each phase

## References

### Internal
- `apps/web/app/home/(user)/_components/processing-screen.tsx:1-562` - Current loading implementation
- `apps/web/styles/sparlo-animations.css:1-164` - Existing animation system
- `packages/ui/src/aura/index.tsx:1-80` - Aura design system components
- `apps/web/app/home/(user)/_lib/animation-constants.ts:1-36` - Animation timing tokens

### External
- [Linear Design System](https://linear.app) - Craft reference
- [Palantir Foundry](https://www.palantir.com/platforms/foundry/) - Density reference
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
