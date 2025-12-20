/**
 * Discovery Mode LLM Prompts Index
 *
 * Export all discovery prompts and their schemas for the AN0-D to AN5-D chain.
 *
 * Discovery Mode:
 * - EXCLUDES what industry is already doing
 * - HUNTS in non-obvious domains (biology, geology, abandoned approaches, frontier materials)
 * - VALIDATES physics feasibility while prioritizing novelty
 * - PRODUCES a report focused on "what has everyone missed?"
 */

export {
  AN0_D_PROMPT,
  AN0_D_METADATA,
  AN0DOutputSchema,
  GPU_THERMAL_EXCLUSIONS,
  GPU_THERMAL_DISCOVERY_TERRITORIES,
  type AN0DOutput,
  type AN0DAnalysis,
  type AN0DClarification,
} from './an0-d-problem-framing';

export {
  AN1_5_D_PROMPT,
  AN1_5_D_METADATA,
  AN1_5_D_OutputSchema,
  type AN1_5_D_Output,
} from './an1.5-d-teaching-examples';

export {
  AN1_7_D_PROMPT,
  AN1_7_D_METADATA,
  AN1_7_D_OutputSchema,
  type AN1_7_D_Output,
} from './an1.7-d-literature-gaps';

export {
  AN2_D_PROMPT,
  AN2_D_METADATA,
  AN2_D_OutputSchema,
  type AN2_D_Output,
} from './an2-d-methodology-briefing';

export {
  AN3_D_PROMPT,
  AN3_D_METADATA,
  AN3_D_OutputSchema,
  type AN3_D_Output,
  type DiscoveryConcept,
} from './an3-d-concept-generation';

export {
  AN4_D_PROMPT,
  AN4_D_METADATA,
  AN4_D_OutputSchema,
  type AN4_D_Output,
} from './an4-d-evaluation';

export {
  AN5_D_PROMPT,
  AN5_D_METADATA,
  AN5_D_OutputSchema,
  type AN5_D_Output,
  type DiscoveryReport,
} from './an5-d-report';

/**
 * Discovery Mode Phase metadata for progress tracking
 *
 * Discovery chain:
 * - AN0-D: Problem framing with industry exclusion
 * - AN1-D: Corpus retrieval (non-obvious domains) [code-only, no prompt]
 * - AN1.5-D: Teaching example selection (from non-obvious sources)
 * - AN1.7-D: Literature search for GAPS
 * - AN2-D: Discovery methodology briefing
 * - AN3-D: Novel concept generation
 * - AN4-D: Novelty-first evaluation
 * - AN5-D: Discovery report
 */
export const DISCOVERY_PHASES = [
  {
    id: 'an0-d',
    name: 'Discovery Problem Framing',
    description: 'Framing problem for non-obvious solution hunting',
    estimatedMinutes: 2,
  },
  {
    id: 'an1-d',
    name: 'Discovery Corpus Retrieval',
    description: 'Searching non-obvious domains for transferable mechanisms',
    estimatedMinutes: 0.5,
  },
  {
    id: 'an1.5-d',
    name: 'Discovery Teaching Selection',
    description: 'Selecting exemplars from biology, geology, abandoned tech',
    estimatedMinutes: 2,
  },
  {
    id: 'an1.7-d',
    name: 'Discovery Literature Gaps',
    description: 'Hunting for overlooked approaches in literature',
    estimatedMinutes: 3,
  },
  {
    id: 'an2-d',
    name: 'Discovery Methodology Briefing',
    description: 'Preparing novelty-first concept generation guidance',
    estimatedMinutes: 2,
  },
  {
    id: 'an3-d',
    name: 'Discovery Concept Generation',
    description: 'Generating novel concepts from non-obvious domains',
    estimatedMinutes: 4,
  },
  {
    id: 'an4-d',
    name: 'Discovery Evaluation',
    description: 'Novelty-first evaluation of discovery concepts',
    estimatedMinutes: 3,
  },
  {
    id: 'an5-d',
    name: 'Discovery Report',
    description: 'Generating discovery-focused innovation report',
    estimatedMinutes: 3,
  },
] as const;

export type DiscoveryPhaseId = (typeof DISCOVERY_PHASES)[number]['id'];

/**
 * Discovery chain configuration
 */
export const DISCOVERY_CHAIN_CONFIG = {
  model: 'claude-opus-4-5-20251101',
  maxTokensByPhase: {
    'an0-d': 20000,
    'an1.5-d': 20000,
    'an1.7-d': 20000,
    'an2-d': 20000,
    'an3-d': 20000,
    'an4-d': 20000,
    'an5-d': 20000,
  },
  temperatureByPhase: {
    'an0-d': 0.7,
    'an1.5-d': 0.7,
    'an1.7-d': 0.7,
    'an2-d': 0.6,
    'an3-d': 0.9, // Higher temperature for creative concept generation
    'an4-d': 0.5,
    'an5-d': 0.6,
  },
};
