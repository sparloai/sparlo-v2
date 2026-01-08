# Redesign Due Diligence Report to Match Brand System

**Date:** January 2026
**Type:** `fix:` + `feat:` (Bug fix + Enhancement)
**Complexity:** HIGH

---

## 🔬 Enhancement Summary (via /deepen-plan)

This plan was enhanced with insights from 13 parallel research agents. Key findings:

### Critical Implementation Insights

| Area | Key Insight | Source |
|------|-------------|--------|
| **Type Safety** | Use discriminated unions for verdict types; type guards for runtime validation | kieran-typescript-reviewer |
| **Performance** | Use IntersectionObserver (not scroll events) for TOC tracking; virtualize appendix lists >50 items | performance-oracle |
| **Architecture** | Keep new primitives in `primitives.tsx` for consistency; single normalization function | architecture-strategist |
| **Anti-Patterns** | Remove ALL colored backgrounds, decorative icons, and hardcoded colors | pattern-recognition-specialist |
| **Schema Safety** | Use project's `flexibleEnum()` and `flexibleNumber()` patterns from existing schemas | project learnings |
| **Memoization** | Memoize normalizedData, tocSections, and all sub-components; avoid memoizing primitives | Context7 React docs |

### Priority Order
1. **Normalization Layer** - Must work with both schemas before any UI work
2. **Primitives** - VerdictDisplay, RiskSeverityIndicator, ScoreDisplay
3. **Main Component** - Complete redesign using new primitives
4. **Performance** - Virtualization, lazy-loading for large appendix

---

## Overview

Redesign the Due Diligence (DD) report rendering component to match the hybrid report's brand system styling while making the design antifragile for rendering. The preload warning mentioned is a separate issue in marketing pages, not related to DD reports.

## Problem Statement

### Current Issues

1. **Brand System Violation**: DD report uses colored verdict boxes (emerald, blue, amber, red) and decorative icons (CheckCircle, TrendingUp, AlertTriangle), violating the near-monochrome brand system
2. **Schema Mismatch**: Component expects old schema fields (`header`, `executive_summary`, `technical_thesis_assessment`) but new DD reports use different structure (`quick_reference`, `prose_report`, `appendix`)
3. **Fragile Rendering**: No graceful handling of missing sections or malformed data
4. **No TOC**: DD reports lack Table of Contents navigation that hybrid reports have
5. **Separate Issue**: Preload warning from marketing pages (not related to DD report)

### Target State

- Near-monochrome palette matching `docs/SPARLO-DESIGN-SYSTEM.md`
- Typography-driven hierarchy (no colored backgrounds for semantic meaning)
- Antifragile rendering using primitives from `primitives.tsx`
- Support for both old and new DD schema formats
- Table of Contents for navigation

---

## Technical Considerations

### Architecture Impacts

**Files to Modify:**
- `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx` - Main redesign
- `apps/web/app/app/reports/[id]/_components/brand-system/primitives.tsx` - Add DD-specific primitives

**Files for Reference:**
- `apps/web/app/app/reports/[id]/_components/brand-system/brand-system-report.tsx:107-293` - Read time calculation pattern
- `apps/web/app/app/reports/[id]/_components/brand-system/brand-system-report.tsx:311-481` - `normalizeReportData` pattern
- `apps/web/app/app/reports/[id]/_components/brand-system/brand-system-report.tsx:534-580` - TOC nav item pattern
- `docs/SPARLO-DESIGN-SYSTEM.md` - Design system reference
- `/Users/alijangbar/Desktop/sparlo-v2/Due Diligence JSON Example.rtf` - New JSON structure

### Performance Implications

- DD reports can be large (100+ items in appendix)
- Use memoization for expensive computations
- Consider lazy-loading appendix sections
- Calculate read time using content-type specific speeds

### Security Considerations

- Share functionality already uses secure token generation
- No additional security concerns identified

---

## 🔬 Research Insights

### TypeScript Type Safety (kieran-typescript-reviewer)

**Discriminated Unions for Verdict Types:**
```typescript
// ✅ Use discriminated unions instead of loose string types
type VerdictLevel = 'COMPELLING' | 'PROMISING' | 'MIXED' | 'CAUTION' | 'CONCERNING' | 'PASS';

interface VerdictResult {
  verdict: VerdictLevel;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  symbol?: string;
}

// Type guard for runtime validation
function isVerdictLevel(value: unknown): value is VerdictLevel {
  return typeof value === 'string' &&
    ['COMPELLING', 'PROMISING', 'MIXED', 'CAUTION', 'CONCERNING', 'PASS'].includes(value);
}
```

**Type-Safe Schema Detection:**
```typescript
// Type guard for schema format detection
function isNewSchemaFormat(data: unknown): data is { quick_reference: unknown } {
  return typeof data === 'object' && data !== null && 'quick_reference' in data;
}

function normalizeDDReportData(data: DDReportData): NormalizedDDReport {
  const raw = data.report as Record<string, unknown>;

  if (isNewSchemaFormat(raw)) {
    return raw as NormalizedDDReport; // Already validated via type guard
  }

  return transformOldSchema(raw);
}
```

