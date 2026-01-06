/**
 * DD Report v2 Schema - Ultra-Antifragile
 *
 * This schema NEVER crashes on malformed LLM output.
 * Every field has defaults and graceful degradation.
 */
import { z } from 'zod';

import {
  safeArray,
  safeEnum,
  safeNumber,
  safeOptionalString,
  safeString,
} from './schema-helpers';

// ============================================
// ENUM DEFINITIONS with synonym support
// ============================================
const Confidence = safeEnum(
  ['HIGH', 'MEDIUM', 'LOW'] as const,
  'MEDIUM',
  'confidence',
);
const Verdict = safeEnum(
  ['VALIDATED', 'PLAUSIBLE', 'QUESTIONABLE', 'INVALID'] as const,
  'PLAUSIBLE',
  'claimVerdict',
);
const Severity = safeEnum(
  ['HIGH', 'MEDIUM', 'LOW'] as const,
  'MEDIUM',
  'severity',
);
const OverallVerdict = safeEnum(
  ['PROMISING', 'CAUTION', 'PASS'] as const,
  'CAUTION',
  'verdict',
);
const Action = safeEnum(
  ['PROCEED', 'PROCEED_WITH_CAUTION', 'PASS'] as const,
  'PROCEED_WITH_CAUTION',
  'action',
);
const MoatStrength = safeEnum(
  ['STRONG', 'MODERATE', 'WEAK'] as const,
  'MODERATE',
  'moat',
);
const Novelty = safeEnum(
  ['NOVEL', 'INCREMENTAL', 'DERIVATIVE'] as const,
  'INCREMENTAL',
  'novelty',
);
const FindingType = safeEnum(
  ['STRENGTH', 'WEAKNESS', 'OPPORTUNITY', 'THREAT'] as const,
  'STRENGTH',
  'findingType',
);

// ============================================
// Shared Schemas
// ============================================
const ScoreSchema = z
  .object({
    score: safeNumber(5, 0, 10),
    out_of: safeNumber(10, 1, 10),
    one_liner: safeString(),
  })
  .catch({ score: 5, out_of: 10, one_liner: '' });

const KeyFindingSchema = z
  .object({
    finding: safeString(),
    type: FindingType,
    impact: Severity,
  })
  .catch({ finding: '', type: 'STRENGTH', impact: 'MEDIUM' });

// ============================================
// Section Schemas (19 sections)
// ============================================

// 1. Header
export const HeaderSchema = z
  .object({
    company_name: safeString(500),
    date: safeString(50),
    classification: safeOptionalString(),
    report_type: safeOptionalString(),
    technology_domain: safeOptionalString(),
    version: safeString(20).default('2.0.0'),
  })
  .catch({
    company_name: 'Unknown Company',
    date: new Date().toISOString().split('T')[0]!,
    classification: undefined,
    report_type: undefined,
    technology_domain: undefined,
    version: '2.0.0',
  });

// 2. Executive Summary
export const ExecutiveSummarySchema = z
  .object({
    one_paragraph_summary: safeString(),
    key_findings: safeArray(KeyFindingSchema),
    scores: z
      .object({
        technical_credibility: ScoreSchema.optional(),
        commercial_viability: ScoreSchema.optional(),
        team_signals: ScoreSchema.optional(),
        moat_strength: ScoreSchema.optional(),
      })
      .catch({}),
    verdict: OverallVerdict,
    verdict_confidence: Confidence,
    recommendation: z
      .object({
        action: Action,
        rationale: safeOptionalString(),
        key_conditions: safeArray(safeString()),
      })
      .catch({ action: 'PROCEED_WITH_CAUTION', key_conditions: [] }),
  })
  .optional()
  .catch(undefined);

