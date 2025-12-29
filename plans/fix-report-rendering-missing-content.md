# Fix Report Rendering - Missing Content from JSON

## Overview

The JSON output contains complete data for `solution_concepts` and `innovation_concepts`, but the HTML report is not rendering all content due to:
1. **Incorrect section titles** (hardcoded legacy names)
2. **Field name mismatches** between JSON schema and TypeScript types
3. **Missing field mapping** for `solution_concepts` (unlike `innovation_concepts` which has partial mapping)

---

## What's Missing from the Report

### 1. Section Title Issues

| Current (Wrong)         | Should Be (Correct)     | Location |
|-------------------------|-------------------------|----------|
| "Execution Track"       | "Solution Concepts"     | Line 838 of `hybrid-report-display.tsx` |
| "Innovation Portfolio"  | "Innovation Concepts"   | Line 1205 of `hybrid-report-display.tsx` |

### 2. Supporting Solutions Not Rendering (Only 1-2 showing)

**Root Cause**: Field name mismatch in `solution_concepts`

| JSON Field | TypeScript Expected | Result |
|------------|---------------------|--------|
| `solution_concepts.supporting` | `ExecutionTrack.supporting_concepts` | **Not rendered** |

The mapping code (lines 2282-2285) does a **direct cast** without field name translation:
```typescript
const executionTrack =
  report.execution_track ??
  (rawReport.solution_concepts as ExecutionTrack | undefined);
```

This means `solution_concepts.supporting` (array of 3) is ignored because the code expects `supporting_concepts`.

**JSON has 3 supporting solutions:**
- `sol-support-1`: "Hospital Blood Bank Manufacturing Network"
- `sol-support-2`: "Stable Lentiviral Producer Lines + Continuous Perfusion"
- `sol-support-3`: "Real-Time Release Testing via Process Analytical Technology"

**None are rendering** because of the field name mismatch.

### 3. Additional Field Mismatches in `solution_concepts.primary`

| JSON Field (actual) | TypeScript Expected | Status |
|---------------------|---------------------|--------|
| `confidence_percent` | `confidence` | Needs mapping |
| `first_validation_step` | `validation_gates` (different structure) | Needs mapping/adaptation |
| `ip_considerations` | Not in `ExecutionTrackPrimary` | Not rendered |
| `coupled_effects` | Not in `ExecutionTrackPrimary` | Not rendered |
| `sustainability_flag` | Not in `ExecutionTrackPrimary` | Not rendered |
| `economics.expected_outcome.value` | `expected_improvement` | Needs mapping |
| `economics.investment.value` | `investment` | Needs mapping |
| `economics.timeline.value` | `timeline` | Needs mapping |

### 4. Innovation Concepts - Parallel Investigations

The mapping for `innovation_concepts` IS partially working (lines 2297-2306):
```typescript
const innovationPortfolio: InnovationPortfolio | undefined =
  report.innovation_portfolio ??
  (rawInnovationConcepts
    ? {
        intro: rawInnovationConcepts.intro,
        recommended_innovation: rawInnovationConcepts.recommended,
        parallel_investigations: rawInnovationConcepts.parallel,
        frontier_watch: rawInnovationConcepts.frontier_watch,
      }
    : undefined);
```

**JSON has 2 parallel investigations:**
- `innov-parallel-1`: "Haploidentical CAR-T Bank with Post-Transplant Cyclophosphamide"
- `innov-parallel-2`: "Intratumoral Electroporation for In Situ TIL Arming"

These SHOULD render, but field names within each investigation may need mapping (e.g., `confidence_percent` → `confidence`).

---

## Fix Plan

### Phase 1: Fix Section Titles

**File**: `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`

#### Task 1.1: Rename "Execution Track" → "Solution Concepts"
- Line 838: Change `title="Execution Track"` to `title="Solution Concepts"`
- Line 839: Update subtitle from "Your primary recommendation - the safe bet" to appropriate text (e.g., "Proven approaches using validated technologies")

#### Task 1.2: Rename "Innovation Portfolio" → "Innovation Concepts"
- Line 1205: Change `title="Innovation Portfolio"` to `title="Innovation Concepts"`
- Subtitle at line 1206 can remain as-is ("Higher-risk bets with breakthrough potential")

### Phase 2: Fix Field Name Mapping for `solution_concepts`

**File**: `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`

#### Task 2.1: Add field mapping for solution_concepts → executionTrack

Replace lines 2282-2285:
```typescript
const executionTrack =
  report.execution_track ??
  (rawReport.solution_concepts as ExecutionTrack | undefined);
```

