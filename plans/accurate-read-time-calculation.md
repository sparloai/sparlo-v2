# Accurate Read Time Calculation for Technical Reports

## Overview

Implement a reliable read time estimation system for Sparlo's technical reports that accurately reflects the time users spend reading complex, structured content.

**Current Problem**: The read time calculation alternates between overcounting (42 min for 12 min content) and undercounting (5 min for 13 min content) because it either counts too many fields (including metadata, IDs, labels) or misses rendered prose content.

## Problem Statement

The existing `calculateReadTime` function in `brand-system-report.tsx:100-141`:
1. Recursively extracts ALL strings from the entire `HybridReportData` object
2. Uses basic filters (URLs, UUIDs, short strings, low letter ratio)
3. Uses a flat 200 WPM rate for all content
4. **Does not align with what's actually rendered to users**

This approach fails because:
- It counts fields that exist in data but aren't displayed (e.g., `supplier_arbitrage`, `flowchart`)
- It counts metadata fields (IDs, labels, confidence scores) that users skim, not read
- It applies uniform WPM to all content types (prose reads differently than bullet lists)
- The 20-character minimum threshold filters out meaningful short sentences

## Proposed Solution

### Core Principle: Count Only What Users Read

Instead of recursively processing the entire data object, explicitly extract text from the **exact fields that are rendered** in each section of `ReportContent` (lines 561-628).

### Implementation Approach

#### 1. Create Field-Specific Extractors

Define what text to extract from each rendered section:

```typescript
interface ReadableContent {
  prose: string[];      // Full paragraphs - count at 180 WPM
  headlines: string[];  // Short headlines - count at 300 WPM (scanning)
  listItems: string[];  // Bullet points - count at 220 WPM (faster reading)
  tables: number;       // Count of table rows - fixed 3 sec per row
}

function extractReadableContent(data: HybridReportData): ReadableContent {
  const content: ReadableContent = {
    prose: [],
    headlines: [],
    listItems: [],
    tables: 0
  };

  // Brief (always rendered)
  if (data.brief) content.prose.push(data.brief);

  // Executive Summary
  if (typeof data.executive_summary === 'string') {
    content.prose.push(data.executive_summary);
  } else if (data.executive_summary) {
    content.prose.push(data.executive_summary.narrative_lead);
    content.prose.push(data.executive_summary.the_problem);
    content.headlines.push(data.executive_summary.core_insight?.headline);
    content.prose.push(data.executive_summary.core_insight?.explanation);
    content.prose.push(data.executive_summary.primary_recommendation);
  }

  // Problem Analysis
  if (data.problem_analysis) {
    content.prose.push(data.problem_analysis.whats_wrong?.prose);
    content.prose.push(data.problem_analysis.why_its_hard?.prose);
    content.headlines.push(data.problem_analysis.first_principles_insight?.headline);
    content.prose.push(data.problem_analysis.first_principles_insight?.explanation);

    // Root cause hypotheses - each is a list item
    data.problem_analysis.root_cause_hypotheses?.forEach(h => {
      content.listItems.push(h.hypothesis);
      content.listItems.push(h.explanation);
    });

    // Benchmarks table
    content.tables += data.problem_analysis.current_state_of_art?.benchmarks?.length || 0;
  }

  // ... continue for all rendered sections

  return content;
}
```

#### 2. Apply Content-Type Specific WPM Rates

Based on research on technical content reading speeds:

| Content Type | WPM Rate | Rationale |
|--------------|----------|-----------|
| Technical prose | 150 WPM | Dense, requires comprehension |
| Narrative prose | 180 WPM | Slightly easier flow |
| Headlines | 300 WPM | Scanned quickly |
| List items | 220 WPM | Structured, easier to parse |
| Table rows | 3 sec each | Fixed time per data row |

```typescript
function calculateReadTime(data: HybridReportData): number {
  const content = extractReadableContent(data);

  // Count words for each content type
  const proseWords = countWords(content.prose.filter(Boolean).join(' '));
  const headlineWords = countWords(content.headlines.filter(Boolean).join(' '));
  const listWords = countWords(content.listItems.filter(Boolean).join(' '));

  // Calculate time for each content type
  const proseMinutes = proseWords / 150;
  const headlineMinutes = headlineWords / 300;
  const listMinutes = listWords / 220;
  const tableMinutes = (content.tables * 3) / 60; // 3 seconds per row

  const totalMinutes = proseMinutes + headlineMinutes + listMinutes + tableMinutes;

  return Math.max(1, Math.round(totalMinutes));
}

function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}
```

