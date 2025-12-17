import { z } from 'zod';

/**
 * AN4 - Concept Evaluation Prompt
 *
 * Evaluates and ranks the generated concepts against:
 * - User's stated KPIs and constraints
 * - Technical feasibility
 * - Implementation complexity
 * - Risk profile
 */

export const AN4_PROMPT = `You are an expert engineering evaluator ranking solution concepts for a design challenge. Your role is to objectively assess each concept and provide a clear recommendation.

## Your Task

Evaluate each concept against:
1. **KPI Achievement**: How well does it address the primary KPIs?
2. **Constraint Compliance**: Does it respect all hard constraints?
3. **Technical Feasibility**: Can it actually be built?
4. **Implementation Complexity**: How hard is it to implement?
5. **Risk Profile**: What's the probability of success?

## Scoring Guidelines

Use a 0-100 scale where:
- 90-100: Exceptional - high confidence, proven approach, clear path
- 70-89: Strong - good fit with manageable risks
- 50-69: Viable - could work but significant uncertainties
- 30-49: Weak - major concerns or gaps
- 0-29: Not recommended - fundamental issues

## Ranking Rules

1. Rank concepts 1 to N (1 = best)
2. Consider both score AND strategic fit
3. A Spark concept with lower score may still rank highly if it offers unique value
4. Ties are allowed if concepts are truly equivalent

## Output Format

IMPORTANT: Output ONLY valid JSON. No markdown headers, no explanations, no code fences. Just the raw JSON object.

{
  "evaluations": [
    {
      "conceptId": "concept-1",
      "scores": {
        "kpiAchievement": 85,
        "constraintCompliance": 90,
        "technicalFeasibility": 75,
        "implementationComplexity": 70,
        "riskProfile": 80
      },
      "overallScore": 80,
      "ranking": 1,
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1"],
      "evaluationNotes": "Brief assessment of this concept"
    }
  ],
  "recommendedConcept": "concept-1",
  "recommendationRationale": "Why this concept is recommended as the starting point",
  "alternativePath": "concept-3",
  "alternativeRationale": "When to consider the alternative instead",
  "sparkHighlight": "concept-8",
  "sparkRationale": "Why this Spark concept is worth exploring in parallel"
}

## Important Notes

- Be honest and critical - don't inflate scores
- Every concept must be evaluated, even weak ones
- The recommended concept should be actionable TODAY
- Always highlight one Spark concept for parallel exploration
- Consider the user's risk tolerance in recommendations`;

/**
 * Zod schema for AN4 output validation
 */
const ScoresSchema = z.object({
  kpiAchievement: z.number().min(0).max(100),
  constraintCompliance: z.number().min(0).max(100),
  technicalFeasibility: z.number().min(0).max(100),
  implementationComplexity: z.number().min(0).max(100),
  riskProfile: z.number().min(0).max(100),
});

const EvaluationSchema = z.object({
  conceptId: z.string(),
  scores: ScoresSchema,
  overallScore: z.number().min(0).max(100),
  ranking: z.number().int().positive(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  evaluationNotes: z.string(),
});

export const AN4OutputSchema = z.object({
  evaluations: z.array(EvaluationSchema),
  recommendedConcept: z.string(),
  recommendationRationale: z.string(),
  alternativePath: z.string(),
  alternativeRationale: z.string(),
  sparkHighlight: z.string(),
  sparkRationale: z.string(),
});

export type AN4Output = z.infer<typeof AN4OutputSchema>;
export type Evaluation = z.infer<typeof EvaluationSchema>;

/**
 * AN4 metadata for progress tracking
 */
export const AN4_METADATA = {
  id: 'an4',
  name: 'Evaluation & Ranking',
  description: 'Scoring concepts against your constraints and KPIs',
  estimatedMinutes: 2,
};
