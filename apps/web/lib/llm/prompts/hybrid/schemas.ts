import { z } from 'zod';

/**
 * Hybrid Mode Zod Schemas
 *
 * All schemas use antifragile patterns:
 * - .catch([]) for array fallbacks
 * - .optional() for optional fields
 * - .passthrough() to preserve extra LLM output
 * - .default() for sensible defaults
 */

// ============================================
// Shared Primitives
// ============================================

export const TrackSchema = z.enum([
  'simpler_path',
  'best_fit',
  'paradigm_shift',
  'frontier_transfer',
]);

export const ConfidenceLevel = z.enum(['low', 'medium', 'high']);

export const CapitalRequirement = z.enum([
  'minimal',
  'low',
  'medium',
  'high',
  'very_high',
]);

export const ViabilityVerdict = z.enum([
  'viable',
  'conditionally_viable',
  'not_viable',
  'uncertain',
]);

export const RiskItemSchema = z
  .object({
    risk: z.string(),
    likelihood: z.enum(['low', 'medium', 'high']).catch('medium'),
    impact: z.enum(['low', 'medium', 'high']).catch('medium'),
    mitigation: z.string().optional(),
  })
  .passthrough();

export const TestGateSchema = z
  .object({
    name: z.string(),
    description: z.string(),
    success_criteria: z.string(),
    estimated_cost: z.string().optional(),
    estimated_time: z.string().optional(),
  })
  .passthrough();

export const PriorArtSchema = z
  .object({
    source: z.string(),
    relevance: z.string(),
    what_it_proves: z.string().optional(),
    url: z.string().optional(),
  })
  .passthrough();

// ============================================
// AN0-M: Problem Framing
// ============================================

const ProblemAnalysisSchema = z
  .object({
    core_challenge: z.string(),
    constraints: z.array(z.string()).catch([]),
    success_metrics: z.array(z.string()).catch([]),
    industry_assumptions: z.array(z.string()).catch([]),
  })
  .passthrough();

const LandscapeMapSchema = z
  .object({
    current_approaches: z.array(z.string()).catch([]),
    known_limitations: z.array(z.string()).catch([]),
    unexplored_territories: z.array(z.string()).catch([]),
  })
  .passthrough();

const DiscoverySeedSchema = z
  .object({
    domain: z.string(),
    potential_mechanism: z.string(),
    why_relevant: z.string(),
  })
  .passthrough();

const AN0_M_AnalysisSchema = z
  .object({
    needs_clarification: z.literal(false),
    problem_analysis: ProblemAnalysisSchema,
    landscape_map: LandscapeMapSchema,
    discovery_seeds: z.array(DiscoverySeedSchema).catch([]),
    physics_essence: z
      .object({
        governing_principles: z.array(z.string()).catch([]),
        rate_limiting_factor: z.string().optional(),
        key_constraints: z.array(z.string()).catch([]),
      })
      .passthrough()
      .optional(),
    industry_blind_spots: z
      .array(
        z
          .object({
            what_industry_assumes: z.string(),
            why_it_might_be_wrong: z.string(),
            alternative_approach: z.string().optional(),
          })
          .passthrough(),
      )
      .catch([]),
  })
  .passthrough();

const AN0_M_ClarificationSchema = z.object({
  needs_clarification: z.literal(true),
  clarification_question: z.string(),
  what_understood_so_far: z.string().optional(),
});

export const AN0_M_OutputSchema = z.discriminatedUnion('needs_clarification', [
  AN0_M_AnalysisSchema,
  AN0_M_ClarificationSchema,
]);

export type AN0_M_Output = z.infer<typeof AN0_M_OutputSchema>;

// ============================================
// AN1.5-M: Teaching Selection
// ============================================

const SelectedExampleSchema = z
  .object({
    domain: z.string(),
    mechanism: z.string(),
    relevance_to_challenge: z.string(),
    teaching_value: z.string(),
    track_affinity: TrackSchema.optional(),
  })
  .passthrough();

const CrossDomainConnectionSchema = z
  .object({
    from_domain: z.string(),
    to_challenge: z.string(),
    transfer_potential: z.string(),
  })
  .passthrough();

