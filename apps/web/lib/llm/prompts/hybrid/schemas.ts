import { z } from 'zod';

/**
 * Hybrid Mode Zod Schemas (v4.0.0 - Narrative Flow)
 *
 * Validation patterns:
 * - .default([]) for optional arrays (field missing)
 * - .catch([]) for error recovery (malformed LLM output)
 * - .optional() for optional fields
 * - .passthrough() to preserve extra LLM output (required for forward compatibility)
 * - .nullable().optional() for fields where LLM sends explicit null
 *
 * Antifragile enum pattern (handles LLM variations):
 * - string().transform(normalize).pipe(enum) maps variations to canonical values
 * - Example: CROSS_DOMAIN → TRANSFER, EMERGING → EMERGING_PRACTICE
 *
 * Security patterns:
 * - SafeUrlSchema validates URL format and blocks dangerous protocols
 * - Array length limits prevent DoS via oversized responses
 */

// ============================================
// Shared Primitives
// ============================================

/**
 * Safe URL validation function
 * Returns true for valid HTTP/HTTPS URLs, blocks dangerous protocols/hosts
 */
function isValidSafeUrl(url: string): boolean {
  if (!url || url.trim() === '') return true; // Allow empty/missing
  try {
    const parsed = new URL(url);
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    // Block localhost and private IPs (SSRF prevention)
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    ];
    return !blockedPatterns.some((pattern) => pattern.test(parsed.hostname));
  } catch {
    return true; // Allow invalid URLs to pass for backward compatibility
  }
}

/**
 * Safe URL schema - validates URL format and blocks dangerous protocols
 * Allows empty strings and undefined for backward compatibility
 */
export const SafeUrlSchema = z
  .string()
  .optional()
  .refine((url) => !url || isValidSafeUrl(url), {
    message: 'Blocked URL protocol or host',
  });

/**
 * Severity/confidence level - accepts both cases for backward compatibility
 * Normalizes HIGH/MEDIUM/LOW to lowercase
 */
export const SeverityLevel = z
  .enum(['low', 'medium', 'high', 'LOW', 'MEDIUM', 'HIGH'])
  .transform((val) => val.toLowerCase() as 'low' | 'medium' | 'high')
  .pipe(z.enum(['low', 'medium', 'high']));

export const TrackSchema = z.enum([
  'simpler_path',
  'best_fit',
  'paradigm_shift',
  'frontier_transfer',
]);

export const ConfidenceLevel = SeverityLevel;

/**
 * Sustainability Flag Types for v4.0 Narrative Flow
 * Flags material sustainability implications for concepts
 */
export const SustainabilityFlagType = z.enum([
  'NONE',
  'CAUTION',
  'BENEFIT',
  'LIFECYCLE_TRADEOFF',
  'IRONY',
  'SUPPLY_CHAIN',
]);

// ============================================
// v4.0 Narrative Flow Enums (AN5_M_PROMPT canonical)
// ============================================

/**
 * Source type for solution concepts - where the solution came from
 * Maps to solution_concepts.primary.source_type in AN5_M_PROMPT
 */
export const SolutionSourceType = z.enum([
  'CATALOG',
  'EMERGING',
  'CROSS_DOMAIN',
  'PARADIGM',
]);
export type SolutionSourceType = z.infer<typeof SolutionSourceType>;

/**
 * Innovation concept type - the nature of the innovation
 * Maps to innovation_concepts.recommended.innovation_type in AN5_M_PROMPT
 */
export const InnovationConceptType = z.enum([
  'CROSS_DOMAIN',
  'PARADIGM',
  'TECHNOLOGY_REVIVAL',
  'FIRST_PRINCIPLES',
]);
export type InnovationConceptType = z.infer<typeof InnovationConceptType>;

/**
 * Frontier innovation type - for frontier_watch items
 * Maps to innovation_concepts.frontier_watch[].innovation_type in AN5_M_PROMPT
 */
export const FrontierInnovationType = z.enum(['PARADIGM', 'EMERGING_SCIENCE']);
export type FrontierInnovationType = z.infer<typeof FrontierInnovationType>;

/**
 * Supporting concept relationship to primary
 * Maps to solution_concepts.supporting[].relationship in AN5_M_PROMPT
 */
export const SupportingRelationship = z.enum(['FALLBACK', 'COMPLEMENTARY']);
export type SupportingRelationship = z.infer<typeof SupportingRelationship>;

/**
 * Economics basis - how the economic value was determined
 * Maps to economics.*.basis fields in AN5_M_PROMPT
 */
export const EconomicsBasis = z.enum(['CALCULATED', 'ESTIMATED', 'ASSUMED']);
export type EconomicsBasis = z.infer<typeof EconomicsBasis>;

/**
 * Freedom to operate assessment for IP considerations
 * Maps to ip_considerations.freedom_to_operate in AN5_M_PROMPT
 */
export const FreedomToOperate = z.enum(['GREEN', 'YELLOW', 'RED']);
export type FreedomToOperate = z.infer<typeof FreedomToOperate>;

/**
 * Effect direction for coupled effects
 * Maps to coupled_effects[].direction in AN5_M_PROMPT
 */
export const EffectDirection = z.enum(['BETTER', 'WORSE', 'NEUTRAL']);
export type EffectDirection = z.infer<typeof EffectDirection>;

/**
 * Effect magnitude for coupled effects
 * Maps to coupled_effects[].magnitude in AN5_M_PROMPT
 */
export const EffectMagnitude = z.enum(['MINOR', 'MODERATE', 'MAJOR']);
export type EffectMagnitude = z.infer<typeof EffectMagnitude>;

// ============================================
// v4.0 Narrative Flow Sub-Schemas (AN5_M_PROMPT canonical)
// ============================================

/**
 * The Insight - reused across solution and innovation concepts
 * Can be string for where_we_found_it (CATALOG) or object (CROSS_DOMAIN)
 */
export const TheInsightSchema = z
  .object({
    what: z.string(),
    where_we_found_it: z
      .union([
        z.string(),
        z
          .object({
            domain: z.string(),
            how_they_use_it: z.string(),
            why_it_transfers: z.string(),
          })
          .passthrough(),
      ])
      .optional(),
    why_industry_missed_it: z.string(),
  })
  .passthrough();
export type TheInsight = z.infer<typeof TheInsightSchema>;

/**
 * Economic Value - structured economic assessment with basis
 */
export const EconomicValueSchema = z
  .object({
    value: z.string(),
    basis: EconomicsBasis,
    rationale: z.string(),
  })
  .passthrough();
export type EconomicValue = z.infer<typeof EconomicValueSchema>;

/**
 * Coupled Effect - secondary effects in other domains
 */
export const CoupledEffectSchema = z
  .object({
    domain: z.string(),
    effect: z.string(),
    direction: EffectDirection,
    magnitude: EffectMagnitude,
    quantified: z.string().optional(),
    mitigation: z.string().optional(),
  })
  .passthrough();
export type CoupledEffect = z.infer<typeof CoupledEffectSchema>;

/**
 * IP Considerations - patent and freedom to operate assessment
 */
export const IpConsiderationsSchema = z
  .object({
    freedom_to_operate: FreedomToOperate,
    rationale: z.string(),
    key_patents_to_review: z.array(z.string()).default([]),
    patentability_potential: z.enum(['HIGH', 'MEDIUM', 'LOW', 'NOT_NOVEL']),
  })
  .passthrough();
