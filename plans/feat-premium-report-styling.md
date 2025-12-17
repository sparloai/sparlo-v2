# Premium Report Styling Implementation Plan (Simplified)

## Overview

Transform the current markdown-based report display into premium styled React components that render structured AN5 JSON data. The goal is SpaceX/Apple technical documentation aesthetic with **minimal architectural complexity**.

**Key constraint from reviews:** Preserve design quality while reducing from 22 files to 4 files.

## Design Philosophy (Preserved)

From the brand guide - these are non-negotiable:
- **Typography does the work** - no boxes, shadows, decoration
- **Premium through precision** - generous whitespace, perfect alignment
- **Engineer's aesthetic** - professional, respects intelligence
- **The report IS the product** - document feel, not AI chat output

## Current State

- `report-display.tsx` (700 lines) renders markdown via ReactMarkdown
- AN5 outputs structured JSON with 15+ typed sections
- `generateReportMarkdown()` converts JSON → markdown (loses structure)
- Existing markdown styling is already good - we enhance, not rebuild

## Simplified Architecture

### File Structure (4 files instead of 22)

```
apps/web/app/home/(user)/reports/[id]/_components/
├── report-display.tsx              # Existing (update with fallback logic)
└── report/
    ├── structured-report.tsx       # Main orchestrator + all sections (~400 lines)
    ├── badge.tsx                   # Single badge with all variants (~50 lines)
    ├── test-gate.tsx               # GO/NO-GO gate card (~80 lines)
    └── concept-card.tsx            # Reusable concept card (~100 lines)
```

**Why this works:**
- Sections share 90% of markup patterns (headers, paragraphs, lists)
- One file with inline sections is easier to refactor than 12 scattered files
- Badge variants are just color mappings, not different components
- Premium feel comes from typography/spacing, not component count

---

## Implementation Plan

### Phase 1: Data Extraction with Validation

**File:** Add to `apps/web/app/home/(user)/reports/[id]/_lib/extract-report.ts`

```typescript
import { z } from 'zod';
import { AN5OutputSchema, type Report } from '@/lib/llm/prompts/an5-report';

/**
 * Safely extract and validate structured report data.
 * Falls back to null if data is missing or invalid.
 */
export function extractStructuredReport(
  reportData: Record<string, unknown> | null
): Report | null {
  if (!reportData) return null;

  try {
    // Navigate the nested structure
    const chainState = reportData.chainState as Record<string, unknown> | undefined;
    const an5Result = chainState?.an5Result as Record<string, unknown> | undefined;
    const report = an5Result?.report;

    if (!report) return null;

    // Validate against the actual AN5 schema
    const validated = AN5OutputSchema.shape.report.safeParse(report);

    if (!validated.success) {
      console.warn('Report validation failed:', validated.error.flatten());
      return null;
    }

    return validated.data;
  } catch (error) {
    console.error('Failed to extract structured report:', error);
    return null;
  }
}

export function extractUserInput(
  reportData: Record<string, unknown> | null,
  fallbackTitle: string
): string {
  if (!reportData) return fallbackTitle;

  const chainState = reportData.chainState as Record<string, unknown> | undefined;
  const userInput = chainState?.userInput as string | undefined;

  if (userInput?.trim()) return userInput;

  const messages = reportData.messages as Array<{ content?: string }> | undefined;
  const firstMessage = messages?.[0]?.content;

  if (firstMessage?.trim()) return firstMessage;

  return fallbackTitle;
}
```

**Why:** Kieran's review identified that raw type casting is dangerous. Zod validation ensures we don't render broken UIs.

---

### Phase 2: Badge Component (Single File, All Variants)

**File:** `apps/web/app/home/(user)/reports/[id]/_components/report/badge.tsx`

