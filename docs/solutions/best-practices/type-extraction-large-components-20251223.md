---
module: Sparlo Web
date: 2025-12-23
problem_type: logic_error
component: frontend_stimulus
symptoms:
  - "3000+ line component file difficult to maintain"
  - "500+ lines of type definitions mixed with component code"
  - "IDE performance issues with large files"
  - "Code review difficulty due to file size"
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags: [typescript, refactoring, types, maintainability, P2]
---

# Type Extraction Pattern for Large React Components

## Problem

The `hybrid-report-display.tsx` component grew to 3000+ lines with 500+ lines of inline type definitions. This made the file difficult to navigate, review, and maintain. Type definitions were duplicated concepts that should be shared.

## Environment

- Module: Sparlo Web - Report Display
- Framework: Next.js 16, React 19, TypeScript
- Date: 2025-12-23

## Symptoms

- File over 3000 lines
- ~500 lines of interface definitions at top of component
- Slow IDE performance (autocomplete, navigation)
- Difficult to review changes
- Types not reusable by other components

## What Didn't Work

**Direct solution:** This was identified during P2 code review and fixed systematically.

## Solution

### Step 1: Create Dedicated Types File

```typescript
// apps/web/app/home/(user)/reports/_lib/types/hybrid-report-display.types.ts

/**
 * Type definitions for the Hybrid Report Display component.
 * Extracted from hybrid-report-display.tsx for maintainability.
 */

// ============================================
// Execution Track + Innovation Portfolio Types
// ============================================

export interface WhereWeFoundIt {
  domain?: string;
  how_they_use_it?: string;
  why_it_transfers?: string;
}

export interface InsightBlock {
  what?: string;
  where_we_found_it?: WhereWeFoundIt;
  why_industry_missed_it?: string;
  physics?: string;
}

// ... 400+ lines of exported interfaces
```

### Step 2: Update Component Imports

```typescript
// Before (inline types):
'use client';

import { memo } from 'react';
// ... imports

interface WhereWeFoundIt {
  domain?: string;
  // 500 lines of types...
}

// After (extracted types):
'use client';

import { memo } from 'react';
// ... imports

import type {
  ChallengeTheFrame,
  ConceptRecommendation,
  ConstraintsAndMetrics,
  ExecutionTrack,
  FrontierWatch,
  HonestAssessment,
  HybridReportDisplayProps,
  InnovationPortfolio,
  InsightBlock,
  ParallelInvestigation,
  ProblemAnalysis,
  RecommendedInnovation,
  StrategicIntegration,
  StructuredExecutiveSummary,
  SupportingConcept,
} from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

// Component code starts immediately after imports
```

### Step 3: Export All Types

All interfaces use `export` keyword so they can be:
- Imported by the main component
- Reused by other components (PDF export, public sharing)
- Used in test files

### File Organization Pattern

```
reports/
├── _lib/
│   └── types/
│       ├── report-data.types.ts      # Core report types
│       └── hybrid-report-display.types.ts  # Display-specific types
├── [id]/
│   └── _components/
│       └── hybrid-report-display.tsx  # Now ~2500 lines (was 3000+)
```

## Why This Works

1. **Single Responsibility**: Types file handles type definitions, component file handles rendering
2. **Reusability**: Types can be imported by multiple components
3. **IDE Performance**: Smaller files = faster autocomplete and navigation
4. **Code Review**: Changes to types vs rendering logic are separated
5. **TypeScript Module Pattern**: Standard TS pattern for large projects

## Prevention

- **Early Extraction**: Extract types when file exceeds ~500 lines
- **Shared Types**: If a type is used in 2+ files, extract to shared location
- **Directory Convention**: Use `_lib/types/` for route-specific types
- **Named Exports**: Always use named exports for types (no default exports)
- **Import Type**: Use `import type` to make imports tree-shakeable

## Metrics

| Metric | Before | After |
|--------|--------|-------|
| Component file lines | 3000+ | ~2500 |
| Type definitions inline | 500+ | 0 |
| Types file | N/A | 500 lines |
| Type reusability | None | Full |

## Related Issues

- See also: [design-system-extraction-pattern-20241222.md](../architecture/design-system-extraction-pattern-20241222.md) - Earlier extraction pattern for UI components
- See also: [shared-component-library-extraction-20251223.md](../ui/shared-component-library-extraction-20251223.md) - Companion component extraction
- See also: [p1-security-fixes-code-review-20251223.md](../security-issues/p1-security-fixes-code-review-20251223.md) - Related P1/P2 fixes
- See also: [schema-antifragility-llm-output-20251223.md](../architecture/schema-antifragility-llm-output-20251223.md) - Schema validation patterns