export type IpConsiderations = z.infer<typeof IpConsiderationsSchema>;

export const SustainabilityFlagSchema = z
  .object({
    type: SustainabilityFlagType.catch('NONE'),
    summary: z.string().nullable().optional(),
    detail: z.string().nullable().optional(),
    alternative: z.string().nullable().optional(),
  })
  .passthrough();
export type SustainabilityFlag = z.infer<typeof SustainabilityFlagSchema>;

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
    url: SafeUrlSchema,
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

// Constraint analysis for technical spec interrogation
const ConstraintAnalysisItemSchema = z
  .object({
    stated: z.string(),
    clarification_needed: z.string().nullable().optional(),
    assumed_for_analysis: z.string().nullable().optional(),
    if_different: z.string().nullable().optional(),
    classification: z
      .enum(['HARD_PHYSICS', 'HARD_SYSTEM', 'SOFT_NEGOTIABLE', 'ASSUMED'])
      .catch('ASSUMED'),
  })
  .passthrough();

const AN0_M_AnalysisSchema = z
  .object({
    needs_clarification: z.literal(false),
    problem_analysis: ProblemAnalysisSchema,
    constraint_analysis: z.array(ConstraintAnalysisItemSchema).default([]),
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
    enabling_changes_since: z.array(EnablingChangeSchema).max(20).default([]),
    revival_potential: SeverityLevel.catch('medium'),
    revival_concept: z.string(),
    who_is_positioned: z.string().optional(),
    source_urls: z.array(SafeUrlSchema).max(10).default([]),
  })
  .passthrough();

export const AN1_7_M_OutputSchema = z
  .object({
    precedent_findings: z.array(PrecedentFindingSchema).max(50).default([]),
    gap_analysis: z.array(GapAnalysisSchema).max(20).default([]),
    abandoned_approaches: z.array(AbandonedApproachSchema).max(20).default([]),
    abandoned_technology_analysis: z
      .array(AbandonedTechnologyAnalysisSchema)
      .max(10)
      .default([]),
    key_papers: z
      .array(
        z
          .object({
            title: z.string(),
            authors: z.string().optional(),
            year: z.string().optional(),
            key_insight: z.string(),
            url: SafeUrlSchema,
          })
          .passthrough(),
      )
      .max(30)
      .default([]),
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
    // v4.0: Sustainability screening for concepts
    sustainability_flag: SustainabilityFlagSchema.optional(),
  })
  .passthrough();

/**
 * Operational Alternative - behavior/process change instead of technology purchase
 */
export const OperationalAlternativeSchema = z
  .object({
    title: z.string(),
    what_changes: z.string(), // Operations, not technology
    capital_required: z.string(), // Usually "minimal" or specific low amount
    expected_benefit: z.string(), // "Could capture X% of benefit"
    why_not_already_doing: z.string(), // Why this isn't obvious
    validation_approach: z.string(),
    comparison_to_capital_solutions: z.string(), // "X% of benefit at Y% of cost"
  })
  .passthrough();
export type OperationalAlternative = z.infer<
  typeof OperationalAlternativeSchema
>;

export const AN3_M_OutputSchema = z
  .object({
    concepts: z.array(ConceptSchema).max(50).default([]),
    track_coverage: z
      .object({
        simpler_path_count: z.number().catch(0),
        best_fit_count: z.number().catch(0),
        paradigm_shift_count: z.number().catch(0),
        frontier_transfer_count: z.number().catch(0),
      })
      .passthrough(),
    first_principles_concepts: z.array(z.string()).max(20).default([]),
    industry_assumption_challenges: z.array(z.string()).max(20).default([]),
    cross_domain_transfers: z.array(z.string()).max(20).default([]),
    // NEW: Operational alternatives (behavior changes, not technology purchases)
    operational_alternatives: z
      .array(OperationalAlternativeSchema)
      .max(10)
      .default([]),
  })
  .passthrough();

export type AN3_M_Output = z.infer<typeof AN3_M_OutputSchema>;
export type HybridConcept = z.infer<typeof ConceptSchema>;

// ============================================
// POST-SEARCH CLASSIFICATION (AN4)
// ============================================

/**
 * Solution classification type - classifies what we FOUND (not what we searched for)
 * Antifragile: maps LLM variations to canonical values with fallback
 */
const SOLUTION_CLASS_CANONICAL = [
  'CATALOG',
  'EMERGING_PRACTICE',
  'CROSS_DOMAIN',
  'PARADIGM',
  'OPTIMIZATION',
] as const;

const SOLUTION_CLASS_MAPPINGS: Record<
  string,
  (typeof SOLUTION_CLASS_CANONICAL)[number]
> = {
  CATALOG: 'CATALOG',
  EMERGING_PRACTICE: 'EMERGING_PRACTICE',
  CROSS_DOMAIN: 'CROSS_DOMAIN',
  PARADIGM: 'PARADIGM',
  OPTIMIZATION: 'OPTIMIZATION',
  // LLM variations
  CATALOG_SOLUTION: 'CATALOG',
  SUPPLIER: 'CATALOG',
  VENDOR: 'CATALOG',
  OFF_THE_SHELF: 'CATALOG',
  EMERGING: 'EMERGING_PRACTICE',
  TRANSFER: 'CROSS_DOMAIN',
  CROSS_DOMAIN_TRANSFER: 'CROSS_DOMAIN',
  DOMAIN_TRANSFER: 'CROSS_DOMAIN',
  PARADIGM_SHIFT: 'PARADIGM',
  PARADIGM_INSIGHT: 'PARADIGM',
  NOVEL: 'PARADIGM',
  FIRST_PRINCIPLES: 'PARADIGM',
  OPTIMIZE: 'OPTIMIZATION',
  IMPROVEMENT: 'OPTIMIZATION',
  PARAMETER_TUNING: 'OPTIMIZATION',
};

export const SolutionClassificationType = z
  .string()
  .transform((val) => {
    const normalized = val.toUpperCase().replace(/[-\s]/g, '_');
    return SOLUTION_CLASS_MAPPINGS[normalized] ?? 'EMERGING_PRACTICE'; // Neutral fallback
  })
  .pipe(z.enum(SOLUTION_CLASS_CANONICAL));
export type SolutionClassificationType = z.infer<
  typeof SolutionClassificationType
>;

/**
 * Catalog solution - supplier sells this in their product line
 */
export const CatalogSolutionSchema = z
  .object({
    concept_id: z.string(),
    title: z.string(),
    supplier: z.string(),
    how_discoverable: z.string(), // "Phone call to X" or "Search for Y"
  })
  .passthrough();
export type CatalogSolution = z.infer<typeof CatalogSolutionSchema>;

/**
 * Emerging practice - suppliers moving this direction, not yet standard
 */
export const EmergingPracticeSchema = z
  .object({
    concept_id: z.string(),
    title: z.string(),
    who_is_doing_it: z.string(),
    how_far_from_standard: z.string(), // "2-3 years" or "Already common in segment X"
  })
  .passthrough();
export type EmergingPractice = z.infer<typeof EmergingPracticeSchema>;

/**
 * Transfer difficulty enum with lenient parsing
 * LLM sometimes outputs "MODERATE - explanation" so we extract just the enum part
 */
