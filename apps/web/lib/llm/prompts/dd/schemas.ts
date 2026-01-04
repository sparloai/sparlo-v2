/**
 * Due Diligence Mode Zod Schemas
 *
 * Schemas for validating DD chain outputs.
 *
 * ANTIFRAGILE DESIGN:
 * All enums use flexibleEnum() which:
 * 1. Strips parenthetical annotations (e.g., "WEAK (reason)" -> "WEAK")
 * 2. Strips hyphenated explanations (e.g., "WEAK - reason" -> "WEAK")
 * 3. Normalizes case (case-insensitive matching)
 * 4. Maps similar values (e.g., "MODERATE" -> "SIGNIFICANT")
 * 5. Falls back to a default if nothing matches
 *
 * This ensures LLM output variations never break validation.
 */
import { z } from 'zod';

// ============================================
// Antifragile Enum Helper
// ============================================

/**
 * Similar value mappings for common LLM variations
 */
const ENUM_SYNONYMS: Record<string, string> = {
  // Severity/assessment variations
  MODERATE: 'SIGNIFICANT',
  MEDIUM: 'SIGNIFICANT',
  MINOR: 'MANAGEABLE',
  MAJOR: 'SEVERE',
  // Status variations
  PARTIAL: 'PARTIALLY_IDENTIFIED',
  PARTIALLY: 'PARTIALLY_IDENTIFIED',
  PARTIALLY_SECURED: 'IN_DISCUSSION',
  SECURED: 'SIGNED',
  // Quality variations
  GOOD: 'ADEQUATE',
  POOR: 'WEAK',
  NONE: 'MISSING',
  N_A: 'MISSING',
  NA: 'MISSING',
  // Verdict variations
  YES: 'VALIDATED',
  NO: 'INVALID',
  MAYBE: 'PLAUSIBLE',
  UNKNOWN: 'UNCLEAR',
  TBD: 'UNCLEAR',
  // Confidence variations
  HIGH_CONFIDENCE: 'HIGH',
  MEDIUM_CONFIDENCE: 'MEDIUM',
  LOW_CONFIDENCE: 'LOW',
  // Timing variations
  ON_TIME: 'ALIGNED',
  DELAYED: 'STRETCHED',
  // Boolean-like
  TRUE: 'YES',
  FALSE: 'NO',
};

/**
 * Creates an antifragile enum schema that gracefully handles LLM variations.
 * - Strips annotations after enum value (parentheses, hyphens, colons)
 * - Normalizes case
 * - Maps similar values
 * - Falls back to default on failure
 */
