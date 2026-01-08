# DD Report: Deep Problem Breakdown & Fully Developed Concepts

## Problem Statement

The DD report currently has two structural gaps compared to the hybrid engineering report:

1. **Problem breakdown is shallow** - "800-1200 words teaching" vs hybrid's systematic breakdown (root causes, governing equations, why_its_hard)
2. **Solution concepts are summaries** - brief descriptions vs hybrid's fully developed concepts with transfer rationale, physics, validation steps

## User Insight (Critical)

> "The startup evaluation is the product, but the concepts and landscape help to evaluate that startup, and it's also that the problem space evaluation itself is the product for the VC so they're well informed for another company trying to do the same thing"

**This means the DD report is TWO products:**
1. **Reusable problem space education** - VCs can apply this knowledge to ANY company in the space
2. **Startup-specific evaluation** - positioning within that educated context

---

## Chain Analysis: Where Does the Raw Material Come From?

```
DD Chain:
DD0   → Extract claims + problem statement
AN0-M → First principles problem framing ✓ HAS: root_cause, governing_equation
AN1.5 → Teaching selection ✓
AN1.7 → Literature search ✓ HAS: abandoned_technology_analysis, gap_analysis
AN2-M → TRIZ methodology ✓
AN3-M → Full solution space ✓ HAS: frontier_transfer, cross-domain, paradigm_shift concepts
DD3   → Validate claims
DD3.5 → Commercialization
DD4   → Map onto solution space + moat
DD5   → Format report ← NEEDS RESTRUCTURING
```

**Key Finding**: The raw material EXISTS. AN0-M and AN3-M already produce deep problem breakdown and cross-domain concepts. DD5-M simply doesn't pull it through into the final report structure.

---

## Comparison: Hybrid vs DD (Current)

### Problem Analysis

| Element | Hybrid AN5-M | DD DD5-M (Current) |
|---------|--------------|-------------------|
| whats_wrong | Visceral failure mode description | ❌ Missing |
| what_industry_does_today | [{approach, limitation}] | Vague mention in prose |
| why_its_hard | {prose, governing_equation} | ❌ Missing |
| first_principles_insight | {headline, explanation} | ✓ Added recently |
| root_cause_hypotheses | [{name, confidence_percent, explanation}] | ❌ Missing |

### Solution Concepts

| Element | Hybrid AN5-M | DD DD5-M (Current) |
|---------|--------------|-------------------|
| what_it_is | 2-3 paragraphs full development | 1 sentence description |
| the_insight | {what, where_we_found_it, why_industry_missed_it} | ❌ Missing |
| why_it_works | Physics explanation | ❌ Missing |
| economics | {investment, expected_outcome, timeline} | ❌ Missing |
| first_validation_step | {test, cost, timeline, go_no_go} | ❌ Missing |
| innovation_type | CROSS_DOMAIN \| PARADIGM \| TECHNOLOGY_REVIVAL | Just track label |

---

## Phase 1: Schema Changes

**File**: `apps/web/lib/llm/prompts/dd/schemas.ts`

### 1.1 Add Problem Breakdown Schemas

```typescript
// ============================================
// Problem Breakdown Schemas (matching hybrid)
// ============================================

export const RootCauseHypothesisSchema = z.object({
  name: z.string().catch(''),
  confidence_percent: flexibleNumber(50, { min: 0, max: 100 }),
  explanation: z.string().catch(''),
});

export const GoverningEquationSchema = z.object({
  equation: z.string().optional(),
  explanation: z.string().catch(''),
  why_it_matters: z.string().optional(),
}).catch({});

export const WhyItsHardSchema = z.object({
  prose: z.string().catch(''),
  factors: z.array(z.string()).optional().default([]),
  governing_equation: GoverningEquationSchema.optional(),
}).catch({});

export const IndustryApproachSchema = z.object({
  approach: z.string().catch(''),
  limitation: z.string().catch(''),
  who_does_it: z.array(z.string()).optional().default([]),
}).catch({});
```

### 1.2 Add Fully Developed Solution Concept Schema

