import { z } from 'zod';

/**
 * Chain State Schema
 *
 * Full type-safe schema for the LLM chain state.
 * This tracks all outputs from AN0 through AN5.
 * (Kieran's fix: every field explicitly typed)
 */

// AN0 - Problem Framing outputs
const PhysicsOfProblemSchema = z.object({
  governingEquations: z.array(z.string()).default([]),
  keyVariables: z.array(z.string()).default([]),
  boundaryConditions: z.array(z.string()).default([]),
});

const FirstPrinciplesSchema = z.object({
  fundamentalConstraints: z.array(z.string()).default([]),
  physicalLimits: z.array(z.string()).default([]),
  tradeoffs: z.array(z.string()).default([]),
});

const ContradictionSchema = z.object({
  improvingParameter: z.string().optional(),
  worseningParameter: z.string().optional(),
  description: z.string().optional(),
});

const CorpusQueriesSchema = z.object({
  failureQueries: z.array(z.string()).default([]),
  feasibilityQueries: z.array(z.string()).default([]),
  transferQueries: z.array(z.string()).default([]),
});

// AN1 - Corpus Retrieval outputs
const CorpusItemSchema = z.object({
  id: z.string(),
  relevance_score: z.number(),
  title: z.string(),
  text_preview: z.string(),
  matched_query: z.string(),
  corpus: z.string(),
});

// AN1.5 - Re-ranking outputs
const RerankedItemSchema = z.object({
  id: z.string(),
  original_rank: z.number(),
  new_rank: z.number(),
  relevance_score: z.number(),
  relevance_reason: z.string(),
  transfer_note: z.string().optional(),
});

// AN1.7 - Literature outputs
const ValidatedApproachSchema = z.object({
  approach_name: z.string(),
  source: z.string(),
  source_quality: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  commercial_status: z.string(),
  reported_outcomes: z.string(),
  limitations: z.string(),
  in_corpus: z.boolean(),
});

// Teaching case schema (legacy compatibility)
const TeachingCaseSchema = z.object({
  title: z.string(),
  domain: z.string(),
  mechanism: z.string(),
  relevance: z.string(),
  patentNumber: z.string().optional(),
});

// AN2 - Innovation Briefing outputs
const PatternSchema = z.object({
  name: z.string(),
  description: z.string(),
  precedent: z.string(),
  applicability: z.string(),
});

// AN3 - Concept Generation outputs
const ConceptSchema = z.object({
  id: z.string(),
  name: z.string(),
  track: z.enum(['best_fit', 'simpler_path', 'spark']),
  description: z.string(),
  mechanism: z.string(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  keyRisks: z.array(z.string()).default([]),
  validationGates: z.array(z.string()).default([]),
});

// AN4 - Evaluation outputs
const EvaluatedConceptSchema = ConceptSchema.extend({
  score: z.number().min(0).max(100),
  ranking: z.number().int().positive(),
  evaluationNotes: z.string().optional(),
});

/**
 * Full Chain State Schema
 */
export const ChainStateSchema = z.object({
  // Identifiers
  conversationId: z.string(),
  reportId: z.string().uuid(),

  // User input
  userInput: z.string(),
  accountId: z.string().uuid(),
  userId: z.string().uuid(),

  // AN0 - Problem Framing outputs
  originalAsk: z.string().optional(),
  userSector: z.string().optional(),
  primaryKpis: z.array(z.string()).default([]),
  hardConstraints: z.array(z.string()).default([]),
  physicsOfProblem: PhysicsOfProblemSchema.optional(),
  firstPrinciples: FirstPrinciplesSchema.optional(),
  contradiction: ContradictionSchema.optional(),
  trizPrinciples: z.array(z.number().int().min(1).max(40)).default([]),
  crossDomainSeeds: z.array(z.string()).default([]),
  corpusQueries: CorpusQueriesSchema.optional(),

  // Clarification handling
  needsClarification: z.boolean().default(false),
  clarificationQuestion: z.string().optional(),
  clarificationAnswer: z.string().optional(),
  clarificationCount: z.number().int().default(0),

  // AN1 - Corpus Retrieval outputs
  retrievalMechanisms: z.array(CorpusItemSchema).default([]),
  retrievalSeeds: z.array(CorpusItemSchema).default([]),
  retrievalPatents: z.array(CorpusItemSchema).default([]),
  retrievalSummary: z.string().optional(),

  // AN1.5 - Re-ranking outputs
  rerankedMechanisms: z.array(RerankedItemSchema).default([]),
  rerankedSeeds: z.array(RerankedItemSchema).default([]),
  rerankedPatents: z.array(RerankedItemSchema).default([]),
  corpusGaps: z.array(z.string()).default([]),
  rerankingSummary: z.string().optional(),

  // AN1.7 - Literature Augmentation outputs
  validatedApproaches: z.array(ValidatedApproachSchema).default([]),
  literatureCoverage: z
    .enum(['adequate', 'weak', 'gaps_identified'])
    .optional(),
  parameterReferences: z
    .array(
      z.object({
        parameter: z.string(),
        value_range: z.string(),
        source: z.string(),
        confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      }),
    )
    .default([]),
  augmentationSummary: z.string().optional(),

  // Legacy fields (for compatibility)
  teachingCases: z.array(TeachingCaseSchema).default([]),
  selectedPatterns: z.array(z.string()).default([]),
  literatureFindings: z.array(z.string()).default([]),
  patentReferences: z.array(z.string()).default([]),

  // AN2 - Innovation Briefing outputs
  patterns: z.array(PatternSchema).default([]),
  briefingSummary: z.string().optional(),

  // AN3 - Concept Generation outputs
  concepts: z.array(ConceptSchema).default([]),
  rawConceptCount: z.number().int().default(0),

  // AN4 - Evaluation outputs
  evaluatedConcepts: z.array(EvaluatedConceptSchema).default([]),
  recommendedConcept: z.string().optional(),

  // AN5 - Report Generation outputs
  reportMarkdown: z.string().optional(),
  reportSections: z.record(z.string()).default({}),

  // Tracking
  currentStep: z.string().optional(),
  completedSteps: z.array(z.string()).default([]),
  error: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

export type ChainState = z.infer<typeof ChainStateSchema>;
export type Concept = z.infer<typeof ConceptSchema>;
export type EvaluatedConcept = z.infer<typeof EvaluatedConceptSchema>;
export type Pattern = z.infer<typeof PatternSchema>;
export type TeachingCase = z.infer<typeof TeachingCaseSchema>;

/**
 * Create initial chain state from report generation event
 */
export function createInitialChainState(params: {
  reportId: string;
  accountId: string;
  userId: string;
  designChallenge: string;
  conversationId: string;
}): ChainState {
  return ChainStateSchema.parse({
    conversationId: params.conversationId,
    reportId: params.reportId,
    userInput: params.designChallenge,
    accountId: params.accountId,
    userId: params.userId,
    startedAt: new Date().toISOString(),
  });
}
