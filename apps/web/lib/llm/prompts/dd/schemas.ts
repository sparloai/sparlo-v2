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
  // Innovation type mappings (old → new)
  CATALOG: 'ESTABLISHED',
  EMERGING_PRACTICE: 'EMERGING',
  CROSS_DOMAIN: 'ESTABLISHED',
  PARADIGM: 'FRONTIER',
  TECHNOLOGY_REVIVAL: 'EMERGING',
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
    const normalized = val
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

    // Step 6: Fall back to default (silent - sensitive values not logged)
    return defaultValue;
  });
}

/**
 * Creates an antifragile optional object schema.
 * - Returns undefined if input is undefined, null, or empty object
 * - Tries to parse with inner schema, returns undefined on failure
 * - Returns parsed value on success
 *
 * This ensures optional complex objects never crash on malformed LLM output.
 */
function flexibleOptionalObject<T extends z.ZodRawShape>(
  shape: T,
): z.ZodEffects<z.ZodUnknown, z.infer<z.ZodObject<T>> | undefined, unknown> {
  const innerSchema = z.object(shape);

  return z
    .unknown()
    .transform((val): z.infer<typeof innerSchema> | undefined => {
      // Handle undefined/null
      if (val === undefined || val === null) {
        return undefined;
      }

      // Handle non-objects
      if (typeof val !== 'object') {
        return undefined;
      }

      // Handle empty objects
      if (Object.keys(val as object).length === 0) {
        return undefined;
      }

      // Try to parse - if it fails, return undefined instead of throwing
      const result = innerSchema.safeParse(val);
      if (result.success) {
        return result.data;
      }

      // Graceful fallback - don't crash on malformed LLM output
      return undefined;
    });
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

    // Fall back to default (silent - sensitive values not logged)
    return defaultValue;
  });
}

/**
 * Shared helper to recursively convert null to undefined and filter empty objects from arrays.
 * Used by DD0, DD3.5, DD4 schemas for preprocessing LLM output.
 */
function processNullValues(v: unknown): unknown {
  if (v === null) return undefined;
  if (Array.isArray(v)) {
    return v
      .filter((item) => {
        if (item === null || item === undefined) return false;
        if (
          typeof item === 'object' &&
          item !== null &&
          Object.keys(item).length === 0
        )
          return false;
        return true;
      })
      .map(processNullValues);
  }
  if (typeof v === 'object' && v !== null) {
    return Object.fromEntries(
      Object.entries(v).map(([k, val]) => [k, processNullValues(val)]),
    );
  }
  return v;
}

// ============================================
// Shared Enums and Primitives (Antifragile)
// ============================================

export const ClaimType = flexibleEnum(
  [
    'PERFORMANCE',
    'NOVELTY',
    'MECHANISM',
    'FEASIBILITY',
    'TIMELINE',
    'COST',
    'MOAT',
  ],
  'MECHANISM',
);

export const EvidenceLevel = flexibleEnum(
  ['DEMONSTRATED', 'TESTED', 'CITED', 'CLAIMED', 'IMPLIED'],
  'CLAIMED',
);

