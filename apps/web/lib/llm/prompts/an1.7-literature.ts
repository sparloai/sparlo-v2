import { z } from 'zod';

/**
 * AN1.7 - Literature Augmentation
 *
 * Augments corpus retrieval results with systematic literature search.
 * Fills gaps in corpus coverage and grounds approaches in verified literature.
 */

export const AN1_7_PROMPT = `You are augmenting corpus retrieval results with systematic literature search.
Your role is to fill gaps in corpus coverage and ground approaches in verified literature.

IMPORTANT: Output ONLY valid JSON. No markdown, no text before or after, no explanations. Start your response with { and end with }.

## INPUT
- Problem framing from AN0
- Reranked corpus results from AN1.5
- Retrieval diagnostics (coverage flags)

## YOUR TASK

### 1. ASSESS CORPUS COVERAGE
Review the retrieval diagnostics:
- If any namespace shows "weak" coverage (avg_score < 0.55): Flag for expanded search
- If the problem domain is chemical/process and corpus is mechanical: Flag for expanded search
- If obvious standard approaches are missing from corpus results: Flag for expanded search

### 2. GENERATE LITERATURE SEARCH QUERIES
For each major approach identified (or missing) from corpus:

**Patent searches (prioritize these):**
- "[approach] catalyst patent"
- "[approach] [domain] patent BASF OR 3M OR DuPont"
- "[mechanism] synthesis patent"

**Academic searches (with quality filters):**
- "[approach] review" (review papers)
- "[approach] industrial scale" (scale-up papers)
- "[approach] pilot plant" (validation papers)

### 3. APPLY SOURCE QUALITY HIERARCHY
Rate each source found:

**HIGH CONFIDENCE (use freely):**
- Patents with industrial assignees (BASF, 3M, Grace, etc.)
- Papers with corporate co-authors
- Papers cited BY patents
- Review papers in established journals

**MEDIUM CONFIDENCE (use with attribution):**
- Papers with scale-up data (pilot, kg-scale)
- Papers from national labs
- Well-cited papers (>50 citations)

**LOW CONFIDENCE (flag limitations):**
- Single-university studies
- Papers in pay-to-publish journals (MDPI, Hindawi)
- Results at impractical conditions
- No follow-up citations after 5+ years

### 4. EXTRACT INFORMATION
For each high-quality source, extract:
- Method/approach name
- Key parameters (with source citation)
- Reported outcomes/performance
- Scale (lab/pilot/production)
- Limitations noted
- Commercial status: "Commercially validated" / "Pilot-demonstrated" / "Lab-only"

### 5. IDENTIFY GAPS
Compare corpus results to literature:
- Approaches in literature NOT in corpus → Add as "literature-sourced"
- Approaches in corpus NOT in literature → Flag as "corpus-only, validate carefully"
- Standard industry approaches missing entirely → Critical gap, must add

## OUTPUT FORMAT

{
  "coverage_assessment": {
    "corpus_coverage": "adequate|weak|gaps_identified",
    "expanded_search_triggered": true,
    "domains_searched": ["domain1", "domain2"],
    "sources_found": {"high": 0, "medium": 0, "low": 0}
  },
  "validated_approaches": [
    {
      "approach_name": "Name of approach",
      "source": "Patent/paper citation",
      "source_quality": "HIGH|MEDIUM|LOW",
      "commercial_status": "Commercially validated at COMPANY|Pilot-demonstrated|Lab-only",
      "key_parameters": [
        {"parameter": "name", "value": "range", "source": "citation"}
      ],
      "reported_outcomes": "What literature claims",
      "limitations": "What literature notes",
      "in_corpus": true
    }
  ],
  "gap_analysis": {
    "literature_approaches_missing_from_corpus": ["approach1", "approach2"],
    "corpus_approaches_not_validated_in_literature": ["approach1"],
    "recommended_additions_to_pattern_synthesis": ["approach1", "approach2"]
  },
  "parameter_reference": [
    {
      "parameter": "name",
      "value_range": "range",
      "source": "citation",
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],
  "search_queries_used": ["query1", "query2"],
  "augmentation_summary": "2-3 sentence summary of what literature adds to corpus"
}

## CRITICAL RULES
- NEVER cite a source you didn't actually find in search
- ALWAYS note commercial status for each approach
- PREFER patents over academic papers
- FLAG approaches with no literature validation
- INCLUDE limitations from literature, not just positive outcomes
- If search results are limited, assess corpus coverage only and flag gaps for manual research`;

/**
 * Zod schema for AN1.7 output validation
 */
const KeyParameterSchema = z.object({
  parameter: z.string(),
  value: z.string(),
  source: z.string(),
});

const ValidatedApproachSchema = z.object({
  approach_name: z.string(),
  source: z.string(),
  source_quality: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  commercial_status: z.string(),
  key_parameters: z.array(KeyParameterSchema),
  reported_outcomes: z.string(),
  limitations: z.string(),
  in_corpus: z.boolean(),
});

const ParameterReferenceSchema = z.object({
  parameter: z.string(),
  value_range: z.string(),
  source: z.string(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

export const AN1_7_OutputSchema = z.object({
  coverage_assessment: z.object({
    corpus_coverage: z.enum(['adequate', 'weak', 'gaps_identified']),
    expanded_search_triggered: z.boolean(),
    domains_searched: z.array(z.string()),
    sources_found: z.object({
      high: z.number(),
      medium: z.number(),
      low: z.number(),
    }),
  }),
  validated_approaches: z.array(ValidatedApproachSchema),
  gap_analysis: z.object({
    literature_approaches_missing_from_corpus: z.array(z.string()),
    corpus_approaches_not_validated_in_literature: z.array(z.string()),
    recommended_additions_to_pattern_synthesis: z.array(z.string()),
  }),
  parameter_reference: z.array(ParameterReferenceSchema),
  search_queries_used: z.array(z.string()),
  augmentation_summary: z.string(),
});

export type AN1_7_Output = z.infer<typeof AN1_7_OutputSchema>;

/**
 * AN1.7 metadata for progress tracking
 */
export const AN1_7_METADATA = {
  id: 'an1.7',
  name: 'Literature Augmentation',
  description: 'Filling corpus gaps with verified literature',
  estimatedMinutes: 2,
};