export const AN1_5_M_OutputSchema = z
  .object({
    selected_examples: z.array(SelectedExampleSchema).catch([]),
    cross_domain_connections: z.array(CrossDomainConnectionSchema).catch([]),
    conventional_examples: z.array(SelectedExampleSchema).catch([]),
    novel_examples: z.array(SelectedExampleSchema).catch([]),
  })
  .passthrough();

export type AN1_5_M_Output = z.infer<typeof AN1_5_M_OutputSchema>;

// ============================================
// AN1.7-M: Literature Search
// ============================================

const PrecedentFindingSchema = z
  .object({
    source_type: z.string(),
    finding: z.string(),
    implications: z.string(),
    prior_art: PriorArtSchema.optional(),
  })
  .passthrough();

const GapAnalysisSchema = z
  .object({
    gap_description: z.string(),
    why_unexplored: z.string(),
    opportunity_signal: z.string(),
  })
  .passthrough();

const AbandonedApproachSchema = z
  .object({
    approach: z.string(),
    why_abandoned: z.string(),
    changed_conditions: z.string().optional(),
    revival_potential: z.string().optional(),
  })
  .passthrough();

// Detailed abandoned technology analysis
const EnablingChangeSchema = z.object({
  change: z.string(),
  relevance: z.string(),
});

const AbandonedTechnologyAnalysisSchema = z
  .object({
    technology_name: z.string(),
    original_era: z.string(),
    original_application: z.string(),
    why_abandoned: z.string(),
    enabling_changes_since: z.array(EnablingChangeSchema).catch([]),
    revival_potential: z.enum(['HIGH', 'MEDIUM', 'LOW']).catch('MEDIUM'),
    revival_concept: z.string(),
    who_is_positioned: z.string().optional(),
    source_urls: z.array(z.string()).default([]),
  })
  .passthrough();

export const AN1_7_M_OutputSchema = z
  .object({
    precedent_findings: z.array(PrecedentFindingSchema).catch([]),
    gap_analysis: z.array(GapAnalysisSchema).catch([]),
    abandoned_approaches: z.array(AbandonedApproachSchema).catch([]),
    abandoned_technology_analysis: z
      .array(AbandonedTechnologyAnalysisSchema)
      .default([]),
    key_papers: z
      .array(
        z
          .object({
            title: z.string(),
            authors: z.string().optional(),
            year: z.string().optional(),
            key_insight: z.string(),
            url: z.string().optional(),
          })
          .passthrough(),
      )
      .catch([]),
  })
  .passthrough();

export type AN1_7_M_Output = z.infer<typeof AN1_7_M_OutputSchema>;

// ============================================
// AN2-M: Methodology Briefing
// ============================================

const GenerationGuidanceSchema = z
  .object({
    must_explore_domains: z.array(z.string()).catch([]),
    mandatory_constraints: z.array(z.string()).catch([]),
    creativity_prompts: z.array(z.string()).catch([]),
  })
  .passthrough();

const TrackSpecificGuidanceSchema = z
  .object({
    simpler_path: z.string(),
    best_fit: z.string(),
    paradigm_shift: z.string(),
    frontier_transfer: z.string(),
  })
  .passthrough();

const TrizParameterSchema = z
  .object({
    parameter_id: z.number(),
    parameter_name: z.string(),
    relevance: z.string(),
  })
  .passthrough();

export const AN2_M_OutputSchema = z
  .object({
    generation_guidance: GenerationGuidanceSchema,
    track_specific_guidance: TrackSpecificGuidanceSchema,
    triz_parameters: z.array(TrizParameterSchema).catch([]),
    first_principles_questions: z.array(z.string()).catch([]),
    industry_assumptions_to_challenge: z.array(z.string()).catch([]),
  })
  .passthrough();

export type AN2_M_Output = z.infer<typeof AN2_M_OutputSchema>;

// ============================================
// AN3-M: Concept Generation
// ============================================

// Quantified parameters for mechanism depth
const QuantifiedParameterSchema = z.object({
  parameter: z.string(),
  value: z.string(),
  significance: z.string(),
});

// Mechanistic depth schema for paradigm/frontier concepts
const MechanisticDepthSchema = z
  .object({
    working_principle: z.string(),
    molecular_mechanism: z.string().optional(),
    quantified_parameters: z.array(QuantifiedParameterSchema).default([]),
    rate_limiting_step: z.string(),
    key_parameters: z.array(z.string()).catch([]),
    thermodynamic_advantage: z.string().optional(),
    failure_modes: z.array(z.string()).catch([]),
  })
  .passthrough();

