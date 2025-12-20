import { z } from 'zod';

/**
 * AN5-D - Discovery Mode Report Generation
 *
 * Produces a report focused on:
 * 1. What has everyone MISSED?
 * 2. Novel approaches from non-obvious domains
 * 3. Clear validation paths for high-novelty concepts
 * 4. Why these approaches weren't tried before
 */

export const AN5_D_PROMPT = `You are running Stage 7 of 7 in Discovery Mode — finding what industry has MISSED.

## CHAIN CONTEXT

You have access to the full discovery chain results:
- AN0-D: Problem framing, industry landscape
- AN1.5-D + AN1.7-D: Teaching examples, gap analysis
- AN2-D: Methodology briefing
- AN3-D: Generated concepts
- AN4-D: Validated novelty, evaluated, made portfolio decisions
- YOU (AN5-D): Write the final Discovery Report

## YOUR ROLE

Synthesize everything into a compelling, HONEST report that communicates:
1. What industry is MISSING
2. Genuinely NOVEL approaches discovered
3. WHY these haven't been tried
4. HOW to validate them quickly
5. HONEST uncertainty about what we don't know

## WRITING RULES

**DO:**
- Lead with insight, not background
- Quantify with uncertainty ranges (e.g., "~$50K ± 50%")
- Be specific ("counter-current thermosiphon" not "bio-inspired")
- Acknowledge unknowns explicitly
- Make clear, actionable recommendations

**DON'T:**
- Oversell ("revolutionary breakthrough")
- Hide uncertainty behind jargon
- Skip self-critique
- Write like marketing copy
- Recommend without validation path

## EVIDENCE REQUIREMENTS

RULE: No source URL = no claim. Every factual assertion about industry state, prior art, or gaps must cite where you found it.

CRITICAL: You must respond with ONLY valid JSON. No markdown, no text before or after. Start with { and end with }.

## Output Format

{
  "report": {
    "header": {
      "report_id": "discovery-uuid",
      "title": "Discovery Report: [Problem]",
      "mode": "discovery",
      "generated_at": "ISO timestamp",
      "tagline": "One-line summary of the key discovery"
    },

    "discovery_brief": {
      "original_problem": "User's problem statement",
      "industry_blind_spot": "What the industry has been missing",
      "discovery_thesis": "Our central novel insight",
      "hunting_grounds": ["Where we looked for solutions"],
      "key_finding": "Most important discovery"
    },

    "what_industry_missed": {
      "conventional_approaches": ["What industry does"],
      "why_they_do_it": "Reasons for conventional approach",
      "blind_spots": [
        {
          "assumption": "What they assume",
          "challenge": "Why it might be wrong",
          "opportunity": "What this opens up"
        }
      ],
      "unexplored_territories": ["Areas that haven't been investigated"]
    },

    "discovery_concepts": [
      {
        "id": "D-01",
        "name": "Concept name",
        "category": "biological_transfer|biological|geological|geological_physical|abandoned_tech|abandoned_revival|frontier_material|industrial_process|combination",
        "source_domain": "Where the idea comes from",

        "the_insight": {
          "what_we_found": "The core novel mechanism",
          "why_its_new": "Why this hasn't been tried",
          "the_physics": "How it works physically"
        },

        "novelty_claim": {
          "genuinely_novel": true,
          "novelty_level": "breakthrough|significant|moderate",
          "not_same_as": "How this differs from conventional"
        },

        "how_it_works": {
          "mechanism": "Step-by-step explanation",
          "key_components": ["Component 1", "Component 2"],
          "enabling_factors": "What makes this possible now"
        },

        "breakthrough_potential": {
          "if_works": "What this achieves",
          "improvement": "Quantified improvement over conventional",
          "industry_impact": "How this changes things"
        },

        "why_novel": {
          "prior_art_searched": ["What we searched for"],
          "what_we_found": "Prior art findings or lack thereof",
          "differentiation": "How this differs from what exists"
        },

        "why_might_work_now": "What changed to make this worth pursuing",

        "honest_uncertainties": [
          "Uncertainty 1 - be specific",
          "Uncertainty 2 - be specific",
          "Uncertainty 3 - be specific"
        ],

        "validation_experiment": {
          "test_name": "Name of the validation test",
          "what_it_proves": "The key question answered",
          "method": "How to do it",
          "go_criteria": "Success looks like...",
          "no_go_criteria": "Failure looks like...",
          "cost_estimate": "With uncertainty range, e.g., ~$10K ± 30%",
          "time_estimate": "With uncertainty range"
        },

        "risks_and_unknowns": {
          "physics_risks": ["What might not work"],
          "implementation_challenges": ["Practical challenges"],
          "mitigation_ideas": ["How to address risks"]
        },

        "priority": "must_pursue|should_explore|worth_investigating|park",
        "confidence": "HIGH|MEDIUM|LOW",
        "track": "Frontier|Revival|Inversion|Synthesis"
      }
    ],

    "comparative_analysis": {
      "ranking_by_novelty": ["D-01", "D-03", "D-02"],
      "ranking_by_feasibility": ["D-02", "D-01", "D-03"],
      "ranking_overall": ["D-01", "D-02", "D-03"],

      "comparison_table": [
        {
          "concept_id": "D-01",
          "novelty_score": 9,
          "physics_confidence": 7,
          "breakthrough_potential": 9,
          "testability": 8,
          "overall_score": 8.5
        }
      ],

      "portfolio_strategy": "How to pursue multiple concepts in parallel"
    },

    "validation_roadmap": {
      "phase_1_quick_kills": {
        "goal": "Kill bad ideas fast",
        "timeline": "Weeks 1-4",
        "budget": "Estimate with range",
        "tests": [
          {
            "concept": "D-01",
            "test": "Test description",
            "go_no_go": "Clear criteria",
            "cost": "$X",
            "time": "X weeks"
          }
        ]
      },
      "phase_2_mechanism_validation": {
        "goal": "Prove core mechanisms work at lab scale",
        "timeline": "Weeks 5-10",
        "budget": "Estimate with range",
        "scope": "What to validate"
      },
      "phase_3_integration": {
        "goal": "Prove it works in realistic conditions",
        "timeline": "Weeks 11+",
        "budget": "Estimate with range",
        "success_criteria": "What proves this works"
      },
      "total_investment_to_poc": "Summary of total cost and time to proof-of-concept"
    },

    "why_this_matters": {
      "if_we_succeed": "Impact of successful validation",
      "competitive_advantage": "First-mover opportunity",
      "industry_implications": "How this changes the field",
      "risk_of_not_pursuing": "What we lose by not exploring"
    },

    "self_critique": {
      "strongest_argument_against": "What would a skeptic say? Make it genuinely strong.",
      "prior_art_we_might_have_missed": ["What searches should we have run?"],
      "physics_assumptions_to_verify": ["What's assumed but not proven?"],
      "domain_expert_pushback": ["Anticipated objections from experts"],
      "what_would_change_recommendation": ["Conditions that would invalidate this analysis"]
    },

    "prior_art_search_evidence": {
      "industry_landscape_searches": [
        {"search_query": "[problem] companies 2024", "top_finding": "Found X, Y, Z actively working", "implication": "Excluded from recommendations"}
      ],
      "gap_validation_searches": [
        {"claimed_gap": "No one using metallic PCMs", "search_query": "gallium indium battery thermal", "results": "3 results, none on runaway protection", "conclusion": "Gap appears genuine"}
      ],
      "concept_prior_art_checks": [
        {"concept": "D-05 Ga-In PCM", "key_search": "gallium phase change battery", "finding": "No direct prior art found", "novelty_status": "NOVEL (pending deeper search)"},
        {"concept": "D-01 Directed Venting", "key_search": "battery thermal runaway vent directed", "finding": "Tesla patents on vent paths", "novelty_status": "PARTIALLY EXPLORED"}
      ],
      "searches_not_run": {
        "acknowledged_gaps": [
          "Did not search patent databases directly (Google Patents, USPTO)",
          "Did not search academic databases (Google Scholar, IEEE)"
        ],
        "recommended_client_verification": ["specific searches client should run to verify our findings"]
      }
    },

    "executive_summary": {
      "hook": "One-line insight capturing the key discovery",
      "key_discovery": "What we found that others missed (2-3 sentences)",
      "recommended_action": "What to do first",
      "validation_path": "How to prove/disprove quickly",
      "investment_required": "Cost and time estimates with uncertainty ranges",
      "confidence_assessment": "Honest level with key uncertainties"
    },

    "appendix": {
      "excluded_conventional_approaches": ["What we deliberately excluded"],
      "methodology_notes": "How we conducted the discovery process",
      "sources_explored": ["Domains we hunted in"],
      "prior_art_searches": ["Document all searches and findings from AN4-D"],
      "further_exploration_ideas": ["Other areas worth investigating"]
    }
  },

  "metadata": {
    "report_id": "uuid",
    "analysis_id": "uuid",
    "mode": "discovery",
    "generated_at": "ISO timestamp",
    "concepts_generated": 6,
    "concepts_recommended": 3,
    "primary_recommendation": "D-01",
    "novelty_confidence": "high|medium|low"
  }
}

## FINAL REMINDERS

1. The self_critique section is REQUIRED - be genuinely hard on yourself
2. The prior_art_search_evidence section is REQUIRED - document all searches and findings
3. Lead with insight, not background in executive_summary
4. Quantify with uncertainty ranges ("~$50K ± 50%") throughout
5. Be specific in terminology ("counter-current thermosiphon" not "bio-inspired")
6. Acknowledge unknowns explicitly in honest_uncertainties
7. Never recommend without a clear validation_experiment
8. RULE: No source URL = no claim. Every factual assertion must cite where you found it.

REMEMBER: Output ONLY the JSON object. This is a DISCOVERY report - emphasize novelty, honesty, and what's been missed.`;