### Sections to Extract (Matching ReportContent Rendering)

Based on `brand-system-report.tsx:561-628`, these sections are rendered:

1. **Brief** (`id="brief"`) - User's original input
2. **Executive Summary** (`id="executive-summary"`)
3. **Problem Analysis** (`id="problem-analysis"`)
4. **Constraints & Metrics** (`id="constraints"`)
5. **Challenge the Frame** (`id="challenge-the-frame"`)
6. **Innovation Analysis** (`id="innovation-analysis"`) - conditional
7. **Solution Concepts** (`id="solution-concepts"`) - Execution Track
8. **Innovation Portfolio** (`id="innovation-concepts"`)
9. **Frontier Watch** (`id="frontier-technologies"`)
10. **Risks & Watchouts** (`id="risks-watchouts"`)
11. **Self Critique** (`id="self-critique"`)
12. **Recommendation** (`id="final-recommendation"`)
13. **Key Insights** - conditional
14. **Next Steps** - conditional

### Fields Classification

#### Count as Prose (150 WPM)
- `brief`
- `executive_summary.narrative_lead`
- `executive_summary.the_problem`
- `executive_summary.core_insight.explanation`
- `executive_summary.primary_recommendation`
- `problem_analysis.whats_wrong.prose`
- `problem_analysis.why_its_hard.prose`
- `problem_analysis.first_principles_insight.explanation`
- `execution_track.primary.what_it_is`
- `execution_track.primary.why_it_works`
- `innovation_portfolio.recommended_innovation.what_it_is`
- `innovation_portfolio.recommended_innovation.why_it_works`
- `self_critique.confidence_rationale`
- `what_id_actually_do`

#### Count as Headlines (300 WPM)
- `title`
- `executive_summary.core_insight.headline`
- `problem_analysis.first_principles_insight.headline`
- `execution_track.primary.title`
- `execution_track.primary.bottom_line`
- `innovation_portfolio.recommended_innovation.title`

#### Count as List Items (220 WPM)
- `constraints_and_metrics.hard_constraints[]`
- `constraints_and_metrics.soft_constraints[]`
- `constraints_and_metrics.assumptions[]`
- `challenge_the_frame[].assumption`
- `challenge_the_frame[].challenge`
- `risks_and_watchouts[].risk`
- `risks_and_watchouts[].mitigation`
- `self_critique.what_we_might_be_wrong_about[]`
- `key_insights[]`
- `next_steps[]`

#### Count as Table Rows (3 sec each)
- `problem_analysis.current_state_of_art.benchmarks[]`
- `constraints_and_metrics.success_metrics[]`
- `execution_track.primary.validation_gates[]`

#### DO NOT Count (Metadata/Labels)
- Any `id` field
- Any `confidence` or `score` field
- Any `viability` field
- `source` fields (citations)
- `category` fields
- Timeline strings like "Week 1-4"
- Cost strings like "$50K-100K"

## Acceptance Criteria

- [ ] Read time within ±20% of actual reading time for 80% of reports
- [ ] Read time within ±2 minutes for reports under 15 minutes
- [ ] Minimum read time is 1 minute, maximum displayed is 60 minutes
- [ ] Calculation matches only rendered content (not hidden/conditional data)
- [ ] Different content types weighted appropriately

## Technical Considerations

### Performance
- Calculation happens once per render (memoized)
- No recursive deep traversal needed
- Explicit field extraction is O(1) per field

### Maintainability
- When new sections are added to `ReportContent`, add to extractors
- Field classification documented in code comments
- WPM rates configurable via constants

### Testing
- Create test fixtures with known word counts
- Validate against example reports in `apps/web/app/(marketing)/_components/example-reports/`
- Manual timing with 3-5 real users on sample reports

## Files to Modify

| File | Changes |
|------|---------|
| `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx` | Replace `calculateReadTime` function (lines 100-141) |
| `apps/web/app/home/(user)/reports/_lib/constants.ts` | Add WPM constants for different content types |

## MVP Implementation

### brand-system-report.tsx

