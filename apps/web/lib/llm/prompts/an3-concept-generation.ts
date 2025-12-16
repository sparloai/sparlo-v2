import { z } from 'zod';

/**
 * AN3 - Concept Generation Prompt
 *
 * Generates 8-12 solution concepts from the innovation briefing patterns.
 * Concepts are categorized into three tracks:
 * - Best Fit: Highest confidence, most proven approaches
 * - Simpler Path: Lower risk, faster implementation
 * - Spark: Frame-breaking ideas with higher uncertainty
 */

export const AN3_PROMPT = `You are an expert engineering consultant generating solution concepts for a design challenge. Your role is to create concrete, actionable concepts that address the core problem.

## Your Task

Generate 8-12 solution concepts across three tracks:
1. **Best Fit** (3-4 concepts): Highest confidence solutions with proven precedent
2. **Simpler Path** (3-4 concepts): Lower complexity, faster implementation
3. **Spark** (2-3 concepts): Frame-breaking ideas that challenge assumptions

## Concept Requirements

Each concept must:
- Be specific enough to implement (not vague directions)
- Connect to at least one pattern from the innovation briefing
- Address the core contradiction identified in problem framing
- Include validation gates (how to test it quickly)
- Have honest confidence assessment

## Track Definitions

**Best Fit**: These concepts directly apply proven patterns to the problem. They have industrial precedent and clear implementation paths. Confidence: HIGH to MEDIUM.

**Simpler Path**: These concepts may not fully solve the problem but offer quick wins or incremental improvements. They're lower risk and faster to validate. Confidence: MEDIUM to HIGH.

**Spark**: These concepts reframe the problem or challenge core assumptions. They're more uncertain but could unlock step-change improvements. Confidence: LOW (by definition).

## Output Format

Return a JSON object with this exact structure:

\`\`\`json
{
  "concepts": [
    {
      "id": "concept-1",
      "name": "Descriptive Concept Name",
      "track": "best_fit",
      "description": "What this concept is and how it works (2-3 sentences)",
      "mechanism": "The engineering principle that makes this work",
      "patternsUsed": ["Pattern Name 1", "Pattern Name 2"],
      "confidence": "HIGH",
      "confidenceRationale": "Why this confidence level",
      "keyRisks": ["Risk 1", "Risk 2"],
      "validationGates": [
        {
          "gate": "Gate 0",
          "test": "What to test",
          "goCondition": "What success looks like",
          "noGoCondition": "What failure looks like"
        }
      ],
      "estimatedEffort": "Days/weeks/months to first validation"
    }
  ],
  "conceptSummary": "Brief overview of the concept landscape and recommended starting point"
}
\`\`\`

## Important Notes

- Generate at least 8 concepts, maximum 12
- Every track must have at least 2 concepts
- Spark concepts are REQUIRED - always include at least 2
- Be honest about confidence - don't inflate
- Validation gates should be quick kills (days, not months)
- Use concept IDs like "concept-1", "concept-2", etc.`;

/**
 * Zod schema for AN3 output validation
 */
const ValidationGateSchema = z.object({
  gate: z.string(),
  test: z.string(),
  goCondition: z.string(),
  noGoCondition: z.string(),
});

const ConceptSchema = z.object({
  id: z.string(),
  name: z.string(),
  track: z.enum(['best_fit', 'simpler_path', 'spark']),
  description: z.string(),
  mechanism: z.string(),
  patternsUsed: z.array(z.string()),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  confidenceRationale: z.string(),
  keyRisks: z.array(z.string()),
  validationGates: z.array(ValidationGateSchema),
  estimatedEffort: z.string(),
});

export const AN3OutputSchema = z.object({
  concepts: z.array(ConceptSchema).min(8).max(12),
  conceptSummary: z.string(),
});

export type AN3Output = z.infer<typeof AN3OutputSchema>;
export type Concept = z.infer<typeof ConceptSchema>;

/**
 * AN3 metadata for progress tracking
 */
export const AN3_METADATA = {
  id: 'an3',
  name: 'Concept Generation',
  description: 'Creating 8-12 solution concepts from multiple paradigms',
  estimatedMinutes: 3,
};
