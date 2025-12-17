import { z } from 'zod';

/**
 * AN1.7 - Literature Augmentation (v10)
 *
 * Augments the innovation process with literature validation.
 * Searches for commercial precedent, process parameters, and competitive intelligence.
 */

export const AN1_7_PROMPT = `You augment the innovation process with literature validation.

CRITICAL: You must respond with ONLY valid JSON. No markdown, no text before or after. Start with { and end with }.

## Your Role

Search literature to:
1. Find commercial precedent for approaches being considered
2. Identify process parameters that might not be in the bounds corpus
3. Discover who's working on similar problems (competitive intelligence)

## Search Strategy

### Patent Searches (highest value)
- "[mechanism] patent [major company]"
- "[approach] [domain] patent"

### Commercial Validation
- "[method] industrial scale"
- "[approach] commercial production"

### Academic (with quality filters)
- "[mechanism] review" (review papers)
- "[approach] pilot scale"

## Output Format

{
  "searches_performed": ["query1", "query2"],

  "commercial_precedent": [
    {
      "approach": "...",
      "who_uses_it": ["Company1", "Company2"],
      "source": "...",
      "parameters_reported": [{"param": "...", "value": "...", "source": "..."}],
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],

  "process_parameters": [
    {
      "parameter": "...",
      "typical_range": "...",
      "source": "...",
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],

  "competitive_landscape": "Brief summary of who's working on what",

  "literature_gaps": ["What couldn't be validated"]
}

REMEMBER: Cite specific sources. No invented parameters.`;

/**
 * Zod schema for AN1.7 output validation (v10)
 */
const ParameterReportedSchema = z.object({
  param: z.string(),
  value: z.string(),
  source: z.string(),
});

const CommercialPrecedentSchema = z.object({
  approach: z.string(),
  who_uses_it: z.array(z.string()),
  source: z.string(),
  parameters_reported: z.array(ParameterReportedSchema),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

const ProcessParameterSchema = z.object({
  parameter: z.string(),
  typical_range: z.string(),
  source: z.string(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

export const AN1_7_OutputSchema = z.object({
  searches_performed: z.array(z.string()),
  commercial_precedent: z.array(CommercialPrecedentSchema),
  process_parameters: z.array(ProcessParameterSchema),
  competitive_landscape: z.string(),
  literature_gaps: z.array(z.string()),
});

export type AN1_7_Output = z.infer<typeof AN1_7_OutputSchema>;

/**
 * AN1.7 metadata for progress tracking
 */
export const AN1_7_METADATA = {
  id: 'an1.7',
  name: 'Literature Augmentation',
  description: 'Validating with commercial precedent and parameters',
  estimatedMinutes: 2,
};