/**
 * Zod schema for AN5-D output validation
 *
 * SCHEMA VERSION: 2.0
 *
 * ANTIFRAGILE DESIGN:
 * - All fields use .optional() or .default() where reasonable
 * - Objects use .passthrough() to allow extra fields from LLM
 * - Enums use .catch() to fall back gracefully on unexpected values
 * - Arrays default to empty arrays on parse failure
 *
 * DEPRECATION TIMELINE:
 * - v1.0 fields (marked @deprecated): Remove after 2025-03-01
 * - Legacy fields include: validation_path, first_test, go_no_go, timeline, cost,
 *   immediate_actions, phase_1/2/3 (old structure), one_liner, timeline_to_validation
 */

const HeaderSchema = z
  .object({
    report_id: z.string().optional(),
    title: z.string(),
    mode: z.literal('discovery').catch('discovery'),
    generated_at: z.string().optional(),
    tagline: z.string().optional(),
  })
  .passthrough();

const DiscoveryBriefSchema = z
  .object({
    original_problem: z.string(),
    industry_blind_spot: z.string().optional(),
    discovery_thesis: z.string().optional(),
    hunting_grounds: z.array(z.string()).catch([]),
    key_finding: z.string().optional(),
  })
  .passthrough();

const BlindSpotSchema = z
  .object({
    assumption: z.string(),
    challenge: z.string().optional(),
    opportunity: z.string().optional(),
  })
  .passthrough();

