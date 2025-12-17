import { z } from 'zod';

/**
 * AN4 - Evaluation & Validation (v10)
 *
 * Validates concepts against hard constraints and failure patterns.
 * Uses a gating system - concepts that fail hard validation are flagged.
 * Evaluates remaining concepts for strategic recommendation.
 */

export const AN4_PROMPT = `You are validating and evaluating engineering concepts against HARD CONSTRAINTS and FAILURE PATTERNS.

CRITICAL: You must respond with ONLY valid JSON. No markdown, no text before or after. Start with { and end with }.

## Your Role

You received:
1. Generated concepts (from AN3)
2. Design constraints including failure modes and parameter limits
3. Innovation briefing with physics and first principles

Your job is to:
1. **HARD VALIDATION** - Check each concept against bounds and failure patterns
2. **GO/NO-GO GATES** - Flag concepts that violate hard constraints
3. **STRATEGIC EVALUATION** - Rank concepts that pass validation
4. **RECOMMENDATION** - Identify the best path forward

## Hard Validation Gates

### Gate 1: Bounds Compliance
Check each concept against parameter_limits from the briefing:
- PASS: All parameters within limits
- CONCERN: Some parameters near limits (>80% of limit)
- FAIL: Any parameter exceeds hard limits

### Gate 2: Failure Mode Risk
Check each concept against failure_modes_to_prevent:
- PASS: Design explicitly addresses failure modes
- CONCERN: Failure modes possible but mitigatable
- FAIL: Design inherently triggers known failure mode

### Gate 3: Physics Compliance
Verify the concept's working principle against physics_of_problem:
- PASS: Mechanism is physically sound
- CONCERN: Relies on assumptions that need validation
- FAIL: Violates physics or contradicts governing principles

## Evaluation Criteria (for concepts that pass gates)

1. **Expected Impact** - How well does it address primary KPIs?
2. **Feasibility** - Can it actually be built (manufacturing, materials)?
3. **Validation Path** - How quickly can we validate/invalidate?
4. **Risk Profile** - What's the downside if it doesn't work?
5. **Innovation Value** - Does it unlock future possibilities?

## Output Format

{
  "validation_results": [
    {
      "concept_id": "C-01",
      "concept_title": "...",
      "track": "simpler_path|best_fit|spark",

      "hard_gates": {
        "bounds_compliance": {
          "status": "PASS|CONCERN|FAIL",
          "violations": [
            {"parameter": "...", "proposed": "...", "limit": "...", "severity": "warning|critical"}
          ],
          "notes": "..."
        },
        "failure_mode_risk": {
          "status": "PASS|CONCERN|FAIL",
          "risks_identified": [
            {"failure": "...", "likelihood": "LOW|MEDIUM|HIGH", "mitigation_possible": true}
          ],
          "notes": "..."
        },
        "physics_compliance": {
          "status": "PASS|CONCERN|FAIL",
          "concerns": ["..."],
          "notes": "..."
        },
        "overall_gate": "PASS|CONDITIONAL|FAIL"
      },

      "evaluation": {
        "expected_impact": {"score": 1-10, "rationale": "..."},
        "feasibility": {"score": 1-10, "rationale": "..."},
        "validation_speed": {"score": 1-10, "rationale": "..."},
        "risk_profile": {"score": 1-10, "rationale": "..."},
        "innovation_value": {"score": 1-10, "rationale": "..."},
        "overall_score": 1-100
      },

      "critical_assumptions": ["Assumptions that must hold for this to work"],
      "first_validation_step": "What to test first to de-risk"
    }
  ],

  "gate_summary": {
    "passed": ["C-01", "C-02"],
    "conditional": ["C-03"],
    "failed": ["C-04"],
    "failure_reasons": [
      {"concept_id": "C-04", "reason": "Why it failed hard validation"}
    ]
  },

  "rankings": {
    "by_track": {
      "simpler_path": [{"concept_id": "...", "rank": 1, "why": "..."}],
      "best_fit": [{"concept_id": "...", "rank": 1, "why": "..."}],
      "spark": [{"concept_id": "...", "rank": 1, "why": "..."}]
    },
    "overall": [
      {"concept_id": "...", "rank": 1, "score": 85, "one_liner": "..."}
    ]
  },

  "recommendation": {
    "primary": {
      "concept_id": "...",
      "title": "...",
      "why_this_one": "Detailed rationale for primary recommendation",
      "next_steps": ["Immediate action 1", "Immediate action 2"],
      "key_risk": "The main thing that could go wrong",
      "de_risk_plan": "How to validate quickly"
    },
    "parallel_spark": {
      "concept_id": "...",
      "title": "...",
      "why_explore": "Why this deserves parallel exploration",
      "validation_approach": "How to test without big investment"
    },
    "fallback": {
      "concept_id": "...",
      "title": "...",
      "when_to_use": "Conditions that would make this the better choice"
    }
  },

  "validation_plan": {
    "critical_experiments": [
      {
        "name": "...",
        "tests_assumption": "What this validates",
        "method": "How to run it",
        "success_criteria": "What success looks like",
        "estimated_effort": "Hours/days/weeks"
      }
    ],
    "kill_conditions": ["What would kill the primary recommendation"],
    "pivot_triggers": ["What would trigger switch to fallback"]
  }
}

REMEMBER:
- Hard validation comes FIRST - don't evaluate concepts that fail gates
- Be honest about concerns - better to flag issues now than during implementation
- First principles concepts deserve fair evaluation even if unconventional
- Spark concepts can be recommended even with lower scores if innovation value is high
- The goal is actionable guidance, not just rankings`;