```typescript
// ============================================
// Fully Developed Solution Concept (matching hybrid depth)
// ============================================

export const ConceptInsightSchema = z.object({
  what: z.string().catch(''),
  where_we_found_it: z.object({
    domain: z.string().catch(''),
    how_they_use_it: z.string().optional(),
    why_it_transfers: z.string().optional(),
  }).optional(),
  why_industry_missed_it: z.string().optional(),
}).catch({});

export const ConceptEconomicsSchema = z.object({
  investment: z.string().optional(),
  expected_outcome: z.string().optional(),
  timeline: z.string().optional(),
}).catch({});

export const ConceptValidationStepSchema = z.object({
  test: z.string().catch(''),
  cost: z.string().optional(),
  timeline: z.string().optional(),
  go_criteria: z.string().optional(),
  no_go_criteria: z.string().optional(),
}).catch({});

export const FullyDevelopedConceptSchema = z.object({
  id: z.string().optional(),
  title: z.string().catch(''),
  track: flexibleEnum(['simpler_path', 'best_fit', 'paradigm_shift', 'frontier_transfer'], 'best_fit'),
  innovation_type: flexibleEnum(['CATALOG', 'EMERGING_PRACTICE', 'CROSS_DOMAIN', 'PARADIGM', 'TECHNOLOGY_REVIVAL'], 'CATALOG').optional(),

  // Full development (hybrid pattern)
  what_it_is: z.string().catch(''),  // 2-3 paragraphs
  the_insight: ConceptInsightSchema.optional(),
  why_it_works: z.string().optional(),  // Physics explanation
  economics: ConceptEconomicsSchema.optional(),
  key_risk: z.string().optional(),
  first_validation_step: ConceptValidationStepSchema.optional(),

  // DD-specific
  who_pursuing: z.array(z.string()).optional().default([]),
  startup_approach: z.boolean().optional().default(false),
  feasibility: flexibleNumber(5, { min: 1, max: 10 }).optional(),
  impact: flexibleNumber(5, { min: 1, max: 10 }).optional(),
}).catch({});
```

### 1.3 Extend DD5_M_QuickReferenceSchema

Add these fields to the existing schema:

```typescript
// Problem Breakdown (structured from AN0-M)
problem_breakdown: z.object({
  whats_wrong: z.string().optional(),  // Visceral problem description
  why_its_hard: WhyItsHardSchema.optional(),
  what_industry_does_today: z.array(IndustryApproachSchema).optional().default([]),
  root_cause_hypotheses: z.array(RootCauseHypothesisSchema).optional().default([]),
  first_principles_insight: z.string().optional(),  // Already exists, move here
}).optional().catch({}),

// Fully Developed Concepts (not summaries)
developed_concepts: z.array(FullyDevelopedConceptSchema).optional().default([]),

// Cross-Domain Insights (explicit section)
cross_domain_insights: z.array(z.object({
  source_domain: z.string().catch(''),
  mechanism: z.string().catch(''),
  why_it_transfers: z.string().optional(),
  who_pursuing: z.array(z.string()).optional().default([]),
  validation_approach: z.string().optional(),
})).optional().default([]),
```

---

## Phase 2: Prompt Changes

**File**: `apps/web/lib/llm/prompts/dd/prompts.ts`

### 2.1 Enhanced Problem Primer Instructions (DD5-M)

Replace the current Problem Primer section with:

```
#### 1. PROBLEM PRIMER (800-1200 words)

Synthesize AN0-M into an educational narrative that TEACHES the investor about this problem space.
This section should be REUSABLE - a VC should be able to apply this knowledge to ANY company in this space.

**Required Structure (Pull from AN0-M output):**

1. **WHAT'S WRONG** (visceral failure mode)
   - What is the pain point in plain English?
   - What fails? What breaks? What's frustrating?
   - Make the reader FEEL the problem

2. **WHY IT'S HARD** (physics/chemistry/biology constraints)
   - What are the fundamental constraints?
   - Include governing equations or thermodynamic limits where they build intuition
   - Example: "Heat recovery efficiency is capped by ΔT between streams—the smaller the difference, the larger (and more expensive) the heat exchanger. This is why waste heat below 150°C is rarely recovered economically."

3. **ROOT CAUSE HYPOTHESES** (from AN0-M root_cause_hypotheses)
   - What are the 2-4 fundamental reasons this problem persists?
   - Assign confidence levels
   - This teaches VCs HOW TO THINK about the problem

4. **WHAT INDUSTRY DOES TODAY** (current approaches + limitations)
   - 3-5 current approaches with specific limitations
   - WHO does each approach (named companies)
   - WHY each falls short

5. **FIRST PRINCIPLES INSIGHT** (the reframe)
   - The "aha" that changes how you think about solutions
   - Pull from AN0-M first_principles_insight

**Voice:** Write like a patient expert teaching a smart non-expert. Use specific numbers. Explain WHY constraints exist, not just THAT they exist.

**Test:** Could an investor read ONLY this section and evaluate ANY startup in this space more intelligently?
```

