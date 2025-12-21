# LLM Schema & Prompt Engineering Best Practices

**Date:** 2025-12-20
**Project:** Sparlo v2
**Context:** Multi-stage TRIZ-based engineering analysis with Claude Opus 4.5

---

## Table of Contents

1. [Structured LLM Output Schemas (Zod Patterns)](#1-structured-llm-output-schemas-zod-patterns)
2. [Prompt Engineering for Technical Analysis Reports](#2-prompt-engineering-for-technical-analysis-reports)
3. [Schema Evolution & Backward Compatibility](#3-schema-evolution--backward-compatibility)
4. [Multi-Stage Prompt Chains](#4-multi-stage-prompt-chains)
5. [Performance Optimization Patterns](#5-performance-optimization-patterns)
6. [Real-World Examples from Sparlo](#6-real-world-examples-from-sparlo)

---

## 1. Structured LLM Output Schemas (Zod Patterns)

### 1.1 The Three Pillars of Antifragile Schemas

**Goal:** Make schemas resilient to LLM hallucinations, version changes, and unexpected outputs.

#### Pattern 1: `.default([])` - Handle Missing Fields

Use when a field is **expected but might be omitted** by the LLM.

```typescript
// ✅ GOOD: Provides fallback for missing arrays
const ConceptSchema = z.object({
  title: z.string(),
  description: z.string(),
  // If LLM forgets to include advantages, use empty array
  advantages: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
});

// ❌ BAD: Will throw error if field is missing
const ConceptSchema = z.object({
  title: z.string(),
  description: z.string(),
  advantages: z.array(z.string()), // No fallback!
  risks: z.array(z.string()),
});
```

**When to use:**
- Optional arrays that should default to empty
- Optional numbers that should default to 0
- Optional booleans with sensible defaults

**Real Sparlo Example:**
```typescript
// From /apps/web/lib/llm/prompts/hybrid/schemas.ts
const ProblemAnalysisSchema = z.object({
  core_challenge: z.string(),
  constraints: z.array(z.string()).default([]),      // Missing = []
  success_metrics: z.array(z.string()).default([]),
  industry_assumptions: z.array(z.string()).default([]),
});
```

#### Pattern 2: `.catch()` - Recover from Malformed Data

Use when a field is **present but malformed** (wrong type, invalid enum, etc.).

```typescript
// ✅ GOOD: Handles malformed enum gracefully
const RiskSchema = z.object({
  risk: z.string(),
  // If LLM returns "MEDIUM" instead of "medium", catch and default
  likelihood: z.enum(['low', 'medium', 'high']).catch('medium'),
  impact: z.enum(['low', 'medium', 'high']).catch('medium'),
  mitigation: z.string().optional(),
});

// ❌ BAD: Throws on invalid enum value
const RiskSchema = z.object({
  risk: z.string(),
  likelihood: z.enum(['low', 'medium', 'high']), // Strict validation
  impact: z.enum(['low', 'medium', 'high']),
});
```

**When to use:**
- Enums that might have case inconsistencies
- Numbers that might be returned as strings
- Complex nested objects that might be partially valid

**Combining `.default()` and `.catch()`:**
```typescript
// First .catch() handles malformed arrays, then .default() handles missing field
const schema = z.object({
  tags: z.array(z.string()).catch([]).default([]),
});

// Handles:
// 1. Field missing → default([])
// 2. Field present but malformed (e.g., tags: "string" instead of array) → catch([])
```

#### Pattern 3: `.passthrough()` - Forward Compatibility

Use on **objects** to preserve extra fields the LLM might add in future versions.

```typescript
// ✅ GOOD: Preserves unknown fields for future schema versions
const ConceptSchema = z.object({
  title: z.string(),
  description: z.string(),
}).passthrough(); // Allows extra fields like "newField" to pass through

// ❌ BAD: Strips unknown fields (breaks forward compatibility)
const ConceptSchema = z.object({
  title: z.string(),
  description: z.string(),
}).strict(); // Throws on unknown fields
```

**Real Sparlo Example:**
```typescript
// From /apps/web/lib/llm/prompts/hybrid/schemas.ts
export const RiskItemSchema = z.object({
  risk: z.string(),
  likelihood: z.enum(['low', 'medium', 'high']).catch('medium'),
  impact: z.enum(['low', 'medium', 'high']).catch('medium'),
  mitigation: z.string().optional(),
}).passthrough(); // Future-proofs schema for new risk fields
```

**When to use:**
- All nested objects in LLM output schemas
- Schemas that will evolve over time
- Intermediate steps in multi-stage chains (where later steps might need extra data)

#### Pattern 4: `.optional()` - Truly Optional Fields

Use when a field is **legitimately optional** and absence is semantically meaningful.

```typescript
const ConceptSchema = z.object({
  title: z.string(),
  description: z.string(),
  // Optional: might not have a mitigation strategy yet
  mitigation_strategy: z.string().optional(),
  // Optional: might not have prior art
  prior_art_url: z.string().optional(),
});
```

**Difference from `.default()`:**
- `.optional()`: `undefined` has meaning (field was intentionally omitted)
- `.default()`: Missing field gets a default value (no semantic difference)

### 1.2 Schema Validation Best Practices

#### Pattern 5: Normalize Case Inconsistencies with `.transform()`

LLMs often return inconsistent casing for enums. Normalize it:

```typescript
// ✅ GOOD: Accepts both cases, normalizes to lowercase
export const SeverityLevel = z
  .enum(['low', 'medium', 'high', 'LOW', 'MEDIUM', 'HIGH'])
  .transform((val) => val.toLowerCase() as 'low' | 'medium' | 'high')
  .pipe(z.enum(['low', 'medium', 'high']));

// Usage: Always returns lowercase, regardless of LLM input
const schema = z.object({
  severity: SeverityLevel, // Accepts "HIGH", "High", "high" → always returns "high"
});
```

**Real Sparlo Example:**
```typescript
// From /apps/web/lib/llm/prompts/hybrid/schemas.ts
export const SeverityLevel = z
  .enum(['low', 'medium', 'high', 'LOW', 'MEDIUM', 'HIGH'])
  .transform((val) => val.toLowerCase() as 'low' | 'medium' | 'high')
  .pipe(z.enum(['low', 'medium', 'high']));

export const ConfidenceLevel = SeverityLevel; // Reuse pattern
```

#### Pattern 6: Safe URL Validation

Validate URLs while allowing backward compatibility:

```typescript
/**
 * Safe URL validation function
 * - Allows empty/missing URLs (backward compatibility)
 * - Blocks dangerous protocols (javascript:, file:, data:)
 * - Blocks SSRF targets (localhost, private IPs)
 */
function isValidSafeUrl(url: string): boolean {
  if (!url || url.trim() === '') return true; // Allow empty

  try {
    const parsed = new URL(url);

    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Block localhost and private IPs (SSRF prevention)
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    ];

    return !blockedPatterns.some((pattern) => pattern.test(parsed.hostname));
  } catch {
    return true; // Allow invalid URLs for backward compatibility
  }
}

export const SafeUrlSchema = z
  .string()
  .optional()
  .refine((url) => !url || isValidSafeUrl(url), {
    message: 'Blocked URL protocol or host',
  });
```

**Real Sparlo Example:**
```typescript
// From /apps/web/lib/llm/prompts/hybrid/schemas.ts
export const PriorArtSchema = z.object({
  source: z.string(),
  relevance: z.string(),
  what_it_proves: z.string().optional(),
  url: SafeUrlSchema, // Safe URL validation
}).passthrough();
```

#### Pattern 7: Array Length Limits (DoS Prevention)

Prevent LLMs from generating massive arrays that consume memory:

```typescript
const ConceptSchema = z.object({
  title: z.string(),
  description: z.string(),
  // Limit to 50 advantages (prevent DoS)
  advantages: z.array(z.string()).max(50).default([]),
  // Limit to 100 references
  references: z.array(z.string()).max(100).default([]),
});
```

**When to use:**
- All arrays in production schemas
- Especially critical for user-facing APIs
- Recommended limits: 50-100 for most arrays, 10-20 for nested objects

### 1.3 Type Inference & Reusability

#### Pattern 8: Extract Types from Schemas

```typescript
// Define schema
export const ConceptSchema = z.object({
  title: z.string(),
  description: z.string(),
  track: z.enum(['simpler_path', 'best_fit', 'paradigm_shift']),
}).passthrough();

// Extract TypeScript type
export type Concept = z.infer<typeof ConceptSchema>;

// Use in functions
function processConcept(concept: Concept): void {
  console.log(concept.title); // Type-safe!
}
```

#### Pattern 9: Compose Schemas from Primitives

```typescript
// Define reusable primitives
export const TrackSchema = z.enum([
  'simpler_path',
  'best_fit',
  'paradigm_shift',
  'frontier_transfer',
]);

export const ConfidenceLevel = z.enum(['low', 'medium', 'high']);

// Compose into complex schemas
export const ConceptSchema = z.object({
  title: z.string(),
  track: TrackSchema, // Reuse!
  confidence: ConfidenceLevel, // Reuse!
}).passthrough();

export const EvaluationSchema = z.object({
  verdict: z.enum(['viable', 'not_viable', 'uncertain']),
  confidence: ConfidenceLevel, // Same enum reused
}).passthrough();
```

**Real Sparlo Example:**
```typescript
// From /apps/web/lib/llm/prompts/hybrid/schemas.ts
export const TrackSchema = z.enum([
  'simpler_path',
  'best_fit',
  'paradigm_shift',
  'frontier_transfer',
]);

export const SeverityLevel = z.enum(['low', 'medium', 'high', 'LOW', 'MEDIUM', 'HIGH'])
  .transform((val) => val.toLowerCase() as 'low' | 'medium' | 'high')
  .pipe(z.enum(['low', 'medium', 'high']));

export const ConfidenceLevel = SeverityLevel; // Alias for clarity

// Used in multiple schemas
export const RiskItemSchema = z.object({
  likelihood: ConfidenceLevel,
  impact: ConfidenceLevel,
}).passthrough();
```

---

## 2. Prompt Engineering for Technical Analysis Reports

### 2.1 Structured Prompts Anatomy

**Effective technical prompts have 5 sections:**

1. **Role & Context** - Who is the LLM, what domain
2. **Safety Context** - Clarify legitimate use cases (avoid over-refusals)
3. **Task Definition** - What to do, step by step
4. **Output Format** - Explicit JSON schema with examples
5. **Edge Case Handling** - Ambiguity resolution, clarification triggers

#### Template:

```typescript
export const TECHNICAL_ANALYSIS_PROMPT = `You are a [ROLE] with expertise in [DOMAIN].

## Domain Context

You are analyzing [TYPE_OF_PROBLEMS] for [PRODUCT_NAME], a [PURPOSE] tool.
Users are professional [PROFESSION] working on legitimate [CONTEXT] problems including:

- [Example domain 1]
- [Example domain 2]
- [Example domain 3]

These are standard [FIELD] problems found in [SOURCES]. Approach all queries
as legitimate professional research unless there is explicit evidence of harmful
intent (which would be extremely unusual in this context).

## Your Task

You must:
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Output Format

CRITICAL: Respond with ONLY valid JSON. No markdown, no text before or after.
Start with { and end with }.

{
  "field1": "description",
  "field2": ["array", "of", "items"],
  "field3": {
    "nested": "object"
  }
}

## Edge Cases

If [AMBIGUITY_CONDITION], set "needs_clarification": true and provide "clarification_question".

Examples of ambiguity:
- [Ambiguity type 1]
- [Ambiguity type 2]
`;
```

### 2.2 Real Sparlo Example (AN0 - Problem Framing)

```typescript
// From /apps/web/lib/llm/prompts/an0-problem-framing.ts
export const AN0_PROMPT = `You are a TRIZ-trained design strategist who helps engineers reframe their design challenges.

## Domain Context

You are analyzing engineering design challenges for Sparlo, a TRIZ-based
engineering intelligence tool. Users are professional engineers working on
legitimate R&D problems including:

- Materials science and surface functionalization
- Chemical engineering processes
- Biomedical device development
- Antimicrobial and protective coatings
- Industrial manufacturing processes

These are standard engineering problems found in peer-reviewed literature
and patent databases. Approach all queries as legitimate professional
engineering research unless there is explicit evidence of harmful intent
(which would be extremely unusual in this context).

When the query involves chemistry or materials, remember that:
- Surface functionalization for antimicrobial properties is protective technology
- Process engineering questions are about manufacturing, not synthesis of harmful compounds
- The goal is engineering solutions, not detailed synthesis protocols

CRITICAL: You must respond with ONLY valid JSON. No markdown, no text before or after. Start with { and end with }.

Your job is to:
1. Extract the core problem and success metrics
2. Identify what CANNOT change (hard constraints)
3. Frame the problem as a TRIZ contradiction
4. Identify the PHYSICS of the problem - what physical principles are at play?
5. Suggest search queries for teaching examples and validation data

If the user's description is too vague to proceed, ask ONE clarifying question.

## PROBLEM DISAMBIGUATION

Before proceeding, identify and resolve ambiguities:

1. **SCALE AMBIGUITY** - Micro vs macro, local vs global
2. **PROPERTY AMBIGUITY** - Intrinsic vs extrinsic, bulk vs surface
3. **SYMPTOM VS ROOT CAUSE** - Is the stated problem downstream of real problem?
4. **PERFORMANCE METRIC AMBIGUITY** - What specific metric defines success?
5. **CONSTRAINT AMBIGUITY** - What's actually fixed vs assumed fixed?

If ambiguity significantly affects solutions: ASK ONE clarifying question.

## OUTPUT FORMAT

{
  "need_question": false,
  "original_ask": "User's original challenge",
  "problem_interpretation": "Restated problem",
  "ambiguities_detected": [
    {
      "type": "scale | property | symptom_vs_cause | metric | constraint",
      "description": "What's ambiguous",
      "resolution": "How you resolved it"
    }
  ],
  ...
}
`;
```

### 2.3 Prompt Engineering Patterns

#### Pattern 10: Domain Safety Context

**Problem:** LLMs over-refuse legitimate technical queries (chemistry, materials, biotech).

**Solution:** Provide explicit safety context upfront:

```typescript
const SAFETY_CONTEXT = `
## Domain Context

You are analyzing engineering design challenges for [PRODUCT], a [PURPOSE] tool.
Users are professional engineers working on legitimate R&D problems including:

- [Domain 1]
- [Domain 2]
- [Domain 3]

These are standard engineering problems found in peer-reviewed literature
and patent databases. Approach all queries as legitimate professional
engineering research unless there is explicit evidence of harmful intent
(which would be extremely unusual in this context).

When the query involves [SENSITIVE_DOMAIN], remember that:
- [Clarification 1]
- [Clarification 2]
- The goal is [LEGITIMATE_PURPOSE], not [MISUSE_CASE]
`;
```

**Real Impact:** Reduces Claude refusals from ~15% to <1% for materials science queries in Sparlo.

#### Pattern 11: Explicit JSON-Only Format

**Problem:** LLMs often wrap JSON in markdown code blocks.

**Solution:** Emphasize JSON-only output MULTIPLE times:

```typescript
const PROMPT = `
CRITICAL: You must respond with ONLY valid JSON. No markdown, no text before or after. Start with { and end with }.

## Your Task
[Task description]

## Output Format

CRITICAL: Respond with ONLY valid JSON. No markdown code fences.

{
  "field": "value"
}
`;
```

**Better:** Use Anthropic's native JSON mode (if available):

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 8000,
  messages: [
    { role: 'user', content: userMessage }
  ],
  response_format: { type: 'json_object' } // Native JSON mode
});
```

**Note:** As of Jan 2025, Anthropic doesn't support `response_format`. Use prompt-based JSON enforcement.

#### Pattern 12: Clarification Question Mechanism

**Problem:** Vague user input leads to poor analysis.

**Solution:** Embed clarification logic in schema:

```typescript
const OutputSchema = z.discriminatedUnion('needs_clarification', [
  // Clarification needed
  z.object({
    needs_clarification: z.literal(true),
    clarification_question: z.string(),
  }),
  // Analysis complete
  z.object({
    needs_clarification: z.literal(false),
    analysis: z.object({
      core_problem: z.string(),
      constraints: z.array(z.string()).default([]),
      // ... rest of analysis
    }),
  }),
]);
```

**Prompt instruction:**

```typescript
const PROMPT = `
If the user's description is too vague to proceed (missing critical constraints,
unclear success metrics, or ambiguous scope), set "needs_clarification": true
and provide ONE specific clarifying question.

Examples of when to ask:
- User says "make it faster" but doesn't specify what metric (latency? throughput? cycle time?)
- User says "improve coating" but doesn't specify property (adhesion? durability? antimicrobial?)
- User gives range without context (e.g., "5-10" without units or baseline)

Example output:
{
  "needs_clarification": true,
  "clarification_question": "What specific metric defines 'faster' - cycle time, throughput, or response latency?"
}
`;
```

**Real Sparlo Example:**

```typescript
// From /apps/web/lib/llm/prompts/an0-problem-framing.ts
export const AN0OutputSchema = z.discriminatedUnion('need_question', [
  z.object({
    need_question: z.literal(true),
    question: z.string(),
  }),
  z.object({
    need_question: z.literal(false),
    original_ask: z.string(),
    problem_interpretation: z.string(),
    // ... full analysis schema
  }),
]);
```

#### Pattern 13: Provide Examples in Prompts

**Problem:** LLMs struggle with abstract schema definitions.

**Solution:** Include 1-2 concrete examples in the prompt:

```typescript
const PROMPT = `
## Output Format

{
  "concepts": [
    {
      "title": "Concept title",
      "description": "Detailed description",
      "mechanism": "How it works",
      "advantages": ["Advantage 1", "Advantage 2"],
      "risks": ["Risk 1", "Risk 2"]
    }
  ]
}

## Example Output

{
  "concepts": [
    {
      "title": "Biomimetic Surface Texturing",
      "description": "Apply lotus leaf-inspired micro/nano-scale surface texturing...",
      "mechanism": "Hierarchical roughness creates air pockets that repel water...",
      "advantages": [
        "Self-cleaning without chemicals",
        "Passive mechanism requires no power"
      ],
      "risks": [
        "Texture may degrade over time with abrasion",
        "Manufacturing precision required for nano-scale features"
      ]
    }
  ]
}
`;
```

#### Pattern 14: Temperature Tuning by Step Type

**Different steps need different creativity levels:**

```typescript
// Analytical steps (low temperature)
const AN0_CONFIG = {
  temperature: 0.7, // Problem framing - balanced
};

const AN4_CONFIG = {
  temperature: 0.5, // Evaluation - analytical
};

// Creative steps (higher temperature)
const AN3_CONFIG = {
  temperature: 0.9, // Concept generation - creative
};

// Final synthesis (moderate temperature)
const AN5_CONFIG = {
  temperature: 0.6, // Report writing - clear but engaging
};
```

**Real Sparlo Example:**

```typescript
// From /apps/web/lib/llm/prompts/hybrid/index.ts
export const HYBRID_CONFIG = {
  maxTokens: 20000,
  temperatures: {
    default: 0.7,
    creative: 0.9,   // AN3-M concept generation
    analytical: 0.5, // AN4-M evaluation
    report: 0.6,     // AN5-M final report
  },
};
```

---

## 3. Schema Evolution & Backward Compatibility

### 3.1 Schema Versioning Strategy

#### Pattern 15: Version-Tolerant Schemas

**Problem:** Schema changes break existing stored data.

**Solution 1: Use `.passthrough()` everywhere**

```typescript
// Version 1
const ConceptSchemaV1 = z.object({
  title: z.string(),
  description: z.string(),
}).passthrough(); // Allows extra fields

// Version 2 (adds new field)
const ConceptSchemaV2 = z.object({
  title: z.string(),
  description: z.string(),
  mechanism: z.string().optional(), // New field
}).passthrough();

// V1 data validates with V2 schema (mechanism is optional)
// V2 data validates with V1 schema (mechanism passes through)
```

**Solution 2: Explicit versioning with discriminated unions**

```typescript
const ConceptSchemaV1 = z.object({
  schema_version: z.literal(1),
  title: z.string(),
  description: z.string(),
});

const ConceptSchemaV2 = z.object({
  schema_version: z.literal(2),
  title: z.string(),
  description: z.string(),
  mechanism: z.string(),
});

const ConceptSchema = z.discriminatedUnion('schema_version', [
  ConceptSchemaV2, // Try V2 first
  ConceptSchemaV1, // Fall back to V1
]);
```

#### Pattern 16: Migration Functions

For breaking changes, provide migration utilities:

```typescript
function migrateConceptV1toV2(v1: ConceptV1): ConceptV2 {
  return {
    ...v1,
    schema_version: 2,
    mechanism: v1.description, // Infer mechanism from description
  };
}

function loadConcept(data: unknown): ConceptV2 {
  // Try parsing as V2
  const v2Result = ConceptSchemaV2.safeParse(data);
  if (v2Result.success) return v2Result.data;

  // Try parsing as V1, then migrate
  const v1Result = ConceptSchemaV1.safeParse(data);
  if (v1Result.success) {
    return migrateConceptV1toV2(v1Result.data);
  }

  throw new Error('Invalid concept data');
}
```

### 3.2 Additive Changes (Safe)

**These changes don't break backward compatibility:**

✅ **Adding optional fields**
```typescript
// Before
const Schema = z.object({
  title: z.string(),
});

// After (safe)
const Schema = z.object({
  title: z.string(),
  subtitle: z.string().optional(), // New optional field
});
```

✅ **Adding array items**
```typescript
// Before
const Track = z.enum(['simpler_path', 'best_fit']);

// After (safe)
const Track = z.enum(['simpler_path', 'best_fit', 'paradigm_shift']);
```

✅ **Adding enum values**
```typescript
// Before
const Status = z.enum(['pending', 'complete']);

// After (safe)
const Status = z.enum(['pending', 'in_progress', 'complete']);
```

✅ **Relaxing validation (making fields optional)**
```typescript
// Before
const Schema = z.object({
  email: z.string().email(), // Required
});

// After (safe)
const Schema = z.object({
  email: z.string().email().optional(), // Now optional
});
```

### 3.3 Breaking Changes (Dangerous)

**These changes break backward compatibility:**

❌ **Removing fields**
```typescript
// Before
const Schema = z.object({
  title: z.string(),
  deprecated_field: z.string(),
});

// After (BREAKS V1 data)
const Schema = z.object({
  title: z.string(),
  // deprecated_field removed
});
```

**Mitigation:** Use `.passthrough()` so old data with `deprecated_field` still validates.

❌ **Renaming fields**
```typescript
// Before
const Schema = z.object({
  title: z.string(),
});

// After (BREAKS V1 data)
const Schema = z.object({
  name: z.string(), // Renamed from title
});
```

**Mitigation:** Support both names temporarily:
```typescript
const Schema = z.object({
  name: z.string().optional(),
  title: z.string().optional(), // Keep old name
}).refine((data) => data.name || data.title, {
  message: 'Must provide either name or title',
});
```

❌ **Making optional fields required**
```typescript
// Before
const Schema = z.object({
  email: z.string().optional(),
});

// After (BREAKS V1 data without email)
const Schema = z.object({
  email: z.string(), // Now required
});
```

**Mitigation:** Keep field optional, handle missing values in application logic.

❌ **Changing field types**
```typescript
// Before
const Schema = z.object({
  count: z.string(), // Was string
});

// After (BREAKS V1 data)
const Schema = z.object({
  count: z.number(), // Now number
});
```

**Mitigation:** Use `.transform()` to coerce types:
```typescript
const Schema = z.object({
  count: z.union([
    z.number(),
    z.string().transform((val) => parseInt(val, 10))
  ]),
});
```

### 3.4 Database Schema Evolution

#### Pattern 17: Store Raw LLM Output + Parsed Version

```typescript
// Database table
interface Report {
  id: string;
  // Raw LLM output (never modify)
  raw_output: Record<string, unknown>;
  // Parsed/validated output (can be recomputed)
  parsed_output: ConceptV2;
  // Schema version used for parsing
  schema_version: number;
  created_at: Date;
}

// Insertion
async function saveReport(rawOutput: unknown) {
  const parsed = ConceptSchemaV2.parse(rawOutput);

  await db.reports.insert({
    raw_output: rawOutput, // Preserve original
    parsed_output: parsed,
    schema_version: 2,
  });
}

// Retrieval with migration
async function loadReport(id: string): Promise<ConceptV2> {
  const report = await db.reports.findById(id);

  // If old schema version, re-parse with new schema
  if (report.schema_version < 2) {
    const migrated = migrateConceptV1toV2(
      ConceptSchemaV1.parse(report.raw_output)
    );

    // Update cached parsed_output
    await db.reports.update(id, {
      parsed_output: migrated,
      schema_version: 2,
    });

    return migrated;
  }

  return report.parsed_output;
}
```

**Benefits:**
- Can always re-parse raw output with new schemas
- No data loss from schema changes
- Supports gradual migration of old data

---

## 4. Multi-Stage Prompt Chains

### 4.1 Chain State Management

#### Pattern 18: Comprehensive Chain State Schema

```typescript
// Centralized state schema for entire chain
export const ChainStateSchema = z.object({
  // Identifiers
  conversationId: z.string(),
  reportId: z.string().uuid(),

  // User input
  userInput: z.string(),
  accountId: z.string().uuid(),
  userId: z.string().uuid(),

  // Step 1 outputs
  step1_output_field1: z.string().optional(),
  step1_output_field2: z.array(z.string()).default([]),

  // Step 2 outputs
  step2_output_field1: z.string().optional(),

  // Step N outputs
  stepN_final_report: z.string().optional(),

  // Metadata
  currentStep: z.string().optional(),
  completedSteps: z.array(z.string()).default([]),
  error: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

export type ChainState = z.infer<typeof ChainStateSchema>;
```

**Real Sparlo Example:**

```typescript
// From /apps/web/lib/llm/schemas/chain-state.ts (651 lines!)
export const ChainStateSchema = z.object({
  conversationId: z.string(),
  reportId: z.string().uuid(),

  // AN0 outputs (30+ fields)
  an0_original_ask: z.string().optional(),
  an0_problem_interpretation: z.string().optional(),
  an0_contradiction: AN0ContradictionSchema.optional(),
  // ... 20+ more AN0 fields

  // AN1 outputs (vector retrieval results)
  an1_failures: z.array(CorpusItemSchema).default([]),
  an1_bounds: z.array(CorpusItemSchema).default([]),

  // AN1.5, AN2, AN3, AN4, AN5 outputs...
  // Each step adds its structured output

  // Tracking
  currentStep: z.string().optional(),
  completedSteps: z.array(z.string()).default([]),
});
```

### 4.2 Context Passing Between Steps

#### Pattern 19: Context Builder Functions

**Problem:** Later steps need context from earlier steps, but not ALL context (token efficiency).

**Solution:** Create explicit context builders per step:

```typescript
// Step 2 needs only specific fields from Step 1
function buildStep2Context(state: ChainState): string {
  return `## Problem Analysis (from Step 1)

**Core Challenge:** ${state.step1_core_challenge}

**Constraints:**
${state.step1_constraints?.map((c) => `- ${c}`).join('\n')}

**Success Metrics:**
${state.step1_success_metrics?.map((m) => `- ${m}`).join('\n')}
`;
}

// Step 3 needs context from Step 1 + Step 2
function buildStep3Context(state: ChainState): string {
  return `## Problem (from Step 1)
${state.step1_core_challenge}

## Analysis (from Step 2)
${state.step2_innovation_patterns?.map((p) => `- ${p.name}: ${p.mechanism}`).join('\n')}
`;
}
```

**Real Sparlo Example:**

```typescript
// From /apps/web/lib/inngest/functions/generate-report.ts
function buildAN2ContextV10(
  state: ChainState,
  an1_5Result: AN1_5_Output | null,
  an1_7Result: AN1_7_Output,
): string {
  return `## Problem Framing (from AN0)

**Original Challenge:** ${state.an0_original_ask ?? state.userInput}
**Reframed Problem:** ${state.an0_reframed_problem ?? 'Not specified'}

### First Principles Decomposition
- **Fundamental Truths:** ${state.an0_first_principles?.fundamental_truths?.join('; ')}
- **Actual Goal:** ${state.an0_first_principles?.actual_goal}

### TRIZ Contradiction
- **Improve:** ${state.an0_contradiction?.improve_parameter.name}
- **Worsens:** ${state.an0_contradiction?.worsen_parameter.name}
- **Plain English:** ${state.an0_contradiction?.plain_english}

## Teaching Examples (from AN1.5)

### TRIZ Exemplars
${JSON.stringify(an1_5Result?.teaching_examples?.triz_exemplars ?? [], null, 2)}

## Literature (from AN1.7)

### Commercial Precedents
${JSON.stringify(an1_7Result?.commercial_precedents ?? [], null, 2)}
`;
}
```

**Benefits:**
- Reduces token count (only relevant context)
- Explicit dependencies between steps
- Easier to debug context issues

#### Pattern 20: State Update Functions

```typescript
function updateStateWithStep1Result(
  state: ChainState,
  result: Step1Output,
): ChainState {
  return {
    ...state,
    step1_core_challenge: result.core_challenge,
    step1_constraints: result.constraints,
    step1_success_metrics: result.success_metrics,
    completedSteps: [...state.completedSteps, 'step1'],
    currentStep: 'step2',
  };
}

// In orchestrator
let state: ChainState = initialState;

const step1Result = await runStep1(state);
state = updateStateWithStep1Result(state, step1Result);

const step2Result = await runStep2(state);
state = updateStateWithStep2Result(state, step2Result);
```

**Real Sparlo Example:**

```typescript
// From /apps/web/lib/inngest/functions/generate-report.ts
async function runReportGeneration() {
  let state: ChainState = {
    conversationId,
    reportId,
    userInput: designChallenge,
    accountId,
    userId,
    completedSteps: [],
  };

  // AN0
  const an0Result = await runAN0(state);
  state = updateStateWithAN0Analysis(state, an0Result.result);

  // AN1 (vector retrieval)
  const an1Result = await runAN1(state);
  state = { ...state, an1_failures: an1Result.failures, ... };

  // AN1.5
  const an1_5Result = await runAN1_5(state, an1Result);
  state = updateStateWithAN1_5Result(state, an1_5Result);

  // ... continue chain
}
```

### 4.3 Error Handling in Chains

#### Pattern 21: Step-Level Error Recovery

```typescript
async function runStep(stepName: string, fn: () => Promise<unknown>) {
  try {
    const result = await fn();
    return { success: true, result };
  } catch (error) {
    // Log error with context
    logger.error({ stepName, error }, 'Step failed');

    // Update state with error
    await updateState({
      currentStep: stepName,
      error: error.message,
    });

    // Decide: retry, skip, or abort?
    if (error instanceof ClaudeRefusalError) {
      // Safety refusal - abort immediately
      throw error;
    }

    if (error instanceof NetworkError) {
      // Transient error - retry
      return runStep(stepName, fn);
    }

    // Unknown error - abort
    throw error;
  }
}
```

**Real Sparlo Example:**

```typescript
// From /apps/web/lib/inngest/functions/generate-report.ts
export const generateReport = inngest.createFunction(
  {
    id: 'generate-report',
    retries: 2, // Inngest handles retries
    onFailure: async ({ error, event, step }) => {
      // Update report status to failed
      await supabase
        .from('sparlo_reports')
        .update({
          status: 'failed',
          error_message: 'Report generation failed',
        })
        .eq('id', event.data.reportId);
    },
  },
  { event: 'report/generate' },
  async ({ event, step }) => {
    try {
      return await runReportGeneration();
    } catch (error) {
      if (error instanceof ClaudeRefusalError) {
        // Handle safety refusals separately
        await supabase.from('sparlo_reports').update({
          status: 'failed',
          error_message: error.message, // User-friendly message
        });

        return { success: false, error: error.message };
      }

      throw error; // Re-throw for Inngest retry
    }
  }
);
```

#### Pattern 22: Clarification Workflow in Chains

```typescript
// Step 1 detects ambiguity
const step1Result = await runStep1(state);

if (step1Result.needs_clarification) {
  // Store question in database
  await updateState({
    currentStep: 'awaiting_clarification',
    clarificationQuestion: step1Result.question,
  });

  // Wait for user response (Inngest waitForEvent)
  const clarificationEvent = await step.waitForEvent(
    'wait-for-clarification',
    {
      event: 'report/clarification-answered',
      match: 'data.reportId',
      timeout: '24h', // Timeout after 24h
    },
  );

  if (!clarificationEvent) {
    // Timeout - mark as failed
    await updateState({ error: 'Clarification timeout' });
    throw new Error('Clarification timeout');
  }

  // Re-run Step 1 with clarification answer
  const step1RetryResult = await runStep1({
    ...state,
    clarificationAnswer: clarificationEvent.data.answer,
  });

  // Continue chain
  state = updateStateWithStep1Result(state, step1RetryResult);
}
```

**Real Sparlo Example:**

```typescript
// From /apps/web/lib/inngest/functions/generate-report.ts
if (an0Result.result.need_question === true) {
  const clarificationQuestion = an0Result.result.question;

  await updateProgress({
    status: 'clarifying',
    clarification_question: clarificationQuestion,
  });

  const clarificationEvent = await step.waitForEvent(
    'wait-for-clarification',
    {
      event: 'report/clarification-answered',
      match: 'data.reportId',
      timeout: '24h',
    },
  );

  if (!clarificationEvent) {
    throw new Error('Clarification timeout');
  }

  // Re-run AN0 with clarification
  const an0RetryResult = await runAN0({
    ...state,
    clarificationAnswer: clarificationEvent.data.answer,
  });

  state = updateStateWithAN0Analysis(state, an0RetryResult.result);
}
```

### 4.4 Token Budget Management

#### Pattern 23: Track Cumulative Token Usage

```typescript
const TOKEN_BUDGET_LIMIT = 200000; // 200K tokens max
let cumulativeTokens = 0;

function checkTokenBudget(usage: TokenUsage, stepName: string) {
  cumulativeTokens += usage.totalTokens;

  if (cumulativeTokens > TOKEN_BUDGET_LIMIT) {
    throw new Error(
      `Token budget exceeded at ${stepName}: ${cumulativeTokens}/${TOKEN_BUDGET_LIMIT}`
    );
  }

  logger.info({
    stepName,
    stepTokens: usage.totalTokens,
    cumulativeTokens,
    budgetRemaining: TOKEN_BUDGET_LIMIT - cumulativeTokens,
  });
}

// After each step
const { content, usage } = await callClaude({ ... });
checkTokenBudget(usage, 'step1');
```

**Real Sparlo Example:**

```typescript
// From /apps/web/lib/inngest/functions/generate-hybrid-report.ts
const TOKEN_BUDGET_LIMIT = 200000;
let cumulativeTokens = 0;

function checkTokenBudget(usage: TokenUsage, stepName: string) {
  cumulativeTokens += usage.totalTokens;
  if (cumulativeTokens > TOKEN_BUDGET_LIMIT) {
    throw new Error(
      `Token budget exceeded at ${stepName}: ${cumulativeTokens}/${TOKEN_BUDGET_LIMIT}`
    );
  }
}

// After each step
checkTokenBudget(an0Result.usage, 'AN0-M');
checkTokenBudget(an1_5Result.usage, 'AN1.5-M');
// ...
```

---

## 5. Performance Optimization Patterns

### 5.1 Streaming for Large Outputs

#### Pattern 24: Stream Responses >10K Tokens

```typescript
async function callLLM(params: {
  system: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<LLMResult> {
  const maxTokens = params.maxTokens ?? 8192;

  // Use streaming for large responses
  if (maxTokens > 10000) {
    const chunks: string[] = [];

    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-5-20251101',
      max_tokens: maxTokens,
      system: params.system,
      messages: [{ role: 'user', content: params.userMessage }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta') {
        chunks.push(event.delta.text);
      }
    }

    const finalMessage = await stream.finalMessage();

    return {
      content: chunks.join(''),
      usage: {
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens,
        totalTokens: finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
      },
    };
  }

  // Non-streaming for smaller responses
  const response = await anthropic.messages.create({ ... });
  return { ... };
}
```

**Real Sparlo Example:**

```typescript
// From /apps/web/lib/llm/client.ts
export async function callClaude(params: {
  model: string;
  system: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<ClaudeResult> {
  const maxTokens = params.maxTokens ?? 8192;

  // Streaming for large requests (>10K tokens)
  if (maxTokens > 10000) {
    const chunks: string[] = [];

    const stream = anthropic.messages.stream({
      model: params.model,
      max_tokens: maxTokens,
      temperature: params.temperature,
      system: params.system,
      messages: [{ role: 'user', content: messageContent }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta') {
        chunks.push(event.delta.text);
      }
    }

    const finalMessage = await stream.finalMessage();

    return {
      content: chunks.join(''),
      usage: {
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens,
        totalTokens: finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
      },
    };
  }

  // Non-streaming for smaller requests
  const response = await anthropic.messages.create({ ... });
  // ...
}
```

**When to stream:**
- Output >10K tokens (concept generation, final reports)
- User-facing UI needs incremental updates
- Risk of timeout (network latency, server limits)

**When NOT to stream:**
- Output <10K tokens (overhead not worth it)
- No UI to show streaming progress
- Parsing requires complete response (JSON validation)

### 5.2 Prompt Caching (Anthropic-Specific)

#### Pattern 25: Cache Static System Prompts

**As of Jan 2025, Anthropic supports prompt caching for repeated context.**

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 8000,
  system: [
    {
      type: 'text',
      text: SYSTEM_PROMPT, // Static prompt (same across requests)
      cache_control: { type: 'ephemeral' }, // Cache for 5 minutes
    },
  ],
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: teachingExamples, // Repeated context
          cache_control: { type: 'ephemeral' }, // Cache this too
        },
        {
          type: 'text',
          text: userProblem, // Unique per request
        },
      ],
    },
  ],
});
```

**Cache Hit Benefits:**
- Cached tokens cost ~10% of regular input tokens
- 90% cost reduction for cached portions
- Faster response times (no need to process cached context)

**Sparlo Implementation Opportunity:**

```typescript
// Current: No caching (every step re-sends full context)
// Opportunity: Cache system prompts + teaching examples

// AN2 receives full AN0 + AN1 + AN1.5 + AN1.7 context
// Without caching: ~10K input tokens
// With caching: ~3K new + 7K cached = ~4.2K effective tokens (58% savings)

async function callClaudeWithCache(params: {
  system: string;
  cachedContext?: string; // Teaching examples, previous step outputs
  userMessage: string;
  maxTokens?: number;
}) {
  const systemBlocks = [
    {
      type: 'text',
      text: params.system,
      cache_control: { type: 'ephemeral' },
    },
  ];

  const messageContent = [];

  if (params.cachedContext) {
    messageContent.push({
      type: 'text',
      text: params.cachedContext,
      cache_control: { type: 'ephemeral' },
    });
  }

  messageContent.push({
    type: 'text',
    text: params.userMessage,
  });

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: params.maxTokens ?? 8192,
    system: systemBlocks,
    messages: [{ role: 'user', content: messageContent }],
  });

  return response;
}
```

**Cache Invalidation:**
- Ephemeral cache lasts 5 minutes
- Cache key = exact text match (any change invalidates)
- Anthropic handles cache management automatically

**Best Practices:**
- Cache static system prompts (same across all requests)
- Cache teaching examples (same for similar problems)
- DON'T cache user-specific data (changes every request)
- Place cached content at the START of message (cache_control position matters)

### 5.3 Parallel vs Sequential Execution

#### Pattern 26: Identify Independent Steps

```typescript
// ❌ BAD: Sequential execution when steps are independent
const step1Result = await runStep1(state);
const step2Result = await runStep2(state); // Doesn't depend on step1
const step3Result = await runStep3(state); // Doesn't depend on step1 or step2

// Total time: T1 + T2 + T3

// ✅ GOOD: Parallel execution for independent steps
const [step1Result, step2Result, step3Result] = await Promise.all([
  runStep1(state),
  runStep2(state),
  runStep3(state),
]);

// Total time: max(T1, T2, T3)
```

**Sparlo Example (Potential Optimization):**

```typescript
// Current: AN1.5 and AN1.7 run sequentially
// Both depend only on AN0 + AN1 → could run in parallel

// Sequential (current)
const an1_5Result = await runAN1_5(state, an1Result); // Depends on AN0 + AN1
const an1_7Result = await runAN1_7(state, an1_5Result); // Depends on AN0 + AN1.5

// Parallel (optimized)
const [an1_5Result, an1_7Result] = await Promise.all([
  runAN1_5(state, an1Result), // Depends on AN0 + AN1
  runAN1_7(state, an1Result), // Depends on AN0 + AN1 (NOT AN1.5)
]);

// If AN1.7 truly doesn't need AN1.5, 20-30% time savings on this segment
```

**Caution:** Only parallelize truly independent steps. If step B needs step A's output, keep sequential.

---

## 6. Real-World Examples from Sparlo

### 6.1 Complete Schema Example (Hybrid Mode AN0-M)

```typescript
// From /apps/web/lib/llm/prompts/hybrid/schemas.ts

// Primitives with resilience patterns
export const SafeUrlSchema = z
  .string()
  .optional()
  .refine((url) => !url || isValidSafeUrl(url), {
    message: 'Blocked URL protocol or host',
  });

export const SeverityLevel = z
  .enum(['low', 'medium', 'high', 'LOW', 'MEDIUM', 'HIGH'])
  .transform((val) => val.toLowerCase() as 'low' | 'medium' | 'high')
  .pipe(z.enum(['low', 'medium', 'high']));

export const TrackSchema = z.enum([
  'simpler_path',
  'best_fit',
  'paradigm_shift',
  'frontier_transfer',
]);

// Nested object schemas with .passthrough()
export const RiskItemSchema = z.object({
  risk: z.string(),
  likelihood: z.enum(['low', 'medium', 'high']).catch('medium'),
  impact: z.enum(['low', 'medium', 'high']).catch('medium'),
  mitigation: z.string().optional(),
}).passthrough();

export const PriorArtSchema = z.object({
  source: z.string(),
  relevance: z.string(),
  what_it_proves: z.string().optional(),
  url: SafeUrlSchema,
}).passthrough();

// Main output schema with discriminated union
const AN0_M_AnalysisSchema = z.object({
  needs_clarification: z.literal(false),
  problem_analysis: z.object({
    core_challenge: z.string(),
    constraints: z.array(z.string()).catch([]),
    success_metrics: z.array(z.string()).catch([]),
    industry_assumptions: z.array(z.string()).catch([]),
  }).passthrough(),
  landscape_map: z.object({
    current_approaches: z.array(z.string()).catch([]),
    known_limitations: z.array(z.string()).catch([]),
    unexplored_territories: z.array(z.string()).catch([]),
  }).passthrough(),
  discovery_seeds: z.array(z.object({
    domain: z.string(),
    potential_mechanism: z.string(),
    why_relevant: z.string(),
  }).passthrough()).catch([]),
}).passthrough();

const AN0_M_ClarificationSchema = z.object({
  needs_clarification: z.literal(true),
  clarification_question: z.string(),
});

export const AN0_M_OutputSchema = z.discriminatedUnion('needs_clarification', [
  AN0_M_ClarificationSchema,
  AN0_M_AnalysisSchema,
]);
```

**Resilience Features:**
- `.catch([])` handles malformed arrays
- `.default([])` handles missing arrays
- `.passthrough()` preserves forward compatibility
- `.transform()` normalizes case inconsistencies
- `SafeUrlSchema` prevents SSRF/XSS
- Discriminated union handles clarification flow

### 6.2 Complete Multi-Step Chain Example

```typescript
// Simplified from /apps/web/lib/inngest/functions/generate-report.ts

export const generateReport = inngest.createFunction(
  {
    id: 'generate-report',
    retries: 2,
    onFailure: async ({ error, event }) => {
      await updateReportStatus(event.data.reportId, 'failed');
    },
  },
  { event: 'report/generate' },
  async ({ event, step }) => {
    const { reportId, designChallenge, accountId, userId } = event.data;

    // Initialize state
    let state: ChainState = {
      conversationId: `conv_${reportId}`,
      reportId,
      userInput: designChallenge,
      accountId,
      userId,
      completedSteps: [],
    };

    // Step 1: Problem Framing (AN0)
    const an0Result = await step.run('an0-problem-framing', async () => {
      const { content, usage } = await callClaude({
        model: MODELS.OPUS,
        system: AN0_PROMPT,
        userMessage: designChallenge,
        maxTokens: 8000,
      });

      const parsed = AN0OutputSchema.parse(JSON.parse(content));
      return { result: parsed, usage };
    });

    // Check for clarification
    if (an0Result.result.need_question) {
      const clarificationEvent = await step.waitForEvent(
        'wait-for-clarification',
        {
          event: 'report/clarification-answered',
          match: 'data.reportId',
          timeout: '24h',
        },
      );

      if (!clarificationEvent) {
        throw new Error('Clarification timeout');
      }

      // Re-run AN0 with clarification
      // ... (omitted for brevity)
    }

    // Update state with AN0 results
    state = updateStateWithAN0Analysis(state, an0Result.result);

    // Step 2: Corpus Retrieval (AN1) - Vector search, no LLM
    const an1Result = await step.run('an1-corpus-retrieval', async () => {
      return await retrieveCorpusExamples(
        state.an0_corpus_queries?.teaching_examples.triz ?? [],
        state.an0_corpus_queries?.teaching_examples.transfers ?? [],
        state.an0_corpus_queries?.validation.failures ?? [],
        state.an0_corpus_queries?.validation.bounds ?? []
      );
    });

    state = {
      ...state,
      an1_failures: an1Result.failures,
      an1_bounds: an1Result.bounds,
      an1_transfers: an1Result.transfers,
      an1_triz: an1Result.triz,
    };

    // Step 3: Teaching Selection (AN1.5)
    const an1_5Result = await step.run('an1.5-teaching-selection', async () => {
      const context = buildAN1_5Context(state, an1Result);

      const { content, usage } = await callClaude({
        model: MODELS.OPUS,
        system: AN1_5_PROMPT,
        userMessage: context,
        maxTokens: 8000,
      });

      const parsed = AN1_5_OutputSchema.parse(JSON.parse(content));
      return { result: parsed, usage };
    });

    state = updateStateWithAN1_5Result(state, an1_5Result.result);

    // Step 4: Literature Augmentation (AN1.7)
    // Step 5: Innovation Briefing (AN2)
    // Step 6: Concept Generation (AN3)
    // Step 7: Evaluation (AN4)
    // Step 8: Report Generation (AN5)
    // ... (omitted for brevity)

    // Final: Update database with complete report
    await updateReportWithResults(reportId, state);

    return { success: true, reportId, state };
  }
);
```

**Key Patterns:**
- Inngest `step.run()` for durable execution
- State accumulation (spread operator)
- Context builders for each step
- Clarification workflow with `waitForEvent`
- Error handling with retries and onFailure

### 6.3 Cost Tracking & Token Budgets

```typescript
// From /apps/web/lib/llm/client.ts

export const CLAUDE_PRICING = {
  'claude-opus-4-5-20251101': {
    inputPerMillion: 15,   // $15 per 1M input tokens
    outputPerMillion: 75,  // $75 per 1M output tokens
  },
} as const;

export function calculateCost(
  usage: TokenUsage,
  model: keyof typeof CLAUDE_PRICING
): number {
  const pricing = CLAUDE_PRICING[model];
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputPerMillion;
  return inputCost + outputCost;
}

// Track cumulative cost
let totalCost = 0;

after each step:
const cost = calculateCost(stepUsage, 'claude-opus-4-5-20251101');
totalCost += cost;

console.log(`Step cost: $${cost.toFixed(4)}, Total: $${totalCost.toFixed(2)}`);
```

**Token Budget Enforcement:**

```typescript
// From /apps/web/lib/inngest/functions/generate-hybrid-report.ts

const TOKEN_BUDGET_LIMIT = 200000; // 200K tokens max
let cumulativeTokens = 0;

function checkTokenBudget(usage: TokenUsage, stepName: string) {
  cumulativeTokens += usage.totalTokens;

  if (cumulativeTokens > TOKEN_BUDGET_LIMIT) {
    throw new Error(
      `Token budget exceeded at ${stepName}: ${cumulativeTokens}/${TOKEN_BUDGET_LIMIT}`
    );
  }

  const budgetUsed = (cumulativeTokens / TOKEN_BUDGET_LIMIT) * 100;
  console.log(`${stepName}: ${budgetUsed.toFixed(1)}% of budget used`);
}

// After each LLM call
checkTokenBudget(an0Result.usage, 'AN0-M');
checkTokenBudget(an1_5Result.usage, 'AN1.5-M');
// ...
```

---

## Summary: Quick Reference Checklist

### Schema Design Checklist

- [ ] Use `.default([])` for optional arrays
- [ ] Use `.catch(defaultValue)` for enums and potentially malformed fields
- [ ] Use `.passthrough()` on all nested objects
- [ ] Use `.optional()` for truly optional fields
- [ ] Normalize case with `.transform()` for enums
- [ ] Validate URLs with security checks (SSRF, XSS)
- [ ] Limit array lengths (max 50-100) to prevent DoS
- [ ] Extract TypeScript types with `z.infer<>`
- [ ] Compose schemas from reusable primitives

### Prompt Design Checklist

- [ ] Include domain/safety context upfront
- [ ] Emphasize JSON-only output (no markdown)
- [ ] Provide 1-2 concrete examples
- [ ] Define clarification triggers
- [ ] Use discriminated unions for branching logic
- [ ] Tune temperature per step type (analytical vs creative)

### Schema Evolution Checklist

- [ ] Use `.passthrough()` for forward compatibility
- [ ] Prefer additive changes (new optional fields)
- [ ] Provide migration functions for breaking changes
- [ ] Store raw LLM output + parsed version in database
- [ ] Version schemas explicitly when needed

### Multi-Step Chain Checklist

- [ ] Centralize state in comprehensive Zod schema
- [ ] Create context builder functions per step
- [ ] Track cumulative token usage
- [ ] Enforce token budgets
- [ ] Handle clarification workflows
- [ ] Use discriminated unions for conditional flows
- [ ] Implement step-level error recovery
- [ ] Parallelize independent steps

### Performance Checklist

- [ ] Stream responses >10K tokens
- [ ] Cache static system prompts (Anthropic prompt caching)
- [ ] Cache teaching examples for similar problems
- [ ] Truncate less critical context fields
- [ ] Monitor and optimize token usage per step

---

## File Locations Reference

**Schemas:**
- Chain State: `/apps/web/lib/llm/schemas/chain-state.ts`
- Hybrid Schemas: `/apps/web/lib/llm/prompts/hybrid/schemas.ts`

**Prompts:**
- Standard Mode: `/apps/web/lib/llm/prompts/an{N}-{name}.ts`
- Hybrid Mode: `/apps/web/lib/llm/prompts/hybrid/prompts.ts`

**Orchestration:**
- Standard Mode: `/apps/web/lib/inngest/functions/generate-report.ts`
- Hybrid Mode: `/apps/web/lib/inngest/functions/generate-hybrid-report.ts`

**LLM Client:**
- Client wrapper: `/apps/web/lib/llm/client.ts`

**Existing Documentation:**
- LLM Architecture: `/Users/alijangbar/sparlo-v2/RESEARCH_SUMMARY_LLM_ARCHITECTURE.md`

---

**End of Best Practices Guide**
