/**
 * Due Diligence Mode Zod Schemas
 *
 * Schemas for validating DD chain outputs.
 */
import { z } from 'zod';

// ============================================
// Shared Enums and Primitives
// ============================================

export const ClaimType = z.enum([
  'PERFORMANCE',
  'NOVELTY',
  'MECHANISM',
  'FEASIBILITY',
  'TIMELINE',
  'COST',
  'MOAT',
]);

export const EvidenceLevel = z.enum([
  'DEMONSTRATED',
  'TESTED',
  'CITED',
  'CLAIMED',
  'IMPLIED',
]);

export const Verifiability = z.enum([
  'PHYSICS_CHECK',
  'LITERATURE_CHECK',
  'DATA_REQUIRED',
  'TEST_REQUIRED',
  'UNVERIFIABLE',
]);

export const ValidationPriority = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

export const Severity = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

export const Stage = z.enum([
  'Pre-seed',
  'Seed',
  'Series A',
  'Series B',
  'Growth',
]);

export const Verdict = z.enum([
  'VALIDATED',
  'PLAUSIBLE',
  'QUESTIONABLE',
  'IMPLAUSIBLE',
  'INVALID',
]);

export const MechanismVerdict = z.enum([
  'SOUND',
  'PLAUSIBLE',
  'QUESTIONABLE',
  'FLAWED',
]);

export const Confidence = z.enum(['HIGH', 'MEDIUM', 'LOW']);

export const NoveltyClassification = z.enum([
  'GENUINELY_NOVEL',
  'NOVEL_COMBINATION',
  'NOVEL_APPLICATION',
  'INCREMENTAL',
  'NOT_NOVEL',
]);

export const MoatStrength = z.enum(['STRONG', 'MODERATE', 'WEAK', 'NONE']);

export const Track = z.enum([
  'simpler_path',
  'best_fit',
  'paradigm_shift',
  'frontier_transfer',
]);

export const DDVerdict = z.enum([
  'COMPELLING',
  'PROMISING',
  'MIXED',
  'CONCERNING',
  'PASS',
]);

export const RecommendedAction = z.enum([
  'PROCEED',
  'PROCEED_WITH_CAUTION',
  'DEEP_DIVE_REQUIRED',
  'PASS',
]);

export const FindingType = z.enum([
  'STRENGTH',
  'WEAKNESS',
  'OPPORTUNITY',
  'THREAT',
]);

// ============================================
// DD0 Output Schema - Claim Extraction
// ============================================

export const DD0_M_OutputSchema = z.object({
  startup_profile: z.object({
    company_name: z.string(),
    technology_domain: z.string(),
    stage: Stage,
    team_background: z.string().optional(),
  }),

  problem_extraction: z.object({
    business_framing: z.string(),
    engineering_framing: z.string(),
    constraints_stated: z.array(z.string()),
    constraints_implied: z.array(z.string()),
    success_metrics_stated: z.array(z.string()),
    success_metrics_implied: z.array(z.string()),
    problem_statement_for_analysis: z.string(),
  }),

  proposed_solution: z.object({
    approach_summary: z.string(),
    core_mechanism: z.string(),
    key_components: z.array(z.string()),
    claimed_advantages: z.array(z.string()),
  }),

  novelty_claims: z.array(
    z.object({
      claim: z.string(),
      basis: z.string(),
      evidence_provided: z.string(),
      prior_art_search_query: z.string(),
    }),
  ),

  technical_claims: z.array(
    z.object({
      id: z.string(),
      claim_text: z.string(),
      claim_type: ClaimType,
      evidence_level: EvidenceLevel,
      verifiability: Verifiability,
      source_in_materials: z.string(),
      validation_priority: ValidationPriority,
      validation_approach: z.string(),
    }),
  ),

  mechanism_claims: z.array(
    z.object({
      id: z.string(),
      mechanism: z.string(),
      how_described: z.string(),
      depth_of_explanation: z.enum([
        'DETAILED',
        'MODERATE',
        'SUPERFICIAL',
        'HAND_WAVY',
      ]),
      physics_to_validate: z.array(z.string()),
      potential_contradictions: z.array(z.string()),
    }),
  ),

  red_flags: z.array(
    z.object({
      flag_type: z.enum([
        'PHYSICS_VIOLATION',
        'EXCEEDS_LIMITS',
        'UNSUPPORTED_NOVELTY',
        'VAGUE_MECHANISM',
        'TRL_MISMATCH',
        'UNBASED_ECONOMICS',
        'TIMELINE_UNREALISTIC',
      ]),
      description: z.string(),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM']),
      related_claim_id: z.string(),
      question_for_founders: z.string(),
    }),
  ),

  information_gaps: z.array(
    z.object({
      gap: z.string(),
      why_needed: z.string(),
      impact_if_missing: z.string(),
    }),
  ),

  competitive_context_claimed: z.object({
    named_competitors: z.array(z.string()),
    claimed_differentiation: z.array(z.string()),
    market_position_claimed: z.string(),
  }),

  search_seeds: z.object({
    prior_art_queries: z.array(z.string()),
    competitor_queries: z.array(z.string()),
    mechanism_queries: z.array(z.string()),
    failure_mode_queries: z.array(z.string()),
  }),
});

