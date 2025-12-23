# Schema Consolidation: Hybrid Mode v4.0 (Simplified)

## Overview

Update Zod schemas in `hybrid-schemas.ts` to match the canonical AN5_M_PROMPT output structure.

**Type**: refactor
**Estimated Time**: 2-4 hours

---

## What Needs to Happen

1. **Fix 4 naming mismatches** - `cross_domain_search` → `innovation_analysis`, etc.
2. **Add 3 missing fields** - `brief`, `what_id_actually_do`, `follow_up_prompts`
3. **Delete ~30 unused schemas** - grep first, then delete
4. **Restructure concepts** - Update `solution_concepts` and `innovation_concepts` structure
5. **Update display component** - Simple fallbacks for renamed fields

---

## Phase 1: Add New Schemas & Enums

**Goal**: Add all new enums, sub-schemas, and restructured concept schemas in one pass.

### 1.1 Add Enums

Add to `apps/web/lib/llm/prompts/hybrid/schemas.ts`:

```typescript
export const SourceType = z.enum(['CATALOG', 'EMERGING', 'CROSS_DOMAIN', 'PARADIGM']);
export const InnovationConceptType = z.enum(['CROSS_DOMAIN', 'PARADIGM', 'TECHNOLOGY_REVIVAL', 'FIRST_PRINCIPLES']);
export const FrontierInnovationType = z.enum(['PARADIGM', 'EMERGING_SCIENCE']);
export const SupportingRelationship = z.enum(['FALLBACK', 'COMPLEMENTARY']);
export const EconomicsBasis = z.enum(['CALCULATED', 'ESTIMATED', 'ASSUMED']);
export const FreedomToOperate = z.enum(['GREEN', 'YELLOW', 'RED']);
export const EffectDirection = z.enum(['BETTER', 'WORSE', 'NEUTRAL']);
export const EffectMagnitude = z.enum(['MINOR', 'MODERATE', 'MAJOR']);
```

### 1.2 Add Sub-Schemas (only those reused)

```typescript
const TheInsightSchema = z.object({
  what: z.string(),
  where_we_found_it: z.union([z.string(), z.object({
    domain: z.string(),
    how_they_use_it: z.string(),
    why_it_transfers: z.string()
  }).passthrough()]).optional(),
  why_industry_missed_it: z.string()
}).passthrough();

const EconomicValueSchema = z.object({
  value: z.string(),
  basis: EconomicsBasis,
  rationale: z.string()
}).passthrough();

const CoupledEffectSchema = z.object({
  domain: z.string(),
  effect: z.string(),
  direction: EffectDirection,
  magnitude: EffectMagnitude,
  quantified: z.string().optional(),
  mitigation: z.string().optional()
}).passthrough();

const IpConsiderationsSchema = z.object({
  freedom_to_operate: FreedomToOperate,
  rationale: z.string(),
  key_patents_to_review: z.array(z.string()).default([]),
  patentability_potential: z.enum(['HIGH', 'MEDIUM', 'LOW', 'NOT_NOVEL'])
}).passthrough();
```

### 1.3 Create New Concept Schemas

