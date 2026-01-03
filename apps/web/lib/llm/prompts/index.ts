/**
 * LLM Prompts Index
 *
 * Export all prompts and their schemas for the AN0-AN5 chain.
 */

export {
  AN0_PROMPT,
  AN0_METADATA,
  AN0OutputSchema,
  type AN0Output,
} from './an0-problem-framing';

export {
  AN1_5_PROMPT,
  AN1_5_METADATA,
  AN1_5_OutputSchema,
  type AN1_5_Output,
} from './an1.5-reranker';

export {
  AN1_7_PROMPT,
  AN1_7_METADATA,
  AN1_7_OutputSchema,
  type AN1_7_Output,
} from './an1.7-literature';

export {
  AN2_PROMPT,
  AN2_METADATA,
  AN2OutputSchema,
  type AN2Output,
} from './an2-innovation-briefing';

export {
  AN3_PROMPT,
  AN3_METADATA,
  AN3OutputSchema,
  type AN3Output,
  type Concept,
} from './an3-concept-generation';

export {
  AN4_PROMPT,
  AN4_METADATA,
  AN4OutputSchema,
  type AN4Output,
  type ValidationResult,
} from './an4-evaluation';

export {
  AN5_PROMPT,
  AN5_METADATA,
  AN5OutputSchema,
  type AN5Output,
  type LeadConcept,
  type OtherConcept,
  type InnovationConcept,
  type TestGate,
} from './an5-report';

/**
 * Phase metadata for progress tracking (v10)
 *
 * Updated for v10 architecture:
 * - AN1: 4-namespace corpus retrieval (failures, bounds, transfers, triz)
 * - AN1.5: Teaching Example Selection (not re-ranking)
 * - AN2: Innovation Methodology Briefing (teaches HOW TO THINK)
 * - AN3: First principles emphasis, three tracks
 * - AN4: Hard validation gates
 */
export const PHASES = [
  {
    id: 'an0',
    name: 'Problem Framing',
    description:
      'Understanding your challenge, physics, and first principles decomposition',
    estimatedMinutes: 1.5,
  },
  {
    id: 'an1',
    name: 'Corpus Retrieval',
    description:
      'Searching 4 namespaces: failures, bounds, transfers, TRIZ examples',
    estimatedMinutes: 0.5,
  },
  {
    id: 'an1.5',
    name: 'Teaching Selection',
    description: 'Selecting exemplars to guide innovative thinking',
    estimatedMinutes: 1.5,
  },
  {
    id: 'an1.7',
    name: 'Literature Augmentation',
    description: 'Validating with commercial precedent and parameters',
    estimatedMinutes: 2,
  },
  {
    id: 'an2',
    name: 'Innovation Briefing',
    description: 'Preparing methodology guidance for concept generation',
    estimatedMinutes: 2,
  },
  {
    id: 'an3',
    name: 'Concept Generation',
    description: 'Creating novel solutions from first principles',
    estimatedMinutes: 3,
  },
  {
    id: 'an4',
    name: 'Evaluation & Validation',
    description: 'Validating concepts against hard constraints and ranking',
    estimatedMinutes: 2,
  },
  {
    id: 'an5',
    name: 'Executive Report',
    description: 'Synthesizing findings into a comprehensive analysis report',
    estimatedMinutes: 2,
  },
] as const;

export type PhaseId = (typeof PHASES)[number]['id'];

/**
 * DD Mode exports
 *
 * Due Diligence mode for evaluating startup technical claims.
 */
export * from './dd';