const ConceptSchema = z
  .object({
    id: z.string(),
    title: z.string().max(500),
    track: TrackSchema,
    description: z.string(),
    mechanism: z.string(),
    mechanistic_depth: MechanisticDepthSchema.optional(),
    source_domain: z.string().optional(),
    prior_art: z.array(PriorArtSchema).catch([]),
    feasibility_score: z.number().min(1).max(10).catch(5),
    impact_score: z.number().min(1).max(10).catch(5),
    validation_speed: z
      .enum(['days', 'weeks', 'months', 'years'])
      .catch('months'),
    why_not_tried: z.string().optional(),
    key_risk: z.string().optional(),
  })
  .passthrough();

export const AN3_M_OutputSchema = z
  .object({
    concepts: z.array(ConceptSchema).catch([]),
    track_coverage: z
      .object({
        simpler_path_count: z.number().catch(0),
        best_fit_count: z.number().catch(0),
        paradigm_shift_count: z.number().catch(0),
        frontier_transfer_count: z.number().catch(0),
      })
      .passthrough(),
    first_principles_concepts: z.array(z.string()).catch([]),
    industry_assumption_challenges: z.array(z.string()).catch([]),
    cross_domain_transfers: z.array(z.string()).catch([]),
  })
  .passthrough();

export type AN3_M_Output = z.infer<typeof AN3_M_OutputSchema>;
export type HybridConcept = z.infer<typeof ConceptSchema>;

// ============================================
// AN4-M: Evaluation
// ============================================

const FeasibilityAssessmentSchema = z
  .object({
    score: z.number().min(1).max(10).catch(5),
    analysis: z.string(),
    blockers: z.array(z.string()).catch([]),
  })
  .passthrough();

// Paradigm significance enum
const ParadigmSignificance = z.enum([
  'TRANSFORMATIVE',
  'SIGNIFICANT',
  'INCREMENTAL',
  'OPTIMIZATION',
]);

// Paradigm assessment for each concept
const ParadigmAssessmentSchema = z
  .object({
    paradigm_significance: ParadigmSignificance.catch('INCREMENTAL'),
    what_it_challenges: z.string().optional(),
    why_industry_missed_it: z.string().optional(),
    strategic_insight_flag: z.boolean().catch(false),
    first_mover_opportunity: z.string().optional(),
    strategic_rationale: z.string().optional(),
  })
  .passthrough();

const ValidationResultSchema = z
  .object({
    concept_id: z.string(),
    physics_feasibility: FeasibilityAssessmentSchema,
    engineering_feasibility: FeasibilityAssessmentSchema,
    economic_viability: z
      .object({
        score: z.number().min(1).max(10).catch(5),
        analysis: z.string(),
      })
      .passthrough(),
    overall_merit_score: z.number().min(1).max(10).catch(5),
    recommendation: z
      .enum(['pursue', 'investigate', 'defer', 'reject'])
      .catch('investigate'),
    key_uncertainties: z.array(z.string()).catch([]),
    paradigm_assessment: ParadigmAssessmentSchema.optional(),
  })
  .passthrough();

const RankingItemSchema = z
  .object({
    concept_id: z.string(),
    rank: z.number(),
    rationale: z.string(),
  })
  .passthrough();

const SelfCritiqueSchema = z
  .object({
    blind_spots: z.array(z.string()).catch([]),
    uncertainty_areas: z.array(z.string()).catch([]),
    what_could_be_wrong: z.array(z.string()).catch([]),
  })
  .passthrough();

// Paradigm insights identified during evaluation
const ParadigmInsightIdentifiedSchema = z
  .object({
    concept_id: z.string(),
    insight_name: z.string(),
    the_assumption: z.string(),
    the_reality: z.string(),
    years_missed: z.string().optional(),
    why_missed: z.string(),
    opportunity: z.string(),
    evidence_strength: z.enum(['HIGH', 'MEDIUM', 'LOW']).catch('MEDIUM'),
    recommendation: z.string(),
  })
  .passthrough();

