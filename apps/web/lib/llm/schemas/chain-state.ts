import { z } from 'zod';

/**
 * Chain State Schema (v10)
 *
 * Full type-safe schema for the LLM chain state.
 * Updated for v10 architecture with 4-namespace retrieval,
 * teaching examples, first principles emphasis, and hard validation gates.
 */

// ============================================================================
// AN0 - Problem Framing (v10) schemas
// ============================================================================

const AN0AmbiguitySchema = z.object({
  type: z.enum([
    'scale',
    'property',
    'symptom_vs_cause',
    'metric',
    'constraint',
  ]),
  description: z.string(),
  resolution: z.string(),
});

const AN0KpiSchema = z.object({
  name: z.string(),
  current: z.string().optional(),
  target: z.string().optional(),
  unit: z.string().optional(),
});

const AN0ConstraintSchema = z.object({
  name: z.string(),
  reason: z.string(),
  flexibility: z.enum(['none', 'minimal', 'some']),
});

const AN0PhysicsSchema = z.object({
  governing_principles: z.array(z.string()),
  key_tradeoffs: z.array(z.string()),
  rate_limiting_factors: z.array(z.string()),
});

const AN0AssumedConstraintSchema = z.object({
  constraint: z.string(),
  type: z.enum(['physics', 'convention']),
  challenge: z.string(),
});

const AN0FirstPrinciplesSchema = z.object({
  fundamental_truths: z.array(z.string()),
  actual_goal: z.string(),
  assumed_constraints: z.array(AN0AssumedConstraintSchema),
  from_scratch_approaches: z.array(z.string()),
});

const AN0TrizParameterSchema = z.object({
  id: z.number().int().min(1).max(39),
  name: z.string(),
});

const AN0ContradictionSchema = z.object({
  improve_parameter: AN0TrizParameterSchema,
  worsen_parameter: AN0TrizParameterSchema,
  plain_english: z.string(),
});

const AN0TrizPrincipleSchema = z.object({
  id: z.number().int().min(1).max(40),
  name: z.string(),
  why_relevant: z.string(),
});

const AN0ParadigmSchema = z.object({
  approach: z.string(),
  examples: z.array(z.string()),
});

const AN0CrossDomainSeedSchema = z.object({
  domain: z.string(),
  similar_challenge: z.string(),
  why_relevant: z.string(),
});

const AN0CorpusQueriesSchema = z.object({
  teaching_examples: z.object({
    triz: z.array(z.string()),
    transfers: z.array(z.string()),
  }),
  validation: z.object({
    failures: z.array(z.string()),
    bounds: z.array(z.string()),
  }),
});

// ============================================================================
// AN1 - Corpus Retrieval (v10) - 4 namespaces
// ============================================================================

const CorpusItemSchema = z.object({
  id: z.string(),
  relevance_score: z.number(),
  title: z.string(),
  text_preview: z.string(),
  matched_query: z.string(),
  corpus: z.string(),
});

// ============================================================================
// AN1.5 - Teaching Selection (v10) schemas
// ============================================================================

const TrizExemplarSchema = z.object({
  id: z.string(),
  principle: z.object({
    number: z.number().int().min(1).max(40),
    name: z.string(),
  }),
  domain: z.string(),
  the_challenge: z.string(),
  obvious_approach: z.string(),
  brilliant_approach: z.string(),
  key_insight: z.string(),
  pattern: z.string(),
  why_selected: z.string(),
});

const TransferExemplarSchema = z.object({
  id: z.string(),
  title: z.string(),
  source_domain: z.string(),
  target_domain: z.string(),
  the_physics: z.string(),
  the_insight: z.string(),
  the_pattern: z.string(),
  why_selected: z.string(),
});

const FailurePatternSchema = z.object({
  id: z.string(),
  pattern_name: z.string(),
  mechanism_type: z.string(),
  what_fails: z.string(),
  root_cause: z.string(),
  check_first: z.string(),
  relevance: z.string(),
});

const ParameterBoundSchema = z.object({
  id: z.string(),
  parameter: z.string(),
  material_or_mechanism: z.string(),
  commercial_range: z.object({
    min: z.string(),
    max: z.string(),
    unit: z.string(),
  }),
  gotchas: z.array(z.string()),
  relevance: z.string(),
});

// ============================================================================
// AN1.7 - Literature Augmentation (v10) schemas
// ============================================================================