### 2.2 Enhanced Solution Landscape Instructions (DD5-M)

Replace the current Solution Landscape section with:

```
#### 3. SOLUTION LANDSCAPE (800-1200 words) — EXPANDED

This is Sparlo's CORE VALUE. Synthesize AN3-M into an educational map of ALL approaches.
This section is REUSABLE - a VC should understand the full landscape regardless of THIS startup.

**Required Structure:**

1. **THE LANDSCAPE OVERVIEW** (150-200 words)
   - How many fundamentally different approaches exist?
   - What are the major tracks? (simpler_path, best_fit, paradigm_shift, frontier_transfer)
   - What does first-principles analysis reveal about where value is created?

2. **FULLY DEVELOPED KEY APPROACHES** (400-600 words)

   For the 3-4 most important approaches (INCLUDING cross-domain innovations from AN3-M):

   Each approach gets FULL DEVELOPMENT (not a summary):

   **[Approach Title]** (Track: paradigm_shift / frontier_transfer / etc.)

   **What It Is** (2-3 paragraphs)
   - Full explanation, not a teaser
   - Enough detail that a reader could explain it to someone else

   **The Insight**
   - What: The core mechanism or principle
   - Where We Found It: Source domain + how they use it
   - Why Industry Missed It: The gap that prevented connection

   **Why It Works** (physics explanation)
   - The engineering/physics basis
   - What makes this approach viable

   **Economics** (brief)
   - Investment required
   - Expected outcome
   - Timeline to validation

   **Who's Pursuing This**
   - Named companies/labs
   - Stage of development

   **First Validation Step**
   - What to test
   - What success looks like

3. **STARTUP POSITIONING** (150-200 words)
   - Which approach did they choose?
   - Is this optimal based on first-principles?
   - What are they implicitly betting against?
   - What approaches from AN3-M did they NOT consider?

4. **CROSS-DOMAIN INNOVATIONS** (100-150 words)
   - What frontier_transfer concepts from AN3-M apply here?
   - What adjacent industries have solved similar physics?
   - Why hasn't transfer happened yet?

**Voice:** Strategic. Show the investor the whole landscape, not just this company.

**Test:** Could an investor use this section to evaluate MULTIPLE startups in this space?
```

### 2.3 Update OUTPUT FORMAT JSON

Add these new fields to the quick_reference section:

```json
"quick_reference": {
  // ... existing fields ...

  "problem_breakdown": {
    "whats_wrong": "Visceral problem description - what fails, what's frustrating",
    "why_its_hard": {
      "prose": "Physics/engineering constraints explanation",
      "factors": ["Factor 1", "Factor 2", "Factor 3"],
      "governing_equation": {
        "equation": "Optional: η = 1 - (T_cold/T_hot)",
        "explanation": "What this means and why it matters"
      }
    },
    "what_industry_does_today": [
      {
        "approach": "Current approach name",
        "limitation": "Why it falls short",
        "who_does_it": ["Company A", "Company B"]
      }
    ],
    "root_cause_hypotheses": [
      {
        "name": "Hypothesis name",
        "confidence_percent": 75,
        "explanation": "2-3 sentences explaining this root cause"
      }
    ]
  },

  "developed_concepts": [
    {
      "title": "Approach name",
      "track": "paradigm_shift | frontier_transfer | best_fit | simpler_path",
      "innovation_type": "CROSS_DOMAIN | PARADIGM | TECHNOLOGY_REVIVAL | CATALOG | EMERGING_PRACTICE",

      "what_it_is": "2-3 paragraphs fully explaining the approach",

      "the_insight": {
        "what": "The core mechanism or principle",
        "where_we_found_it": {
          "domain": "Source domain (e.g., 'Chlor-alkali industry')",
          "how_they_use_it": "How the source domain applies this",
          "why_it_transfers": "Why it applies to this problem"
        },
        "why_industry_missed_it": "The gap that prevented connection"
      },

      "why_it_works": "Physics/engineering explanation",

      "economics": {
        "investment": "$X-Y for validation/pilot",
        "expected_outcome": "Quantified improvement",
        "timeline": "Months to validation"
      },

      "key_risk": "The main thing that could go wrong",

      "first_validation_step": {
        "test": "What to test",
        "cost": "$X",
        "timeline": "X weeks",
        "go_criteria": "What success looks like",
        "no_go_criteria": "What failure looks like"
      },

      "who_pursuing": ["Company A", "Lab B"],
      "startup_approach": false,
      "feasibility": 7,
      "impact": 8
    }
  ],

  "cross_domain_insights": [
    {
      "source_domain": "Domain name",
      "mechanism": "What mechanism transfers",
      "why_it_transfers": "Why it applies here",
      "who_pursuing": ["Companies/labs"],
      "validation_approach": "How to test the transfer"
    }
  ]
}
```