function flexibleEnum<T extends [string, ...string[]]>(
  values: T,
  defaultValue: T[number],
): z.ZodEffects<z.ZodString, T[number], string> {
  return z.string().transform((val): T[number] => {
    // Step 1: Extract the first word/phrase before any annotation
    // Handles: "WEAK - reason", "WEAK (reason)", "WEAK: reason"
    let normalized = val
      .replace(/\s*[-:(].*$/, '') // Strip everything after -, :, or (
      .trim()
      .toUpperCase();

    // Step 2: Direct match
    if (values.includes(normalized as T[number])) {
      return normalized as T[number];
    }

    // Step 3: Check synonyms
    const synonym = ENUM_SYNONYMS[normalized];
    if (synonym && values.includes(synonym as T[number])) {
      return synonym as T[number];
    }

    // Step 4: Fuzzy match - check if any valid value starts with the input
    for (const v of values) {
      if (v.startsWith(normalized) || normalized.startsWith(v)) {
        return v;
      }
    }

    // Step 5: Check if input contains any valid value
    for (const v of values) {
      if (normalized.includes(v) || v.includes(normalized)) {
        return v;
      }
    }

    // Step 6: Fall back to default
    console.warn(
      `[DD Schema] Enum fallback: "${val}" -> "${defaultValue}" (valid: ${values.join(', ')})`,
    );
    return defaultValue;
  });
}

/**
 * Creates an antifragile enum that can also be null/undefined
 */
function flexibleEnumOptional<T extends [string, ...string[]]>(
  values: T,
  defaultValue: T[number],
): z.ZodEffects<z.ZodString, T[number], string> {
  return flexibleEnum(values, defaultValue);
}

/**
 * Creates an antifragile number schema that coerces strings to numbers.
 * - Handles "3" -> 3
 * - Handles "3.5" -> 3.5
 * - Handles "3/5" -> 3 (extracts first number)
 * - Falls back to default on failure
 */
function flexibleNumber(
  defaultValue: number,
  options?: { min?: number; max?: number },
): z.ZodEffects<z.ZodUnknown, number, unknown> {
  return z.unknown().transform((val): number => {
    // Already a number
    if (typeof val === 'number' && !isNaN(val)) {
      let num = val;
      if (options?.min !== undefined) num = Math.max(num, options.min);
      if (options?.max !== undefined) num = Math.min(num, options.max);
      return num;
    }

    // String - try to parse
    if (typeof val === 'string') {
      // Extract first number from string (handles "3/5", "3 out of 5", etc.)
      const match = val.match(/[\d.]+/);
      if (match) {
        const parsed = parseFloat(match[0]);
        if (!isNaN(parsed)) {
          let num = parsed;
          if (options?.min !== undefined) num = Math.max(num, options.min);
          if (options?.max !== undefined) num = Math.min(num, options.max);
          return num;
        }
      }
    }

    // Fall back to default
    console.warn(
      `[DD Schema] Number fallback: "${val}" -> ${defaultValue}`,
    );
    return defaultValue;
  });
}

// ============================================
// Shared Enums and Primitives (Antifragile)
// ============================================

export const ClaimType = flexibleEnum(
  ['PERFORMANCE', 'NOVELTY', 'MECHANISM', 'FEASIBILITY', 'TIMELINE', 'COST', 'MOAT'],
  'MECHANISM',
);

export const EvidenceLevel = flexibleEnum(
  ['DEMONSTRATED', 'TESTED', 'CITED', 'CLAIMED', 'IMPLIED'],
  'CLAIMED',
);

export const Verifiability = flexibleEnum(
  ['PHYSICS_CHECK', 'LITERATURE_CHECK', 'DATA_REQUIRED', 'TEST_REQUIRED', 'UNVERIFIABLE'],
  'DATA_REQUIRED',
);

export const ValidationPriority = flexibleEnum(
  ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
  'MEDIUM',
);

export const Severity = flexibleEnum(
  ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
  'MEDIUM',
);

export const Stage = flexibleEnum(
  ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Growth'],
  'Seed',
);

export const Verdict = flexibleEnum(
  ['VALIDATED', 'PLAUSIBLE', 'QUESTIONABLE', 'IMPLAUSIBLE', 'INVALID'],
  'QUESTIONABLE',
);

export const MechanismVerdict = flexibleEnum(
  ['SOUND', 'PLAUSIBLE', 'QUESTIONABLE', 'FLAWED'],
  'QUESTIONABLE',
);

export const Confidence = flexibleEnum(
  ['HIGH', 'MEDIUM', 'LOW'],
  'MEDIUM',
);

export const NoveltyClassification = flexibleEnum(
  ['GENUINELY_NOVEL', 'NOVEL_COMBINATION', 'NOVEL_APPLICATION', 'INCREMENTAL', 'NOT_NOVEL'],
  'INCREMENTAL',
);

export const MoatStrength = flexibleEnum(
  ['STRONG', 'MODERATE', 'WEAK', 'NONE'],
  'WEAK',
);

export const Track = flexibleEnum(
  ['simpler_path', 'best_fit', 'paradigm_shift', 'frontier_transfer'],
  'best_fit',
);

export const DDVerdict = flexibleEnum(
  ['COMPELLING', 'PROMISING', 'MIXED', 'CONCERNING', 'PASS'],
  'MIXED',
);

export const RecommendedAction = flexibleEnum(
  ['PROCEED', 'PROCEED_WITH_CAUTION', 'DEEP_DIVE_REQUIRED', 'PASS'],
  'DEEP_DIVE_REQUIRED',
);

export const FindingType = flexibleEnum(
  ['STRENGTH', 'WEAKNESS', 'OPPORTUNITY', 'THREAT'],
  'WEAKNESS',
);

// Commercial assumption categories
export const CommercialAssumptionCategory = flexibleEnum(
  ['UNIT_ECONOMICS', 'MARKET', 'GTM', 'TIMELINE', 'ECOSYSTEM', 'SCALEUP', 'POLICY'],
  'MARKET',
);

// Commercial viability verdicts
export const CommercialViabilityVerdict = flexibleEnum(
  ['CLEAR_PATH', 'CHALLENGING_BUT_VIABLE', 'SIGNIFICANT_OBSTACLES', 'UNLIKELY_TO_COMMERCIALIZE'],
  'CHALLENGING_BUT_VIABLE',
);

// Unit economics verdicts
export const UnitEconomicsVerdict = flexibleEnum(
  ['VIABLE', 'CHALLENGING', 'UNLIKELY'],
  'CHALLENGING',
);

// Market demand verdicts
export const MarketDemandVerdict = flexibleEnum(
  ['CLEAR_DEMAND', 'EMERGING_DEMAND', 'SPECULATIVE_DEMAND'],
  'EMERGING_DEMAND',
);

// GTM verdicts
export const GTMVerdict = flexibleEnum(
  ['CLEAR_PATH', 'CHALLENGING', 'UNCLEAR'],
  'CHALLENGING',
);

// Timeline fit verdicts
export const TimelineFitVerdict = flexibleEnum(
  ['ALIGNED', 'STRETCHED', 'MISALIGNED'],
  'STRETCHED',
);

// Scale-up verdicts
export const ScaleUpVerdict = flexibleEnum(
  ['MANAGEABLE', 'CHALLENGING', 'SEVERE'],
  'CHALLENGING',
);

// Ecosystem dependency verdicts
export const EcosystemVerdict = z.enum([
  'FEW_DEPENDENCIES',
  'MANAGEABLE',
  'HEAVILY_DEPENDENT',
]);

// Policy exposure verdicts
export const PolicyExposureVerdict = z.enum([
  'LOW_EXPOSURE',
  'MODERATE_EXPOSURE',
  'HIGH_EXPOSURE',
]);

// Incumbent response types
export const IncumbentResponse = z.enum([
  'ACQUIRE',
  'COPY',
  'CRUSH',
  'IGNORE',
  'PARTNER',
]);

// Bet quality assessment
export const BetQuality = z.enum([
  'GOOD_BET',
  'REASONABLE_BET',
  'QUESTIONABLE_BET',
  'BAD_BET',
]);

// Company outcome types
export const CompanyOutcome = z.enum([
  'SUCCESS',
  'ACQUIRED',
  'PIVOT',
  'ZOMBIE',
  'SHUTDOWN',
]);

// Overall verdict for one-page summary
export const OverallVerdict = flexibleEnum(['PROCEED', 'CAUTION', 'PASS'], 'CAUTION');

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
      severity: flexibleEnum(['CRITICAL', 'HIGH', 'MEDIUM'], 'MEDIUM'),
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

  // New commercial assumption extraction
  commercial_assumptions: z.array(
    z.object({
      id: z.string(),
      assumption: z.string(),
      category: CommercialAssumptionCategory,
      stated_or_implied: flexibleEnum(['STATED', 'IMPLIED'], 'IMPLIED'),
      source_in_materials: z.string(),
      evidence_provided: z.string(),
      validation_approach: z.string(),
      risk_if_wrong: z.string(),
      validation_priority: ValidationPriority,
    }),
  ),

  policy_dependencies: z.array(
    z.object({
      policy: z.string(),
      dependency_level: Severity,
      current_status: z.string(),
      risk_factors: z.string(),
    }),
  ),

  ecosystem_map: z.object({
    required_infrastructure: z.array(z.string()),
    required_partners: z.array(z.string()),
    required_technologies: z.array(z.string()),
    chicken_and_egg_problems: z.array(z.string()),
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
      confidence_percent: flexibleNumber(50, { min: 0, max: 100 }),
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
          mitigation_quality: flexibleEnum(['STRONG', 'ADEQUATE', 'WEAK', 'MISSING'], 'WEAK'),
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
        type: flexibleEnum(['TECHNICAL', 'PHYSICAL'], 'TECHNICAL'),
        improving_parameter: z.string(),
        worsening_parameter: z.string(),
        startup_awareness: flexibleEnum(['IDENTIFIED', 'PARTIALLY_AWARE', 'UNAWARE'], 'PARTIALLY_AWARE'),
        startup_resolution: z.string(),
        resolution_validity: flexibleEnum(['RESOLVED', 'PARTIALLY_RESOLVED', 'UNRESOLVED', 'IGNORED'], 'PARTIALLY_RESOLVED'),
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
      resolution_quality: flexibleEnum(['ELEGANT', 'ADEQUATE', 'PARTIAL', 'POOR'], 'ADEQUATE'),
      inventive_level: flexibleNumber(3, { min: 1, max: 5 }),
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
          assessment: flexibleEnum(['MANAGEABLE', 'SIGNIFICANT', 'SEVERE'], 'SIGNIFICANT'),
        }),
      ),
      scale_verdict: flexibleEnum(['FEASIBLE', 'CHALLENGING', 'UNLIKELY'], 'CHALLENGING'),
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
      cost_verdict: flexibleEnum(['REALISTIC', 'OPTIMISTIC', 'UNREALISTIC'], 'OPTIMISTIC'),
    }),

    timeline_assessment: z.object({
      claimed_timeline: z.string(),
      trl_current: z.string(),
      trl_claimed: z.string(),
      timeline_verdict: flexibleEnum(['REALISTIC', 'AGGRESSIVE', 'UNREALISTIC'], 'AGGRESSIVE'),
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
        severity: flexibleEnum(['CRITICAL', 'MODERATE', 'MINOR'], 'MODERATE'),
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
    score: flexibleNumber(5, { min: 1, max: 10 }),
    out_of: flexibleNumber(0),
    breakdown: z.object({
      physics_validity: flexibleNumber(0),
      mechanism_soundness: flexibleNumber(0),
      feasibility_realism: flexibleNumber(0),
      internal_consistency: flexibleNumber(0),
    }),
    rationale: z.string(),
  }),
});