```typescript
import { cn } from '@kit/ui/utils';

type BadgeVariant =
  | 'track-best-fit'
  | 'track-simpler'
  | 'track-spark'
  | 'confidence-high'
  | 'confidence-medium'
  | 'confidence-low'
  | 'verdict-green'
  | 'verdict-yellow'
  | 'verdict-red'
  | 'likelihood-likely'
  | 'likelihood-possible'
  | 'likelihood-unlikely';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  // Track badges - distinct visual identity per track
  'track-best-fit': 'bg-violet-50 text-violet-700 border border-violet-200',
  'track-simpler': 'bg-gray-100 text-gray-600 border border-gray-200',
  'track-spark': 'bg-amber-50 text-amber-700 border border-amber-200',

  // Confidence badges - semantic colors
  'confidence-high': 'bg-emerald-50 text-emerald-700',
  'confidence-medium': 'bg-amber-50 text-amber-700',
  'confidence-low': 'bg-red-50 text-red-700',

  // Verdict badges - prominent viability indicator
  'verdict-green': 'bg-emerald-100 text-emerald-800 font-semibold',
  'verdict-yellow': 'bg-amber-100 text-amber-800 font-semibold',
  'verdict-red': 'bg-red-100 text-red-800 font-semibold',

  // Likelihood badges
  'likelihood-likely': 'bg-red-50 text-red-600',
  'likelihood-possible': 'bg-amber-50 text-amber-600',
  'likelihood-unlikely': 'bg-gray-50 text-gray-500',
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {variant === 'track-spark' && <span className="text-amber-500">✦</span>}
      {children}
    </span>
  );
}

// Helper functions for type-safe variant selection
export function getTrackVariant(track: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    best_fit: 'track-best-fit',
    simpler_path: 'track-simpler',
    spark: 'track-spark',
  };
  return map[track] ?? 'track-simpler';
}

export function getConfidenceVariant(confidence: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    HIGH: 'confidence-high',
    MEDIUM: 'confidence-medium',
    LOW: 'confidence-low',
  };
  return map[confidence] ?? 'confidence-medium';
}

export function getVerdictVariant(verdict: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    GREEN: 'verdict-green',
    YELLOW: 'verdict-yellow',
    RED: 'verdict-red',
  };
  return map[verdict] ?? 'verdict-yellow';
}

export function getLikelihoodVariant(likelihood: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    Likely: 'likelihood-likely',
    Possible: 'likelihood-possible',
    Unlikely: 'likelihood-unlikely',
  };
  return map[likelihood] ?? 'likelihood-possible';
}
```

**Design preserved:**
- Track badges: Violet (Best Fit), Gray (Simpler), Amber with ✦ (Spark)
- Semantic colors for confidence/verdict
- Consistent pill shape with proper padding

---

### Phase 3: Test Gate Component

**File:** `apps/web/app/home/(user)/reports/[id]/_components/report/test-gate.tsx`

```typescript
import { cn } from '@kit/ui/utils';

interface TestGateProps {
  gate: {
    name: string;
    what_it_tests: string;
    method: string;
    go_criteria: string;
    no_go_criteria: string;
    effort: string;
  };
  gateNumber: number;
}

export function TestGate({ gate, gateNumber }: TestGateProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
            {gateNumber}
          </span>
          <h4 className="text-base font-semibold text-gray-900">{gate.name}</h4>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {gate.effort}
        </span>
      </div>

      {/* What it tests */}
      <p className="mb-4 text-sm text-gray-600">{gate.what_it_tests}</p>

      {/* Method */}
      <div className="mb-4 rounded-lg bg-gray-50 p-3">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
          Method
        </p>
        <p className="mt-1 text-sm text-gray-700">{gate.method}</p>
      </div>

      {/* GO / NO-GO columns */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border-l-2 border-emerald-500 bg-emerald-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            GO if
          </p>
          <p className="mt-1 text-sm text-emerald-800">{gate.go_criteria}</p>
        </div>
        <div className="rounded-lg border-l-2 border-red-500 bg-red-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
            NO-GO if
          </p>
          <p className="mt-1 text-sm text-red-800">{gate.no_go_criteria}</p>
        </div>
      </div>
    </div>
  );
}
```

**Design preserved:**
- Clear visual hierarchy with numbered gate
- Effort badge in header
- Distinct GO (green) / NO-GO (red) columns
- Subtle backgrounds, no heavy shadows