export const Verifiability = flexibleEnum(
  [
    'PHYSICS_CHECK',
    'LITERATURE_CHECK',
    'DATA_REQUIRED',
    'TEST_REQUIRED',
    'UNVERIFIABLE',
  ],
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

export const Confidence = flexibleEnum(['HIGH', 'MEDIUM', 'LOW'], 'MEDIUM');

export const NoveltyClassification = flexibleEnum(
  [
    'GENUINELY_NOVEL',
    'NOVEL_COMBINATION',
    'NOVEL_APPLICATION',
    'INCREMENTAL',
    'NOT_NOVEL',
  ],
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
  [
    'UNIT_ECONOMICS',
    'MARKET',
    'GTM',
    'TIMELINE',
    'ECOSYSTEM',
    'SCALEUP',
    'POLICY',
  ],
  'MARKET',
);

// Commercial viability verdicts
export const CommercialViabilityVerdict = flexibleEnum(
  [
    'CLEAR_PATH',
    'CHALLENGING_BUT_VIABLE',
    'SIGNIFICANT_OBSTACLES',
    'UNLIKELY_TO_COMMERCIALIZE',
  ],
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
export const EcosystemVerdict = flexibleEnum(
  ['FEW_DEPENDENCIES', 'MANAGEABLE', 'HEAVILY_DEPENDENT'],
  'MANAGEABLE',
);

// Policy exposure verdicts
export const PolicyExposureVerdict = flexibleEnum(
  ['LOW_EXPOSURE', 'MODERATE_EXPOSURE', 'HIGH_EXPOSURE'],
  'MODERATE_EXPOSURE',
);

// Incumbent response types
export const IncumbentResponse = flexibleEnum(
  ['ACQUIRE', 'COPY', 'CRUSH', 'IGNORE', 'PARTNER'],
  'IGNORE',
);

// Bet quality assessment
export const BetQuality = flexibleEnum(
  ['GOOD_BET', 'REASONABLE_BET', 'QUESTIONABLE_BET', 'BAD_BET'],
  'REASONABLE_BET',
);

// Company outcome types
export const CompanyOutcome = flexibleEnum(
  ['SUCCESS', 'ACQUIRED', 'PIVOT', 'ZOMBIE', 'SHUTDOWN'],
  'PIVOT',
);

// Overall verdict for one-page summary
export const OverallVerdict = flexibleEnum(
  ['PROCEED', 'CAUTION', 'PASS'],
  'CAUTION',
);

// ============================================
// DD0 Output Schema - Claim Extraction
// ============================================

export const DD0_M_OutputSchema = z.object({
  startup_profile: z.object({
    company_name: z.string().default('Unknown Company'),
    technology_domain: z.string().default('Technology'),
    stage: z
      .object({
        extracted: Stage,
        source: z.string().catch(''),
        confidence: Confidence,
      })
      .default({ extracted: 'Seed', source: '', confidence: 'MEDIUM' }),
    team_background: z.string().optional(),
  }),

  problem_extraction: z.object({
    business_framing: z.string().catch(''),
    engineering_framing: z.string().catch(''),
    constraints_stated: z.array(z.string()).default([]),
    constraints_implied: z.array(z.string()).default([]),
    success_metrics_stated: z.array(z.string()).default([]),
    success_metrics_implied: z.array(z.string()).default([]),
    problem_statement_for_analysis: z.string().catch(''),
  }),

  proposed_solution: z.object({
    approach_summary: z.string().catch(''),
    core_mechanism: z.string().catch(''),
    key_components: z.array(z.string()).default([]),
    claimed_advantages: z.array(z.string()).default([]),
  }),

  novelty_claims: z
    .array(
      z.object({
        claim: z.string(),
        basis: z.string().catch(''),
        evidence_provided: z.string().default('None provided'),
        prior_art_search_query: z.string().catch(''),
      }),
    )
    .default([]),

  technical_claims: z
    .array(
      z.object({
        id: z.string().catch(''),
        claim_text: z.string(),
        claim_type: ClaimType,
        evidence_level: EvidenceLevel,
        verifiability: Verifiability,
        source_in_materials: z.string().catch(''),
        validation_priority: ValidationPriority,
        validation_approach: z.string().catch(''),
      }),
    )
    .default([]),

  mechanism_claims: z
    .array(
      z.object({
        id: z.string().catch(''),
        mechanism: z.string(),
        how_described: z.string().catch(''),
        depth_of_explanation: flexibleEnum(
          ['DETAILED', 'MODERATE', 'SUPERFICIAL', 'HAND_WAVY'],
          'MODERATE',
        ),
        physics_to_validate: z.array(z.string()).default([]),
        potential_contradictions: z.array(z.string()).default([]),
      }),
    )
    .default([]),

  red_flags: z
    .array(
      z.object({
        flag_type: flexibleEnum(
          [
            'PHYSICS_VIOLATION',
            'EXCEEDS_LIMITS',
            'UNSUPPORTED_NOVELTY',
            'VAGUE_MECHANISM',
            'TRL_MISMATCH',
            'UNBASED_ECONOMICS',
            'TIMELINE_UNREALISTIC',
          ],
          'VAGUE_MECHANISM',
        ),
        description: z.string(),
        severity: flexibleEnum(['CRITICAL', 'HIGH', 'MEDIUM'], 'MEDIUM'),
        related_claim_id: z.string().catch(''),
        question_for_founders: z.string().catch(''),
      }),
    )
    .default([]),

  information_gaps: z
    .array(
      z.object({
        gap: z.string(),
        why_needed: z.string().catch(''),
        impact_if_missing: z.string().catch(''),
      }),
    )
    .default([]),

  competitive_context_claimed: z.object({
    named_competitors: z.array(z.string()).default([]),
    claimed_differentiation: z.array(z.string()).default([]),
    market_position_claimed: z.string().catch(''),
  }),

  search_seeds: z.object({
    prior_art_queries: z.array(z.string()).default([]),
    competitor_queries: z.array(z.string()).default([]),
    mechanism_queries: z.array(z.string()).default([]),
    failure_mode_queries: z.array(z.string()).default([]),
  }),

  // Commercial assumption extraction - with defaults
  commercial_assumptions: z
    .array(
      z.object({
        id: z.string().catch(''),
        assumption: z.string(),
        category: CommercialAssumptionCategory,
        stated_or_implied: flexibleEnum(['STATED', 'IMPLIED'], 'IMPLIED'),
        source_in_materials: z.string().catch(''),
        evidence_provided: z.string().default('None'),
        validation_approach: z.string().catch(''),
        risk_if_wrong: z.string().catch(''),
        validation_priority: ValidationPriority,
      }),
    )
    .default([]),

  policy_dependencies: z
    .array(
      z.object({
        policy: z.string(),
        dependency_level: Severity,
        current_status: z.string().default('Unknown'),
        risk_factors: z.string().catch(''),
      }),
    )
    .default([]),

  ecosystem_map: z.object({
    required_infrastructure: z.array(z.string()).default([]),
    required_partners: z.array(z.string()).default([]),
    required_technologies: z.array(z.string()).default([]),
    chicken_and_egg_problems: z.array(z.string()).default([]),
  }),
});

export type DD0_M_Output = z.infer<typeof DD0_M_OutputSchema>;

// ============================================
// DD3 Output Schema - Claim Validation
// ============================================

// Inner schema for DD3 structured data (used in both old and new formats)
// ANTIFRAGILE: All fields have sensible defaults
const DD3_M_StructuredDataSchema = z.object({
  validation_summary: z.object({
    overall_technical_assessment: z.string().default('Assessment pending'),
    critical_claims_status: z.string().default('Under review'),
    mechanism_validity: MechanismVerdict,
    key_concern: z.string().catch(''),
    key_strength: z.string().catch(''),
  }),

  physics_validation: z
    .array(
      z.object({
        claim_id: z.string().catch(''),
        claim_text: z.string(),
        governing_physics: z.object({
          principle: z.string().catch(''),
          equation: z.string().optional(),
          theoretical_limit: z.string().default('Unknown'),
        }),
        validation_analysis: z.object({
          claim_vs_limit: z.string().catch(''),
          assumptions_required: z.array(z.string()).default([]),
          assumption_validity: z.string().catch(''),
        }),
        verdict: Verdict,
        confidence: Confidence,
        confidence_percent: flexibleNumber(50, { min: 0, max: 100 }),
        reasoning: z.string().catch(''),
      }),
    )
    .default([]),

  mechanism_validation: z.object({
    claimed_mechanism: z.string().catch(''),
    actual_physics: z.string().catch(''),
    accuracy_assessment: flexibleEnum(
      ['ACCURATE', 'OVERSIMPLIFIED', 'PARTIALLY_WRONG', 'FUNDAMENTALLY_WRONG'],
      'OVERSIMPLIFIED',
    ),

    mechanism_deep_dive: z.object({
      working_principle: z.string().catch(''),
      rate_limiting_step: z.string().catch(''),
      key_parameters: z
        .array(
          z.object({
            parameter: z.string(),
            startup_claim: z.string().catch(''),
            validated_range: z.string().catch(''),
            gap: z.string().catch(''),
          }),
        )
        .default([]),
      failure_modes: z
        .array(
          z.object({
            mode: z.string(),
            trigger: z.string().catch(''),
            startup_addresses: z.boolean().default(false),
            mitigation_quality: flexibleEnum(
              ['STRONG', 'ADEQUATE', 'WEAK', 'MISSING'],
              'WEAK',
            ),
          }),
        )
        .default([]),
    }),

    mechanism_precedent: z.object({
      demonstrated_elsewhere: z.boolean().default(false),
      where: z.string().default('Unknown'),
      at_what_scale: z.string().default('Unknown'),
      key_differences: z.string().catch(''),
    }),

    verdict: MechanismVerdict,
    confidence: Confidence,
    reasoning: z.string().catch(''),
  }),

  triz_analysis: z.object({
    problem_contradictions: z
      .array(
        z.object({
          contradiction: z.string(),
          type: flexibleEnum(['TECHNICAL', 'PHYSICAL'], 'TECHNICAL'),
          improving_parameter: z.string().catch(''),
          worsening_parameter: z.string().catch(''),
          startup_awareness: flexibleEnum(
            ['IDENTIFIED', 'PARTIALLY_AWARE', 'UNAWARE'],
            'PARTIALLY_AWARE',
          ),
          startup_resolution: z.string().catch(''),
          resolution_validity: flexibleEnum(
            ['RESOLVED', 'PARTIALLY_RESOLVED', 'UNRESOLVED', 'IGNORED'],
            'PARTIALLY_RESOLVED',
          ),
          standard_resolution: z.string().catch(''),
          inventive_principles_applicable: z.array(z.string()).default([]),
        }),
      )
      .default([]),

    missed_contradictions: z
      .array(
        z.object({
          contradiction: z.string(),
          why_it_matters: z.string().catch(''),
          likely_manifestation: z.string().catch(''),
        }),
      )
      .default([]),

    triz_assessment: z.object({
      contradiction_awareness: Confidence,
      resolution_quality: flexibleEnum(
        ['ELEGANT', 'ADEQUATE', 'PARTIAL', 'POOR'],
        'ADEQUATE',
      ),
      inventive_level: flexibleNumber(3, { min: 1, max: 5 }),
      inventive_level_rationale: z.string().catch(''),
    }),
  }),

  feasibility_validation: z.object({
    scale_assessment: z.object({
      current_demonstrated_scale: z.string().default('Unknown'),
      claimed_target_scale: z.string().default('Unknown'),
      scaling_challenges: z
        .array(
          z.object({
            challenge: z.string(),
            nonlinearity: z.string().catch(''),
            startup_addresses: z.boolean().default(false),
            assessment: flexibleEnum(
              ['MANAGEABLE', 'SIGNIFICANT', 'SEVERE'],
              'SIGNIFICANT',
            ),
          }),
        )
        .default([]),
      scale_verdict: flexibleEnum(
        ['FEASIBLE', 'CHALLENGING', 'UNLIKELY'],
        'CHALLENGING',
      ),
    }),

    cost_assessment: z.object({
      claimed_cost: z.string().default('Not specified'),
      cost_basis_provided: z.string().default('None'),
      cost_basis_quality: flexibleEnum(
        ['DETAILED', 'REASONABLE', 'SUPERFICIAL', 'MISSING'],
        'SUPERFICIAL',
      ),
      hidden_costs_identified: z
        .array(
          z.object({
            cost: z.string(),
            estimated_impact: z.string().catch(''),
            basis: z.string().catch(''),
          }),
        )
        .default([]),
      realistic_cost_range: z.string().default('Unknown'),
      cost_verdict: flexibleEnum(
        ['REALISTIC', 'OPTIMISTIC', 'UNREALISTIC'],
        'OPTIMISTIC',
      ),
    }),

    timeline_assessment: z.object({
      claimed_timeline: z.string().default('Not specified'),
      trl_current: z.string().default('Unknown'),
      trl_claimed: z.string().default('Unknown'),
      timeline_verdict: flexibleEnum(
        ['REALISTIC', 'AGGRESSIVE', 'UNREALISTIC'],
        'AGGRESSIVE',
      ),
      realistic_timeline: z.string().default('TBD'),
    }),
  }),

  internal_consistency: z.object({
    consistent: z.boolean().default(true),
    inconsistencies: z
      .array(
        z.object({
          claim_1: z.string(),
          claim_2: z.string(),
          conflict: z.string().catch(''),
          severity: flexibleEnum(['CRITICAL', 'MODERATE', 'MINOR'], 'MODERATE'),
        }),
      )
      .default([]),
  }),

  validation_verdicts: z
    .array(
      z.object({
        claim_id: z.string().catch(''),
        claim_summary: z.string(),
        verdict: Verdict,
        confidence: Confidence,
        one_line_reasoning: z.string().catch(''),
      }),
    )
    .default([]),

  critical_questions_for_founders: z
    .array(
      z.object({
        question: z.string(),
        why_critical: z.string().catch(''),
        good_answer_looks_like: z.string().catch(''),
        bad_answer_looks_like: z.string().catch(''),
      }),
    )
    .default([]),

  technical_credibility_score: z.object({
    score: flexibleNumber(5, { min: 1, max: 10 }),
    out_of: flexibleNumber(10),
    breakdown: z.object({
      physics_validity: flexibleNumber(5),
      mechanism_soundness: flexibleNumber(5),
      feasibility_realism: flexibleNumber(5),
      internal_consistency: flexibleNumber(5),
    }),
    rationale: z.string().catch(''),
  }),
});

// Prose output schema for DD3-M (new format)
const DD3_M_ProseOutputSchema = z.object({
  technical_deep_dive: z.string(),
  mechanism_explanation: z.string(),
});

/**
 * DD3-M Output Schema - Antifragile
 *
 * Accepts BOTH old format (flat structure) AND new format (prose_output + quick_reference).
 * Uses transform to normalize to a consistent structure.
 */
export const DD3_M_OutputSchema = z.unknown().transform(
  (
    val,
  ): z.infer<typeof DD3_M_StructuredDataSchema> & {
    prose_output?: z.infer<typeof DD3_M_ProseOutputSchema>;
  } => {
    if (!val || typeof val !== 'object') {
      throw new Error('DD3-M output must be an object');
    }

    const input = val as Record<string, unknown>;

    // Check if new format (has prose_output and quick_reference)
    if (input.prose_output && input.quick_reference) {
      const proseResult = DD3_M_ProseOutputSchema.safeParse(input.prose_output);
      const structuredResult = DD3_M_StructuredDataSchema.safeParse(
        input.quick_reference,
      );

      if (!structuredResult.success) {
        // Try to parse directly - maybe it's wrapped differently
        const directResult = DD3_M_StructuredDataSchema.safeParse(val);
        if (directResult.success) {
          return {
            ...directResult.data,
            prose_output: proseResult.success ? proseResult.data : undefined,
          };
        }
        throw structuredResult.error;
      }

      return {
        ...structuredResult.data,
        prose_output: proseResult.success ? proseResult.data : undefined,
      };
    }

    // Old format - parse directly
    const result = DD3_M_StructuredDataSchema.safeParse(val);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  },
);

export type DD3_M_Output = z.infer<typeof DD3_M_StructuredDataSchema> & {
  prose_output?: {
    technical_deep_dive: string;
    mechanism_explanation: string;
  };
};

// ============================================
// DD3.5 Output Schema - Commercialization Reality Check
// ============================================

// Inner schema for DD3.5 structured data (used in both old and new formats)
// ANTIFRAGILE: All fields have sensible defaults
const DD3_5_M_StructuredDataSchema = z.object({
  commercialization_summary: z.object({
    overall_verdict: CommercialViabilityVerdict,
    confidence: Confidence,
    one_paragraph: z.string().catch(''),
    critical_commercial_risk: z.string().catch(''),
    secondary_commercial_risks: z.array(z.string()).default([]),
    timeline_to_meaningful_revenue: z.string().default('Unknown'),
    capital_to_commercial_scale: z.string().default('Unknown'),
    vc_timeline_fit: flexibleEnum(
      ['FITS', 'STRETCHED', 'MISALIGNED'],
      'STRETCHED',
    ),
  }),

  unit_economics_analysis: z.object({
    current_unit_cost: z.object({
      value: z.string().default('Unknown'),
      basis: z.string().catch(''),
      confidence: Confidence,
    }),
    claimed_scale_cost: z.object({
      value: z.string().default('Unknown'),
      basis: z.string().catch(''),
    }),
    gap_factor: z.string().default('Unknown'),
    cost_reduction_assessment: z.object({
      learning_curve: z.object({
        assumption: z.string().catch(''),
        verdict: flexibleEnum(
          ['REALISTIC', 'OPTIMISTIC', 'UNREALISTIC'],
          'OPTIMISTIC',
        ),
        reasoning: z.string().catch(''),
      }),
      scale_effects: z.object({
        what_scales: z.array(z.string()).default([]),
        what_doesnt: z.array(z.string()).default([]),
        verdict: flexibleEnum(
          ['REALISTIC', 'OPTIMISTIC', 'UNREALISTIC'],
          'OPTIMISTIC',
        ),
      }),
      magic_assumptions: z
        .array(
          z.object({
            assumption: z.string(),
            probability: z.string().default('Unknown'),
            impact_if_wrong: z.string().catch(''),
          }),
        )
        .default([]),
    }),
    ten_x_analysis: z.object({
      comparison_metric: z.string().catch(''),
      startup_performance: z.string().default('Unknown'),
      incumbent_performance: z.string().default('Unknown'),
      multiple: z.string().default('Unknown'),
      switching_cost: z.string().default('Unknown'),
      sufficient_for_adoption: z.boolean().default(false),
      reasoning: z.string().catch(''),
    }),
    margin_structure: z.object({
      gross_margin_at_scale: z.string().default('Unknown'),
      basis: z.string().catch(''),
      capital_intensity: z.string().default('Unknown'),
      years_to_cash_flow_positive: z.string().default('Unknown'),
      total_capital_to_profitability: z.string().default('Unknown'),
    }),
    verdict: UnitEconomicsVerdict,
    reasoning: z.string().catch(''),
  }),

  market_reality: z.object({
    customer_identification: z.object({
      stated_customer: z.string().default('Unknown'),
      actual_buyer: z.string().default('Unknown'),
      specificity: flexibleEnum(
        ['SPECIFIC_NAMES', 'CATEGORIES_ONLY', 'VAGUE'],
        'CATEGORIES_ONLY',
      ),
      evidence_of_demand: z.object({
        lois_signed: flexibleNumber(0),
        pilots_active: flexibleNumber(0),
        conversations_claimed: z.string().default('Unknown'),
        revenue_to_date: z.string().default('$0'),
        assessment: flexibleEnum(
          ['VALIDATED', 'PARTIALLY_VALIDATED', 'UNVALIDATED'],
          'PARTIALLY_VALIDATED',
        ),
      }),
      willingness_to_pay: z.object({
        claimed: z.string().default('Unknown'),
        evidence: z.string().default('None'),
        market_alternatives_cost: z.string().default('Unknown'),
        premium_or_discount: z.string().default('Unknown'),
        credibility: Confidence,
      }),
    }),
    market_timing: z.object({
      market_exists_today: z.boolean().default(false),
      current_market_size: z.string().default('Unknown'),
      projected_market_size: z.string().default('Unknown'),
      growth_driver: z.string().catch(''),
      timing_assessment: flexibleEnum(
        ['RIGHT_TIME', '2_YEARS_EARLY', '5_PLUS_YEARS_EARLY', 'TOO_LATE'],
        '2_YEARS_EARLY',
      ),
      timing_reasoning: z.string().catch(''),
    }),
    vitamin_or_painkiller: z.object({
      assessment: flexibleEnum(['PAINKILLER', 'VITAMIN', 'UNCLEAR'], 'UNCLEAR'),
      forcing_function: z.string().catch(''),
      what_happens_if_they_dont_buy: z.string().catch(''),
    }),
    competitive_position: z.object({
      current_alternative: z.string().default('Unknown'),
      switching_cost: z.string().default('Unknown'),
      risk_for_customer: z.string().catch(''),
      why_choose_startup: z.string().catch(''),
    }),
    verdict: MarketDemandVerdict,
    reasoning: z.string().catch(''),
  }),

  gtm_reality: z.object({
    sales_cycle: z.object({
      estimated_months: flexibleNumber(12),
      basis: z.string().catch(''),
      runway_vs_cycle: z.string().default('Unknown'),
      parallel_opportunities: z.string().default('Unknown'),
      verdict: flexibleEnum(['SUSTAINABLE', 'TIGHT', 'UNSUSTAINABLE'], 'TIGHT'),
    }),
    path_to_scale: z
      .array(
        z.object({
          stage: z.string(),
          key_challenge: z.string().catch(''),
          timeline_months: flexibleNumber(0),
          capital_required: z.string().default('Unknown'),
          key_dependencies: z.array(z.string()).default([]),
        }),
      )
      .default([]),
    channel_strategy: z.object({
      stated_approach: z.string().catch(''),
      realistic_assessment: z.string().catch(''),
      critical_partnerships: z.array(z.string()).default([]),
      partnership_status: flexibleEnum(
        [
          'SIGNED',
          'IN_DISCUSSION',
          'IDENTIFIED',
          'PARTIALLY_IDENTIFIED',
          'UNCLEAR',
        ],
        'UNCLEAR',
      ),
    }),
    verdict: GTMVerdict,
    reasoning: z.string().catch(''),
  }),

  timeline_reality: z.object({
    critical_path: z
      .array(
        z.object({
          milestone: z.string(),
          their_timeline: z.string().default('Unknown'),
          realistic_timeline: z.string().default('Unknown'),
          dependencies: z.array(z.string()).default([]),
          risk_factors: z.array(z.string()).default([]),
        }),
      )
      .default([]),
    total_time_to_scale: z.object({
      their_estimate: z.string().default('Unknown'),
      realistic_estimate: z.string().default('Unknown'),
      gap_reasoning: z.string().catch(''),
    }),
    vc_math: z.object({
      years_from_series_a_to_scale: z.string().default('Unknown'),
      fits_fund_timeline: z.boolean().default(false),
      exit_path_visibility: flexibleEnum(
        ['CLEAR', 'EMERGING', 'UNCLEAR'],
        'EMERGING',
      ),
      likely_exit_type: flexibleEnum(
        ['ACQUISITION', 'IPO', 'SECONDARY', 'UNCLEAR'],
        'UNCLEAR',
      ),
    }),
    too_early_assessment: z.object({
      verdict: flexibleEnum(
        ['RIGHT_TIME', '2_YEARS_EARLY', '5_PLUS_YEARS_EARLY'],
        '2_YEARS_EARLY',
      ),
      enabling_conditions_status: z
        .array(
          z.object({
            condition: z.string(),
            status: flexibleEnum(['MET', 'EMERGING', 'NOT_MET'], 'EMERGING'),
            timeline_to_met: z.string().default('Unknown'),
          }),
        )
        .default([]),
      early_mover_tradeoff: z.string().catch(''),
    }),
    verdict: TimelineFitVerdict,
    reasoning: z.string().catch(''),
  }),

  scaleup_reality: z.object({
    pilot_to_commercial_gap: z.object({
      what_changes: z.array(z.string()).default([]),
      known_hard_problems: z.array(z.string()).default([]),
      unknown_unknowns_risk: Confidence,
      discovery_cost: z.string().default('Unknown'),
    }),
    manufacturing: z.object({
      can_be_manufactured: z.boolean().default(false),
      by_whom: z.string().default('Unknown'),
      equipment_exists: z.boolean().default(false),
      equipment_gap: z.string().catch(''),
      supply_chain_risks: z.array(z.string()).default([]),
      verdict: flexibleEnum(
        ['READY', 'NEEDS_DEVELOPMENT', 'MAJOR_GAPS'],
        'NEEDS_DEVELOPMENT',
      ),
    }),
    valley_of_death: z.object({
      capital_required: z.string().default('Unknown'),
      time_required_months: flexibleNumber(24),
      stranding_risk: Confidence,
      what_unlocks_next_capital: z.string().catch(''),
      fallback_if_stuck: z.string().catch(''),
    }),
    verdict: ScaleUpVerdict,
    reasoning: z.string().catch(''),
  }),

  ecosystem_dependencies: z.object({
    infrastructure: z
      .array(
        z.object({
          requirement: z.string(),
          exists_today: z.boolean().default(false),
          who_builds: z.string().default('Unknown'),
          who_pays: z.string().default('Unknown'),
          timeline: z.string().default('Unknown'),
          startup_can_succeed_without: z.boolean().default(false),
          chicken_egg_problem: z.string().catch(''),
        }),
      )
      .default([]),
    regulatory: z.object({
      approvals_needed: z.array(z.string()).default([]),
      typical_timeline_months: flexibleNumber(12),
      fast_track_available: z.boolean().default(false),
      regulatory_risk: Confidence,
      adverse_change_probability: z.string().default('Unknown'),
    }),
    complementary_tech: z
      .array(
        z.object({
          technology: z.string(),
          current_readiness: z.string().default('Unknown'),
          needed_readiness: z.string().default('Unknown'),
          timeline_to_ready: z.string().default('Unknown'),
          owner: z.string().default('Unknown'),
          risk_if_delayed: z.string().catch(''),
        }),
      )
      .default([]),
    verdict: EcosystemVerdict,
    reasoning: z.string().catch(''),
  }),

  policy_dependency: z.object({
    critical_policies: z
      .array(
        z.object({
          policy: z.string(),
          what_it_provides: z.string().catch(''),
          current_value: z.string().default('Unknown'),
          dependency_level: Severity,
          economics_without_it: z.string().default('Unknown'),
          sunset_date: z.string().default('Unknown'),
          change_probability: z.string().default('Unknown'),
          change_impact: z.string().catch(''),
        }),
      )
      .default([]),
    regulatory_tailwinds: z.array(z.string()).default([]),
    regulatory_headwinds: z.array(z.string()).default([]),
    policy_scenario_analysis: z.object({
      base_case: z.string().catch(''),
      bear_case: z.string().catch(''),
      bull_case: z.string().catch(''),
    }),
    verdict: PolicyExposureVerdict,
    reasoning: z.string().catch(''),
  }),

  incumbent_response: z.object({
    likely_response: IncumbentResponse,
    response_reasoning: z.string().catch(''),
    timeline_to_response_months: flexibleNumber(24),
    startup_defense: z.string().catch(''),
    replication_difficulty: z.object({
      time_to_replicate_months: flexibleNumber(24),
      capital_to_replicate: z.string().default('Unknown'),
      expertise_to_replicate: z.string().catch(''),
      verdict: flexibleEnum(['HARD', 'MODERATE', 'EASY'], 'MODERATE'),
    }),
    acquisition_analysis: z.object({
      likely_acquirers: z.array(z.string()).default([]),
      acquisition_trigger: z.string().catch(''),
      likely_timing: z.string().default('Unknown'),
      valuation_range: z.string().default('Unknown'),
      acquirer_motivation: z.string().catch(''),
    }),
  }),

  commercial_red_flags: z
    .array(
      z.object({
        flag: z.string(),
        severity: Severity,
        evidence: z.string().catch(''),
        what_would_resolve: z.string().catch(''),
        question_for_founders: z.string().catch(''),
      }),
    )
    .default([]),

  commercial_questions_for_founders: z
    .array(
      z.object({
        question: z.string(),
        category: CommercialAssumptionCategory,
        why_critical: z.string().catch(''),
        good_answer: z.string().catch(''),
        bad_answer: z.string().catch(''),
      }),
    )
    .default([]),

  // Optional: Unit economics bridge for >30% cost reduction claims
  // Uses flexibleOptionalObject to gracefully handle empty/malformed LLM output
  unit_economics_bridge: flexibleOptionalObject({
    triggers: z.object({
      cost_reduction_claimed: z.string(),
      threshold_exceeded: z.boolean(),
    }),
    current_cost_breakdown: z.array(
      z.object({
        component: z.string(),
        current_cost: z.string(),
        percentage_of_total: z.string(),
      }),
    ),
    reduction_pathway: z.array(
      z.object({
        cost_component: z.string(),
        reduction_mechanism: z.string(),
        reduction_percentage: z.string(),
        confidence: Confidence,
        precedent: z.string(),
        assumption_risk: z.string(),
      }),
    ),
    learning_curve_analysis: z.object({
      claimed_learning_rate: z.string(),
      industry_benchmark: z.string(),
      assessment: flexibleEnum(
        ['REALISTIC', 'OPTIMISTIC', 'UNREALISTIC'],
        'OPTIMISTIC',
      ),
      reasoning: z.string(),
    }),
    scale_effects_analysis: z.object({
      what_scales_linearly: z.array(z.string()),
      what_scales_sub_linearly: z.array(z.string()),
      what_doesnt_scale: z.array(z.string()),
      net_effect: z.string(),
    }),
    bridge_verdict: z.object({
      achievable_cost: z.string(),
      gap_vs_claimed: z.string(),
      confidence: Confidence,
      key_assumption: z.string(),
      if_assumption_wrong: z.string(),
    }),
  }),

  // Optional: Policy deep dive for policy-dependent businesses
  // Uses flexibleOptionalObject to gracefully handle empty/malformed LLM output
  policy_deep_dive: flexibleOptionalObject({
    triggers: z.object({
      policy_identified: z.string(),
      dependency_level: z.string(),
    }),
    policy_details: z.object({
      full_name: z.string(),
      mechanism: z.string(),
      value_to_company: z.string(),
      percentage_of_margin: z.string(),
      expiration_date: z.string(),
    }),
    qualification_analysis: z.object({
      requirements: z.array(z.string()),
      company_status: flexibleEnum(
        ['QUALIFIES', 'LIKELY_QUALIFIES', 'UNCERTAIN', 'UNLIKELY'],
        'UNCERTAIN',
      ),
      uncertain_requirements: z.array(z.string()),
      what_could_disqualify: z.array(z.string()),
    }),
    political_risk_assessment: z.object({
      current_political_support: z.string(),
      sunset_risk: z.string(),
      modification_risk: z.string(),
      timeline_of_risk: z.string(),
    }),
    scenario_economics: z.object({
      with_policy: z.object({
        unit_cost: z.string(),
        margin: z.string(),
        viability: flexibleEnum(['VIABLE', 'MARGINAL', 'UNVIABLE'], 'VIABLE'),
      }),
      without_policy: z.object({
        unit_cost: z.string(),
        margin: z.string(),
        viability: flexibleEnum(['VIABLE', 'MARGINAL', 'UNVIABLE'], 'UNVIABLE'),
      }),
      breakeven_policy_value: z.string(),
    }),
    mitigation_options: z.array(
      z.object({
        strategy: z.string(),
        feasibility: Confidence,
        timeline: z.string(),
      }),
    ),
    policy_verdict: z.object({
      exposure_level: PolicyExposureVerdict,
      recommendation: z.string(),
      diligence_action: z.string(),
    }),
  }),

  // Optional: Byproduct and revenue stream analysis
  // Uses flexibleOptionalObject to gracefully handle empty/malformed LLM output
  byproduct_analysis: flexibleOptionalObject({
    byproducts_identified: z.array(
      z.object({
        byproduct: z.string(),
        quantity_per_unit: z.string(),
        quality: z.string(),
        market_value: z.string(),
        addressable_market: z.string(),
        monetization_status: flexibleEnum(
          ['CONTRACTED', 'IN_DISCUSSION', 'IDENTIFIED', 'SPECULATIVE'],
          'IDENTIFIED',
        ),
      }),
    ),
    revenue_contribution: z.object({
      percentage_of_revenue: z.string(),
      margin_impact: z.string(),
      required_for_viability: z.boolean(),
    }),
    market_risks: z.array(
      z.object({
        risk: z.string(),
        impact: z.string(),
        mitigation: z.string(),
      }),
    ),
    verdict: z.object({
      byproduct_quality: flexibleEnum(
        ['STRONG_ASSET', 'HELPFUL', 'UNCERTAIN', 'LIABILITY'],
        'HELPFUL',
      ),
      reasoning: z.string(),
    }),
  }),
});

// Prose output schema for DD3.5-M (new format)
const DD3_5_M_ProseOutputSchema = z.object({
  commercialization_narrative: z.string(),
});

/**
 * DD3.5-M Output Schema - Antifragile
 *
 * Accepts BOTH old format (flat structure) AND new format (prose_output + detailed_analysis).
 * Uses transform to normalize to a consistent structure.
 */
export const DD3_5_M_OutputSchema = z.unknown().transform(
  (
    val,
  ): z.infer<typeof DD3_5_M_StructuredDataSchema> & {
    prose_output?: z.infer<typeof DD3_5_M_ProseOutputSchema>;
  } => {
    // ANTIFRAGILE: Handle null/undefined/empty by returning defaults
    if (val === null || val === undefined || typeof val !== 'object') {
      return DD3_5_M_StructuredDataSchema.parse({});
    }

    const input = val as Record<string, unknown>;

    // Handle empty object
    if (Object.keys(input).length === 0) {
      return DD3_5_M_StructuredDataSchema.parse({});
    }

    // Preprocess to handle null values
    const processed = processNullValues(input) as Record<string, unknown>;

    // Check if new format (has prose_output and detailed_analysis)
    if (processed.prose_output && processed.detailed_analysis) {
      const proseResult = DD3_5_M_ProseOutputSchema.safeParse(
        processed.prose_output,
      );
      const structuredResult = DD3_5_M_StructuredDataSchema.safeParse(
        processed.detailed_analysis,
      );

      if (!structuredResult.success) {
        // Try to parse directly
        const directResult = DD3_5_M_StructuredDataSchema.safeParse(processed);
        if (directResult.success) {
          return {
            ...directResult.data,
            prose_output: proseResult.success ? proseResult.data : undefined,
          };
        }
        // ANTIFRAGILE: Return defaults with partial merge
        const defaults = DD3_5_M_StructuredDataSchema.parse({});
        return {
          ...defaults,
          ...(processed.detailed_analysis as object),
          prose_output: proseResult.success ? proseResult.data : undefined,
        };
      }

      return {
        ...structuredResult.data,
        prose_output: proseResult.success ? proseResult.data : undefined,
      };
    }

    // Old format - parse directly
    const result = DD3_5_M_StructuredDataSchema.safeParse(processed);
    if (!result.success) {
      // ANTIFRAGILE: Return defaults with partial merge
      const defaults = DD3_5_M_StructuredDataSchema.parse({});
      return {
        ...defaults,
        ...(processed as object),
      };
    }
    return result.data;
  },
);

export type DD3_5_M_Output = z.infer<typeof DD3_5_M_StructuredDataSchema> & {
  prose_output?: {
    commercialization_narrative: string;
  };
};

// ============================================
// DD4 Output Schema - Solution Space Mapping
// ============================================

// Inner schema for DD4 structured data (used in both old and new formats)
// ANTIFRAGILE: All fields have sensible defaults and are optional
const DD4_M_StructuredDataSchema = z.object({
  solution_space_position: z
    .object({
      primary_track: Track,
      track_rationale: z.string().catch(''),

      fit_assessment: z.object({
        optimal_for_problem: z.boolean().default(false),
        explanation: z.string().catch(''),
        what_first_principles_suggests: z.string().catch(''),
        alignment: flexibleEnum(
          ['ALIGNED', 'PARTIALLY_ALIGNED', 'MISALIGNED'],
          'PARTIALLY_ALIGNED',
        ),
      }),

      problem_framing_assessment: z.object({
        their_framing: z.string().catch(''),
        optimal_framing: z.string().catch(''),
        framing_quality: flexibleEnum(
          ['OPTIMAL', 'GOOD', 'SUBOPTIMAL', 'WRONG_PROBLEM'],
          'SUBOPTIMAL',
        ),
        implications: z.string().catch(''),
      }),
    })
    .optional(),

  missed_alternatives: z
    .array(
      z.object({
        concept_from_an3: z.string().catch(''),
        concept_summary: z.string().catch(''),
        track: z.string().catch(''),
        why_potentially_better: z.string().catch(''),
        why_startup_might_have_missed: z.string().catch(''),
        competitive_threat_level: Severity,
        who_might_pursue: z.string().catch(''),
      }),
    )
    .default([]),

  novelty_assessment: z
    .object({
      claimed_novelty: z.string().catch(''),

      prior_art_findings: z
        .array(
          z.object({
            source_type: flexibleEnum(
              ['PATENT', 'ACADEMIC', 'COMMERCIAL', 'ABANDONED'],
              'COMMERCIAL',
            ),
            reference: z.string().catch(''),
            relevance: z.string().catch(''),
            what_it_covers: z.string().catch(''),
            implications: z.string().catch(''),
          }),
        )
        .default([]),

      novelty_verdict: z.object({
        classification: NoveltyClassification,
        what_is_actually_novel: z.string().catch(''),
        what_is_not_novel: z.string().catch(''),
        confidence: Confidence,
        reasoning: z.string().catch(''),
      }),

      novelty_vs_claimed: z.object({
        claimed_accurate: z.boolean().default(false),
        overclaim: z.string().catch(''),
        underclaim: z.string().catch(''),
      }),
    })
    .optional(),

  moat_assessment: z
    .object({
      technical_moat: z.object({
        patentability: MoatStrength,
        patent_rationale: z.string().catch(''),
        trade_secret_potential: flexibleEnum(
          ['STRONG', 'MODERATE', 'WEAK'],
          'MODERATE',
        ),
        replication_difficulty: flexibleEnum(
          ['VERY_HARD', 'HARD', 'MODERATE', 'EASY'],
          'MODERATE',
        ),
        time_to_replicate: z.string().default('Unknown'),
        key_barriers: z.array(z.string()).default([]),
      }),

      execution_moat: z.object({
        expertise_rarity: z.string().catch(''),
        data_advantage: z.string().catch(''),
        network_effects: z.string().catch(''),
        regulatory_barrier: z.string().catch(''),
        switching_costs: z.string().catch(''),
      }),

      overall_moat: z.object({
        strength: MoatStrength,
        durability: z.string().default('Unknown'),
        primary_source: z.string().catch(''),
        key_vulnerabilities: z.array(z.string()).default([]),
      }),
    })
    .optional(),

  competitive_risk_analysis: z
    .object({
      threats_from_solution_space: z
        .array(
          z.object({
            threat_source: z.string().catch(''),
            threat_type: flexibleEnum(
              ['DIRECT_COMPETITION', 'SUBSTITUTION', 'DISRUPTION'],
              'DIRECT_COMPETITION',
            ),
            threat_level: Severity,
            time_horizon: z.string().default('Unknown'),
            likelihood: Confidence,
            startup_vulnerability: z.string().catch(''),
            mitigation_possible: z.string().catch(''),
          }),
        )
        .default([]),

      simpler_path_risk: z.object({
        simpler_alternatives_exist: z.boolean().default(false),
        could_be_good_enough: z.boolean().default(false),
        explanation: z.string().catch(''),
      }),

      paradigm_shift_risk: z.object({
        disruptive_approaches_emerging: z.boolean().default(false),
        threats: z.array(z.string()).default([]),
        timeline: z.string().default('Unknown'),
      }),

      timing_assessment: z.object({
        market_timing: flexibleEnum(['EARLY', 'RIGHT', 'LATE'], 'EARLY'),
        technology_timing: z.string().catch(''),
        dependencies: z.array(z.string()).default([]),
        risk: z.string().catch(''),
      }),
    })
    .optional(),

  key_insights: z
    .array(
      z.object({
        insight: z.string(),
        type: FindingType,
        investment_implication: z.string().catch(''),
      }),
    )
    .default([]),

  strategic_questions: z
    .array(
      z.object({
        question: z.string(),
        why_it_matters: z.string().catch(''),
        what_good_looks_like: z.string().catch(''),
      }),
    )
    .default([]),

  // Strategic analysis sections
  the_one_bet: z
    .object({
      core_bet_statement: z.string().catch(''),
      technical_bet: z.object({
        bet: z.string().catch(''),
        current_evidence_for: z.string().catch(''),
        current_evidence_against: z.string().catch(''),
        when_resolved: z.string().default('Unknown'),
        resolution_milestone: z.string().catch(''),
      }),
      commercial_bet: z.object({
        bet: z.string().catch(''),
        current_evidence_for: z.string().catch(''),
        current_evidence_against: z.string().catch(''),
        when_resolved: z.string().default('Unknown'),
      }),
      timing_bet: z.object({
        bet: z.string().catch(''),
        too_early_scenario: z.string().catch(''),
        too_late_scenario: z.string().catch(''),
        timing_evidence: z.string().catch(''),
      }),
      implicit_dismissals: z
        .array(
          z.object({
            dismissed_alternative: z.string(),
            their_implicit_reasoning: z.string().catch(''),
            our_assessment: z.string().catch(''),
          }),
        )
        .default([]),
      bet_quality: z.object({
        assessment: BetQuality,
        expected_value_reasoning: z.string().catch(''),
        what_makes_it_worth_it: z.string().catch(''),
      }),
    })
    .optional(),

  pre_mortem: z
    .object({
      framing: z.string().catch(''),
      most_likely_failure_mode: z.object({
        scenario: z.string().catch(''),
        probability: z.string().default('Unknown'),
        timeline: z.string().default('Unknown'),
        early_warning_signs: z.array(z.string()).default([]),
        could_be_prevented_by: z.string().catch(''),
        key_decision_point: z.string().catch(''),
      }),
      second_most_likely_failure: z.object({
        scenario: z.string().catch(''),
        probability: z.string().default('Unknown'),
        timeline: z.string().default('Unknown'),
        early_warning_signs: z.array(z.string()).default([]),
        could_be_prevented_by: z.string().catch(''),
      }),
      black_swan_failure: z.object({
        scenario: z.string().catch(''),
        probability: z.string().default('<5%'),
        trigger: z.string().catch(''),
        warning_signs: z.array(z.string()).default([]),
      }),
      pattern_from_comparables: z.object({
        what_usually_kills_companies_like_this: z.string().catch(''),
        is_this_company_different: z.boolean().default(false),
        why_or_why_not: z.string().catch(''),
      }),
      failure_modes_by_category: z.object({
        technical_failure_probability: z.string().default('Unknown'),
        commercial_failure_probability: z.string().default('Unknown'),
        execution_failure_probability: z.string().default('Unknown'),
        market_timing_failure_probability: z.string().default('Unknown'),
        primary_risk_category: z.string().default('Unknown'),
      }),
    })
    .optional(),

  comparable_analysis: z
    .object({
      selection_criteria: z.string().catch(''),
      closest_comparables: z
        .array(
          z.object({
            company: z.string(),
            similarity: z.string().catch(''),
            funding_raised: z.string().default('Unknown'),
            timeline: z.string().default('Unknown'),
            outcome: CompanyOutcome,
            outcome_details: z.string().catch(''),
            valuation_at_outcome: z.string().default('Unknown'),
            key_success_factors: z.array(z.string()).default([]),
            key_failure_factors: z.array(z.string()).default([]),
            lessons_for_this_deal: z.string().catch(''),
            key_differences: z.string().catch(''),
          }),
        )
        .default([]),
      pattern_analysis: z.object({
        companies_in_category: z.string().default('Unknown'),
        success_rate: z.string().default('Unknown'),
        median_outcome: z.string().default('Unknown'),
        top_decile_outcome: z.string().default('Unknown'),
        bottom_decile_outcome: z.string().default('Unknown'),
        time_to_outcome: z.string().default('Unknown'),
      }),
      base_rate: z.object({
        category: z.string().catch(''),
        historical_success_rate: z.string().default('Unknown'),
        median_return_multiple: z.string().default('Unknown'),
        definition_of_success: z.string().catch(''),
      }),
      this_company_vs_base_rate: z.object({
        better_than_base_rate_because: z.array(z.string()).default([]),
        worse_than_base_rate_because: z.array(z.string()).default([]),
        adjusted_probability: z.string().default('Unknown'),
      }),
    })
    .optional(),

  scenario_analysis: z
    .object({
      probability_methodology: z.string().catch(''),
      key_conditions: z
        .array(
          z.object({
            condition: z.string().catch(''),
            probability: z.string().default('Unknown'),
            basis: z.string().catch(''),
            confidence: Confidence.optional().default('MEDIUM'),
          }),
        )
        .default([]),
      bull_case: z
        .object({
          requires: z
            .array(
              z.object({
                condition: z.string().catch(''),
                probability: z.string().default('Unknown'),
              }),
            )
            .default([]),
          joint_probability_calculation: z.string().catch(''),
          final_probability: z.string().default('Unknown'),
          narrative: z.string().catch(''),
          key_events: z.array(z.string()).default([]),
          timeline_years: flexibleNumber(5),
          exit_type: z.string().default('Unknown'),
          exit_valuation: z.string().default('Unknown'),
          return_multiple: z.string().default('Unknown'),
          what_you_believe_in_this_scenario: z.string().catch(''),
        })
        .default({
          requires: [],
          joint_probability_calculation: '',
          final_probability: 'Unknown',
          narrative: '',
          key_events: [],
          timeline_years: 5,
          exit_type: 'Unknown',
          exit_valuation: 'Unknown',
          return_multiple: 'Unknown',
          what_you_believe_in_this_scenario: '',
        }),
      base_case: z
        .object({
          requires: z
            .array(
              z.object({
                condition: z.string().catch(''),
                probability: z.string().default('Unknown'),
              }),
            )
            .default([]),
          joint_probability_calculation: z.string().catch(''),
          final_probability: z.string().default('Unknown'),
          narrative: z.string().catch(''),
          key_events: z.array(z.string()).default([]),
          timeline_years: flexibleNumber(5),
          exit_type: z.string().default('Unknown'),
          exit_valuation: z.string().default('Unknown'),
          return_multiple: z.string().default('Unknown'),
          what_you_believe_in_this_scenario: z.string().catch(''),
        })
        .default({
          requires: [],
          joint_probability_calculation: '',
          final_probability: 'Unknown',
          narrative: '',
          key_events: [],
          timeline_years: 5,
          exit_type: 'Unknown',
          exit_valuation: 'Unknown',
          return_multiple: 'Unknown',
          what_you_believe_in_this_scenario: '',
        }),
      bear_case: z
        .object({
          requires: z
            .array(
              z.object({
                condition: z.string().catch(''),
                probability: z.string().default('Unknown'),
              }),
            )
            .default([]),
          joint_probability_calculation: z.string().catch(''),
          final_probability: z.string().default('Unknown'),
          narrative: z.string().catch(''),
          key_events: z.array(z.string()).default([]),
          timeline_years: flexibleNumber(5),
          exit_type: z.string().default('Unknown'),
          exit_valuation: z.string().default('Unknown'),
          return_multiple: z.string().default('Unknown'),
          what_you_believe_in_this_scenario: z.string().catch(''),
        })
        .default({
          requires: [],
          joint_probability_calculation: '',
          final_probability: 'Unknown',
          narrative: '',
          key_events: [],
          timeline_years: 5,
          exit_type: 'Unknown',
          exit_valuation: 'Unknown',
          return_multiple: 'Unknown',
          what_you_believe_in_this_scenario: '',
        }),
      probability_sanity_check: z
        .object({
          probabilities_sum_to: z.string().default('100%'),
          adjustment_if_needed: z.string().default('None'),
        })
        .default({
          probabilities_sum_to: '100%',
          adjustment_if_needed: 'None',
        }),
      expected_value: z
        .object({
          calculation: z.string().catch(''),
          weighted_return_multiple: z.string().default('Unknown'),
          confidence_in_ev: Confidence,
          key_sensitivity: z.string().catch(''),
        })
        .default({
          calculation: '',
          weighted_return_multiple: 'Unknown',
          confidence_in_ev: 'MEDIUM',
          key_sensitivity: '',
        }),
      base_rate_comparison: z
        .object({
          category: z.string().catch(''),
          historical_success_rate: z.string().default('Unknown'),
          historical_median_return: z.string().default('Unknown'),
          this_company_vs_base_rate: z.string().catch(''),
        })
        .default({
          category: '',
          historical_success_rate: 'Unknown',
          historical_median_return: 'Unknown',
          this_company_vs_base_rate: '',
        }),
      scenario_sensitivities: z
        .array(
          z.object({
            variable: z.string().catch(''),
            bull_assumption: z.string().catch(''),
            bear_assumption: z.string().catch(''),
            current_best_estimate: z.string().catch(''),
            how_to_derisk: z.string().catch(''),
          }),
        )
        .default([]),
    })
    .default({
      probability_methodology: '',
      key_conditions: [],
      bull_case: {
        requires: [],
        joint_probability_calculation: '',
        final_probability: 'Unknown',
        narrative: '',
        key_events: [],
        timeline_years: 5,
        exit_type: 'Unknown',
        exit_valuation: 'Unknown',
        return_multiple: 'Unknown',
        what_you_believe_in_this_scenario: '',
      },
      base_case: {
        requires: [],
        joint_probability_calculation: '',
        final_probability: 'Unknown',
        narrative: '',
        key_events: [],
        timeline_years: 5,
        exit_type: 'Unknown',
        exit_valuation: 'Unknown',
        return_multiple: 'Unknown',
        what_you_believe_in_this_scenario: '',
      },
      bear_case: {
        requires: [],
        joint_probability_calculation: '',
        final_probability: 'Unknown',
        narrative: '',
        key_events: [],
        timeline_years: 5,
        exit_type: 'Unknown',
        exit_valuation: 'Unknown',
        return_multiple: 'Unknown',
        what_you_believe_in_this_scenario: '',
      },
      probability_sanity_check: {
        probabilities_sum_to: '100%',
        adjustment_if_needed: 'None',
      },
      expected_value: {
        calculation: '',
        weighted_return_multiple: 'Unknown',
        confidence_in_ev: 'MEDIUM',
        key_sensitivity: '',
      },
      base_rate_comparison: {
        category: '',
        historical_success_rate: 'Unknown',
        historical_median_return: 'Unknown',
        this_company_vs_base_rate: '',
      },
      scenario_sensitivities: [],
    }),

  // Comparable pattern synthesis (Patch 5) - Made antifragile with defaults
  comparable_pattern_synthesis: z
    .object({
      methodology: z
        .string()
        .default('Pattern analysis across comparable companies'),
      quantified_patterns: z
        .union([
          z.array(
            z.object({
              pattern: z.string(),
              n_companies: flexibleNumber(0),
              success_rate_if_present: z.string().default('N/A'),
              success_rate_if_absent: z.string().default('N/A'),
              this_company_status: flexibleEnum(
                ['PRESENT', 'ABSENT', 'PARTIAL'],
                'PARTIAL',
              ),
              implication: z.string().catch(''),
            }),
          ),
          // Handle case where LLM returns object instead of array
          z.object({}).transform(() => []),
        ])
        .default([]),
      pattern_scorecard: z
        .object({
          positive_indicators_count: flexibleNumber(0),
          negative_indicators_count: flexibleNumber(0),
          net_score: z.string().default('0'),
          interpretation: z
            .string()
            .default('Insufficient data for pattern analysis'),
        })
        .default({
          positive_indicators_count: 0,
          negative_indicators_count: 0,
          net_score: '0',
          interpretation: 'Insufficient data for pattern analysis',
        }),
      differentiated_insight: z
        .string()
        .default('See comparable analysis section for detailed insights'),
    })
    .default({
      methodology: 'Pattern analysis across comparable companies',
      quantified_patterns: [],
      pattern_scorecard: {
        positive_indicators_count: 0,
        negative_indicators_count: 0,
        net_score: '0',
        interpretation: 'Insufficient data for pattern analysis',
      },
      differentiated_insight:
        'See comparable analysis section for detailed insights',
    }),
});

// Prose output schema for DD4-M (new format)
const DD4_M_ProseOutputSchema = z.object({
  solution_landscape_narrative: z.string(),
  strategic_synthesis: z.string(),
});

/**
 * DD4-M Output Schema - Antifragile
 *
 * Accepts BOTH old format (flat structure) AND new format (prose_output + detailed_analysis).
 * Uses transform to normalize to a consistent structure.
 */
export const DD4_M_OutputSchema = z.unknown().transform(
  (
    val,
  ): z.infer<typeof DD4_M_StructuredDataSchema> & {
    prose_output?: z.infer<typeof DD4_M_ProseOutputSchema>;
  } => {
    // ANTIFRAGILE: Handle null/undefined/empty by returning defaults
    if (val === null || val === undefined || typeof val !== 'object') {
      return DD4_M_StructuredDataSchema.parse({});
    }

    const input = val as Record<string, unknown>;

    // Handle empty object
    if (Object.keys(input).length === 0) {
      return DD4_M_StructuredDataSchema.parse({});
    }

    // Preprocess to handle null values
    const processed = processNullValues(input) as Record<string, unknown>;

    // Check if new format (has prose_output and detailed_analysis)
    if (processed.prose_output && processed.detailed_analysis) {
      const proseResult = DD4_M_ProseOutputSchema.safeParse(
        processed.prose_output,
      );
      const structuredResult = DD4_M_StructuredDataSchema.safeParse(
        processed.detailed_analysis,
      );

      if (!structuredResult.success) {
        // Try to parse directly
        const directResult = DD4_M_StructuredDataSchema.safeParse(processed);
        if (directResult.success) {
          return {
            ...directResult.data,
            prose_output: proseResult.success ? proseResult.data : undefined,
          };
        }
        // ANTIFRAGILE: Return defaults with partial merge
        const defaults = DD4_M_StructuredDataSchema.parse({});
        return {
          ...defaults,
          ...(processed.detailed_analysis as object),
          prose_output: proseResult.success ? proseResult.data : undefined,
        };
      }

      return {
        ...structuredResult.data,
        prose_output: proseResult.success ? proseResult.data : undefined,
      };
    }

    // Old format - parse directly
    const result = DD4_M_StructuredDataSchema.safeParse(processed);
    if (!result.success) {
      // ANTIFRAGILE: Return defaults with partial merge
      const defaults = DD4_M_StructuredDataSchema.parse({});
      return {
        ...defaults,
        ...(processed as object),
      };
    }
    return result.data;
  },
);

export type DD4_M_Output = z.infer<typeof DD4_M_StructuredDataSchema> & {
  prose_output?: {
    solution_landscape_narrative: string;
    strategic_synthesis: string;
  };
};

// ============================================
// DD5 Output Schema - DD Report (V2 Comprehensive)
// ============================================

// Inner schema for DD5 old format structured data
// ANTIFRAGILE: All fields have sensible defaults
const DD5_M_OldFormatSchema = z.object({
  header: z.object({
    report_type: z.string().default('Technical Due Diligence Report'),
    company_name: z.string().default('Unknown Company'),
    technology_domain: z.string().default('Technology'),
    date: z.string().catch(''),
    version: z.string().default('1.0'),
    classification: z.string().default('Confidential'),
  }),

  one_page_summary: z.object({
    company: z.string().default('Unknown Company'),
    sector: z.string().default('Technology'),
    stage: z.string().default('Seed'),
    ask: z.string().default('Unknown'),
    one_sentence: z.string().catch(''),
    verdict_box: z.object({
      technical_validity: z.object({
        verdict: MechanismVerdict,
        symbol: z.string().default('⚠️'),
      }),
      commercial_viability: z.object({
        verdict: flexibleEnum(
          ['CLEAR_PATH', 'CHALLENGING', 'UNLIKELY'],
          'CHALLENGING',
        ),
        symbol: z.string().default('⚠️'),
      }),
      solution_space_position: z.object({
        verdict: flexibleEnum(
          ['OPTIMAL', 'REASONABLE', 'SUBOPTIMAL'],
          'REASONABLE',
        ),
        symbol: z.string().default('⚠️'),
      }),
      moat_strength: z.object({
        verdict: MoatStrength,
        symbol: z.string().default('⚠️'),
      }),
      timing: z.object({
        verdict: flexibleEnum(['RIGHT_TIME', 'EARLY', 'LATE'], 'EARLY'),
        symbol: z.string().default('⚠️'),
      }),
      overall: OverallVerdict,
    }),
    the_bet: z.string().catch(''),
    bull_case_2_sentences: z.string().catch(''),
    bear_case_2_sentences: z.string().catch(''),
    key_strength: z.string().catch(''),
    key_risk: z.string().catch(''),
    key_question: z.string().catch(''),
    expected_return: z.string().default('Unknown'),
    closest_comparable: z.string().default('None identified'),
    if_you_do_one_thing: z.string().catch(''),
    executive_paragraph: z.string().catch(''),
  }),

  problem_primer: z.object({
    section_purpose: z.string().catch(''),
    problem_overview: z.object({
      plain_english: z.string().catch(''),
      why_it_matters: z.string().catch(''),
      market_context: z.string().catch(''),
    }),
    physics_foundation: z.object({
      governing_principles: z
        .array(
          z.object({
            principle: z.string().catch(''),
            plain_english: z.string().catch(''),
            implication: z.string().catch(''),
          }),
        )
        .default([]),
      thermodynamic_limits: z.object({
        theoretical_minimum: z.string().default('Unknown'),
        current_best_achieved: z.string().default('Unknown'),
        gap_explanation: z.string().catch(''),
      }),
      rate_limiting_factors: z.array(z.string()).default([]),
    }),
    key_contradictions: z
      .array(
        z.object({
          tradeoff: z.string().catch(''),
          if_you_improve: z.string().catch(''),
          typically_worsens: z.string().catch(''),
          how_different_approaches_resolve: z.string().catch(''),
        }),
      )
      .default([]),
    where_value_created: z.object({
      bottleneck_today: z.string().catch(''),
      what_breakthrough_would_unlock: z.string().catch(''),
      who_captures_value: z.string().catch(''),
    }),
    success_requirements: z.object({
      physics_gates: z.array(z.string()).default([]),
      engineering_challenges: z.array(z.string()).default([]),
      commercial_thresholds: z.array(z.string()).default([]),
    }),
    key_insight: z.string().catch(''),
  }),

  solution_landscape: z.object({
    section_purpose: z.string().catch(''),
    landscape_overview: z.object({
      total_approaches_analyzed: flexibleNumber(0),
      how_we_generated: z.string().catch(''),
      key_insight: z.string().catch(''),
    }),
    solution_space_by_track: z.object({
      simpler_path: z.object({
        track_description: z.string().catch(''),
        concepts: z
          .array(
            z.object({
              name: z.string().catch(''),
              one_liner: z.string().catch(''),
              mechanism: z.string().catch(''),
              key_advantage: z.string().catch(''),
              key_challenge: z.string().catch(''),
              current_players: z.array(z.string()).default([]),
              maturity: z.string().default('Unknown'),
              threat_to_startup: Severity,
              threat_reasoning: z.string().catch(''),
            }),
          )
          .default([]),
      }),
      best_fit: z.object({
        track_description: z.string().catch(''),
        concepts: z
          .array(
            z.object({
              name: z.string().catch(''),
              one_liner: z.string().catch(''),
              mechanism: z.string().catch(''),
              key_advantage: z.string().catch(''),
              key_challenge: z.string().catch(''),
              current_players: z.array(z.string()).default([]),
              maturity: z.string().default('Unknown'),
              threat_to_startup: Severity,
              threat_reasoning: z.string().catch(''),
            }),
          )
          .default([]),
      }),
      paradigm_shift: z.object({
        track_description: z.string().catch(''),
        concepts: z
          .array(
            z.object({
              name: z.string().catch(''),
              one_liner: z.string().catch(''),
              mechanism: z.string().catch(''),
              key_advantage: z.string().catch(''),
              key_challenge: z.string().catch(''),
              current_players: z.array(z.string()).default([]),
              maturity: z.string().default('Unknown'),
              threat_to_startup: Severity,
              threat_reasoning: z.string().catch(''),
            }),
          )
          .default([]),
      }),
      frontier_transfer: z.object({
        track_description: z.string().catch(''),
        concepts: z
          .array(
            z.object({
              name: z.string().catch(''),
              one_liner: z.string().catch(''),
              mechanism: z.string().catch(''),
              key_advantage: z.string().catch(''),
              key_challenge: z.string().catch(''),
              current_players: z.array(z.string()).default([]),
              maturity: z.string().default('Unknown'),
              threat_to_startup: Severity,
              threat_reasoning: z.string().catch(''),
            }),
          )
          .default([]),
      }),
    }),
    startup_positioning: z.object({
      which_track: Track,
      which_concept_closest: z.string().catch(''),
      is_optimal_track: z.boolean().default(false),
      what_first_principles_recommends: z.string().catch(''),
      positioning_verdict: flexibleEnum(
        ['OPTIMAL', 'REASONABLE', 'SUBOPTIMAL', 'WRONG_APPROACH'],
        'REASONABLE',
      ),
      positioning_explanation: z.string().catch(''),
    }),
    the_implicit_bet: z.object({
      what_they_are_betting_on: z.string().catch(''),
      what_must_be_true: z.array(z.string()).default([]),
      what_they_are_betting_against: z.array(z.string()).default([]),
      bet_quality: flexibleEnum(
        ['GOOD', 'REASONABLE', 'QUESTIONABLE'],
        'REASONABLE',
      ),
    }),
    missed_opportunities_deep_dive: z
      .array(
        z.object({
          approach: z.string().catch(''),
          why_potentially_better: z.string().catch(''),
          why_startup_missed: z.string().catch(''),
          what_startup_would_say: z.string().catch(''),
          our_assessment: z.string().catch(''),
          investment_implication: z.string().catch(''),
        }),
      )
      .default([]),
    competitive_threat_summary: z.object({
      highest_threats: z.array(z.string()).default([]),
      timeline_to_threat: z.string().default('Unknown'),
      startup_defense: z.string().catch(''),
    }),
    strategic_insight: z.string().catch(''),
  }),

  executive_summary: z.object({
    verdict: DDVerdict,
    verdict_confidence: Confidence,
    one_paragraph_summary: z.string().catch(''),
    key_findings: z
      .array(
        z.object({
          finding: z.string().catch(''),
          type: FindingType,
          impact: Severity,
        }),
      )
      .default([]),
    scores: z.object({
      technical_credibility: z.object({
        score: flexibleNumber(5),
        out_of: flexibleNumber(10),
        one_liner: z.string().catch(''),
      }),
      commercial_viability: z.object({
        score: flexibleNumber(5),
        out_of: flexibleNumber(10),
        one_liner: z.string().catch(''),
      }),
      team_note: z.object({
        assessment_status: z.string().default('Not assessed'),
        reason: z.string().catch(''),
        key_credentials_observed: z.array(z.string()).default([]),
        red_flags_to_investigate: z.array(z.string()).default([]),
        reference_call_priority: Confidence,
      }),
      moat_strength: z.object({
        score: flexibleNumber(5),
        out_of: flexibleNumber(10),
        one_liner: z.string().catch(''),
      }),
    }),
    recommendation: z.object({
      action: RecommendedAction,
      rationale: z.string().catch(''),
      key_conditions: z.array(z.string()).default([]),
    }),
  }),

  technical_thesis_assessment: z.object({
    their_thesis: z.string().catch(''),
    thesis_validity: z.object({
      verdict: MechanismVerdict,
      confidence: Confidence,
      explanation: z.string().catch(''),
    }),
    mechanism_assessment: z.object({
      mechanism: z.string().catch(''),
      physics_validity: z.string().catch(''),
      precedent: z.string().catch(''),
      key_uncertainty: z.string().catch(''),
    }),
    performance_claims: z
      .array(
        z.object({
          claim: z.string().catch(''),
          theoretical_limit: z.string().default('Unknown'),
          verdict: flexibleEnum(
            ['VALIDATED', 'PLAUSIBLE', 'QUESTIONABLE', 'IMPLAUSIBLE'],
            'QUESTIONABLE',
          ),
          explanation: z.string().catch(''),
        }),
      )
      .default([]),
  }),

  commercialization_reality: z.object({
    verdict: CommercialViabilityVerdict,
    summary: z.string().catch(''),
    the_hard_truth: z.object({
      even_if_physics_works: z.string().catch(''),
      critical_commercial_question: z.string().catch(''),
    }),
    unit_economics: z.object({
      today: z.string().default('Unknown'),
      claimed_at_scale: z.string().default('Unknown'),
      credibility: flexibleEnum(
        ['CREDIBLE', 'OPTIMISTIC', 'UNREALISTIC'],
        'OPTIMISTIC',
      ),
      what_must_be_true: z.string().catch(''),
    }),
    path_to_revenue: z.object({
      timeline: z.string().default('Unknown'),
      capital_required: z.string().default('Unknown'),
      fits_vc_timeline: z.boolean().default(false),
    }),
    market_readiness: z.object({
      market_exists: z.boolean().default(false),
      customer_evidence: z.string().catch(''),
      vitamin_or_painkiller: flexibleEnum(['PAINKILLER', 'VITAMIN'], 'VITAMIN'),
    }),
    scale_up_risk: z.object({
      valley_of_death: z.string().catch(''),
      stranding_risk: Confidence,
    }),
    policy_exposure: z.object({
      critical_policies: z.array(z.string()).default([]),
      exposure_level: Confidence,
      impact_if_changed: z.string().catch(''),
    }),
  }),

  claim_validation_summary: z.object({
    overview: z.string().catch(''),
    critical_claims: z
      .array(
        z.object({
          claim: z.string().catch(''),
          verdict: z.string().default('Unknown'),
          confidence: z.string().default('Unknown'),
          plain_english: z.string().catch(''),
        }),
      )
      .default([]),
    triz_findings: z.object({
      key_contradictions: z.string().catch(''),
      resolution_quality: z.string().catch(''),
    }),
  }),

  novelty_assessment: z.object({
    verdict: NoveltyClassification,
    what_is_novel: z.string().catch(''),
    what_is_not_novel: z.string().catch(''),
    key_prior_art: z
      .array(
        z.object({
          reference: z.string().catch(''),
          relevance: z.string().catch(''),
          impact: z.string().catch(''),
        }),
      )
      .default([]),
  }),

  moat_assessment: z.object({
    overall: z.object({
      strength: MoatStrength,
      durability_years: flexibleNumber(3),
      primary_source: z.string().catch(''),
    }),
    breakdown: z.object({
      technical: flexibleEnum(['STRONG', 'MODERATE', 'WEAK'], 'MODERATE'),
      execution: flexibleEnum(['STRONG', 'MODERATE', 'WEAK'], 'MODERATE'),
      market: flexibleEnum(['STRONG', 'MODERATE', 'WEAK'], 'MODERATE'),
    }),
    vulnerabilities: z
      .array(
        z.object({
          vulnerability: z.string().catch(''),
          severity: Severity,
        }),
      )
      .default([]),
  }),

  pre_mortem: z.object({
    framing: z.string().catch(''),
    most_likely_failure: z.object({
      scenario: z.string().catch(''),
      probability: z.string().default('Unknown'),
      early_warnings: z.array(z.string()).default([]),
      preventable_by: z.string().catch(''),
    }),
    second_most_likely: z.object({
      scenario: z.string().catch(''),
      probability: z.string().default('Unknown'),
    }),
    black_swan: z.object({
      scenario: z.string().catch(''),
      probability: z.string().default('<5%'),
    }),
  }),

  comparable_analysis: z.object({
    closest_comparables: z
      .array(
        z.object({
          company: z.string().catch(''),
          similarity: z.string().catch(''),
          outcome: z.string().default('Unknown'),
          lesson: z.string().catch(''),
        }),
      )
      .default([]),
    base_rate: z.object({
      category_success_rate: z.string().default('Unknown'),
      this_company_vs_base: z.string().catch(''),
    }),
  }),

  scenario_analysis: z.object({
    bull_case: z.object({
      probability: z.string().default('Unknown'),
      narrative: z.string().catch(''),
      return: z.string().default('Unknown'),
    }),
    base_case: z.object({
      probability: z.string().default('Unknown'),
      narrative: z.string().catch(''),
      return: z.string().default('Unknown'),
    }),
    bear_case: z.object({
      probability: z.string().default('Unknown'),
      narrative: z.string().catch(''),
      return: z.string().default('Unknown'),
    }),
    expected_value: z.object({
      weighted_multiple: z.string().default('Unknown'),
      assessment: z.string().catch(''),
    }),
  }),

  risk_analysis: z.object({
    technical_risks: z
      .array(
        z.object({
          risk: z.string().catch(''),
          probability: Confidence,
          impact: Severity,
          mitigation: z.string().catch(''),
        }),
      )
      .default([]),
    commercial_risks: z
      .array(
        z.object({
          risk: z.string().catch(''),
          severity: Severity,
        }),
      )
      .default([]),
    competitive_risks: z
      .array(
        z.object({
          risk: z.string().catch(''),
          timeline: z.string().default('Unknown'),
        }),
      )
      .default([]),
    key_risk_summary: z.string().catch(''),
  }),

  founder_questions: z.object({
    must_ask: z
      .array(
        z.object({
          question: z.string().catch(''),
          why_critical: z.string().catch(''),
          good_answer: z.string().catch(''),
          bad_answer: z.string().catch(''),
        }),
      )
      .default([]),
    technical_deep_dives: z
      .array(
        z.object({
          topic: z.string().catch(''),
          questions: z.array(z.string()).default([]),
        }),
      )
      .default([]),
    commercial_deep_dives: z
      .array(
        z.object({
          topic: z.string().catch(''),
          questions: z.array(z.string()).default([]),
        }),
      )
      .default([]),
  }),

  diligence_roadmap: z.object({
    before_term_sheet: z
      .array(
        z.object({
          action: z.string().catch(''),
          purpose: z.string().catch(''),
          who: z.string().catch(''),
          time: z.string().default('Unknown'),
          cost: z.string().default('Unknown'),
          deal_breaker_if: z.string().catch(''),
        }),
      )
      .default([]),
    during_diligence: z
      .array(
        z.object({
          action: z.string().catch(''),
          priority: ValidationPriority,
        }),
      )
      .default([]),
    reference_calls: z
      .array(
        z.object({
          who: z.string().catch(''),
          why: z.string().catch(''),
          key_questions: z.array(z.string()).default([]),
        }),
      )
      .default([]),
    technical_validation: z
      .array(
        z.object({
          what: z.string().catch(''),
          how: z.string().catch(''),
          who_can_help: z.string().catch(''),
          cost: z.string().default('Unknown'),
          time: z.string().default('Unknown'),
        }),
      )
      .default([]),
    documents_to_request: z.array(z.string()).default([]),
  }),

  why_this_might_be_wrong: z.object({
    if_we_are_too_negative: z.object({
      what_we_might_be_missing: z.string().catch(''),
      what_would_change_our_mind: z.string().catch(''),
    }),
    if_we_are_too_positive: z.object({
      what_we_might_be_missing: z.string().catch(''),
      what_would_change_our_mind: z.string().catch(''),
    }),
    strongest_counter_argument: z.string().catch(''),
    our_response: z.string().catch(''),
  }),

  confidence_calibration: z.object({
    high_confidence: z
      .array(
        z.object({
          assessment: z.string().catch(''),
          basis: z.string().catch(''),
          confidence: z.string().default('HIGH'),
        }),
      )
      .default([]),
    medium_confidence: z
      .array(
        z.object({
          assessment: z.string().catch(''),
          basis: z.string().catch(''),
          confidence: z.string().default('MEDIUM'),
        }),
      )
      .default([]),
    low_confidence: z
      .array(
        z.object({
          assessment: z.string().catch(''),
          basis: z.string().catch(''),
          confidence: z.string().default('LOW'),
        }),
      )
      .default([]),
    known_unknowns: z.array(z.string()).default([]),
    where_surprises_lurk: z.array(z.string()).default([]),
  }),

  verdict_and_recommendation: z.object({
    technical_verdict: z.object({
      verdict: DDVerdict,
      confidence: Confidence,
      summary: z.string().catch(''),
    }),
    commercial_verdict: z.object({
      verdict: flexibleEnum(
        ['CLEAR_PATH', 'CHALLENGING', 'UNLIKELY'],
        'CHALLENGING',
      ),
      summary: z.string().catch(''),
    }),
    overall_verdict: z.object({
      verdict: DDVerdict,
      confidence: Confidence,
    }),
    recommendation: z.object({
      action: RecommendedAction,
      conditions: z.array(z.string()).default([]),
      derisking_steps: z.array(z.string()).default([]),
      timeline: z.string().default('Unknown'),
    }),
    final_word: z.string().catch(''),
  }),
});

// ============================================
// NEW: Visual hierarchy table schemas for DD reports
// All have .catch() for antifragility - LLM output can vary
// ============================================

// Competitor/Prior Art table rows
export const CompetitorRowSchema = z.object({
  entity: z.string().catch(''),
  approach: z.string().catch(''),
  performance: z.string().optional(),
  limitation: z.string().optional(),
});

// Claim validation as table rows (inline verdicts)
export const ClaimValidationRowSchema = z.object({
  claim: z.string().catch(''),
  verdict: flexibleEnum(
    ['VALIDATED', 'PLAUSIBLE', 'QUESTIONABLE', 'IMPLAUSIBLE'],
    'PLAUSIBLE',
  ),
  confidence: z.string().optional(),
  reasoning: z.string().catch(''),
});

// Solution concepts list (not cards)
export const SolutionConceptRowSchema = z.object({
  title: z.string().catch(''),
  track: flexibleEnum(
    ['simpler_path', 'best_fit', 'paradigm_shift', 'frontier_transfer'],
    'best_fit',
  ),
  description: z.string().catch(''),
  who_pursuing: z.array(z.string()).optional().default([]),
  feasibility: flexibleNumber(5, { min: 1, max: 10 }).optional(),
  impact: flexibleNumber(5, { min: 1, max: 10 }).optional(),
  startup_approach: z.boolean().optional().default(false),
});

// Unit economics bridge table rows
export const EconomicsBridgeRowSchema = z.object({
  line_item: z.string().catch(''),
  current: z.string().optional(),
  target: z.string().optional(),
  gap: z.string().optional(),
  validity: flexibleEnum(
    ['VALIDATED', 'REASONABLE', 'OPTIMISTIC', 'UNREALISTIC'],
    'REASONABLE',
  ),
});

// Economics bridge container
export const EconomicsBridgeSchema = z
  .object({
    current_state: z.string().optional(),
    target_state: z.string().optional(),
    rows: z.array(EconomicsBridgeRowSchema).optional().default([]),
    realistic_estimate: z.string().optional(),
    verdict: z.string().optional(),
  })
  .catch({ rows: [] });

// Risk table rows (with category + severity)
export const RiskTableRowSchema = z.object({
  risk: z.string().catch(''),
  category: flexibleEnum(
    ['TECHNICAL', 'COMMERCIAL', 'REGULATORY', 'MARKET', 'EXECUTION'],
    'TECHNICAL',
  ),
  severity: Severity,
  mitigation: z.string().optional(),
});

// Validation gaps (self-critique)
export const ValidationGapRowSchema = z.object({
  concern: z.string().catch(''),
  status: flexibleEnum(
    ['ADDRESSED', 'NEEDS_VALIDATION', 'ACCEPTED_RISK'],
    'NEEDS_VALIDATION',
  ),
  rationale: z.string().optional(),
});

// Diligence action with cost/timeline
export const DiligenceActionSchema = z.object({
  action: z.string().catch(''),
  priority: flexibleEnum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], 'MEDIUM'),
  cost: z.string().optional(),
  timeline: z.string().optional(),
});