export type DD0_M_Output = z.infer<typeof DD0_M_OutputSchema>;

// ============================================
// DD3 Output Schema - Claim Validation
// ============================================

export const DD3_M_OutputSchema = z.object({
  validation_summary: z.object({
    overall_technical_assessment: z.string(),
    critical_claims_status: z.string(),
    mechanism_validity: MechanismVerdict,
    key_concern: z.string(),
    key_strength: z.string(),
  }),

  physics_validation: z.array(
    z.object({
      claim_id: z.string(),
      claim_text: z.string(),
      governing_physics: z.object({
        principle: z.string(),
        equation: z.string().optional(),
        theoretical_limit: z.string(),
      }),
      validation_analysis: z.object({
        claim_vs_limit: z.string(),
        assumptions_required: z.array(z.string()),
        assumption_validity: z.string(),
      }),
      verdict: Verdict,
      confidence: Confidence,
      confidence_percent: z.number().min(0).max(100),
      reasoning: z.string(),
    }),
  ),

  mechanism_validation: z.object({
    claimed_mechanism: z.string(),
    actual_physics: z.string(),
    accuracy_assessment: z.enum([
      'ACCURATE',
      'OVERSIMPLIFIED',
      'PARTIALLY_WRONG',
      'FUNDAMENTALLY_WRONG',
    ]),

    mechanism_deep_dive: z.object({
      working_principle: z.string(),
      rate_limiting_step: z.string(),
      key_parameters: z.array(
        z.object({
          parameter: z.string(),
          startup_claim: z.string(),
          validated_range: z.string(),
          gap: z.string(),
        }),
      ),
      failure_modes: z.array(
        z.object({
          mode: z.string(),
          trigger: z.string(),
          startup_addresses: z.boolean(),
          mitigation_quality: z.enum(['STRONG', 'ADEQUATE', 'WEAK', 'MISSING']),
        }),
      ),
    }),

    mechanism_precedent: z.object({
      demonstrated_elsewhere: z.boolean(),
      where: z.string(),
      at_what_scale: z.string(),
      key_differences: z.string(),
    }),

    verdict: MechanismVerdict,
    confidence: Confidence,
    reasoning: z.string(),
  }),

  triz_analysis: z.object({
    problem_contradictions: z.array(
      z.object({
        contradiction: z.string(),
        type: z.enum(['TECHNICAL', 'PHYSICAL']),
        improving_parameter: z.string(),
        worsening_parameter: z.string(),
        startup_awareness: z.enum(['IDENTIFIED', 'PARTIALLY_AWARE', 'UNAWARE']),
        startup_resolution: z.string(),
        resolution_validity: z.enum([
          'RESOLVED',
          'PARTIALLY_RESOLVED',
          'UNRESOLVED',
          'IGNORED',
        ]),
        standard_resolution: z.string(),
        inventive_principles_applicable: z.array(z.string()),
      }),
    ),

    missed_contradictions: z.array(
      z.object({
        contradiction: z.string(),
        why_it_matters: z.string(),
        likely_manifestation: z.string(),
      }),
    ),

    triz_assessment: z.object({
      contradiction_awareness: Confidence,
      resolution_quality: z.enum(['ELEGANT', 'ADEQUATE', 'PARTIAL', 'POOR']),
      inventive_level: z.number().min(1).max(5),
      inventive_level_rationale: z.string(),
    }),
  }),

  feasibility_validation: z.object({
    scale_assessment: z.object({
      current_demonstrated_scale: z.string(),
      claimed_target_scale: z.string(),
      scaling_challenges: z.array(
        z.object({
          challenge: z.string(),
          nonlinearity: z.string(),
          startup_addresses: z.boolean(),
          assessment: z.enum(['MANAGEABLE', 'SIGNIFICANT', 'SEVERE']),
        }),
      ),
      scale_verdict: z.enum(['FEASIBLE', 'CHALLENGING', 'UNLIKELY']),
    }),

    cost_assessment: z.object({
      claimed_cost: z.string(),
      cost_basis_provided: z.string(),
      cost_basis_quality: z.enum([
        'DETAILED',
        'REASONABLE',
        'SUPERFICIAL',
        'MISSING',
      ]),
      hidden_costs_identified: z.array(
        z.object({
          cost: z.string(),
          estimated_impact: z.string(),
          basis: z.string(),
        }),
      ),
      realistic_cost_range: z.string(),
      cost_verdict: z.enum(['REALISTIC', 'OPTIMISTIC', 'UNREALISTIC']),
    }),

    timeline_assessment: z.object({
      claimed_timeline: z.string(),
      trl_current: z.string(),
      trl_claimed: z.string(),
      timeline_verdict: z.enum(['REALISTIC', 'AGGRESSIVE', 'UNREALISTIC']),
      realistic_timeline: z.string(),
    }),
  }),

  internal_consistency: z.object({
    consistent: z.boolean(),
    inconsistencies: z.array(
      z.object({
        claim_1: z.string(),
        claim_2: z.string(),
        conflict: z.string(),
        severity: z.enum(['CRITICAL', 'MODERATE', 'MINOR']),
      }),
    ),
  }),

  validation_verdicts: z.array(
    z.object({
      claim_id: z.string(),
      claim_summary: z.string(),
      verdict: Verdict,
      confidence: Confidence,
      one_line_reasoning: z.string(),
    }),
  ),

  critical_questions_for_founders: z.array(
    z.object({
      question: z.string(),
      why_critical: z.string(),
      good_answer_looks_like: z.string(),
      bad_answer_looks_like: z.string(),
    }),
  ),

  technical_credibility_score: z.object({
    score: z.number().min(1).max(10),
    out_of: z.number(),
    breakdown: z.object({
      physics_validity: z.number(),
      mechanism_soundness: z.number(),
      feasibility_realism: z.number(),
      internal_consistency: z.number(),
    }),
    rationale: z.string(),
  }),
});

