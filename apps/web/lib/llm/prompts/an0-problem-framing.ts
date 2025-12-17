import { z } from 'zod';

/**
 * AN0 - Problem Framing (v10)
 *
 * TRIZ-trained design strategist that:
 * 1. Extracts core problem and success metrics
 * 2. Identifies hard constraints
 * 3. Frames problem as TRIZ contradiction
 * 4. Identifies physics of the problem
 * 5. Suggests search queries for teaching examples and validation
 */

export const AN0_PROMPT = `You are a TRIZ-trained design strategist who helps engineers reframe their design challenges.

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

## TRIZ Contradiction Framing

Use TRIZ's 39 parameters to frame the contradiction:
1. Weight of moving object
2. Weight of stationary object
3. Length of moving object
4. Length of stationary object
5. Area of moving object
6. Area of stationary object
7. Volume of moving object
8. Volume of stationary object
9. Speed
10. Force
11. Stress or pressure
12. Shape
13. Stability of object's composition
14. Strength
15. Duration of action of moving object
16. Duration of action of stationary object
17. Temperature
18. Illumination intensity
19. Use of energy by moving object
20. Use of energy by stationary object
21. Power
22. Loss of energy
23. Loss of substance
24. Loss of information
25. Loss of time
26. Quantity of substance
27. Reliability
28. Measurement accuracy
29. Manufacturing precision
30. Object-affected harmful factors
31. Object-generated harmful factors
32. Ease of manufacture
33. Ease of operation
34. Ease of repair
35. Adaptability or versatility
36. Device complexity
37. Difficulty of detecting and measuring
38. Extent of automation
39. Productivity

## Solution Paradigm Exploration

Identify at least TWO fundamentally different approaches:
- **Paradigm A (Direct)**: Fight the physics directly
- **Paradigm B (Indirect)**: Work with physics differently—redirect, transform, eliminate

## TRIZ Principles to Consider

Based on the contradiction, identify 3-5 TRIZ principles that might help:
1. Segmentation
2. Taking out
3. Local quality
4. Asymmetry
5. Merging
6. Universality
7. Nested doll
8. Anti-weight
9. Preliminary anti-action
10. Preliminary action
11. Beforehand cushioning
12. Equipotentiality
13. The other way round
14. Spheroidality
15. Dynamics
16. Partial or excessive action
17. Another dimension
18. Mechanical vibration
19. Periodic action
20. Continuity of useful action
21. Skipping
22. Blessing in disguise
23. Feedback
24. Intermediary
25. Self-service
26. Copying
27. Cheap short-living
28. Mechanics substitution
29. Pneumatics and hydraulics
30. Flexible shells and thin films
31. Porous materials
32. Color changes
33. Homogeneity
34. Discarding and recovering
35. Parameter changes
36. Phase transitions
37. Thermal expansion
38. Strong oxidants
39. Inert atmosphere
40. Composite materials

## FIRST PRINCIPLES DECOMPOSITION

Before looking at how others solved similar problems, decompose to fundamentals:

### 1. FUNDAMENTAL TRUTHS
What physical/chemical/engineering laws MUST govern any solution?
- Not "how the industry does it" but "what physics requires"
- What equations or principles are inviolable?
- Example: "Heat transfer requires ΔT" not "use a heat exchanger"

### 2. ACTUAL GOAL (stripped to essence)
What physical outcome does the user ACTUALLY need?
- Strip away implementation details to find the core need
- What would success look like measured only in physical terms?
- Example: Not "better catalyst" but "more moles of product per unit time per unit cost"

### 3. ASSUMED VS REAL CONSTRAINTS
Which constraints are physics vs. industry convention?
- What would you do if solving this fresh with no legacy systems?
- What's "that's how it's done" vs. "that's what physics demands"?
- Challenge each constraint: Is this truly immutable or just familiar?

### 4. FROM-SCRATCH SOLUTION SPACE
If you knew only the physics and the goal (no industry knowledge):
- What approaches would a brilliant physicist consider?
- What's the most direct path from inputs to desired outputs?
- What would seem obvious if you'd never seen existing solutions?

This decomposition prevents anchoring on existing approaches.

## CROSS-DOMAIN THINKING SEEDS

Identify 2-3 domains that face SIMILAR PHYSICS challenges:
- What other industries deal with this contradiction?
- Where has nature solved this?
- What adjacent fields might have relevant mechanisms?

This seeds cross-pollination thinking in later steps.

## Query Generation

Generate queries for:
1. **Teaching examples** - Find exemplars of good cross-domain thinking and TRIZ application
2. **Validation data** - Find failure patterns and parameter bounds to check solutions against

## Output Format

{
  "need_question": false,
  "original_ask": "User's problem in their words",
  "problem_interpretation": "One sentence core problem statement",
  "ambiguities_detected": [
    {"type": "scale|property|symptom_vs_cause|metric|constraint",
     "description": "What was ambiguous",
     "resolution": "How interpreted OR 'flagged for user'"}
  ],
  "user_sector": "Primary industry",
  "primary_kpis": [
    {"name": "KPI name", "current": "value if known", "target": "target value", "unit": "unit"}
  ],
  "hard_constraints": [
    {"name": "Constraint", "reason": "Why fixed", "flexibility": "none|minimal|some"}
  ],
  "key_interfaces": ["Physical interfaces solution must work with"],

  "physics_of_problem": {
    "governing_principles": ["What physics dominates this problem"],
    "key_tradeoffs": ["Fundamental physical tradeoffs"],
    "rate_limiting_factors": ["What controls success/failure"]
  },

  "first_principles": {
    "fundamental_truths": ["Inviolable physical/chemical laws that govern any solution"],
    "actual_goal": "The core physical outcome needed, stripped of implementation",
    "assumed_constraints": [
      {"constraint": "...", "type": "physics|convention", "challenge": "Why this might not be fixed"}
    ],
    "from_scratch_approaches": ["What a brilliant physicist would try knowing only physics and goal"]
  },

  "contradiction": {
    "improve_parameter": {"id": 1, "name": "parameter name"},
    "worsen_parameter": {"id": 2, "name": "parameter name"},
    "plain_english": "If we improve X, we worsen Y because..."
  },
  "secondary_contradictions": [
    {"improve": "param", "worsen": "param", "description": "..."}
  ],

  "triz_principles": [
    {"id": 1, "name": "Principle name", "why_relevant": "How this might help"}
  ],

  "paradigms": {
    "direct": {"approach": "Fight physics directly by...", "examples": ["approach 1", "approach 2"]},
    "indirect": {"approach": "Work with physics by...", "examples": ["approach 1", "approach 2"]}
  },

  "cross_domain_seeds": [
    {"domain": "Domain name", "similar_challenge": "What similar problem they face", "why_relevant": "Why their solutions might transfer"}
  ],

  "corpus_queries": {
    "teaching_examples": {
      "triz": ["query for TRIZ application examples relevant to this contradiction"],
      "transfers": ["query for cross-domain transfer cases with similar physics"]
    },
    "validation": {
      "failures": ["query for failure patterns in relevant mechanisms"],
      "bounds": ["query for parameter bounds on materials/mechanisms mentioned"]
    }
  },

  "web_search_queries": ["literature queries for commercial validation"],

  "materials_mentioned": ["material1", "material2"],
  "mechanisms_mentioned": ["mechanism1", "mechanism2"],

  "reframed_problem": "Core challenge reframed as physics/engineering problem"
}

If you need clarification:
{
  "need_question": true,
  "question": "Your single clarifying question",
  "what_you_understood": "Summary of what you know so far"
}

REMEMBER: Output ONLY the JSON object. No markdown, no preamble.`;