---

## Phase 3: Rendering Changes

**File**: `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx`

### 3.1 Add Problem Breakdown Component

```typescript
// Problem Breakdown Section (structured from AN0-M)
const ProblemBreakdownSection = memo(function ProblemBreakdownSection({
  breakdown
}: {
  breakdown?: ProblemBreakdown
}) {
  if (!breakdown) return null;

  return (
    <Section id="problem-breakdown">
      <SectionTitle>Understanding the Problem</SectionTitle>

      {/* What's Wrong - visceral */}
      {breakdown.whats_wrong && (
        <ArticleBlock className="mt-8">
          <MonoLabel variant="strong" className="mb-2 block">What's Broken</MonoLabel>
          <BodyText size="lg" className="text-zinc-800">
            {breakdown.whats_wrong}
          </BodyText>
        </ArticleBlock>
      )}

      {/* Why It's Hard - physics */}
      {breakdown.why_its_hard?.prose && (
        <ArticleBlock className="mt-8">
          <MonoLabel variant="strong" className="mb-2 block">Why It's Hard</MonoLabel>
          <BodyText>{breakdown.why_its_hard.prose}</BodyText>

          {breakdown.why_its_hard.governing_equation?.equation && (
            <div className="mt-4 bg-zinc-50 border-l-2 border-zinc-900 p-4 rounded-r">
              <code className="text-sm font-mono text-zinc-800 block mb-2">
                {breakdown.why_its_hard.governing_equation.equation}
              </code>
              <BodyText variant="muted" size="sm">
                {breakdown.why_its_hard.governing_equation.explanation}
              </BodyText>
            </div>
          )}

          {breakdown.why_its_hard.factors && breakdown.why_its_hard.factors.length > 0 && (
            <ul className="mt-4 space-y-2">
              {breakdown.why_its_hard.factors.map((factor, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-zinc-400 mt-1">•</span>
                  <BodyText>{factor}</BodyText>
                </li>
              ))}
            </ul>
          )}
        </ArticleBlock>
      )}

      {/* Root Cause Hypotheses */}
      {breakdown.root_cause_hypotheses && breakdown.root_cause_hypotheses.length > 0 && (
        <ArticleBlock className="mt-8">
          <MonoLabel variant="strong" className="mb-4 block">Root Causes</MonoLabel>
          <div className="space-y-4">
            {breakdown.root_cause_hypotheses.map((hypothesis, i) => (
              <div key={i} className="border-l-2 border-zinc-200 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-zinc-900">{hypothesis.name}</span>
                  <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-mono">
                    {hypothesis.confidence_percent}% confidence
                  </span>
                </div>
                <BodyText variant="muted" size="sm">{hypothesis.explanation}</BodyText>
              </div>
            ))}
          </div>
        </ArticleBlock>
      )}

      {/* What Industry Does Today */}
      {breakdown.what_industry_does_today && breakdown.what_industry_does_today.length > 0 && (
        <ArticleBlock className="mt-8">
          <MonoLabel variant="strong" className="mb-4 block">Current Approaches</MonoLabel>
          <div className="space-y-3">
            {breakdown.what_industry_does_today.map((approach, i) => (
              <div key={i} className="border-l-2 border-zinc-200 pl-4 py-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <BodyText className="font-medium">{approach.approach}</BodyText>
                    <BodyText variant="muted" size="sm">{approach.limitation}</BodyText>
                  </div>
                  {approach.who_does_it && approach.who_does_it.length > 0 && (
                    <span className="text-xs text-zinc-400 shrink-0">
                      {approach.who_does_it.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ArticleBlock>
      )}
    </Section>
  );
});
```

