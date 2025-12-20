import { z } from 'zod';

/**
 * AN1.7-D - Discovery Mode Literature Gap Search
 *
 * Searches for what's MISSING in the literature:
 * - Abandoned approaches worth revisiting
 * - Gaps in research coverage
 * - Patents that were never commercialized
 * - Academic ideas that didn't make it to industry
 */

export const AN1_7_D_PROMPT = `You are a DISCOVERY-MODE literature analyst hunting for GAPS and OVERLOOKED approaches.

## CRITICAL MISSION

Standard literature review finds what EXISTS. Your job is to find what's MISSING:
1. Approaches that were TRIED but ABANDONED (why? have conditions changed?)
2. Research GAPS where nobody looked
3. PATENTS that never got commercialized (why not? is the blocker gone?)
4. ACADEMIC concepts that didn't transfer to industry (why not?)
5. CROSS-DOMAIN solutions that weren't applied (why not?)

## Search Strategy

When searching, focus on:
- "abandoned" + technology keywords
- "discontinued" + approach keywords
- "failed" + mechanism keywords (to learn from failures)
- Historical patents from 50+ years ago
- Soviet/Russian literature (often overlooked in Western industry)
- Academic papers with low citation counts but interesting ideas
- Conference papers that never became journal articles

## EVIDENCE REQUIREMENTS

CRITICAL: Your output is EVIDENCE. Every claim must have a source.

RULE: No source URL = no claim. Every factual assertion about industry state, prior art, or gaps must cite where you found it.

For gaps identified:
- "I searched [query] and found only 3 results, none addressing [specific application]" = evidence of gap
- "I searched [query] and found [company] actively working on this" = NOT a gap

For abandoned approaches:
- Cite the original paper/patent that tried it
- Cite evidence of why it was abandoned (if findable)
- If you can't find WHY it was abandoned, say "abandonment reason unknown - requires further research"

CRITICAL: You must respond with ONLY valid JSON. No markdown, no text before or after. Start with { and end with }.

## Output Format

{
  "abandoned_approaches_found": [
    {
      "approach_name": "Name of abandoned approach",
      "original_era": "When it was used/proposed",
      "why_abandoned": "Original reasons",
      "conditions_that_changed": "What's different now",
      "revival_feasibility": "high|medium|low",
      "revival_concept": "How it could be revived",
      "sources_found": ["Reference 1", "Reference 2"]
    }
  ],

  "research_gaps_identified": [
    {
      "gap_description": "What hasn't been researched",
      "why_gap_exists": "Possible reasons for the gap",
      "potential_value": "What we might find if we explore",
      "suggested_investigation": "How to explore this gap"
    }
  ],

  "uncommercial_patents": [
    {
      "patent_ref": "Patent number or description",
      "core_idea": "What the patent proposed",
      "why_not_commercialized": "Reasons it didn't make it to market",
      "current_relevance": "Why it might be relevant now",
      "barriers_to_address": "What would need to be solved"
    }
  ],

  "academic_orphans": [
    {
      "paper_or_concept": "Academic work that didn't transfer",
      "core_contribution": "What it proposed",
      "why_not_adopted": "Barriers to industry adoption",
      "what_could_enable": "What would make it viable now"
    }
  ],

  "cross_domain_untried": [
    {
      "source_domain": "Where the solution exists",
      "solution_mechanism": "How it works there",
      "target_domain_gap": "Why it hasn't been tried in target domain",
      "transfer_hypothesis": "How it might work if transferred"
    }
  ],

  "historical_wisdom": [
    {
      "source": "Historical source (pre-modern, ancient, etc.)",
      "technique": "What was done",
      "underlying_physics": "Why it worked",
      "modern_adaptation": "How it could be adapted"
    }
  ],

  "competitive_blind_spots": {
    "what_competitors_assume": ["Assumption 1", "Assumption 2"],
    "unexplored_territories": ["Territory 1", "Territory 2"],
    "first_mover_opportunities": ["Opportunity 1", "Opportunity 2"]
  },

  "literature_synthesis": {
    "most_promising_gap": "Highest-potential unexplored area",
    "most_promising_revival": "Best abandoned approach to revive",
    "recommended_deep_dives": ["Area 1 to investigate", "Area 2 to investigate"],
    "novelty_opportunity_summary": "What unique angle we could take"
  },

  "search_evidence": {
    "searches_executed": [
      {"query": "exact query run", "results_count": 5, "key_findings": "what we learned", "source_urls": ["URL1", "URL2"]}
    ],
    "gap_evidence": [
      {"claimed_gap": "description of gap", "search_query": "query used to verify", "results_summary": "what search returned", "conclusion": "why this is/isn't a real gap"}
    ],
    "abandonment_citations": [
      {"approach": "abandoned approach name", "original_source": "paper/patent URL", "abandonment_evidence": "URL or 'reason unknown'", "why_revisit": "what changed"}
    ]
  }
}

REMEMBER: Output ONLY the JSON object. We want GAPS, not summaries of what's known.`;

