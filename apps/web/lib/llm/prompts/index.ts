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
  type Evaluation,
} from './an4-evaluation';

/**
 * Phase metadata for progress tracking
 */
export const PHASES = [
  {
    id: 'an0',
    name: 'Problem Framing',
    description:
      'Understanding your challenge and extracting core contradictions',
    estimatedMinutes: 1.5,
  },
  {
    id: 'an1',
    name: 'Corpus Retrieval',
    description: 'Searching knowledge base for relevant mechanisms and patents',
    estimatedMinutes: 0.5,
  },
  {
    id: 'an1.5',
    name: 'Result Re-ranking',
    description: 'Re-ranking retrieval results for actual relevance',
    estimatedMinutes: 1.5,
  },
  {
    id: 'an1.7',
    name: 'Literature Augmentation',
    description: 'Filling corpus gaps with verified literature',
    estimatedMinutes: 2,
  },
  {
    id: 'an2',
    name: 'Pattern Synthesis',
    description: 'Identifying cross-domain mechanisms and innovation patterns',
    estimatedMinutes: 2,
  },
  {
    id: 'an3',
    name: 'Concept Generation',
    description: 'Creating 8-12 solution concepts from multiple paradigms',
    estimatedMinutes: 3,
  },
  {
    id: 'an4',
    name: 'Evaluation & Ranking',
    description: 'Scoring concepts against your constraints and KPIs',
    estimatedMinutes: 2,
  },
  {
    id: 'an5',
    name: 'Report Writing',
    description: 'Compiling findings into a comprehensive analysis report',
    estimatedMinutes: 2,
  },
] as const;

export type PhaseId = (typeof PHASES)[number]['id'];