---

### Phase 4: Concept Card Component

**File:** `apps/web/app/home/(user)/reports/[id]/_components/report/concept-card.tsx`

```typescript
import { Badge, getTrackVariant, getConfidenceVariant } from './badge';
import { TestGate } from './test-gate';
import { cn } from '@kit/ui/utils';

// Lead concept - full detail with test gates
interface LeadConceptProps {
  concept: {
    id: string;
    title: string;
    track: string;
    bottom_line: string;
    what_it_is: string;
    why_it_works: string;
    confidence: string;
    confidence_rationale: string;
    what_would_change_this: string;
    key_risks: Array<{ risk: string; mitigation: string }>;
    how_to_test: {
      gate_0: {
        name: string;
        what_it_tests: string;
        method: string;
        go_criteria: string;
        no_go_criteria: string;
        effort: string;
      };
      gate_1?: {
        name: string;
        what_it_tests: string;
        method: string;
        go_criteria: string;
        no_go_criteria: string;
        effort: string;
      };
    };
  };
  isLead?: boolean;
}

export function ConceptCard({ concept, isLead = false }: LeadConceptProps) {
  const trackVariant = getTrackVariant(concept.track);
  const confidenceVariant = getConfidenceVariant(concept.confidence);

  return (
    <article
      className={cn(
        'rounded-xl border bg-white',
        isLead ? 'border-violet-200 shadow-sm' : 'border-gray-200'
      )}
    >
      {/* Header */}
      <div className="border-b border-gray-100 p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm font-mono text-gray-400">{concept.id}</span>
          <Badge variant={trackVariant}>
            {concept.track === 'best_fit'
              ? 'Best Fit'
              : concept.track === 'simpler_path'
                ? 'Simpler Path'
                : 'Spark'}
          </Badge>
          <Badge variant={confidenceVariant}>{concept.confidence}</Badge>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{concept.title}</h3>
      </div>

      {/* Bottom line - the hook */}
      <div className="border-b border-gray-100 bg-gray-50 p-6">
        <p className="text-base font-medium leading-relaxed text-gray-800">
          {concept.bottom_line}
        </p>
      </div>

      {/* Details */}
      <div className="space-y-6 p-6">
        {/* What it is */}
        <div>
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
            What It Is
          </h4>
          <p className="text-base leading-relaxed text-gray-700">
            {concept.what_it_is}
          </p>
        </div>

        {/* Why it works */}
        <div>
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Why It Works
          </h4>
          <p className="text-base leading-relaxed text-gray-700">
            {concept.why_it_works}
          </p>
        </div>

        {/* Confidence rationale */}
        <div className="rounded-lg bg-gray-50 p-4">
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Confidence Rationale
          </h4>
          <p className="text-sm text-gray-600">{concept.confidence_rationale}</p>
        </div>

        {/* What would change this */}
        <div>
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
            What Would Change This
          </h4>
          <p className="text-sm italic text-gray-600">
            {concept.what_would_change_this}
          </p>
        </div>

        {/* Key risks */}
        {concept.key_risks.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Key Risks
            </h4>
            <div className="space-y-2">
              {concept.key_risks.map((risk, i) => (
                <div key={i} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-medium text-gray-800">{risk.risk}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    <span className="font-medium">Mitigation:</span>{' '}
                    {risk.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test gates */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            How to Test
          </h4>
          <div className="space-y-4">
            <TestGate gate={concept.how_to_test.gate_0} gateNumber={0} />
            {concept.how_to_test.gate_1 && (
              <TestGate gate={concept.how_to_test.gate_1} gateNumber={1} />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// Condensed card for "other" concepts
interface OtherConceptCardProps {
  concept: {
    id: string;
    title: string;
    track: string;
    bottom_line: string;
    what_it_is: string;
    confidence: string;
    confidence_rationale: string;
    critical_validation: string;
  };
}

export function OtherConceptCard({ concept }: OtherConceptCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-mono text-gray-400">{concept.id}</span>
        <Badge variant={getTrackVariant(concept.track)}>
          {concept.track === 'simpler_path' ? 'Simpler Path' : concept.track}
        </Badge>
        <Badge variant={getConfidenceVariant(concept.confidence)}>
          {concept.confidence}
        </Badge>
      </div>
      <h4 className="mb-2 text-lg font-semibold text-gray-900">{concept.title}</h4>
      <p className="mb-3 text-sm text-gray-700">{concept.bottom_line}</p>
      <div className="rounded-lg bg-gray-50 p-3 text-sm">
        <span className="font-medium text-gray-600">Critical validation: </span>
        <span className="text-gray-700">{concept.critical_validation}</span>
      </div>
    </div>
  );
}

// Spark concept - special styling
interface SparkConceptCardProps {
  concept: {
    id: string;
    title: string;
    why_interesting: string;
    why_uncertain: string;
    confidence: string;
    when_to_pursue: string;
    critical_validation: string;
  };
}

export function SparkConceptCard({ concept }: SparkConceptCardProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-mono text-gray-400">{concept.id}</span>
        <Badge variant="track-spark">Spark</Badge>
      </div>
      <h4 className="mb-2 text-lg font-semibold text-gray-900">{concept.title}</h4>
      <p className="mb-4 text-sm leading-relaxed text-gray-700">
        {concept.why_interesting}
      </p>
      <div className="space-y-3 text-sm">
        <div>
          <span className="font-medium text-amber-700">Why uncertain: </span>
          <span className="text-gray-600">{concept.why_uncertain}</span>
        </div>
        <div>
          <span className="font-medium text-amber-700">When to pursue: </span>
          <span className="text-gray-600">{concept.when_to_pursue}</span>
        </div>
        <div className="rounded-lg bg-amber-100/50 p-3">
          <span className="font-medium text-amber-800">GO/NO-GO: </span>
          <span className="text-amber-900">{concept.critical_validation}</span>
        </div>
      </div>
    </div>
  );
}
```

