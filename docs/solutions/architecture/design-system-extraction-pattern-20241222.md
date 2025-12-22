---
module: UI
date: 2024-12-22
problem_type: best_practice
component: frontend_stimulus
symptoms:
  - "Large monolithic component file (2679+ lines)"
  - "Duplicate styling patterns across components"
  - "No reusable design system components"
  - "Inline style config objects recreated on each render"
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags: [design-system, component-extraction, react-memo, performance, aura]
---

# Design System Extraction Pattern

## Problem

The `hybrid-report-display.tsx` file had grown to 2679 lines with inline design system components that could be reused across the application. This violated DRY principles and made the codebase harder to maintain.

## Environment

- Module: UI / Report Display
- Framework: React 19 with Next.js 16
- Affected Component: `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`
- Date: 2024-12-22

## Symptoms

- File exceeded 2600 lines (recommended max: 300-500)
- 9 design system components defined inline
- Inline style config objects recreated on each render
- No `React.memo` on pure presentational components
- Styling patterns duplicated across multiple components

## What Didn't Work

**Direct solution:** The problem was identified during code review and fixed systematically.

## Solution

### 1. Extract Design System to Shared Package

Create a new package at `packages/ui/src/aura/index.tsx`:

```typescript
// packages/ui/src/aura/index.tsx
import * as React from 'react';
import { memo } from 'react';
import { cn } from '../lib/utils';

// Use React.memo for pure presentational components
export const SectionHeader = memo(function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-10 border-l-4 border-zinc-950 py-1 pl-6">
      <h2 className="mb-3 text-2xl font-semibold tracking-tight text-zinc-950">
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-4xl text-lg font-normal leading-relaxed text-zinc-600">
          {subtitle}
        </p>
      )}
    </div>
  );
});

// Export all components
export const MonoLabel = memo(function MonoLabel({ children }) { ... });
export const AuraBadge = memo(function AuraBadge({ children, variant }) { ... });
export const NumberedHeader = memo(function NumberedHeader({ index, title }) { ... });
// etc.
```

### 2. Add Package Export

```json
// packages/ui/package.json
{
  "exports": {
    "./aura": "./src/aura/index.tsx"
  }
}
```

### 3. Extract Inline Config Objects

```typescript
// Before (recreated on each render):
function TrackBadge({ track }) {
  const trackConfig = { /* ... */ };  // Created every render
  // ...
}

// After (module-level constant):
const TRACK_CONFIG: Record<string, { label: string; className: string }> = {
  simpler_path: { label: 'Simpler Path', className: '...' },
  // ...
};

const TrackBadge = memo(function TrackBadge({ track }) {
  const config = track ? TRACK_CONFIG[track] : null;
  // ...
});
```

### 4. Import from Shared Package

```typescript
// apps/web/.../hybrid-report-display.tsx
import {
  AuraBadge,
  AuraTable,
  CardWithHeader,
  DarkSection,
  MetadataInfoCard,
  MonoLabel,
  NumberedHeader,
  SectionHeader,
  ViabilityAssessment,
} from '@kit/ui/aura';
```

## Why This Works

1. **Single Source of Truth**: Design system components live in one place, ensuring consistency
2. **Performance**: `React.memo` prevents unnecessary re-renders of pure components
3. **Memory Efficiency**: Module-level constants are created once, not on every render
4. **Maintainability**: 13% file size reduction (2679 → 2326 lines)
5. **Reusability**: Components can be used across the entire application

## Prevention

- When a component file exceeds 500 lines, consider extraction
- Create design system components in `packages/ui/src/` from the start
- Always use `React.memo` for pure presentational components
- Extract config objects to module-level constants
- Run code reviews with `architecture-strategist` and `code-simplicity-reviewer` agents

## Related Issues

- See also: [Aura Report Redesign Plan](../../plans/sparlo-aura-report-redesign.md)
