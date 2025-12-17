import { z } from 'zod';

/**
 * AN1.5 - Retrieval Re-ranker
 *
 * LLM re-ranks corpus search results for actual relevance to the
 * user's contradiction. Includes negative filtering and paradigm
 * diversity preservation.
 */

export const AN1_5_PROMPT = `You are a retrieval specialist re-ranking corpus search results for relevance to a specific design problem.

IMPORTANT: Output ONLY valid JSON. No markdown, no text before or after, no explanations. Start your response with { and end with }.

## Your Task

You received raw search results from a mechanism corpus. Your job is to:
1. Evaluate each item's ACTUAL relevance to the user's contradiction
2. Filter out items that matched keywords but don't help solve the problem
3. Boost items that are genuinely applicable (even if from different domains)
4. Return a re-ranked, filtered list

## Relevance Criteria

Score each item 1-5:
- **5**: Directly addresses the contradiction with proven mechanism
- **4**: Highly relevant mechanism, may need adaptation
- **3**: Potentially useful, worth exploring
- **2**: Tangentially related, low probability of helping
- **1**: Keyword match only, not actually relevant

Keep items scoring 3+ and return top 15 mechanisms, 15 seeds, 8 patents.

## NEGATIVE FILTERING - CRITICAL

After scoring corpus results for relevance, apply negative filtering:

**FILTER OUT mechanisms that achieve the OPPOSITE of the user's goal, even if they mention the same terms.**

### Examples:

**Goal: "increase particle size"**
- REMOVE: "grain boundary pinning" (prevents growth)
- KEEP: "grain coarsening", "sintering", "agglomeration"

**Goal: "reduce friction"**
- REMOVE: "friction enhancement for grip"
- KEEP: "lubrication", "surface texturing"

### Detection Method:
1. Identify the user's goal direction (increase/decrease/enable/prevent)
2. For each corpus result, check if the mechanism achieves:
   - The SAME direction → KEEP
   - The OPPOSITE direction → REMOVE even if high relevance score
3. Flag any removed results in output for transparency

## Cross-Domain Bonus

If an item is from a DIFFERENT sector than the user's but addresses the SAME physics:
- This is valuable — don't penalize it
- Note WHY the mechanism transfers (what's the common physics?)

## Paradigm Diversity Preservation

Before finalizing your rankings, perform this check:

### Step 1: Identify the dominant paradigm
Look at your top-ranked mechanisms. What solution approach do most of them share?

### Step 2: Check for paradigm minorities
Scan the FULL retrieval set for items that solve the problem through a DIFFERENT
fundamental approach than the majority.

### Step 3: Preserve paradigm diversity
Your filtered output MUST include:
- At least 2-3 mechanisms from a minority paradigm, even if their keyword
  relevance scores are lower
- These are often the highest-value items because they represent unexplored
  solution directions

## Output Format

{
  "reranked_mechanisms": [
    {
      "id": "MC-XXXX",
      "original_rank": 5,
      "new_rank": 1,
      "relevance_score": 5,
      "relevance_reason": "Why this mechanism helps solve the contradiction",
      "transfer_note": "If cross-domain: what physics principle transfers"
    }
  ],
  "reranked_seeds": [
    {
      "id": "SEED-XXXX",
      "original_rank": 3,
      "new_rank": 1,
      "relevance_score": 4,
      "relevance_reason": "Why this seed is relevant"
    }
  ],
  "reranked_patents": [
    {
      "id": "PAT-XXXX",
      "original_rank": 2,
      "new_rank": 1,
      "relevance_score": 4,
      "relevance_reason": "Why this patent is relevant"
    }
  ],
  "dropped_items": {
    "mechanisms": ["MC-XXXX: keyword match only, doesn't address contradiction"],
    "seeds": [],
    "patents": []
  },
  "reranking_summary": "1-2 sentences on what the corpus offers for this problem",
  "corpus_gaps": ["Mechanism types that would help but weren't found"],
  "paradigm_diversity_note": "Note on which minority paradigms were preserved"
}

## Important

- Don't just accept keyword matches — think about whether the mechanism actually helps
- A patent about "noise reduction" for jet engines may not help with HVAC noise
- But a patent about "vibration isolation" from robotics MIGHT help with centrifuge vibration
- Your job is to REASON about relevance, not just re-sort by score
- If the corpus results are empty or minimal, still return valid JSON with empty arrays`;

/**
 * Zod schema for AN1.5 output validation
 */
const RerankedMechanismSchema = z.object({
  id: z.string(),
  original_rank: z.number(),
  new_rank: z.number(),
  relevance_score: z.number().min(1).max(5),
  relevance_reason: z.string(),
  transfer_note: z.string().optional(),
});

const RerankedSeedSchema = z.object({
  id: z.string(),
  original_rank: z.number(),
  new_rank: z.number(),
  relevance_score: z.number().min(1).max(5),
  relevance_reason: z.string(),
});

const RerankedPatentSchema = z.object({
  id: z.string(),
  original_rank: z.number(),
  new_rank: z.number(),
  relevance_score: z.number().min(1).max(5),
  relevance_reason: z.string(),
});

export const AN1_5_OutputSchema = z.object({
  reranked_mechanisms: z.array(RerankedMechanismSchema),
  reranked_seeds: z.array(RerankedSeedSchema),
  reranked_patents: z.array(RerankedPatentSchema),
  dropped_items: z.object({
    mechanisms: z.array(z.string()),
    seeds: z.array(z.string()),
    patents: z.array(z.string()),
  }),
  reranking_summary: z.string(),
  corpus_gaps: z.array(z.string()),
  paradigm_diversity_note: z.string().optional(),
});

export type AN1_5_Output = z.infer<typeof AN1_5_OutputSchema>;

/**
 * AN1.5 metadata for progress tracking
 */
export const AN1_5_METADATA = {
  id: 'an1.5',
  name: 'Corpus Re-ranking',
  description: 'Re-ranking retrieval results for actual relevance',
  estimatedMinutes: 1.5,
};
