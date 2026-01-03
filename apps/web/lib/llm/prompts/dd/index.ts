/**
 * Due Diligence Mode LLM Prompts Index
 *
 * DD Mode applies the full Sparlo engine to evaluate startup technical claims.
 *
 * Chain structure:
 * DD0   → Extract claims + stated problem from startup materials
 * AN0-M → First principles problem framing (existing)
 * AN1.5 → Teaching selection (existing)
 * AN1.7 → Literature search / prior art (existing)
 * AN2-M → TRIZ methodology briefing (existing)
 * AN3-M → Generate full solution space (existing)
 * DD3   → Validate startup claims against physics + TRIZ
 * DD4   → Map approach onto solution space + moat assessment
 * DD5   → Format as Due Diligence Report
 *
 * Philosophy: First-principles analysis reveals what the solution landscape
 * SHOULD look like. Then we validate whether the startup's approach is optimal.
 */

// Re-export all schemas
export {
  // Enums
  ClaimType,
  EvidenceLevel,
  Verifiability,
  ValidationPriority,
  Severity,
  Stage,
  Verdict,
  MechanismVerdict,
  Confidence,
  NoveltyClassification,
  MoatStrength,
  Track,
  DDVerdict,
  RecommendedAction,
  FindingType,
  // Schema exports
  DD0_M_OutputSchema,
  DD3_M_OutputSchema,
  DD4_M_OutputSchema,
  DD5_M_OutputSchema,
  // Type exports
  type DD0_M_Output,
  type DD3_M_Output,
  type DD4_M_Output,
  type DD5_M_Output,
} from './schemas';

// Re-export all prompts
export {
  DD0_M_PROMPT,
  DD0_M_METADATA,
  DD3_M_PROMPT,
  DD3_M_METADATA,
  DD4_M_PROMPT,
  DD4_M_METADATA,
  DD5_M_PROMPT,
  DD5_M_METADATA,
  DD_PROMPTS,
} from './prompts';

/**
 * DD Mode max tokens - set to Claude's maximum to prevent truncation
 */
export const DD_MAX_TOKENS = 32000;

/**
 * DD Mode model - use Opus for judgment-heavy stages
 */
export const DD_MODEL = 'claude-opus-4-5-20251101';

/**
 * DD Mode temperatures by stage type
 */
export const DD_TEMPERATURES = {
  extraction: 0.5, // DD0 - factual extraction
  validation: 0.5, // DD3 - physics validation
  mapping: 0.6, // DD4 - solution mapping
  report: 0.6, // DD5 - report generation
} as const;

/**
 * DD Mode Phase metadata for progress tracking
 *
 * The DD chain wraps around existing AN chain:
 * - DD0-M: Claim extraction from startup materials
 * - AN0-M through AN3-M: Existing Sparlo analysis (reused)
 * - DD3-M: Claim validation against physics/TRIZ
 * - DD4-M: Solution space mapping and moat assessment
 * - DD5-M: DD report generation
 */
export const DD_PHASES = [
  {
    id: 'dd0-m',
    name: 'Claim Extraction',
    description:
      'Extracting claims and problem statement from startup materials',
    estimatedMinutes: 3,
  },
  {
    id: 'an0-m',
    name: 'Problem Framing',
    description: 'First-principles problem framing',
    estimatedMinutes: 2,
  },
  {
    id: 'an1.5-m',
    name: 'Teaching Selection',
    description: 'Selecting exemplars to guide analysis',
    estimatedMinutes: 2,
  },
  {
    id: 'an1.7-m',
    name: 'Literature Search',
    description: 'Finding prior art and precedent',
    estimatedMinutes: 3,
  },
  {
    id: 'an2-m',
    name: 'Methodology Briefing',
    description: 'TRIZ analysis and methodology guidance',
    estimatedMinutes: 2,
  },
  {
    id: 'an3-m',
    name: 'Solution Space',
    description: 'Generating full solution landscape',
    estimatedMinutes: 4,
  },
  {
    id: 'dd3-m',
    name: 'Claim Validation',
    description: 'Validating claims against physics and TRIZ',
    estimatedMinutes: 4,
  },
  {
    id: 'dd4-m',
    name: 'Moat Assessment',
    description: 'Mapping approach and assessing defensibility',
    estimatedMinutes: 3,
  },
  {
    id: 'dd5-m',
    name: 'DD Report',
    description: 'Generating investor-facing due diligence report',
    estimatedMinutes: 4,
  },
] as const;

