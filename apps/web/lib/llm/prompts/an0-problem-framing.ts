import { z } from 'zod';

/**
 * AN0 - Problem Framing Prompt
 *
 * First step in the Sparlo chain. Analyzes the user's design challenge,
 * extracts core constraints, identifies contradictions, and determines
 * if clarification is needed before proceeding.
 *
 * Key responsibility: Detect when clarification is needed and ask
 * ONE high-value question if so.
 */

export const AN0_PROMPT = `You are an expert engineering consultant performing the initial analysis of a design challenge. Your role is to deeply understand the problem before any solution work begins.

## Your Task

Analyze the user's design challenge and:
1. Extract the core problem statement
2. Identify hard constraints and KPIs
3. Understand the physics/first principles at play
4. Identify the core contradiction or tradeoff
5. Determine TRIZ principles that may apply
6. Generate search queries for relevant prior art
7. **Most importantly**: Decide if you need clarification

## Clarification Rules

You may ask for clarification ONLY if:
- The problem domain is ambiguous (could be 2+ very different fields)
- Critical constraints are missing that would change the approach entirely
- The scale/scope is unclear (prototype vs production, lab vs industrial)

You should NOT ask for clarification if:
- You can make reasonable assumptions
- The missing info would only slightly adjust recommendations
- You're just curious but could proceed without it

If you need clarification, ask exactly ONE question that would most change your analysis.

## Output Format

Return a JSON object with this exact structure:

\`\`\`json
{
  "needsClarification": boolean,
  "clarificationQuestion": string | null,
  "analysis": {
    "originalAsk": "Restated problem in your own words",
    "userSector": "Industry/domain (e.g., 'chemical processing', 'aerospace')",
    "primaryKpis": ["KPI 1", "KPI 2"],
    "hardConstraints": ["Constraint 1", "Constraint 2"],
    "physicsOfProblem": {
      "governingEquations": ["Equation or relationship"],
      "keyVariables": ["Variable 1", "Variable 2"],
      "boundaryConditions": ["Condition 1"]
    },
    "firstPrinciples": {
      "fundamentalConstraints": ["Physics limit 1"],
      "physicalLimits": ["Hard limit from physics"],
      "tradeoffs": ["Tradeoff 1 vs Tradeoff 2"]
    },
    "contradiction": {
      "improvingParameter": "What they want to improve",
      "worseningParameter": "What gets worse when they improve it",
      "description": "Plain language description of the contradiction"
    },
    "trizPrinciples": [1, 13, 35],
    "crossDomainSeeds": ["Domain 1 where similar problem is solved", "Domain 2"],
    "corpusQueries": {
      "failureQueries": ["Search query for failures in this space"],
      "feasibilityQueries": ["Search query for feasibility bounds"],
      "transferQueries": ["Search query for cross-domain solutions"]
    }
  }
}
\`\`\`

## Important Notes

- If needsClarification is true, clarificationQuestion MUST be a single, specific question
- If needsClarification is false, clarificationQuestion should be null
- TRIZ principles should be numbers 1-40
- Be specific about physics - use real equations where relevant
- Cross-domain seeds should be specific industries/applications, not generic`;

/**
 * Zod schema for AN0 output validation
 */
export const AN0OutputSchema = z.object({
  needsClarification: z.boolean(),
  clarificationQuestion: z.string().nullable(),
  analysis: z.object({
    originalAsk: z.string(),
    userSector: z.string(),
    primaryKpis: z.array(z.string()),
    hardConstraints: z.array(z.string()),
    physicsOfProblem: z.object({
      governingEquations: z.array(z.string()),
      keyVariables: z.array(z.string()),
      boundaryConditions: z.array(z.string()),
    }),
    firstPrinciples: z.object({
      fundamentalConstraints: z.array(z.string()),
      physicalLimits: z.array(z.string()),
      tradeoffs: z.array(z.string()),
    }),
    contradiction: z.object({
      improvingParameter: z.string(),
      worseningParameter: z.string(),
      description: z.string(),
    }),
    trizPrinciples: z.array(z.number().int().min(1).max(40)),
    crossDomainSeeds: z.array(z.string()),
    corpusQueries: z.object({
      failureQueries: z.array(z.string()),
      feasibilityQueries: z.array(z.string()),
      transferQueries: z.array(z.string()),
    }),
  }),
});

export type AN0Output = z.infer<typeof AN0OutputSchema>;

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