// ============================================
// NEW: Problem Breakdown Schemas (Deep Problem Analysis)
// Following hybrid report pattern for structured problem education
// ============================================

// Root cause hypothesis with confidence
export const RootCauseHypothesisSchema = z
  .object({
    name: z.string().catch(''),
    confidence_percent: flexibleNumber(50, { min: 0, max: 100 }),
    explanation: z.string().catch(''),
  })
  .catch({ name: '', confidence_percent: 50, explanation: '' });

// Governing equation for physics-based constraints
export const GoverningEquationSchema = z
  .object({
    equation: z.string().optional(),
    explanation: z.string().catch(''),
    why_it_matters: z.string().optional(),
  })
  .catch({ explanation: '' });

// Why it's hard - physics/engineering constraints
export const WhyItsHardSchema = z
  .object({
    prose: z.string().catch(''),
    factors: z.array(z.string()).optional().default([]),
    governing_equation: GoverningEquationSchema.optional(),
  })
  .catch({ prose: '', factors: [] });

// Current industry approach with limitations
export const IndustryApproachSchema = z
  .object({
    approach: z.string().catch(''),
    limitation: z.string().catch(''),
    who_does_it: z.array(z.string()).optional().default([]),
  })
  .catch({ approach: '', limitation: '', who_does_it: [] });

