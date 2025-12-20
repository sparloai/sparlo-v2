# Prevention Strategies for Evidence-Based LLM Prompts

**Solution Documentation**

Comprehensive guide for preventing unverifiable claims in LLM prompt chains through mandatory source documentation, antifragile design, and structured validation patterns.

---

## Table of Contents

1. [Problem Summary](#problem-summary)
2. [Core Prevention Strategies](#core-prevention-strategies)
3. [Best Practices for Evidence-Based Prompts](#best-practices-for-evidence-based-prompts)
4. [Testing & Validation Guidance](#testing--validation-guidance)
5. [Development Checklist](#development-checklist)
6. [Pattern Implementation Examples](#pattern-implementation-examples)

---

## Problem Summary

### The Issue

LLMs naturally produce plausible-sounding claims without requiring verification. In analytical chains (like the Discovery Flow), this led to:

- **Unsubstantiated assertions** about industry state, prior art, or technical feasibility
- **Overconfidence claims** without acknowledging research gaps or limitations
- **Mixing verified and unverified information** without distinction
- **No accountability trail** for where claims originated

### The Cost

- Wasted exploration of non-existent "gaps" in literature
- False confidence in novelty assessments
- Damaged credibility when recommendations couldn't be traced
- Downstream decision-making based on hallucinated "evidence"

### The Lesson

**Sources are not optional—they are the difference between analysis and storytelling.**

---

## Core Prevention Strategies

### Strategy 1: Mandatory Source Documentation

#### Rule: No Source URL = No Claim

The fundamental rule prevents unattributed assertions:

```typescript
// AN5-D-PROMPT excerpt
## EVIDENCE REQUIREMENTS

RULE: No source URL = no claim. Every factual assertion about industry state, prior art,
or gaps must cite where you found it.

Discovery concepts must document:
- Where the idea originates (which domain, publication, or inventor)
- What searches were conducted to validate novelty
- What prior art was found (and why it doesn't fully satisfy)
- Where the gap is (specific paper, patent database, literature search)
```

#### Implementation Pattern

In the schema, distinguish between:

```typescript
{
  "discovery_concepts": [
    {
      "why_novel": {
        // REQUIRED: Sources for all claims
        "prior_art_searched": [
          "Patent search: 'thermosiphon heat transfer' (USPTO, Google Patents)",
          "Literature search: 'counter-current heat exchangers' (IEEE Xplore, ResearchGate)",
          "Industry analysis: Commercial heat exchanger manufacturers"
        ],

        // REQUIRED: What was actually found
        "what_we_found": "19 patents on thermosiphon designs, all use straight tubes. Zero references to counter-current passive mechanisms.",

        // REQUIRED: How this differs
        "differentiation": "All prior art uses active circulation. This uses gravity-driven passive counter-current flow, never attempted at scale."
      },

      "honest_uncertainties": [
        "Did not search Chinese patent databases (potential gap in coverage)",
        "Limited to English-language publications (missed non-English research)",
        "No direct communication with heat exchanger manufacturers (could have missed proprietary research)"
      ]
    }
  ]
}
```

#### When Searches Were NOT Conducted

This is critical. Add the "honesty section" pattern:

```typescript
{
  "self_critique": {
    "prior_art_we_might_have_missed": [
      "No search in biomedical literature (could have thermosiphon research)",
      "Didn't search geological/geothermal databases",
      "Didn't contact aerospace engineers (heat management expertise)",
      "Didn't search failed startup patents (non-published innovations)"
    ]
  }
}
```

This acknowledges:
- **What we looked for** (explicit searches conducted)
- **What we didn't look for** (honest gaps in coverage)
- **Why those gaps exist** (resource constraints, domain knowledge limits)

### Strategy 2: Gap Validation Pattern

#### Distinguish Real Gaps from Unverified Claims

```typescript
// Schema distinguishes gap types:

const GapAnalysisSchema = z.object({
  gap_type: z.enum([
    'verified_absence',      // We looked, found nothing
    'unexplored_area',       // We didn't look (honest)
    'unexplained_gap',       // We looked, found contradictions
    'acknowledged_unknown'   // We know we don't know
  ]),

  evidence: z.object({
    search_queries: z.array(z.string()),        // What we searched
    sources_checked: z.array(z.string()),       // Where we looked
    results_found: z.string(),                  // What we actually got
    coverage_limitations: z.array(z.string()), // What we might have missed
  }),

  confidence_in_gap: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  uncertainty_explanation: z.string(),
});
```

#### Implementation in Discovery Flow

In AN1.7-D (Literature Gaps), explicitly separate:

```typescript
{
  "literature_gaps": [
    {
      "gap": "No research on counter-current passive thermosiphons",

      // What we searched
      "search_conducted": {
        "databases": ["IEEE Xplore", "Google Scholar", "Patent databases"],
        "queries": ["counter-current thermosiphon", "passive heat transfer gravity"],
        "date_range": "1990-2025",
        "languages": "English only"
      },

      // What we found
      "findings": {
        "patents_found": 19,
        "papers_found": 43,
        "themes": "All active circulation, straight-tube designs",
        "conclusion": "Gap confirmed in counter-current passive mechanism"
      },

      // Honest limitations
      "search_limitations": [
        "Did not search Chinese databases (potential 30% gap in patents)",
        "Non-English publications not covered",
        "Proprietary research not visible",
        "Recent patents may not be indexed yet"
      ],

      "gap_confidence": "MEDIUM-HIGH",
      "why_not_high": "Gaps in database coverage could hide prior work"
    }
  ]
}
```

### Strategy 3: Antifragile Schema Design

#### Principle: Conservative on Unknown Data

When source information is missing or uncertain, schemas should:

1. **Default conservatively** on novelty claims
2. **Require explicit validation** for high-stakes assertions
3. **Allow graceful degradation** when sources aren't available
4. **Never silently drop** evidence of incompleteness

```typescript
const NoveltyClaimSchema = z.object({
  // Default FALSE - be conservative about novelty
  genuinely_novel: z.boolean().catch(false),

  novelty_level: z.enum([
    'breakthrough',
    'significant',
    'moderate'
  ]).catch('moderate'),  // Default to middle confidence

  // REQUIRED if claiming novelty
  evidence_of_novelty: z.object({
    sources_consulted: z.array(z.string()),
    gap_confirmed_in: z.array(z.string()),
    differentiation_from: z.string(),
  }).optional(),  // Optional to parse gracefully

  // Flag if evidence is missing
  evidence_completeness: z.enum([
    'comprehensive',  // Covered all major sources
    'partial',        // Searched some, found gaps
    'minimal',        // Limited search
    'unknown'         // No search data provided
  ]).catch('unknown'),
});
```

#### Why This Works

```typescript
// BAD: Silent failure on missing sources
const BadNoveltySchema = z.object({
  genuinely_novel: z.boolean(),  // Fails if no data provided
  novelty_level: z.enum(['breakthrough', 'significant', 'moderate']),
});

// GOOD: Graceful degradation
const GoodNoveltySchema = z.object({
  genuinely_novel: z.boolean().catch(false),      // Defaults FALSE
  novelty_level: z.enum([...]).catch('moderate'), // Defaults MIDDLE

  // Flag incomplete evidence
  evidence_quality: z.enum(['high', 'medium', 'low']).catch('low'),

  // Audit trail
  data_completeness: z.object({
    has_source_urls: z.boolean(),
    has_search_documentation: z.boolean(),
    has_gap_analysis: z.boolean(),
  }),
});
```

### Strategy 4: Honesty Section Pattern

#### Self-Critique with Teeth

Mandatory self-critique section specifically designed to surface weaknesses:

```typescript
const SelfCritiqueSchema = z.object({
  // 1. Strongest counter-argument - forces adversarial thinking
  strongest_argument_against: z.string(),  // REQUIRED, NOT optional

  // 2. What searches should we have run? - Explicitly calls out gaps
  prior_art_we_might_have_missed: z.array(z.object({
    search_type: z.string(),
    why_important: z.string(),
    why_not_conducted: z.string(),  // Be honest!
    impact_if_exists: z.string(),
  })).optional(),

  // 3. What's assumed but not proven? - Physics and technical assumptions
  physics_assumptions_to_verify: z.array(z.object({
    assumption: z.string(),
    why_assumed: z.string(),
    how_to_verify: z.string(),
    risk_if_wrong: z.string(),
  })).optional(),

  // 4. Domain expert pushback - Anticipated objections
  domain_expert_pushback: z.array(z.object({
    expert_perspective: z.string(),
    likely_objection: z.string(),
    our_response: z.string(),
    confidence_in_response: z.enum(['high', 'medium', 'low']),
  })).optional(),

  // 5. What would invalidate this? - Boundary conditions
  what_would_change_recommendation: z.array(z.object({
    condition: z.string(),
    then: z.string(),
    likelihood_estimate: z.enum(['high', 'medium', 'low']),
  })).optional(),

  // 6. Meta-critique: Are we being honest?
  intellectual_humility: z.object({
    main_weakness: z.string(),
    biggest_assumption: z.string(),
    most_uncertain_about: z.string(),
  }).optional(),
}).passthrough();
```

#### Enforcement in Prompts

```typescript
export const AN5_D_PROMPT = `
## FINAL REMINDERS

1. **Self-critique is REQUIRED.** This section must not be skipped or superficial.
   - "Strongest argument against" must be genuinely strong, not strawman
   - "Prior art we might have missed" must list ACTUAL gaps in our research
   - "What searches should we have run" should be painful to admit

2. **Honesty about uncertainty is strength, not weakness.**
   - Acknowledge what you don't know
   - Explain why searches were incomplete
   - Identify assumptions that are fragile

3. **Connect critique to recommendations.**
   - If you have big uncertainties, don't recommend "must pursue"
   - If gap analysis was limited, acknowledge scope
   - If assumptions are critical, make them explicit

## Self-Critique Quality Checklist

Before outputting, ensure your self_critique contains:
- At least 2 genuine counter-arguments (not weak strawmen)
- At least 3 searches you DIDN'T conduct (be specific why)
- At least 2 physics assumptions to verify
- At least 2 domain expert objections you anticipate
- At least 1 condition that would invalidate your recommendation
`;
```

### Strategy 5: Source Attribution Standards

#### Specify Required Source Information

```typescript
const SourceAttributionSchema = z.object({
  claim: z.string(),

  // How we know this
  source_type: z.enum([
    'peer_reviewed_paper',
    'patent',
    'industry_data',
    'manufacturer_spec',
    'market_research',
    'technical_standard',
    'direct_communication',
    'product_documentation',
    'news_article',
    'conference_presentation'
  ]),

  // Specific source
  source_reference: z.object({
    title: z.string(),
    authors: z.array(z.string()).optional(),
    publication: z.string(),
    year: z.number().or(z.string()),
    url: z.string().url().optional(),  // If available
    accessed_date: z.string().optional(),
  }),

  // Credibility assessment
  credibility: z.object({
    level: z.enum(['primary', 'secondary', 'tertiary']),
    potential_bias: z.string(),
    corroboration: z.array(z.string()).optional(),
  }).optional(),

  // Flag if claim is inferred vs. directly stated
  inference_level: z.enum([
    'directly_stated',
    'clearly_implied',
    'reasonably_inferred',
    'speculative'
  ]),
});
```

#### In Practice

```typescript
{
  "discovery_concepts": [
    {
      "the_insight": {
        "what_we_found": "Counter-current passive heat transfer using gravity-driven flow",

        // Make sources visible in the output
        "sources": [
          {
            "claim": "Standard industry approach uses active circulation",
            "source": "IEEE Xplore review of 19 thermosiphon patents (2024)",
            "url": "https://ieeexplore.ieee.org/...",
            "inference_level": "directly_stated",
            "credibility": "primary"
          },
          {
            "claim": "No prior art found on passive counter-current mechanisms",
            "source": "Custom patent search across USPTO, Google Patents, WIPO",
            "searches_conducted": 12,
            "results_found": "0 matches for gravity-driven counter-current flow",
            "inference_level": "directly_stated",
            "credibility": "primary"
          }
        ]
      }
    }
  ]
}
```

---

## Best Practices for Evidence-Based Prompts

### Practice 1: Progressive Verification

Structure prompts to verify claims at each stage:

```typescript
// Stage 1: Make claim
const AN3_D_PROMPT = `
Generate novel concepts. Each concept should:
1. State the core mechanism clearly
2. Identify where it comes from
`;

// Stage 2: Verify in next stage
const AN4_D_PROMPT = `
For EACH concept you received:
1. Verify novelty - have you seen this exact approach?
2. Check feasibility - does this violate physics?
3. Validate gap - is there truly a gap here?
`;

// Stage 3: Final validation
const AN5_D_PROMPT = `
For each concept selected:
1. Document your novelty search specifically
2. Cite prior art found (if any)
3. Explain why gap exists (search limitations or real gap?)
`;
```

### Practice 2: Context Chains for Verification

Pass verification context forward:

```typescript
// AN4-D receives:
const an3dResult = {
  discovery_concepts: [
    {
      id: 'D-01',
      name: 'Counter-current thermosiphon',
      source_domain: 'Biology - spiral shells',
      why_its_new: 'Gravity-driven passive cooling never applied to industrial heat'
      // Note: NO sources yet - just the claim
    }
  ]
};

// AN4-D should verify:
const an4dPrompt = `
For each concept, verify these claims with your own search:
${JSON.stringify(an3dResult.discovery_concepts.map(c => ({
  concept: c.name,
  claim_to_verify: c.why_its_new,
  what_to_search: 'Patents, papers, and products for this exact approach'
})))}

After your search, document:
1. What you searched for
2. What you found
3. Whether the novelty claim holds
`;
```

### Practice 3: Honesty as a First-Class Output

```typescript
const HonesttyLayerSchema = z.object({
  // Explicit completeness markers
  confidence_markers: z.object({
    evidence_quality: z.enum(['comprehensive', 'good', 'limited', 'minimal']),
    search_coverage: z.enum(['exhaustive', 'thorough', 'partial', 'spot-check']),
    expertise_level: z.enum(['expert', 'knowledgeable', 'generalist', 'limited']),
    time_invested: z.enum(['extensive', 'adequate', 'rushed', 'minimal']),
  }),

  // Explicit limitations
  acknowledged_gaps: z.array(z.object({
    type: z.enum(['search_gap', 'expertise_gap', 'access_gap', 'time_gap']),
    description: z.string(),
    impact: z.enum(['minor', 'moderate', 'significant']),
  })),

  // Explicit uncertainties
  major_unknowns: z.array(z.string()),

  // Recommendation adjusted for confidence
  recommendation_confidence: z.enum(['high', 'medium', 'low']),
  recommendation_adjusted_for_uncertainty: z.string(),
});
```

### Practice 4: Audit Trail by Design

Every claim should have a path back to its evidence:

```typescript
// Concept in AN5-D output should reference all back to AN1.7-D searches
const conceptWithAuditTrail = {
  id: 'D-01',
  name: 'Counter-current thermosiphon',

  // These specific values came from AN1.7-D
  derived_from: {
    an1_7_d_gap: 'Passive counter-current heat transfer',

    // Link back to specific searches
    evidence_chain: [
      {
        stage: 'AN1.7-D (Literature Gaps)',
        search: 'Counter-current passive heat transfer',
        finding: '0 results for gravity-driven counter-current',
        query_url: 'IEEE Xplore search #2024-Q4-032'
      },
      {
        stage: 'AN4-D (Evaluation)',
        search: 'Verify gap exists - counter-current thermosiphon patents',
        finding: '19 patents all use active circulation',
        query_date: '2025-01-15'
      }
    ]
  },

  // Quality assessment
  evidence_quality: {
    novelty_search_conducted: true,
    scope: 'Patents + IEEE papers',
    limitations: 'No Chinese language patents, recent patents may not be indexed',
    confidence: 'MEDIUM-HIGH'
  }
};
```

### Practice 5: Source-First Architecture

Design schemas to make sources primary, claims secondary:

```typescript
// BAD: Claim first, sources forgotten
const BadDesign = {
  concept_name: 'Counter-current thermosiphon',
  why_novel: 'No one has tried gravity-driven counter-current heat transfer',
  // (sources forgotten)
};

// GOOD: Sources first, claims follow
const GoodDesign = {
  concept_name: 'Counter-current thermosiphon',

  novelty_validation: {
    // Sources are first-class
    searches_conducted: [
      { database: 'IEEE Xplore', query: 'counter-current passive', results: 0 },
      { database: 'USPTO Patents', query: 'thermosiphon gravity', results: 19 },
      // ... more searches
    ],

    // Claim follows from evidence
    finding: '19 patents on thermosiphons all use active circulation',
    claim: 'No prior art on gravity-driven counter-current mechanism',
    confidence: 'HIGH (based on searches above)',
    limitations: 'Did not search Chinese patents'
  }
};
```

---

## Testing & Validation Guidance

### Test 1: Source Traceability

**Goal**: Every claim can be traced back to a documented source or acknowledged gap.

```typescript
// Test: Extract all claims from report
function extractClaims(report: AN5DOutput): Claim[] {
  const claims = [];

  for (const concept of report.report.discovery_concepts) {
    // Every property that could be a claim
    claims.push({
      text: concept.the_insight.what_we_found,
      source: concept.why_novel.what_we_found,
      location: `concept.${concept.id}.why_novel`
    });

    claims.push({
      text: concept.the_insight.why_its_new,
      source: concept.why_novel.prior_art_searched,
      location: `concept.${concept.id}.why_novel`
    });
  }

  return claims;
}

// Validation: Every claim must have a source
const validateSources = (report: AN5DOutput) => {
  const claims = extractClaims(report);
  const unsourced = [];

  for (const claim of claims) {
    const hasSource = claim.source &&
                     Array.isArray(claim.source) &&
                     claim.source.length > 0;

    if (!hasSource) {
      unsourced.push({
        claim: claim.text,
        location: claim.location,
        message: 'No source provided for this claim'
      });
    }
  }

  return {
    passed: unsourced.length === 0,
    unsourced,
    coverage: `${claims.length - unsourced.length}/${claims.length} claims sourced`
  };
};
```

### Test 2: Honesty Validation

**Goal**: Self-critique section is substantive, not pro forma.

```typescript
function validateHonesty(critique: SelfCritique): ValidationResult {
  const checks = {
    strongestArgumentLength: critique.strongest_argument_against?.length >= 100,

    hasCounterarguments: (critique.strongest_argument_against || '')
      .split('.').length >= 2,  // At least 2 sentences

    hasSearchGaps: critique.prior_art_we_might_have_missed?.length >= 2,

    isSpecific: !critique.prior_art_we_might_have_missed?.some(gap =>
      gap.includes('other databases') || gap.includes('general') || gap.includes('etc')
    ),

    hasRisks: (critique.physics_assumptions_to_verify?.length || 0) >= 2,

    acknowledgesUncertainty: (critique.intellectual_humility?.most_uncertain_about?.length || 0) > 0
  };

  return {
    passed: Object.values(checks).every(v => v === true),
    details: checks,
    feedback: !checks.strongestArgumentLength ?
      'Strongest argument too brief - make it genuinely strong' : undefined
  };
}
```

### Test 3: Evidence Chain Validation

**Goal**: Can you trace from claim back through the analysis chain?

```typescript
interface EvidenceChain {
  claim: string;
  originStage: 'AN1.7-D' | 'AN3-D' | 'AN4-D' | 'AN5-D';
  verifiedInStage: string[];
  finalConfidence: 'high' | 'medium' | 'low';
}

function validateEvidenceChain(
  stage5Report: AN5DOutput,
  stage4Evaluation: AN4DOutput,
  stage1_7Gaps: AN1_7DOutput
): EvidenceChain[] {
  const chains = [];

  for (const concept of stage5Report.report.discovery_concepts) {
    // Claim originates in AN1.7-D
    const gapInAN1_7 = stage1_7Gaps.literature_gaps?.find(g =>
      g.gap.includes(concept.source_domain)
    );

    // Verified in AN4-D
    const verifiedInAN4 = stage4Evaluation.evaluation?.find(e =>
      e.concept_id === concept.id
    );

    // Re-verified in AN5-D
    const reVerifiedInAN5 = concept.why_novel.prior_art_searched?.length > 0;

    chains.push({
      claim: concept.name,
      originStage: 'AN1.7-D',
      verifiedInStage: [
        gapInAN1_7 ? 'AN1.7-D' : null,
        verifiedInAN4 ? 'AN4-D' : null,
        reVerifiedInAN5 ? 'AN5-D' : null
      ].filter(Boolean) as string[],
      finalConfidence: reVerifiedInAN5 ? 'high' : 'medium'
    });
  }

  return chains;
}
```

### Test 4: Gap Documentation Validation

**Goal**: All gaps are either verified or honestly acknowledged as unexplored.

```typescript
function validateGapDocumentation(
  report: AN5DOutput,
  gapAnalysis: AN1_7DOutput
): GapValidationResult {
  const gaps = report.report.discovery_concepts.flatMap(c =>
    (c.why_novel.prior_art_searched || [])
      .map(search => ({
        concept: c.id,
        search,
        type: classifyGap(search)
      }))
  );

  const results = {
    verified_gaps: gaps.filter(g => g.type === 'verified').length,
    unexplored_gaps: gaps.filter(g => g.type === 'unexplored').length,
    uncertain_gaps: gaps.filter(g => g.type === 'uncertain').length,

    gap_acknowledgment: report.report.discovery_concepts.every(c =>
      c.why_novel.what_we_found?.toLowerCase().includes('did not') ||
      c.why_novel.what_we_found?.toLowerCase().includes('no')
    ),

    issues: gaps
      .filter(g => g.type === 'uncertain')
      .map(g => `${g.concept}: Uncertain whether gap is real`)
  };

  return results;
}
```

### Test 5: Confidence Calibration

**Goal**: Recommendations match confidence levels in supporting evidence.

```typescript
function validateConfidenceCalibration(report: AN5DOutput): CalibrationResult {
  const issues = [];

  for (const concept of report.report.discovery_concepts) {
    const hasSearchGaps = (
      concept.why_novel.prior_art_searched || []
    ).length < 3;

    const hasUncertainties = (
      concept.honest_uncertainties || []
    ).length >= 2;

    const highConfidenceRecommendation =
      concept.priority === 'must_pursue';

    // Check calibration
    if (highConfidenceRecommendation && (hasSearchGaps || hasUncertainties)) {
      issues.push({
        concept: concept.id,
        problem: 'High confidence recommendation despite significant gaps/uncertainties',
        recommendation: 'Reduce priority to "should_explore" or expand searches'
      });
    }

    if (!concept.confidence && highConfidenceRecommendation) {
      issues.push({
        concept: concept.id,
        problem: 'Missing confidence field for high-priority recommendation',
        recommendation: 'Add explicit confidence assessment'
      });
    }
  }

  return {
    calibrated: issues.length === 0,
    issues
  };
}
```

---

## Development Checklist

### Pre-Implementation Checklist

Before adding evidence requirements to a new prompt chain:

**Understanding the Problem**
- [ ] Have you identified what unverified claims look like in your chain?
- [ ] Do you know the downstream impact of wrong claims? (How would false information cause damage?)
- [ ] Have you reviewed user complaints or issues related to unverifiable outputs?

**Designing the Prevention**
- [ ] Source documentation rule defined? (What counts as a "source"?)
- [ ] Schema designed to include source fields?
- [ ] Gap analysis structure defined?
- [ ] Self-critique section planned?

**Implementation**
- [ ] Updated prompt with "No source URL = no claim" rule?
- [ ] Added self-critique section as REQUIRED (not optional)?
- [ ] Schema updated with source documentation fields?
- [ ] Added `.catch()` defaults for novelty claims?
- [ ] Honesty section fields added?

**Testing**
- [ ] Test for source traceability written?
- [ ] Test for gap documentation written?
- [ ] Test for honesty validation written?
- [ ] Sample outputs evaluated against tests?

### Per-Prompt Checklist

Before deploying any prompt that makes analytical claims:

**Evidence Requirements**
- [ ] Rule stated: "No source URL = no claim"
- [ ] Required sources documented: What types? (papers, patents, products, databases?)
- [ ] URL format requirements clear? (Should LLM generate URLs or only cite found ones?)
- [ ] Date ranges specified? (e.g., "patents 1990-2025")
- [ ] Search scope defined? (English-only? Which databases?)

**Honesty Section**
- [ ] Self-critique REQUIRED in schema?
- [ ] Strongest counter-argument field mandatory?
- [ ] "What searches should we have run?" field included?
- [ ] Gap acknowledgment clear: "We looked, found X, didn't look at Y because Z"?
- [ ] Uncertainty explicitly encouraged?

**Output Validation**
- [ ] Schema includes `evidence_completeness` field?
- [ ] Schema includes `has_source_urls` boolean?
- [ ] Schema includes `coverage_limitations` array?
- [ ] Defaults are conservative? (Boolean claims default false, enums default middle value)
- [ ] `.passthrough()` included to allow extra fields?

**Downstream Processing**
- [ ] Test validates every claim has a source?
- [ ] Test checks gap documentation completeness?
- [ ] UI surfaces source URLs to users?
- [ ] UI displays confidence levels?
- [ ] UI shows "not searched" gaps clearly?

### Post-Deployment Checklist

After deploying a prompt with evidence requirements:

**Monitor**
- [ ] Are sources being provided consistently?
- [ ] Are honesty sections substantive or pro forma?
- [ ] Which claims are most often unsourced?
- [ ] Are users asking for clarifications about evidence?

**Iterate**
- [ ] Update prompt based on most common failures?
- [ ] Add examples of good self-critique?
- [ ] Refine schema based on actual LLM behavior?
- [ ] Add more specific guidance for your domain?

**Measure**
- [ ] Percentage of claims with sources?
- [ ] User trust scores for outputs?
- [ ] Reduction in "unverifiable claims" complaints?
- [ ] Time spent on verification downstream?

---

## Pattern Implementation Examples

### Example 1: Discovery Flow Implementation

```typescript
// File: apps/web/lib/llm/prompts/discovery/an5-d-report.ts

export const AN5_D_PROMPT = `You are running Stage 7 of 7 in Discovery Mode.

## CHAIN CONTEXT
[Previous context]

## EVIDENCE REQUIREMENTS

RULE: No source URL = no claim. Every factual assertion about:
- Industry state or practice
- Prior art or existing solutions
- Academic research findings
- Market data or statistics

...must cite sources explicitly.

## SOURCE DOCUMENTATION STANDARD

For each claim about novelty, document:

1. **What you searched for**
   - Database (IEEE Xplore, Patent Office, etc.)
   - Search query
   - Date range covered
   - Languages included

2. **What you found**
   - Number of results
   - What they say
   - How they relate to your concept

3. **What this means**
   - Gap confirmed? (Yes/No/Uncertain)
   - Novelty claim support? (Yes/No/Partial)
   - Confidence level? (High/Medium/Low)

4. **What you didn't search**
   - Why not?
   - Impact if we missed something there?

## Output Format

...include source_urls and prior_art_searched in EVERY concept...

## SELF-CRITIQUE REQUIREMENTS

Your self_critique section must include:

1. **strongest_argument_against** (genuinely strong, not strawman)
   - A skeptic would say: ...
   - This is strong because: ...
   - Our response: ...

2. **prior_art_we_might_have_missed** (specific gaps in our search)
   - Chinese patent databases (could hide 30% of innovation)
   - Non-English publications (coverage unknown)
   - Proprietary research (not publicly visible)
   - Contact with manufacturers directly

3. **what_would_change_recommendation** (boundary conditions)
   - If X exists in prior art: recommend down to "explore"
   - If Y physics doesn't work: recommend "park"
   - If Z cost is higher: timeline changes to Q3

## FINAL INSTRUCTION

Before responding, check:
- Does every concept have sources for its novelty claim?
- Does self_critique acknowledge real gaps in our research?
- Would a skeptical engineer find our evidence compelling?
- Are we honest about what we don't know?

CRITICAL: You must respond with ONLY valid JSON.
`;
```

### Example 2: Honesty Section Validation Test

```typescript
// File: apps/web/lib/llm/__tests__/honesty-validation.test.ts

import { validateHonestySectionQuality } from '../validators/honesty-validator';
import { AN5_D_Output } from '../types';

describe('Honesty Section Validation', () => {
  it('rejects weak self-critiques', () => {
    const report: AN5_D_Output = {
      report: {
        // ... other fields
        discovery_concepts: [{
          // ... other fields
          self_critique: {
            strongest_argument_against:
              'Someone might not believe this.',  // TOO WEAK
            prior_art_we_might_have_missed: [],  // EMPTY
          }
        }]
      }
    };

    const result = validateHonestySectionQuality(
      report.report.discovery_concepts[0].self_critique
    );

    expect(result.passed).toBe(false);
    expect(result.issues).toContain({
      field: 'strongest_argument_against',
      reason: 'Too weak - not genuinely strong argument'
    });
  });

  it('accepts substantive self-critiques', () => {
    const report: AN5_D_Output = {
      report: {
        discovery_concepts: [{
          self_critique: {
            strongest_argument_against: `A materials expert would argue that:
              1. Passive gravity-driven systems can't overcome surface tension
              2. Counter-current flow requires active control in industrial settings
              3. Temperature gradients in biological systems don't transfer to manufacturing

              This is a strong argument because it targets the physics directly.

              Our response: We agree surface tension is real. However, at scales > 1cm,
              gravity wins (I^2/I = 100x). Our validation experiment directly tests this.`,

            prior_art_we_might_have_missed: [
              {
                search_type: 'Aerospace cooling systems',
                why_important: 'They solved counter-current challenges for space',
                why_not_conducted: 'Assumed terrestrial vs aerospace constraints too different',
                impact_if_exists: 'Could provide design precedent'
              },
              // ... more gaps
            ]
          }
        }]
      }
    };

    const result = validateHonestySectionQuality(
      report.report.discovery_concepts[0].self_critique
    );

    expect(result.passed).toBe(true);
  });
});
```

### Example 3: Source Traceability Test

```typescript
// File: apps/web/lib/llm/__tests__/source-traceability.test.ts

import { extractClaimsWithoutSources } from '../validators/source-tracker';
import { AN5_D_Output } from '../types';

describe('Source Traceability', () => {
  it('flags novelty claims without search documentation', () => {
    const report: AN5_D_Output = {
      report: {
        discovery_concepts: [{
          id: 'D-01',
          the_insight: {
            why_its_new: 'No one has combined gravity-driven flow with counter-current transfer'
          },
          why_novel: {
            prior_art_searched: [],  // EMPTY - no sources
            what_we_found: '',
          }
        }]
      }
    };

    const unsourced = extractClaimsWithoutSources(report);

    expect(unsourced).toContainEqual({
      concept: 'D-01',
      claim: 'No one has combined gravity-driven flow with counter-current transfer',
      reason: 'No search documented in prior_art_searched',
      severity: 'critical'
    });
  });

  it('passes when all novelty claims have searches', () => {
    const report: AN5_D_Output = {
      report: {
        discovery_concepts: [{
          id: 'D-01',
          why_novel: {
            prior_art_searched: [
              'Patent search: "gravity thermosiphon" + "counter-current" (USPTO, Google Patents)',
              'Literature: IEEE Xplore, ASME journals (keyword combo search)',
              'Industry: Heat exchanger manufacturer specs (10 major companies)'
            ],
            what_we_found: '12 patents on gravity thermosiphons, 0 on counter-current variant',
            differentiation: 'All existing patents use straight tubes + active circulation'
          }
        }]
      }
    };

    const unsourced = extractClaimsWithoutSources(report);
    expect(unsourced).toHaveLength(0);
  });
});
```

### Example 4: Evidence Chain Validation

```typescript
// File: apps/web/lib/llm/validators/evidence-chain.ts

export interface EvidenceChain {
  concept_id: string;
  novelty_claim: string;
  search_conducted_in_an1_7?: {
    databases: string[];
    queries: string[];
    findings: string;
  };
  verified_in_an4?: {
    novelty_check: 'confirmed' | 'denied' | 'uncertain';
    confidence: 'high' | 'medium' | 'low';
  };
  reverified_in_an5?: {
    additional_searches: string[];
    confidence_after_reverification: 'high' | 'medium' | 'low';
  };
  final_evidence_quality: 'comprehensive' | 'good' | 'limited' | 'minimal';
}

export function validateEvidenceChain(
  stage5Report: AN5DOutput,
  stage4Eval: AN4DOutput,
  stage1_7Gaps: AN1_7DOutput
): EvidenceChain[] {
  const chains: EvidenceChain[] = [];

  for (const concept of stage5Report.report.discovery_concepts) {
    // Find if this was identified in AN1.7-D
    const gapSource = stage1_7Gaps.literature_gaps?.find(gap =>
      concept.source_domain.includes(gap.gap) ||
      gap.gap.includes(concept.source_domain)
    );

    // Find verification in AN4-D
    const an4Verification = stage4Eval.evaluation?.find(e =>
      e.concept_id === concept.id
    );

    // Check reverification in AN5-D
    const has_searches = (concept.why_novel.prior_art_searched || []).length > 0;

    // Determine evidence quality
    let quality: EvidenceChain['final_evidence_quality'] = 'minimal';
    if (has_searches && an4Verification && gapSource) quality = 'comprehensive';
    else if (has_searches && an4Verification) quality = 'good';
    else if (has_searches) quality = 'limited';

    chains.push({
      concept_id: concept.id,
      novelty_claim: concept.the_insight.why_its_new,

      search_conducted_in_an1_7: gapSource ? {
        databases: gapSource.search_conducted?.databases || [],
        queries: gapSource.search_conducted?.queries || [],
        findings: gapSource.findings?.conclusion || ''
      } : undefined,

      verified_in_an4: an4Verification ? {
        novelty_check: an4Verification.novelty_assessment as any,
        confidence: an4Verification.confidence as any
      } : undefined,

      reverified_in_an5: has_searches ? {
        additional_searches: concept.why_novel.prior_art_searched || [],
        confidence_after_reverification: concept.confidence
      } : undefined,

      final_evidence_quality: quality
    });
  }

  return chains;
}
```

---

## Summary: Prevention Strategy Decision Tree

```
┌─ Making analytical claims? ──┐
│                              │
│ YES → Add source requirement │
│       NO source URL = NO claim
│
└──────────────────────────────┘
           │
           ▼
┌─ Is this novelty/gap claim? ─┐
│                               │
│ YES → Require search docs     │
│       - What you searched     │
│       - Where you looked      │
│       - What you found        │
│       - What you didn't search
│
└───────────────────────────────┘
           │
           ▼
┌─ Is this high-stakes claim? ──┐
│                                │
│ YES → Self-critique required   │
│       - Strongest counter-arg  │
│       - What searches missed   │
│       - Assumptions to verify  │
│       - Expert pushback        │
│       - Invalidation conditions
│
└────────────────────────────────┘
           │
           ▼
┌─ Create schema ──────────────┐
│                               │
│ Use .catch() for defaults     │
│ Mark sources as required      │
│ Flag completeness             │
│ Allow .passthrough()          │
│
└───────────────────────────────┘
           │
           ▼
┌─ Write tests ─────────────────┐
│                                │
│ Source traceability test      │
│ Gap documentation test        │
│ Honesty validation test       │
│ Confidence calibration test   │
│
└────────────────────────────────┘
```

---

## Key Metrics to Track

### Per-Prompt Metrics

1. **Source Coverage**: % of claims with documented sources
2. **Gap Acknowledgment**: % of novelty claims acknowledging search limitations
3. **Honesty Quality**: Substantive vs. pro forma self-critique (manual review)
4. **Search Depth**: Average # of databases searched per concept
5. **Reverification**: % of gaps re-verified at final stage

### Quality Indicators

```typescript
interface PromptQualityMetrics {
  // Raw numbers
  total_claims: number;
  claims_with_sources: number;
  claims_with_search_documentation: number;
  concepts_with_self_critique: number;

  // Percentages
  source_coverage: number;  // 0-100%
  search_documentation_rate: number;  // 0-100%
  self_critique_adoption: number;  // 0-100%

  // Quality
  average_searches_per_concept: number;
  average_honesty_section_length: number;

  // Downstream
  user_queries_about_sources: number;
  corrections_needed_due_to_unsourced_claims: number;
  avg_time_to_validate_claim: number;  // minutes
}
```

---

## Related Documentation

- **Prompt Engineering Patterns**: `docs/solutions/ai/prompt-engineering-patterns.md`
- **Discovery Mode**: `docs/solutions/features/discovery-mode.md`
- **Analysis Chain Architecture**: `docs/solutions/ai/analysis-chain-architecture.md`

## References

**Key Patterns**:
- Chain Context Pattern - Explicit stage awareness
- Writing Rules (DO/DON'T) - Behavioral guardrails
- Self-Critique Section - Required adversarial thinking
- Antifragile Zod Schema - Graceful degradation
- Source Attribution - First-class output

**Implementation Files**:
- `/apps/web/lib/llm/prompts/discovery/an5-d-report.ts` - Discovery final report
- `/apps/web/lib/inngest/functions/generate-discovery-report.ts` - Chain orchestration
- `/apps/web/lib/llm/prompts/discovery/an1.7-d-literature-gaps.ts` - Gap analysis

---

**Version**: 1.0
**Created**: 2025-12-19
**Updated**: 2025-12-19
**Author**: Sparlo Engineering Team