export type DDPhaseId = (typeof DD_PHASES)[number]['id'];

/**
 * Context requirements for each DD step
 *
 * This tells the chain runner what previous outputs each step needs
 */
export const DD_CONTEXT_REQUIREMENTS = {
  'dd0-m': {
    requires: ['startup_materials'],
    produces: ['claim_extraction', 'problem_statement_for_analysis'],
  },
  'an0-m': {
    requires: ['problem_statement_for_analysis'],
    produces: ['problem_framing'],
  },
  'an1.5-m': {
    requires: ['problem_framing'],
    produces: ['teaching_examples'],
  },
  'an1.7-m': {
    requires: ['problem_framing', 'teaching_examples'],
    produces: ['literature_search'],
  },
  'an2-m': {
    requires: ['problem_framing'],
    produces: ['triz_analysis'],
  },
  'an3-m': {
    requires: [
      'problem_framing',
      'teaching_examples',
      'literature_search',
      'triz_analysis',
    ],
    produces: ['solution_space'],
  },
  'dd3-m': {
    requires: [
      'claim_extraction',
      'problem_framing',
      'teaching_examples',
      'literature_search',
      'triz_analysis',
    ],
    produces: ['claim_validation'],
  },
  'dd4-m': {
    requires: [
      'claim_extraction',
      'solution_space',
      'claim_validation',
      'literature_search',
    ],
    produces: ['solution_mapping', 'moat_assessment'],
  },
  'dd5-m': {
    requires: [
      'claim_extraction',
      'problem_framing',
      'solution_space',
      'claim_validation',
      'solution_mapping',
      'moat_assessment',
    ],
    produces: ['dd_report'],
  },
} as const;

/**
 * DD chain metadata
 */
export const DD_CHAIN_METADATA = {
  version: '1.0.0',
  name: 'Due Diligence Chain',
  description:
    'Technical due diligence for deep tech startups using first-principles analysis',
  philosophy:
    'Map the full solution space, then validate where the startup sits within it.',

  get stages() {
    return DD_PHASES.map(({ id, name }) => ({ id, name }));
  },

  get estimatedTotalMinutes() {
    return DD_PHASES.reduce((sum, phase) => sum + phase.estimatedMinutes, 0);
  },

  estimatedCost: '$6-10',

  tracks: {
    simpler_path: 'Lower risk alternatives that might be "good enough"',
    best_fit: 'Optimal approaches for the stated problem',
    paradigm_shift: 'Approaches that challenge industry assumptions',
    frontier_transfer: 'Cross-domain innovations with higher risk/reward',
  },

  verdicts: {
    COMPELLING:
      'Technical thesis sound, approach optimal, defensible moat, limited risk',
    PROMISING:
      'Technical thesis plausible, approach reasonable, some moat, manageable risks',
    MIXED:
      'Some strong elements, some concerns. Need to weigh risks vs opportunity',
    CONCERNING:
      'Significant issues: flawed thesis, questionable physics, weak moat, or major risks',
    PASS: 'Technical thesis fails, suboptimal approach, no moat, or critical risks',
  },

  guarantees: [
    'First-principles problem framing independent of startup pitch',
    'Full solution space generated before evaluating startup approach',
    'Physics validation for all performance claims',
    'TRIZ contradiction analysis',
    'Prior art search and novelty assessment',
    'Competitive threat identification from solution space',
    'Moat assessment with durability estimate',
    'Specific questions for founder follow-up',
    'Calibrated verdicts with confidence levels',
  ],
};