// 3. One Page Summary
export const OnePageSummarySchema = z
  .object({
    company: safeString(),
    sector: safeOptionalString(),
    stage: safeOptionalString(),
    ask: safeOptionalString(),
    one_sentence: safeString(),
    the_bet: safeOptionalString(),
    key_strength: safeOptionalString(),
    key_risk: safeOptionalString(),
    key_question: safeOptionalString(),
    closest_comparable: safeOptionalString(),
    expected_return: safeOptionalString(),
    bull_case_2_sentences: safeOptionalString(),
    bear_case_2_sentences: safeOptionalString(),
    if_you_do_one_thing: safeOptionalString(),
    verdict_box: z
      .object({
        overall: safeOptionalString(),
        technical_validity: z
          .object({ verdict: safeString(), symbol: safeOptionalString() })
          .optional(),
        commercial_viability: z
          .object({ verdict: safeString(), symbol: safeOptionalString() })
          .optional(),
        moat_strength: z
          .object({ verdict: safeString(), symbol: safeOptionalString() })
          .optional(),
        solution_space_position: z
          .object({ verdict: safeString(), symbol: safeOptionalString() })
          .optional(),
        timing: z
          .object({ verdict: safeString(), symbol: safeOptionalString() })
          .optional(),
      })
      .catch({}),
  })
  .optional()
  .catch(undefined);

// 4. Problem Primer
export const ProblemPrimerSchema = z
  .object({
    section_purpose: safeOptionalString(),
    problem_overview: z
      .object({
        plain_english: safeString(),
        why_it_matters: safeString(),
        market_context: safeOptionalString(),
      })
      .optional(),
    physics_foundation: z
      .object({
        governing_principles: safeArray(
          z.object({
            principle: safeString(),
            plain_english: safeString(),
            implication: safeString(),
          }),
        ),
        thermodynamic_limits: z
          .object({
            theoretical_minimum: safeOptionalString(),
            current_best_achieved: safeOptionalString(),
            gap_explanation: safeOptionalString(),
          })
          .optional(),
        rate_limiting_factors: safeArray(safeString()),
      })
      .optional(),
    key_contradictions: safeArray(
      z.object({
        tradeoff: safeString(),
        if_you_improve: safeString(),
        typically_worsens: safeString(),
        how_different_approaches_resolve: safeOptionalString(),
      }),
    ),
    key_insight: safeOptionalString(),
    success_requirements: z
      .object({
        physics_gates: safeArray(safeString()),
        engineering_challenges: safeArray(safeString()),
        commercial_thresholds: safeArray(safeString()),
      })
      .optional(),
    where_value_created: z
      .object({
        bottleneck_today: safeOptionalString(),
        what_breakthrough_would_unlock: safeOptionalString(),
        who_captures_value: safeOptionalString(),
      })
      .optional(),
  })
  .optional()
  .catch(undefined);

// 5. Technical Thesis Assessment
export const TechnicalThesisSchema = z
  .object({
    their_thesis: safeString(),
    thesis_validity: z
      .object({
        verdict: Verdict,
        confidence: Confidence,
        explanation: safeString(),
      })
      .optional(),
    mechanism_assessment: z
      .object({
        mechanism: safeString(),
        physics_validity: safeOptionalString(),
        precedent: safeOptionalString(),
        key_uncertainty: safeOptionalString(),
      })
      .optional(),
    performance_claims: safeArray(
      z.object({
        claim: safeString(),
        theoretical_limit: safeOptionalString(),
        verdict: Verdict,
        explanation: safeOptionalString(),
      }),
    ),
  })
  .optional()
  .catch(undefined);

// 6. Claim Validation Summary
export const ClaimValidationSchema = z
  .object({
    overview: safeOptionalString(),
    critical_claims: safeArray(
      z.object({
        claim: safeString(),
        verdict: Verdict,
        confidence: Confidence,
        plain_english: safeString(),
      }),
    ),
    triz_findings: z
      .object({
        key_contradictions: safeOptionalString(),
        resolution_quality: safeOptionalString(),
      })
      .optional(),
  })
  .optional()
  .catch(undefined);

// 7. Solution Landscape
const SolutionConceptSchema = z.object({
  name: safeString(),
  one_liner: safeString(),
  mechanism: safeOptionalString(),
  maturity: safeOptionalString(),
  key_advantage: safeOptionalString(),
  key_challenge: safeOptionalString(),
  current_players: safeArray(safeString()),
  threat_to_startup: Severity,
  threat_reasoning: safeOptionalString(),
});

