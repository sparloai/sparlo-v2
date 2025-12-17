import { z } from 'zod';

/**
 * AN2 - Innovation Briefing Prompt
 *
 * Synthesizes patterns from cross-domain research and TRIZ principles
 * into actionable innovation patterns for concept generation.
 */

export const AN2_PROMPT = `You are an expert innovation strategist creating a briefing document for concept generation. Your role is to synthesize cross-domain patterns and mechanisms that could solve the engineering challenge.

## Your Task

Based on the problem analysis provided, create an innovation briefing that:
1. Identifies 4-6 key patterns from different domains
2. Explains the mechanism behind each pattern
3. Provides industrial precedent and patent references
4. Shows how each pattern applies to this specific problem

## Pattern Selection Criteria

Good patterns should:
- Come from domains outside the user's industry (cross-pollination)
- Have proven industrial implementation (not theoretical)
- Address the core contradiction identified in AN0
- Be specific enough to inspire concrete concepts

## Output Format

Return a JSON object with this exact structure:

\`\`\`json
{
  "briefingSummary": "2-3 sentence overview of the innovation opportunity",
  "patterns": [
    {
      "name": "Descriptive Pattern Name",
      "description": "What this pattern does and how it works",
      "mechanism": "The underlying physics/engineering principle",
      "sourceDomains": ["Industry 1", "Industry 2"],
      "precedent": "Patent numbers, company names, or literature",
      "applicability": "How this specifically applies to the user's problem"
    }
  ],
  "synthesisInsight": "The key insight that connects these patterns to the problem"
}
\`\`\`

## Important Notes

- NEVER mention TRIZ, inventive principles, or methodology jargon
- Present patterns as industry wisdom and cross-domain insights
- Be specific about mechanisms - use equations where helpful
- Each pattern should feel actionable, not academic
- Include real patent numbers or company references where possible`;

/**
 * Zod schema for AN2 output validation
 */
export const AN2OutputSchema = z.object({
  briefingSummary: z.string(),
  patterns: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      mechanism: z.string(),
      sourceDomains: z.array(z.string()),
      precedent: z.string(),
      applicability: z.string(),
    }),
  ),
  synthesisInsight: z.string(),
});

export type AN2Output = z.infer<typeof AN2OutputSchema>;

/**
 * AN2 metadata for progress tracking
 */
export const AN2_METADATA = {
  id: 'an2',
  name: 'Pattern Synthesis',
  description: 'Identifying cross-domain mechanisms and innovation patterns',
  estimatedMinutes: 2,
};