### Performance Optimization (performance-oracle)

**IntersectionObserver for TOC (NOT scroll events):**
```typescript
// ✅ CORRECT - Use IntersectionObserver
function useTocScroll({ sectionIds, scrollOffset }: Options) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: `-${scrollOffset}px 0px -50% 0px`,
        threshold: 0
      }
    );

    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds, scrollOffset]);

  return { activeSection };
}
```

**Virtualization for Large Appendix:**
```typescript
// For appendix with 50+ items, use virtualization
import { FixedSizeList as List } from 'react-window';

const AppendixList = memo(function AppendixList({ items }: { items: ClaimValidation[] }) {
  if (items.length < 50) {
    // Regular rendering for small lists
    return items.map((item, i) => <ClaimCard key={i} claim={item} />);
  }

  // Virtualized for large lists
  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={150}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <ClaimCard claim={items[index]} />
        </div>
      )}
    </List>
  );
});
```

### Memoization Best Practices (Context7 React docs)

**What to Memoize:**
```typescript
// ✅ Memoize expensive normalizations
const normalizedData = useMemo(
  () => normalizeDDReportData(reportData),
  [reportData]  // Only recalculate when reportData changes
);

// ✅ Memoize derived calculations
const tocSections = useMemo(
  () => generateDDTocSections(normalizedData.result),
  [normalizedData.result]
);

// ✅ Memoize read time calculation
const readTime = useMemo(
  () => calculateDDReadTime(normalizedData.result),
  [normalizedData.result]
);
```

**What NOT to Memoize:**
```typescript
// ❌ Don't memoize simple primitives or cheap operations
const VerdictDisplay = memo(function VerdictDisplay({ verdict }) {
  // This is a simple render - memo adds overhead for no benefit on primitives
  // HOWEVER: DO use memo for list item components rendered many times
});

// ✅ DO memoize components rendered in loops
const VerdictIndicator = memo(function VerdictIndicator({ label, verdict }) {
  // Rendered 5+ times in verdict grid - memo prevents unnecessary re-renders
});
```

### Schema Antifragility (project learnings)

**Use Existing flexibleEnum Pattern:**
```typescript
// From apps/web/lib/llm/prompts/dd/schemas.ts - REUSE THIS PATTERN
import { flexibleEnum, flexibleNumber } from '../schema-helpers';

// ✅ Handles: "WEAK - needs improvement" → "WEAK"
// ✅ Handles: case insensitivity, synonyms, fallback
const verdictSchema = flexibleEnum(
  ['COMPELLING', 'PROMISING', 'MIXED', 'CAUTION', 'CONCERNING', 'PASS'],
  'MIXED'  // Sensible default
);

// ✅ Handles: "7" → 7, "7.5 out of 10" → 7.5
const scoreSchema = flexibleNumber(5, { min: 1, max: 10 });
```

**Safe Optional Chaining Pattern:**
```typescript
// ✅ Graceful fallback for missing nested data
const verdict = quickRef?.one_page_summary?.verdict_box?.overall ?? 'MIXED';
const company = quickRef?.one_page_summary?.company ?? title ?? 'Due Diligence Report';
const risks = quickRef?.key_risks ?? [];

// ✅ Safe array mapping with fallback
{(quickRef?.key_risks ?? []).map((risk, idx) => (
  <RiskCard key={idx} risk={risk} />
))}
```

### Typography Hierarchy for Verdicts (design research)

**Replacing Color with Typography Weight/Size:**

| Verdict | Old (❌ colored) | New (✅ typography) |
|---------|------------------|---------------------|
| COMPELLING | `bg-emerald-50 text-emerald-700` | `text-[28px] font-semibold text-zinc-900 border-l-4 border-zinc-900` |
| PROMISING | `bg-blue-50 text-blue-700` | `text-[24px] font-medium text-zinc-800 border-l-4 border-zinc-700` |
| MIXED | `bg-amber-50 text-amber-700` | `text-[22px] font-medium text-zinc-700 border-l-2 border-zinc-500` |
| CAUTION | `bg-yellow-50 text-yellow-700` | `text-[20px] font-normal text-zinc-600 border-l-2 border-zinc-400` |
| CONCERNING | `bg-red-50 text-red-700` | `text-[20px] font-normal text-zinc-500 border-l-2 border-zinc-300` |
| PASS | `bg-gray-50 text-gray-700` | `text-[18px] font-normal text-zinc-500 border-l border-zinc-200` |

**Key Principle:** Larger + bolder + thicker border = more positive verdict. Visual weight creates hierarchy without color.

### Anti-Patterns to Remove (pattern-recognition-specialist)

**Current Violations in dd-report-display.tsx:**
```typescript
// ❌ REMOVE: Colored verdict backgrounds (lines 56-94)
const verdictColors = {
  COMPELLING: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  // ...
};

// ❌ REMOVE: Decorative icons
import { CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';

// ❌ REMOVE: Any hardcoded non-zinc colors
className="bg-blue-100"  // WRONG
className="text-emerald-600"  // WRONG
```

