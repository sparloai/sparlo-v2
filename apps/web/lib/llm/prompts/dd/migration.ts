import 'server-only';

/**
 * DD Report Version Migration
 *
 * Handles backward compatibility when reading DD reports
 * that were generated with earlier versions.
 *
 * Version History:
 * - 1.0.0: Original DD Mode (DD0, AN0-AN3, DD3, DD4, DD5)
 * - 2.0.0: Added DD3.5-M (commercialization), enhanced DD4 (strategic analysis)
 */

import type {
  DD0_M_Output,
  DD3_5_M_Output,
  DD3_M_Output,
  DD4_M_Output,
  DD5_M_Output,
} from './schemas';

// =============================================================================
// Types
// =============================================================================

export interface DDReportDataV1 {
  mode: 'dd';
  version?: '1.0.0' | undefined;
  report: unknown; // V1 DD5 output structure
  claim_extraction: DD0_M_Output;
  problem_framing: unknown;
  teaching_examples: unknown;
  literature: unknown;
  methodology: unknown;
  solution_space: unknown;
  claim_validation: DD3_M_Output;
  solution_mapping: unknown; // V1 DD4 without strategic analysis
  tokenUsage?: unknown;
}

export interface DDReportDataV2 {
  mode: 'dd';
  version: '2.0.0';
  report: DD5_M_Output;
  claim_extraction: DD0_M_Output;
  problem_framing: unknown;
  teaching_examples: unknown;
  literature: unknown;
  methodology: unknown;
  solution_space: unknown;
  claim_validation: DD3_M_Output;
  commercialization_analysis: DD3_5_M_Output;
  solution_mapping: DD4_M_Output;
  tokenUsage?: unknown;
}

export type DDReportData = DDReportDataV1 | DDReportDataV2;

// =============================================================================
// Version Detection
// =============================================================================

/**
 * Detect the version of a DD report
 */
export function detectDDReportVersion(
  data: unknown,
): '1.0.0' | '2.0.0' | 'unknown' {
  if (!data || typeof data !== 'object') {
    return 'unknown';
  }

  const reportData = data as Record<string, unknown>;

  // Check for explicit version field
  if (reportData.version === '2.0.0') {
    return '2.0.0';
  }

  if (reportData.version === '1.0.0') {
    return '1.0.0';
  }

  // Check for v2-specific fields
  if ('commercialization_analysis' in reportData) {
    return '2.0.0';
  }

  // Check for DD mode
  if (reportData.mode === 'dd') {
    // No version field and no commercialization_analysis = v1
    return '1.0.0';
  }

  return 'unknown';
}

// =============================================================================
// Default Value Generators
// =============================================================================

/**
 * Generate default DD3.5-M output for v1 reports
 * These are conservative/neutral defaults that indicate the analysis wasn't performed
 */