const TransferDifficultySchema = z
  .string()
  .transform((val) => {
    // Extract enum value before any " - " explanation
    const enumPart = val.split(' - ')[0]?.trim().toUpperCase();
    if (['OBVIOUS', 'MODERATE', 'NON_OBVIOUS'].includes(enumPart ?? '')) {
      return enumPart as 'OBVIOUS' | 'MODERATE' | 'NON_OBVIOUS';
    }
    return 'MODERATE'; // fallback
  })
  .pipe(z.enum(['OBVIOUS', 'MODERATE', 'NON_OBVIOUS']));

/**
 * Cross-domain transfer - found in another industry
 */
export const CrossDomainTransferItemSchema = z
  .object({
    concept_id: z.string(),
    title: z.string(),
    source_domain: z.string(),
    transfer_difficulty: TransferDifficultySchema,
  })
  .passthrough();
export type CrossDomainTransferItem = z.infer<
  typeof CrossDomainTransferItemSchema
>;

/**
 * Paradigm insight - industry hasn't seen this approach
 */
export const ParadigmInsightItemSchema = z
  .object({
    concept_id: z.string(),
    title: z.string(),
    what_industry_believes: z.string(),
    what_we_found: z.string(),
    validation: z.string(), // Why this is genuinely paradigm-level
  })
  .passthrough();
export type ParadigmInsightItem = z.infer<typeof ParadigmInsightItemSchema>;

/**
 * What we found - classifies all concepts by type
 */
export const WhatWeFoundSchema = z
  .object({
    catalog_solutions: z.array(CatalogSolutionSchema).default([]),
    emerging_practice: z.array(EmergingPracticeSchema).default([]),
    cross_domain_transfers: z.array(CrossDomainTransferItemSchema).default([]),
    paradigm_insights: z.array(ParadigmInsightItemSchema).default([]),
  })
  .passthrough();
export type WhatWeFound = z.infer<typeof WhatWeFoundSchema>;

/**
 * Recommended emphasis for AN5 calibration
 * Antifragile: maps LLM variations to canonical values with fallback
 */
const EMPHASIS_CANONICAL = [
  'SUPPLIER_ARBITRAGE',
  'DECISION_FRAMEWORK',
  'CROSS_DOMAIN_SYNTHESIS',
  'PARADIGM_INSIGHT',
  'INTEGRATION',
] as const;

const EMPHASIS_MAPPINGS: Record<string, (typeof EMPHASIS_CANONICAL)[number]> = {
  SUPPLIER_ARBITRAGE: 'SUPPLIER_ARBITRAGE',
  DECISION_FRAMEWORK: 'DECISION_FRAMEWORK',
  CROSS_DOMAIN_SYNTHESIS: 'CROSS_DOMAIN_SYNTHESIS',
  PARADIGM_INSIGHT: 'PARADIGM_INSIGHT',
  INTEGRATION: 'INTEGRATION',
  // LLM variations
  ARBITRAGE: 'SUPPLIER_ARBITRAGE',
  SUPPLIER: 'SUPPLIER_ARBITRAGE',
  VENDOR: 'SUPPLIER_ARBITRAGE',
  FRAMEWORK: 'DECISION_FRAMEWORK',
  DECISION: 'DECISION_FRAMEWORK',
  VALIDATION: 'DECISION_FRAMEWORK',
  CROSS_DOMAIN: 'CROSS_DOMAIN_SYNTHESIS',
  TRANSFER: 'CROSS_DOMAIN_SYNTHESIS',
  SYNTHESIS: 'CROSS_DOMAIN_SYNTHESIS',
  PARADIGM: 'PARADIGM_INSIGHT',
  INSIGHT: 'PARADIGM_INSIGHT',
  REFRAME: 'PARADIGM_INSIGHT',
  INTEGRATE: 'INTEGRATION',
  COMBINE: 'INTEGRATION',
  NOVEL_COMBINATION: 'INTEGRATION',
};

export const RecommendedEmphasis = z
  .string()
  .transform((val) => {
    const normalized = val.toUpperCase().replace(/[-\s]/g, '_');
    return EMPHASIS_MAPPINGS[normalized] ?? 'DECISION_FRAMEWORK'; // Default fallback
  })
  .pipe(z.enum(EMPHASIS_CANONICAL));
export type RecommendedEmphasis = z.infer<typeof RecommendedEmphasis>;

/**
 * Presentation calibration for AN5 - honest calibration
 */
export const PresentationCalibrationSchema = z
  .object({
    phone_call_equivalent: z.string(), // What user would learn from 30-min supplier call
    literature_equivalent: z.string(), // What user would learn from searching best practices
    sparlo_adds_beyond_that: z.array(z.string()).default([]), // Our actual value-add
    recommended_emphasis: RecommendedEmphasis,
  })
  .passthrough();
export type PresentationCalibration = z.infer<
  typeof PresentationCalibrationSchema
>;

/**
 * Solution Classification Schema - classifies what we FOUND (not what we searched for)
 */
export const SolutionClassificationSchema = z
  .object({
    what_we_found: WhatWeFoundSchema,
    primary_recommendation_classification: SolutionClassificationType,
    presentation_calibration: PresentationCalibrationSchema,
  })
  .passthrough();
export type SolutionClassification = z.infer<
  typeof SolutionClassificationSchema
>;

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
    // v4.0: Sustainability screening for concepts
    sustainability_flag: SustainabilityFlagSchema.optional(),
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
    evidence_strength: SeverityLevel.catch('medium'),
    recommendation: z.string(),
  })
  .passthrough();

export const AN4_M_OutputSchema = z
  .object({
    validation_results: z.array(ValidationResultSchema).max(50).default([]),
    ranking: z.array(RankingItemSchema).max(50).default([]),
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
      .max(10)
      .default([]),
    // NEW: Post-search solution classification
    solution_classification: SolutionClassificationSchema.optional(),
  })
  .passthrough();

export type AN4_M_Output = z.infer<typeof AN4_M_OutputSchema>;
export type HybridValidationResult = z.infer<typeof ValidationResultSchema>;

// ============================================
// NEW: Execution Track + Innovation Portfolio Framework
// ============================================

/**
 * Source type for execution track concepts
 * Antifragile: maps LLM variations to canonical values with fallback
 */
const SOURCE_TYPE_CANONICAL = [
  'CATALOG',
  'TRANSFER',
  'OPTIMIZATION',
  'FIRST_PRINCIPLES',
  'EMERGING_PRACTICE',
] as const;

const SOURCE_TYPE_MAPPINGS: Record<
  string,
  (typeof SOURCE_TYPE_CANONICAL)[number]
> = {
  // Direct matches
  CATALOG: 'CATALOG',
  TRANSFER: 'TRANSFER',
  OPTIMIZATION: 'OPTIMIZATION',
  FIRST_PRINCIPLES: 'FIRST_PRINCIPLES',
  EMERGING_PRACTICE: 'EMERGING_PRACTICE',
  // Common LLM variations
  CROSS_DOMAIN: 'TRANSFER',
  CROSS_DOMAIN_TRANSFER: 'TRANSFER',
  DOMAIN_TRANSFER: 'TRANSFER',
  EMERGING: 'EMERGING_PRACTICE',
  PRACTICE: 'EMERGING_PRACTICE',
  CATALOG_SOLUTION: 'CATALOG',
  VENDOR: 'CATALOG',
  SUPPLIER: 'CATALOG',
  OFF_THE_SHELF: 'CATALOG',
  NOVEL: 'FIRST_PRINCIPLES',
  NEW: 'FIRST_PRINCIPLES',
  OPTIMIZE: 'OPTIMIZATION',
  IMPROVEMENT: 'OPTIMIZATION',
};

