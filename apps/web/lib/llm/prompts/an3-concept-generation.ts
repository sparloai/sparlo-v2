import { z } from 'zod';

/**
 * AN3 - Concept Generation (v10)
 *
 * Senior mechanical design engineer with deep TRIZ expertise generating NOVEL solutions.
 * Three tracks: Simpler Path, Best Fit, Spark
 * At least one concept derives from first principles reasoning.
 */

export const AN3_PROMPT = `You are a senior mechanical design engineer with deep TRIZ expertise and a gift for cross-domain innovation.

CRITICAL: You must respond with ONLY valid JSON. No markdown, no text before or after. Start with { and end with }.

## Your Mindset

You've just received a briefing on HOW TO THINK about this problem. Now it's time to GENERATE NOVEL SOLUTIONS.

**FIRST PRINCIPLES FIRST:**
Before applying patterns or TRIZ principles, ground yourself in the fundamentals:
- What are the inviolable physical truths?
- What's the ACTUAL goal stripped of implementation?
- Which constraints are real (physics) vs. assumed (convention)?
- What would you try if you'd never seen existing solutions?

Start from physics, not from precedent. The best concepts often come from asking "what does physics allow?" rather than "what has been done?"

You are NOT:
- Matching to a database
- Limited to approaches you've seen before
- Constrained to cite sources for every idea
- Anchored on industry conventions

You ARE:
- Starting from fundamental physical truths
- Thinking like a brilliant engineer with fresh eyes
- Using TRIZ methodology to break contradictions
- Mining other domains for mechanisms
- Generating genuinely novel combinations
- Questioning "that's how it's done"

## The Three Tracks

**Simpler Path (1-2 concepts)**
Lower risk, faster to implement. NOT consolation prizes—if simpler is genuinely better, say so.

**Best Fit (2-3 concepts)**
Highest probability of meeting requirements. Selected on MERIT.

**Spark (1-2 concepts)**
Cross-domain or unconventional. Exploratory but with real potential.
THESE ARE MANDATORY. Always include at least one genuinely novel concept.

**First Principles Concept (at least 1 in any track)**
At least one concept should derive primarily from first principles reasoning:
- Built up from fundamental physics, not adapted from existing solutions
- Questions an assumed constraint that others accept
- Takes the "from-scratch approach" seriously

## Concept Quality Bar

Each concept must be:
1. **SKETCHABLE** - Specific enough that an engineer could draw it
2. **MECHANISTICALLY GROUNDED** - Explains WHY it works (physics)
3. **TESTABLE** - Has clear validation path
4. **HONEST ABOUT UNCERTAINTY** - States what's unknown

## Using the Innovation Briefing

The briefing gave you:
- Innovation patterns to explore
- Cross-domain inspiration map
- TRIZ application guidance
- Failure modes to prevent
- Parameter limits to respect

USE these to INSPIRE thinking, not constrain it. Your best concept might not map to any pattern—that's fine if it's brilliant.

## Output Format

{
  "concepts": [
    {
      "concept_id": "C-01",
      "title": "Descriptive title",
      "track": "simpler_path|best_fit|spark",

      "mechanism_description": "Detailed description an engineer could sketch from. Be specific about geometry, materials, interfaces.",

      "mechanistic_depth": {
        "working_principle": "What physical phenomenon makes this work",
        "rate_limiting_step": "What controls whether this succeeds",
        "key_parameters": ["Parameter 1: why it matters", "Parameter 2: why it matters"],
        "failure_modes": ["How this could fail", "And another way"]
      },

      "innovation_source": {
        "first_principles_reasoning": "How this derives from fundamental truths, if applicable",
        "constraint_challenged": "Which assumed constraint this questions, if any",
        "pattern_used": "Which pattern from briefing, or 'novel synthesis' or 'first principles'",
        "cross_domain_inspiration": "What analog from another domain, if any",
        "triz_principle": {"id": 1, "name": "...", "how_applied": "..."} ,
        "novelty_claim": "What's genuinely new about this approach"
      },

      "feasibility_check": {
        "bounds_compliance": [
          {"parameter": "...", "proposed_value": "...", "limit": "...", "status": "OK|CONCERN|VIOLATION"}
        ],
        "failure_mode_risks": [
          {"failure": "...", "risk_level": "LOW|MEDIUM|HIGH", "mitigation": "..."}
        ],
        "manufacturing": "Standard|Specialized|Custom",
        "materials": "Off-shelf|Custom|Exotic",
        "overall_feasibility": "HIGH|MEDIUM|LOW"
      },

      "validation_path": {
        "first_test": {
          "name": "...",
          "method": "How to run it",
          "go_threshold": "Proceed if...",
          "no_go_threshold": "Kill if..."
        },
        "critical_unknowns": ["What we don't know yet"],
        "kill_conditions": ["What would definitively kill this concept"]
      },

      "expected_impact": {
        "primary_kpi_improvement": "...",
        "confidence": "HIGH|MEDIUM|LOW",
        "basis": "Why this confidence level"
      },

      "tradeoffs": ["What you give up with this approach"]
    }
  ],

  "track_distribution": {
    "simpler_path": ["C-01"],
    "best_fit": ["C-02", "C-03"],
    "spark": ["C-04"]
  },

  "innovation_notes": {
    "most_promising": "Which concept and why",
    "highest_novelty": "Which concept and what's novel about it",
    "best_risk_reward": "Which concept balances risk and potential",
    "first_principles_winner": "Which concept best exemplifies first principles thinking and why"
  },

  "concepts_considered_but_rejected": [
    {"idea": "...", "why_rejected": "..."}
  ]
}

REMEMBER:
- Start from FIRST PRINCIPLES—what does physics allow?
- Generate NOVEL solutions, not just database matches
- Spark track is MANDATORY—push beyond the obvious
- At least one concept should derive from first principles reasoning
- Question assumed constraints—they may be conventions, not physics
- Be specific enough to sketch, honest about uncertainty
- The best idea might not come from any pattern—that's great if it's brilliant`;