export const AN4_M_OutputSchema = z
  .object({
    validation_results: z.array(ValidationResultSchema).catch([]),
    ranking: z.array(RankingItemSchema).catch([]),
    self_critique: SelfCritiqueSchema,
    track_analysis: z
      .object({
        best_simpler_path: z.string().optional(),
        best_best_fit: z.string().optional(),
        best_paradigm_shift: z.string().optional(),
        best_frontier_transfer: z.string().optional(),
      })
      .passthrough()
      .optional(),
    paradigm_insights_identified: z
      .array(ParadigmInsightIdentifiedSchema)
      .default([]),
  })
  .passthrough();

export type AN4_M_Output = z.infer<typeof AN4_M_OutputSchema>;
export type HybridValidationResult = z.infer<typeof ValidationResultSchema>;

// ============================================
// AN5-M: Executive Report (Major Restructure)
// ============================================

// --- Header ---
const HeaderSchema = z
  .object({
    title: z.string(),
    date: z.string().optional(),
    version: z.string().optional(),
  })
  .passthrough();

// --- Executive Summary (Enhanced) ---
const RecommendedPathStepSchema = z
  .object({
    step: z.number(),
    action: z.string(),
    rationale: z.string().optional(),
  })
  .passthrough();

const ExecutiveSummarySchema = z
  .object({
    narrative_lead: z.string(), // Opening paragraph with voice
    viability: ViabilityVerdict.catch('uncertain'),
    viability_label: z.string().optional(),
    the_problem: z.string(),
    core_insight: z
      .object({
        headline: z.string(),
        explanation: z.string(),
      })
      .passthrough(),
    primary_recommendation: z.string(), // One sentence with confidence
    recommended_path: z.array(RecommendedPathStepSchema).catch([]),
  })
  .passthrough();

// --- Constraints ---
const ConstraintsSchema = z
  .object({
    hard_constraints: z.array(z.string()).catch([]),
    soft_constraints: z.array(z.string()).catch([]),
    assumptions: z.array(z.string()).catch([]),
  })
  .passthrough();

// --- Problem Analysis (Enhanced) ---
const RootCauseHypothesisSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string(),
    confidence_percent: z.number().int().min(0).max(100).catch(50),
    explanation: z.string(),
  })
  .passthrough();

const SuccessMetricSchema = z
  .object({
    metric: z.string(),
    minimum_viable: z.string(),
    target: z.string(),
    stretch: z.string(),
    unit: z.string().optional(),
  })
  .passthrough();