**Design preserved:**
- Lead concepts get prominent treatment with full detail
- Track colors visually distinguish concept types
- Test gates embedded with clear GO/NO-GO
- Spark concept has distinctive amber gradient

---

### Phase 5: Main Structured Report Component

**File:** `apps/web/app/home/(user)/reports/[id]/_components/report/structured-report.tsx`

This file contains ALL section rendering inline (~400 lines). Sections are local functions, not separate files.

```typescript
'use client';

import { type Report } from '@/lib/llm/prompts/an5-report';
import { Badge, getVerdictVariant, getConfidenceVariant, getLikelihoodVariant } from './badge';
import { ConceptCard, OtherConceptCard, SparkConceptCard } from './concept-card';
import { cn } from '@kit/ui/utils';

interface StructuredReportProps {
  report: Report;
  userInput: string;
}

export function StructuredReport({ report, userInput }: StructuredReportProps) {
  return (
    <article className="mx-auto max-w-[760px] space-y-12">
      {/* Problem Header */}
      <header className="space-y-4">
        <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-gray-900">
          {report.title}
        </h1>
        <p className="text-lg text-gray-500">{report.subtitle}</p>
        <blockquote className="border-l-2 border-violet-300 bg-violet-50/50 py-3 pl-4 pr-3 text-sm italic text-gray-600">
          "{userInput}"
        </blockquote>
        <p className="text-xs text-gray-400">
          Generated {new Date(report.generated_at).toLocaleDateString()}
        </p>
      </header>

      <hr className="border-gray-200" />

      {/* Executive Summary */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-[22px] font-semibold text-gray-900">
            Executive Summary
          </h2>
          <Badge variant={getVerdictVariant(report.executive_summary.viability_verdict)}>
            {report.executive_summary.viability_verdict}
          </Badge>
        </div>

        <p className="mb-6 text-base leading-relaxed text-gray-700">
          {report.executive_summary.problem_essence}
        </p>

        <div className="mb-6 rounded-xl border-l-4 border-violet-500 bg-violet-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
            Key Insight
          </p>
          <p className="mt-2 text-base font-medium leading-relaxed text-gray-800">
            {report.executive_summary.key_insight}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-base text-gray-700">
            <span className="font-semibold">Recommendation:</span>{' '}
            {report.executive_summary.primary_recommendation}
          </p>
          <p className="text-sm text-gray-500">
            <span className="font-medium">Fallback:</span>{' '}
            {report.executive_summary.fallback_summary}
          </p>
        </div>

        <p className="mt-4 text-sm italic text-gray-500">
          {report.executive_summary.viability_rationale}
        </p>
      </section>

      <hr className="border-gray-200" />

      {/* Constraints */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">Constraints</h2>

        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              From Your Input
            </h3>
            <ul className="space-y-3">
              {report.constraints.from_user_input.map((item, i) => (
                <li key={i} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-sm font-medium text-gray-800">
                    {item.constraint}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    → {item.interpretation}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Assumptions Made
            </h3>
            <ul className="space-y-3">
              {report.constraints.assumptions_made.map((item, i) => (
                <li key={i} className="rounded-lg bg-amber-50 p-3">
                  <p className="text-sm font-medium text-gray-800">
                    {item.assumption}
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    ⚠ {item.flag_if_incorrect}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-sm text-gray-600">{report.constraints.constraint_summary}</p>
      </section>

      <hr className="border-gray-200" />

      {/* Problem Analysis */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          Problem Analysis
        </h2>

        <div className="mb-6 rounded-xl bg-red-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
            What's Actually Going Wrong
          </p>
          <p className="mt-2 text-base font-medium text-gray-800">
            {report.problem_analysis.what_is_actually_going_wrong}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Why It's Hard
          </h3>
          <p className="text-base leading-relaxed text-gray-700">
            {report.problem_analysis.why_its_hard}
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
            From-Scratch Revelation
          </p>
          <p className="mt-2 text-sm text-gray-700">
            {report.problem_analysis.from_scratch_revelation}
          </p>
        </div>

        {/* Root Cause Hypotheses */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Root Cause Hypotheses
          </h3>
          <ol className="space-y-3">
            {report.problem_analysis.root_cause_hypotheses.map((hyp, i) => (
              <li key={i} className="flex gap-3 rounded-lg bg-gray-50 p-4">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800">{hyp.hypothesis}</p>
                    <Badge variant={getConfidenceVariant(hyp.confidence)}>
                      {hyp.confidence}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{hyp.explanation}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Success Metrics */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Success Metrics
          </h3>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Metric
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Target
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.problem_analysis.success_metrics.map((m, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-gray-700">{m.metric}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* Key Patterns */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">Key Patterns</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {report.key_patterns.map((pattern, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-2 font-semibold text-gray-900">{pattern.pattern_name}</h3>
              <p className="mb-3 text-sm text-gray-600">{pattern.what_it_is}</p>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-medium">Why it matters:</span>{' '}
                {pattern.why_it_matters_here}
              </p>
              <p className="text-xs text-gray-400">
                From: {pattern.where_it_comes_from} • Precedent: {pattern.precedent}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* Solution Concepts */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          Solution Concepts
        </h2>

        {/* Lead Concepts */}
        <div className="mb-8 space-y-6">
          <h3 className="text-lg font-semibold text-gray-700">Lead Concepts</h3>
          {report.solution_concepts.lead_concepts.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} isLead />
          ))}
        </div>

        {/* Other Concepts */}
        {report.solution_concepts.other_concepts.length > 0 && (
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-gray-700">
              Other Concepts
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {report.solution_concepts.other_concepts.map((concept) => (
                <OtherConceptCard key={concept.id} concept={concept} />
              ))}
            </div>
          </div>
        )}

        {/* Spark Concept */}
        {report.solution_concepts.spark_concept && (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-700">
              Spark Concept
            </h3>
            <SparkConceptCard concept={report.solution_concepts.spark_concept} />
          </div>
        )}
      </section>

      <hr className="border-gray-200" />

      {/* Concept Comparison */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          Concept Comparison
        </h2>
        <div className="mb-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Concept
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Key Metric
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Confidence
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Capital
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Timeline
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Key Risk
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {report.concept_comparison.comparison_table.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-400">{row.id}</span>{' '}
                    <span className="font-medium text-gray-900">{row.title}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.key_metric_achievable}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getConfidenceVariant(row.confidence)}>
                      {row.confidence}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.capital_required}</td>
                  <td className="px-4 py-3 text-gray-600">{row.timeline}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{row.key_risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm font-medium text-gray-700">
          {report.concept_comparison.key_insight}
        </p>
      </section>

      <hr className="border-gray-200" />

      {/* Decision Architecture */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          Decision Architecture
        </h2>

        <p className="mb-6 text-lg font-medium text-gray-800">
          {report.decision_architecture.primary_decision}
        </p>

        {/* Decision Tree as styled blocks */}
        <div className="mb-6 space-y-3">
          {report.decision_architecture.decision_tree.map((node, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-violet-700">{node.condition}</p>
              <p className="mt-1 text-sm text-gray-700">
                → <span className="font-medium">{node.then}</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">Otherwise: {node.otherwise}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-violet-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
              Primary Path
            </p>
            <p className="mt-1 text-sm text-gray-700">
              {report.decision_architecture.primary_path}
            </p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Fallback Path
            </p>
            <p className="mt-1 text-sm text-gray-700">
              {report.decision_architecture.fallback_path}
            </p>
          </div>
          <div className="rounded-lg bg-gray-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              Parallel Bet
            </p>
            <p className="mt-1 text-sm text-gray-700">
              {report.decision_architecture.parallel_bet}
            </p>
          </div>
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* What I'd Actually Do */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          What I'd Actually Do
        </h2>

        <p className="mb-6 text-base italic text-gray-600">
          {report.what_id_actually_do.intro}
        </p>

        {/* Timeline */}
        <div className="mb-6 space-y-4">
          {report.what_id_actually_do.week_by_week.map((week, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-shrink-0">
                <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700">
                  {week.timeframe}
                </span>
              </div>
              <div className="flex-1">
                <ul className="mb-2 list-inside list-disc space-y-1 text-sm text-gray-700">
                  {week.actions.map((action, j) => (
                    <li key={j}>{action}</li>
                  ))}
                </ul>
                <p className="text-xs font-medium text-gray-500">
                  Decision point: {week.decision_point}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-gray-100 p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Investment summary:</span>{' '}
            {report.what_id_actually_do.investment_summary}
          </p>
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* Challenge the Frame */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          Challenge the Frame
        </h2>
        <div className="space-y-4">
          {report.challenge_the_frame.map((challenge, i) => (
            <div key={i} className="rounded-lg border-l-2 border-amber-400 bg-amber-50 py-4 pl-4 pr-5">
              <p className="text-base font-medium italic text-gray-800">
                {challenge.question}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Implication:</span> {challenge.implication}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                <span className="font-medium">Test:</span> {challenge.how_to_test}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* Risks & Watchouts */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
          Risks & Watchouts
        </h2>
        <div className="space-y-4">
          {report.risks_and_watchouts.map((risk, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{risk.risk_name}</h3>
                <Badge variant={getLikelihoodVariant(risk.likelihood)}>
                  {risk.likelihood}
                </Badge>
              </div>
              <p className="mb-3 text-sm text-gray-600">{risk.description}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Mitigation
                  </p>
                  <p className="mt-1 text-sm text-gray-700">{risk.mitigation}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
                    Trigger
                  </p>
                  <p className="mt-1 text-sm text-red-800">{risk.trigger}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* Next Steps */}
      <section>
        <h2 className="mb-6 text-[22px] font-semibold text-gray-900">Next Steps</h2>
        <ol className="space-y-4">
          {report.next_steps.map((step) => (
            <li key={step.step_number} className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
                {step.step_number}
              </span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{step.action}</p>
                <p className="mt-1 text-sm text-gray-500">{step.purpose}</p>
                <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {step.when}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
```