/**
 * Zod schema for AN1.7-D output validation
 */
const AbandonedApproachSchema = z.object({
  approach_name: z.string(),
  original_era: z.string(),
  why_abandoned: z.string(),
  conditions_that_changed: z.string(),
  revival_feasibility: z.enum(['high', 'medium', 'low']),
  revival_concept: z.string(),
  sources_found: z.array(z.string()),
});

const ResearchGapSchema = z.object({
  gap_description: z.string(),
  why_gap_exists: z.string(),
  potential_value: z.string(),
  suggested_investigation: z.string(),
});

const UncommercialPatentSchema = z.object({
  patent_ref: z.string(),
  core_idea: z.string(),
  why_not_commercialized: z.string(),
  current_relevance: z.string(),
  barriers_to_address: z.string(),
});

const AcademicOrphanSchema = z.object({
  paper_or_concept: z.string(),
  core_contribution: z.string(),
  why_not_adopted: z.string(),
  what_could_enable: z.string(),
});

const CrossDomainUntriedSchema = z.object({
  source_domain: z.string(),
  solution_mechanism: z.string(),
  target_domain_gap: z.string(),
  transfer_hypothesis: z.string(),
});

const HistoricalWisdomSchema = z.object({
  source: z.string(),
  technique: z.string(),
  underlying_physics: z.string(),
  modern_adaptation: z.string(),
});

const CompetitiveBlindSpotsSchema = z.object({
  what_competitors_assume: z.array(z.string()),
  unexplored_territories: z.array(z.string()),
  first_mover_opportunities: z.array(z.string()),
});

const LiteratureSynthesisSchema = z.object({
  most_promising_gap: z.string(),
  most_promising_revival: z.string(),
  recommended_deep_dives: z.array(z.string()),
  novelty_opportunity_summary: z.string(),
});

const SearchExecutedSchema = z
  .object({
    query: z.string(),
    results_count: z.number().catch(0),
    key_findings: z.string().optional(),
    source_urls: z.array(z.string()).catch([]),
  })
  .passthrough();

const GapEvidenceSchema = z
  .object({
    claimed_gap: z.string(),
    search_query: z.string().optional(),
    results_summary: z.string().optional(),
    conclusion: z.string().optional(),
  })
  .passthrough();

const AbandonmentCitationSchema = z
  .object({
    approach: z.string(),
    original_source: z.string().optional(),
    abandonment_evidence: z.string().optional(),
    why_revisit: z.string().optional(),
  })
  .passthrough();

const SearchEvidenceSchema = z
  .object({
    searches_executed: z.array(SearchExecutedSchema).catch([]),
    gap_evidence: z.array(GapEvidenceSchema).catch([]),
    abandonment_citations: z.array(AbandonmentCitationSchema).catch([]),
  })
  .passthrough();

export const AN1_7_D_OutputSchema = z
  .object({
    abandoned_approaches_found: z.array(AbandonedApproachSchema).catch([]),
    research_gaps_identified: z.array(ResearchGapSchema).catch([]),
    uncommercial_patents: z.array(UncommercialPatentSchema).catch([]),
    academic_orphans: z.array(AcademicOrphanSchema).catch([]),
    cross_domain_untried: z.array(CrossDomainUntriedSchema).catch([]),
    historical_wisdom: z.array(HistoricalWisdomSchema).catch([]),
    competitive_blind_spots: CompetitiveBlindSpotsSchema.optional(),
    literature_synthesis: LiteratureSynthesisSchema.optional(),
    search_evidence: SearchEvidenceSchema.optional(),
  })
  .passthrough();

export type AN1_7_D_Output = z.infer<typeof AN1_7_D_OutputSchema>;

/**
 * AN1.7-D metadata for progress tracking
 */
export const AN1_7_D_METADATA = {
  id: 'an1.7-d',
  name: 'Discovery Literature Gaps',
  description: 'Hunting for overlooked approaches in literature',
  estimatedMinutes: 3,
};