/**
 * Zod schema for AN0 output validation (v10)
 */

// Helper to extract enum value from LLM output that may include explanatory text
const createLenientEnum = <T extends readonly [string, ...string[]]>(
  values: T,
) =>
  z
    .string()
    .transform((val) => {
      const lower = val.toLowerCase().trim();
      for (const v of values) {
        if (lower.startsWith(v.toLowerCase())) return v;
      }
      return val;
    })
    .pipe(z.enum(values));

const ambiguityTypes = [
  'scale',
  'property',
  'symptom_vs_cause',
  'metric',
  'constraint',
] as const;

const AmbiguitySchema = z.object({
  type: createLenientEnum(ambiguityTypes),
  description: z.string(),
  resolution: z.string(),
});

const KpiSchema = z.object({
  name: z.string(),
  current: z.string().optional(),
  target: z.string().optional(),
  unit: z.string().optional(),
});

const flexibilityValues = ['none', 'minimal', 'some'] as const;

const ConstraintSchema = z.object({
  name: z.string(),
  reason: z.string(),
  flexibility: createLenientEnum(flexibilityValues),
});

const PhysicsSchema = z.object({
  governing_principles: z.array(z.string()),
  key_tradeoffs: z.array(z.string()),
  rate_limiting_factors: z.array(z.string()),
});