const ReportProblemAnalysisSchema = z
  .object({
    whats_wrong: z
      .object({
        prose: z.string(), // Can include inline equations
        technical_note: z
          .object({
            equation: z.string().optional(),
            explanation: z.string(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough(),
    why_its_hard: z
      .object({
        prose: z.string(),
        factors: z.array(z.string()).catch([]),
      })
      .passthrough(),
    first_principles_insight: z
      .object({
        headline: z.string(),
        explanation: z.string(),
      })
      .passthrough(),
    root_cause_hypotheses: z.array(RootCauseHypothesisSchema).catch([]),
    success_metrics: z.array(SuccessMetricSchema).catch([]),
  })
  .passthrough();

// --- What Industry Missed (Enhanced) ---
const BlindSpotSchema = z
  .object({
    assumption: z.string(),
    challenge: z.string(),
    opportunity: z.string(),
  })
  .passthrough();

const WhatIndustryMissedSectionSchema = z
  .object({
    conventional_approaches: z
      .array(
        z
          .object({
            approach: z.string(),
            limitation: z.string(),
          })
          .passthrough(),
      )
      .catch([]),
    why_they_do_it: z.string(), // Paradigm history paragraph
    blind_spots: z.array(BlindSpotSchema).catch([]),
  })
  .passthrough();

// Legacy format for backward compatibility
const LegacyWhatIndustryMissedSchema = z
  .object({
    the_assumption: z.string(),
    how_long_held: z.string().optional(),
    the_reality: z.string(),
    evidence: z.string(),
    opportunity_created: z.string(),
    first_mover_advantage: z.string().optional(),
  })
  .passthrough();

// --- Key Patterns (Enhanced) ---
const KeyPatternSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    origin: z.string(), // Where this pattern comes from
    description: z.string(),
    why_it_matters: z.string(),
    precedent: z.string(), // Specific papers, patents, companies
    application_hint: z.string().optional(), // How it applies here
    patent_refs: z.array(z.string()).optional(),
  })
  .passthrough();

// --- Solution Concepts (Major Restructure) ---

// Tags for visual rendering
const InnovationType = z.enum([
  'Combination',
  'Transfer',
  'Optimization',
  'Revival',
  'Paradigm',
]);
const NoveltyLevel = z.enum([
  'Significant Novelty',
  'Moderate Novelty',
  'Known Approach',
]);
const PursuitRecommendation = z.enum([
  'Must Pursue',
  'Strong Consider',
  'Worth Exploring',
  'Long-term Watch',
]);

const ConceptTagsSchema = z
  .object({
    innovation_type: InnovationType.catch('Combination'),
    novelty_level: NoveltyLevel.catch('Moderate Novelty'),
    pursuit_recommendation: PursuitRecommendation.catch('Worth Exploring'),
  })
  .passthrough();

const InsightBlockSchema = z
  .object({
    what: z.string(),
    why_new: z.string(), // Include search evidence
    physics: z.string(), // Mechanism with specifics
  })
  .passthrough();

const BreakthroughPotentialSchema = z
  .object({
    if_it_works: z.string(),
    estimated_improvement: z.string(), // Quantified with uncertainty
    industry_impact: z.string(),
  })
  .passthrough();

const ConceptRisksSchema = z
  .object({
    physics_risks: z.array(z.string()).catch([]),
    implementation_challenges: z.array(z.string()).catch([]),
    mitigation_ideas: z.array(z.string()).catch([]),
  })
  .passthrough();

const ValidationApproachSchema = z
  .object({
    first_test: z.string(),
    timeline: z.string(),
    cost: z.string(),
    go_no_go: z.string(),
  })
  .passthrough();

// Enhanced validation gates with decision points
const ValidationGateSchema = z
  .object({
    week: z.string(),
    test: z.string(),
    method: z.string(),
    success_criteria: z.string(),
    cost: z.string().optional(),
    decision_point: z.string().optional(), // "If X, pivot to Y"
  })
  .passthrough();

// Full parallel exploration block (replaces other_concepts)
const ParallelExplorationSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    tags: ConceptTagsSchema,
    source_domain: z.string(),

    the_insight: InsightBlockSchema,
    how_it_works: z.array(z.string()).catch([]), // Numbered steps
    components: z.array(z.string()).catch([]),
    enabling_factors: z.string(),

    breakthrough_potential: BreakthroughPotentialSchema,
    risks: ConceptRisksSchema,

    why_parallel_not_primary: z.string(),
    when_to_elevate: z.string(),

    validation_approach: ValidationApproachSchema,
  })
  .passthrough();

// Enhanced lead concept with validation gates
const LeadConceptSchema = z
  .object({
    id: z.string(),
    title: z.string().max(500),
    track: TrackSchema,
    track_label: z.string().optional(),
    score: z.number().int().min(0).max(100).catch(50),
    confidence: ConfidenceLevel.catch('medium'),

    bottom_line: z.string().optional(),
    what_it_is: z.string().optional(),
    why_it_works: z.string().optional(),
    why_it_might_fail: z.array(z.string()).catch([]),

    // Legacy fields for backward compatibility
    executive_summary: z.string().optional(),
    why_it_wins: z.string().optional(),

    patterns_referenced: z.array(z.string()).optional(),
    confidence_rationale: z.string().optional(),
    what_would_change_this: z.string().optional(),
    key_risks: z.array(RiskItemSchema).catch([]),

    validation_gates: z.array(ValidationGateSchema).catch([]),
    // Legacy field
    how_to_test: z.array(TestGateSchema).catch([]),

    prior_art_summary: z.array(PriorArtSchema).catch([]),
    estimated_timeline: z.string().optional(),
    estimated_investment: z.string().optional(),
  })
  .passthrough();

// Enhanced spark concept (renamed from innovation_concept)
const SparkConceptSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    score: z.number().int().min(0).max(100).catch(50),
    confidence: ConfidenceLevel.catch('medium'),
    tags: ConceptTagsSchema.optional(),
    source_domain: z.string(),

    the_insight: InsightBlockSchema.optional(),
    how_it_works: z.array(z.string()).catch([]),
    components: z.array(z.string()).catch([]),
    enabling_factors: z.string().optional(),

    breakthrough_potential: BreakthroughPotentialSchema.optional(),
    risks: ConceptRisksSchema.optional(),

    recommended_parallel_action: z.string().optional(),
    validation_approach: ValidationApproachSchema.optional(),

    // Legacy fields
    one_liner: z.string().optional(),
    when_to_consider: z.string().optional(),
  })
  .passthrough();

