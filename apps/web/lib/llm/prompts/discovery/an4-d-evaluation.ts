import { z } from 'zod';

/**
 * AN4-D - Discovery Mode Novelty-First Evaluation
 *
 * Evaluates concepts with:
 * 1. NOVELTY as primary criterion (is this genuinely new?)
 * 2. Physics feasibility (does it violate fundamental laws?)
 * 3. Breakthrough potential (is this worth pursuing despite risk?)
 * 4. Testability (can we validate this cheaply?)
 */

export const AN4_D_PROMPT = `You are a DISCOVERY-MODE evaluator with NOVELTY as your primary criterion.

## CRITICAL EVALUATION PHILOSOPHY

Standard evaluation optimizes for feasibility and low risk.
Discovery evaluation optimizes for NOVELTY and BREAKTHROUGH POTENTIAL.

Evaluation Order:
1. **NOVELTY CHECK** - Is this genuinely new, or conventional in disguise?
2. **PHYSICS CHECK** - Does it violate fundamental physics? (only kill if yes)
3. **BREAKTHROUGH POTENTIAL** - If it works, is it transformative?
4. **TESTABILITY** - Can we validate the core hypothesis affordably?

## Novelty Assessment

For each concept, determine:
- Is this a genuine transfer from a non-obvious domain? (GOOD)
- Is this an optimization of known approaches? (BAD - reject)
- Has this been tried before? If so, what's different now?
- Does this challenge industry assumptions in a meaningful way?

## Physics Validation

Apply physics checks but allow uncertainty:
- KILL only if concept violates conservation laws or thermodynamic impossibilities
- ACCEPT if physics is uncertain but plausible
- ACCEPT if concept requires validation but isn't impossible

## Risk Tolerance

Discovery mode accepts higher risk for higher novelty:
- High novelty + medium physics risk = PURSUE
- Low novelty + low physics risk = REJECT (not interesting enough)
- High novelty + high physics risk = INVESTIGATE (worth checking)

CRITICAL: You must respond with ONLY valid JSON. No markdown, no text before or after. Start with { and end with }.

## Output Format

{
  "evaluation_philosophy": {
    "novelty_weight": 0.4,
    "physics_feasibility_weight": 0.2,
    "breakthrough_potential_weight": 0.3,
    "testability_weight": 0.1,
    "risk_tolerance": "high - accepting uncertainty for novelty"
  },

  "concept_evaluations": [
    {
      "concept_id": "D-01",
      "concept_name": "Name",

      "novelty_assessment": {
        "genuinely_novel": true,
        "novelty_score": 9,
        "novelty_rationale": "Why this is/isn't novel",
        "conventional_trap_check": "Is this conventional in disguise? No because...",
        "prior_art_check": "Has this been tried? If so, what's different?"
      },

      "physics_assessment": {
        "physics_valid": true,
        "physics_score": 7,
        "governing_physics": "What physics applies",
        "feasibility_rationale": "Why this should/shouldn't work",
        "key_uncertainties": ["Uncertainty 1", "Uncertainty 2"],
        "kill_flags": []
      },

      "breakthrough_assessment": {
        "breakthrough_potential": "transformative|significant|moderate|incremental",
        "breakthrough_score": 8,
        "if_works": "What this achieves if successful",
        "comparison_to_conventional": "How much better than industry standard",
        "industry_disruption_potential": "How this changes the field"
      },

      "testability_assessment": {
        "testable": true,
        "testability_score": 7,
        "first_test": "Cheapest/fastest validation",
        "test_cost_estimate": "$X and Y weeks",
        "go_no_go_clarity": "How clear is success/failure?"
      },

      "overall_evaluation": {
        "pursue": true,
        "priority": "high|medium|low",
        "composite_score": 8.2,
        "rationale": "Why to pursue/not pursue",
        "key_strength": "Primary reason to pursue",
        "key_risk": "Primary risk to manage",
        "recommendation": "Specific next action"
      }
    }
  ],

  "comparative_ranking": {
    "by_novelty": ["D-01", "D-05", "D-03"],
    "by_physics_confidence": ["D-02", "D-04", "D-01"],
    "by_breakthrough_potential": ["D-01", "D-03", "D-05"],
    "by_testability": ["D-04", "D-02", "D-01"],
    "overall_ranking": ["D-01", "D-03", "D-05", "D-02", "D-04"]
  },

  "rejected_concepts": [
    {
      "concept_id": "D-06",
      "rejection_reason": "conventional_disguise|physics_violation|low_novelty",
      "explanation": "Why this was rejected"
    }
  ],

  "discovery_portfolio": {
    "must_pursue": ["D-01"],
    "should_explore": ["D-03", "D-05"],
    "worth_investigating": ["D-02"],
    "park_for_later": ["D-04"],

    "portfolio_rationale": "Why this combination maximizes discovery potential",
    "diversity_check": "Do we have concepts from different domains?",
    "risk_balance": "Balance of risk levels across portfolio"
  },

  "validation_roadmap": {
    "phase_1_quick_kills": {
      "tests": ["Test to quickly eliminate physics violations"],
      "concepts_tested": ["D-01", "D-03"],
      "timeline": "1-2 weeks",
      "cost": "$X"
    },
    "phase_2_deep_validation": {
      "tests": ["Deeper physics validation for survivors"],
      "concepts_tested": ["Survivors from phase 1"],
      "timeline": "2-4 weeks",
      "cost": "$Y"
    },
    "phase_3_prototype": {
      "approach": "Build minimal prototype of top concept",
      "timeline": "4-8 weeks",
      "cost": "$Z"
    }
  },

  "evaluation_summary": {
    "total_concepts_evaluated": 6,
    "concepts_to_pursue": 3,
    "concepts_rejected": 2,
    "concepts_parked": 1,
    "highest_potential_concept": "D-01",
    "most_testable_concept": "D-04",
    "biggest_surprise": "Unexpected finding from evaluation",
    "key_insight": "Most important learning from evaluation"
  }
}

REMEMBER: Output ONLY the JSON object. NOVELTY is the primary criterion. Accept risk for breakthrough potential.`;