const WhatIndustryMissedSchema = z
  .object({
    conventional_approaches: z.array(z.string()).catch([]),
    why_they_do_it: z.string().optional(),
    blind_spots: z.array(BlindSpotSchema).catch([]),
    unexplored_territories: z.array(z.string()).catch([]),
  })
  .passthrough();

const InsightSchema = z
  .object({
    what_we_found: z.string(),
    why_its_new: z.string().optional(),
    the_physics: z.string().optional(),
  })
  .passthrough();

const NoveltyClaimSchema = z
  .object({
    // Default to false - be conservative about claiming novelty
    genuinely_novel: z.boolean().catch(false),
    novelty_level: z
      .enum(['breakthrough', 'significant', 'moderate'])
      .catch('moderate'),
    not_same_as: z.string().optional(),
  })
  .passthrough();

const HowItWorksSchema = z
  .object({
    mechanism: z.string(),
    key_components: z.array(z.string()).catch([]),
    enabling_factors: z.string().optional(),
  })
  .passthrough();

const BreakthroughPotentialSchema = z
  .object({
    if_works: z.string(),
    improvement: z.string().optional(),
    industry_impact: z.string().optional(),
  })
  .passthrough();

// New: Why Novel schema
const WhyNovelSchema = z
  .object({
    prior_art_searched: z.array(z.string()).catch([]),
    what_we_found: z.string().optional(),
    differentiation: z.string().optional(),
  })
  .passthrough();

// Validation Experiment schema (v2.0 - replaces ValidationPath)
const ValidationExperimentSchema = z
  .object({
    // v2.0 fields
    test_name: z.string().optional(),
    what_it_proves: z.string().optional(),
    method: z.string().optional(),
    go_criteria: z.string().optional(),
    no_go_criteria: z.string().optional(),
    cost_estimate: z.string().optional(),
    time_estimate: z.string().optional(),
    // @deprecated v1.0 fields - remove after 2025-03-01
    first_test: z.string().optional(),
    go_no_go: z.string().optional(),
    timeline: z.string().optional(),
    cost: z.string().optional(),
  })
  .passthrough();

const RisksSchema = z
  .object({
    physics_risks: z.array(z.string()).catch([]),
    implementation_challenges: z.array(z.string()).catch([]),
    mitigation_ideas: z.array(z.string()).catch([]),
  })
  .passthrough();

const DiscoveryConceptReportSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    category: z
      .enum([
        'biological_transfer',
        'biological',
        'geological',
        'geological_physical',
        'abandoned_tech',
        'abandoned_revival',
        'frontier_material',
        'industrial_process',
        'combination',
      ])
      .catch('combination'),
    source_domain: z.string().optional(),
    the_insight: InsightSchema.optional(),
    novelty_claim: NoveltyClaimSchema.optional(),
    how_it_works: HowItWorksSchema.optional(),
    breakthrough_potential: BreakthroughPotentialSchema.optional(),
    // v2.0 fields
    why_novel: WhyNovelSchema.optional(),
    why_might_work_now: z.string().optional(),
    honest_uncertainties: z.array(z.string()).catch([]),
    validation_experiment: ValidationExperimentSchema.optional(),
    // @deprecated v1.0 field - remove after 2025-03-01
    validation_path: ValidationExperimentSchema.optional(),
    risks_and_unknowns: RisksSchema.optional(),
    priority: z
      .enum(['must_pursue', 'should_explore', 'worth_investigating', 'park'])
      .catch('worth_investigating'),
    confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).catch('MEDIUM'),
    track: z
      .enum(['Frontier', 'Revival', 'Inversion', 'Synthesis'])
      .catch('Synthesis'),
  })
  .passthrough();

const ComparisonRowSchema = z
  .object({
    concept_id: z.string(),
    novelty_score: z.number().catch(5),
    physics_confidence: z.number().catch(5),
    breakthrough_potential: z.number().catch(5),
    testability: z.number().catch(5),
    overall_score: z.number().catch(5),
  })
  .passthrough();

// New: Phase 1 Quick Kills test schema
const QuickKillTestSchema = z
  .object({
    concept: z.string(),
    test: z.string().optional(),
    go_no_go: z.string().optional(),
    cost: z.string().optional(),
    time: z.string().optional(),
  })
  .passthrough();

// New: Phase schemas for validation roadmap
const Phase1Schema = z
  .object({
    goal: z.string().optional(),
    timeline: z.string().optional(),
    budget: z.string().optional(),
    tests: z.array(QuickKillTestSchema).catch([]),
  })
  .passthrough();

const Phase2Schema = z
  .object({
    goal: z.string().optional(),
    timeline: z.string().optional(),
    budget: z.string().optional(),
    scope: z.string().optional(),
  })
  .passthrough();

const Phase3Schema = z
  .object({
    goal: z.string().optional(),
    timeline: z.string().optional(),
    budget: z.string().optional(),
    success_criteria: z.string().optional(),
  })
  .passthrough();

// @deprecated v1.0 phase schema - remove after 2025-03-01
const LegacyPhaseSchema = z
  .object({
    objective: z.string().optional(),
    timeline: z.string().optional(),
    budget: z.string().optional(),
    go_no_go_gates: z.array(z.string()).catch([]),
    prototype_scope: z.string().optional(),
    success_criteria: z.string().optional(),
  })
  .passthrough();

// @deprecated v1.0 immediate action schema - remove after 2025-03-01
const ImmediateActionSchema = z
  .object({
    action: z.string(),
    concept: z.string().optional(),
    timeline: z.string().optional(),
    cost: z.string().optional(),
    expected_outcome: z.string().optional(),
  })
  .passthrough();

// New: Self-critique schema (REQUIRED)
const SelfCritiqueSchema = z
  .object({
    strongest_argument_against: z.string(),
    prior_art_we_might_have_missed: z.array(z.string()).catch([]),
    physics_assumptions_to_verify: z.array(z.string()).catch([]),
    domain_expert_pushback: z.array(z.string()).catch([]),
    what_would_change_recommendation: z.array(z.string()).catch([]),
  })
  .passthrough();

// New: Prior Art Search Evidence schemas (REQUIRED but antifragile)
const IndustryLandscapeSearchSchema = z
  .object({
    search_query: z.string(),
    top_finding: z.string().optional(),
    implication: z.string().optional(),
  })
  .passthrough();

const GapValidationSearchSchema = z
  .object({
    claimed_gap: z.string(),
    search_query: z.string().optional(),
    results: z.string().optional(),
    conclusion: z.string().optional(),
  })
  .passthrough();

const ConceptPriorArtCheckSchema = z
  .object({
    concept: z.string(),
    key_search: z.string().optional(),
    finding: z.string().optional(),
    novelty_status: z.string().optional(),
  })
  .passthrough();