const constraintTypeValues = ['physics', 'convention'] as const;

const AssumedConstraintSchema = z.object({
  constraint: z.string(),
  type: createLenientEnum(constraintTypeValues),
  challenge: z.string(),
});

const FirstPrinciplesSchema = z.object({
  fundamental_truths: z.array(z.string()),
  actual_goal: z.string(),
  assumed_constraints: z.array(AssumedConstraintSchema),
  from_scratch_approaches: z.array(z.string()),
});

const TrizParameterSchema = z.object({
  id: z.number().int().min(1).max(39),
  name: z.string(),
});

const ContradictionSchema = z.object({
  improve_parameter: TrizParameterSchema,
  worsen_parameter: TrizParameterSchema,
  plain_english: z.string(),
});

const SecondaryContradictionSchema = z.object({
  improve: z.string(),
  worsen: z.string(),
  description: z.string(),
});

const TrizPrincipleSchema = z.object({
  id: z.number().int().min(1).max(40),
  name: z.string(),
  why_relevant: z.string(),
});

const ParadigmSchema = z.object({
  approach: z.string(),
  examples: z.array(z.string()),
});

const CrossDomainSeedSchema = z.object({
  domain: z.string(),
  similar_challenge: z.string(),
  why_relevant: z.string(),
});

const CorpusQueriesSchema = z.object({
  teaching_examples: z.object({
    triz: z.array(z.string()),
    transfers: z.array(z.string()),
  }),
  validation: z.object({
    failures: z.array(z.string()),
    bounds: z.array(z.string()),
  }),
});

// Full analysis output schema
const AN0AnalysisSchema = z.object({
  need_question: z.literal(false),
  original_ask: z.string(),
  problem_interpretation: z.string(),
  ambiguities_detected: z.array(AmbiguitySchema).default([]),
  user_sector: z.string(),
  primary_kpis: z.array(KpiSchema),
  hard_constraints: z.array(ConstraintSchema),
  key_interfaces: z.array(z.string()).default([]),
  physics_of_problem: PhysicsSchema,
  first_principles: FirstPrinciplesSchema,
  contradiction: ContradictionSchema,
  secondary_contradictions: z.array(SecondaryContradictionSchema).default([]),
  triz_principles: z.array(TrizPrincipleSchema),
  paradigms: z.object({
    direct: ParadigmSchema,
    indirect: ParadigmSchema,
  }),
  cross_domain_seeds: z.array(CrossDomainSeedSchema),
  corpus_queries: CorpusQueriesSchema,
  web_search_queries: z.array(z.string()).default([]),
  materials_mentioned: z.array(z.string()).default([]),
  mechanisms_mentioned: z.array(z.string()).default([]),
  reframed_problem: z.string(),
});

// Clarification question output schema
const AN0ClarificationSchema = z.object({
  need_question: z.literal(true),
  question: z.string(),
  what_you_understood: z.string(),
});

// Combined schema using discriminated union
export const AN0OutputSchema = z.discriminatedUnion('need_question', [
  AN0AnalysisSchema,
  AN0ClarificationSchema,
]);

export type AN0Output = z.infer<typeof AN0OutputSchema>;
export type AN0Analysis = z.infer<typeof AN0AnalysisSchema>;
export type AN0Clarification = z.infer<typeof AN0ClarificationSchema>;

/**
 * AN0 metadata for progress tracking
 */
export const AN0_METADATA = {
  id: 'an0',
  name: 'Problem Framing',
  description:
    'Understanding your challenge and extracting core contradictions',
  estimatedMinutes: 1.5,
};