**Replace With:**
```typescript
// ✅ Typography-only hierarchy
const verdictStyles = {
  COMPELLING: 'text-[28px] font-semibold text-zinc-900 border-l-4 border-zinc-900',
  // ...
};

// ✅ Only allow: lucide-react structural icons (ChevronDown, Share2, Download)
// ✅ Only allow: zinc color palette
```

---

## Proposed Solution

### 1. Schema Normalization Layer

Create `normalizeDDReportData()` function to handle both old and new schemas:

```typescript
// dd-report-display.tsx

/**
 * Normalize DD report data to handle both old and new schema formats.
 * Maps: old fields → new structure if needed
 */
function normalizeDDReportData(data: DDReportData): NormalizedDDReport {
  const raw = data.report as Record<string, unknown>;

  // If using new schema (has quick_reference), return as-is
  if (raw.quick_reference || raw.prose_report) {
    return data.report as NormalizedDDReport;
  }

  // Old schema detected - map to new structure
  return {
    result: {
      quick_reference: {
        one_page_summary: {
          company: raw.header?.company_name,
          sector: raw.header?.technology_domain,
          verdict_box: {
            technical_validity: {
              verdict: raw.executive_summary?.verdict,
              symbol: '...'
            },
            // ... map other fields
          },
          executive_paragraph: raw.executive_summary?.one_paragraph_summary,
          // ... continue mapping
        },
        // ... map key_risks, founder_questions, scenarios, scores
      },
      prose_report: {
        technical_deep_dive: {
          content: raw.technical_thesis_assessment?.their_thesis,
          // ... map other fields
        },
        // ... map other prose sections
      },
      appendix: {
        // ... map appendix sections
      }
    }
  };
}
```

### 2. Brand System Compliant Primitives

Add DD-specific primitives to `primitives.tsx`:

```typescript
// primitives.tsx - ADD these components

/**
 * Verdict Display - Typography-based verdict indicator
 * Replaces colored boxes with weight/size hierarchy
 */
interface VerdictDisplayProps {
  verdict: string;
  confidence?: string;
  className?: string;
}

export const VerdictDisplay = memo(function VerdictDisplay({
  verdict,
  confidence,
  className,
}: VerdictDisplayProps) {
  // Map verdict to typography weight/size
  const verdictStyles: Record<string, string> = {
    COMPELLING: 'text-[28px] font-semibold text-zinc-900',
    PROMISING: 'text-[24px] font-medium text-zinc-800',
    MIXED: 'text-[22px] font-medium text-zinc-700',
    CAUTION: 'text-[20px] font-normal text-zinc-600',
    CONCERNING: 'text-[20px] font-normal text-zinc-500',
    PASS: 'text-[18px] font-normal text-zinc-500',
  };

  const borderStyles: Record<string, string> = {
    COMPELLING: 'border-l-4 border-zinc-900',
    PROMISING: 'border-l-4 border-zinc-700',
    MIXED: 'border-l-2 border-zinc-500',
    CAUTION: 'border-l-2 border-zinc-400',
    CONCERNING: 'border-l-2 border-zinc-300',
    PASS: 'border-l border-zinc-200',
  };

  const normalizedVerdict = verdict?.toUpperCase().replace(/\s*-.*$/, '') || 'MIXED';

  return (
    <div className={cn(
      'pl-6 py-4',
      borderStyles[normalizedVerdict] || 'border-l-2 border-zinc-300',
      className
    )}>
      <span className={verdictStyles[normalizedVerdict] || verdictStyles.MIXED}>
        {normalizedVerdict}
      </span>
      {confidence && (
        <span className="ml-3 text-[14px] text-zinc-400">
          ({confidence} confidence)
        </span>
      )}
    </div>
  );
});

/**
 * Risk Severity Indicator - Typography-based with dots
 * Replaces colored badges
 */
interface RiskSeverityProps {
  severity: string;
  label?: string;
  className?: string;
}

export const RiskSeverityIndicator = memo(function RiskSeverityIndicator({
  severity,
  label,
  className,
}: RiskSeverityProps) {
  const normalizedSeverity = severity?.toUpperCase() || 'MEDIUM';

  const severityStyles: Record<string, { dot: string; text: string }> = {
    CRITICAL: { dot: 'bg-zinc-900', text: 'font-semibold text-zinc-900' },
    HIGH: { dot: 'bg-zinc-700', text: 'font-medium text-zinc-700' },
    MEDIUM: { dot: 'bg-zinc-500', text: 'font-normal text-zinc-600' },
    LOW: { dot: 'bg-zinc-300', text: 'font-normal text-zinc-400' },
  };

  const style = severityStyles[normalizedSeverity] || severityStyles.MEDIUM;

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      <span className={cn('text-[13px]', style.text)}>
        {label || normalizedSeverity}
      </span>
    </span>
  );
});

/**
 * Score Display - For ratings like 6.5/10
 */
interface ScoreDisplayProps {
  score: number;
  outOf: number;
  label?: string;
  oneLiner?: string;
  className?: string;
}

export const ScoreDisplay = memo(function ScoreDisplay({
  score,
  outOf,
  label,
  oneLiner,
  className,
}: ScoreDisplayProps) {
  return (
    <div className={cn('rounded-lg border border-zinc-200 p-4', className)}>
      <div className="text-[13px] font-semibold tracking-[0.06em] uppercase text-zinc-500">
        {label || 'Score'}
      </div>
      <div className="mt-1 text-[32px] font-semibold text-zinc-900">
        {score}<span className="text-[18px] text-zinc-400">/{outOf}</span>
      </div>
      {oneLiner && (
        <p className="mt-2 text-[14px] text-zinc-500">{oneLiner}</p>
      )}
    </div>
  );
});
```