```typescript
// Solution Concepts
const PrimarySolutionConceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  confidence_percent: z.number().int().min(0).max(100),
  source_type: SourceType,
  what_it_is: z.string(),
  the_insight: TheInsightSchema,
  why_it_works: z.string(),
  economics: z.object({
    investment: EconomicValueSchema,
    expected_outcome: EconomicValueSchema,
    timeline: EconomicValueSchema,
    roi_rationale: z.string().optional()
  }).passthrough(),
  coupled_effects: z.array(CoupledEffectSchema).default([]),
  ip_considerations: IpConsiderationsSchema.optional(),
  key_risks: z.array(z.object({ risk: z.string(), mitigation: z.string() }).passthrough()).default([]),
  sustainability_flag: SustainabilityFlagSchema.optional(),
  first_validation_step: z.object({
    test: z.string(),
    who_performs: z.string(),
    equipment_method: z.string(),
    sample_sourcing: z.object({ material: z.string(), lead_time: z.string(), quantity: z.string() }).passthrough(),
    replicates: z.number().int().positive(),
    cost: z.string(),
    timeline: z.string(),
    go_criteria: z.string(),
    no_go_criteria: z.string()
  }).passthrough()
}).passthrough();

const SupportingSolutionConceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  confidence_percent: z.number().int().min(0).max(100),
  relationship: SupportingRelationship,
  what_it_is: z.string(),
  the_insight: TheInsightSchema,
  why_it_works: z.string(),
  economics: z.object({ investment: z.string(), expected_outcome: z.string(), timeline: z.string() }).passthrough(),
  key_risk: z.string(),
  sustainability_flag: SustainabilityFlagSchema.optional(),
  when_to_use_instead: z.string()
}).passthrough();

const SolutionConceptsSchema = z.object({
  intro: z.string().optional(),
  primary: PrimarySolutionConceptSchema,
  supporting: z.array(SupportingSolutionConceptSchema).default([])
}).passthrough();

// Innovation Concepts
const RecommendedInnovationConceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  confidence_percent: z.number().int().min(0).max(100),
  innovation_type: InnovationConceptType,
  what_it_is: z.string(),
  the_insight: TheInsightSchema,
  why_it_works: z.string(),
  breakthrough_potential: z.object({
    if_it_works: z.string(),
    estimated_improvement: z.string(),
    industry_impact: z.string()
  }).passthrough(),
  economics: z.object({
    investment: EconomicValueSchema,
    ceiling_if_works: EconomicValueSchema,
    timeline: EconomicValueSchema
  }).passthrough(),
  coupled_effects: z.array(CoupledEffectSchema).default([]),
  ip_considerations: IpConsiderationsSchema.optional(),
  key_risks: z.array(z.object({ risk: z.string(), mitigation: z.string() }).passthrough()).default([]),
  sustainability_flag: SustainabilityFlagSchema.optional(),
  first_validation_step: z.object({
    gating_question: z.string(),
    test: z.string(),
    cost: z.string(),
    timeline: z.string(),
    go_no_go: z.string()
  }).passthrough(),
  why_this_one: z.string()
}).passthrough();

const ParallelInnovationConceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  confidence_percent: z.number().int().min(0).max(100),
  innovation_type: InnovationConceptType,
  what_it_is: z.string(),
  the_insight: TheInsightSchema,
  why_it_works: z.string(),
  economics: z.object({ investment: z.string(), ceiling_if_works: z.string() }).passthrough(),
  key_uncertainty: z.string(),
  sustainability_flag: SustainabilityFlagSchema.optional(),
  first_validation_step: z.object({ test: z.string(), cost: z.string(), go_no_go: z.string() }).passthrough(),
  when_to_elevate: z.string()
}).passthrough();

const FrontierWatchSchema = z.object({
  id: z.string(),
  title: z.string(),
  innovation_type: FrontierInnovationType,
  earliest_viability: z.string(),
  what_it_is: z.string(),
  why_interesting: z.string(),
  why_not_now: z.string(),
  who_to_monitor: z.preprocess(
    (val) => typeof val === 'string' ? val.split(',').map(s => s.trim()) : val,
    z.array(z.string()).default([])
  ), // Handle legacy string format
  trigger_to_revisit: z.string(),
  recent_developments: z.string().optional(),
  trl_estimate: z.number().int().min(1).max(9).optional(),
  competitive_activity: z.string().optional()
}).passthrough();

const InnovationConceptsSchema = z.object({
  intro: z.string().optional(),
  recommended: RecommendedInnovationConceptSchema.optional(),
  parallel: z.array(ParallelInnovationConceptSchema).default([]),
  frontier_watch: z.array(FrontierWatchSchema).default([])
}).passthrough();
```

### 1.4 Add Missing Schemas