export const SolutionLandscapeSchema = z
  .object({
    section_purpose: safeOptionalString(),
    landscape_overview: z
      .object({
        total_approaches_analyzed: safeNumber(0, 0, 100).optional(),
        how_we_generated: safeOptionalString(),
        key_insight: safeOptionalString(),
      })
      .optional(),
    solution_space_by_track: z
      .object({
        simpler_path: z
          .object({
            track_description: safeOptionalString(),
            concepts: safeArray(SolutionConceptSchema),
          })
          .optional(),
        best_fit: z
          .object({
            track_description: safeOptionalString(),
            concepts: safeArray(SolutionConceptSchema),
          })
          .optional(),
        frontier_transfer: z
          .object({
            track_description: safeOptionalString(),
            concepts: safeArray(SolutionConceptSchema),
          })
          .optional(),
        paradigm_shift: z
          .object({
            track_description: safeOptionalString(),
            concepts: safeArray(SolutionConceptSchema),
          })
          .optional(),
      })
      .optional(),
    startup_positioning: z
      .object({
        which_track: safeOptionalString(),
        which_concept_closest: safeOptionalString(),
        positioning_verdict: safeOptionalString(),
        positioning_explanation: safeOptionalString(),
        what_first_principles_recommends: safeOptionalString(),
        is_optimal_track: z.boolean().catch(false).optional(),
      })
      .optional(),
    missed_opportunities_deep_dive: safeArray(
      z.object({
        approach: safeString(),
        why_startup_missed: safeOptionalString(),
        why_potentially_better: safeOptionalString(),
        what_startup_would_say: safeOptionalString(),
        our_assessment: safeOptionalString(),
        investment_implication: safeOptionalString(),
      }),
    ),
    the_implicit_bet: z
      .object({
        what_they_are_betting_on: safeOptionalString(),
        what_they_are_betting_against: safeArray(safeString()),
        what_must_be_true: safeArray(safeString()),
        bet_quality: safeOptionalString(),
      })
      .optional(),
    competitive_threat_summary: z
      .object({
        highest_threats: safeArray(safeString()),
        timeline_to_threat: safeOptionalString(),
        startup_defense: safeOptionalString(),
      })
      .optional(),
    strategic_insight: safeOptionalString(),
  })
  .optional()
  .catch(undefined);

// 8. Novelty Assessment
export const NoveltyAssessmentSchema = z
  .object({
    verdict: Novelty,
    what_is_novel: safeOptionalString(),
    what_is_not_novel: safeOptionalString(),
    key_prior_art: safeArray(
      z.object({
        reference: safeString(),
        relevance: safeOptionalString(),
        impact: safeOptionalString(),
      }),
    ),
  })
  .optional()
  .catch(undefined);

// 9. Moat Assessment
export const MoatAssessmentSchema = z
  .object({
    overall: z
      .object({
        strength: MoatStrength,
        durability_years: safeNumber(3, 0, 20).optional(),
        primary_source: safeOptionalString(),
      })
      .optional(),
    breakdown: z
      .object({
        technical: MoatStrength.optional(),
        market: MoatStrength.optional(),
        execution: MoatStrength.optional(),
      })
      .optional(),
    vulnerabilities: safeArray(
      z.object({
        vulnerability: safeString(),
        severity: Severity,
      }),
    ),
  })
  .optional()
  .catch(undefined);

