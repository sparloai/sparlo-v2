import { z } from 'zod';

/**
 * AN1.5 - Teaching Example Selection (v10)
 *
 * Selects TEACHING EXAMPLES to guide innovative thinking.
 * Not building a database of answers - selecting EXEMPLARS that teach methodology.
 */

export const AN1_5_PROMPT = `You are selecting TEACHING EXAMPLES to guide innovative thinking.

CRITICAL: You must respond with ONLY valid JSON. No markdown, no text before or after. Start with { and end with }.

## Your Role

You're not building a database of answers. You're selecting EXEMPLARS that teach a way of thinking.

The downstream concept generation step will see these examples and learn:
- "This is how cross-domain thinking works"
- "This is what brilliant vs obvious TRIZ application looks like"
- "This is the caliber of innovation we're aiming for"

## What You Received

1. **TRIZ examples** - Showing obvious vs better principle applications
2. **Transfer cases** - Showing successful cross-domain innovations
3. **Failure patterns** - For later validation (select but don't over-emphasize)
4. **Bounds data** - For later validation (select but don't over-emphasize)

## Selection Criteria

### For TRIZ Examples (select 2-4 best)
Pick examples that:
- Match the suggested TRIZ principles
- Show a DRAMATIC difference between obvious and better application
- Have clear, transferable patterns
- Come from domains that might spark analogies

### For Transfer Cases (select 2-3 best)
Pick cases that:
- Demonstrate similar PHYSICS to the user's problem
- Show clear transfer logic that could be applied
- Have compelling "aha" insights
- Achieved significant results

### For Failure Patterns (select 3-5 relevant)
Pick patterns that:
- Could realistically occur in solutions to this problem
- Have actionable "check first" guidance
- Come from similar mechanisms

### For Bounds (select those directly relevant)
Pick bounds for:
- Materials the user mentioned
- Mechanisms they're likely to use
- Parameters critical to their KPIs

## Output Format

{
  "teaching_examples": {
    "triz_exemplars": [
      {
        "id": "TRIZ-XX-XX",
        "principle": {"number": 1, "name": "..."},
        "domain": "...",
        "the_challenge": "What problem they faced",
        "obvious_approach": "What most engineers would do",
        "brilliant_approach": "What the better solution was",
        "key_insight": "The transferable lesson",
        "pattern": "When you see [X], consider [Y] instead of [Z]",
        "why_selected": "Why this exemplar is perfect for this problem"
      }
    ],

    "transfer_exemplars": [
      {
        "id": "XFER-XXXX",
        "title": "...",
        "source_domain": "...",
        "target_domain": "...",
        "the_physics": "What physical principle transferred",
        "the_insight": "Why it worked across domains",
        "the_pattern": "When you see [X], look to [Y] domain",
        "why_selected": "Why this exemplar teaches relevant thinking"
      }
    ],

    "innovation_guidance": "2-3 sentences synthesizing what these exemplars teach about approaching THIS problem"
  },

  "validation_data": {
    "failure_patterns": [
      {
        "id": "FAIL-XXXX",
        "pattern_name": "...",
        "mechanism_type": "...",
        "what_fails": "...",
        "root_cause": "...",
        "check_first": "...",
        "relevance": "Why this might apply to solutions for this problem"
      }
    ],

    "parameter_bounds": [
      {
        "id": "BOUND-XXXX",
        "parameter": "...",
        "material_or_mechanism": "...",
        "commercial_range": {"min": "...", "max": "...", "unit": "..."},
        "gotchas": ["..."],
        "relevance": "Why this bound matters for this problem"
      }
    ]
  },

  "corpus_gaps": ["What relevant teaching examples or validation data wasn't found"]
}

REMEMBER: Quality over quantity. A few brilliant exemplars beat many mediocre ones.`;

/**
 * Zod schema for AN1.5 output validation (v10)
 */
const TrizExemplarSchema = z.object({
  id: z.string(),
  principle: z.object({
    number: z.number().int().min(1).max(40),
    name: z.string(),
  }),
  domain: z.string(),
  the_challenge: z.string(),
  obvious_approach: z.string(),
  brilliant_approach: z.string(),
  key_insight: z.string(),
  pattern: z.string(),
  why_selected: z.string(),
});

const TransferExemplarSchema = z.object({
  id: z.string(),
  title: z.string(),
  source_domain: z.string(),
  target_domain: z.string(),
  the_physics: z.string(),
  the_insight: z.string(),
  the_pattern: z.string(),
  why_selected: z.string(),
});

const FailurePatternSchema = z.object({
  id: z.string(),
  pattern_name: z.string(),
  mechanism_type: z.string(),
  what_fails: z.string(),
  root_cause: z.string(),
  check_first: z.string(),
  relevance: z.string(),
});

const ParameterBoundSchema = z.object({
  id: z.string(),
  parameter: z.string(),
  material_or_mechanism: z.string(),
  commercial_range: z.object({
    min: z.string(),
    max: z.string(),
    unit: z.string(),
  }),
  gotchas: z.array(z.string()),
  relevance: z.string(),
});

export const AN1_5_OutputSchema = z.object({
  teaching_examples: z.object({
    triz_exemplars: z.array(TrizExemplarSchema),
    transfer_exemplars: z.array(TransferExemplarSchema),
    innovation_guidance: z.string(),
  }),
  validation_data: z.object({
    failure_patterns: z.array(FailurePatternSchema),
    parameter_bounds: z.array(ParameterBoundSchema),
  }),
  corpus_gaps: z.array(z.string()),
});

export type AN1_5_Output = z.infer<typeof AN1_5_OutputSchema>;

/**
 * AN1.5 metadata for progress tracking
 */
export const AN1_5_METADATA = {
  id: 'an1.5',
  name: 'Teaching Selection',
  description: 'Selecting exemplars to guide innovative thinking',
  estimatedMinutes: 1.5,
};
