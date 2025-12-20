# Prompt Engineering Patterns

**Solution Documentation**

This document captures the advanced prompt engineering patterns used throughout Sparlo's LLM analysis chain (AN0-AN5). These patterns ensure reliable, maintainable, and high-quality AI outputs in production.

## Table of Contents

1. [Chain Context Pattern](#1-chain-context-pattern)
2. [Writing Rules (DO/DON'T Patterns)](#2-writing-rules-dodont-patterns)
3. [Self-Critique Section Design](#3-self-critique-section-design)
4. [Antifragile Zod Schema Patterns](#4-antifragile-zod-schema-patterns)
5. [Schema Versioning and Deprecation](#5-schema-versioning-and-deprecation)
6. [Backwards Compatibility Strategies](#6-backwards-compatibility-strategies)

---

## 1. Chain Context Pattern

### Overview

The chain context pattern provides downstream LLM stages with explicit awareness of prior analysis stages. This creates coherence across multi-stage reasoning and prevents context loss.

### Implementation

**Location**: All final report generation prompts (AN5, AN5-D)

**Pattern Structure**:

```typescript
export const AN5_D_PROMPT = `You are running Stage 7 of 7 in Discovery Mode.

## CHAIN CONTEXT

You have access to the full discovery chain results:
- AN0-D: Problem framing, industry landscape
- AN1.5-D + AN1.7-D: Teaching examples, gap analysis
- AN2-D: Methodology briefing
- AN3-D: Generated concepts
- AN4-D: Validated novelty, evaluated, made portfolio decisions
- YOU (AN5-D): Write the final Discovery Report
`;
```

**Standard Mode Example** (`an5-report.ts`):

```typescript
export const AN5_PROMPT = `You are writing an EXECUTIVE INNOVATION REPORT.

## Your Role

You have the complete output from the analysis chain:
- Problem framing with physics and first principles (AN0)
- Teaching examples and validation data (AN1.5)
- Literature validation (AN1.7)
- Innovation methodology briefing (AN2)
- Generated concepts across three tracks (AN3)
- Validation results and recommendations (AN4)

Your job is to synthesize this into a report that:
1. A senior engineering leader can read in 10 minutes
2. Contains actionable recommendations with a clear decision path
`;
```

### Why This Works

1. **Explicit Stage Awareness**: The LLM knows exactly what information it has and from which stage
2. **Context Priming**: Mentioning prior stages activates relevant context from the conversation history
3. **Role Clarity**: The LLM understands its specific role in the chain
4. **Prevents Hallucination**: Explicit enumeration reduces likelihood of making up missing information

### Best Practices

- **Always list stages in order**: Helps LLM understand temporal sequencing
- **Use consistent naming**: AN0, AN1.5, AN2, etc. should match across all prompts
- **Include brief descriptions**: "Problem framing" vs just "AN0" provides semantic context
- **Position early in prompt**: Context setting should happen before detailed instructions

---

## 2. Writing Rules (DO/DON'T Patterns)

### Overview

Explicit DO/DON'T sections provide clear behavioral guardrails that prevent common LLM failure modes like overselling, hedging, or producing marketing copy instead of analysis.

### Implementation

**Location**: `apps/web/lib/llm/prompts/discovery/an5-d-report.ts`

```typescript
## WRITING RULES

**DO:**
- Lead with insight, not background
- Quantify with uncertainty ranges (e.g., "~$50K ± 50%")
- Be specific ("counter-current thermosiphon" not "bio-inspired")
- Acknowledge unknowns explicitly
- Make clear, actionable recommendations

**DON'T:**
- Oversell ("revolutionary breakthrough")
- Hide uncertainty behind jargon
- Skip self-critique
- Write like marketing copy
- Recommend without validation path
```

### Why This Works

1. **Behavioral Contrast**: DO/DON'T pairs create clear behavioral boundaries
2. **Concrete Examples**: "counter-current thermosiphon" vs "bio-inspired" gives specific guidance
3. **Prevents Common Failures**: Each DON'T addresses a real failure mode observed in testing
4. **Reinforces Values**: Emphasizes honesty, specificity, and actionability

### Pattern Variations

**Discovery Mode** (Emphasizes novelty and honesty):
```
DO:
- Lead with insight, not background
- Quantify with uncertainty ranges
- Be specific with technical terminology
- Acknowledge unknowns explicitly

DON'T:
- Oversell ("revolutionary breakthrough")
- Hide uncertainty behind jargon
- Skip self-critique
- Write like marketing copy
```

**Standard Mode** (Emphasizes executive clarity):
```
Report Philosophy:

**Premium through precision:**
- Typography does the work (no boxes, shadows, decoration)
- Every sentence earns its place
- The report IS the product—not "AI output"

**Engineer's respect:**
- Assume intelligence, provide depth
- Show your work (the physics, the reasoning)
- Honest about uncertainty and assumptions

**Conversational authority:**
- Write like you're the senior engineer briefing the project lead
- Use "we", "you", "this project"—not detached academic voice
- Be direct: "If this were my project, I'd..."
```

### Application Guidelines

**When to Use DO/DON'T Lists**:
- Writing tasks (reports, summaries, recommendations)
- When specific failure modes are known
- When tone and style matter significantly

**When to Use Philosophy Sections**:
- Complex multi-dimensional guidance
- When establishing overall voice/persona
- For high-stakes executive-facing outputs

---

## 3. Self-Critique Section Design

### Overview

Self-critique sections force the LLM to steelman opposing arguments and identify weaknesses in its own analysis. This dramatically improves intellectual honesty and output quality.

### Implementation

**Location**: `apps/web/lib/llm/prompts/discovery/an5-d-report.ts`

```typescript
"self_critique": {
  "strongest_argument_against": "What would a skeptic say? Make it genuinely strong.",
  "prior_art_we_might_have_missed": ["What searches should we have run?"],
  "physics_assumptions_to_verify": ["What's assumed but not proven?"],
  "domain_expert_pushback": ["Anticipated objections from experts"],
  "what_would_change_recommendation": ["Conditions that would invalidate this analysis"]
}
```

**Prompt Instructions**:
```typescript
## FINAL REMINDERS

1. The self_critique section is REQUIRED - be genuinely hard on yourself
2. Lead with insight, not background in executive_summary
3. Quantify with uncertainty ranges ("~$50K ± 50%") throughout
4. Be specific in terminology ("counter-current thermosiphon" not "bio-inspired")
5. Acknowledge unknowns explicitly in honest_uncertainties
6. Never recommend without a clear validation_experiment
```

### Schema Enforcement

The schema makes self-critique **mandatory**:

```typescript
const SelfCritiqueSchema = z.object({
  strongest_argument_against: z.string(),  // Required, not optional
  prior_art_we_might_have_missed: z.array(z.string()).catch([]),
  physics_assumptions_to_verify: z.array(z.string()).catch([]),
  domain_expert_pushback: z.array(z.string()).catch([]),
  what_would_change_recommendation: z.array(z.string()).catch([]),
}).passthrough();

const ReportSchema = z.object({
  // ... other fields ...
  // Self-critique is REQUIRED - this section must not be skipped
  self_critique: SelfCritiqueSchema,  // Not .optional()!
  executive_summary: ExecutiveSummarySchema,
  appendix: AppendixSchema.optional(),
}).passthrough();
```

### Why This Works

1. **Forces Adversarial Thinking**: The LLM must argue against its own conclusions
2. **Surface Blind Spots**: "What searches should we have run?" catches missing research
3. **Honest Uncertainty**: "What's assumed but not proven?" prevents overconfidence
4. **Conditional Validity**: "What would change this recommendation?" establishes scope limits
5. **Schema Enforcement**: Required field means output fails validation if skipped

### Design Principles

**Five Dimensions of Critique**:

1. **Strongest Counter-Argument**: Forces steelmanning opposition
2. **Prior Art Gaps**: Acknowledges research limitations
3. **Physics Assumptions**: Identifies unverified technical claims
4. **Expert Pushback**: Considers domain-specific objections
5. **Invalidation Conditions**: Defines scope boundaries

**Prompt Language**:
- "Make it genuinely strong" - Prevents weak strawman arguments
- "What searches should we have run?" - Actionable specificity
- "What's assumed but not proven?" - Clear technical distinction
- "Anticipated objections" - Forward-looking risk assessment
- "Conditions that would invalidate" - Boundary condition thinking

---

## 4. Antifragile Zod Schema Patterns

### Overview

Antifragile schemas are designed to handle LLM output variability gracefully. Instead of failing hard on minor deviations, they recover, adapt, and provide useful partial results.

### Core Principles

**From `an5-d-report.ts` schema header**:

```typescript
/**
 * Zod schema for AN5-D output validation
 *
 * SCHEMA VERSION: 2.0
 *
 * ANTIFRAGILE DESIGN:
 * - All fields use .optional() or .default() where reasonable
 * - Objects use .passthrough() to allow extra fields from LLM
 * - Enums use .catch() to fall back gracefully on unexpected values
 * - Arrays default to empty arrays on parse failure
 */
```

### Pattern Catalog

#### 1. Optional Fields with Passthrough

```typescript
const HeaderSchema = z
  .object({
    report_id: z.string().optional(),
    title: z.string(),
    mode: z.literal('discovery').catch('discovery'),
    generated_at: z.string().optional(),
    tagline: z.string().optional(),
  })
  .passthrough();  // Allows LLM to add extra fields without breaking validation
```

**Why**: LLMs sometimes add helpful extra fields. Rejecting them would lose information.

#### 2. Graceful Enum Fallbacks

```typescript
const NoveltyClaimSchema = z.object({
  // Default to false - be conservative about claiming novelty
  genuinely_novel: z.boolean().catch(false),
  novelty_level: z
    .enum(['breakthrough', 'significant', 'moderate'])
    .catch('moderate'),  // Falls back to 'moderate' if invalid
  not_same_as: z.string().optional(),
}).passthrough();
```

**Why**: If LLM outputs "high" instead of "breakthrough", we default to "moderate" rather than failing.

#### 3. Safe Array Handling

```typescript
const DiscoveryBriefSchema = z.object({
  original_problem: z.string(),
  industry_blind_spot: z.string().optional(),
  discovery_thesis: z.string().optional(),
  hunting_grounds: z.array(z.string()).catch([]),  // Returns [] if array is malformed
  key_finding: z.string().optional(),
}).passthrough();
```

**Why**: Malformed arrays are common LLM errors. Better to have an empty array than fail completely.

#### 4. Conservative Defaults

```typescript
const NoveltyClaimSchema = z.object({
  // Default to false - be conservative about claiming novelty
  genuinely_novel: z.boolean().catch(false),
  // ...
});

const ComparisonRowSchema = z.object({
  concept_id: z.string(),
  novelty_score: z.number().catch(5),  // Default to middle score
  physics_confidence: z.number().catch(5),
  breakthrough_potential: z.number().catch(5),
  testability: z.number().catch(5),
  overall_score: z.number().catch(5),
}).passthrough();
```

**Why**: Default to conservative values when data is missing. Better to understate than overstate.

### Antifragile Schema Template

```typescript
// Template for creating antifragile schemas

const MySchema = z
  .object({
    // Required critical fields (no fallback)
    id: z.string(),
    name: z.string(),

    // Enums with safe defaults
    status: z.enum(['active', 'inactive']).catch('inactive'),

    // Optional fields
    description: z.string().optional(),

    // Arrays that gracefully handle errors
    tags: z.array(z.string()).catch([]),

    // Numbers with defaults
    score: z.number().catch(0),

    // Booleans with defaults (choose conservatively)
    is_verified: z.boolean().catch(false),
  })
  .passthrough();  // Allow extra fields from LLM
```

### When NOT to Use Antifragile Patterns

**Critical Fields**: Do not use `.catch()` on critical business logic fields where silent failures would be dangerous:

```typescript
// ❌ BAD - Critical field should fail hard
const PaymentSchema = z.object({
  amount: z.number().catch(0),  // Silent $0 payment is dangerous!
});

// ✅ GOOD - Let it fail if amount is invalid
const PaymentSchema = z.object({
  amount: z.number(),  // Fails validation if not a valid number
});
```

---

## 5. Schema Versioning and Deprecation

### Overview

Schema versioning allows gradual evolution of prompt outputs without breaking existing code. Deprecation timelines communicate migration expectations.

### Implementation

**Location**: `apps/web/lib/llm/prompts/discovery/an5-d-report.ts`

```typescript
/**
 * Zod schema for AN5-D output validation
 *
 * SCHEMA VERSION: 2.0
 *
 * DEPRECATION TIMELINE:
 * - v1.0 fields (marked @deprecated): Remove after 2025-03-01
 * - Legacy fields include: validation_path, first_test, go_no_go, timeline, cost,
 *   immediate_actions, phase_1/2/3 (old structure), one_liner, timeline_to_validation
 */
```

### Deprecation Pattern

#### Field-Level Deprecation

```typescript
const ValidationExperimentSchema = z
  .object({
    // v2.0 fields
    test_name: z.string().optional(),
    what_it_proves: z.string().optional(),
    method: z.string().optional(),
    go_criteria: z.string().optional(),
    no_go_criteria: z.string().optional(),
    cost_estimate: z.string().optional(),
    time_estimate: z.string().optional(),

    // @deprecated v1.0 fields - remove after 2025-03-01
    first_test: z.string().optional(),
    go_no_go: z.string().optional(),
    timeline: z.string().optional(),
    cost: z.string().optional(),
  })
  .passthrough();
```

#### Object-Level Deprecation

```typescript
const ValidationRoadmapSchema = z.object({
  // v2.0 structure
  phase_1_quick_kills: Phase1Schema.optional(),
  phase_2_mechanism_validation: Phase2Schema.optional(),
  phase_3_integration: Phase3Schema.optional(),
  total_investment_to_poc: z.string().optional(),

  // @deprecated v1.0 structure - remove after 2025-03-01
  immediate_actions: z.array(ImmediateActionSchema).catch([]),
  phase_1: LegacyPhaseSchema.optional(),
  phase_2: LegacyPhaseSchema.optional(),
  phase_3: LegacyPhaseSchema.optional(),
}).passthrough().optional();
```

### Migration Strategy

**Phase 1: Dual Support (Current)**
- Both old and new fields accepted
- LLM outputs new fields
- Old fields marked `@deprecated`
- Consumers can use either

**Phase 2: Deprecation Warning**
- Log warnings when old fields are used
- Documentation updated to show new fields only
- Migration guides provided

**Phase 3: Removal (After 2025-03-01)**
- Old fields removed from schema
- Validation fails if old fields are present
- Clean codebase with only v2.0 structure

### Version Numbering

```typescript
/**
 * SCHEMA VERSION: 2.0
 *
 * Version History:
 * - 1.0: Initial schema (validation_path, immediate_actions)
 * - 2.0: Renamed validation_path → validation_experiment
 *        Restructured roadmap phases with specific goals
 *        Added self_critique as required section
 */
```

### Deprecation Comment Standard

```typescript
// @deprecated v1.0 field - remove after YYYY-MM-DD
field_name: z.string().optional(),
```

**Required Elements**:
1. `@deprecated` tag
2. Version number (v1.0, v2.0, etc.)
3. Removal date in ISO format (YYYY-MM-DD)
4. Field name and type

---

## 6. Backwards Compatibility Strategies

### Overview

Backwards compatibility strategies ensure that changes to prompts and schemas don't break existing analyses, stored data, or downstream consumers.

### Strategy 1: Additive Schema Changes

**Principle**: New fields are always optional; existing fields never change type.

```typescript
// ✅ SAFE - Adding optional field
const ConceptSchema_v2 = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),  // New in v2, optional
  novelty_score: z.number().optional(),  // New in v2, optional
});

// ❌ UNSAFE - Changing existing field type
const ConceptSchema_v2_bad = z.object({
  id: z.string(),
  name: z.string(),
  description: z.array(z.string()),  // Was z.string() in v1 - BREAKS COMPATIBILITY
});
```

### Strategy 2: Field Renaming with Dual Support

When renaming fields, support both names during transition:

```typescript
const ExecutiveSummarySchema = z
  .object({
    // v2.0 fields (preferred)
    hook: z.string().optional(),
    validation_path: z.string().optional(),
    confidence_assessment: z.string().optional(),

    // Common fields
    key_discovery: z.string(),
    recommended_action: z.string().optional(),
    investment_required: z.string().optional(),

    // @deprecated v1.0 fields - remove after 2025-03-01
    one_liner: z.string().optional(),  // Use 'hook' instead
    timeline_to_validation: z.string().optional(),  // Use 'validation_path' instead
  })
  .passthrough();
```

**Access Pattern** (in consuming code):

```typescript
function getHook(summary: ExecutiveSummary): string | undefined {
  // Prefer v2.0 field, fall back to v1.0
  return summary.hook ?? summary.one_liner;
}
```

### Strategy 3: Passthrough for Unknown Fields

Allow LLM to add fields without validation errors:

```typescript
const FlexibleSchema = z
  .object({
    // Known fields
    id: z.string(),
    name: z.string(),
  })
  .passthrough();  // Allows any additional fields

// This parses successfully even with extra fields:
const result = FlexibleSchema.parse({
  id: "123",
  name: "Test",
  extra_field_from_llm: "some value",  // Preserved in output
});
```

### Strategy 4: Schema Transformation Layer

For major breaking changes, use transformation layer:

```typescript
// Old schema (v1)
const ValidationPath_v1 = z.object({
  first_test: z.string(),
  go_no_go: z.string(),
  timeline: z.string(),
  cost: z.string(),
});

// New schema (v2)
const ValidationExperiment_v2 = z.object({
  test_name: z.string(),
  what_it_proves: z.string(),
  method: z.string(),
  go_criteria: z.string(),
  no_go_criteria: z.string(),
  cost_estimate: z.string(),
  time_estimate: z.string(),
});

// Transformation function
function transformValidationPath(v1: z.infer<typeof ValidationPath_v1>): z.infer<typeof ValidationExperiment_v2> {
  return {
    test_name: v1.first_test,
    what_it_proves: "Validation experiment",
    method: "See first_test",
    go_criteria: v1.go_no_go.split('GO:')[1]?.split('NO-GO:')[0] ?? "",
    no_go_criteria: v1.go_no_go.split('NO-GO:')[1] ?? "",
    cost_estimate: v1.cost,
    time_estimate: v1.timeline,
  };
}
```

### Strategy 5: Database Migration Pattern

For stored analysis results, create migration functions:

```typescript
interface AnalysisResult_v1 {
  id: string;
  report: {
    validation_path: {
      first_test: string;
      cost: string;
    };
  };
}

interface AnalysisResult_v2 {
  id: string;
  schema_version: 2;
  report: {
    validation_experiment: {
      test_name: string;
      cost_estimate: string;
    };
  };
}

function migrateAnalysisResult(v1: AnalysisResult_v1): AnalysisResult_v2 {
  return {
    id: v1.id,
    schema_version: 2,
    report: {
      validation_experiment: {
        test_name: v1.report.validation_path.first_test,
        cost_estimate: v1.report.validation_path.cost,
      },
    },
  };
}

// Lazy migration on read
async function getAnalysisResult(id: string): Promise<AnalysisResult_v2> {
  const raw = await db.getAnalysis(id);

  if (!raw.schema_version || raw.schema_version === 1) {
    return migrateAnalysisResult(raw as AnalysisResult_v1);
  }

  return raw as AnalysisResult_v2;
}
```

### Compatibility Checklist

Before deploying schema changes:

- [ ] All new fields are optional or have defaults
- [ ] Existing field types unchanged
- [ ] Deprecated fields still accepted (marked with `@deprecated`)
- [ ] Deprecation timeline documented (removal date)
- [ ] Consuming code updated to prefer new fields
- [ ] Fallback logic in place for old data
- [ ] Migration function written for breaking changes
- [ ] Schema version incremented in comments

---

## Summary: Pattern Decision Tree

```
┌─ Writing Prompt? ─┐
│                   │
│  Add DO/DON'T     │
│  Add Philosophy   │
│  Add Self-Critique│
└───────────────────┘
         │
         ▼
┌─ Multi-Stage Chain? ─┐
│                       │
│  Add CHAIN CONTEXT    │
│  List prior stages    │
│  Define current role  │
└───────────────────────┘
         │
         ▼
┌─ Creating Schema? ─┐
│                    │
│  Use .optional()   │
│  Use .catch()      │
│  Use .passthrough()│
│  Add version docs  │
└────────────────────┘
         │
         ▼
┌─ Changing Schema? ─┐
│                     │
│  Keep old fields    │
│  Add @deprecated    │
│  Set removal date   │
│  Update version     │
└─────────────────────┘
```

## Related Documentation

- **Analysis Chain**: `docs/solutions/ai/analysis-chain-architecture.md`
- **LLM Integration**: `docs/solutions/ai/llm-integration-patterns.md`
- **Zod Documentation**: https://zod.dev

## References

**Source Files**:
- `/apps/web/lib/llm/prompts/discovery/an5-d-report.ts` - Discovery mode final report
- `/apps/web/lib/llm/prompts/an5-report.ts` - Standard mode final report
- `/apps/web/lib/llm/prompts/an0-problem-framing.ts` - Initial problem framing
- `/apps/web/lib/llm/prompts/an4-evaluation.ts` - Standard evaluation
- `/apps/web/lib/llm/prompts/discovery/an4-d-evaluation.ts` - Discovery evaluation

**Version**: 1.0
**Last Updated**: 2025-12-19
**Author**: Sparlo Engineering Team