function generateDefaultDD3_5Output(): DD3_5_M_Output {
  const notAnalyzedNote =
    'Not analyzed in v1 report - regenerate for full analysis';

  return {
    commercialization_summary: {
      overall_verdict: 'CHALLENGING_BUT_VIABLE',
      confidence: 'LOW',
      one_paragraph: notAnalyzedNote,
      critical_commercial_risk: notAnalyzedNote,
      secondary_commercial_risks: [notAnalyzedNote],
      timeline_to_meaningful_revenue: 'Unknown',
      capital_to_commercial_scale: 'Unknown',
      vc_timeline_fit: 'STRETCHED',
    },
    unit_economics_analysis: {
      current_unit_cost: {
        value: 'Unknown',
        basis: notAnalyzedNote,
        confidence: 'LOW',
      },
      claimed_scale_cost: {
        value: 'Unknown',
        basis: notAnalyzedNote,
      },
      gap_factor: 'Unknown',
      cost_reduction_assessment: {
        learning_curve: {
          assumption: notAnalyzedNote,
          verdict: 'OPTIMISTIC',
          reasoning: notAnalyzedNote,
        },
        scale_effects: {
          what_scales: [notAnalyzedNote],
          what_doesnt: [notAnalyzedNote],
          verdict: 'OPTIMISTIC',
        },
        magic_assumptions: [],
      },
      ten_x_analysis: {
        comparison_metric: 'Unknown',
        startup_performance: 'Unknown',
        incumbent_performance: 'Unknown',
        multiple: 'Unknown',
        switching_cost: 'Unknown',
        sufficient_for_adoption: false,
        reasoning: notAnalyzedNote,
      },
      margin_structure: {
        gross_margin_at_scale: 'Unknown',
        basis: notAnalyzedNote,
        capital_intensity: 'Unknown',
        years_to_cash_flow_positive: 'Unknown',
        total_capital_to_profitability: 'Unknown',
      },
      verdict: 'CHALLENGING',
      reasoning: notAnalyzedNote,
    },
    market_reality: {
      customer_identification: {
        stated_customer: 'Unknown',
        actual_buyer: 'Unknown',
        specificity: 'VAGUE',
        evidence_of_demand: {
          lois_signed: 0,
          pilots_active: 0,
          conversations_claimed: 'Unknown',
          revenue_to_date: 'Unknown',
          assessment: 'UNVALIDATED',
        },
        willingness_to_pay: {
          claimed: 'Unknown',
          evidence: notAnalyzedNote,
          market_alternatives_cost: 'Unknown',
          premium_or_discount: 'Unknown',
          credibility: 'LOW',
        },
      },
      market_timing: {
        market_exists_today: false,
        current_market_size: 'Unknown',
        projected_market_size: 'Unknown',
        growth_driver: notAnalyzedNote,
        timing_assessment: '2_YEARS_EARLY',
        timing_reasoning: notAnalyzedNote,
      },
      vitamin_or_painkiller: {
        assessment: 'UNCLEAR',
        forcing_function: notAnalyzedNote,
        what_happens_if_they_dont_buy: notAnalyzedNote,
      },
      competitive_position: {
        current_alternative: 'Unknown',
        switching_cost: 'Unknown',
        risk_for_customer: notAnalyzedNote,
        why_choose_startup: notAnalyzedNote,
      },
      verdict: 'SPECULATIVE_DEMAND',
      reasoning: notAnalyzedNote,
    },
    gtm_reality: {
      sales_cycle: {
        estimated_months: 0,
        basis: notAnalyzedNote,
        runway_vs_cycle: 'Unknown',
        parallel_opportunities: 'Unknown',
        verdict: 'TIGHT',
      },
      path_to_scale: [],
      channel_strategy: {
        stated_approach: 'Unknown',
        realistic_assessment: notAnalyzedNote,
        critical_partnerships: [],
        partnership_status: 'UNCLEAR',
      },
      verdict: 'UNCLEAR',
      reasoning: notAnalyzedNote,
    },
    timeline_reality: {
      critical_path: [],
      total_time_to_scale: {
        their_estimate: 'Unknown',
        realistic_estimate: 'Unknown',
        gap_reasoning: notAnalyzedNote,
      },
      vc_math: {
        years_from_series_a_to_scale: 'Unknown',
        fits_fund_timeline: false,
        exit_path_visibility: 'UNCLEAR',
        likely_exit_type: 'UNCLEAR',
      },
      too_early_assessment: {
        verdict: '2_YEARS_EARLY',
        enabling_conditions_status: [],
        early_mover_tradeoff: notAnalyzedNote,
      },
      verdict: 'STRETCHED',
      reasoning: notAnalyzedNote,
    },
    scaleup_reality: {
      pilot_to_commercial_gap: {
        what_changes: [notAnalyzedNote],
        known_hard_problems: [notAnalyzedNote],
        unknown_unknowns_risk: 'MEDIUM',
        discovery_cost: 'Unknown',
      },
      manufacturing: {
        can_be_manufactured: false,
        by_whom: 'Unknown',
        equipment_exists: false,
        equipment_gap: notAnalyzedNote,
        supply_chain_risks: [notAnalyzedNote],
        verdict: 'NEEDS_DEVELOPMENT',
      },
      valley_of_death: {
        capital_required: 'Unknown',
        time_required_months: 0,
        stranding_risk: 'MEDIUM',
        what_unlocks_next_capital: notAnalyzedNote,
        fallback_if_stuck: notAnalyzedNote,
      },
      verdict: 'CHALLENGING',
      reasoning: notAnalyzedNote,
    },
    ecosystem_dependencies: {
      infrastructure: [],
      regulatory: {
        approvals_needed: [],
        typical_timeline_months: 0,
        fast_track_available: false,
        regulatory_risk: 'MEDIUM',
        adverse_change_probability: 'Unknown',
      },
      complementary_tech: [],
      verdict: 'MANAGEABLE',
      reasoning: notAnalyzedNote,
    },
    policy_dependency: {
      critical_policies: [],
      regulatory_tailwinds: [],
      regulatory_headwinds: [],
      policy_scenario_analysis: {
        base_case: notAnalyzedNote,
        bear_case: notAnalyzedNote,
        bull_case: notAnalyzedNote,
      },
      verdict: 'MODERATE_EXPOSURE',
      reasoning: notAnalyzedNote,
    },
    incumbent_response: {
      likely_response: 'IGNORE',
      response_reasoning: notAnalyzedNote,
      timeline_to_response_months: 0,
      startup_defense: notAnalyzedNote,
      replication_difficulty: {
        time_to_replicate_months: 0,
        capital_to_replicate: 'Unknown',
        expertise_to_replicate: 'Unknown',
        verdict: 'MODERATE',
      },
      acquisition_analysis: {
        likely_acquirers: [],
        acquisition_trigger: notAnalyzedNote,
        likely_timing: 'Unknown',
        valuation_range: 'Unknown',
        acquirer_motivation: notAnalyzedNote,
      },
    },
    commercial_red_flags: [],
    commercial_questions_for_founders: [
      {
        question:
          'Please regenerate this report to receive commercial analysis',
        category: 'UNIT_ECONOMICS',
        why_critical:
          'This report was generated before commercial analysis was available',
        good_answer: 'N/A',
        bad_answer: 'N/A',
      },
    ],
  };
}