---

### Phase 6: Integration with Fallback

**Update:** `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx`

Add import and fallback logic in the existing file:

```typescript
// Add to imports
import { StructuredReport } from './report/structured-report';
import { extractStructuredReport, extractUserInput } from '../_lib/extract-report';

// In the component, add this logic before rendering:
const structuredReport = useMemo(() => {
  return extractStructuredReport(report.report_data as Record<string, unknown>);
}, [report.report_data]);

const userInput = extractUserInput(
  report.report_data as Record<string, unknown>,
  report.title
);

// Then in the JSX, replace the ReactMarkdown section:
{structuredReport ? (
  <StructuredReport report={structuredReport} userInput={userInput} />
) : (
  <ReactMarkdown components={markdownComponents}>
    {reportMarkdown}
  </ReactMarkdown>
)}
```

---

## Implementation Order

### Day 1 (4-5 hours)

1. **Create data extraction utility** (`extract-report.ts`) - 30 min
2. **Create Badge component** (`badge.tsx`) - 30 min
3. **Create TestGate component** (`test-gate.tsx`) - 30 min
4. **Create ConceptCard components** (`concept-card.tsx`) - 1 hour
5. **Create StructuredReport component** (`structured-report.tsx`) - 2 hours
6. **Integrate into report-display.tsx** - 30 min