export const SourceType = z
  .string()
  .transform((val) => {
    const normalized = val.toUpperCase().replace(/[-\s]/g, '_');
    return SOURCE_TYPE_MAPPINGS[normalized] ?? 'TRANSFER'; // Default fallback
  })
  .pipe(z.enum(SOURCE_TYPE_CANONICAL));
export type SourceType = z.infer<typeof SourceType>;

/**
 * Innovation type for portfolio concepts (new framework)
 * Antifragile: maps LLM variations to canonical values with fallback
 */
const INNOVATION_TYPE_CANONICAL = [
  'PARADIGM_SHIFT',
  'CROSS_DOMAIN_TRANSFER',
  'TECHNOLOGY_REVIVAL',
  'FIRST_PRINCIPLES',
] as const;

const INNOVATION_TYPE_MAPPINGS: Record<
  string,
  (typeof INNOVATION_TYPE_CANONICAL)[number]
> = {
  PARADIGM_SHIFT: 'PARADIGM_SHIFT',
  CROSS_DOMAIN_TRANSFER: 'CROSS_DOMAIN_TRANSFER',
  TECHNOLOGY_REVIVAL: 'TECHNOLOGY_REVIVAL',
  FIRST_PRINCIPLES: 'FIRST_PRINCIPLES',
  // LLM variations
  PARADIGM: 'PARADIGM_SHIFT',
  SHIFT: 'PARADIGM_SHIFT',
  PARADIGM_INSIGHT: 'PARADIGM_SHIFT',
  CROSS_DOMAIN: 'CROSS_DOMAIN_TRANSFER',
  TRANSFER: 'CROSS_DOMAIN_TRANSFER',
  DOMAIN_TRANSFER: 'CROSS_DOMAIN_TRANSFER',
  REVIVAL: 'TECHNOLOGY_REVIVAL',
  ABANDONED_TECH: 'TECHNOLOGY_REVIVAL',
  ABANDONED_TECHNOLOGY: 'TECHNOLOGY_REVIVAL',
  FIRST_PRINCIPLE: 'FIRST_PRINCIPLES',
  NOVEL: 'FIRST_PRINCIPLES',
  NEW: 'FIRST_PRINCIPLES',
};

export const PortfolioInnovationType = z
  .string()
  .transform((val) => {
    const normalized = val.toUpperCase().replace(/[-\s]/g, '_');
    return INNOVATION_TYPE_MAPPINGS[normalized] ?? 'CROSS_DOMAIN_TRANSFER'; // Default fallback
  })
  .pipe(z.enum(INNOVATION_TYPE_CANONICAL));
export type PortfolioInnovationType = z.infer<typeof PortfolioInnovationType>;

/**
 * Where We Found It - the narrative power of cross-domain transfer
 */
export const WhereWeFoundItSchema = z
  .object({
    domain: z.string(),
    how_they_use_it: z.string(),
    why_it_transfers: z.string(),
  })
  .passthrough();
export type WhereWeFoundIt = z.infer<typeof WhereWeFoundItSchema>;

/**
 * The Insight Block - reused across execution track and innovation portfolio (new framework)
 */
export const NewInsightBlockSchema = z
  .object({
    what: z.string(),
    where_we_found_it: WhereWeFoundItSchema.optional(), // Optional for FIRST_PRINCIPLES
    why_industry_missed_it: z.string(),
    physics: z.string(),
  })
  .passthrough();
export type NewInsightBlock = z.infer<typeof NewInsightBlockSchema>;

/**
 * Supplier Arbitrage - when source_type === CATALOG
 * How to negotiate with vendors and avoid being overcharged
 */
export const SupplierArbitrageSchema = z
  .object({
    who_to_call: z.string(),
    what_to_ask: z.array(z.string()).default([]),
    what_to_push_back_on: z.array(z.string()).default([]),
    what_they_wont_volunteer: z.array(z.string()).default([]),
    how_to_verify: z.array(z.string()).default([]),
    competitor_alternative: z.string().optional(),
  })
  .passthrough();
export type SupplierArbitrage = z.infer<typeof SupplierArbitrageSchema>;

/**
 * Why Not Obvious - when source_type === TRANSFER or FIRST_PRINCIPLES
 * Explains the knowledge barrier that prevented this insight
 */
export const WhyNotObviousSchema = z
  .object({
    industry_gap: z.string(),
    knowledge_barrier: z.string(),
    our_contribution: z.string(),
  })
  .passthrough();
export type WhyNotObvious = z.infer<typeof WhyNotObviousSchema>;

/**
 * Why Safe - validation for execution track primary
 */
export const WhySafeSchema = z
  .object({
    track_record: z.string(),
    precedent: z.array(z.string()).default([]),
    failure_modes_understood: z.boolean().default(false),
  })
  .passthrough();
export type WhySafe = z.infer<typeof WhySafeSchema>;

/**
 * Fallback Trigger - when to pivot from execution track primary
 */
export const FallbackTriggerSchema = z
  .object({
    conditions: z.array(z.string()).default([]),
    pivot_to: z.string(),
    sunk_cost_limit: z.string(),
  })
  .passthrough();
export type FallbackTrigger = z.infer<typeof FallbackTriggerSchema>;

/**
 * Supporting Concept - abbreviated concepts that complement the primary
 */
export const NewSupportingConceptSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    relationship: z.enum(['COMPLEMENTARY', 'FALLBACK', 'PREREQUISITE']),
    one_liner: z.string(),
    confidence: z.number().int().min(0).max(100).catch(50),
    validation_summary: z.string().optional(),
  })
  .passthrough();
export type NewSupportingConcept = z.infer<typeof NewSupportingConceptSchema>;

/**
 * Execution Track Primary - FULL DEPTH safe bet recommendation
 */
export const ExecutionTrackPrimarySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    score: z.number().int().min(0).max(100).catch(50),
    confidence: z.number().int().min(0).max(100).catch(50),

    source_type: SourceType,
    source: z.string(),

    bottom_line: z.string(),
    expected_improvement: z.string(),
    timeline: z.string(),
    investment: z.string(),

    why_safe: WhySafeSchema.optional(),

    the_insight: NewInsightBlockSchema,
    what_it_is: z.string(),
    why_it_works: z.string(),
    why_it_might_fail: z.array(z.string()).default([]),

    // ValidationGateSchema is defined later - use inline definition here
    validation_gates: z
      .array(
        z
          .object({
            week: z.string(),
            test: z.string(),
            method: z.string(),
            success_criteria: z.string(),
            cost: z.string().optional(),
            decision_point: z.string().optional(),
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();
export type ExecutionTrackPrimary = z.infer<typeof ExecutionTrackPrimarySchema>;

/**
 * Root Cause Satisfaction - explicit link between root cause and recommendation
 */
export const RootCauseSatisfactionSchema = z
  .object({
    root_cause: z.string(),
    constraint_derived: z.string(),
    how_recommendation_satisfies: z.string(),
    explicit_link: z.string(), // The physics/engineering connection
  })
  .passthrough();
export type RootCauseSatisfaction = z.infer<typeof RootCauseSatisfactionSchema>;

/**
 * Execution Track - complete section for safe bet recommendation
 */
export const ExecutionTrackSchema = z
  .object({
    intro: z.string(),
    root_cause_satisfaction: RootCauseSatisfactionSchema.optional(),
    primary: ExecutionTrackPrimarySchema,
    supplier_arbitrage: SupplierArbitrageSchema.optional(), // When source_type === CATALOG
    why_not_obvious: WhyNotObviousSchema.optional(), // When source_type === TRANSFER/FIRST_PRINCIPLES
    supporting_concepts: z.array(NewSupportingConceptSchema).default([]),
    fallback_trigger: FallbackTriggerSchema.optional(),
  })
  .passthrough();
export type ExecutionTrack = z.infer<typeof ExecutionTrackSchema>;

/**
 * Selection Rationale - why this innovation was selected from the portfolio
 */
export const SelectionRationaleSchema = z
  .object({
    why_this_one: z.string(),
    ceiling_if_works: z.string(),
    vs_execution_track: z.string(),
  })
  .passthrough();
export type SelectionRationale = z.infer<typeof SelectionRationaleSchema>;

/**
 * Breakthrough Potential - upside analysis (new framework)
 */
export const NewBreakthroughPotentialSchema = z
  .object({
    if_it_works: z.string(),
    estimated_improvement: z.string(),
    industry_impact: z.string(),
  })
  .passthrough();
export type NewBreakthroughPotential = z.infer<
  typeof NewBreakthroughPotentialSchema
>;

/**
 * Innovation Risks
 */
export const InnovationRisksSchema = z
  .object({
    physics_risks: z.array(z.string()).default([]),
    implementation_challenges: z.array(z.string()).default([]),
    mitigation: z.array(z.string()).default([]),
  })
  .passthrough();
export type InnovationRisks = z.infer<typeof InnovationRisksSchema>;

/**
 * Validation Path - how to test without betting the farm
 */
export const ValidationPathSchema = z
  .object({
    gating_question: z.string(),
    first_test: z.string(),
    cost: z.string(),
    timeline: z.string(),
    go_no_go: z.string(),
  })
  .passthrough();
export type ValidationPath = z.infer<typeof ValidationPathSchema>;

/**
 * Relationship to Execution Track
 */
export const RelationshipToExecutionSchema = z
  .object({
    run_in_parallel: z.boolean().default(true),
    when_to_elevate: z.string(),
    complementary: z.boolean().default(false),
  })
  .passthrough();
export type RelationshipToExecution = z.infer<
  typeof RelationshipToExecutionSchema
>;

/**
 * Recommended Innovation - FULL DEPTH (promoted from spark_concept)
 */
export const RecommendedInnovationSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    score: z.number().int().min(0).max(100).catch(50),
    confidence: z.number().int().min(0).max(100).catch(50),

    selection_rationale: SelectionRationaleSchema,

    innovation_type: PortfolioInnovationType,
    source_domain: z.string(),

    the_insight: NewInsightBlockSchema,
    how_it_works: z.array(z.string()).default([]),

    breakthrough_potential: NewBreakthroughPotentialSchema,
    risks: InnovationRisksSchema,

    validation_path: ValidationPathSchema,
    relationship_to_execution_track: RelationshipToExecutionSchema,
  })
  .passthrough();
export type RecommendedInnovation = z.infer<typeof RecommendedInnovationSchema>;

/**
 * Parallel Investigation - medium depth alternatives
 */
export const ParallelInvestigationSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    score: z.number().int().min(0).max(100).catch(50),
    confidence: z.number().int().min(0).max(100).catch(50),

    innovation_type: PortfolioInnovationType,
    source_domain: z.string(),

    one_liner: z.string(),
    the_insight: NewInsightBlockSchema,

    ceiling: z.string(),
    key_uncertainty: z.string(),

    validation_approach: z
      .object({
        test: z.string(),
        cost: z.string(),
        timeline: z.string(),
        go_no_go: z.string(),
      })
      .passthrough(),

    when_to_elevate: z.string(),
    investment_recommendation: z.string(),
  })
  .passthrough();
export type ParallelInvestigation = z.infer<typeof ParallelInvestigationSchema>;

/**
 * Frontier Watch - monitor only concepts
 * Enhanced with optional web search fields for current intelligence
 */
export const FrontierWatchSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    one_liner: z.string(),

    innovation_type: PortfolioInnovationType,
    source_domain: z.string(),

    why_interesting: z.string(),
    why_not_now: z.string(),

    trigger_to_revisit: z.string(),
    who_to_monitor: z.string(),
    earliest_viability: z.string(),

    // Web search enhanced fields (optional)
    recent_developments: z.string().optional(),
    trl_estimate: z.number().int().min(1).max(9).optional(),
    competitive_activity: z.string().optional(),
  })
  .passthrough();
export type FrontierWatch = z.infer<typeof FrontierWatchSchema>;

/**
 * Innovation Portfolio - complete section for higher-risk, higher-reward options
 */
export const InnovationPortfolioSchema = z
  .object({
    intro: z.string(),
    recommended_innovation: RecommendedInnovationSchema.optional(),
    parallel_investigations: z.array(ParallelInvestigationSchema).default([]),
    frontier_watch: z.array(FrontierWatchSchema).default([]),
  })
  .passthrough();
export type InnovationPortfolio = z.infer<typeof InnovationPortfolioSchema>;

/**
 * Portfolio View - how execution track and innovation portfolio work together
 */
export const PortfolioViewSchema = z
  .object({
    execution_track_role: z.string(),
    innovation_portfolio_role: z.string(),
    combined_strategy: z.string(),
  })
  .passthrough();
export type PortfolioView = z.infer<typeof PortfolioViewSchema>;

/**
 * Resource Allocation - recommended split of effort
 */
export const ResourceAllocationSchema = z
  .object({
    execution_track_percent: z.number().default(60),
    recommended_innovation_percent: z.number().default(25),
    parallel_investigations_percent: z.number().default(10),
    frontier_watch_percent: z.number().default(5),
    rationale: z.string(),
  })
  .passthrough();
export type ResourceAllocation = z.infer<typeof ResourceAllocationSchema>;

/**
 * Primary Tradeoff - the key decision the user faces
 */
export const PrimaryTradeoffSchema = z
  .object({
    question: z.string(),
    option_a: z
      .object({
        condition: z.string(),
        path: z.string(),
        what_you_get: z.string(),
        what_you_give_up: z.string(),
      })
      .passthrough(),
    option_b: z
      .object({
        condition: z.string(),
        path: z.string(),
        what_you_get: z.string(),
        what_you_give_up: z.string(),
      })
      .passthrough(),
    if_uncertain: z.string(),
  })
  .passthrough();
export type PrimaryTradeoff = z.infer<typeof PrimaryTradeoffSchema>;

/**
 * New Decision Architecture - tradeoff-based
 */
export const NewDecisionArchitectureSchema = z
  .object({
    primary_tradeoff: PrimaryTradeoffSchema.optional(),
    flowchart: z.string(),
    summary: z.string(),
  })
  .passthrough();
export type NewDecisionArchitecture = z.infer<
  typeof NewDecisionArchitectureSchema
>;

/**
 * New Action Plan Step
 */
