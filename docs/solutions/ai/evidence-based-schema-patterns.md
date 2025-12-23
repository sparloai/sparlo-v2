# Evidence-Based Schema Patterns

**Implementation Reference**

Reusable Zod schema patterns and code templates for building evidence-based LLM prompts.

---

## Table of Contents

1. [Core Patterns](#core-patterns)
2. [Novelty Claim Patterns](#novelty-claim-patterns)
3. [Gap Analysis Patterns](#gap-analysis-patterns)
4. [Self-Critique Patterns](#self-critique-patterns)
5. [Complete Examples](#complete-examples)
6. [Validation Helpers](#validation-helpers)

---

## Core Patterns

### Pattern 1: Source Documentation Schema

The foundation - every claim needs an audit trail.

```typescript
import { z } from 'zod';

/**
 * Documents WHERE a piece of information came from
 * This is the basic building block for evidence-based outputs
 */
const SourceDocumentationSchema = z.object({
  // REQUIRED: What did we search?
  search_conducted: z.object({
    what_we_searched_for: z.string()
      .describe('Exact search terms or description'),
    where_we_searched: z.array(z.string())
      .describe('Databases, sources (e.g., "USPTO Patents", "IEEE Xplore")'),
    date_range: z.string().optional()
      .describe('Search date range (e.g., "1990-2025")'),
    languages_included: z.array(z.string()).optional()
      .describe('Languages searched (default: English only)'),
  }),

  // REQUIRED: What did we find?
  results: z.object({
    total_results: z.number().optional()
      .describe('Number of results found'),
    relevant_results: z.string()
      .describe('What was actually relevant to our concept'),
    direct_quotes_or_citations: z.array(z.string()).optional()
      .describe('Specific quotes or citations if available'),
  }),

  // REQUIRED: What didn't we search?
  search_limitations: z.array(z.object({
    not_searched: z.string()
      .describe('What we could have searched but didn\'t'),
    why_not: z.string()
      .describe('Practical constraint: cost, access, language, expertise'),
    impact_if_exists: z.string()
      .describe('What would change if we found something there?'),
  })).optional(),

  // OPTIONAL: Confidence assessment
  source_quality: z.object({
    primary_source: z.boolean().optional()
      .describe('Direct from original research/patent?'),
    peer_reviewed: z.boolean().optional()
      .describe('Published in peer-reviewed venue?'),
    potential_bias: z.string().optional()
      .describe('Any reason to doubt this source?'),
  }).optional(),

  // Flag for downstream processing
  search_completeness: z.enum([
    'comprehensive',  // Exhaustive search across major sources
    'thorough',       // Good coverage of primary sources
    'partial',        // Searched some major sources
    'minimal',        // Limited search
    'none'            // No search conducted
  ]).optional(),
}).strict();

export type SourceDocumentation = z.infer<typeof SourceDocumentationSchema>;
```

### Pattern 2: Evidence-Based Claim Schema

Separates the claim from its evidence.

```typescript
const EvidenceBasedClaimSchema = z.object({
  // The CLAIM
  claim: z.string()
    .describe('The factual assertion being made'),

  // The EVIDENCE
  evidence: z.union([
    // Type 1: Documented search
    z.object({
      type: z.literal('documented_search'),
      documentation: SourceDocumentationSchema,
    }),

    // Type 2: Direct communication
    z.object({
      type: z.literal('direct_communication'),
      source: z.object({
        person_title: z.string().describe('e.g., "VP of R&D at Manufacturer X"'),
        contact_date: z.string().describe('ISO date'),
        communication_method: z.enum(['email', 'phone', 'meeting', 'written']),
        quote: z.string().optional(),
      }),
    }),

    // Type 3: Product specification
    z.object({
      type: z.literal('product_spec'),
      source: z.object({
        product_name: z.string(),
        manufacturer: z.string(),
        spec_url: z.string().url().optional(),
        accessed_date: z.string(),
      }),
    }),

    // Type 4: Published standard
    z.object({
      type: z.literal('published_standard'),
      source: z.object({
        standard_name: z.string(),
        issuing_body: z.string(),
        year: z.number(),
        url: z.string().url().optional(),
      }),
    }),

    // Type 5: Data/Analysis
    z.object({
      type: z.literal('analysis'),
      source: z.object({
        methodology: z.string().describe('How was this analysis done?'),
        data_sources: z.array(z.string()),
        limitations: z.array(z.string()).optional(),
      }),
    }),

    // Type 6: Inference (weak evidence - be careful!)
    z.object({
      type: z.literal('inference'),
      source: z.object({
        inference_level: z.enum([
          'directly_stated',
          'clearly_implied',
          'reasonably_inferred',
          'speculative'
        ]),
        reasoning: z.string().describe('Why we infer this?'),
        confidence: z.enum(['high', 'medium', 'low']),
      }),
    }),
  ]),

  // Confidence in this claim
  confidence: z.enum(['high', 'medium', 'low'])
    .describe('How confident are we in this claim?'),

  // Uncertainty
  uncertainty: z.string().optional()
    .describe('What could make us wrong about this?'),
}).strict();
```

### Pattern 3: Graceful Degradation Schema

Handles missing evidence without hard failures.

```typescript
/**
 * Instead of failing when evidence is incomplete,
 * this schema captures what we know and flags what we don't
 */
const RobustClaimSchema = z.object({
  claim: z.string(),

  // Optional evidence - we capture what's there
  evidence_if_available: SourceDocumentationSchema.optional(),

  // Flag completeness
  evidence_completeness: z.enum([
    'complete',    // Full search documented
    'partial',     // Some search documented
    'minimal',     // Very limited documentation
    'absent'       // No evidence at all
  ]).catch('absent'),  // Default to "absent" if not provided

  // Source URLs if available
  source_urls: z.array(z.string().url()).optional(),

  // Default to conservative position on novelty
  is_verified: z.boolean().catch(false),

  // Allow for future evidence
  can_be_verified: z.boolean().default(true),
}).passthrough();  // Allow extra fields from LLM
```

---

## Novelty Claim Patterns

### Pattern 1: Conservative Novelty Assessment

Defaults to false, requires evidence to claim true.

```typescript
const ConservativeNoveltySchema = z.object({
  // REQUIRED: What is the claim?
  novelty_claim: z.string()
    .describe('The specific novelty being claimed'),

  // REQUIRED: How did we verify it?
  verification_method: z.object({
    searches_conducted: z.array(z.object({
      database: z.string().describe('e.g., "USPTO Patents"'),
      query: z.string().describe('Exact search terms'),
      results_found: z.number(),
      relevant_results: z.number(),
    })),

    total_sources_checked: z.number(),
    search_coverage: z.enum([
      'exhaustive',   // All major sources
      'thorough',     // Primary sources
      'partial',      // Some sources
      'minimal'       // Limited search
    ]),
  }),

  // OPTIONAL: What prior art did we find?
  prior_art_found: z.array(z.object({
    title: z.string(),
    source: z.string(),
    year: z.number().optional(),
    how_similar: z.string().describe('How is this similar to our claim?'),
    how_different: z.string().describe('How is our concept different?'),
  })).optional(),

  // The VERDICT - defaults to conservative
  is_genuinely_novel: z.boolean()
    .describe('Is this truly novel, not just differently packaged?')
    .catch(false),  // Default FALSE - be conservative

  // REQUIRED: Explain the verdict
  novelty_level: z.enum([
    'breakthrough',   // Fundamentally new approach
    'significant',    // Major improvement/new application
    'moderate',       // Incremental innovation
    'questionable'    // Might be prior art in disguise
  ]).catch('questionable'),  // Default to SKEPTICAL

  // REQUIRED: Why we're confident (or not)
  confidence_assessment: z.object({
    search_confidence: z.enum(['high', 'medium', 'low']),
    gap_confidence: z.enum(['high', 'medium', 'low']),
    overall_confidence: z.enum(['high', 'medium', 'low']),
    main_uncertainty: z.string().optional(),
  }),

  // REQUIRED: Conditions that would change verdict
  would_change_if: z.array(z.object({
    condition: z.string().describe('e.g., "Found this patent from 2010"'),
    then_verdict_would_be: z.string().describe('New novelty assessment'),
    likelihood: z.enum(['likely', 'possible', 'unlikely']),
  })).optional(),
}).strict();
```

### Pattern 2: Gap Validation Schema

Distinguishes real gaps from unverified claims.

```typescript
const GapValidationSchema = z.object({
  // REQUIRED: What is the gap?
  gap_description: z.string()
    .describe('The specific gap or missing solution'),

  // REQUIRED: Is it a real gap or an unexplored area?
  gap_type: z.enum([
    'verified_absence',   // We searched, found nothing
    'unexplored_area',    // We didn't search
    'contradictory_info', // We found conflicting claims
    'unknown',            // Can't determine
  ]),

  // REQUIRED: Evidence for gap type
  gap_evidence: z.object({
    searches_for_this: z.array(z.object({
      what_searched: z.string(),
      where_searched: z.array(z.string()),
      results: z.string().describe('What we found (or didn\'t)'),
    })).optional(),

    searches_not_done: z.array(z.object({
      what_not_searched: z.string(),
      why_not: z.string(),
      could_find_gap_here: z.boolean(),
    })).optional(),
  }),

  // REQUIRED: Confidence in gap
  gap_confidence: z.object({
    is_real_gap: z.enum(['high', 'medium', 'low'])
      .describe('How confident this is a real gap, not search limitation?'),
    main_uncertainty: z.string()
      .describe('What could change our assessment?'),
  }),

  // REQUIRED: Can we verify this gap further?
  how_to_verify: z.object({
    next_search_to_run: z.string().optional(),
    expert_to_contact: z.string().optional(),
    database_to_check: z.string().optional(),
  }).optional(),
}).strict();
```

---

## Self-Critique Patterns

### Pattern 1: Complete Self-Critique Schema

Makes intellectual honesty mandatory.

```typescript
const CompleteSelfCritiqueSchema = z.object({
  // REQUIRED: Strongest counter-argument
  strongest_argument_against: z.object({
    argument: z.string()
      .describe('What a skeptic would genuinely argue'),
    why_strong: z.string()
      .describe('Why this is a real concern, not strawman'),
    our_response: z.string()
      .describe('How we address this concern'),
    remaining_doubt: z.string().optional()
      .describe('Is there any validity we haven\'t addressed?'),
  }),

  // REQUIRED: What searches should we have run?
  prior_art_we_might_have_missed: z.array(z.object({
    search_type: z.string()
      .describe('What we could have searched'),
    why_important: z.string()
      .describe('Why would this search matter?'),
    why_not_conducted: z.string()
      .describe('Honest reason: cost, access, expertise gap?'),
    impact_if_exists: z.string()
      .describe('How would this change our recommendation?'),
    search_difficulty: z.enum(['easy', 'moderate', 'hard'])
      .describe('How hard would it be to do this search?'),
  })),

  // REQUIRED: Physics and assumptions to verify
  assumptions_to_verify: z.array(z.object({
    assumption: z.string()
      .describe('What we\'re assuming is true'),
    why_assuming: z.string()
      .describe('Why did we make this assumption?'),
    how_to_verify: z.string()
      .describe('How would we test if it\'s true?'),
    risk_if_wrong: z.enum(['critical', 'major', 'moderate', 'minor'])
      .describe('How bad if we\'re wrong?'),
    confidence: z.enum(['high', 'medium', 'low'])
      .describe('How confident in this assumption?'),
  })),

  // REQUIRED: Domain expert objections
  domain_expert_pushback: z.array(z.object({
    expert_perspective: z.string()
      .describe('e.g., "A materials scientist would say..."'),
    likely_objection: z.string()
      .describe('The specific concern they\'d raise'),
    our_response: z.string()
      .describe('How would we address it?'),
    confidence_in_response: z.enum(['high', 'medium', 'low'])
      .describe('How confident in our counter-argument?'),
  })),

  // REQUIRED: Conditions that invalidate recommendation
  what_would_change_recommendation: z.array(z.object({
    condition: z.string()
      .describe('What would have to be true to change our mind?'),
    then_recommendation_would_be: z.string()
      .describe('How would our recommendation change?'),
    likelihood_of_condition: z.enum(['likely', 'possible', 'unlikely'])
      .describe('How likely is this condition to occur?'),
  })),

  // REQUIRED: Meta-critique (are we being honest?)
  intellectual_humility: z.object({
    main_weakness: z.string()
      .describe('Biggest weakness in our analysis?'),
    biggest_assumption: z.string()
      .describe('The assumption we\'re least confident about?'),
    most_uncertain_about: z.string()
      .describe('What would we most like to know?'),
    overconfidence_risk: z.enum(['none', 'low', 'moderate', 'high'])
      .describe('Are we overconfident?'),
  }),

  // Flag the quality of self-critique
  critique_quality: z.enum([
    'genuine',     // Serious, substantive critique
    'surface',     // Touches on issues but not deep
    'pro_forma'    // Boilerplate, not specific
  ]).optional(),
}).strict();
```

---

## Complete Examples

### Example 1: Discovery Concept with Full Evidence Chain

```typescript
const FullNoveltyConceptSchema = z.object({
  // Basic info
  id: z.string(),
  name: z.string(),
  category: z.string(),
  source_domain: z.string(),

  // THE NOVELTY CLAIM
  novelty_assessment: z.object({
    claim: z.string()
      .describe('What makes this novel?'),

    // Step 1: What did we search?
    verification: z.object({
      searches: z.array(z.object({
        database: z.string(),
        queries: z.array(z.string()),
        date_range: z.string().optional(),
        results: z.number(),
      })),

      total_sources: z.number(),
      search_date: z.string().optional(),
    }),

    // Step 2: What did we find?
    findings: z.object({
      prior_art_found: z.array(z.object({
        title: z.string(),
        year: z.number().optional(),
        how_similar: z.string(),
        how_different: z.string(),
      })).optional(),

      conclusion: z.string()
        .describe('What does prior art tell us?'),
    }),

    // Step 3: What searches are we missing?
    gaps_in_search: z.array(z.object({
      not_searched: z.string(),
      why: z.string(),
      impact: z.enum(['critical', 'major', 'minor']),
    })).optional(),

    // Step 4: Final verdict
    verdict: z.object({
      is_novel: z.boolean().catch(false),
      novelty_level: z.enum([
        'breakthrough',
        'significant',
        'moderate',
        'questionable'
      ]).catch('questionable'),

      confidence: z.enum(['high', 'medium', 'low']),

      main_uncertainty: z.string()
        .describe('What could change this verdict?'),
    }),
  }),

  // THE SELF-CRITIQUE
  self_critique: CompleteSelfCritiqueSchema,

  // Connection to prior stages
  evidence_chain: z.object({
    originated_in_stage: z.string()
      .describe('AN1.5-D, AN1.7-D, etc.'),

    verified_in_stage: z.array(z.string()).optional()
      .describe('Where this was re-verified'),

    final_confidence_after_all_stages: z.enum(['high', 'medium', 'low']),
  }).optional(),
}).strict();
```

### Example 2: Gap Analysis with Honesty Section

```typescript
const GapAnalysisWithHonestySchema = z.object({
  // The gap
  gap: z.string().describe('What solution is missing?'),

  // What we searched
  search_conducted: z.object({
    databases: z.array(z.string()),
    queries: z.array(z.string()),
    date_range: z.string().optional(),
    languages: z.array(z.string()).default(['English']),
    expert_contacts: z.number().default(0),
  }),

  // What we found
  findings: z.object({
    results_found: z.number(),
    relevant_results: z.number(),
    conclusion: z.string(),
  }),

  // The honest part: what we didn't search
  searches_not_conducted: z.array(z.object({
    what: z.string(),
    why_not: z.enum([
      'lack_of_access',
      'language_barrier',
      'cost',
      'expertise_gap',
      'time_constraint',
      'not_thought_of',
      'low_priority'
    ]),
    consequence: z.string()
      .describe('How would missing this affect our conclusion?'),
  })).optional(),

  // Gap assessment
  assessment: z.object({
    is_real_gap: z.boolean().catch(false),
    gap_confidence: z.enum(['high', 'medium', 'low']),

    // The key distinction
    gap_type: z.enum([
      'verified_absence',    // Searched thoroughly, found nothing
      'unexplored_area',     // Didn't search (admitted)
      'uncertain'            // Mixed findings, unclear
    ]),

    why_this_gap_matters: z.string(),
  }),

  // How to improve confidence
  next_steps: z.object({
    could_verify_with: z.array(z.string()),
    estimated_effort: z.enum(['minimal', 'moderate', 'significant']),
    estimated_timeline: z.string().optional(),
  }).optional(),
}).strict();
```

---

## Validation Helpers

### Helper 1: Extract All Claims

```typescript
/**
 * Find every claim in a report that needs evidence
 */
function extractClaimsRequiringEvidence(report: any): Array<{
  location: string;
  claim: string;
  has_evidence: boolean;
  evidence_type?: string;
}> {
  const claims = [];

  // Find novelty claims
  for (const concept of report.report?.discovery_concepts || []) {
    claims.push({
      location: `concept.${concept.id}.novelty_claim`,
      claim: concept.the_insight?.why_its_new,
      has_evidence: !!(concept.why_novel?.prior_art_searched?.length),
      evidence_type: 'search_documentation'
    });
  }

  // Find gap claims
  for (const gap of report.report?.what_industry_missed?.blind_spots || []) {
    claims.push({
      location: `gap.${gap.assumption}`,
      claim: gap.challenge,
      has_evidence: !!gap.supported_by,
      evidence_type: 'gap_analysis'
    });
  }

  return claims;
}

// Usage
const unsourcedClaims = extractClaimsRequiringEvidence(report)
  .filter(c => !c.has_evidence);

if (unsourcedClaims.length > 0) {
  console.error('Unsourced claims found:', unsourcedClaims);
  throw new Error('Evidence incomplete');
}
```

### Helper 2: Validate Evidence Quality

```typescript
interface EvidenceQualityScore {
  search_depth: 'exhaustive' | 'thorough' | 'partial' | 'minimal';
  coverage_breadth: number; // 0-100, how many sources checked
  gap_acknowledgment: number; // 0-100, how well gaps admitted
  confidence_calibration: number; // 0-100, is confidence matched to evidence
  overall_quality: 'excellent' | 'good' | 'acceptable' | 'poor';
}

function scoreEvidenceQuality(concept: any): EvidenceQualityScore {
  const searches = concept.why_novel?.prior_art_searched?.length || 0;
  const gaps = concept.why_novel?.coverage_limitations?.length || 0;
  const confidence = concept.confidence;

  let search_depth: EvidenceQualityScore['search_depth'];
  if (searches >= 5) search_depth = 'exhaustive';
  else if (searches >= 3) search_depth = 'thorough';
  else if (searches >= 1) search_depth = 'partial';
  else search_depth = 'minimal';

  const coverage_breadth = Math.min(100, searches * 20);
  const gap_acknowledgment = Math.min(100, gaps * 20);

  // Check calibration: LOW novelty can have LIMITED searches,
  // but HIGH novelty needs EXHAUSTIVE searches
  let calibration = 100;
  if (confidence === 'high' && search_depth !== 'exhaustive') {
    calibration -= 40;
  }
  if (gaps === 0 && search_depth !== 'exhaustive') {
    calibration -= 30;
  }

  const overall_quality = Math.round(
    (coverage_breadth * 0.4 + gap_acknowledgment * 0.4 + calibration * 0.2) / 100
  ) >= 70 ? 'good' : 'poor';

  return {
    search_depth,
    coverage_breadth,
    gap_acknowledgment,
    confidence_calibration: calibration,
    overall_quality: overall_quality as any
  };
}

// Usage
const quality = scoreEvidenceQuality(concept);
if (quality.overall_quality === 'poor') {
  throw new Error(`Evidence quality too low: ${JSON.stringify(quality)}`);
}
```

### Helper 3: Validate Self-Critique Substantiveness

```typescript
function validateCritiqueSubstantiveness(critique: any): {
  passed: boolean;
  issues: string[];
} {
  const issues = [];

  // Check strongest argument
  const strongestArg = critique.strongest_argument_against;
  if (!strongestArg || strongestArg.length < 100) {
    issues.push('strongest_argument_against too short (< 100 chars)');
  }
  if (strongestArg?.toLowerCase().includes('might not')) {
    issues.push('strongest_argument_against is too weak (strawman?)');
  }

  // Check gap acknowledgment
  if (!critique.prior_art_we_might_have_missed ||
      critique.prior_art_we_might_have_missed.length < 2) {
    issues.push('prior_art_we_might_have_missed incomplete (< 2 gaps)');
  }

  // Check specificity (not generic)
  const isGeneric = [
    'other databases',
    'future research',
    'more time',
    'better tools'
  ].some(generic =>
    critique.prior_art_we_might_have_missed
      ?.some((gap: any) => gap.what?.includes(generic))
  );

  if (isGeneric) {
    issues.push('Critique too generic - needs specific gaps');
  }

  // Check assumptions
  if (!critique.assumptions_to_verify ||
      critique.assumptions_to_verify.length < 2) {
    issues.push('assumptions_to_verify incomplete');
  }

  return {
    passed: issues.length === 0,
    issues
  };
}

// Usage
const result = validateCritiqueSubstantiveness(concept.self_critique);
if (!result.passed) {
  throw new Error(`Self-critique quality issues: ${result.issues.join(', ')}`);
}
```

---

## Real-World Integration

### In Your Prompts

```typescript
export const YOUR_ANALYSIS_PROMPT = `
## Output Requirements

Your output must be valid JSON matching this structure:

{
  "concepts": [
    {
      "id": "C-01",
      "name": "...",

      "novelty_assessment": {
        "claim": "What makes this novel?",
        "verification": {
          "searches": [
            {
              "database": "USPTO Patents",
              "queries": ["counter-current", "passive", "gravity"],
              "results": 12
            }
          ],
          "total_sources": 3
        },
        "findings": {
          "conclusion": "Found 12 patents, 0 on passive counter-current"
        },
        "gaps_in_search": [
          {
            "not_searched": "Chinese patent databases",
            "why": "Language barrier",
            "impact": "critical"
          }
        ],
        "verdict": {
          "is_novel": true,
          "novelty_level": "significant",
          "confidence": "medium"
        }
      },

      "self_critique": {
        "strongest_argument_against": "...",
        "prior_art_we_might_have_missed": [...],
        "assumptions_to_verify": [...],
        // ... etc
      }
    }
  ]
}

## Validation Rules

1. Every 'is_novel' claim must have matching searches documented
2. Every 'confidence' level must be supported by 'search_depth'
   - HIGH confidence → Need exhaustive searches
   - MEDIUM confidence → Thorough searches acceptable
   - LOW confidence → Can have limited searches

3. 'Self_critique' cannot be empty - must have genuine concerns
4. 'gaps_in_search' is REQUIRED - show what you didn't search
`;
```

---

**Version**: 1.0
**Created**: 2025-12-19
**Type**: Reference
**Audience**: Engineers implementing evidence-based prompts

## Related Issues

- See also: [schema-antifragility-llm-output-20251223.md](../architecture/schema-antifragility-llm-output-20251223.md) - Antifragile schema patterns for handling LLM output variations