### 3.2 Add Fully Developed Concepts Component

```typescript
// Fully Developed Concept Card (not summary)
const DevelopedConceptCard = memo(function DevelopedConceptCard({
  concept
}: {
  concept: FullyDevelopedConcept
}) {
  const trackLabels: Record<string, { label: string; style: string }> = {
    simpler_path: { label: 'Simpler Path', style: 'bg-zinc-100 text-zinc-700' },
    best_fit: { label: 'Best Fit', style: 'bg-zinc-200 text-zinc-800' },
    paradigm_shift: { label: 'Paradigm Shift', style: 'bg-zinc-700 text-white' },
    frontier_transfer: { label: 'Frontier Transfer', style: 'bg-zinc-900 text-white' },
  };

  const track = trackLabels[concept.track] || { label: concept.track, style: 'bg-zinc-100 text-zinc-700' };

  return (
    <div className={cn(
      "rounded-lg border p-6",
      concept.startup_approach
        ? "border-zinc-900 bg-zinc-50"
        : "border-zinc-200 bg-white"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={cn("px-2 py-0.5 text-xs font-medium rounded", track.style)}>
              {track.label}
            </span>
            {concept.innovation_type && concept.innovation_type !== 'CATALOG' && (
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-zinc-100 text-zinc-600">
                {concept.innovation_type.replace(/_/g, ' ')}
              </span>
            )}
            {concept.startup_approach && (
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-zinc-900 text-white">
                Startup's Approach
              </span>
            )}
          </div>
          <h4 className="text-lg font-semibold text-zinc-900">{concept.title}</h4>
        </div>
        {(concept.feasibility || concept.impact) && (
          <div className="text-right text-xs text-zinc-500 shrink-0">
            {concept.feasibility && <div>Feasibility: {concept.feasibility}/10</div>}
            {concept.impact && <div>Impact: {concept.impact}/10</div>}
          </div>
        )}
      </div>

      {/* What It Is (full development) */}
      {concept.what_it_is && (
        <div className="mb-6">
          <BodyText className="text-zinc-700 whitespace-pre-wrap">{concept.what_it_is}</BodyText>
        </div>
      )}

      {/* The Insight */}
      {concept.the_insight && (
        <div className="mb-6 bg-zinc-50 rounded-lg p-4 border-l-2 border-zinc-400">
          <MonoLabel variant="strong" className="mb-2 block text-xs">The Insight</MonoLabel>
          <BodyText className="font-medium mb-2">{concept.the_insight.what}</BodyText>

          {concept.the_insight.where_we_found_it && (
            <div className="text-sm text-zinc-600 space-y-1">
              <div><strong>Source:</strong> {concept.the_insight.where_we_found_it.domain}</div>
              {concept.the_insight.where_we_found_it.how_they_use_it && (
                <div><strong>Original use:</strong> {concept.the_insight.where_we_found_it.how_they_use_it}</div>
              )}
              {concept.the_insight.where_we_found_it.why_it_transfers && (
                <div><strong>Why it transfers:</strong> {concept.the_insight.where_we_found_it.why_it_transfers}</div>
              )}
            </div>
          )}

          {concept.the_insight.why_industry_missed_it && (
            <div className="mt-2 text-sm text-zinc-500 italic">
              Why missed: {concept.the_insight.why_industry_missed_it}
            </div>
          )}
        </div>
      )}

      {/* Why It Works */}
      {concept.why_it_works && (
        <div className="mb-6">
          <MonoLabel variant="strong" className="mb-2 block text-xs">Why It Works</MonoLabel>
          <BodyText variant="muted">{concept.why_it_works}</BodyText>
        </div>
      )}

      {/* Economics + Key Risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {concept.economics && (
          <div className="bg-zinc-50 rounded p-3">
            <MonoLabel variant="strong" className="mb-2 block text-xs">Economics</MonoLabel>
            <div className="text-sm space-y-1">
              {concept.economics.investment && <div><strong>Investment:</strong> {concept.economics.investment}</div>}
              {concept.economics.expected_outcome && <div><strong>Outcome:</strong> {concept.economics.expected_outcome}</div>}
              {concept.economics.timeline && <div><strong>Timeline:</strong> {concept.economics.timeline}</div>}
            </div>
          </div>
        )}

        {concept.key_risk && (
          <div className="bg-zinc-50 rounded p-3">
            <MonoLabel variant="strong" className="mb-2 block text-xs">Key Risk</MonoLabel>
            <BodyText size="sm">{concept.key_risk}</BodyText>
          </div>
        )}
      </div>

      {/* First Validation Step */}
      {concept.first_validation_step && (
        <div className="border-t border-zinc-200 pt-4 mt-4">
          <MonoLabel variant="strong" className="mb-2 block text-xs">First Validation Step</MonoLabel>
          <div className="text-sm">
            <div className="font-medium text-zinc-900 mb-1">{concept.first_validation_step.test}</div>
            <div className="flex gap-4 text-zinc-500 flex-wrap">
              {concept.first_validation_step.cost && <span>Cost: {concept.first_validation_step.cost}</span>}
              {concept.first_validation_step.timeline && <span>Timeline: {concept.first_validation_step.timeline}</span>}
            </div>
            {concept.first_validation_step.go_criteria && (
              <div className="mt-2 text-green-700 text-xs">
                ✓ Go if: {concept.first_validation_step.go_criteria}
              </div>
            )}
            {concept.first_validation_step.no_go_criteria && (
              <div className="text-red-700 text-xs">
                ✗ No-go if: {concept.first_validation_step.no_go_criteria}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Who's Pursuing */}
      {concept.who_pursuing && concept.who_pursuing.length > 0 && (
        <div className="mt-4 text-xs text-zinc-400">
          Also pursuing: {concept.who_pursuing.join(', ')}
        </div>
      )}
    </div>
  );
});

// Container for all developed concepts
const DevelopedConceptsSection = memo(function DevelopedConceptsSection({
  concepts
}: {
  concepts?: FullyDevelopedConcept[]
}) {
  if (!concepts?.length) return null;

  return (
    <Section id="solution-landscape-developed">
      <SectionTitle>Solution Landscape</SectionTitle>
      <ArticleBlock className="mt-4 mb-8">
        <BodyText variant="muted">
          The following approaches represent the full spectrum of solutions to this problem.
          Each is developed in depth to help evaluate not just this startup, but any company in this space.
        </BodyText>
      </ArticleBlock>

      <div className="space-y-6">
        {concepts.map((concept, i) => (
          <DevelopedConceptCard key={concept.id || i} concept={concept} />
        ))}
      </div>
    </Section>
  );
});
```