const SearchesNotRunSchema = z
  .object({
    acknowledged_gaps: z.array(z.string()).catch([]),
    recommended_client_verification: z.array(z.string()).catch([]),
  })
  .passthrough();

const PriorArtSearchEvidenceSchema = z
  .object({
    industry_landscape_searches: z.array(IndustryLandscapeSearchSchema).catch([]),
    gap_validation_searches: z.array(GapValidationSearchSchema).catch([]),
    concept_prior_art_checks: z.array(ConceptPriorArtCheckSchema).catch([]),
    searches_not_run: SearchesNotRunSchema.optional(),
  })
  .passthrough();

// Executive Summary schema (v2.0)
const ExecutiveSummarySchema = z
  .object({
    // v2.0 fields
    hook: z.string().optional(),
    validation_path: z.string().optional(),
    confidence_assessment: z.string().optional(),
    // Common fields
    key_discovery: z.string(),
    recommended_action: z.string().optional(),
    investment_required: z.string().optional(),
    // @deprecated v1.0 fields - remove after 2025-03-01
    one_liner: z.string().optional(),
    timeline_to_validation: z.string().optional(),
  })
  .passthrough();

// Updated Appendix schema
const AppendixSchema = z
  .object({
    excluded_conventional_approaches: z.array(z.string()).catch([]),
    methodology_notes: z.string().optional(),
    sources_explored: z.array(z.string()).catch([]),
    prior_art_searches: z.array(z.string()).catch([]),
    further_exploration_ideas: z.array(z.string()).catch([]),
  })
  .passthrough();

const ReportSchema = z
  .object({
    header: HeaderSchema,
    discovery_brief: DiscoveryBriefSchema.optional(),
    what_industry_missed: WhatIndustryMissedSchema.optional(),
    discovery_concepts: z.array(DiscoveryConceptReportSchema).catch([]),
    comparative_analysis: z
      .object({
        ranking_by_novelty: z.array(z.string()).catch([]),
        ranking_by_feasibility: z.array(z.string()).catch([]),
        ranking_overall: z.array(z.string()).catch([]),
        comparison_table: z.array(ComparisonRowSchema).catch([]),
        portfolio_strategy: z.string().optional(),
      })
      .passthrough()
      .optional(),
    validation_roadmap: z
      .object({
        // v2.0 structure
        phase_1_quick_kills: Phase1Schema.optional(),
        phase_2_mechanism_validation: Phase2Schema.optional(),
        phase_3_integration: Phase3Schema.optional(),
        total_investment_to_poc: z.string().optional(),
        // @deprecated v1.0 structure - remove after 2025-03-01
        immediate_actions: z.array(ImmediateActionSchema).catch([]),
        phase_1: LegacyPhaseSchema.optional(),
        phase_2: LegacyPhaseSchema.optional(),
        phase_3: LegacyPhaseSchema.optional(),
      })
      .passthrough()
      .optional(),
    why_this_matters: z
      .object({
        if_we_succeed: z.string().optional(),
        competitive_advantage: z.string().optional(),
        industry_implications: z.string().optional(),
        risk_of_not_pursuing: z.string().optional(),
      })
      .passthrough()
      .optional(),
    // Self-critique is REQUIRED - this section must not be skipped
    self_critique: SelfCritiqueSchema,
    // Prior Art Search Evidence is REQUIRED - document all searches (optional for antifragile rendering)
    prior_art_search_evidence: PriorArtSearchEvidenceSchema.optional(),
    executive_summary: ExecutiveSummarySchema,
    appendix: AppendixSchema.optional(),
  })
  .passthrough();

export const AN5_D_OutputSchema = z
  .object({
    report: ReportSchema,
    metadata: z
      .object({
        report_id: z.string().optional(),
        analysis_id: z.string().optional(),
        mode: z.literal('discovery').catch('discovery'),
        generated_at: z.string().optional(),
        concepts_generated: z.number().catch(0),
        concepts_recommended: z.number().catch(0),
        primary_recommendation: z.string().optional(),
        novelty_confidence: z.enum(['high', 'medium', 'low']).catch('medium'),
      })
      .passthrough(),
  })
  .passthrough();

export type AN5_D_Output = z.infer<typeof AN5_D_OutputSchema>;
export type DiscoveryReport = z.infer<typeof ReportSchema>;

/**
 * AN5-D metadata for progress tracking
 */
export const AN5_D_METADATA = {
  id: 'an5-d',
  name: 'Discovery Report',
  description: 'Generating discovery-focused innovation report',
  estimatedMinutes: 3,
};
