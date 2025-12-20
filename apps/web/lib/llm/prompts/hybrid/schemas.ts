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

export const AN1_7_M_OutputSchema = z
  .object({
    precedent_findings: z.array(PrecedentFindingSchema).catch([]),
    gap_analysis: z.array(GapAnalysisSchema).catch([]),
    abandoned_approaches: z.array(AbandonedApproachSchema).catch([]),
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

const ConceptSchema = z
  .object({
    id: z.string(),
    title: z.string().max(500),
    track: TrackSchema,
    description: z.string(),
    mechanism: z.string(),
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
  })
  .passthrough();

export type AN4_M_Output = z.infer<typeof AN4_M_OutputSchema>;
export type HybridValidationResult = z.infer<typeof ValidationResultSchema>;

// ============================================
// AN5-M: Executive Report
// ============================================

const LeadConceptSchema = z
  .object({
    id: z.string(),
    title: z.string().max(500),
    track: TrackSchema,
    executive_summary: z.string(),
    why_it_wins: z.string(),
    key_risks: z.array(RiskItemSchema).catch([]),
    how_to_test: z.array(TestGateSchema).catch([]),
    prior_art_summary: z.array(PriorArtSchema).catch([]),
    estimated_timeline: z.string().optional(),
    estimated_investment: z.string().optional(),
    confidence_level: z.enum(['low', 'medium', 'high']).catch('medium'),
  })
  .passthrough();

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

const DecisionArchitectureSchema = z
  .object({
    primary: LeadConceptSchema,
    fallback: LeadConceptSchema.optional(),
    parallel_exploration: z.array(OtherConceptSchema).catch([]),
  })
  .passthrough();

const ReportSelfCritiqueSchema = z
  .object({
    what_we_might_be_wrong_about: z.array(z.string()).catch([]),
    unexplored_directions: z.array(z.string()).catch([]),
    confidence_level: z.enum(['low', 'medium', 'high']).catch('medium'),
    confidence_rationale: z.string(),
  })
  .passthrough();

export const AN5_M_OutputSchema = z
  .object({
    decision_architecture: DecisionArchitectureSchema,
    other_concepts: z.array(OtherConceptSchema).catch([]),
    self_critique: ReportSelfCritiqueSchema,
    executive_summary: z.string(),
    next_steps: z.array(z.string()).catch([]),
    problem_restatement: z.string().optional(),
    key_insights: z.array(z.string()).catch([]),
  })
  .passthrough();

export type AN5_M_Output = z.infer<typeof AN5_M_OutputSchema>;
export type HybridLeadConcept = z.infer<typeof LeadConceptSchema>;
export type HybridOtherConcept = z.infer<typeof OtherConceptSchema>;