### Day 2 (2-3 hours)

7. **Test with existing reports** (backwards compat) - 1 hour
8. **Test with new report generation** - 1 hour
9. **Polish spacing/typography** - 1 hour

---

## Design Specification Summary

**Typography (Preserved from original):**
- Report title: 32px / 600 weight
- Section headers (h2): 22px / 600 weight
- Body text: 16px / 400 weight, 1.6-1.7 line-height
- Labels: 12px / 500 weight, uppercase tracking

**Spacing (Preserved):**
- Between major sections: 48px (space-y-12)
- Between subsections: 24px (space-y-6)
- Card padding: 20px (p-5)

**Colors (Using Tailwind):**
- Primary: violet-700, violet-50 backgrounds
- Track Best Fit: violet-700 text, violet-50 bg
- Track Simpler: gray-600 text, gray-100 bg
- Track Spark: amber-700 text, amber-50 bg with ✦
- Confidence HIGH: emerald
- Confidence MEDIUM: amber
- Confidence LOW: red
- Verdict GREEN/YELLOW/RED: matching semantic colors

**Visual Principles:**
- No shadows on cards, only subtle borders
- White backgrounds with gray-50 for nested sections
- Border-left accents for key insights and callouts
- Generous whitespace between sections

---

## Acceptance Criteria