```typescript
const InnovationAnalysisSchema = z.object({
  reframe: z.string(),
  domains_searched: z.array(z.string()).default([])
}).passthrough();

const ConstraintsAndMetricsSchema = z.object({
  hard_constraints: z.array(z.string()).default([]),
  soft_constraints: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  success_metrics: z.array(z.object({
    metric: z.string(),
    target: z.string(),
    minimum_viable: z.string(),
    stretch: z.string(),
    unit: z.string().optional()
  }).passthrough()).default([])
}).passthrough();

const ChallengeFrameSchema = z.object({
  assumption: z.string(),
  challenge: z.string(),
  implication: z.string()
}).passthrough();
```

**Success Criteria**: `pnpm typecheck` passes

---

## Phase 2: Update AN5_M_OutputSchema & Delete Dead Code

**Goal**: Restructure the main output schema, fix renames, and delete unused schemas.

### 2.1 Fix Naming Mismatches

| Old Name | New Name |
|----------|----------|
| `cross_domain_search` | `innovation_analysis` |
| `cross_domain_search.intro` | `innovation_analysis.reframe` |
| `constraints` | `constraints_and_metrics` |
| `self_critique.confidence_level` | `self_critique.overall_confidence` |

### 2.2 Update AN5_M_OutputSchema

```typescript
export const AN5_M_OutputSchema = z.object({
  header: z.object({
    title: z.string(),
    date: z.string(),
    version: z.string()
  }).passthrough(),

  brief: z.string().optional(),

  executive_summary: z.object({
    narrative_lead: z.string(),
    viability: z.union([
      ViabilityVerdict,
      z.object({
        assessment: ViabilityVerdict,
        confidence: z.number().int().min(0).max(100),
        label: z.string()
      }).passthrough()
    ]),
    primary_recommendation: z.string()
  }).passthrough(),

  problem_analysis: ProblemAnalysisSchema.optional(),
  constraints_and_metrics: ConstraintsAndMetricsSchema.optional(),

  innovation_analysis: InnovationAnalysisSchema.optional(),

  solution_concepts: SolutionConceptsSchema.optional(),
  innovation_concepts: InnovationConceptsSchema.optional(),

  challenge_the_frame: z.array(ChallengeFrameSchema).default([]),
  risks_and_watchouts: z.array(z.object({
    category: z.string(),
    risk: z.string(),
    severity: SeverityLevel,
    mitigation: z.string().optional(),
    requires_resolution_before_proceeding: z.boolean().optional()
  }).passthrough()).default([]),

  what_id_actually_do: z.string().optional(),

  self_critique: z.object({
    overall_confidence: ConfidenceLevel,
    confidence_rationale: z.string(),
    what_we_might_be_wrong_about: z.array(z.string()).default([]),
    unexplored_directions: z.array(z.string()).default([]),
    validation_gaps: z.array(z.object({
      concern: z.string(),
      status: z.enum(['ADDRESSED', 'EXTENDED_NEEDED', 'ACCEPTED_RISK']),
      rationale: z.string()
    }).passthrough()).default([])
  }).passthrough(),

  follow_up_prompts: z.array(z.string()).default([]),

  metadata: z.object({
    generated_at: z.string(),
    model_version: z.string(),
    chain_version: z.string(),
    framework: z.string()
  }).passthrough().optional()
}).passthrough();
```

### 2.3 Delete Unused Schemas

First, verify usage with grep:
```bash
grep -r "ExecutionTrackSchema" apps/web/
grep -r "LeadConceptSchema" apps/web/
# ... etc for all schemas
```