// Legacy OtherConceptSchema for backward compatibility
const OtherConceptSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    track: TrackSchema,
    one_liner: z.string(),
    when_to_consider: z.string(),
    merit_score: z.number().min(1).max(10).catch(5),
  })
  .passthrough();

// Enhanced comparison table
const ComparisonRowSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    score: z.number().int().min(0).max(100).catch(50),
    confidence: ConfidenceLevel.catch('medium'),
    time_to_first_data: z.string().optional(),
    expected_performance: z.string().optional(),
    key_risk: z.string(),
    capital_required: CapitalRequirement.catch('medium'),
    timeline: z.string(),
  })
  .passthrough();

// Complete solution concepts structure
const SolutionConceptsSchema = z
  .object({
    lead_concepts: z.array(LeadConceptSchema).catch([]),

    parallel_explorations_intro: z.string().optional(),
    parallel_explorations: z.array(ParallelExplorationSchema).catch([]),

    spark_concept: SparkConceptSchema.optional(),

    comparison_table: z.array(ComparisonRowSchema).catch([]),
    comparison_insight: z.string().optional(),
  })
  .passthrough();

// --- Paradigm Insight Section ---
const ParadigmInsightSectionSchema = z
  .object({
    exists: z.boolean().catch(false),
    insight_name: z.string().optional(),
    the_assumption: z.string().optional(),
    the_reality: z.string().optional(),
    the_disconnect: z.string().optional(),
    years_of_blind_spot: z.string().optional(),
    why_missed: z.string().optional(),
    evidence_base: z.string().optional(),
    magnitude_of_opportunity: z.string().optional(),
    first_mover_advantage: z.string().optional(),

    // Legacy fields for backward compatibility
    insight_headline: z.string().optional(),
    the_conventional_wisdom: z.string().optional(),
    what_we_discovered: z.string().optional(),
    evidence_sources: z.array(z.string()).catch([]),
    why_it_matters: z.string().optional(),
    who_should_care: z.array(z.string()).catch([]),
    related_concepts: z.array(z.string()).catch([]),
  })
  .passthrough();

// --- Decision Architecture Section (ASCII flowchart) ---
const DecisionFlowchartSchema = z
  .object({
    flowchart: z.string(), // ASCII or Mermaid format
    summary: z.string(),
  })
  .passthrough();

// Legacy decision architecture for backward compatibility
const LegacyDecisionArchitectureSchema = z
  .object({
    primary: LeadConceptSchema.optional(),
    fallback: LeadConceptSchema.optional(),
    parallel_exploration: z.array(OtherConceptSchema).catch([]),
  })
  .passthrough();

// --- Personal Recommendation Section ---
const ActionPlanStepSchema = z
  .object({
    timeframe: z.string(),
    actions: z.array(z.string()).catch([]),
    rationale: z.string().optional(),
    decision_gate: z.string().optional(),
  })
  .passthrough();

const PersonalRecommendationSchema = z
  .object({
    intro: z.string(), // "If this were my project..."
    action_plan: z.array(ActionPlanStepSchema).catch([]),
    key_insight: z.string(),
  })
  .passthrough();

// --- Strategic Implications Section ---
const StrategicTimeframeSchema = z
  .object({
    timeframe: z.string(),
    action: z.string().optional(),
    expected_outcome: z.string().optional(),
    why_parallel: z.string().optional(),
    paradigm_bet: z.string().optional(),
    why_now: z.string().optional(),
    competitive_implications: z.string().optional(),
  })
  .passthrough();

const StrategicImplicationsSchema = z
  .object({
    near_term: StrategicTimeframeSchema.optional(),
    medium_term: StrategicTimeframeSchema.optional(),
    long_term: StrategicTimeframeSchema.optional(),
    portfolio_view: z.string().optional(),

    // Legacy fields
    for_incumbents: z.array(z.string()).catch([]),
    for_startups: z.array(z.string()).catch([]),
    for_investors: z.array(z.string()).catch([]),
    timing_considerations: z.string().optional(),
    competitive_dynamics: z.string().optional(),
  })
  .passthrough();