export type DD3_M_Output = z.infer<typeof DD3_M_OutputSchema>;

// ============================================
// DD3.5 Output Schema - Commercialization Reality Check
// ============================================

export const DD3_5_M_OutputSchema = z.object({
  commercialization_summary: z.object({
    overall_verdict: CommercialViabilityVerdict,
    confidence: Confidence,
    one_paragraph: z.string(),
    critical_commercial_risk: z.string(),
    secondary_commercial_risks: z.array(z.string()),
    timeline_to_meaningful_revenue: z.string(),
    capital_to_commercial_scale: z.string(),
    vc_timeline_fit: flexibleEnum(['FITS', 'STRETCHED', 'MISALIGNED'], 'STRETCHED'),
  }),

  unit_economics_analysis: z.object({
    current_unit_cost: z.object({
      value: z.string(),
      basis: z.string(),
      confidence: Confidence,
    }),
    claimed_scale_cost: z.object({
      value: z.string(),
      basis: z.string(),
    }),
    gap_factor: z.string(),
    cost_reduction_assessment: z.object({
      learning_curve: z.object({
        assumption: z.string(),
        verdict: flexibleEnum(['REALISTIC', 'OPTIMISTIC', 'UNREALISTIC'], 'OPTIMISTIC'),
        reasoning: z.string(),
      }),
      scale_effects: z.object({
        what_scales: z.array(z.string()),
        what_doesnt: z.array(z.string()),
        verdict: flexibleEnum(['REALISTIC', 'OPTIMISTIC', 'UNREALISTIC'], 'OPTIMISTIC'),
      }),
      magic_assumptions: z.array(
        z.object({
          assumption: z.string(),
          probability: z.string(),
          impact_if_wrong: z.string(),
        }),
      ),
    }),
    ten_x_analysis: z.object({
      comparison_metric: z.string(),
      startup_performance: z.string(),
      incumbent_performance: z.string(),
      multiple: z.string(),
      switching_cost: z.string(),
      sufficient_for_adoption: z.boolean(),
      reasoning: z.string(),
    }),
    margin_structure: z.object({
      gross_margin_at_scale: z.string(),
      basis: z.string(),
      capital_intensity: z.string(),
      years_to_cash_flow_positive: z.string(),
      total_capital_to_profitability: z.string(),
    }),
    verdict: UnitEconomicsVerdict,
    reasoning: z.string(),
  }),

  market_reality: z.object({
    customer_identification: z.object({
      stated_customer: z.string(),
      actual_buyer: z.string(),
      specificity: flexibleEnum(['SPECIFIC_NAMES', 'CATEGORIES_ONLY', 'VAGUE'], 'CATEGORIES_ONLY'),
      evidence_of_demand: z.object({
        lois_signed: flexibleNumber(0),
        pilots_active: flexibleNumber(0),
        conversations_claimed: z.string(),
        revenue_to_date: z.string(),
        assessment: flexibleEnum(['VALIDATED', 'PARTIALLY_VALIDATED', 'UNVALIDATED'], 'PARTIALLY_VALIDATED'),
      }),
      willingness_to_pay: z.object({
        claimed: z.string(),
        evidence: z.string(),
        market_alternatives_cost: z.string(),
        premium_or_discount: z.string(),
        credibility: Confidence,
      }),
    }),
    market_timing: z.object({
      market_exists_today: z.boolean(),
      current_market_size: z.string(),
      projected_market_size: z.string(),
      growth_driver: z.string(),
      timing_assessment: z.enum([
        'RIGHT_TIME',
        '2_YEARS_EARLY',
        '5_PLUS_YEARS_EARLY',
        'TOO_LATE',
      ]),
      timing_reasoning: z.string(),
    }),
    vitamin_or_painkiller: z.object({
      assessment: flexibleEnum(['PAINKILLER', 'VITAMIN', 'UNCLEAR'], 'UNCLEAR'),
      forcing_function: z.string(),
      what_happens_if_they_dont_buy: z.string(),
    }),
    competitive_position: z.object({
      current_alternative: z.string(),
      switching_cost: z.string(),
      risk_for_customer: z.string(),
      why_choose_startup: z.string(),
    }),
    verdict: MarketDemandVerdict,
    reasoning: z.string(),
  }),

  gtm_reality: z.object({
    sales_cycle: z.object({
      estimated_months: flexibleNumber(0),
      basis: z.string(),
      runway_vs_cycle: z.string(),
      parallel_opportunities: z.string(),
      verdict: flexibleEnum(['SUSTAINABLE', 'TIGHT', 'UNSUSTAINABLE'], 'TIGHT'),
    }),
    path_to_scale: z.array(
      z.object({
        stage: z.string(),
        key_challenge: z.string(),
        timeline_months: flexibleNumber(0),
        capital_required: z.string(),
        key_dependencies: z.array(z.string()),
      }),
    ),
    channel_strategy: z.object({
      stated_approach: z.string(),
      realistic_assessment: z.string(),
      critical_partnerships: z.array(z.string()),
      partnership_status: flexibleEnum(['SIGNED', 'IN_DISCUSSION', 'IDENTIFIED', 'PARTIALLY_IDENTIFIED', 'UNCLEAR'], 'UNCLEAR'),
    }),
    verdict: GTMVerdict,
    reasoning: z.string(),
  }),

  timeline_reality: z.object({
    critical_path: z.array(
      z.object({
        milestone: z.string(),
        their_timeline: z.string(),
        realistic_timeline: z.string(),
        dependencies: z.array(z.string()),
        risk_factors: z.array(z.string()),
      }),
    ),
    total_time_to_scale: z.object({
      their_estimate: z.string(),
      realistic_estimate: z.string(),
      gap_reasoning: z.string(),
    }),
    vc_math: z.object({
      years_from_series_a_to_scale: z.string(),
      fits_fund_timeline: z.boolean(),
      exit_path_visibility: flexibleEnum(['CLEAR', 'EMERGING', 'UNCLEAR'], 'EMERGING'),
      likely_exit_type: flexibleEnum(['ACQUISITION', 'IPO', 'SECONDARY', 'UNCLEAR'], 'UNCLEAR'),
    }),
    too_early_assessment: z.object({
      verdict: flexibleEnum(['RIGHT_TIME', '2_YEARS_EARLY', '5_PLUS_YEARS_EARLY'], '2_YEARS_EARLY'),
      enabling_conditions_status: z.array(
        z.object({
          condition: z.string(),
          status: flexibleEnum(['MET', 'EMERGING', 'NOT_MET'], 'EMERGING'),
          timeline_to_met: z.string(),
        }),
      ),
      early_mover_tradeoff: z.string(),
    }),
    verdict: TimelineFitVerdict,
    reasoning: z.string(),
  }),

  scaleup_reality: z.object({
    pilot_to_commercial_gap: z.object({
      what_changes: z.array(z.string()),
      known_hard_problems: z.array(z.string()),
      unknown_unknowns_risk: Confidence,
      discovery_cost: z.string(),
    }),
    manufacturing: z.object({
      can_be_manufactured: z.boolean(),
      by_whom: z.string(),
      equipment_exists: z.boolean(),
      equipment_gap: z.string(),
      supply_chain_risks: z.array(z.string()),
      verdict: flexibleEnum(['READY', 'NEEDS_DEVELOPMENT', 'MAJOR_GAPS'], 'NEEDS_DEVELOPMENT'),
    }),
    valley_of_death: z.object({
      capital_required: z.string(),
      time_required_months: flexibleNumber(0),
      stranding_risk: Confidence,
      what_unlocks_next_capital: z.string(),
      fallback_if_stuck: z.string(),
    }),
    verdict: ScaleUpVerdict,
    reasoning: z.string(),
  }),

  ecosystem_dependencies: z.object({
    infrastructure: z.array(
      z.object({
        requirement: z.string(),
        exists_today: z.boolean(),
        who_builds: z.string(),
        who_pays: z.string(),
        timeline: z.string(),
        startup_can_succeed_without: z.boolean(),
        chicken_egg_problem: z.string(),
      }),
    ),
    regulatory: z.object({
      approvals_needed: z.array(z.string()),
      typical_timeline_months: flexibleNumber(0),
      fast_track_available: z.boolean(),
      regulatory_risk: Confidence,
      adverse_change_probability: z.string(),
    }),
    complementary_tech: z.array(
      z.object({
        technology: z.string(),
        current_readiness: z.string(),
        needed_readiness: z.string(),
        timeline_to_ready: z.string(),
        owner: z.string(),
        risk_if_delayed: z.string(),
      }),
    ),
    verdict: EcosystemVerdict,
    reasoning: z.string(),
  }),

  policy_dependency: z.object({
    critical_policies: z.array(
      z.object({
        policy: z.string(),
        what_it_provides: z.string(),
        current_value: z.string(),
        dependency_level: Severity,
        economics_without_it: z.string(),
        sunset_date: z.string(),
        change_probability: z.string(),
        change_impact: z.string(),
      }),
    ),
    regulatory_tailwinds: z.array(z.string()),
    regulatory_headwinds: z.array(z.string()),
    policy_scenario_analysis: z.object({
      base_case: z.string(),
      bear_case: z.string(),
      bull_case: z.string(),
    }),
    verdict: PolicyExposureVerdict,
    reasoning: z.string(),
  }),

  incumbent_response: z.object({
    likely_response: IncumbentResponse,
    response_reasoning: z.string(),
    timeline_to_response_months: flexibleNumber(0),
    startup_defense: z.string(),
    replication_difficulty: z.object({
      time_to_replicate_months: flexibleNumber(0),
      capital_to_replicate: z.string(),
      expertise_to_replicate: z.string(),
      verdict: flexibleEnum(['HARD', 'MODERATE', 'EASY'], 'MODERATE'),
    }),
    acquisition_analysis: z.object({
      likely_acquirers: z.array(z.string()),
      acquisition_trigger: z.string(),
      likely_timing: z.string(),
      valuation_range: z.string(),
      acquirer_motivation: z.string(),
    }),
  }),

  commercial_red_flags: z.array(
    z.object({
      flag: z.string(),
      severity: Severity,
      evidence: z.string(),
      what_would_resolve: z.string(),
      question_for_founders: z.string(),
    }),
  ),

  commercial_questions_for_founders: z.array(
    z.object({
      question: z.string(),
      category: CommercialAssumptionCategory,
      why_critical: z.string(),
      good_answer: z.string(),
      bad_answer: z.string(),
    }),
  ),
});