**Delete these schemas** (after confirming no usage):
- ExecutionTrackSchema, ExecutionTrackPrimarySchema
- NewSupportingConceptSchema, FallbackTriggerSchema
- RootCauseSatisfactionSchema, WhySafeSchema
- InnovationPortfolioSchema, RecommendedInnovationSchema (old)
- ParallelInvestigationSchema, StrategicIntegrationSchema
- PortfolioViewSchema, ResourceAllocationSchema
- NewDecisionArchitectureSchema, PrimaryTradeoffSchema
- HonestAssessmentSchema, CalibratedClaimsSchema
- WhatYouCouldGetElsewhereSchema, WhatSparloProvidesSchema
- HonestSupplierArbitrageSchema, PersonalRecommendationSchema
- NewPersonalRecommendationSchema, NextStepsGranularSchema
- DecisionFlowchartSchema, LegacyDecisionArchitectureSchema
- OperationalAlternativeSchema, OperationalAlternativesSectionSchema
- SupplierArbitrageSchema, WhyNotObviousSchema
- NewActionPlanStepSchema, ActionPlanStepSchema
- LeadConceptSchema, SparkConceptSchema, ParallelExplorationSchema
- OtherConceptSchema, KeyPatternSchema, ComparisonRowSchema
- ValidationGateSchema, ConceptTagsSchema, InsightBlockSchema

**Remove from AN5_M_OutputSchema**:
- key_patterns, other_concepts, key_insights
- decision_architecture, decision_flowchart
- personal_recommendation, next_steps
- strategic_implications, appendix
- executive_summary.recommended_path
- problem_analysis.success_metrics

### 2.4 Update index.ts Exports

Add new exports, remove deleted ones.

**Success Criteria**: `pnpm typecheck` passes after deletions

---

## Phase 3: Update Display Component & Verify

**Goal**: Update display component with backward-compatible fallbacks, run verification.

### 3.1 Update hybrid-report-display.tsx

Use simple fallbacks for renamed fields:

```typescript
// Backward-compatible field access
const innovationData = data.innovation_analysis ?? data.cross_domain_search;
const constraintsData = data.constraints_and_metrics ?? data.constraints;
const confidenceLevel = data.self_critique?.overall_confidence ?? data.self_critique?.confidence_level;

// Render new fields if present
{data.brief && <BriefSection brief={data.brief} />}
{data.what_id_actually_do && <PersonalTakeSection content={data.what_id_actually_do} />}
{data.follow_up_prompts?.length > 0 && <FollowUpSection prompts={data.follow_up_prompts} />}
```

### 3.2 Verification Commands

```bash
# Type check
pnpm typecheck

# Lint and format
pnpm lint:fix
pnpm format:fix

# Search for remaining references to deleted schemas
grep -r "cross_domain_search" apps/web/
grep -r "ExecutionTrackSchema" apps/web/

# Build
pnpm build
```

---

## Files Changed

| File | Changes |
|------|---------|
| `apps/web/lib/llm/prompts/hybrid/schemas.ts` | Add enums, sub-schemas, delete unused |
| `apps/web/lib/llm/prompts/hybrid/index.ts` | Update exports |
| `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx` | Backward-compat fallbacks |

---

## Checklist

- [ ] Add 8 new enums
- [ ] Add reusable sub-schemas (TheInsightSchema, EconomicValueSchema, etc.)
- [ ] Create new SolutionConceptsSchema structure
- [ ] Create new InnovationConceptsSchema structure
- [ ] Fix 4 field renames in AN5_M_OutputSchema
- [ ] Add 3 missing fields (brief, what_id_actually_do, follow_up_prompts)
- [ ] Delete ~30 unused schemas (grep first!)
- [ ] Update index.ts exports
- [ ] Update display component with fallbacks
- [ ] Run `pnpm typecheck` - must pass
- [ ] Run `pnpm build` - must succeed

---

## Key Files

- **Schemas**: `apps/web/lib/llm/prompts/hybrid/schemas.ts`
- **Prompts**: `apps/web/lib/llm/prompts/hybrid/prompts.ts` (AN5_M_PROMPT is the canonical reference)
- **Display**: `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`
- **Inngest**: `apps/web/lib/inngest/functions/generate-hybrid-report.ts`