### 3. Main Component Redesign

Replace the entire DD report display with brand system styling:

```typescript
// dd-report-display.tsx - COMPLETE REWRITE

'use client';

import { memo, useMemo } from 'react';
import { Download, Loader2, Share2 } from 'lucide-react';
import { cn } from '@kit/ui/utils';

import { useReportActions } from '../../_lib/hooks/use-report-actions';
import {
  Section,
  SectionTitle,
  SectionSubtitle,
  MonoLabel,
  BodyText,
  AccentBorder,
  HighlightBox,
  ArticleBlock,
  ContentBlock,
  UnknownFieldRenderer,
  VerdictDisplay,
  RiskSeverityIndicator,
  ScoreDisplay,
} from './primitives';
import { TableOfContents, generateTocSections } from './table-of-contents';
import { useTocScroll, TOC_SCROLL_OFFSET, flattenSectionIds } from '../../_lib/hooks/use-toc-scroll';

// Types
interface DDReportData {
  mode: 'dd';
  report: unknown;
}

interface NormalizedDDReport {
  result: {
    quick_reference?: QuickReference;
    prose_report?: ProseReport;
    appendix?: Appendix;
    report_metadata?: ReportMetadata;
  };
}

// ... type definitions for QuickReference, ProseReport, Appendix, etc.

export const DDReportDisplay = memo(function DDReportDisplay({
  reportData,
  title,
  brief,
  createdAt,
  showActions = true,
  reportId,
}: DDReportDisplayProps) {
  // Normalize data for backwards compatibility
  const normalizedData = useMemo(
    () => normalizeDDReportData(reportData),
    [reportData]
  );

  const { result } = normalizedData;
  const quickRef = result?.quick_reference;
  const prose = result?.prose_report;
  const appendix = result?.appendix;

  // Share and export functionality
  const { handleShare, handleExport, isExporting, isGeneratingShare } = useReportActions({
    reportId: reportId || '',
    reportTitle: title || quickRef?.one_page_summary?.company || 'DD Report',
  });

  // TOC sections
  const tocSections = useMemo(() => generateDDTocSections(result), [result]);
  const sectionIds = useMemo(() => flattenSectionIds(tocSections), [tocSections]);
  const { activeSection, navigateToSection } = useTocScroll({
    sectionIds,
    scrollOffset: TOC_SCROLL_OFFSET,
  });

  // Calculate read time
  const readTime = useMemo(() => calculateDDReadTime(result), [result]);

  // Early return for missing data
  if (!result || (!quickRef && !prose)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-500">Loading report data...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white">
      {/* Table of Contents Sidebar */}
      <aside className="hidden lg:block fixed left-16 top-20 w-56">
        <nav className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <p className="mb-4 text-[12px] font-medium tracking-[0.08em] text-zinc-400 uppercase">
            Contents
          </p>
          <ul className="space-y-1 border-l border-zinc-200 pl-4">
            {tocSections.map((section) => (
              <TocNavItem
                key={section.id}
                section={section}
                activeSection={activeSection}
                onNavigate={navigateToSection}
              />
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-6 py-16 lg:ml-72">
        {/* Header */}
        <header className="mb-16">
          <div className="flex items-start justify-between gap-6">
            <div>
              <MonoLabel variant="strong" className="mb-4 block">
                Technical Due Diligence
              </MonoLabel>
              <h1 className="font-heading text-[40px] font-normal tracking-[-0.02em] text-zinc-900">
                {title || quickRef?.one_page_summary?.company || 'Due Diligence Report'}
              </h1>
            </div>

            {/* Action Buttons */}
            {showActions && (
              <div className="flex shrink-0 items-center gap-2 pt-2">
                <ActionButton
                  onClick={handleShare}
                  icon={<Share2 className="h-4 w-4" />}
                  loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                  label="Share"
                  isLoading={isGeneratingShare}
                  disabled={!reportId}
                />
                <ActionButton
                  onClick={handleExport}
                  icon={<Download className="h-4 w-4" />}
                  loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                  label="Export"
                  isLoading={isExporting}
                  disabled={!reportId}
                />
              </div>
            )}
          </div>

          {/* Metadata row */}
          <div className="mt-4 flex items-center gap-4 text-[14px] tracking-[-0.02em] text-zinc-500">
            {quickRef?.one_page_summary?.sector && (
              <>
                <span>{quickRef.one_page_summary.sector}</span>
                <span className="text-zinc-300">·</span>
              </>
            )}
            {createdAt && (
              <>
                <span>{formatDate(createdAt)}</span>
                <span className="text-zinc-300">·</span>
              </>
            )}
            <span>{readTime} min read</span>
          </div>
        </header>

        {/* Quick Reference - One Page Summary */}
        {quickRef?.one_page_summary && (
          <Section id="executive-summary">
            <SectionTitle>Executive Summary</SectionTitle>

            {/* Verdict Box - Using typography hierarchy */}
            {quickRef.one_page_summary.verdict_box && (
              <div className="mb-8">
                <VerdictDisplay
                  verdict={quickRef.one_page_summary.verdict_box.overall || 'CAUTION'}
                />

                {/* Verdict breakdown - grid of indicators */}
                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                  {quickRef.one_page_summary.verdict_box.technical_validity && (
                    <VerdictIndicator
                      label="Technical Validity"
                      verdict={quickRef.one_page_summary.verdict_box.technical_validity.verdict}
                    />
                  )}
                  {quickRef.one_page_summary.verdict_box.commercial_viability && (
                    <VerdictIndicator
                      label="Commercial Viability"
                      verdict={quickRef.one_page_summary.verdict_box.commercial_viability.verdict}
                    />
                  )}
                  {quickRef.one_page_summary.verdict_box.moat_strength && (
                    <VerdictIndicator
                      label="Moat Strength"
                      verdict={quickRef.one_page_summary.verdict_box.moat_strength.verdict}
                    />
                  )}
                  {quickRef.one_page_summary.verdict_box.solution_space_position && (
                    <VerdictIndicator
                      label="Solution Position"
                      verdict={quickRef.one_page_summary.verdict_box.solution_space_position.verdict}
                    />
                  )}
                  {quickRef.one_page_summary.verdict_box.timing && (
                    <VerdictIndicator
                      label="Timing"
                      verdict={quickRef.one_page_summary.verdict_box.timing.verdict}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Executive paragraph */}
            {quickRef.one_page_summary.executive_paragraph && (
              <ArticleBlock>
                <BodyText size="lg">
                  {quickRef.one_page_summary.executive_paragraph}
                </BodyText>
              </ArticleBlock>
            )}

            {/* Key Bet */}
            {quickRef.one_page_summary.the_bet && (
              <HighlightBox variant="subtle" className="mt-8">
                <MonoLabel variant="strong">The Bet</MonoLabel>
                <BodyText className="mt-3">
                  {quickRef.one_page_summary.the_bet}
                </BodyText>
              </HighlightBox>
            )}
          </Section>
        )}

        {/* Scores */}
        {quickRef?.scores && (
          <Section id="scores">
            <SectionTitle size="lg">Assessment Scores</SectionTitle>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {quickRef.scores.technical_credibility && (
                <ScoreDisplay
                  score={quickRef.scores.technical_credibility.score}
                  outOf={quickRef.scores.technical_credibility.out_of}
                  label="Technical Credibility"
                  oneLiner={quickRef.scores.technical_credibility.one_liner}
                />
              )}
              {quickRef.scores.commercial_viability && (
                <ScoreDisplay
                  score={quickRef.scores.commercial_viability.score}
                  outOf={quickRef.scores.commercial_viability.out_of}
                  label="Commercial Viability"
                  oneLiner={quickRef.scores.commercial_viability.one_liner}
                />
              )}
              {quickRef.scores.moat_strength && (
                <ScoreDisplay
                  score={quickRef.scores.moat_strength.score}
                  outOf={quickRef.scores.moat_strength.out_of}
                  label="Moat Strength"
                  oneLiner={quickRef.scores.moat_strength.one_liner}
                />
              )}
            </div>
          </Section>
        )}

        {/* Key Risks */}
        {quickRef?.key_risks && quickRef.key_risks.length > 0 && (
          <Section id="key-risks">
            <SectionTitle size="lg">Key Risks</SectionTitle>
            <div className="mt-8 space-y-4">
              {quickRef.key_risks.map((risk, idx) => (
                <div key={idx} className="border-l-2 border-zinc-200 pl-6">
                  <div className="flex items-center gap-3 mb-2">
                    <RiskSeverityIndicator severity={risk.severity} />
                  </div>
                  <BodyText variant="primary" className="font-medium">
                    {risk.risk}
                  </BodyText>
                  {risk.mitigation && (
                    <BodyText variant="muted" size="sm" className="mt-2">
                      Mitigation: {risk.mitigation}
                    </BodyText>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Scenarios */}
        {quickRef?.scenarios && (
          <Section id="scenarios">
            <SectionTitle size="lg">Investment Scenarios</SectionTitle>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {quickRef.scenarios.bull_case && (
                <ScenarioCard
                  title="Bull Case"
                  probability={quickRef.scenarios.bull_case.probability}
                  returnRange={quickRef.scenarios.bull_case.return}
                  narrative={quickRef.scenarios.bull_case.narrative}
                />
              )}
              {quickRef.scenarios.base_case && (
                <ScenarioCard
                  title="Base Case"
                  probability={quickRef.scenarios.base_case.probability}
                  returnRange={quickRef.scenarios.base_case.return}
                  narrative={quickRef.scenarios.base_case.narrative}
                />
              )}
              {quickRef.scenarios.bear_case && (
                <ScenarioCard
                  title="Bear Case"
                  probability={quickRef.scenarios.bear_case.probability}
                  returnRange={quickRef.scenarios.bear_case.return}
                  narrative={quickRef.scenarios.bear_case.narrative}
                />
              )}
            </div>

            {quickRef.scenarios.expected_value && (
              <HighlightBox variant="strong" className="mt-8">
                <MonoLabel className="text-zinc-400">Expected Value</MonoLabel>
                <div className="mt-2 text-[32px] font-semibold text-white">
                  {quickRef.scenarios.expected_value.weighted_multiple}
                </div>
                {quickRef.scenarios.expected_value.assessment && (
                  <p className="mt-2 text-[14px] text-zinc-300">
                    {quickRef.scenarios.expected_value.assessment}
                  </p>
                )}
              </HighlightBox>
            )}
          </Section>
        )}

        {/* Prose Report - Technical Deep Dive */}
        {prose?.technical_deep_dive && (
          <Section id="technical-deep-dive">
            <SectionTitle>Technical Deep Dive</SectionTitle>
            <ArticleBlock className="mt-8">
              <BodyText parseCited>
                {prose.technical_deep_dive.content}
              </BodyText>
            </ArticleBlock>
          </Section>
        )}

        {/* Problem Primer */}
        {prose?.problem_primer && (
          <Section id="problem-primer">
            <SectionTitle>Problem Primer</SectionTitle>
            <ArticleBlock className="mt-8">
              <BodyText parseCited>
                {prose.problem_primer.content}
              </BodyText>
            </ArticleBlock>
          </Section>
        )}

        {/* Solution Landscape */}
        {prose?.solution_landscape && (
          <Section id="solution-landscape">
            <SectionTitle>Solution Landscape</SectionTitle>
            <ArticleBlock className="mt-8">
              <BodyText parseCited>
                {prose.solution_landscape.content}
              </BodyText>
            </ArticleBlock>
          </Section>
        )}

        {/* Commercialization Reality */}
        {prose?.commercialization_reality && (
          <Section id="commercialization">
            <SectionTitle>Commercialization Reality</SectionTitle>
            <ArticleBlock className="mt-8">
              <BodyText parseCited>
                {prose.commercialization_reality.content}
              </BodyText>
            </ArticleBlock>
          </Section>
        )}

        {/* Investment Synthesis */}
        {prose?.investment_synthesis && (
          <Section id="investment-synthesis">
            <SectionTitle>Investment Synthesis</SectionTitle>
            <ArticleBlock className="mt-8">
              <BodyText parseCited>
                {prose.investment_synthesis.content}
              </BodyText>
            </ArticleBlock>
          </Section>
        )}

        {/* Founder Questions */}
        {quickRef?.founder_questions && quickRef.founder_questions.length > 0 && (
          <Section id="founder-questions">
            <SectionTitle>Founder Questions</SectionTitle>
            <div className="mt-8 space-y-6">
              {quickRef.founder_questions.map((q, idx) => (
                <FounderQuestionCard key={idx} question={q} />
              ))}
            </div>
          </Section>
        )}

        {/* Diligence Roadmap */}
        {quickRef?.diligence_roadmap && quickRef.diligence_roadmap.length > 0 && (
          <Section id="diligence-roadmap">
            <SectionTitle>Diligence Roadmap</SectionTitle>
            <div className="mt-8 space-y-4">
              {quickRef.diligence_roadmap.map((item, idx) => (
                <DiligenceRoadmapItem key={idx} item={item} index={idx} />
              ))}
            </div>
          </Section>
        )}

        {/* Appendix - Collapsible sections for large content */}
        {appendix && (
          <Section id="appendix">
            <SectionTitle>Appendix</SectionTitle>

            {/* Detailed Claim Validation */}
            {appendix.detailed_claim_validation && appendix.detailed_claim_validation.length > 0 && (
              <CollapsibleSection
                title={`Detailed Claim Validation (${appendix.detailed_claim_validation.length})`}
                id="claim-validation"
              >
                {appendix.detailed_claim_validation.map((claim, idx) => (
                  <ClaimValidationCard key={idx} claim={claim} />
                ))}
              </CollapsibleSection>
            )}

            {/* Comparable Details */}
            {appendix.comparable_details && appendix.comparable_details.length > 0 && (
              <CollapsibleSection
                title={`Comparable Companies (${appendix.comparable_details.length})`}
                id="comparables"
              >
                {appendix.comparable_details.map((comp, idx) => (
                  <ComparableCard key={idx} comparable={comp} />
                ))}
              </CollapsibleSection>
            )}

            {/* Graceful fallback for unknown appendix fields */}
            <UnknownFieldRenderer
              data={appendix}
              label="Additional Appendix Data"
              className="mt-8"
            />
          </Section>
        )}
      </main>
    </div>
  );
});
```