export type DD3_5_M_Output = z.infer<typeof DD3_5_M_OutputSchema>;

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
      alignment: flexibleEnum(['ALIGNED', 'PARTIALLY_ALIGNED', 'MISALIGNED'], 'PARTIALLY_ALIGNED'),
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
        source_type: flexibleEnum(['PATENT', 'ACADEMIC', 'COMMERCIAL', 'ABANDONED'], 'COMMERCIAL'),
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
      trade_secret_potential: flexibleEnum(['STRONG', 'MODERATE', 'WEAK'], 'MODERATE'),
      replication_difficulty: flexibleEnum(['VERY_HARD', 'HARD', 'MODERATE', 'EASY'], 'MODERATE'),
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
      market_timing: flexibleEnum(['EARLY', 'RIGHT', 'LATE'], 'EARLY'),
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

  // Strategic analysis sections
  the_one_bet: z.object({
    core_bet_statement: z.string(),
    technical_bet: z.object({
      bet: z.string(),
      current_evidence_for: z.string(),
      current_evidence_against: z.string(),
      when_resolved: z.string(),
      resolution_milestone: z.string(),
    }),
    commercial_bet: z.object({
      bet: z.string(),
      current_evidence_for: z.string(),
      current_evidence_against: z.string(),
      when_resolved: z.string(),
    }),
    timing_bet: z.object({
      bet: z.string(),
      too_early_scenario: z.string(),
      too_late_scenario: z.string(),
      timing_evidence: z.string(),
    }),
    implicit_dismissals: z.array(
      z.object({
        dismissed_alternative: z.string(),
        their_implicit_reasoning: z.string(),
        our_assessment: z.string(),
      }),
    ),
    bet_quality: z.object({
      assessment: BetQuality,
      expected_value_reasoning: z.string(),
      what_makes_it_worth_it: z.string(),
    }),
  }),

  pre_mortem: z.object({
    framing: z.string(),
    most_likely_failure_mode: z.object({
      scenario: z.string(),
      probability: z.string(),
      timeline: z.string(),
      early_warning_signs: z.array(z.string()),
      could_be_prevented_by: z.string(),
      key_decision_point: z.string(),
    }),
    second_most_likely_failure: z.object({
      scenario: z.string(),
      probability: z.string(),
      timeline: z.string(),
      early_warning_signs: z.array(z.string()),
      could_be_prevented_by: z.string(),
    }),
    black_swan_failure: z.object({
      scenario: z.string(),
      probability: z.string(),
      trigger: z.string(),
      warning_signs: z.array(z.string()),
    }),
    pattern_from_comparables: z.object({
      what_usually_kills_companies_like_this: z.string(),
      is_this_company_different: z.boolean(),
      why_or_why_not: z.string(),
    }),
    failure_modes_by_category: z.object({
      technical_failure_probability: z.string(),
      commercial_failure_probability: z.string(),
      execution_failure_probability: z.string(),
      market_timing_failure_probability: z.string(),
      primary_risk_category: z.string(),
    }),
  }),

  comparable_analysis: z.object({
    selection_criteria: z.string(),
    closest_comparables: z.array(
      z.object({
        company: z.string(),
        similarity: z.string(),
        funding_raised: z.string(),
        timeline: z.string(),
        outcome: CompanyOutcome,
        outcome_details: z.string(),
        valuation_at_outcome: z.string(),
        key_success_factors: z.array(z.string()),
        key_failure_factors: z.array(z.string()),
        lessons_for_this_deal: z.string(),
        key_differences: z.string(),
      }),
    ),
    pattern_analysis: z.object({
      companies_in_category: z.string(),
      success_rate: z.string(),
      median_outcome: z.string(),
      top_decile_outcome: z.string(),
      bottom_decile_outcome: z.string(),
      time_to_outcome: z.string(),
    }),
    base_rate: z.object({
      category: z.string(),
      historical_success_rate: z.string(),
      median_return_multiple: z.string(),
      definition_of_success: z.string(),
    }),
    this_company_vs_base_rate: z.object({
      better_than_base_rate_because: z.array(z.string()),
      worse_than_base_rate_because: z.array(z.string()),
      adjusted_probability: z.string(),
    }),
  }),

  scenario_analysis: z.object({
    bull_case: z.object({
      probability: z.string(),
      narrative: z.string(),
      key_events: z.array(z.string()),
      timeline_years: flexibleNumber(0),
      exit_type: z.string(),
      exit_valuation: z.string(),
      return_multiple: z.string(),
      what_you_believe_in_this_scenario: z.string(),
    }),
    base_case: z.object({
      probability: z.string(),
      narrative: z.string(),
      key_events: z.array(z.string()),
      timeline_years: flexibleNumber(0),
      exit_type: z.string(),
      exit_valuation: z.string(),
      return_multiple: z.string(),
      what_you_believe_in_this_scenario: z.string(),
    }),
    bear_case: z.object({
      probability: z.string(),
      narrative: z.string(),
      key_events: z.array(z.string()),
      timeline_years: flexibleNumber(0),
      exit_type: z.string(),
      exit_valuation: z.string(),
      return_multiple: z.string(),
      what_you_believe_in_this_scenario: z.string(),
    }),
    expected_value: z.object({
      weighted_return_multiple: z.string(),
      calculation: z.string(),
      vs_typical_series_a: z.string(),
      risk_adjusted_assessment: z.string(),
    }),
    scenario_sensitivities: z.array(
      z.object({
        variable: z.string(),
        bull_assumption: z.string(),
        bear_assumption: z.string(),
        current_best_estimate: z.string(),
        how_to_derisk: z.string(),
      }),
    ),
  }),
});