/**
 * Generate default strategic analysis fields for v1 DD4 outputs
 */
function generateDefaultStrategicAnalysis(): Pick<
  DD4_M_Output,
  | 'the_one_bet'
  | 'pre_mortem'
  | 'comparable_analysis'
  | 'scenario_analysis'
  | 'comparable_pattern_synthesis'
> {
  const notAnalyzedNote =
    'Not analyzed in v1 report - regenerate for full analysis';

  return {
    the_one_bet: {
      core_bet_statement: notAnalyzedNote,
      technical_bet: {
        bet: notAnalyzedNote,
        current_evidence_for: notAnalyzedNote,
        current_evidence_against: notAnalyzedNote,
        when_resolved: 'Unknown',
        resolution_milestone: notAnalyzedNote,
      },
      commercial_bet: {
        bet: notAnalyzedNote,
        current_evidence_for: notAnalyzedNote,
        current_evidence_against: notAnalyzedNote,
        when_resolved: 'Unknown',
      },
      timing_bet: {
        bet: notAnalyzedNote,
        too_early_scenario: notAnalyzedNote,
        too_late_scenario: notAnalyzedNote,
        timing_evidence: notAnalyzedNote,
      },
      implicit_dismissals: [],
      bet_quality: {
        assessment: 'REASONABLE_BET',
        expected_value_reasoning: notAnalyzedNote,
        what_makes_it_worth_it: notAnalyzedNote,
      },
    },
    pre_mortem: {
      framing: notAnalyzedNote,
      most_likely_failure_mode: {
        scenario: notAnalyzedNote,
        probability: 'Unknown',
        timeline: 'Unknown',
        early_warning_signs: [],
        could_be_prevented_by: notAnalyzedNote,
        key_decision_point: notAnalyzedNote,
      },
      second_most_likely_failure: {
        scenario: notAnalyzedNote,
        probability: 'Unknown',
        timeline: 'Unknown',
        early_warning_signs: [],
        could_be_prevented_by: notAnalyzedNote,
      },
      black_swan_failure: {
        scenario: notAnalyzedNote,
        probability: 'Unknown',
        trigger: notAnalyzedNote,
        warning_signs: [],
      },
      pattern_from_comparables: {
        what_usually_kills_companies_like_this: notAnalyzedNote,
        is_this_company_different: false,
        why_or_why_not: notAnalyzedNote,
      },
      failure_modes_by_category: {
        technical_failure_probability: 'Unknown',
        commercial_failure_probability: 'Unknown',
        execution_failure_probability: 'Unknown',
        market_timing_failure_probability: 'Unknown',
        primary_risk_category: 'Unknown',
      },
    },
    comparable_analysis: {
      selection_criteria: notAnalyzedNote,
      closest_comparables: [],
      pattern_analysis: {
        companies_in_category: 'Unknown',
        success_rate: 'Unknown',
        median_outcome: 'Unknown',
        top_decile_outcome: 'Unknown',
        bottom_decile_outcome: 'Unknown',
        time_to_outcome: 'Unknown',
      },
      base_rate: {
        category: 'Unknown',
        historical_success_rate: 'Unknown',
        median_return_multiple: 'Unknown',
        definition_of_success: notAnalyzedNote,
      },
      this_company_vs_base_rate: {
        better_than_base_rate_because: [],
        worse_than_base_rate_because: [],
        adjusted_probability: 'Unknown',
      },
    },
    scenario_analysis: {
      probability_methodology: notAnalyzedNote,
      key_conditions: [],
      bull_case: {
        requires: [],
        joint_probability_calculation: notAnalyzedNote,
        final_probability: 'Unknown',
        narrative: notAnalyzedNote,
        key_events: [],
        timeline_years: 0,
        exit_type: 'Unknown',
        exit_valuation: 'Unknown',
        return_multiple: 'Unknown',
        what_you_believe_in_this_scenario: notAnalyzedNote,
      },
      base_case: {
        requires: [],
        joint_probability_calculation: notAnalyzedNote,
        final_probability: 'Unknown',
        narrative: notAnalyzedNote,
        key_events: [],
        timeline_years: 0,
        exit_type: 'Unknown',
        exit_valuation: 'Unknown',
        return_multiple: 'Unknown',
        what_you_believe_in_this_scenario: notAnalyzedNote,
      },
      bear_case: {
        requires: [],
        joint_probability_calculation: notAnalyzedNote,
        final_probability: 'Unknown',
        narrative: notAnalyzedNote,
        key_events: [],
        timeline_years: 0,
        exit_type: 'Unknown',
        exit_valuation: 'Unknown',
        return_multiple: 'Unknown',
        what_you_believe_in_this_scenario: notAnalyzedNote,
      },
      probability_sanity_check: {
        probabilities_sum_to: 'Unknown',
        adjustment_if_needed: notAnalyzedNote,
      },
      expected_value: {
        calculation: notAnalyzedNote,
        weighted_return_multiple: 'Unknown',
        confidence_in_ev: 'MEDIUM',
        key_sensitivity: notAnalyzedNote,
      },
      base_rate_comparison: {
        category: 'Unknown',
        historical_success_rate: 'Unknown',
        historical_median_return: 'Unknown',
        this_company_vs_base_rate: notAnalyzedNote,
      },
      scenario_sensitivities: [],
    },
    comparable_pattern_synthesis: {
      methodology: notAnalyzedNote,
      quantified_patterns: [],
      pattern_scorecard: {
        positive_indicators_count: 0,
        negative_indicators_count: 0,
        net_score: 'Unknown',
        interpretation: notAnalyzedNote,
      },
      differentiated_insight: notAnalyzedNote,
    },
  };
}