export type DD3_M_Output = z.infer<typeof DD3_M_OutputSchema>;

// ============================================
// DD4 Output Schema - Solution Space Mapping
// ============================================

export const DD4_M_OutputSchema = z.object({
  solution_space_position: z.object({
    primary_track: Track,
    track_rationale: z.string(),

    fit_assessment: z.object({
      optimal_for_problem: z.boolean(),
      explanation: z.string(),
      what_first_principles_suggests: z.string(),
      alignment: z.enum(['ALIGNED', 'PARTIALLY_ALIGNED', 'MISALIGNED']),
    }),

    problem_framing_assessment: z.object({
      their_framing: z.string(),
      optimal_framing: z.string(),
      framing_quality: z.enum([
        'OPTIMAL',
        'GOOD',
        'SUBOPTIMAL',
        'WRONG_PROBLEM',
      ]),
      implications: z.string(),
    }),
  }),

  missed_alternatives: z.array(
    z.object({
      concept_from_an3: z.string(),
      concept_summary: z.string(),
      track: z.string(),
      why_potentially_better: z.string(),
      why_startup_might_have_missed: z.string(),
      competitive_threat_level: Severity,
      who_might_pursue: z.string(),
    }),
  ),

  novelty_assessment: z.object({
    claimed_novelty: z.string(),

    prior_art_findings: z.array(
      z.object({
        source_type: z.enum(['PATENT', 'ACADEMIC', 'COMMERCIAL', 'ABANDONED']),
        reference: z.string(),
        relevance: z.string(),
        what_it_covers: z.string(),
        implications: z.string(),
      }),
    ),

    novelty_verdict: z.object({
      classification: NoveltyClassification,
      what_is_actually_novel: z.string(),
      what_is_not_novel: z.string(),
      confidence: Confidence,
      reasoning: z.string(),
    }),

    novelty_vs_claimed: z.object({
      claimed_accurate: z.boolean(),
      overclaim: z.string(),
      underclaim: z.string(),
    }),
  }),

  moat_assessment: z.object({
    technical_moat: z.object({
      patentability: MoatStrength,
      patent_rationale: z.string(),
      trade_secret_potential: z.enum(['STRONG', 'MODERATE', 'WEAK']),
      replication_difficulty: z.enum(['VERY_HARD', 'HARD', 'MODERATE', 'EASY']),
      time_to_replicate: z.string(),
      key_barriers: z.array(z.string()),
    }),

    execution_moat: z.object({
      expertise_rarity: z.string(),
      data_advantage: z.string(),
      network_effects: z.string(),
      regulatory_barrier: z.string(),
      switching_costs: z.string(),
    }),

    overall_moat: z.object({
      strength: MoatStrength,
      durability: z.string(),
      primary_source: z.string(),
      key_vulnerabilities: z.array(z.string()),
    }),
  }),

  competitive_risk_analysis: z.object({
    threats_from_solution_space: z.array(
      z.object({
        threat_source: z.string(),
        threat_type: z.enum([
          'DIRECT_COMPETITION',
          'SUBSTITUTION',
          'DISRUPTION',
        ]),
        threat_level: Severity,
        time_horizon: z.string(),
        likelihood: Confidence,
        startup_vulnerability: z.string(),
        mitigation_possible: z.string(),
      }),
    ),

    simpler_path_risk: z.object({
      simpler_alternatives_exist: z.boolean(),
      could_be_good_enough: z.boolean(),
      explanation: z.string(),
    }),

    paradigm_shift_risk: z.object({
      disruptive_approaches_emerging: z.boolean(),
      threats: z.array(z.string()),
      timeline: z.string(),
    }),

    timing_assessment: z.object({
      market_timing: z.enum(['EARLY', 'RIGHT', 'LATE']),
      technology_timing: z.string(),
      dependencies: z.array(z.string()),
      risk: z.string(),
    }),
  }),

  key_insights: z.array(
    z.object({
      insight: z.string(),
      type: FindingType,
      investment_implication: z.string(),
    }),
  ),

  strategic_questions: z.array(
    z.object({
      question: z.string(),
      why_it_matters: z.string(),
      what_good_looks_like: z.string(),
    }),
  ),
});