/**
 * Zod schema for AN4 output validation (v10)
 */
const BoundsViolationSchema = z.object({
  parameter: z.string(),
  proposed: z.string(),
  limit: z.string(),
  severity: z.enum(['warning', 'critical']),
});

const BoundsComplianceSchema = z.object({
  status: z.enum(['PASS', 'CONCERN', 'FAIL']),
  violations: z.array(BoundsViolationSchema),
  notes: z.string(),
});

const FailureRiskSchema = z.object({
  failure: z.string(),
  likelihood: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  mitigation_possible: z.boolean(),
});

const FailureModeRiskSchema = z.object({
  status: z.enum(['PASS', 'CONCERN', 'FAIL']),
  risks_identified: z.array(FailureRiskSchema),
  notes: z.string(),
});

const PhysicsComplianceSchema = z.object({
  status: z.enum(['PASS', 'CONCERN', 'FAIL']),
  concerns: z.array(z.string()),
  notes: z.string(),
});

const HardGatesSchema = z.object({
  bounds_compliance: BoundsComplianceSchema,
  failure_mode_risk: FailureModeRiskSchema,
  physics_compliance: PhysicsComplianceSchema,
  overall_gate: z.enum(['PASS', 'CONDITIONAL', 'FAIL']),
});

const ScoreWithRationaleSchema = z.object({
  score: z.number().int().min(1).max(10),
  rationale: z.string(),
});

const EvaluationScoresSchema = z.object({
  expected_impact: ScoreWithRationaleSchema,
  feasibility: ScoreWithRationaleSchema,
  validation_speed: ScoreWithRationaleSchema,
  risk_profile: ScoreWithRationaleSchema,
  innovation_value: ScoreWithRationaleSchema,
  overall_score: z.number().int().min(1).max(100),
});

const ValidationResultSchema = z.object({
  concept_id: z.string(),
  concept_title: z.string(),
  track: z.enum(['simpler_path', 'best_fit', 'spark']),
  hard_gates: HardGatesSchema,
  evaluation: EvaluationScoresSchema,
  critical_assumptions: z.array(z.string()),
  first_validation_step: z.string(),
});

const FailureReasonSchema = z.object({
  concept_id: z.string(),
  reason: z.string(),
});

const GateSummarySchema = z.object({
  passed: z.array(z.string()),
  conditional: z.array(z.string()),
  failed: z.array(z.string()),
  failure_reasons: z.array(FailureReasonSchema),
});

const RankingEntrySchema = z.object({
  concept_id: z.string(),
  rank: z.number().int().positive(),
  why: z.string(),
});

const OverallRankingSchema = z.object({
  concept_id: z.string(),
  rank: z.number().int().positive(),
  score: z.number().int().min(1).max(100),
  one_liner: z.string(),
});

const RankingsSchema = z.object({
  by_track: z.object({
    simpler_path: z.array(RankingEntrySchema),
    best_fit: z.array(RankingEntrySchema),
    spark: z.array(RankingEntrySchema),
  }),
  overall: z.array(OverallRankingSchema),
});

const PrimaryRecommendationSchema = z.object({
  concept_id: z.string(),
  title: z.string(),
  why_this_one: z.string(),
  next_steps: z.array(z.string()),
  key_risk: z.string(),
  de_risk_plan: z.string(),
});

const SparkRecommendationSchema = z.object({
  concept_id: z.string(),
  title: z.string(),
  why_explore: z.string(),
  validation_approach: z.string(),
});

const FallbackRecommendationSchema = z.object({
  concept_id: z.string(),
  title: z.string(),
  when_to_use: z.string(),
});

const RecommendationSchema = z.object({
  primary: PrimaryRecommendationSchema,
  parallel_spark: SparkRecommendationSchema,
  fallback: FallbackRecommendationSchema,
});

const CriticalExperimentSchema = z.object({
  name: z.string(),
  tests_assumption: z.string(),
  method: z.string(),
  success_criteria: z.string(),
  estimated_effort: z.string(),
});

const ValidationPlanSchema = z.object({
  critical_experiments: z.array(CriticalExperimentSchema),
  kill_conditions: z.array(z.string()),
  pivot_triggers: z.array(z.string()),
});

export const AN4OutputSchema = z.object({
  validation_results: z.array(ValidationResultSchema),
  gate_summary: GateSummarySchema,
  rankings: RankingsSchema,
  recommendation: RecommendationSchema,
  validation_plan: ValidationPlanSchema,
});

export type AN4Output = z.infer<typeof AN4OutputSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

/**
 * AN4 metadata for progress tracking
 */
export const AN4_METADATA = {
  id: 'an4',
  name: 'Evaluation & Validation',
  description: 'Validating concepts against hard constraints and ranking',
  estimatedMinutes: 2,
};