// =============================================================================
// Migration Functions
// =============================================================================

/**
 * Migrate a v1 DD report to v2 format
 */
function migrateV1ToV2(data: DDReportDataV1): DDReportDataV2 {
  // Add default DD3.5-M output
  const commercializationAnalysis = generateDefaultDD3_5Output();

  // Get existing v1 DD4 data
  const existingDD4 = (data.solution_mapping || {}) as Record<string, unknown>;

  // Merge with default strategic analysis fields
  const dd4WithStrategic: DD4_M_Output = {
    ...existingDD4,
    ...generateDefaultStrategicAnalysis(),
  } as DD4_M_Output;

  return {
    mode: 'dd',
    version: '2.0.0',
    report: data.report as DD5_M_Output,
    claim_extraction: data.claim_extraction,
    problem_framing: data.problem_framing,
    teaching_examples: data.teaching_examples,
    literature: data.literature,
    methodology: data.methodology,
    solution_space: data.solution_space,
    claim_validation: data.claim_validation,
    commercialization_analysis: commercializationAnalysis,
    solution_mapping: dd4WithStrategic,
    tokenUsage: data.tokenUsage,
  };
}

/**
 * Migrate DD report data to the latest version
 * Returns the migrated data and a flag indicating if migration occurred
 */
export function migrateDDReportData(data: unknown): {
  data: DDReportDataV2;
  migrated: boolean;
  fromVersion: string;
} {
  const version = detectDDReportVersion(data);

  if (version === '2.0.0') {
    return {
      data: data as DDReportDataV2,
      migrated: false,
      fromVersion: '2.0.0',
    };
  }

  if (version === '1.0.0') {
    return {
      data: migrateV1ToV2(data as DDReportDataV1),
      migrated: true,
      fromVersion: '1.0.0',
    };
  }

  // Unknown version - try to treat as v1
  console.warn(
    '[DD Migration] Unknown report version, attempting v1 migration',
    { hasMode: (data as Record<string, unknown>)?.mode },
  );

  return {
    data: migrateV1ToV2(data as DDReportDataV1),
    migrated: true,
    fromVersion: 'unknown',
  };
}

/**
 * Check if a DD report needs migration
 */
export function needsMigration(data: unknown): boolean {
  const version = detectDDReportVersion(data);
  return version !== '2.0.0';
}