export type DD4_M_Output = z.infer<typeof DD4_M_OutputSchema>;

// ============================================
// DD5 Output Schema - DD Report (V2 Comprehensive)
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

  one_page_summary: z.object({
    company: z.string(),
    sector: z.string(),
    stage: z.string(),
    ask: z.string(),
    one_sentence: z.string(),
    verdict_box: z.object({
      technical_validity: z.object({
        verdict: MechanismVerdict,
        symbol: z.string(),
      }),
      commercial_viability: z.object({
        verdict: flexibleEnum(['CLEAR_PATH', 'CHALLENGING', 'UNLIKELY'], 'CHALLENGING'),
        symbol: z.string(),
      }),
      solution_space_position: z.object({
        verdict: flexibleEnum(['OPTIMAL', 'REASONABLE', 'SUBOPTIMAL'], 'REASONABLE'),
        symbol: z.string(),
      }),
      moat_strength: z.object({
        verdict: MoatStrength,
        symbol: z.string(),
      }),
      timing: z.object({
        verdict: flexibleEnum(['RIGHT_TIME', 'EARLY', 'LATE'], 'EARLY'),
        symbol: z.string(),
      }),
      overall: OverallVerdict,
    }),
    the_bet: z.string(),
    bull_case_2_sentences: z.string(),
    bear_case_2_sentences: z.string(),
    key_strength: z.string(),
    key_risk: z.string(),
    key_question: z.string(),
    expected_return: z.string(),
    closest_comparable: z.string(),
    if_you_do_one_thing: z.string(),
  }),

  problem_primer: z.object({
    section_purpose: z.string(),
    problem_overview: z.object({
      plain_english: z.string(),
      why_it_matters: z.string(),
      market_context: z.string(),
    }),
    physics_foundation: z.object({
      governing_principles: z.array(
        z.object({
          principle: z.string(),
          plain_english: z.string(),
          implication: z.string(),
        }),
      ),
      thermodynamic_limits: z.object({
        theoretical_minimum: z.string(),
        current_best_achieved: z.string(),
        gap_explanation: z.string(),
      }),
      rate_limiting_factors: z.array(z.string()),
    }),
    key_contradictions: z.array(
      z.object({
        tradeoff: z.string(),
        if_you_improve: z.string(),
        typically_worsens: z.string(),
        how_different_approaches_resolve: z.string(),
      }),
    ),
    where_value_created: z.object({
      bottleneck_today: z.string(),
      what_breakthrough_would_unlock: z.string(),
      who_captures_value: z.string(),
    }),
    success_requirements: z.object({
      physics_gates: z.array(z.string()),
      engineering_challenges: z.array(z.string()),
      commercial_thresholds: z.array(z.string()),
    }),
    key_insight: z.string(),
  }),

  solution_landscape: z.object({
    section_purpose: z.string(),
    landscape_overview: z.object({
      total_approaches_analyzed: flexibleNumber(0),
      how_we_generated: z.string(),
      key_insight: z.string(),
    }),
    solution_space_by_track: z.object({
      simpler_path: z.object({
        track_description: z.string(),
        concepts: z.array(
          z.object({
            name: z.string(),
            one_liner: z.string(),
            mechanism: z.string(),
            key_advantage: z.string(),
            key_challenge: z.string(),
            current_players: z.array(z.string()),
            maturity: z.string(),
            threat_to_startup: Severity,
            threat_reasoning: z.string(),
          }),
        ),
      }),
      best_fit: z.object({
        track_description: z.string(),
        concepts: z.array(
          z.object({
            name: z.string(),
            one_liner: z.string(),
            mechanism: z.string(),
            key_advantage: z.string(),
            key_challenge: z.string(),
            current_players: z.array(z.string()),
            maturity: z.string(),
            threat_to_startup: Severity,
            threat_reasoning: z.string(),
          }),
        ),
      }),
      paradigm_shift: z.object({
        track_description: z.string(),
        concepts: z.array(
          z.object({
            name: z.string(),
            one_liner: z.string(),
            mechanism: z.string(),
            key_advantage: z.string(),
            key_challenge: z.string(),
            current_players: z.array(z.string()),
            maturity: z.string(),
            threat_to_startup: Severity,
            threat_reasoning: z.string(),
          }),
        ),
      }),
      frontier_transfer: z.object({
        track_description: z.string(),
        concepts: z.array(
          z.object({
            name: z.string(),
            one_liner: z.string(),
            mechanism: z.string(),
            key_advantage: z.string(),
            key_challenge: z.string(),
            current_players: z.array(z.string()),
            maturity: z.string(),
            threat_to_startup: Severity,
            threat_reasoning: z.string(),
          }),
        ),
      }),
    }),
    startup_positioning: z.object({
      which_track: Track,
      which_concept_closest: z.string(),
      is_optimal_track: z.boolean(),
      what_first_principles_recommends: z.string(),
      positioning_verdict: z.enum([
        'OPTIMAL',
        'REASONABLE',
        'SUBOPTIMAL',
        'WRONG_APPROACH',
      ]),
      positioning_explanation: z.string(),
    }),
    the_implicit_bet: z.object({
      what_they_are_betting_on: z.string(),
      what_must_be_true: z.array(z.string()),
      what_they_are_betting_against: z.array(z.string()),
      bet_quality: flexibleEnum(['GOOD', 'REASONABLE', 'QUESTIONABLE'], 'REASONABLE'),
    }),
    missed_opportunities_deep_dive: z.array(
      z.object({
        approach: z.string(),
        why_potentially_better: z.string(),
        why_startup_missed: z.string(),
        what_startup_would_say: z.string(),
        our_assessment: z.string(),
        investment_implication: z.string(),
      }),
    ),
    competitive_threat_summary: z.object({
      highest_threats: z.array(z.string()),
      timeline_to_threat: z.string(),
      startup_defense: z.string(),
    }),
    strategic_insight: z.string(),
  }),

  executive_summary: z.object({
    verdict: DDVerdict,
    verdict_confidence: Confidence,
    one_paragraph_summary: z.string(),
    key_findings: z.array(
      z.object({
        finding: z.string(),
        type: FindingType,
        impact: Severity,
      }),
    ),
    scores: z.object({
      technical_credibility: z.object({
        score: flexibleNumber(0),
        out_of: flexibleNumber(0),
        one_liner: z.string(),
      }),
      commercial_viability: z.object({
        score: flexibleNumber(0),
        out_of: flexibleNumber(0),
        one_liner: z.string(),
      }),
      team_signals: z.object({
        score: flexibleNumber(0),
        out_of: flexibleNumber(0),
        one_liner: z.string(),
      }),
      moat_strength: z.object({
        score: flexibleNumber(0),
        out_of: flexibleNumber(0),
        one_liner: z.string(),
      }),
    }),
    recommendation: z.object({
      action: RecommendedAction,
      rationale: z.string(),
      key_conditions: z.array(z.string()),
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
      precedent: z.string(),
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
        explanation: z.string(),
      }),
    ),
  }),

  commercialization_reality: z.object({
    verdict: CommercialViabilityVerdict,
    summary: z.string(),
    the_hard_truth: z.object({
      even_if_physics_works: z.string(),
      critical_commercial_question: z.string(),
    }),
    unit_economics: z.object({
      today: z.string(),
      claimed_at_scale: z.string(),
      credibility: flexibleEnum(['CREDIBLE', 'OPTIMISTIC', 'UNREALISTIC'], 'OPTIMISTIC'),
      what_must_be_true: z.string(),
    }),
    path_to_revenue: z.object({
      timeline: z.string(),
      capital_required: z.string(),
      fits_vc_timeline: z.boolean(),
    }),
    market_readiness: z.object({
      market_exists: z.boolean(),
      customer_evidence: z.string(),
      vitamin_or_painkiller: flexibleEnum(['PAINKILLER', 'VITAMIN'], 'VITAMIN'),
    }),
    scale_up_risk: z.object({
      valley_of_death: z.string(),
      stranding_risk: Confidence,
    }),
    policy_exposure: z.object({
      critical_policies: z.array(z.string()),
      exposure_level: Confidence,
      impact_if_changed: z.string(),
    }),
  }),

  claim_validation_summary: z.object({
    overview: z.string(),
    critical_claims: z.array(
      z.object({
        claim: z.string(),
        verdict: z.string(),
        confidence: z.string(),
        plain_english: z.string(),
      }),
    ),
    triz_findings: z.object({
      key_contradictions: z.string(),
      resolution_quality: z.string(),
    }),
  }),

  novelty_assessment: z.object({
    verdict: NoveltyClassification,
    what_is_novel: z.string(),
    what_is_not_novel: z.string(),
    key_prior_art: z.array(
      z.object({
        reference: z.string(),
        relevance: z.string(),
        impact: z.string(),
      }),
    ),
  }),

  moat_assessment: z.object({
    overall: z.object({
      strength: MoatStrength,
      durability_years: flexibleNumber(0),
      primary_source: z.string(),
    }),
    breakdown: z.object({
      technical: flexibleEnum(['STRONG', 'MODERATE', 'WEAK'], 'MODERATE'),
      execution: flexibleEnum(['STRONG', 'MODERATE', 'WEAK'], 'MODERATE'),
      market: flexibleEnum(['STRONG', 'MODERATE', 'WEAK'], 'MODERATE'),
    }),
    vulnerabilities: z.array(
      z.object({
        vulnerability: z.string(),
        severity: Severity,
      }),
    ),
  }),

  pre_mortem: z.object({
    framing: z.string(),
    most_likely_failure: z.object({
      scenario: z.string(),
      probability: z.string(),
      early_warnings: z.array(z.string()),
      preventable_by: z.string(),
    }),
    second_most_likely: z.object({
      scenario: z.string(),
      probability: z.string(),
    }),
    black_swan: z.object({
      scenario: z.string(),
      probability: z.string(),
    }),
  }),

  comparable_analysis: z.object({
    closest_comparables: z.array(
      z.object({
        company: z.string(),
        similarity: z.string(),
        outcome: z.string(),
        lesson: z.string(),
      }),
    ),
    base_rate: z.object({
      category_success_rate: z.string(),
      this_company_vs_base: z.string(),
    }),
  }),

  scenario_analysis: z.object({
    bull_case: z.object({
      probability: z.string(),
      narrative: z.string(),
      return: z.string(),
    }),
    base_case: z.object({
      probability: z.string(),
      narrative: z.string(),
      return: z.string(),
    }),
    bear_case: z.object({
      probability: z.string(),
      narrative: z.string(),
      return: z.string(),
    }),
    expected_value: z.object({
      weighted_multiple: z.string(),
      assessment: z.string(),
    }),
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
    commercial_risks: z.array(
      z.object({
        risk: z.string(),
        severity: Severity,
      }),
    ),
    competitive_risks: z.array(
      z.object({
        risk: z.string(),
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
        bad_answer: z.string(),
      }),
    ),
    technical_deep_dives: z.array(
      z.object({
        topic: z.string(),
        questions: z.array(z.string()),
      }),
    ),
    commercial_deep_dives: z.array(
      z.object({
        topic: z.string(),
        questions: z.array(z.string()),
      }),
    ),
  }),

  diligence_roadmap: z.object({
    before_term_sheet: z.array(
      z.object({
        action: z.string(),
        purpose: z.string(),
        who: z.string(),
        time: z.string(),
        cost: z.string(),
        deal_breaker_if: z.string(),
      }),
    ),
    during_diligence: z.array(
      z.object({
        action: z.string(),
        priority: ValidationPriority,
      }),
    ),
    reference_calls: z.array(
      z.object({
        who: z.string(),
        why: z.string(),
        key_questions: z.array(z.string()),
      }),
    ),
    technical_validation: z.array(
      z.object({
        what: z.string(),
        how: z.string(),
        who_can_help: z.string(),
        cost: z.string(),
        time: z.string(),
      }),
    ),
    documents_to_request: z.array(z.string()),
  }),

  why_this_might_be_wrong: z.object({
    if_we_are_too_negative: z.object({
      what_we_might_be_missing: z.string(),
      what_would_change_our_mind: z.string(),
    }),
    if_we_are_too_positive: z.object({
      what_we_might_be_missing: z.string(),
      what_would_change_our_mind: z.string(),
    }),
    strongest_counter_argument: z.string(),
    our_response: z.string(),
  }),

  confidence_calibration: z.object({
    high_confidence: z.array(
      z.object({
        assessment: z.string(),
        basis: z.string(),
        confidence: z.string(),
      }),
    ),
    medium_confidence: z.array(
      z.object({
        assessment: z.string(),
        basis: z.string(),
        confidence: z.string(),
      }),
    ),
    low_confidence: z.array(
      z.object({
        assessment: z.string(),
        basis: z.string(),
        confidence: z.string(),
      }),
    ),
    known_unknowns: z.array(z.string()),
    where_surprises_lurk: z.array(z.string()),
  }),

  verdict_and_recommendation: z.object({
    technical_verdict: z.object({
      verdict: DDVerdict,
      confidence: Confidence,
      summary: z.string(),
    }),
    commercial_verdict: z.object({
      verdict: flexibleEnum(['CLEAR_PATH', 'CHALLENGING', 'UNLIKELY'], 'CHALLENGING'),
      summary: z.string(),
    }),
    overall_verdict: z.object({
      verdict: DDVerdict,
      confidence: Confidence,
    }),
    recommendation: z.object({
      action: RecommendedAction,
      conditions: z.array(z.string()),
      derisking_steps: z.array(z.string()),
      timeline: z.string(),
    }),
    final_word: z.string(),
  }),
});

export type DD5_M_Output = z.infer<typeof DD5_M_OutputSchema>;