### Design Quality (Non-negotiable)
- [ ] Report matches SpaceX/Apple documentation aesthetic
- [ ] Track badges are visually distinct (violet, gray, amber+✦)
- [ ] Test gates show GO/NO-GO with semantic colors
- [ ] Typography hierarchy is clear
- [ ] Whitespace is generous and intentional

### Functional
- [ ] All 12 AN5 sections render correctly
- [ ] Concept cards show full detail for leads, condensed for others
- [ ] Decision tree is readable
- [ ] Backwards compatibility with markdown fallback

### Code Quality
- [ ] Only 4 new files (not 22)
- [ ] Zod validation on data extraction
- [ ] Type-safe badge variant helpers
- [ ] No runtime type assertions without validation

---

## Files Changed

**New files (4):**
- `apps/web/app/home/(user)/reports/[id]/_lib/extract-report.ts`
- `apps/web/app/home/(user)/reports/[id]/_components/report/badge.tsx`
- `apps/web/app/home/(user)/reports/[id]/_components/report/test-gate.tsx`
- `apps/web/app/home/(user)/reports/[id]/_components/report/concept-card.tsx`
- `apps/web/app/home/(user)/reports/[id]/_components/report/structured-report.tsx`

**Modified files (1):**
- `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx`

**Total: 5 new files + 1 modified** (vs original 22 files)
