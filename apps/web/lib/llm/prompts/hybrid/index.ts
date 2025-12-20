/**
 * Hybrid Mode LLM Prompts Index
 *
 * Export all hybrid prompts and their schemas for the AN0-M to AN5-M chain.
 *
 * Hybrid Mode (Full-Spectrum Analysis):
 * - SEARCHES the full solution spectrum (simple to paradigm-shifting)
 * - EVALUATES on MERIT, not novelty
 * - HUNTS in expanded territories (biology, geology, abandoned tech, etc.)
 * - DOCUMENTS prior art evidence
 * - INCLUDES honest self-critique
 * - SURFACES paradigm insights prominently even when simpler paths win
 *
 * Philosophy: The best solution wins regardless of origin.
 *
 * Solution Tracks:
 * - simpler_path: Lower risk, faster to implement. NOT consolation prizes.
 * - best_fit: Highest probability of meeting requirements. Merit-based.
 * - paradigm_shift: What if the industry approach is fundamentally wrong?
 * - frontier_transfer: Higher risk, higher ceiling. Cross-domain innovation.
 */

// Re-export all schemas
export {
  AN0_M_OutputSchema,
  AN1_5_M_OutputSchema,
  AN1_7_M_OutputSchema,
  AN2_M_OutputSchema,
  AN3_M_OutputSchema,
  AN4_M_OutputSchema,
  AN5_M_OutputSchema,
  type AN0_M_Output,
  type AN1_5_M_Output,
  type AN1_7_M_Output,
  type AN2_M_Output,
  type AN3_M_Output,
  type AN4_M_Output,
  type AN5_M_Output,
  type HybridConcept,
  type HybridValidationResult,
  type HybridLeadConcept,
  type HybridOtherConcept,
  type HybridParallelExploration,
  type HybridSparkConcept,
  // Shared primitives
  ConfidenceLevel,
  SeverityLevel,
  CapitalRequirement,
  ViabilityVerdict,
  TrackSchema,
  SafeUrlSchema,
} from './schemas';

// Re-export all prompts
export {
  AN0_M_PROMPT,
  AN0_M_METADATA,
  AN1_5_M_PROMPT,
  AN1_5_M_METADATA,
  AN1_7_M_PROMPT,
  AN1_7_M_METADATA,
  AN2_M_PROMPT,
  AN2_M_METADATA,
  AN3_M_PROMPT,
  AN3_M_METADATA,
  AN4_M_PROMPT,
  AN4_M_METADATA,
  AN5_M_PROMPT,
  AN5_M_METADATA,
} from './prompts';

/**
 * Simple constants - no per-phase maps needed when all values are identical
 */
export const HYBRID_MAX_TOKENS = 20000;
export const HYBRID_MODEL = 'claude-opus-4-5-20251101';

export const HYBRID_TEMPERATURES = {
  default: 0.7,
  creative: 0.9, // AN3-M only
  analytical: 0.5, // AN4-M only
  report: 0.6, // AN5-M
} as const;

/**
 * Hybrid Mode Phase metadata for progress tracking
 *
 * Hybrid chain (Full-Spectrum):
 * - AN0-M: Problem framing with landscape mapping
 * - AN1-M: Corpus retrieval (all domains) [code-only, no prompt]
 * - AN1.5-M: Teaching example selection
 * - AN1.7-M: Literature search for precedent AND gaps
 * - AN2-M: Full-spectrum methodology briefing
 * - AN3-M: Concept generation across all 4 tracks
 * - AN4-M: Merit-based evaluation with paradigm significance
 * - AN5-M: Executive report with decision architecture
 */
export const HYBRID_PHASES = [
  {
    id: 'an0-m',
    name: 'Problem Framing',
    description:
      'Understanding challenge, mapping landscape, seeding discovery',
    estimatedMinutes: 2,
  },
  {
    id: 'an1-m',
    name: 'Corpus Retrieval',
    description: 'Searching all domains for relevant mechanisms',
    estimatedMinutes: 0.5,
  },
  {
    id: 'an1.5-m',
    name: 'Teaching Selection',
    description: 'Selecting exemplars from all domains to guide thinking',
    estimatedMinutes: 2,
  },
  {
    id: 'an1.7-m',
    name: 'Literature Search',
    description:
      'Finding precedent, gaps, and abandoned technologies in literature',
    estimatedMinutes: 3,
  },
  {
    id: 'an2-m',
    name: 'Methodology Briefing',
    description: 'Preparing full-spectrum concept generation guidance',
    estimatedMinutes: 2,
  },
  {
    id: 'an3-m',
    name: 'Concept Generation',
    description:
      'Generating solutions across the full spectrum with mechanism depth',
    estimatedMinutes: 4,
  },
  {
    id: 'an4-m',
    name: 'Evaluation',
    description: 'Merit-based validation with paradigm significance assessment',
    estimatedMinutes: 3,
  },
  {
    id: 'an5-m',
    name: 'Executive Report',
    description:
      'Full-spectrum report with parallel explorations and paradigm insights',
    estimatedMinutes: 4,
  },
] as const;

export type HybridPhaseId = (typeof HYBRID_PHASES)[number]['id'];

/**
 * Solution tracks for the hybrid approach
 */
export const HYBRID_SOLUTION_TRACKS = [
  'simpler_path',
  'best_fit',
  'paradigm_shift',
  'frontier_transfer',
] as const;

export type HybridSolutionTrack = (typeof HYBRID_SOLUTION_TRACKS)[number];

/**
 * Hybrid chain metadata (v2.0.0)
 *
 * Note: `stages` is derived from HYBRID_PHASES to maintain single source of truth
 */
export const HYBRID_CHAIN_METADATA = {
  version: '2.0.0',
  name: 'Hybrid Innovation Chain',
  description: 'Full-spectrum solution search with paradigm insight surfacing',
  philosophy:
    'The best solution wins regardless of origin. Paradigm insights are surfaced prominently even when simpler paths win on merit.',

  // Derived from HYBRID_PHASES - single source of truth
  get stages() {
    return HYBRID_PHASES.map(({ id, name }) => ({ id, name }));
  },

  get estimatedTotalMinutes() {
    return HYBRID_PHASES.reduce(
      (sum, phase) => sum + phase.estimatedMinutes,
      0,
    );
  },

  estimatedCost: '$4-6',

  tracks: {
    simpler_path: 'Lower risk, faster to implement. NOT consolation prizes.',
    best_fit: 'Highest probability of meeting requirements. Merit-based.',
    paradigm_shift: 'What if the industry approach is fundamentally wrong?',
    frontier_transfer: 'Higher risk, higher ceiling. Cross-domain innovation.',
  },

  guarantees: [
    'At least 1 concept from each track',
    'At least 1 concept from first principles',
    'At least 1 concept challenging industry assumption',
    'At least 1 concept from unexpected domain',
    'Self-critique section in every report',
    'Prior art documented for every concept',
    'Decision architecture with primary + fallback + parallel',
    'Paradigm insights surfaced prominently when found',
    'Abandoned technology revival scan in every report',
    'Strategic implications with near/medium/long-term framing',
    'Personal recommendation with day-by-day action plan',
    'Parallel explorations with full detail (not footnotes)',
  ],
};