/**
 * Zod schema for AN4-D output validation
 */
const NoveltyAssessmentSchema = z.object({
  genuinely_novel: z.boolean(),
  novelty_score: z.number().min(1).max(10),
  novelty_rationale: z.string(),
  conventional_trap_check: z.string(),
  prior_art_check: z.string(),
});

const PhysicsAssessmentSchema = z.object({
  physics_valid: z.boolean(),
  physics_score: z.number().min(1).max(10),
  governing_physics: z.string(),
  feasibility_rationale: z.string(),
  key_uncertainties: z.array(z.string()),
  kill_flags: z.array(z.string()),
});

const BreakthroughAssessmentSchema = z.object({
  breakthrough_potential: z.enum([
    'transformative',
    'significant',
    'moderate',
    'incremental',
  ]),
  breakthrough_score: z.number().min(1).max(10),
  if_works: z.string(),
  comparison_to_conventional: z.string(),
  industry_disruption_potential: z.string(),
});

const TestabilityAssessmentSchema = z.object({
  testable: z.boolean(),
  testability_score: z.number().min(1).max(10),
  first_test: z.string(),
  test_cost_estimate: z.string(),
  go_no_go_clarity: z.string(),
});

const OverallEvaluationSchema = z.object({
  pursue: z.boolean(),
  priority: z.enum(['high', 'medium', 'low']),
  composite_score: z.number(),
  rationale: z.string(),
  key_strength: z.string(),
  key_risk: z.string(),
  recommendation: z.string(),
});

const ConceptEvaluationSchema = z.object({
  concept_id: z.string(),
  concept_name: z.string(),
  novelty_assessment: NoveltyAssessmentSchema,
  physics_assessment: PhysicsAssessmentSchema,
  breakthrough_assessment: BreakthroughAssessmentSchema,
  testability_assessment: TestabilityAssessmentSchema,
  overall_evaluation: OverallEvaluationSchema,
});

const RejectedConceptSchema = z.object({
  concept_id: z.string(),
  rejection_reason: z.enum([
    'conventional_disguise',
    'physics_violation',
    'low_novelty',
  ]),
  explanation: z.string(),
});

const ValidationPhaseSchema = z.object({
  tests: z.array(z.string()).optional(),
  approach: z.string().optional(),
  concepts_tested: z.array(z.string()).optional(),
  timeline: z.string(),
  cost: z.string(),
});

export const AN4_D_OutputSchema = z.object({
  evaluation_philosophy: z.object({
    novelty_weight: z.number(),
    physics_feasibility_weight: z.number(),
    breakthrough_potential_weight: z.number(),
    testability_weight: z.number(),
    risk_tolerance: z.string(),
  }),
  concept_evaluations: z.array(ConceptEvaluationSchema),
  comparative_ranking: z.object({
    by_novelty: z.array(z.string()),
    by_physics_confidence: z.array(z.string()),
    by_breakthrough_potential: z.array(z.string()),
    by_testability: z.array(z.string()),
    overall_ranking: z.array(z.string()),
  }),
  rejected_concepts: z.array(RejectedConceptSchema),
  discovery_portfolio: z.object({
    must_pursue: z.array(z.string()),
    should_explore: z.array(z.string()),
    worth_investigating: z.array(z.string()),
    park_for_later: z.array(z.string()),
    portfolio_rationale: z.string(),
    diversity_check: z.string(),
    risk_balance: z.string(),
  }),
  validation_roadmap: z.object({
    phase_1_quick_kills: ValidationPhaseSchema,
    phase_2_deep_validation: ValidationPhaseSchema,
    phase_3_prototype: ValidationPhaseSchema,
  }),
  evaluation_summary: z.object({
    total_concepts_evaluated: z.number(),
    concepts_to_pursue: z.number(),
    concepts_rejected: z.number(),
    concepts_parked: z.number(),
    highest_potential_concept: z.string(),
    most_testable_concept: z.string(),
    biggest_surprise: z.string(),
    key_insight: z.string(),
  }),
});

export type AN4_D_Output = z.infer<typeof AN4_D_OutputSchema>;

/**
 * AN4-D metadata for progress tracking
 */
export const AN4_D_METADATA = {
  id: 'an4-d',
  name: 'Discovery Evaluation',
  description: 'Novelty-first evaluation of discovery concepts',
  estimatedMinutes: 3,
};