```typescript
// Constants for reading speeds (WPM)
const WPM_PROSE = 150;        // Technical prose
const WPM_HEADLINE = 300;     // Scanned headlines
const WPM_LIST_ITEM = 220;    // Bullet points
const SECONDS_PER_TABLE_ROW = 3;

/**
 * Calculate estimated read time by extracting only rendered content
 * and applying content-type specific reading speeds.
 */
function calculateReadTime(data: HybridReportData): number {
  let proseWords = 0;
  let headlineWords = 0;
  let listItemWords = 0;
  let tableRows = 0;

  const countWords = (text: string | undefined | null): number => {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // Brief
  proseWords += countWords(data.brief);

  // Executive Summary
  if (typeof data.executive_summary === 'string') {
    proseWords += countWords(data.executive_summary);
  } else if (data.executive_summary) {
    proseWords += countWords(data.executive_summary.narrative_lead);
    proseWords += countWords(data.executive_summary.the_problem);
    proseWords += countWords(data.executive_summary.core_insight?.explanation);
    proseWords += countWords(data.executive_summary.primary_recommendation);
    headlineWords += countWords(data.executive_summary.core_insight?.headline);
  }

  // Problem Analysis
  if (data.problem_analysis) {
    proseWords += countWords(data.problem_analysis.whats_wrong?.prose);
    proseWords += countWords(data.problem_analysis.why_its_hard?.prose);
    proseWords += countWords(data.problem_analysis.first_principles_insight?.explanation);
    headlineWords += countWords(data.problem_analysis.first_principles_insight?.headline);

    data.problem_analysis.root_cause_hypotheses?.forEach(h => {
      listItemWords += countWords(h.hypothesis);
      listItemWords += countWords(h.explanation);
    });

    tableRows += data.problem_analysis.current_state_of_art?.benchmarks?.length || 0;
  }

  // Constraints
  if (data.constraints_and_metrics) {
    data.constraints_and_metrics.hard_constraints?.forEach(c => {
      listItemWords += countWords(c);
    });
    data.constraints_and_metrics.soft_constraints?.forEach(c => {
      listItemWords += countWords(c);
    });
    data.constraints_and_metrics.assumptions?.forEach(a => {
      listItemWords += countWords(a);
    });
    tableRows += data.constraints_and_metrics.success_metrics?.length || 0;
  }

  // Challenge the Frame
  data.challenge_the_frame?.forEach(c => {
    listItemWords += countWords(c.assumption);
    listItemWords += countWords(c.challenge);
    listItemWords += countWords(c.implication);
  });

  // Execution Track
  if (data.execution_track?.primary) {
    const p = data.execution_track.primary;
    headlineWords += countWords(p.title);
    headlineWords += countWords(p.bottom_line);
    proseWords += countWords(p.what_it_is);
    proseWords += countWords(p.why_it_works);
    tableRows += p.validation_gates?.length || 0;
  }

  // Innovation Portfolio
  if (data.innovation_portfolio?.recommended_innovation) {
    const r = data.innovation_portfolio.recommended_innovation;
    headlineWords += countWords(r.title);
    proseWords += countWords(r.what_it_is);
    proseWords += countWords(r.why_it_works);
  }

  // Risks
  data.risks_and_watchouts?.forEach(r => {
    listItemWords += countWords(r.risk);
    listItemWords += countWords(r.mitigation);
  });

  // Self Critique
  if (data.self_critique) {
    proseWords += countWords(data.self_critique.confidence_rationale);
    data.self_critique.what_we_might_be_wrong_about?.forEach(w => {
      listItemWords += countWords(w);
    });
  }

  // Final Recommendation
  proseWords += countWords(data.what_id_actually_do);

  // Key Insights & Next Steps
  data.key_insights?.forEach(i => listItemWords += countWords(i));
  data.next_steps?.forEach(s => listItemWords += countWords(s));

  // Calculate time
  const proseMinutes = proseWords / WPM_PROSE;
  const headlineMinutes = headlineWords / WPM_HEADLINE;
  const listMinutes = listItemWords / WPM_LIST_ITEM;
  const tableMinutes = (tableRows * SECONDS_PER_TABLE_ROW) / 60;

  const totalMinutes = proseMinutes + headlineMinutes + listMinutes + tableMinutes;

  return Math.max(1, Math.round(totalMinutes));
}
```

## References

### Internal
- `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx:100-141` - Current implementation
- `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx:561-628` - ReportContent rendering
- `apps/web/app/home/(user)/reports/_lib/types/hybrid-report-display.types.ts:467-493` - HybridReportData interface
- `apps/web/app/(marketing)/_components/example-reports/` - Example report data for testing

### External
- [Medium Read Time Calculation](https://blog.medium.com/read-time-and-you-bc2048ab620c) - 265 WPM baseline
- [Technical Reading Speeds](https://www.lifehack.org/articles/productivity/triple-your-speed-for-reading-and-processing-technical-documents.html) - 50-75 WPM for complex material
- [ngryman/reading-time](https://github.com/ngryman/reading-time) - Popular reading time library