// 10. Commercialization Reality
export const CommercializationSchema = z
  .object({
    summary: safeOptionalString(),
    verdict: safeOptionalString(),
    market_readiness: z
      .object({
        market_exists: z.boolean().catch(false).optional(),
        vitamin_or_painkiller: safeOptionalString(),
        customer_evidence: safeOptionalString(),
      })
      .optional(),
    unit_economics: z
      .object({
        today: safeOptionalString(),
        claimed_at_scale: safeOptionalString(),
        credibility: safeOptionalString(),
        what_must_be_true: safeOptionalString(),
      })
      .optional(),
    path_to_revenue: z
      .object({
        timeline: safeOptionalString(),
        capital_required: safeOptionalString(),
        fits_vc_timeline: z.boolean().catch(false).optional(),
      })
      .optional(),
    scale_up_risk: z
      .object({
        valley_of_death: safeOptionalString(),
        stranding_risk: safeOptionalString(),
      })
      .optional(),
    policy_exposure: z
      .object({
        exposure_level: Severity.optional(),
        critical_policies: safeArray(safeString()),
        impact_if_changed: safeOptionalString(),
      })
      .optional(),
    the_hard_truth: z
      .object({
        even_if_physics_works: safeOptionalString(),
        critical_commercial_question: safeOptionalString(),
      })
      .optional(),
  })
  .optional()
  .catch(undefined);

// 11. Risk Analysis
export const RiskAnalysisSchema = z
  .object({
    key_risk_summary: safeOptionalString(),
    technical_risks: safeArray(
      z.object({
        risk: safeString(),
        probability: Severity.optional(),
        impact: Severity.optional(),
        mitigation: safeOptionalString(),
      }),
    ),
    commercial_risks: safeArray(
      z.object({
        risk: safeString(),
        severity: Severity.optional(),
      }),
    ),
    competitive_risks: safeArray(
      z.object({
        risk: safeString(),
        timeline: safeOptionalString(),
      }),
    ),
  })
  .optional()
  .catch(undefined);

// 12. Scenario Analysis
const ScenarioSchema = z.object({
  probability: safeOptionalString(),
  narrative: safeString(),
  return: safeOptionalString(),
});

export const ScenarioAnalysisSchema = z
  .object({
    bull_case: ScenarioSchema.optional(),
    base_case: ScenarioSchema.optional(),
    bear_case: ScenarioSchema.optional(),
    expected_value: z
      .object({
        weighted_multiple: safeOptionalString(),
        assessment: safeOptionalString(),
      })
      .optional(),
  })
  .optional()
  .catch(undefined);

// 13. Pre-Mortem
export const PreMortemSchema = z
  .object({
    framing: safeOptionalString(),
    most_likely_failure: z
      .object({
        probability: safeOptionalString(),
        scenario: safeString(),
        preventable_by: safeOptionalString(),
        early_warnings: safeArray(safeString()),
      })
      .optional(),
    second_most_likely: z
      .object({
        probability: safeOptionalString(),
        scenario: safeString(),
      })
      .optional(),
    black_swan: z
      .object({
        probability: safeOptionalString(),
        scenario: safeString(),
      })
      .optional(),
  })
  .optional()
  .catch(undefined);

// 14. Confidence Calibration
const ConfidenceItemSchema = z.object({
  assessment: safeString(),
  basis: safeOptionalString(),
  confidence: safeOptionalString(),
});

export const ConfidenceCalibrationSchema = z
  .object({
    high_confidence: safeArray(ConfidenceItemSchema),
    medium_confidence: safeArray(ConfidenceItemSchema),
    low_confidence: safeArray(ConfidenceItemSchema),
    known_unknowns: safeArray(safeString()),
    where_surprises_lurk: safeArray(safeString()),
  })
  .optional()
  .catch(undefined);

// 15. Comparable Analysis
export const ComparableAnalysisSchema = z
  .object({
    base_rate: z
      .object({
        category_success_rate: safeOptionalString(),
        this_company_vs_base: safeOptionalString(),
      })
      .optional(),
    closest_comparables: safeArray(
      z.object({
        company: safeString(),
        similarity: safeOptionalString(),
        outcome: safeOptionalString(),
        lesson: safeOptionalString(),
      }),
    ),
  })
  .optional()
  .catch(undefined);

// 16. Founder Questions
export const FounderQuestionsSchema = z
  .object({
    must_ask: safeArray(
      z.object({
        question: safeString(),
        why_critical: safeOptionalString(),
        good_answer: safeOptionalString(),
        bad_answer: safeOptionalString(),
      }),
    ),
    technical_deep_dives: safeArray(
      z.object({
        topic: safeString(),
        questions: safeArray(safeString()),
      }),
    ),
    commercial_deep_dives: safeArray(
      z.object({
        topic: safeString(),
        questions: safeArray(safeString()),
      }),
    ),
  })
  .optional()
  .catch(undefined);