// Full problem breakdown container
export const ProblemBreakdownSchema = z
  .object({
    whats_wrong: z.string().optional(),
    why_its_hard: WhyItsHardSchema.optional(),
    what_industry_does_today: z
      .array(IndustryApproachSchema)
      .optional()
      .default([]),
    root_cause_hypotheses: z
      .array(RootCauseHypothesisSchema)
      .optional()
      .default([]),
  })
  .optional()
  .catch(undefined);

// ============================================
// NEW: Fully Developed Concept Schemas
// Deep concept analysis matching hybrid report depth
// ============================================

// The insight - where it came from and why it transfers
export const ConceptInsightSchema = z
  .object({
    what: z.string().catch(''),
    where_we_found_it: z
      .object({
        domain: z.string().catch(''),
        how_they_use_it: z.string().optional(),
        why_it_transfers: z.string().optional(),
      })
      .optional()
      .catch(undefined),
    why_industry_missed_it: z.string().optional(),
  })
  .catch({ what: '' });

// Economics brief for concept
export const ConceptEconomicsSchema = z
  .object({
    investment: z.string().optional(),
    expected_outcome: z.string().optional(),
    timeline: z.string().optional(),
  })
  .catch({});

// First validation step
export const ConceptValidationStepSchema = z
  .object({
    test: z.string().catch(''),
    cost: z.string().optional(),
    timeline: z.string().optional(),
    go_criteria: z.string().optional(),
    no_go_criteria: z.string().optional(),
  })
  .catch({ test: '' });