export type DD4_M_Output = z.infer<typeof DD4_M_OutputSchema>;

// ============================================
// DD5 Output Schema - DD Report
// ============================================

export const DD5_M_OutputSchema = z.object({
  header: z.object({
    report_type: z.literal('Technical Due Diligence Report'),
    company_name: z.string(),
    technology_domain: z.string(),
    date: z.string(),
    version: z.string(),
    classification: z.string(),
  }),

  executive_summary: z.object({
    verdict: DDVerdict,
    verdict_confidence: Confidence,
    one_paragraph_summary: z.string(),
    key_findings: z.array(
      z.object({
        finding: z.string(),
        type: FindingType,
        investment_impact: Severity,
      }),
    ),
    technical_credibility_score: z.object({
      score: z.number(),
      out_of: z.number(),
      one_line: z.string(),
    }),
    recommendation: z.object({
      action: RecommendedAction,
      rationale: z.string(),
      key_condition: z.string().optional(),
    }),
  }),

  technical_thesis_assessment: z.object({
    their_thesis: z.string(),
    thesis_validity: z.object({
      verdict: MechanismVerdict,
      confidence: Confidence,
      explanation: z.string(),
    }),
    mechanism_assessment: z.object({
      mechanism: z.string(),
      physics_validity: z.string(),
      demonstrated_precedent: z.string(),
      key_uncertainty: z.string(),
    }),
    performance_claims: z.array(
      z.object({
        claim: z.string(),
        theoretical_limit: z.string(),
        verdict: z.enum([
          'VALIDATED',
          'PLAUSIBLE',
          'QUESTIONABLE',
          'IMPLAUSIBLE',
        ]),
        basis: z.string(),
      }),
    ),
  }),

  problem_framing_analysis: z.object({
    their_framing: z.string(),
    first_principles_framing: z.string(),
    framing_assessment: z.object({
      quality: z.enum(['OPTIMAL', 'GOOD', 'SUBOPTIMAL', 'MISFRAMED']),
      explanation: z.string(),
    }),
    problem_reframe: z.object({
      needed: z.boolean(),
      suggested_reframe: z.string().optional(),
      implication: z.string().optional(),
    }),
  }),

  solution_space_positioning: z.object({
    solution_landscape_summary: z.string(),
    startup_position: z.object({
      track: Track,
      description: z.string(),
      is_optimal_position: z.boolean(),
      explanation: z.string(),
    }),
    alternatives_analysis: z.object({
      stronger_alternatives_exist: z.boolean(),
      alternatives: z.array(
        z.object({
          approach: z.string(),
          track: z.string(),
          advantages: z.string(),
          competitive_threat: Severity,
        }),
      ),
    }),
    landscape_insight: z.string(),
  }),

  claim_validation_summary: z.object({
    claims_validated: z.number(),
    claims_questionable: z.number(),
    claims_invalid: z.number(),
    critical_claims: z.array(
      z.object({
        claim: z.string(),
        verdict: Verdict,
        confidence: Confidence,
        basis: z.string(),
      }),
    ),
    triz_findings: z.object({
      contradictions_identified: z.string(),
      resolution_quality: z.string(),
      unresolved_contradictions: z.array(z.string()),
    }),
  }),

  novelty_assessment: z.object({
    novelty_verdict: NoveltyClassification,
    what_is_actually_novel: z.string(),
    what_is_not_novel: z.string(),
    prior_art_highlights: z.array(
      z.object({
        reference: z.string(),
        relevance: z.string(),
      }),
    ),
    novelty_claim_accuracy: z.string(),
  }),

  moat_assessment: z.object({
    overall_moat: z.object({
      strength: MoatStrength,
      durability_years: z.number(),
      primary_source: z.string(),
    }),
    moat_breakdown: z.object({
      technical_barriers: z.enum(['STRONG', 'MODERATE', 'WEAK']),
      execution_barriers: z.enum(['STRONG', 'MODERATE', 'WEAK']),
      market_barriers: z.enum(['STRONG', 'MODERATE', 'WEAK']),
    }),
    moat_vulnerabilities: z.array(
      z.object({
        vulnerability: z.string(),
        severity: Severity,
      }),
    ),
    defensibility_verdict: z.string(),
  }),

  risk_analysis: z.object({
    technical_risks: z.array(
      z.object({
        risk: z.string(),
        probability: Confidence,
        impact: Severity,
        mitigation: z.string(),
      }),
    ),
    competitive_risks: z.array(
      z.object({
        risk: z.string(),
        severity: Severity,
        timeline: z.string(),
      }),
    ),
    key_risk_summary: z.string(),
  }),

  founder_questions: z.object({
    must_ask: z.array(
      z.object({
        question: z.string(),
        why_critical: z.string(),
        good_answer: z.string(),
        concerning_answer: z.string(),
      }),
    ),
    technical_deep_dives: z.array(
      z.object({
        topic: z.string(),
        specific_questions: z.array(z.string()),
      }),
    ),
  }),

  verdict_and_recommendation: z.object({
    technical_verdict: z.object({
      verdict: DDVerdict,
      confidence: Confidence,
      summary: z.string(),
    }),
    investment_recommendation: z.object({
      action: RecommendedAction,
      conditions: z.array(z.string()),
      key_derisking_steps: z.array(z.string()),
    }),
    final_word: z.string(),
  }),

  appendix: z.object({
    methodology_note: z.string(),
    solution_space_concepts_considered: z.array(z.string()),
    prior_art_references: z.array(z.string()),
  }),
});

export type DD5_M_Output = z.infer<typeof DD5_M_OutputSchema>;