### 3.3 Add Cross-Domain Insights Component

```typescript
// Cross-Domain Insights Section
const CrossDomainInsightsSection = memo(function CrossDomainInsightsSection({
  insights
}: {
  insights?: CrossDomainInsight[]
}) {
  if (!insights?.length) return null;

  return (
    <Section id="cross-domain-insights">
      <SectionTitle>Cross-Domain Innovations</SectionTitle>
      <ArticleBlock className="mt-4 mb-6">
        <BodyText variant="muted">
          Solutions from adjacent industries that haven't yet been applied to this problem space.
        </BodyText>
      </ArticleBlock>

      <div className="space-y-4">
        {insights.map((insight, i) => (
          <div key={i} className="border-l-2 border-zinc-700 pl-4 py-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-zinc-900 text-white">
                {insight.source_domain}
              </span>
              <span className="text-zinc-400">→</span>
              <span className="text-zinc-600 text-sm">This problem</span>
            </div>
            <BodyText className="font-medium mb-1">{insight.mechanism}</BodyText>
            {insight.why_it_transfers && (
              <BodyText variant="muted" size="sm">{insight.why_it_transfers}</BodyText>
            )}
            <div className="flex gap-4 mt-2 text-xs text-zinc-400 flex-wrap">
              {insight.who_pursuing?.length > 0 && (
                <span>Pursuing: {insight.who_pursuing.join(', ')}</span>
              )}
              {insight.validation_approach && (
                <span>Validation: {insight.validation_approach}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
});
```