export const NewActionPlanStepSchema = z
  .object({
    timeframe: z.string(),
    actions: z.array(z.string()).default([]),
    rationale: z.string().optional(),
    decision_gate: z.string().optional(),
  })
  .passthrough();
export type NewActionPlanStep = z.infer<typeof NewActionPlanStepSchema>;

/**
 * New Personal Recommendation
 */
export const NewPersonalRecommendationSchema = z
  .object({
    intro: z.string(),
    action_plan: z.array(NewActionPlanStepSchema).default([]),
    key_insight: z.string(),
  })
  .passthrough();
export type NewPersonalRecommendation = z.infer<
  typeof NewPersonalRecommendationSchema
>;

/**
 * Operational Alternative for Strategic Integration
 */
const StrategicOperationalAlternativeSchema = z
  .object({
    title: z.string(),
    what_changes: z.string(),
    cost: z.string(),
    expected_benefit: z.string(),
    vs_capital_solutions: z.string(),
    validation: z.string(),
  })
  .passthrough();

/**
 * Operational Alternatives Section - before capital investment
 */
export const OperationalAlternativesSectionSchema = z
  .object({
    intro: z.string(), // "Before capital investment, consider..."
    alternatives: z.array(StrategicOperationalAlternativeSchema).default([]),
    recommendation: z.string(), // "Try X first, then Y if insufficient"
  })
  .passthrough();
export type OperationalAlternativesSection = z.infer<
  typeof OperationalAlternativesSectionSchema
>;

/**
 * Strategic Integration - complete section
 */
export const StrategicIntegrationSchema = z
  .object({
    // Operational alternatives before capital investment
    operational_alternatives: OperationalAlternativesSectionSchema.optional(),
    portfolio_view: PortfolioViewSchema,
    decision_architecture: NewDecisionArchitectureSchema,
    personal_recommendation: NewPersonalRecommendationSchema,
  })
  .passthrough();
export type StrategicIntegration = z.infer<typeof StrategicIntegrationSchema>;

/**
 * Problem Type classification
 */
export const ProblemType = z.enum([
  'CATALOG',
  'OPTIMIZATION',
  'TRANSFER',
  'PARADIGM',
  'FRONTIER',
]);
export type ProblemType = z.infer<typeof ProblemType>;

/**
 * What you could get elsewhere - sources comparison
 */
export const WhatYouCouldGetElsewhereSchema = z
  .object({
    from_supplier_call: z.array(z.string()).default([]),
    from_literature_search: z.array(z.string()).default([]),
    from_industry_consultant: z.array(z.string()).default([]),
  })
  .passthrough();
export type WhatYouCouldGetElsewhere = z.infer<
  typeof WhatYouCouldGetElsewhereSchema
>;

/**
 * What Sparlo uniquely provides
 */
export const WhatSparloProvidesSchema = z
  .object({
    unique_contributions: z.array(z.string()).default([]),
    integration_value: z.string().optional(),
    decision_framework_value: z.string().optional(),
    cross_domain_value: z.string().optional(),
  })
  .passthrough();
export type WhatSparloProvides = z.infer<typeof WhatSparloProvidesSchema>;

/**
 * Calibrated claims - honest self-assessment
 */
export const CalibratedClaimsSchema = z
  .object({
    paradigm_insight_claim: z
      .enum(['JUSTIFIED', 'OVERSTATED', 'NOT_CLAIMED'])
      .catch('NOT_CLAIMED'),
    novelty_claim: z.enum(['HIGH', 'MEDIUM', 'LOW']).catch('MEDIUM'),
    expert_reaction_prediction: z
      .enum([
        'SURPRISED_AND_GRATEFUL', // Genuine insight they didn't have
        'USEFUL_FRAMEWORK', // Helpful structure, known content
        'COULD_GET_ELSEWHERE', // Limited value-add
      ])
      .catch('USEFUL_FRAMEWORK'),
  })
  .passthrough();
export type CalibratedClaims = z.infer<typeof CalibratedClaimsSchema>;

/**
 * Supplier arbitrage guidance - for CATALOG recommendations
 */
export const HonestSupplierArbitrageSchema = z
  .object({
    who_to_call: z.string(),
    what_to_ask: z.array(z.string()).default([]),
    what_to_push_back_on: z.array(z.string()).default([]),
    what_they_wont_volunteer: z.array(z.string()).default([]),
  })
  .passthrough();
export type HonestSupplierArbitrage = z.infer<
  typeof HonestSupplierArbitrageSchema
>;

/**
 * Honest Assessment - expanded transparency about value
 */
export const HonestAssessmentSchema = z
  .object({
    // Classification from AN4
    primary_recommendation_type: SolutionClassificationType.optional(),

    // Legacy fields (kept for backward compatibility)
    problem_type: ProblemType.optional(),
    // P1 FIX: Removed union type ambiguity - use structured format only
    what_you_could_get_elsewhere: WhatYouCouldGetElsewhereSchema.optional(),
    what_we_provide_beyond_that: z.array(z.string()).default([]),

    // New structured format
    what_sparlo_provides: WhatSparloProvidesSchema.optional(),

    // Calibrated claims
    calibrated_claims: CalibratedClaimsSchema.optional(),

    // Supplier arbitrage (for CATALOG or EMERGING primary recommendations)
    supplier_arbitrage: HonestSupplierArbitrageSchema.optional(),

    // Self-honesty
    the_question_you_should_be_asking: z.string().optional(),
    the_question_you_should_ask_us: z.string().optional(),
    if_we_were_wrong: z.string().optional(),
    if_we_were_wrong_about_this: z.string().optional(),
  })
  .passthrough();
export type HonestAssessment = z.infer<typeof HonestAssessmentSchema>;

/**
 * From Scratch Revelation - what first-principles thinking revealed
 */
export const FromScratchRevelationSchema = z
  .object({
    question: z.string(),
    insight: z.string(),
    implication: z.string(),
  })
  .passthrough();
export type FromScratchRevelation = z.infer<typeof FromScratchRevelationSchema>;

/**
 * Cross-Domain Search - replaces key_patterns with lighter structure
 * LLM sometimes outputs objects for domains_searched, so we coerce to strings
 */
export const CrossDomainSearchSchema = z
  .object({
    intro: z.string().optional(),
    domains_searched: z
      .array(
        z.union([
          z.string(),
          z
            .object({})
            .passthrough()
            .transform((obj) => JSON.stringify(obj)),
        ]),
      )
      .default([]),
  })
  .passthrough();
export type CrossDomainSearch = z.infer<typeof CrossDomainSearchSchema>;

/**
 * Enhanced Challenge Frame with constraint questioning
 */
export const EnhancedChallengeFrameSchema = z
  .object({
    assumption: z.string(),
    challenge: z.string(),
    implication: z.string(),
    constraint_questioned: z.string().nullable().optional(),
    what_if_relaxed: z.string().nullable().optional(),
  })
  .passthrough();
export type EnhancedChallengeFrame = z.infer<
  typeof EnhancedChallengeFrameSchema
>;

// ============================================
// v4.0 Narrative Flow Concept Schemas (AN5_M_PROMPT canonical)
// ============================================

/**
 * Innovation Analysis - replaces cross_domain_search
 * Contains the problem reframe and domains searched
 */