With proper field mapping:
```typescript
const rawSolutionConcepts = rawReport.solution_concepts as
  | {
      intro?: string;
      primary?: {
        id?: string;
        title?: string;
        confidence_percent?: number;
        source_type?: string;
        what_it_is?: string;
        why_it_works?: string;
        economics?: {
          expected_outcome?: { value?: string };
          investment?: { value?: string };
          timeline?: { value?: string };
        };
        the_insight?: {
          what?: string;
          where_we_found_it?: {
            domain?: string;
            how_they_use_it?: string;
            why_it_transfers?: string;
          };
          why_industry_missed_it?: string;
        };
        first_validation_step?: {
          test?: string;
          cost?: string;
          timeline?: string;
          go_criteria?: string;
          no_go_criteria?: string;
        };
        key_risks?: Array<{ risk?: string; mitigation?: string }>;
        coupled_effects?: CoupledEffect[];
        sustainability_flag?: SustainabilityFlag;
        ip_considerations?: IPConsiderations;
      };
      supporting?: Array<{
        id?: string;
        title?: string;
        relationship?: string;
        what_it_is?: string;
        why_it_works?: string;
        when_to_use_instead?: string;
        confidence_percent?: number;
        economics?: {
          expected_outcome?: string;
          investment?: string;
          timeline?: string;
        };
        the_insight?: InsightBlock;
        sustainability_flag?: SustainabilityFlag;
      }>;
    }
  | undefined;

const executionTrack: ExecutionTrack | undefined =
  report.execution_track ??
  (rawSolutionConcepts
    ? {
        intro: rawSolutionConcepts.intro,
        primary: rawSolutionConcepts.primary
          ? {
              id: rawSolutionConcepts.primary.id,
              title: rawSolutionConcepts.primary.title,
              confidence: rawSolutionConcepts.primary.confidence_percent,
              source_type: rawSolutionConcepts.primary.source_type as ExecutionTrackPrimary['source_type'],
              what_it_is: rawSolutionConcepts.primary.what_it_is,
              why_it_works: rawSolutionConcepts.primary.why_it_works,
              expected_improvement: rawSolutionConcepts.primary.economics?.expected_outcome?.value,
              investment: rawSolutionConcepts.primary.economics?.investment?.value,
              timeline: rawSolutionConcepts.primary.economics?.timeline?.value,
              the_insight: rawSolutionConcepts.primary.the_insight,
              // Map validation step to validation_gates format
              validation_gates: rawSolutionConcepts.primary.first_validation_step
                ? [{
                    test: rawSolutionConcepts.primary.first_validation_step.test,
                    cost: rawSolutionConcepts.primary.first_validation_step.cost,
                    success_criteria: rawSolutionConcepts.primary.first_validation_step.go_criteria,
                  }]
                : undefined,
            }
          : undefined,
        supporting_concepts: rawSolutionConcepts.supporting?.map((s) => ({
          id: s.id,
          title: s.title,
          relationship: s.relationship as SupportingConcept['relationship'],
          what_it_is: s.what_it_is,
          why_it_works: s.why_it_works,
          when_to_use_instead: s.when_to_use_instead,
          confidence: s.confidence_percent,
        })),
      }
    : undefined);
```

### Phase 3: Add Missing Fields to TypeScript Types (Optional Enhancement)

**File**: `apps/web/app/home/(user)/reports/_lib/types/hybrid-report-display.types.ts`

Consider extending `ExecutionTrackPrimary` to include:
- `coupled_effects?: CoupledEffect[]`
- `sustainability_flag?: SustainabilityFlag`
- `ip_considerations?: IPConsiderations`
- `key_risks?: Array<{ risk?: string; mitigation?: string }>`

Then add corresponding UI sections in `ExecutionTrackSection`.

### Phase 4: Fix Parallel Investigations Field Mapping

**File**: `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`

Update the innovation_concepts mapping (around lines 2297-2306) to handle `confidence_percent`:

```typescript
parallel_investigations: rawInnovationConcepts.parallel?.map((p) => ({
  ...p,
  confidence: p.confidence_percent ?? p.confidence,
})),
```

---

## Files to Modify

1. `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`
   - Lines 838-839: Section title
   - Lines 1205-1206: Section title
   - Lines 2282-2306: Add field mapping

2. (Optional) `apps/web/app/home/(user)/reports/_lib/types/hybrid-report-display.types.ts`
   - Add missing type fields for completeness

---

## Acceptance Criteria

- [ ] Section is titled "Solution Concepts" (not "Execution Track")
- [ ] Section is titled "Innovation Concepts" (not "Innovation Portfolio")
- [ ] All 3 supporting solutions render (`sol-support-1`, `sol-support-2`, `sol-support-3`)
- [ ] Primary solution shows confidence percentage
- [ ] Primary solution shows economics (expected outcome, investment, timeline)
- [ ] All 2 parallel investigations render (`innov-parallel-1`, `innov-parallel-2`)
- [ ] All 3 frontier watch items render

---

## Test Plan

1. Load the report with `EXAMPLE_JSON_OUTPUT` data
2. Verify section titles are correct
3. Count visible supporting solutions (should be 3)
4. Count visible parallel investigations (should be 2)
5. Verify primary solution shows:
   - Title: "Integrated Rapid Manufacturing: T-Charge + Sleeping Beauty + Prodigy"
   - Confidence: 85%
   - Economics values
   - Key risks