// 17. Diligence Roadmap
export const DiligenceRoadmapSchema = z
  .object({
    before_term_sheet: safeArray(
      z.object({
        action: safeString(),
        purpose: safeOptionalString(),
        time: safeOptionalString(),
        cost: safeOptionalString(),
        who: safeOptionalString(),
        deal_breaker_if: safeOptionalString(),
        priority: safeOptionalString(),
      }),
    ),
    during_diligence: safeArray(
      z.object({
        action: safeString(),
        priority: safeOptionalString(),
      }),
    ),
    documents_to_request: safeArray(safeString()),
    reference_calls: safeArray(
      z.object({
        who: safeString(),
        why: safeOptionalString(),
        key_questions: safeArray(safeString()),
      }),
    ),
    technical_validation: safeArray(
      z.object({
        what: safeString(),
        how: safeOptionalString(),
        time: safeOptionalString(),
        cost: safeOptionalString(),
        who_can_help: safeOptionalString(),
      }),
    ),
  })
  .optional()
  .catch(undefined);

// 18. Why This Might Be Wrong
export const WhyWrongSchema = z
  .object({
    strongest_counter_argument: safeOptionalString(),
    our_response: safeOptionalString(),
    if_we_are_too_positive: z
      .object({
        what_we_might_be_missing: safeOptionalString(),
        what_would_change_our_mind: safeOptionalString(),
      })
      .optional(),
    if_we_are_too_negative: z
      .object({
        what_we_might_be_missing: safeOptionalString(),
        what_would_change_our_mind: safeOptionalString(),
      })
      .optional(),
  })
  .optional()
  .catch(undefined);

// 19. Verdict and Recommendation
export const VerdictRecommendationSchema = z
  .object({
    overall_verdict: z
      .object({
        verdict: OverallVerdict,
        confidence: Confidence,
      })
      .optional(),
    technical_verdict: z
      .object({
        verdict: OverallVerdict.optional(),
        confidence: Confidence.optional(),
        summary: safeOptionalString(),
      })
      .optional(),
    commercial_verdict: z
      .object({
        verdict: safeOptionalString(),
        summary: safeOptionalString(),
      })
      .optional(),
    recommendation: z
      .object({
        action: Action,
        conditions: safeArray(safeString()),
        derisking_steps: safeArray(safeString()),
        timeline: safeOptionalString(),
      })
      .optional(),
    final_word: safeOptionalString(),
  })
  .optional()
  .catch(undefined);

// ============================================
// MAIN SCHEMA
// ============================================
export const DDReportSchema = z.object({
  header: HeaderSchema,
  executive_summary: ExecutiveSummarySchema,
  one_page_summary: OnePageSummarySchema,
  problem_primer: ProblemPrimerSchema,
  technical_thesis_assessment: TechnicalThesisSchema,
  claim_validation_summary: ClaimValidationSchema,
  solution_landscape: SolutionLandscapeSchema,
  novelty_assessment: NoveltyAssessmentSchema,
  moat_assessment: MoatAssessmentSchema,
  commercialization_reality: CommercializationSchema,
  risk_analysis: RiskAnalysisSchema,
  scenario_analysis: ScenarioAnalysisSchema,
  pre_mortem: PreMortemSchema,
  confidence_calibration: ConfidenceCalibrationSchema,
  comparable_analysis: ComparableAnalysisSchema,
  founder_questions: FounderQuestionsSchema,
  diligence_roadmap: DiligenceRoadmapSchema,
  why_this_might_be_wrong: WhyWrongSchema,
  verdict_and_recommendation: VerdictRecommendationSchema,
});

export type DDReport = z.infer<typeof DDReportSchema>;

/** Parse DD report data with full antifragility - NEVER throws */
export function parseDDReport(data: unknown): DDReport {
  return DDReportSchema.parse(data);
}