export const InnovationAnalysisSchema = z
  .object({
    reframe: z.string(),
    domains_searched: z.array(z.string()).default([]),
  })
  .passthrough();
export type InnovationAnalysis = z.infer<typeof InnovationAnalysisSchema>;

/**
 * Constraints and Metrics - replaces constraints
 * Adds success metrics with structured targets
 */
export const ConstraintsAndMetricsSchema = z
  .object({
    hard_constraints: z.array(z.string()).default([]),
    soft_constraints: z.array(z.string()).default([]),
    assumptions: z.array(z.string()).default([]),
    success_metrics: z
      .array(
        z
          .object({
            metric: z.string(),
            target: z.string(),
            minimum_viable: z.string(),
            stretch: z.string(),
            unit: z.string().optional(),
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();
export type ConstraintsAndMetrics = z.infer<typeof ConstraintsAndMetricsSchema>;

/**
 * Challenge Frame - simplified version for challenge_the_frame array
 */
export const ChallengeFrameV4Schema = z
  .object({
    assumption: z.string(),
    challenge: z.string(),
    implication: z.string(),
  })
  .passthrough();
export type ChallengeFrameV4 = z.infer<typeof ChallengeFrameV4Schema>;

// --- v4.0 Solution Concepts Structure ---

/**
 * Primary Solution Concept - the recommended solution with full detail
 */
export const PrimarySolutionConceptSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    confidence_percent: z.number().int().min(0).max(100),
    source_type: SolutionSourceType,
    what_it_is: z.string(),
    the_insight: TheInsightSchema,
    why_it_works: z.string(),
    economics: z
      .object({
        investment: EconomicValueSchema,
        expected_outcome: EconomicValueSchema,
        timeline: EconomicValueSchema,
        roi_rationale: z.string().optional(),
      })
      .passthrough(),
    coupled_effects: z.array(CoupledEffectSchema).default([]),
    ip_considerations: IpConsiderationsSchema.optional(),
    key_risks: z
      .array(
        z.object({ risk: z.string(), mitigation: z.string() }).passthrough(),
      )
      .default([]),
    sustainability_flag: SustainabilityFlagSchema.optional(),
    first_validation_step: z
      .object({
        test: z.string(),
        who_performs: z.string(),
        equipment_method: z.string(),
        sample_sourcing: z
          .object({
            material: z.string(),
            lead_time: z.string(),
            quantity: z.string(),
          })
          .passthrough(),
        replicates: z.number().int().positive(),
        cost: z.string(),
        timeline: z.string(),
        go_criteria: z.string(),
        no_go_criteria: z.string(),
      })
      .passthrough(),
  })
  .passthrough();
export type PrimarySolutionConcept = z.infer<
  typeof PrimarySolutionConceptSchema
>;

/**
 * Supporting Solution Concept - abbreviated concepts that complement the primary
 */
export const SupportingSolutionConceptSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    confidence_percent: z.number().int().min(0).max(100),
    relationship: SupportingRelationship,
    what_it_is: z.string(),
    the_insight: TheInsightSchema,
    why_it_works: z.string(),
    economics: z
      .object({
        investment: z.string(),
        expected_outcome: z.string(),
        timeline: z.string(),
      })
      .passthrough(),
    key_risk: z.string(),
    sustainability_flag: SustainabilityFlagSchema.optional(),
    when_to_use_instead: z.string(),
  })
  .passthrough();
export type SupportingSolutionConcept = z.infer<
  typeof SupportingSolutionConceptSchema
>;

/**
 * Solution Concepts - v4.0 structure with primary + supporting
 */
export const SolutionConceptsV4Schema = z
  .object({
    intro: z.string().optional(),
    primary: PrimarySolutionConceptSchema,
    supporting: z.array(SupportingSolutionConceptSchema).default([]),
  })
  .passthrough();
export type SolutionConceptsV4 = z.infer<typeof SolutionConceptsV4Schema>;

// --- v4.0 Innovation Concepts Structure ---

/**
 * Recommended Innovation Concept - promoted innovation with full detail
 */
export const RecommendedInnovationConceptSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    confidence_percent: z.number().int().min(0).max(100),
    innovation_type: InnovationConceptType,
    what_it_is: z.string(),
    the_insight: TheInsightSchema,
    why_it_works: z.string(),
    breakthrough_potential: z
      .object({
        if_it_works: z.string(),
        estimated_improvement: z.string(),
        industry_impact: z.string(),
      })
      .passthrough(),
    economics: z
      .object({
        investment: EconomicValueSchema,
        ceiling_if_works: EconomicValueSchema,
        timeline: EconomicValueSchema,
      })
      .passthrough(),
    coupled_effects: z.array(CoupledEffectSchema).default([]),
    ip_considerations: IpConsiderationsSchema.optional(),
    key_risks: z
      .array(
        z.object({ risk: z.string(), mitigation: z.string() }).passthrough(),
      )
      .default([]),
    sustainability_flag: SustainabilityFlagSchema.optional(),
    first_validation_step: z
      .object({
        gating_question: z.string(),
        test: z.string(),
        cost: z.string(),
        timeline: z.string(),
        go_no_go: z.string(),
      })
      .passthrough(),
    why_this_one: z.string(),
  })
  .passthrough();
export type RecommendedInnovationConcept = z.infer<
  typeof RecommendedInnovationConceptSchema
>;

/**
 * Parallel Innovation Concept - medium depth alternatives
 */
export const ParallelInnovationConceptSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    confidence_percent: z.number().int().min(0).max(100),
    innovation_type: InnovationConceptType,
    what_it_is: z.string(),
    the_insight: TheInsightSchema,
    why_it_works: z.string(),
    economics: z
      .object({
        investment: z.string(),
        ceiling_if_works: z.string(),
      })
      .passthrough(),
    key_uncertainty: z.string(),
    sustainability_flag: SustainabilityFlagSchema.optional(),
    first_validation_step: z
      .object({
        test: z.string(),
        cost: z.string(),
        go_no_go: z.string(),
      })
      .passthrough(),
    when_to_elevate: z.string(),
  })
  .passthrough();
export type ParallelInnovationConcept = z.infer<
  typeof ParallelInnovationConceptSchema
>;

/**
 * Frontier Watch - monitor only concepts for future consideration
 */
export const FrontierWatchV4Schema = z
  .object({
    id: z.string(),
    title: z.string(),
    innovation_type: FrontierInnovationType,
    earliest_viability: z.string(),
    what_it_is: z.string(),
    why_interesting: z.string(),
    why_not_now: z.string(),
    who_to_monitor: z.preprocess(
      (val) =>
        typeof val === 'string' ? val.split(',').map((s) => s.trim()) : val,
      z.array(z.string()).default([]),
    ),
    trigger_to_revisit: z.string(),
    recent_developments: z.string().optional(),
    trl_estimate: z.number().int().min(1).max(9).optional(),
    competitive_activity: z.string().optional(),
  })
  .passthrough();
export type FrontierWatchV4 = z.infer<typeof FrontierWatchV4Schema>;

/**
 * Innovation Concepts - v4.0 structure with recommended + parallel + frontier_watch
 */
export const InnovationConceptsV4Schema = z
  .object({
    intro: z.string().optional(),
    recommended: RecommendedInnovationConceptSchema.optional(),
    parallel: z.array(ParallelInnovationConceptSchema).default([]),
    frontier_watch: z.array(FrontierWatchV4Schema).default([]),
  })
  .passthrough();