### 4. Supporting Components

```typescript
// Helper components in dd-report-display.tsx

const VerdictIndicator = memo(function VerdictIndicator({
  label,
  verdict,
}: {
  label: string;
  verdict?: string;
}) {
  if (!verdict) return null;

  const styles: Record<string, string> = {
    SOUND: 'text-zinc-900 font-medium',
    STRONG: 'text-zinc-900 font-medium',
    GOOD: 'text-zinc-800',
    REASONABLE: 'text-zinc-700',
    CHALLENGING: 'text-zinc-600',
    WEAK: 'text-zinc-500',
    RIGHT_TIME: 'text-zinc-800',
  };

  return (
    <div className="rounded-lg border border-zinc-200 p-3">
      <div className="text-[11px] font-medium tracking-[0.06em] uppercase text-zinc-400">
        {label}
      </div>
      <div className={cn('mt-1 text-[14px]', styles[verdict] || 'text-zinc-600')}>
        {verdict}
      </div>
    </div>
  );
});

const ScenarioCard = memo(function ScenarioCard({
  title,
  probability,
  returnRange,
  narrative,
}: {
  title: string;
  probability?: string;
  returnRange?: string;
  narrative?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <MonoLabel variant="muted">{title}</MonoLabel>
      <div className="mt-2 flex items-baseline gap-2">
        {returnRange && (
          <span className="text-[24px] font-semibold text-zinc-900">
            {returnRange}
          </span>
        )}
        {probability && (
          <span className="text-[13px] text-zinc-500">
            ({probability})
          </span>
        )}
      </div>
      {narrative && (
        <p className="mt-3 text-[14px] leading-relaxed text-zinc-600">
          {narrative}
        </p>
      )}
    </div>
  );
});

const FounderQuestionCard = memo(function FounderQuestionCard({
  question,
}: {
  question: {
    question: string;
    why_critical?: string;
    good_answer?: string;
    bad_answer?: string;
  };
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-6">
      <BodyText variant="primary" className="font-medium">
        {question.question}
      </BodyText>
      {question.why_critical && (
        <p className="mt-2 text-[14px] text-zinc-500">
          {question.why_critical}
        </p>
      )}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {question.good_answer && (
          <div className="rounded-lg bg-zinc-50 p-4">
            <MonoLabel variant="muted" className="text-[11px]">
              Good Answer
            </MonoLabel>
            <p className="mt-2 text-[14px] text-zinc-700">
              {question.good_answer}
            </p>
          </div>
        )}
        {question.bad_answer && (
          <div className="rounded-lg border border-zinc-200 p-4">
            <MonoLabel variant="muted" className="text-[11px]">
              Concerning Answer
            </MonoLabel>
            <p className="mt-2 text-[14px] text-zinc-500">
              {question.bad_answer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

const DiligenceRoadmapItem = memo(function DiligenceRoadmapItem({
  item,
  index,
}: {
  item: {
    action: string;
    priority: string;
    purpose?: string;
  };
  index: number;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[14px] font-semibold text-zinc-400">
        {index + 1}.
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <RiskSeverityIndicator severity={item.priority} label={item.priority} />
        </div>
        <BodyText className="mt-1">{item.action}</BodyText>
        {item.purpose && (
          <p className="mt-1 text-[14px] text-zinc-500">{item.purpose}</p>
        )}
      </div>
    </div>
  );
});

const CollapsibleSection = memo(function CollapsibleSection({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ContentBlock withBorder className="mt-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isOpen}
        aria-controls={id}
      >
        <MonoLabel variant="default">{title}</MonoLabel>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-zinc-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div id={id} className="mt-6 space-y-4">
          {children}
        </div>
      )}
    </ContentBlock>
  );
});
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] DD report renders with near-monochrome palette (no colored verdict boxes)
- [ ] All verdict displays use typography hierarchy instead of color
- [ ] Risk indicators use dots + text weight instead of colored badges
- [ ] Component handles both old schema format AND new JSON structure
- [ ] Missing sections gracefully hidden (no errors)
- [ ] Malformed enum values fallback to sensible defaults
- [ ] Table of Contents displays and scrolls correctly
- [ ] Share functionality works
- [ ] Export PDF functionality works

### Non-Functional Requirements

- [ ] No TypeScript errors (`pnpm typecheck` passes)
- [ ] Linting passes (`pnpm lint:fix`)
- [ ] Component memoized appropriately for performance
- [ ] Accessible (screen reader compatible, keyboard navigable)

### Quality Gates

- [ ] Test with 5+ existing DD reports (old schema)
- [ ] Test with new JSON example structure
- [ ] Test each section missing individually
- [ ] Test malformed verdict values
- [ ] Visual regression test against brand system

### 🔬 Research-Informed Testing (from /deepen-plan)

**Type Safety Tests:**
- [ ] Type guards correctly identify old vs new schema format
- [ ] VerdictLevel discriminated union rejects invalid values at compile-time
- [ ] Runtime validation handles malformed verdict strings gracefully

**Performance Tests:**
- [ ] IntersectionObserver correctly tracks active TOC section
- [ ] Appendix with 100+ items uses virtualization (no scroll jank)
- [ ] useMemo dependencies are minimal and correct (no stale closures)
- [ ] Component re-renders only when props change (React DevTools profiler)

**Antifragility Tests:**
- [ ] Report renders with `quick_reference` only (no `prose_report`)
- [ ] Report renders with `prose_report` only (no `quick_reference`)
- [ ] Verdict "COMPELLING - highly recommended" normalizes to "COMPELLING"
- [ ] Score "7.5 out of 10" normalizes to `7.5`
- [ ] Empty `key_risks` array renders no risk section (not error)
- [ ] `null` or `undefined` nested fields don't crash render

**Brand System Compliance:**
- [ ] No colors outside zinc palette (grep for: emerald, blue, red, amber, green)
- [ ] No decorative icons (CheckCircle, AlertTriangle, TrendingUp removed)
- [ ] Typography hierarchy creates clear visual weight without color
- [ ] Left-border accent pattern used consistently

---

## Dependencies & Prerequisites

1. **Existing Primitives**: Uses `primitives.tsx` - available ✅
2. **TOC Hooks**: Uses `use-toc-scroll` - available ✅
3. **Report Actions**: Uses `use-report-actions` - available ✅
4. **Design System Doc**: `SPARLO-DESIGN-SYSTEM.md` - available ✅

**No blocking dependencies.**

---

## Risk Analysis & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking existing reports | HIGH | CRITICAL | Implement `normalizeDDReportData()` first; test with production data |
| Verdict unclear without color | MEDIUM | HIGH | User test mockups; use clear typography hierarchy |
| Performance with large appendix | MEDIUM | MEDIUM | Use collapsible sections; memoize expensive renders |

### 🔬 Enhanced Risk Analysis (from /deepen-plan)

**Schema Migration Risk (CRITICAL):**
- **Risk:** Old schema reports fail to render after redesign
- **Mitigation:**
  - Implement type guards (`isNewSchemaFormat()`) before any transformation
  - Test normalization function with 10+ production reports BEFORE deploying UI changes
  - Keep old schema mapping logic in separate pure function for easy debugging
- **Validation:** `npm run test:dd-schema-compat` (create this test suite)

**Type Safety Risk (HIGH):**
- **Risk:** Runtime type errors from loose `any` typing
- **Mitigation:**
  - Replace all `any` with discriminated unions
  - Add type guards with exhaustive checks
  - Use `satisfies` operator for configuration objects
- **Validation:** `pnpm typecheck` must pass with strict mode

**Performance Risk (MEDIUM):**
- **Risk:** Large appendix (100+ items) causes scroll jank
- **Mitigation:**
  - Use react-window for virtualized lists when items > 50
  - Memoize normalizedData, tocSections at top level
  - Use IntersectionObserver instead of scroll event listeners
- **Validation:** Chrome DevTools Performance tab shows no frame drops during scroll

**Accessibility Risk (MEDIUM):**
- **Risk:** Typography-only hierarchy unclear to screen readers
- **Mitigation:**
  - Add `aria-label` with verdict value to VerdictDisplay
  - Ensure color contrast ratios meet WCAG AA (4.5:1 for text)
  - Test with VoiceOver/NVDA
- **Validation:** axe DevTools audit shows no accessibility violations

---

## MVP Implementation

### dd-report-display.tsx (redesigned)

```typescript
'use client';