// Innovation type enum - simplified 3-tier system
// Old values (CATALOG, EMERGING_PRACTICE, etc.) map via ENUM_SYNONYMS
export const InnovationType = flexibleEnum(
  ['FRONTIER', 'EMERGING', 'ESTABLISHED'],
  'EMERGING',
);

// Failure type enum for historical precedents
export const FailureType = flexibleEnum(
  ['TECHNICAL', 'COMMERCIAL', 'MARKET', 'EXECUTION'],
  'EXECUTION',
);

// Fully developed concept (matching hybrid depth)
export const FullyDevelopedConceptSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().catch(''),
    track: Track,
    innovation_type: InnovationType.optional(),
    // Source domain for cross-domain transfers (e.g., "Semiconductor manufacturing")
    source_domain: z.string().optional().catch(undefined),

    // Full development (hybrid pattern)
    what_it_is: z.string().catch(''),
    the_insight: ConceptInsightSchema.optional(),
    why_it_works: z.string().optional(),
    economics: ConceptEconomicsSchema.optional(),
    key_risk: z.string().optional(),
    first_validation_step: ConceptValidationStepSchema.optional(),

    // DD-specific
    who_pursuing: z.array(z.string()).optional().default([]),
    startup_approach: z.boolean().optional().default(false),
    feasibility: flexibleNumber(5, { min: 1, max: 10 }).optional(),
    impact: flexibleNumber(5, { min: 1, max: 10 }).optional(),
  })
  .catch({
    title: '',
    track: 'best_fit',
    what_it_is: '',
    who_pursuing: [],
    startup_approach: false,
  });

