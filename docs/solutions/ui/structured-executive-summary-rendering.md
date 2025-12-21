---
title: "Structured Executive Summary Rendering - React Error #31 Fix"
category: ui
tags:
  - react-error
  - schema-evolution
  - type-safety
  - hybrid-reports
  - backward-compatibility
severity: critical
component: HybridReportDisplay
framework: Next.js 16, React 19, TypeScript
date: 2025-12-20
status: resolved
---

# Structured Executive Summary Rendering

## Problem

After updating the hybrid report schema to use a structured `executive_summary` object instead of a plain string, the report detail page crashed with React Error #31:

```
Error: Minified React error #31; visit https://react.dev/errors/31?args[]=object%20with%20keys%20%7Bviability%2C%20the_problem%2C%20core_insight%2C%20narrative_lead%2C%20viability_label%2C%20recommended_path%2C%20primary_recommendation%7D
```

This error occurs when React attempts to render an object directly as a child element.

## Root Cause

The `HybridReportDisplay` component was rendering `{report.executive_summary}` directly, assuming it was a string. After schema changes, this field became a structured object:

```typescript
// Old schema (string)
executive_summary: "A concise summary of the report..."

// New schema (structured object)
executive_summary: {
  narrative_lead: "Opening hook...",
  viability: "high",
  viability_label: "Highly Viable",
  the_problem: "The core challenge...",
  core_insight: {
    headline: "Key Finding",
    explanation: "Why this matters..."
  },
  primary_recommendation: "Next step...",
  recommended_path: [
    { step: 1, action: "...", rationale: "..." }
  ]
}
```

## Solution

Updated `HybridReportDisplay` to handle both formats for backward compatibility:

### 1. Added Type Definition

```typescript
// apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx

interface StructuredExecutiveSummary {
  narrative_lead?: string;
  viability?: string;
  viability_label?: string;
  the_problem?: string;
  core_insight?: {
    headline?: string;
    explanation?: string;
  };
  primary_recommendation?: string;
  recommended_path?: Array<{
    step?: number;
    action?: string;
    rationale?: string;
  }>;
}
```

### 2. Updated Props Interface

```typescript
interface HybridReportDisplayProps {
  reportData: {
    mode: 'hybrid';
    report?: {
      executive_summary?: string | StructuredExecutiveSummary;
      // ... rest of interface
    };
  };
}
```

### 3. Conditional Rendering

```tsx
{typeof report.executive_summary === 'string' ? (
  // Legacy string format
  <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-200">
    {report.executive_summary}
  </p>
) : (
  // New structured format
  <div className="space-y-4">
    {report.executive_summary.narrative_lead && (
      <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-200">
        {report.executive_summary.narrative_lead}
      </p>
    )}
    {report.executive_summary.core_insight && (
      <div className="rounded-lg bg-white/60 p-4 dark:bg-zinc-800/60">
        <h4 className="mb-2 font-semibold text-zinc-900 dark:text-white">
          {report.executive_summary.core_insight.headline}
        </h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {report.executive_summary.core_insight.explanation}
        </p>
      </div>
    )}
    {report.executive_summary.primary_recommendation && (
      <p className="text-sm font-medium text-violet-700 dark:text-violet-400">
        {report.executive_summary.primary_recommendation}
      </p>
    )}
  </div>
)}
```

## Prevention

### Schema Evolution Guidelines

1. **Always update rendering components** when changing schema structure
2. **Use union types** (`string | StructuredType`) for backward compatibility
3. **Check with `typeof`** before rendering to handle both formats
4. **Test with existing data** before deploying schema changes

### React Error #31 Checklist

When you see "Objects are not valid as a React child":
- [ ] Check if a previously-string field became an object
- [ ] Use `typeof` to differentiate rendering paths
- [ ] Add proper type definitions for the new structure
- [ ] Render object properties individually, not the object itself

## Files Changed

- `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`

## Commit

`f4dd147` - fix: handle structured executive_summary in hybrid reports

## Related

- `docs/solutions/ai/evidence-based-schema-patterns.md` - Schema design patterns
- React Error Reference: https://react.dev/errors/31