// --- Validation Summary ---
const ValidationSummarySchema = z
  .object({
    overall_confidence: ConfidenceLevel.catch('medium'),
    key_validations: z.array(z.string()).catch([]),
    remaining_uncertainties: z.array(z.string()).catch([]),
  })
  .passthrough();

// --- Challenge the Frame ---
const ChallengeFrameSchema = z
  .object({
    assumption: z.string(),
    challenge: z.string(),
    implication: z.string(),
  })
  .passthrough();

// --- Risks and Watchouts ---
const RiskWatchoutSchema = z
  .object({
    category: z.string(),
    risk: z.string(),
    severity: z.enum(['low', 'medium', 'high']).catch('medium'),
    mitigation: z.string().optional(),
  })
  .passthrough();

// --- Self-Critique (Enhanced) ---
const ReportSelfCritiqueSchema = z
  .object({
    what_we_might_be_wrong_about: z.array(z.string()).catch([]),
    unexplored_directions: z.array(z.string()).catch([]),
    confidence_level: ConfidenceLevel.catch('medium'),
    confidence_rationale: z.string(),
  })
  .passthrough();

// --- Next Steps (Granular Timeline) ---
const NextStepsGranularSchema = z
  .object({
    today: z.array(z.string()).catch([]),
    this_week: z.array(z.string()).catch([]),
    week_2_3: z.array(z.string()).catch([]),
    week_4_plus: z.array(z.string()).catch([]),
    decision_point: z
      .object({
        title: z.string(),
        description: z.string(),
        cta_label: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

// --- Appendix ---
const AppendixSchema = z
  .object({
    additional_resources: z.array(z.string()).catch([]),
    methodology_notes: z.string().optional(),
    data_sources: z.array(z.string()).catch([]),
  })
  .passthrough();

// --- Metadata ---
const MetadataSchema = z
  .object({
    generated_at: z.string().optional(),
    model_version: z.string().optional(),
    chain_version: z.string().optional(),
    total_concepts_generated: z.number().optional(),
    tracks_covered: z.array(TrackSchema).catch([]),
  })
  .passthrough();

// ============================================
// Complete AN5-M Output Schema
// ============================================

export const AN5_M_OutputSchema = z
  .object({
    // New structured format
    header: HeaderSchema.optional(),
    executive_summary: z.union([ExecutiveSummarySchema, z.string()]),
    constraints: ConstraintsSchema.optional(),
    problem_analysis: ReportProblemAnalysisSchema.optional(),
    what_industry_missed: z
      .union([
        WhatIndustryMissedSectionSchema,
        z.array(LegacyWhatIndustryMissedSchema),
      ])
      .optional(),
    key_patterns: z.array(KeyPatternSchema).catch([]),
    solution_concepts: SolutionConceptsSchema.optional(),
    paradigm_insight: ParadigmInsightSectionSchema.optional(),
    decision_flowchart: DecisionFlowchartSchema.optional(),
    personal_recommendation: PersonalRecommendationSchema.optional(),
    validation_summary: ValidationSummarySchema.optional(),
    challenge_the_frame: z.array(ChallengeFrameSchema).catch([]),
    strategic_implications: StrategicImplicationsSchema.optional(),
    risks_and_watchouts: z.array(RiskWatchoutSchema).catch([]),
    self_critique: ReportSelfCritiqueSchema,
    next_steps: z
      .union([NextStepsGranularSchema, z.array(z.string())])
      .optional(),
    appendix: AppendixSchema.optional(),
    metadata: MetadataSchema.optional(),

    // Legacy fields for backward compatibility
    report_title: z.string().max(100).optional(),
    decision_architecture: LegacyDecisionArchitectureSchema.optional(),
    other_concepts: z.array(OtherConceptSchema).catch([]),
    problem_restatement: z.string().optional(),
    key_insights: z.array(z.string()).catch([]),
  })
  .passthrough();

export type AN5_M_Output = z.infer<typeof AN5_M_OutputSchema>;
export type HybridLeadConcept = z.infer<typeof LeadConceptSchema>;
export type HybridOtherConcept = z.infer<typeof OtherConceptSchema>;
export type HybridParallelExploration = z.infer<
  typeof ParallelExplorationSchema
>;
export type HybridSparkConcept = z.infer<typeof SparkConceptSchema>;