// Cross-domain insight
export const CrossDomainInsightSchema = z
  .object({
    source_domain: z.string().catch(''),
    mechanism: z.string().catch(''),
    why_it_transfers: z.string().optional(),
    who_pursuing: z.array(z.string()).optional().default([]),
    validation_approach: z.string().optional(),
  })
  .catch({ source_domain: '', mechanism: '', who_pursuing: [] });

// ============================================
// NEW: Commercialization Detail Schema
// ============================================

export const CommercializationDetailSchema = z
  .object({
    unit_economics_current: z.string().catch(''),
    unit_economics_target: z.string().catch(''),
    path_to_economics: z.string().catch(''),
    key_assumptions: z.array(z.string()).default([]).catch([]),
    go_to_market_path: z.string().catch(''),
    customer_segments: z.array(z.string()).default([]).catch([]),
    sales_complexity: z.string().catch(''),
    commercialization_obstacles: z.array(z.string()).default([]).catch([]),
    revenue_timeline: z.string().catch(''),
  })
  .optional()
  .catch(undefined);

// ============================================
// NEW: Failure Analysis Schemas
// ============================================

export const HistoricalPrecedentSchema = z
  .object({
    company: z.string().catch(''),
    what_happened: z.string().catch(''),
    failure_type: FailureType,
    lessons: z.string().catch(''),
  })
  .catch({
    company: '',
    what_happened: '',
    failure_type: 'EXECUTION',
    lessons: '',
  });

