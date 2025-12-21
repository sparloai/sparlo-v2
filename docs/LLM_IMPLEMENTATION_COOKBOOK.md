# LLM Implementation Cookbook

**Practical Examples for Common Sparlo LLM Development Scenarios**

---

## Table of Contents

1. [Adding a New LLM Step to Chain](#1-adding-a-new-llm-step-to-chain)
2. [Creating a Resilient Schema](#2-creating-a-resilient-schema)
3. [Handling Schema Evolution](#3-handling-schema-evolution)
4. [Implementing Clarification Flow](#4-implementing-clarification-flow)
5. [Building Context for Multi-Step Chains](#5-building-context-for-multi-step-chains)
6. [Optimizing Token Usage](#6-optimizing-token-usage)

---

## 1. Adding a New LLM Step to Chain

**Scenario:** You need to add AN6 "Risk Assessment" step after AN5.

### Step 1: Define the Schema

Create `/apps/web/lib/llm/prompts/an6-risk-assessment.ts`:

```typescript
import { z } from 'zod';

/**
 * AN6 - Risk Assessment
 * Identifies technical risks and mitigation strategies
 */

// Primitives (reuse existing or create new)
const RiskSeverity = z.enum(['low', 'medium', 'high', 'critical'])
  .catch('medium');

const RiskCategory = z.enum([
  'technical',
  'manufacturing',
  'regulatory',
  'market',
  'timeline',
]);

// Risk item schema
const RiskItemSchema = z.object({
  category: RiskCategory,
  description: z.string(),
  likelihood: RiskSeverity,
  impact: RiskSeverity,
  mitigation_strategy: z.string().optional(),
  timeline_to_mitigate: z.string().optional(),
  estimated_cost: z.string().optional(),
}).passthrough();

// Main output schema
export const AN6OutputSchema = z.object({
  overall_risk_profile: z.enum(['low', 'moderate', 'high', 'very_high']),
  critical_risks: z.array(RiskItemSchema).max(20).default([]),
  moderate_risks: z.array(RiskItemSchema).max(50).default([]),
  technical_feasibility_score: z.number().min(0).max(10),
  recommended_risk_order: z.array(z.string()).default([]),
  risk_summary: z.string(),
}).passthrough();

export type AN6Output = z.infer<typeof AN6OutputSchema>;

// Prompt
export const AN6_PROMPT = `You are a technical risk analyst specializing in engineering projects.

## Your Task

Analyze the proposed solution concepts and identify:
1. Technical risks (feasibility, unknowns, dependencies)
2. Manufacturing risks (scalability, tooling, quality control)
3. Regulatory risks (safety, standards, approvals)
4. Market risks (adoption, competition, timing)
5. Timeline risks (critical path, resource constraints)

For each risk, assess:
- **Likelihood**: How probable is this risk? (low, medium, high, critical)
- **Impact**: If it occurs, how severe? (low, medium, high, critical)
- **Mitigation**: What can be done to reduce likelihood or impact?

## Output Format

CRITICAL: Respond with ONLY valid JSON. No markdown, no text before or after.

{
  "overall_risk_profile": "moderate",
  "critical_risks": [
    {
      "category": "technical",
      "description": "Coating adhesion may fail under thermal cycling",
      "likelihood": "medium",
      "impact": "critical",
      "mitigation_strategy": "Conduct accelerated aging tests early",
      "timeline_to_mitigate": "3-4 weeks",
      "estimated_cost": "$15K for testing"
    }
  ],
  "moderate_risks": [ ... ],
  "technical_feasibility_score": 7,
  "recommended_risk_order": ["Verify adhesion", "Test antimicrobial efficacy"],
  "risk_summary": "Overall feasible with 3 critical risks requiring early validation."
}
`;

export const AN6_METADATA = {
  id: 'an6',
  name: 'Risk Assessment',
  description: 'Identifying technical and market risks...',
  temperature: 0.5, // Analytical task
};
```

### Step 2: Update Chain State Schema

Edit `/apps/web/lib/llm/schemas/chain-state.ts`:

```typescript
// Add imports
import { AN6OutputSchema, type AN6Output } from '../prompts/an6-risk-assessment';

// Add to ChainStateSchema
export const ChainStateSchema = z.object({
  // ... existing fields

  // AN6 outputs
  an6_overall_risk_profile: z.enum(['low', 'moderate', 'high', 'very_high']).optional(),
  an6_critical_risks: z.array(RiskItemSchema).default([]),
  an6_moderate_risks: z.array(RiskItemSchema).default([]),
  an6_technical_feasibility_score: z.number().optional(),
  an6_recommended_risk_order: z.array(z.string()).default([]),
  an6_risk_summary: z.string().optional(),

  // ... rest of schema
});
```

### Step 3: Create Context Builder

In `/apps/web/lib/inngest/functions/generate-report.ts`:

```typescript
/**
 * Build context for AN6 from previous steps
 * Needs: AN3 concepts + AN4 evaluation
 */
function buildAN6ContextV10(state: ChainState): string {
  const concepts = state.an3_concepts ?? [];
  const evaluation = state.an4_overall_verdict;

  return `## Solution Concepts (from AN3)

${concepts.map((concept, idx) => `
### Concept ${idx + 1}: ${concept.title}

**Description:** ${concept.description}

**Mechanism:** ${concept.mechanism}

**Advantages:**
${concept.advantages?.map((adv) => `- ${adv}`).join('\n')}

**Challenges:**
${concept.challenges?.map((ch) => `- ${ch}`).join('\n')}

**Track:** ${concept.track}
`).join('\n---\n')}

## Evaluation Summary (from AN4)

**Overall Verdict:** ${evaluation}

**Viability Assessment:**
${state.an4_viability_by_track?.map((v) => `- ${v.track}: ${v.verdict} (${v.confidence} confidence)`).join('\n')}

## Your Task

Analyze these concepts and identify technical, manufacturing, regulatory, market, and timeline risks.
Prioritize risks by likelihood × impact and recommend mitigation strategies.
`;
}
```

### Step 4: Add Step to Orchestrator

In `/apps/web/lib/inngest/functions/generate-report.ts`:

```typescript
// Import
import { AN6_PROMPT, AN6OutputSchema, AN6_METADATA } from '../llm/prompts/an6-risk-assessment';

// After AN5 step
const an6Result = await step.run('an6-risk-assessment', async () => {
  const context = buildAN6ContextV10(state);

  await updateProgress({
    current_step: 'an6',
    phase_progress: 0,
  });

  const { content, usage } = await callClaude({
    model: MODELS.OPUS,
    system: AN6_PROMPT,
    userMessage: context,
    maxTokens: 16000, // Moderate output size
    temperature: AN6_METADATA.temperature,
  });

  await updateProgress({
    phase_progress: 100,
  });

  try {
    const parsed = AN6OutputSchema.parse(JSON.parse(content));
    return { result: parsed, usage };
  } catch (error) {
    console.error('AN6 schema validation failed:', error);
    throw new Error('AN6 output validation failed');
  }
});

// Update state
state = {
  ...state,
  an6_overall_risk_profile: an6Result.result.overall_risk_profile,
  an6_critical_risks: an6Result.result.critical_risks,
  an6_moderate_risks: an6Result.result.moderate_risks,
  an6_technical_feasibility_score: an6Result.result.technical_feasibility_score,
  an6_recommended_risk_order: an6Result.result.recommended_risk_order,
  an6_risk_summary: an6Result.result.risk_summary,
  completedSteps: [...state.completedSteps, 'an6'],
};
```

### Step 5: Update Phase Metadata

In `/apps/web/lib/llm/prompts/index.ts`:

```typescript
export const PHASES = [
  // ... existing phases
  {
    id: 'an6',
    name: 'Risk Assessment',
    description: 'Identifying and prioritizing technical risks...',
    estimatedMinutes: 2,
  },
] as const;
```

### Step 6: Test

```bash
# Run type checking
pnpm typecheck

# Test with a sample report
# Monitor database for new an6_* fields
```

---

## 2. Creating a Resilient Schema

**Scenario:** You need to create a schema for "Material Properties" output.

### Anti-Pattern (Brittle)

```typescript
// ❌ BAD: Strict schema that will break on minor LLM variations
const MaterialPropertiesSchema = z.object({
  material_name: z.string(),
  density: z.number(), // Breaks if LLM returns string
  tensile_strength: z.number(),
  temperature_range: z.object({
    min: z.number(),
    max: z.number(),
  }),
  applications: z.array(z.string()), // Breaks if field missing
  certifications: z.array(z.string()), // Breaks if field missing
});
```

**Problems:**
- No fallback for missing `applications` or `certifications`
- `density` breaks if LLM returns "1.2 g/cm³" instead of number
- No forward compatibility for new fields LLM might add

### Best Practice (Antifragile)

```typescript
// ✅ GOOD: Resilient schema with multiple safety layers
const MaterialPropertiesSchema = z.object({
  // Required fields (core data)
  material_name: z.string(),

  // Numeric fields with coercion
  density: z.union([
    z.number(),
    z.string().transform((val) => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    }).nullable(),
  ]).optional(),

  tensile_strength: z.union([
    z.number(),
    z.string().transform((val) => parseFloat(val)).nullable(),
  ]).optional(),

  // Nested object with passthrough
  temperature_range: z.object({
    min: z.union([z.number(), z.string().transform((v) => parseFloat(v))]).optional(),
    max: z.union([z.number(), z.string().transform((v) => parseFloat(v))]).optional(),
    unit: z.string().default('°C'),
  }).passthrough().optional(),

  // Arrays with defaults and catch
  applications: z.array(z.string()).catch([]).default([]),
  certifications: z.array(z.string()).catch([]).default([]),

  // Optional fields (might not always be present)
  chemical_formula: z.string().optional(),
  safety_notes: z.string().optional(),

  // URLs with validation
  data_sheet_url: SafeUrlSchema,
  supplier_url: SafeUrlSchema,

}).passthrough(); // Allow extra fields for forward compatibility

export type MaterialProperties = z.infer<typeof MaterialPropertiesSchema>;
```

**Benefits:**
- Missing arrays default to `[]`
- Numbers can be parsed from strings
- Extra fields preserved (forward compatible)
- URLs validated for security
- All optional fields explicit

### Example Usage

```typescript
// Test with various LLM outputs
const goodOutput = {
  material_name: "Stainless Steel 316L",
  density: 8.0,
  applications: ["Medical devices", "Marine"],
  certifications: ["ISO 10993", "ASTM F138"],
};

const messyOutput = {
  material_name: "Aluminum 6061",
  density: "2.7 g/cm³", // String instead of number
  tensile_strength: "310 MPa", // String with units
  applications: "Aerospace", // Single string instead of array
  certifications: [], // Empty array
  temperature_range: {
    min: "-40",
    max: "200",
    unit: "°F",
    notes: "In humid environments", // Extra field
  },
  future_field: "Some new data", // Future field
};

// Both parse successfully!
const good = MaterialPropertiesSchema.parse(goodOutput);
const messy = MaterialPropertiesSchema.parse(messyOutput);

console.log(good.density); // 8.0
console.log(messy.density); // 2.7 (parsed from string)
console.log(messy.applications); // ["Aerospace"] (auto-wrapped)
console.log(messy.temperature_range?.notes); // "In humid environments" (passthrough)
console.log(messy.future_field); // "Some new data" (passthrough)
```

---

## 3. Handling Schema Evolution

**Scenario:** You need to add new fields to AN3 concept schema without breaking existing reports.

### Version 1 (Current)

```typescript
// /apps/web/lib/llm/prompts/an3-concept-generation.ts
const ConceptSchemaV1 = z.object({
  title: z.string(),
  description: z.string(),
  mechanism: z.string(),
  advantages: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  track: TrackSchema,
}).passthrough();
```

### Version 2 (New Requirements)

You need to add:
- `estimated_development_time` (string, e.g., "6-12 months")
- `capital_requirement` (enum: minimal, low, medium, high, very_high)
- `key_assumptions` (array of strings)

### Approach 1: Additive Change (Preferred)

```typescript
// /apps/web/lib/llm/prompts/an3-concept-generation.ts

// New primitive
const CapitalRequirement = z.enum([
  'minimal',
  'low',
  'medium',
  'high',
  'very_high',
]);

const ConceptSchemaV2 = z.object({
  // V1 fields (unchanged)
  title: z.string(),
  description: z.string(),
  mechanism: z.string(),
  advantages: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  track: TrackSchema,

  // V2 additions (all optional or default)
  estimated_development_time: z.string().optional(),
  capital_requirement: CapitalRequirement.optional(),
  key_assumptions: z.array(z.string()).default([]),

}).passthrough();

export const ConceptSchema = ConceptSchemaV2;
export type Concept = z.infer<typeof ConceptSchema>;
```

**Testing:**

```typescript
// V1 data (without new fields)
const v1Data = {
  title: "Biomimetic Coating",
  description: "...",
  mechanism: "...",
  advantages: ["Self-cleaning"],
  challenges: ["Scalability"],
  track: "best_fit",
};

// V2 data (with new fields)
const v2Data = {
  ...v1Data,
  estimated_development_time: "6-12 months",
  capital_requirement: "medium",
  key_assumptions: ["Industrial equipment available"],
};

// Both validate successfully
const v1Concept = ConceptSchema.parse(v1Data);
const v2Concept = ConceptSchema.parse(v2Data);

console.log(v1Concept.capital_requirement); // undefined (no error!)
console.log(v2Concept.capital_requirement); // "medium"
```

### Approach 2: Explicit Versioning (Complex Cases)

Use when you need to handle breaking changes:

```typescript
const ConceptSchemaV1 = z.object({
  schema_version: z.literal(1).default(1),
  title: z.string(),
  // ... V1 fields
});

const ConceptSchemaV2 = z.object({
  schema_version: z.literal(2),
  title: z.string(),
  // ... V1 fields + V2 additions
});

// Union schema (try V2 first, fall back to V1)
const ConceptSchema = z.union([
  ConceptSchemaV2,
  ConceptSchemaV1,
]);

// Migration function
function migrateConceptV1toV2(v1: ConceptV1): ConceptV2 {
  return {
    ...v1,
    schema_version: 2,
    estimated_development_time: undefined, // No data for old reports
    capital_requirement: 'medium', // Default assumption
    key_assumptions: [],
  };
}

// Load with auto-migration
async function loadConcept(reportId: string): Promise<ConceptV2> {
  const raw = await db.reports.getRawConcept(reportId);

  const parsed = ConceptSchema.parse(raw);

  if (parsed.schema_version === 1) {
    const migrated = migrateConceptV1toV2(parsed);

    // Update database with migrated version
    await db.reports.updateConcept(reportId, migrated);

    return migrated;
  }

  return parsed;
}
```

### Approach 3: Database-Level Migration

For production with millions of records:

```typescript
// Migration script: /scripts/migrate-concepts-v1-to-v2.ts

async function migrateAllConcepts() {
  const reports = await db.reports.findAll({
    where: { schema_version: { lt: 2 } }
  });

  for (const report of reports) {
    try {
      const v1Concept = ConceptSchemaV1.parse(report.raw_output);
      const v2Concept = migrateConceptV1toV2(v1Concept);

      await db.reports.update(report.id, {
        parsed_output: v2Concept,
        schema_version: 2,
      });

      console.log(`Migrated report ${report.id}`);
    } catch (error) {
      console.error(`Failed to migrate report ${report.id}:`, error);
    }
  }
}

// Run migration
migrateAllConcepts();
```

---

## 4. Implementing Clarification Flow

**Scenario:** AN0 needs to ask users for clarification when input is ambiguous.

### Schema with Clarification

```typescript
// /apps/web/lib/llm/prompts/an0-problem-framing.ts

const AN0ClarificationSchema = z.object({
  needs_clarification: z.literal(true),
  ambiguity_type: z.enum(['scale', 'property', 'metric', 'constraint']),
  clarification_question: z.string(),
  why_asking: z.string().optional(), // Internal note
});

const AN0AnalysisSchema = z.object({
  needs_clarification: z.literal(false),
  original_ask: z.string(),
  problem_interpretation: z.string(),
  core_challenge: z.string(),
  // ... rest of analysis fields
});

export const AN0OutputSchema = z.discriminatedUnion('needs_clarification', [
  AN0ClarificationSchema,
  AN0AnalysisSchema,
]);
```

### Prompt with Clarification Instructions

```typescript
export const AN0_PROMPT = `You are a TRIZ-trained design strategist.

## When to Ask for Clarification

If the user's description is too vague to proceed confidently, set
"needs_clarification": true and provide ONE specific clarifying question.

**Examples of ambiguity:**
- User says "make it faster" without specifying metric (latency? throughput? response time?)
- User provides range "5-10" without units or baseline
- User says "coating" without specifying property to optimize (adhesion? durability? antimicrobial?)
- User gives conflicting constraints ("lightweight but strong" without priorities)

**Do NOT ask for clarification if:**
- Missing details can be reasonably assumed from context
- Question is well-scoped even if some details missing
- Standard engineering interpretation exists

## Output Format

If clarification needed:
{
  "needs_clarification": true,
  "ambiguity_type": "metric",
  "clarification_question": "What specific metric defines 'faster' for your use case - cycle time, throughput, or response latency?",
  "why_asking": "User said 'faster' without specifying which performance metric matters"
}

If proceeding with analysis:
{
  "needs_clarification": false,
  "original_ask": "...",
  "problem_interpretation": "...",
  ...
}
`;
```

### Orchestrator with Clarification Workflow

```typescript
// /apps/web/lib/inngest/functions/generate-report.ts

async function runReportGeneration() {
  let state: ChainState = { ... };

  // Run AN0
  const an0Result = await runAN0(state);

  // Check for clarification
  if (an0Result.result.needs_clarification) {
    const question = an0Result.result.clarification_question;

    // Update database
    await updateReportStatus(reportId, {
      status: 'clarifying',
      clarification_question: question,
      clarification_type: an0Result.result.ambiguity_type,
    });

    // Send notification to user
    await sendClarificationEmail(userId, reportId, question);

    // Wait for user response (Inngest waitForEvent)
    const clarificationEvent = await step.waitForEvent(
      'wait-for-clarification',
      {
        event: 'report/clarification-answered',
        match: 'data.reportId',
        timeout: '24h',
      },
    );

    // Handle timeout
    if (!clarificationEvent) {
      await updateReportStatus(reportId, {
        status: 'failed',
        error_message: 'Clarification request timed out after 24 hours',
      });

      throw new Error('Clarification timeout');
    }

    // Re-run AN0 with clarification answer
    const retryResult = await runAN0({
      ...state,
      clarificationAnswer: clarificationEvent.data.answer,
      clarificationCount: (state.clarificationCount ?? 0) + 1,
    });

    // Check for second clarification (rare, but possible)
    if (retryResult.result.needs_clarification) {
      // Limit to 2 clarifications max
      if (state.clarificationCount >= 1) {
        await updateReportStatus(reportId, {
          status: 'failed',
          error_message: 'Multiple clarifications needed - please provide more details',
        });

        throw new Error('Too many clarifications');
      }

      // Repeat clarification flow (recursive)
      // ... (omitted for brevity)
    }

    // Update state with clarified analysis
    state = updateStateWithAN0Analysis(state, retryResult.result);
  } else {
    // No clarification needed, proceed
    state = updateStateWithAN0Analysis(state, an0Result.result);
  }

  // Continue chain...
}
```

### Frontend Clarification Handler

```typescript
// /apps/web/app/home/[account]/reports/[reportId]/_components/clarification-prompt.tsx
'use client';

import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';
import { toast } from '@kit/ui/sonner';

interface ClarificationPromptProps {
  reportId: string;
  question: string;
  ambiguityType: string;
}

export function ClarificationPrompt({
  reportId,
  question,
  ambiguityType,
}: ClarificationPromptProps) {
  const [answer, setAnswer] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await submitClarificationAnswer(reportId, answer);

        toast.success('Answer submitted! Report generation will continue.');
      } catch (error) {
        toast.error('Failed to submit answer');
      }
    });
  };

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
      <h3 className="text-lg font-semibold">Clarification Needed</h3>

      <div className="mt-4">
        <p className="text-sm text-gray-600">
          Type: <span className="font-medium">{ambiguityType}</span>
        </p>

        <p className="mt-2 text-base">{question}</p>
      </div>

      <div className="mt-6">
        <Textarea
          placeholder="Your answer..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={4}
          disabled={isPending}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleSubmit} disabled={!answer.trim() || isPending}>
          {isPending ? 'Submitting...' : 'Submit Answer'}
        </Button>
      </div>
    </div>
  );
}
```

---

## 5. Building Context for Multi-Step Chains

**Scenario:** AN3 needs context from AN0 (problem), AN1 (corpus), AN1.5 (teaching), AN2 (innovation patterns).

### Anti-Pattern (Dumping All Data)

```typescript
// ❌ BAD: Pass entire state as JSON dump
function buildAN3Context(state: ChainState): string {
  return JSON.stringify(state); // 50K+ tokens!
}
```

**Problems:**
- Massive token count (expensive, slow)
- No structure (hard for LLM to parse)
- Includes irrelevant fields (metadata, tracking info)

### Best Practice (Curated Context)

```typescript
/**
 * Build context for AN3 Concept Generation
 * Includes: Problem framing, TRIZ guidance, teaching examples
 * Excludes: Raw corpus items, internal metadata
 */
function buildAN3ContextV10(
  state: ChainState,
  an2Result: AN2_Output,
): string {
  // Extract only relevant fields
  const {
    an0_original_ask,
    an0_reframed_problem,
    an0_contradiction,
    an0_first_principles,
    an1_5_triz_exemplars,
    an1_5_transfer_exemplars,
  } = state;

  return `## Engineering Challenge

**Original Request:**
${an0_original_ask ?? state.userInput}

**Reframed Problem:**
${an0_reframed_problem}

**TRIZ Contradiction:**
- Improve: ${an0_contradiction?.improve_parameter.name}
- Worsens: ${an0_contradiction?.worsen_parameter.name}
- Plain English: ${an0_contradiction?.plain_english}

**First Principles:**
- Fundamental Truths: ${an0_first_principles?.fundamental_truths?.join('; ')}
- Actual Goal: ${an0_first_principles?.actual_goal}

---

## Innovation Patterns (from AN2)

${an2Result.innovation_patterns?.map((pattern, idx) => `
### Pattern ${idx + 1}: ${pattern.pattern_name}

**Mechanism:** ${pattern.mechanism}

**When to Use:** ${pattern.when_to_use}

**Application Hint:** ${pattern.application_hint}
`).join('\n')}

---

## Teaching Examples (from AN1.5)

### TRIZ Exemplars

${an1_5_triz_exemplars?.slice(0, 5).map((ex, idx) => `
#### Example ${idx + 1}: ${ex.principle.name}

**Domain:** ${ex.domain}

**The Challenge:** ${ex.the_challenge}

**Obvious Approach:** ${ex.obvious_approach}

**Brilliant Approach:** ${ex.brilliant_approach}

**Key Insight:** ${ex.key_insight}

**Pattern:** ${ex.pattern}
`).join('\n---\n')}

### Transfer Exemplars

${an1_5_transfer_exemplars?.slice(0, 3).map((ex, idx) => `
#### Example ${idx + 1}: ${ex.title}

**Source Domain:** ${ex.source_domain} → **Target Domain:** ${ex.target_domain}

**The Physics:** ${ex.the_physics}

**The Insight:** ${ex.the_insight}

**Pattern:** ${ex.the_pattern}
`).join('\n---\n')}

---

## Your Task

Generate 5-8 novel solution concepts using these innovation patterns and teaching examples.
For each concept, specify which track it belongs to: simpler_path, best_fit, paradigm_shift, or frontier_transfer.
`;
}
```

**Benefits:**
- Focused context (only what AN3 needs)
- Structured markdown (easy for LLM to parse)
- Truncated arrays (top 5 TRIZ, top 3 transfers)
- Excludes metadata (no `completedSteps`, `reportId`, etc.)

### Context Truncation Utilities

```typescript
/**
 * Truncate array to max items with note
 */
function truncateArray<T>(
  items: T[] | undefined,
  maxItems: number,
  itemName: string,
): T[] {
  if (!items || items.length === 0) return [];

  if (items.length <= maxItems) return items;

  console.log(`Truncating ${itemName}: ${items.length} → ${maxItems} items`);
  return items.slice(0, maxItems);
}

/**
 * Truncate text to max length
 */
function truncateText(text: string | undefined, maxLength: number): string {
  if (!text) return '';

  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength) + '... (truncated)';
}

/**
 * Simplify corpus items (from Sparlo)
 */
function simplifyCorpusItems(
  items: CorpusItem[],
  maxItems: number,
  maxPreviewLength: number = 500,
): Array<{ id: string; title: string; preview: string }> {
  return truncateArray(items, maxItems, 'corpus items').map((item) => ({
    id: item.id,
    title: item.title,
    preview: truncateText(item.text_preview, maxPreviewLength),
  }));
}
```

**Usage:**

```typescript
function buildAN2Context(state: ChainState): string {
  // Truncate teaching examples
  const trizExemplars = truncateArray(
    state.an1_5_triz_exemplars,
    10,
    'TRIZ exemplars'
  );

  const transferExemplars = truncateArray(
    state.an1_5_transfer_exemplars,
    5,
    'transfer exemplars'
  );

  // Truncate corpus items
  const simplifiedCorpus = simplifyCorpusItems(
    state.an1_triz ?? [],
    20,
    500
  );

  // Build context...
}
```

---

## 6. Optimizing Token Usage

**Scenario:** Your AN5 step uses 30K input tokens and costs $0.45 per report. You want to reduce this.

### Strategy 1: Implement Prompt Caching

```typescript
// /apps/web/lib/llm/client.ts

export async function callClaudeWithCache(params: {
  model: string;
  system: string;
  cachedContext?: string; // Static/repeated content
  userMessage: string;
  maxTokens?: number;
}) {
  const anthropic = getAnthropicClient();

  // Build system blocks
  const systemBlocks = [
    {
      type: 'text' as const,
      text: params.system,
      cache_control: { type: 'ephemeral' as const }, // Cache system prompt
    },
  ];

  // Build message content
  const messageContent = [];

  // Add cached context if provided
  if (params.cachedContext) {
    messageContent.push({
      type: 'text' as const,
      text: params.cachedContext,
      cache_control: { type: 'ephemeral' as const }, // Cache this too
    });
  }

  // Add user message (not cached)
  messageContent.push({
    type: 'text' as const,
    text: params.userMessage,
  });

  const response = await anthropic.messages.create({
    model: params.model,
    max_tokens: params.maxTokens ?? 8192,
    system: systemBlocks,
    messages: [{ role: 'user', content: messageContent }],
  });

  return {
    content: response.content[0].type === 'text'
      ? response.content[0].text
      : '',
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}
```

**Usage in AN5:**

```typescript
const an5Result = await step.run('an5-report-generation', async () => {
  // Static content (cache this)
  const cachedContext = buildAN5CachedContext(state); // Previous step outputs

  // Dynamic content (don't cache)
  const userMessage = buildAN5UserMessage(state); // User-specific data

  const { content, usage } = await callClaudeWithCache({
    model: MODELS.OPUS,
    system: AN5_PROMPT, // Cached
    cachedContext, // Cached (teaching examples, concepts, etc.)
    userMessage, // Not cached
    maxTokens: 24000,
  });

  console.log(`Cache stats:
    - Cache creation: ${usage.cacheCreationTokens} tokens
    - Cache read: ${usage.cacheReadTokens} tokens (90% savings!)
    - New input: ${usage.inputTokens - usage.cacheReadTokens} tokens
  `);

  return { result: AN5OutputSchema.parse(JSON.parse(content)), usage };
});
```

**Expected Savings:**

```
Before caching:
- AN5 input: 30K tokens × $15/1M = $0.45

After caching (subsequent requests):
- Cached: 25K tokens × $1.50/1M = $0.0375 (10% of regular price)
- New: 5K tokens × $15/1M = $0.075
- Total: $0.1125 (75% savings!)
```

### Strategy 2: Context Summarization

```typescript
/**
 * Summarize AN3 concepts for AN5 (reduce detail)
 */
function summarizeConceptsForAN5(concepts: Concept[]): string {
  return concepts.map((concept, idx) => `
${idx + 1}. **${concept.title}** (${concept.track})
   - Mechanism: ${truncateText(concept.mechanism, 200)}
   - Key Advantages: ${concept.advantages?.slice(0, 3).join(', ')}
   - Primary Challenge: ${concept.challenges?.[0]}
  `).join('\n');
}

// Instead of full concept details (5K tokens), use summary (1K tokens)
```

### Strategy 3: Conditional Context Inclusion

```typescript
/**
 * Only include corpus items if they influenced final concepts
 */
function buildAN5Context(state: ChainState): string {
  let context = `## Problem\n${state.an0_reframed_problem}\n\n`;

  // Always include concepts (needed for report)
  context += `## Concepts\n${JSON.stringify(state.an3_concepts)}\n\n`;

  // Only include teaching examples if concepts reference them
  const conceptsReferenceTRIZ = state.an3_concepts?.some(
    (c) => c.triz_principles_used && c.triz_principles_used.length > 0
  );

  if (conceptsReferenceTRIZ) {
    context += `## TRIZ Background\n${JSON.stringify(state.an1_5_triz_exemplars?.slice(0, 3))}\n\n`;
  }

  return context;
}
```

### Strategy 4: Parallel Independent Steps

```typescript
// ❌ Sequential (slow)
const an1_5Result = await runAN1_5(state);
const an1_7Result = await runAN1_7(state); // Could run in parallel!

// ✅ Parallel (faster)
const [an1_5Result, an1_7Result] = await Promise.all([
  runAN1_5(state),
  runAN1_7(state),
]);

// Saves: max(T1.5, T1.7) - (T1.5 + T1.7) ≈ 30-50% time reduction
```

---

**End of Cookbook**

For more patterns, see:
- Full Guide: `/docs/LLM_SCHEMA_BEST_PRACTICES.md`
- Quick Reference: `/docs/LLM_PATTERNS_QUICK_REFERENCE.md`