### 3.4 Update Main Render Order

The render order should be restructured to match hybrid's narrative flow:

```typescript
{/* REUSABLE PROBLEM SPACE EDUCATION */}

{/* Executive Summary */}
{/* ... existing ... */}

{/* Problem Breakdown (new - structured) */}
{quickRef?.problem_breakdown && (
  <ProblemBreakdownSection breakdown={quickRef.problem_breakdown} />
)}

{/* First Principles Insight (blockquote) */}
{quickRef?.first_principles_insight && (
  <InsightBlockquote insight={quickRef.first_principles_insight} />
)}

{/* Problem Primer (prose - existing) */}
{prose?.problem_primer?.content && (
  <Section id="problem-primer">
    <SectionTitle>Problem Primer</SectionTitle>
    <ArticleBlock className="mt-8">
      <BodyText parseCited>{prose.problem_primer.content}</BodyText>
    </ArticleBlock>
  </Section>
)}

{/* The Bet */}
{quickRef?.the_bet_statement && (
  <TheBetHighlight bet={quickRef.the_bet_statement} />
)}

{/* SOLUTION LANDSCAPE (centerpiece) */}

{/* Fully Developed Concepts (new - full development) */}
{quickRef?.developed_concepts && quickRef.developed_concepts.length > 0 && (
  <DevelopedConceptsSection concepts={quickRef.developed_concepts} />
)}

{/* OR: Solution Landscape Prose (if no developed_concepts) */}
{prose?.solution_landscape?.content && (!quickRef?.developed_concepts || quickRef.developed_concepts.length === 0) && (
  <Section id="solution-landscape">
    <SectionTitle>Solution Landscape</SectionTitle>
    <ArticleBlock className="mt-8">
      <BodyText parseCited>{prose.solution_landscape.content}</BodyText>
    </ArticleBlock>
  </Section>
)}

{/* Cross-Domain Insights */}
{quickRef?.cross_domain_insights && quickRef.cross_domain_insights.length > 0 && (
  <CrossDomainInsightsSection insights={quickRef.cross_domain_insights} />
)}

{/* STARTUP-SPECIFIC EVALUATION */}

{/* Technical Deep Dive (prose) */}
{/* Commercialization Reality (prose) */}
{/* Investment Synthesis (prose) */}
{/* ... rest of existing sections ... */}
```

---

## Phase 4: Verify Chain Outputs

### 4.1 Check AN0-M Output (Problem Framing)

Verify that AN0-M produces:
- `problem_analysis.root_cause_hypotheses`
- `physics_essence.governing_principles`
- `landscape_map.current_approaches`
- `industry_blind_spots`

If missing, may need to enhance AN0-M prompt for DD context.

### 4.2 Check AN3-M Output (Solution Space)

Verify that AN3-M produces:
- `concepts` with full `mechanistic_depth`
- `cross_domain_transfers` array
- `first_principles_concepts` array
- `innovation_source.cross_domain_inspiration`

If concepts are too brief, may need to enhance AN3-M prompt or add a synthesis step.

---

## Files to Modify

| File | Change Type | Risk |
|------|-------------|------|
| `apps/web/lib/llm/prompts/dd/schemas.ts` | Add problem breakdown + developed concept schemas | LOW (additive) |
| `apps/web/lib/llm/prompts/dd/prompts.ts` | Enhance DD5-M Problem Primer + Solution Landscape | MEDIUM |
| `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx` | Add new components + restructure render | LOW (optional) |

---

## Implementation Order

1. **Schema first** - Add all new schemas with defaults
2. **Verify chain outputs** - Check AN0-M and AN3-M produce raw material
3. **Prompt enhancement** - Update DD5-M with new structure requirements
4. **Rendering components** - Add problem breakdown + developed concepts
5. **Test** - Generate new DD report, verify depth matches hybrid

---

## Success Criteria

A successful DD report should:

1. **Problem section** that could teach a VC about ANY company in this space
2. **Solution concepts** with full development (2-3 paragraphs each, transfer rationale, physics, validation)
3. **Cross-domain innovations** explicitly called out with source domains
4. **Startup positioning** AFTER the landscape education (not as the focus)

**Test**: Can a VC read just the Problem Primer + Solution Landscape and be smarter about evaluating ANY startup in this space?