export const FailureAnalysisSchema = z
  .object({
    pre_mortem: z.string().catch(''),
    historical_precedents: z
      .array(HistoricalPrecedentSchema)
      .default([])
      .catch([]),
    how_startup_differs: z.string().catch(''),
  })
  .optional()
  .catch(undefined);

// New format prose report schema for DD5-M
// ANTIFRAGILE: All fields have sensible defaults
const DD5_M_ProseReportSchema = z.object({
  problem_primer: z.object({
    content: z.string().catch(''),
    source: z.string().catch(''),
  }),
  technical_deep_dive: z.object({
    content: z.string().catch(''),
    source: z.string().catch(''),
  }),
  solution_landscape: z.object({
    content: z.string().catch(''),
    source: z.string().catch(''),
  }),
  commercialization_reality: z.object({
    content: z.string().catch(''),
    source: z.string().catch(''),
  }),
  investment_synthesis: z.object({
    content: z.string().catch(''),
    source: z.string().catch(''),
  }),
});

// New format quick reference schema for DD5-M
// ANTIFRAGILE: All fields have sensible defaults
const DD5_M_QuickReferenceSchema = z.object({
  one_page_summary: z.object({
    company: z.string().default('Unknown Company'),
    sector: z.string().default('Technology'),
    stage: z.string().default('Seed'),
    ask: z.string().default('Unknown'),
    one_sentence: z.string().catch(''),
    verdict_box: z.object({
      technical_validity: z.object({
        verdict: MechanismVerdict,
        symbol: z.string().default('⚠️'),
      }),
      commercial_viability: z.object({
        verdict: flexibleEnum(
          ['CLEAR_PATH', 'CHALLENGING', 'UNLIKELY'],
          'CHALLENGING',
        ),
        symbol: z.string().default('⚠️'),
      }),
      solution_space_position: z.object({
        verdict: flexibleEnum(
          ['OPTIMAL', 'REASONABLE', 'SUBOPTIMAL'],
          'REASONABLE',
        ),
        symbol: z.string().default('⚠️'),
      }),
      moat_strength: z.object({
        verdict: MoatStrength,
        symbol: z.string().default('⚠️'),
      }),
      timing: z.object({
        verdict: flexibleEnum(['RIGHT_TIME', 'EARLY', 'LATE'], 'EARLY'),
        symbol: z.string().default('⚠️'),
      }),
      overall: OverallVerdict,
    }),
    the_bet: z.string().catch(''),
    bull_case_2_sentences: z.string().catch(''),
    bear_case_2_sentences: z.string().catch(''),
    key_strength: z.string().catch(''),
    key_risk: z.string().catch(''),
    key_question: z.string().catch(''),
    expected_return: z.string().default('Unknown'),
    closest_comparable: z.string().default('None identified'),
    if_you_do_one_thing: z.string().catch(''),
    executive_paragraph: z.string().catch(''),
  }),
  scores: z.object({
    technical_credibility: z.object({
      score: flexibleNumber(5),
      out_of: flexibleNumber(10),
      one_liner: z.string().catch(''),
    }),
    commercial_viability: z.object({
      score: flexibleNumber(5),
      out_of: flexibleNumber(10),
      one_liner: z.string().catch(''),
    }),
    moat_strength: z.object({
      score: flexibleNumber(5),
      out_of: flexibleNumber(10),
      one_liner: z.string().catch(''),
    }),
  }),
  scenarios: z.object({
    bull_case: z.object({
      probability: z.string().default('Unknown'),
      narrative: z.string().catch(''),
      return: z.string().default('Unknown'),
    }),
    base_case: z.object({
      probability: z.string().default('Unknown'),
      narrative: z.string().catch(''),
      return: z.string().default('Unknown'),
    }),
    bear_case: z.object({
      probability: z.string().default('Unknown'),
      narrative: z.string().catch(''),
      return: z.string().default('Unknown'),
    }),
    expected_value: z.object({
      weighted_multiple: z.string().default('Unknown'),
      assessment: z.string().catch(''),
    }),
  }),
  key_risks: z
    .array(
      z.object({
        risk: z.string().catch(''),
        severity: Severity,
        mitigation: z.string().catch(''),
      }),
    )
    .default([]),
  founder_questions: z
    .array(
      z.object({
        question: z.string().catch(''),
        why_critical: z.string().catch(''),
        good_answer: z.string().catch(''),
        bad_answer: z.string().catch(''),
      }),
    )
    .default([]),
  diligence_roadmap: z
    .array(
      z.object({
        action: z.string().catch(''),
        purpose: z.string().catch(''),
        priority: ValidationPriority,
      }),
    )
    .default([]),

  // NEW: Tables for visual hierarchy (all optional with defaults)
  competitor_landscape: z.array(CompetitorRowSchema).optional().default([]),
  claim_validation_table: z
    .array(ClaimValidationRowSchema)
    .optional()
    .default([]),
  solution_concepts: z.array(SolutionConceptRowSchema).optional().default([]),
  economics_bridge: EconomicsBridgeSchema.optional(),
  risks_table: z.array(RiskTableRowSchema).optional().default([]),
  validation_gaps: z.array(ValidationGapRowSchema).optional().default([]),
  diligence_actions: z.array(DiligenceActionSchema).optional().default([]),

  // NEW: Key insight highlights (for blockquotes)
  first_principles_insight: z.string().optional(),
  the_bet_statement: z.string().optional(),

  // NEW: Personal recommendation (first person) - backwards compat
  if_this_were_my_deal: z.string().optional(),

  // NEW: Problem reframe - the "aha" insight that changes thinking
  problem_reframe: z.string().optional().catch(undefined),

  // NEW: Synthesis & Recommendation (renamed from if_this_were_my_deal)
  synthesis_recommendation: z.string().optional().catch(undefined),

  // NEW: Problem breakdown (structured from AN0-M) - deep problem education
  problem_breakdown: ProblemBreakdownSchema,

  // NEW: Fully developed concepts (not summaries) - deep solution education
  developed_concepts: z
    .array(FullyDevelopedConceptSchema)
    .optional()
    .default([]),

  // NEW: Cross-domain insights (explicit cross-domain innovations)
  // Note: Cross-domain solutions now integrated into developed_concepts with source_domain
  cross_domain_insights: z
    .array(CrossDomainInsightSchema)
    .optional()
    .default([]),

  // NEW: Expanded commercialization detail
  commercialization_detail: CommercializationDetailSchema,

  // NEW: Failure analysis with historical precedents
  failure_analysis: FailureAnalysisSchema,
});