import { memo, useMemo, useState } from 'react';
import { ChevronDown, Download, Loader2, Share2 } from 'lucide-react';
import { cn } from '@kit/ui/utils';

import { useReportActions } from '../../_lib/hooks/use-report-actions';
import {
  Section,
  SectionTitle,
  MonoLabel,
  BodyText,
  ArticleBlock,
  ContentBlock,
  HighlightBox,
  UnknownFieldRenderer,
} from './primitives';

// [Full implementation as shown in Proposed Solution above]
```

### primitives.tsx (additions)

```typescript
// Add VerdictDisplay, RiskSeverityIndicator, ScoreDisplay
// [As shown in Proposed Solution section 2]
```

---

## References

### Internal References

- Current DD Display: `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx`
- Hybrid Report Reference: `apps/web/app/app/reports/[id]/_components/brand-system/brand-system-report.tsx:311-481`
- Primitives: `apps/web/app/app/reports/[id]/_components/brand-system/primitives.tsx`
- Design System: `docs/SPARLO-DESIGN-SYSTEM.md`
- TOC Hook: `apps/web/app/app/reports/[id]/_lib/hooks/use-toc-scroll.ts`
- Report Actions: `apps/web/app/app/reports/[id]/_lib/hooks/use-report-actions.ts`

### External References

- JSON Example: `/Users/alijangbar/Desktop/sparlo-v2/Due Diligence JSON Example.rtf`

### Related Work

- Hybrid Report Implementation: Same brand system applied to hybrid reports