const CommercialPrecedentSchema = z.object({
  approach: z.string(),
  who_uses_it: z.array(z.string()),
  source: z.string(),
  parameters_reported: z.array(
    z.object({
      param: z.string(),
      value: z.string(),
      source: z.string(),
    }),
  ),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

const ProcessParameterSchema = z.object({
  parameter: z.string(),
  typical_range: z.string(),
  source: z.string(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

// ============================================================================
// AN2 - Innovation Briefing (v10) schemas
// ============================================================================

const InnovationPatternSchema = z.object({
  pattern_name: z.string(),
  mechanism: z.string(),
  when_to_use: z.string(),
  exemplar_source: z.string(),
  application_hint: z.string(),
});

const DomainToMineSchema = z.object({
  domain: z.string(),
  similar_physics: z.string(),
  mechanisms_to_explore: z.array(z.string()),
  abstraction: z.string(),
});

const TrizGuidanceEntrySchema = z.object({
  principle: z.object({
    id: z.number().int().min(1).max(40),
    name: z.string(),
  }),
  obvious_application: z.string(),
  brilliant_application: z.string(),
  pattern: z.string(),
});

const DesignConstraintFailureSchema = z.object({
  failure: z.string(),
  mechanism: z.string(),
  design_rule: z.string(),
});

const DesignConstraintLimitSchema = z.object({
  parameter: z.string(),
  limit: z.string(),
  implication: z.string(),
});

// ============================================================================
// AN3 - Concept Generation (v10) schemas
// ============================================================================

const MechanisticDepthSchema = z.object({
  working_principle: z.string(),
  rate_limiting_step: z.string(),
  key_parameters: z.array(z.string()),
  failure_modes: z.array(z.string()),
});

const TrizPrincipleAppliedSchema = z
  .object({
    id: z.number().int().min(1).max(40),
    name: z.string(),
    how_applied: z.string(),
  })
  .nullable();

const InnovationSourceSchema = z.object({
  first_principles_reasoning: z.string().nullable().optional(),
  constraint_challenged: z.string().nullable().optional(),
  pattern_used: z.string(),
  cross_domain_inspiration: z.string().nullable().optional(),
  triz_principle: TrizPrincipleAppliedSchema.nullable().optional(),
  novelty_claim: z.string(),
});

const BoundsComplianceEntrySchema = z.object({
  parameter: z.string(),
  proposed_value: z.string(),
  limit: z.string(),
  status: z.enum(['OK', 'CONCERN', 'VIOLATION']),
});

const FailureModeRiskEntrySchema = z.object({
  failure: z.string(),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  mitigation: z.string(),
});

const FeasibilityCheckSchema = z.object({
  bounds_compliance: z.array(BoundsComplianceEntrySchema),
  failure_mode_risks: z.array(FailureModeRiskEntrySchema),
  manufacturing: z.enum(['Standard', 'Specialized', 'Custom']),
  materials: z.enum(['Off-shelf', 'Custom', 'Exotic']),
  overall_feasibility: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

const ValidationPathSchema = z.object({
  first_test: z.object({
    name: z.string(),
    method: z.string(),
    go_threshold: z.string(),
    no_go_threshold: z.string(),
  }),
  critical_unknowns: z.array(z.string()),
  kill_conditions: z.array(z.string()),
});

const ExpectedImpactSchema = z.object({
  primary_kpi_improvement: z.string(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  basis: z.string(),
});

const ConceptSchema = z.object({
  concept_id: z.string(),
  title: z.string(),
  track: z.enum(['simpler_path', 'best_fit', 'spark']),
  mechanism_description: z.string(),
  mechanistic_depth: MechanisticDepthSchema,
  innovation_source: InnovationSourceSchema,
  feasibility_check: FeasibilityCheckSchema,
  validation_path: ValidationPathSchema,
  expected_impact: ExpectedImpactSchema,
  tradeoffs: z.array(z.string()),
});

// ============================================================================
// AN4 - Evaluation & Validation (v10) schemas
// ============================================================================

const HardGateStatusSchema = z.enum(['PASS', 'CONCERN', 'FAIL']);
const OverallGateStatusSchema = z.enum(['PASS', 'CONDITIONAL', 'FAIL']);

const ValidationResultSchema = z.object({
  concept_id: z.string(),
  concept_title: z.string(),
  track: z.enum(['simpler_path', 'best_fit', 'spark']),
  hard_gates: z.object({
    bounds_compliance: z.object({
      status: HardGateStatusSchema,
      violations: z.array(
        z.object({
          parameter: z.string(),
          proposed: z.string(),
          limit: z.string(),
          severity: z.enum(['warning', 'critical']),
        }),
      ),
      notes: z.string(),
    }),
    failure_mode_risk: z.object({
      status: HardGateStatusSchema,
      risks_identified: z.array(
        z.object({
          failure: z.string(),
          likelihood: z.enum(['LOW', 'MEDIUM', 'HIGH']),
          mitigation_possible: z.boolean(),
        }),
      ),
      notes: z.string(),
    }),
    physics_compliance: z.object({
      status: HardGateStatusSchema,
      concerns: z.array(z.string()),
      notes: z.string(),
    }),
    overall_gate: OverallGateStatusSchema,
  }),
  evaluation: z.object({
    expected_impact: z.object({ score: z.number(), rationale: z.string() }),
    feasibility: z.object({ score: z.number(), rationale: z.string() }),
    validation_speed: z.object({ score: z.number(), rationale: z.string() }),
    risk_profile: z.object({ score: z.number(), rationale: z.string() }),
    innovation_value: z.object({ score: z.number(), rationale: z.string() }),
    overall_score: z.number(),
  }),
  critical_assumptions: z.array(z.string()),
  first_validation_step: z.string(),
});

const RecommendationSchema = z.object({
  primary: z.object({
    concept_id: z.string(),
    title: z.string(),
    why_this_one: z.string(),
    next_steps: z.array(z.string()),
    key_risk: z.string(),
    de_risk_plan: z.string(),
  }),
  parallel_spark: z.object({
    concept_id: z.string(),
    title: z.string(),
    why_explore: z.string(),
    validation_approach: z.string(),
  }),
  fallback: z.object({
    concept_id: z.string(),
    title: z.string(),
    when_to_use: z.string(),
  }),
});

// ============================================================================
// Full Chain State Schema (v10)
// ============================================================================

export const ChainStateSchema = z.object({
  // Identifiers
  conversationId: z.string(),
  reportId: z.string().uuid(),

  // User input
  userInput: z.string(),
  accountId: z.string().uuid(),
  userId: z.string().uuid(),

  // Clarification handling
  needsClarification: z.boolean().default(false),
  clarificationQuestion: z.string().nullish(),
  clarificationAnswer: z.string().optional(),
  clarificationCount: z.number().int().default(0),

  // =========================================================================
  // AN0 - Problem Framing (v10) outputs
  // =========================================================================
  an0_original_ask: z.string().optional(),
  an0_problem_interpretation: z.string().optional(),
  an0_ambiguities_detected: z.array(AN0AmbiguitySchema).default([]),
  an0_user_sector: z.string().optional(),
  an0_primary_kpis: z.array(AN0KpiSchema).default([]),
  an0_hard_constraints: z.array(AN0ConstraintSchema).default([]),
  an0_key_interfaces: z.array(z.string()).default([]),
  an0_physics_of_problem: AN0PhysicsSchema.optional(),
  an0_first_principles: AN0FirstPrinciplesSchema.optional(),
  an0_contradiction: AN0ContradictionSchema.optional(),
  an0_secondary_contradictions: z
    .array(
      z.object({
        improve: z.string(),
        worsen: z.string(),
        description: z.string(),
      }),
    )
    .default([]),
  an0_triz_principles: z.array(AN0TrizPrincipleSchema).default([]),
  an0_paradigms: z
    .object({
      direct: AN0ParadigmSchema,
      indirect: AN0ParadigmSchema,
    })
    .optional(),
  an0_cross_domain_seeds: z.array(AN0CrossDomainSeedSchema).default([]),
  an0_corpus_queries: AN0CorpusQueriesSchema.optional(),
  an0_web_search_queries: z.array(z.string()).default([]),
  an0_materials_mentioned: z.array(z.string()).default([]),
  an0_mechanisms_mentioned: z.array(z.string()).default([]),
  an0_reframed_problem: z.string().optional(),

  // =========================================================================
  // AN1 - Corpus Retrieval (v10) - 4 namespaces
  // =========================================================================
  an1_failures: z.array(CorpusItemSchema).default([]),
  an1_bounds: z.array(CorpusItemSchema).default([]),
  an1_transfers: z.array(CorpusItemSchema).default([]),
  an1_triz: z.array(CorpusItemSchema).default([]),
  an1_retrieval_summary: z.string().optional(),

  // =========================================================================
  // AN1.5 - Teaching Selection (v10) outputs
  // =========================================================================
  an1_5_triz_exemplars: z.array(TrizExemplarSchema).default([]),
  an1_5_transfer_exemplars: z.array(TransferExemplarSchema).default([]),
  an1_5_innovation_guidance: z.string().optional(),
  an1_5_failure_patterns: z.array(FailurePatternSchema).default([]),
  an1_5_parameter_bounds: z.array(ParameterBoundSchema).default([]),
  an1_5_corpus_gaps: z.array(z.string()).default([]),

  // =========================================================================
  // AN1.7 - Literature Augmentation (v10) outputs
  // =========================================================================
  an1_7_searches_performed: z.array(z.string()).default([]),
  an1_7_commercial_precedent: z.array(CommercialPrecedentSchema).default([]),
  an1_7_process_parameters: z.array(ProcessParameterSchema).default([]),
  an1_7_competitive_landscape: z.string().optional(),
  an1_7_literature_gaps: z.array(z.string()).default([]),

  // =========================================================================
  // AN2 - Innovation Briefing (v10) outputs
  // =========================================================================
  an2_first_principles_foundation: z
    .object({
      fundamental_truths: z.array(z.string()),
      actual_goal_restated: z.string(),
      constraints_challenged: z.array(
        z.object({
          constraint: z.string(),
          verdict: z.enum(['real', 'questionable', 'convention']),
          implication: z.string(),
        }),
      ),
      from_scratch_insight: z.string(),
    })
    .optional(),
  an2_problem_physics: z
    .object({
      core_challenge: z.string(),
      governing_equations: z.string(),
      key_tradeoff: z.string(),
      success_metric: z.string(),
    })
    .optional(),
  an2_innovation_patterns: z.array(InnovationPatternSchema).default([]),
  an2_cross_domain_map: z
    .object({
      domains_to_mine: z.array(DomainToMineSchema),
      transfer_thinking_prompt: z.string(),
    })
    .optional(),
  an2_triz_guidance: z
    .object({
      primary_principles: z.array(TrizGuidanceEntrySchema),
      principle_combination_hint: z.string(),
    })
    .optional(),
  an2_design_constraints: z
    .object({
      failure_modes_to_prevent: z.array(DesignConstraintFailureSchema),
      parameter_limits: z.array(DesignConstraintLimitSchema),
    })
    .optional(),
  an2_innovation_brief: z.string().optional(),

  // =========================================================================
  // AN3 - Concept Generation (v10) outputs
  // =========================================================================
  an3_concepts: z.array(ConceptSchema).default([]),
  an3_track_distribution: z
    .object({
      simpler_path: z.array(z.string()),
      best_fit: z.array(z.string()),
      spark: z.array(z.string()),
    })
    .optional(),
  an3_innovation_notes: z
    .object({
      most_promising: z.string(),
      highest_novelty: z.string(),
      best_risk_reward: z.string(),
      first_principles_winner: z.string(),
    })
    .optional(),
  an3_concepts_considered_but_rejected: z
    .array(
      z.object({
        idea: z.string(),
        why_rejected: z.string(),
      }),
    )
    .default([]),

  // =========================================================================
  // AN4 - Evaluation & Validation (v10) outputs
  // =========================================================================
  an4_validation_results: z.array(ValidationResultSchema).default([]),
  an4_gate_summary: z
    .object({
      passed: z.array(z.string()),
      conditional: z.array(z.string()),
      failed: z.array(z.string()),
      failure_reasons: z.array(
        z.object({
          concept_id: z.string(),
          reason: z.string(),
        }),
      ),
    })
    .optional(),
  an4_rankings: z
    .object({
      by_track: z.object({
        simpler_path: z.array(
          z.object({
            concept_id: z.string(),
            rank: z.number(),
            why: z.string(),
          }),
        ),
        best_fit: z.array(
          z.object({
            concept_id: z.string(),
            rank: z.number(),
            why: z.string(),
          }),
        ),
        spark: z.array(
          z.object({
            concept_id: z.string(),
            rank: z.number(),
            why: z.string(),
          }),
        ),
      }),
      overall: z.array(
        z.object({
          concept_id: z.string(),
          rank: z.number(),
          score: z.number(),
          one_liner: z.string(),
        }),
      ),
    })
    .optional(),
  an4_recommendation: RecommendationSchema.optional(),
  an4_validation_plan: z
    .object({
      critical_experiments: z.array(
        z.object({
          name: z.string(),
          tests_assumption: z.string(),
          method: z.string(),
          success_criteria: z.string(),
          estimated_effort: z.string(),
        }),
      ),
      kill_conditions: z.array(z.string()),
      pivot_triggers: z.array(z.string()),
    })
    .optional(),

  // =========================================================================
  // AN5 - Executive Report (v10) outputs
  // =========================================================================
  an5_report: z.unknown().optional(), // Full AN5 report object
  an5_report_markdown: z.string().optional(), // Rendered markdown version

  // =========================================================================
  // Tracking
  // =========================================================================
  currentStep: z.string().optional(),
  completedSteps: z.array(z.string()).default([]),
  error: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

export type ChainState = z.infer<typeof ChainStateSchema>;
export type Concept = z.infer<typeof ConceptSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

/**
 * Create initial chain state from report generation event
 */
export function createInitialChainState(params: {
  reportId: string;
  accountId: string;
  userId: string;
  designChallenge: string;
  conversationId: string;
}): ChainState {
  return ChainStateSchema.parse({
    conversationId: params.conversationId,
    reportId: params.reportId,
    userInput: params.designChallenge,
    accountId: params.accountId,
    userId: params.userId,
    startedAt: new Date().toISOString(),
  });
}