// Reference/citation schema for appendix
export const ReferenceSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform((v) => String(v)),
    citation: z.string().catch(''),
    url: z.string().optional().catch(undefined),
    source_type: z.string().optional().catch(undefined),
  })
  .catch({ id: '0', citation: '' });

// New format appendix schema for DD5-M (flexible - many fields optional)
const DD5_M_AppendixSchema = z
  .object({
    // References/citations used throughout the report
    references: z.array(ReferenceSchema).optional().default([]).catch([]),
    detailed_claim_validation: z
      .array(
        z.object({
          claim: z.string(),
          verdict: z.string(),
          confidence: z.string(),
          plain_english: z.string(),
          full_reasoning: z.string(),
        }),
      )
      .optional(),
    detailed_solution_space: z
      .object({
        simpler_path: z.array(z.unknown()),
        best_fit: z.array(z.unknown()),
        paradigm_shift: z.array(z.unknown()),
        frontier_transfer: z.array(z.unknown()),
      })
      .optional(),
    detailed_commercial_analysis: z.unknown().optional(),
    comparable_details: z.array(z.unknown()).optional(),
    all_founder_questions: z.unknown().optional(),
    full_diligence_roadmap: z.unknown().optional(),
  })
  .passthrough(); // Allow additional fields

// New format schema for DD5-M
// ANTIFRAGILE: report_metadata has defaults
const DD5_M_NewFormatSchema = z.object({
  report_metadata: z.object({
    company_name: z.string().default('Unknown Company'),
    date: z.string().catch(''),
    version: z.string().default('1.0'),
  }),
  prose_report: DD5_M_ProseReportSchema,
  quick_reference: DD5_M_QuickReferenceSchema,
  appendix: DD5_M_AppendixSchema.optional(),
});

/**
 * DD5-M Output Schema - Antifragile
 *
 * Accepts BOTH old format (comprehensive flat structure) AND new format (prose_report + quick_reference + appendix).
 * Uses transform to normalize and pass through.
 */
export const DD5_M_OutputSchema = z
  .unknown()
  .transform(
    (
      val,
    ):
      | z.infer<typeof DD5_M_OldFormatSchema>
      | z.infer<typeof DD5_M_NewFormatSchema> => {
      if (!val || typeof val !== 'object') {
        throw new Error('DD5-M output must be an object');
      }

      const input = val as Record<string, unknown>;

      // Check if new format (has prose_report and quick_reference)
      if (input.prose_report && input.quick_reference) {
        const newFormatResult = DD5_M_NewFormatSchema.safeParse(val);
        if (newFormatResult.success) {
          return newFormatResult.data;
        }
        // Fall through to try old format
      }

      // Try old format
      const oldFormatResult = DD5_M_OldFormatSchema.safeParse(val);
      if (oldFormatResult.success) {
        return oldFormatResult.data;
      }

      // If both fail, throw the old format error
      throw oldFormatResult.error;
    },
  );

export type DD5_M_Output =
  | z.infer<typeof DD5_M_OldFormatSchema>
  | z.infer<typeof DD5_M_NewFormatSchema>;