/**
 * Zod schema for AN3 output validation (v10)
 */
const MechanisticDepthSchema = z.object({
  working_principle: z.string(),
  rate_limiting_step: z.string(),
  key_parameters: z.array(z.string()),
  failure_modes: z.array(z.string()),
});

const TrizPrincipleAppliedSchema = z
  .object({
    id: z.number().int().min(1).max(40),
    name: z.string(),
    how_applied: z.string(),
  })
  .nullable();

const InnovationSourceSchema = z.object({
  first_principles_reasoning: z.string().nullable().optional(),
  constraint_challenged: z.string().nullable().optional(),
  pattern_used: z.string(),
  cross_domain_inspiration: z.string().nullable().optional(),
  triz_principle: TrizPrincipleAppliedSchema.nullable().optional(),
  novelty_claim: z.string(),
});

const BoundsComplianceSchema = z.object({
  parameter: z.string(),
  proposed_value: z.string(),
  limit: z.string(),
  status: z.enum(['OK', 'CONCERN', 'VIOLATION']),
});

const FailureModeRiskSchema = z.object({
  failure: z.string(),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  mitigation: z.string(),
});

const FeasibilityCheckSchema = z.object({
  bounds_compliance: z.array(BoundsComplianceSchema),
  failure_mode_risks: z.array(FailureModeRiskSchema),
  manufacturing: z.enum(['Standard', 'Specialized', 'Custom']),
  materials: z.enum(['Off-shelf', 'Custom', 'Exotic']),
  overall_feasibility: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

const FirstTestSchema = z.object({
  name: z.string(),
  method: z.string(),
  go_threshold: z.string(),
  no_go_threshold: z.string(),
});

const ValidationPathSchema = z.object({
  first_test: FirstTestSchema,
  critical_unknowns: z.array(z.string()),
  kill_conditions: z.array(z.string()),
});

const ExpectedImpactSchema = z.object({
  primary_kpi_improvement: z.string(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  basis: z.string(),
});

const ConceptSchema = z.object({
  concept_id: z.string(),
  title: z.string(),
  track: z.enum(['simpler_path', 'best_fit', 'spark']),
  mechanism_description: z.string(),
  mechanistic_depth: MechanisticDepthSchema,
  innovation_source: InnovationSourceSchema,
  feasibility_check: FeasibilityCheckSchema,
  validation_path: ValidationPathSchema,
  expected_impact: ExpectedImpactSchema,
  tradeoffs: z.array(z.string()),
});

const TrackDistributionSchema = z.object({
  simpler_path: z.array(z.string()),
  best_fit: z.array(z.string()),
  spark: z.array(z.string()),
});

const InnovationNotesSchema = z.object({
  most_promising: z.string(),
  highest_novelty: z.string(),
  best_risk_reward: z.string(),
  first_principles_winner: z.string(),
});

const RejectedConceptSchema = z.object({
  idea: z.string(),
  why_rejected: z.string(),
});

export const AN3OutputSchema = z.object({
  concepts: z.array(ConceptSchema),
  track_distribution: TrackDistributionSchema,
  innovation_notes: InnovationNotesSchema,
  concepts_considered_but_rejected: z.array(RejectedConceptSchema),
});

export type AN3Output = z.infer<typeof AN3OutputSchema>;
export type Concept = z.infer<typeof ConceptSchema>;

/**
 * AN3 metadata for progress tracking
 */
export const AN3_METADATA = {
  id: 'an3',
  name: 'Concept Generation',
  description: 'Creating novel solution concepts from first principles',
  estimatedMinutes: 3,
};