export type InnovationConceptsV4 = z.infer<typeof InnovationConceptsV4Schema>;

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
    the_problem: z.string().optional(),
    core_insight: z
      .object({
        headline: z.string(),
        explanation: z.string(),
      })
      .passthrough()
      .optional(),
    primary_recommendation: z.string().optional(), // One sentence with confidence
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
      .passthrough()
      .optional(),
    why_its_hard: z
      .object({
        prose: z.string(),
        factors: z.array(z.string()).catch([]),
      })
      .passthrough()
      .optional(),
    first_principles_insight: z
      .object({
        headline: z.string(),
        explanation: z.string(),
      })
      .passthrough()
      .optional(),
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
    lead_concepts: z.array(LeadConceptSchema).max(10).default([]),

    parallel_explorations_intro: z.string().optional(),
    parallel_explorations: z
      .array(ParallelExplorationSchema)
      .max(20)
      .default([]),

    spark_concept: SparkConceptSchema.optional(),

    comparison_table: z.array(ComparisonRowSchema).max(20).default([]),
    comparison_insight: z.string().optional(),
  })
  .passthrough();

// --- Paradigm Insight Section ---
// LLM sometimes sends null instead of omitting fields
const ParadigmInsightSectionSchema = z
  .object({
    exists: z.boolean().catch(false),
    insight_name: z.string().nullable().optional(),
    the_assumption: z.string().nullable().optional(),
    the_reality: z.string().nullable().optional(),
    the_disconnect: z.string().nullable().optional(),
    years_of_blind_spot: z.string().nullable().optional(),
    why_missed: z.string().nullable().optional(),
    evidence_base: z.string().nullable().optional(),
    magnitude_of_opportunity: z.string().nullable().optional(),
    first_mover_advantage: z.string().nullable().optional(),

    // Legacy fields for backward compatibility
    insight_headline: z.string().nullable().optional(),
    the_conventional_wisdom: z.string().nullable().optional(),
    what_we_discovered: z.string().nullable().optional(),
    evidence_sources: z.array(z.string()).catch([]),
    why_it_matters: z.string().nullable().optional(),
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
// Note: Legacy schema, v4.0 uses enhanced inline schema in AN5_M_OutputSchema
const _RiskWatchoutSchema = z
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
    // v4.0: overall_confidence is the new canonical name
    overall_confidence: ConfidenceLevel.optional(),
    // Legacy: confidence_level kept for backward compatibility
    confidence_level: ConfidenceLevel.catch('medium'),
    confidence_rationale: z.string(),
    // v4.0: validation_gaps array
    validation_gaps: z
      .array(
        z
          .object({
            concern: z.string(),
            status: z.enum(['ADDRESSED', 'EXTENDED_NEEDED', 'ACCEPTED_RISK']),
            rationale: z.string(),
          })
          .passthrough(),
      )
      .default([]),
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
    data_sources: z.array(z.string()).catch([]),
  })
  .passthrough();

// --- Metadata ---
// Note: Legacy schema, v4.0 uses enhanced inline schema in AN5_M_OutputSchema
const _MetadataSchema = z
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
    // === v4.0 Narrative Flow Structure ===
    header: HeaderSchema.optional(),

    // v4.0: brief - one paragraph executive summary
    brief: z.string().optional(),

    executive_summary: z.union([ExecutiveSummarySchema, z.string()]),

    // v4.0: constraints_and_metrics (new canonical name)
    constraints_and_metrics: ConstraintsAndMetricsSchema.optional(),
    // Legacy: constraints kept for backward compatibility
    constraints: ConstraintsSchema.optional(),

    problem_analysis: ReportProblemAnalysisSchema.optional(),
    what_industry_missed: z
      .union([
        WhatIndustryMissedSectionSchema,
        z.array(LegacyWhatIndustryMissedSchema).max(20),
      ])
      .optional(),

    // v4.0: innovation_analysis (new canonical name, replaces cross_domain_search)
    innovation_analysis: InnovationAnalysisSchema.optional(),
    // Legacy: cross_domain_search kept for backward compatibility
    cross_domain_search: CrossDomainSearchSchema.optional(),

    // v4.0: solution_concepts with new structure (primary + supporting)
    // Uses union to accept both v4.0 and legacy structures
    solution_concepts: z
      .union([SolutionConceptsV4Schema, SolutionConceptsSchema])
      .optional(),

    // v4.0: innovation_concepts (new canonical name)
    innovation_concepts: InnovationConceptsV4Schema.optional(),

    // Legacy: execution_track + innovation_portfolio kept for backward compatibility
    execution_track: ExecutionTrackSchema.optional(),
    innovation_portfolio: InnovationPortfolioSchema.optional(),
    strategic_integration: StrategicIntegrationSchema.optional(),

    // Challenge the frame (accepts both v4.0 and legacy formats)
    challenge_the_frame: z
      .array(z.union([ChallengeFrameSchema, EnhancedChallengeFrameSchema]))
      .max(10)
      .default([]),

    // Risks and watchouts with v4.0 enhancement
    risks_and_watchouts: z
      .array(
        z
          .object({
            category: z.string(),
            risk: z.string(),
            severity: SeverityLevel.catch('medium'),
            mitigation: z.string().optional(),
            requires_resolution_before_proceeding: z.boolean().optional(),
          })
          .passthrough(),
      )
      .max(20)
      .default([]),

    // v4.0: what_id_actually_do - personal recommendation prose
    what_id_actually_do: z.string().optional(),

    self_critique: ReportSelfCritiqueSchema,

    // v4.0: follow_up_prompts - suggested next questions
    follow_up_prompts: z.array(z.string()).default([]),

    metadata: z
      .object({
        generated_at: z.string(),
        model_version: z.string(),
        chain_version: z.string(),
        framework: z.string().optional(),
        total_concepts_generated: z.number().optional(),
        tracks_covered: z.array(TrackSchema).catch([]),
      })
      .passthrough()
      .optional(),

    // === Legacy fields for backward compatibility ===
    key_patterns: z.array(KeyPatternSchema).max(20).default([]),
    paradigm_insight: ParadigmInsightSectionSchema.optional(),
    decision_flowchart: DecisionFlowchartSchema.optional(),
    personal_recommendation: PersonalRecommendationSchema.optional(),
    validation_summary: ValidationSummarySchema.optional(),
    strategic_implications: StrategicImplicationsSchema.optional(),
    next_steps: z
      .union([NextStepsGranularSchema, z.array(z.string()).max(20)])
      .optional(),
    appendix: AppendixSchema.optional(),
    report_title: z.string().max(100).optional(),
    decision_architecture: LegacyDecisionArchitectureSchema.optional(),
    other_concepts: z.array(OtherConceptSchema).max(30).default([]),
    problem_restatement: z.string().optional(),
    key_insights: z.array(z.string()).max(20).default([]),
  })
  .passthrough();

export type AN5_M_Output = z.infer<typeof AN5_M_OutputSchema>;
export type HybridLeadConcept = z.infer<typeof LeadConceptSchema>;
export type HybridOtherConcept = z.infer<typeof OtherConceptSchema>;
export type HybridParallelExploration = z.infer<
  typeof ParallelExplorationSchema
>;
export type HybridSparkConcept = z.infer<typeof SparkConceptSchema>;
