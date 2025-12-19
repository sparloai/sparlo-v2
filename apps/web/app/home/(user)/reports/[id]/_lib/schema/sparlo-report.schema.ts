import { z } from 'zod';

// ============================================================================
// PRIMITIVE SCHEMAS
// ============================================================================

export const ConfidenceLevel = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export const ViabilityVerdict = z.enum(['GREEN', 'YELLOW', 'RED']);
export const ConceptTrack = z.enum(['simpler_path', 'best_fit', 'spark']);
export const CapitalRequirement = z.enum(['None', 'Low', 'Medium', 'High']);
export const GateStatus = z.enum(['PASS', 'CONDITIONAL', 'FAIL']);
export const LikelihoodColor = z.enum(['amber', 'red', 'gray']);

// ============================================================================
// SECTION SCHEMAS
// Note: All strings use .min(1) to prevent empty strings from LLM
// Dates use .datetime() for ISO 8601 validation
// Max lengths prevent DoS from oversized LLM output
// ============================================================================

// String length limits for different field types
const MAX_SHORT_TEXT = 500;
const MAX_LONG_TEXT = 10000;
const MAX_ID = 100;
const MAX_TECHNICAL_VALUE = 200;
const MAX_TITLE = 500;

export const BriefSchema = z.object({
  original_problem: z.string().min(1).max(MAX_LONG_TEXT),
  tags: z.array(z.string().min(1).max(MAX_SHORT_TEXT)).optional(),
});

export const RecommendedPathStepSchema = z.object({
  step_number: z.number().int().positive(),
  content: z.string().min(1).max(MAX_LONG_TEXT),
});

export const ExecutiveSummarySchema = z.object({
  viability: ViabilityVerdict,
  viability_label: z.string().min(1).max(MAX_SHORT_TEXT).optional(),
  the_problem: z.string().min(1).max(MAX_LONG_TEXT),
  core_insight: z.object({
    headline: z.string().min(1).max(MAX_TITLE),
    explanation: z.string().min(1).max(MAX_LONG_TEXT),
  }),
  recommended_path: z.array(RecommendedPathStepSchema).min(1),
});

export const ConstraintFromInputSchema = z.object({
  constraint: z.string().min(1).max(MAX_LONG_TEXT),
  highlighted_terms: z.array(z.string().min(1).max(MAX_SHORT_TEXT)).optional(),
  technical_values: z.array(z.string().min(1).max(MAX_TECHNICAL_VALUE)).optional(),
  note: z.string().min(1).max(MAX_LONG_TEXT).optional(),
});

export const AssumptionSchema = z.object({
  assumption: z.string().min(1).max(MAX_LONG_TEXT),
  technical_values: z.array(z.string().min(1).max(MAX_TECHNICAL_VALUE)).optional(),
});

export const ConstraintsSchema = z.object({
  from_input: z.array(ConstraintFromInputSchema),
  assumptions: z.array(AssumptionSchema),
});

export const TechnicalNoteSchema = z.object({
  equation: z.string().min(1).max(MAX_SHORT_TEXT).optional(),
  explanation: z.string().min(1).max(MAX_LONG_TEXT),
});

export const RootCauseHypothesisSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(MAX_TITLE),
  confidence: ConfidenceLevel,
  explanation: z.string().min(1).max(MAX_LONG_TEXT),
});

export const SuccessMetricSchema = z.object({
  metric: z.string().min(1).max(MAX_SHORT_TEXT),
  target: z.string().min(1).max(MAX_SHORT_TEXT),
});

export const FirstPrinciplesInsightSchema = z.object({
  headline: z.string().min(1).max(MAX_TITLE),
  explanation: z.string().min(1).max(MAX_LONG_TEXT),
});

export const ProblemAnalysisSchema = z.object({
  whats_wrong: z.object({
    prose: z.string().min(1).max(MAX_LONG_TEXT),
    technical_note: TechnicalNoteSchema.optional(),
  }),
  why_its_hard: z.object({
    prose: z.string().min(1).max(MAX_LONG_TEXT),
    factors: z.array(z.string().min(1).max(MAX_SHORT_TEXT)).min(1),
    additional_prose: z.string().min(1).max(MAX_LONG_TEXT).optional(),
  }),
  first_principles_insight: FirstPrinciplesInsightSchema,
  root_cause_hypotheses: z.array(RootCauseHypothesisSchema),
  success_metrics: z.array(SuccessMetricSchema).min(1),
});

export const KeyPatternSchema = z.object({
  id: z.string().min(1).max(MAX_ID),
  name: z.string().min(1).max(MAX_TITLE),
  description: z.string().min(1).max(MAX_LONG_TEXT),
  source_industry: z.string().min(1).max(MAX_SHORT_TEXT),
  why_it_matters: z.string().min(1).max(MAX_LONG_TEXT),
  patent_refs: z.array(z.string().min(1).max(MAX_SHORT_TEXT)).optional(),
});

export const RiskItemSchema = z.object({
  risk: z.string().min(1).max(MAX_LONG_TEXT),
  mitigation: z.string().min(1).max(MAX_LONG_TEXT),
});

export const TestGateSchema = z.object({
  gate_id: z.string().min(1).max(MAX_ID),
  name: z.string().min(1).max(MAX_TITLE),
  effort: z.string().min(1).max(MAX_SHORT_TEXT),
  method: z.string().min(1).max(MAX_LONG_TEXT),
  go_criteria: z.string().min(1).max(MAX_LONG_TEXT),
  no_go_criteria: z.string().min(1).max(MAX_LONG_TEXT),
});

export const LeadConceptSchema = z.object({
  id: z.string().min(1).max(MAX_ID),
  title: z.string().min(1).max(MAX_TITLE),
  track: ConceptTrack,
  track_label: z.string().min(1).max(MAX_SHORT_TEXT),
  bottom_line: z.string().min(1).max(MAX_LONG_TEXT),
  what_it_is: z.string().min(1).max(MAX_LONG_TEXT),
  why_it_works: z.string().min(1).max(MAX_LONG_TEXT),
  patterns_referenced: z.array(z.string().min(1).max(MAX_ID)).optional(),
  confidence: ConfidenceLevel,
  confidence_rationale: z.string().min(1).max(MAX_LONG_TEXT),
  what_would_change_this: z.string().min(1).max(MAX_LONG_TEXT),
  key_risks: z.array(RiskItemSchema),
  how_to_test: z.array(TestGateSchema).min(1),
});

export const OtherConceptSchema = z.object({
  id: z.string().min(1).max(MAX_ID),
  title: z.string().min(1).max(MAX_TITLE),
  track: ConceptTrack,
  track_label: z.string().min(1).max(MAX_SHORT_TEXT),
  bottom_line: z.string().min(1).max(MAX_LONG_TEXT),
  what_it_is: z.string().min(1).max(MAX_LONG_TEXT),
  confidence: ConfidenceLevel,
  confidence_rationale: z.string().min(1).max(MAX_LONG_TEXT),
  critical_validation: z.string().min(1).max(MAX_LONG_TEXT),
});

export const InnovationConceptSchema = z.object({
  id: z.string().min(1).max(MAX_ID),
  title: z.string().min(1).max(MAX_TITLE),
  why_interesting: z.string().min(1).max(MAX_LONG_TEXT),
  why_uncertain: z.string().min(1).max(MAX_LONG_TEXT),
  confidence: ConfidenceLevel,
  when_to_pursue: z.string().min(1).max(MAX_LONG_TEXT),
  critical_validation: z.string().min(1).max(MAX_LONG_TEXT),
});

export const ComparisonRowSchema = z.object({
  id: z.string().min(1).max(MAX_ID),
  title: z.string().min(1).max(MAX_TITLE),
  key_metric_achievable: z.string().min(1).max(MAX_SHORT_TEXT),
  confidence: ConfidenceLevel,
  capital_required: CapitalRequirement,
  timeline: z.string().min(1).max(MAX_SHORT_TEXT),
  key_risk: z.string().min(1).max(MAX_LONG_TEXT),
});

export const SolutionConceptsSchema = z.object({
  lead_concepts: z.array(LeadConceptSchema).min(1),
  other_concepts: z.array(OtherConceptSchema),
  innovation_concept: InnovationConceptSchema.optional(),
  comparison_table: z.array(ComparisonRowSchema).min(1),
  comparison_insight: z.string().min(1).max(MAX_LONG_TEXT),
});

export const LiteraturePrecedentSchema = z.object({
  approach: z.string().min(1).max(MAX_LONG_TEXT),
  precedent_level: ConfidenceLevel,
  source: z.string().min(1).max(MAX_SHORT_TEXT).optional(),
});

export const ValidationSummarySchema = z.object({
  failure_modes_checked: z.array(
    z.object({
      mode: z.string().min(1).max(MAX_SHORT_TEXT),
      how_addressed: z.string().min(1).max(MAX_LONG_TEXT),
    }),
  ),
  parameter_bounds_validated: z.array(
    z.object({
      bound: z.string().min(1).max(MAX_SHORT_TEXT),
      value: z.string().min(1).max(MAX_TECHNICAL_VALUE).optional(),
    }),
  ),
  literature_precedent: z.array(LiteraturePrecedentSchema),
});

export const ChallengeFrameSchema = z.object({
  question: z.string().min(1).max(MAX_LONG_TEXT),
  implication: z.string().min(1).max(MAX_LONG_TEXT),
  action_or_test: z.object({
    label: z.string().min(1).max(MAX_SHORT_TEXT),
    content: z.string().min(1).max(MAX_LONG_TEXT),
  }),
});

export const RiskWatchoutSchema = z.object({
  name: z.string().min(1).max(MAX_TITLE),
  likelihood_label: z.string().min(1).max(MAX_SHORT_TEXT),
  likelihood_color: LikelihoodColor.optional(),
  description: z.string().min(1).max(MAX_LONG_TEXT),
  mitigation: z.string().min(1).max(MAX_LONG_TEXT),
  trigger: z.string().min(1).max(MAX_LONG_TEXT),
});

export const NextStepSchema = z.object({
  step_number: z.number().int().positive(),
  timeframe: z.string().min(1).max(MAX_SHORT_TEXT),
  action: z.string().min(1).max(MAX_SHORT_TEXT),
  details: z.string().min(1).max(MAX_LONG_TEXT),
});

export const DecisionPointSchema = z.object({
  title: z.string().min(1).max(MAX_TITLE),
  description: z.string().min(1).max(MAX_LONG_TEXT),
  cta_label: z.string().min(1).max(MAX_SHORT_TEXT).optional(),
});

export const AppendixConceptSchema = z.object({
  id: z.string().min(1).max(MAX_ID),
  title: z.string().min(1).max(MAX_TITLE),
  track: ConceptTrack,
  gate_status: GateStatus,
  overall_score: z.number().int().min(1).max(100),
  one_liner: z.string().min(1).max(MAX_SHORT_TEXT),
});

export const AppendixSchema = z.object({
  all_concepts: z.array(AppendixConceptSchema),
  constraints_respected: z.array(z.string().min(1).max(MAX_SHORT_TEXT)),
  assumptions_made: z.array(z.string().min(1).max(MAX_SHORT_TEXT)),
  methodology_notes: z.string().min(1).max(MAX_LONG_TEXT).optional(),
});

export const MetadataSchema = z.object({
  report_id: z.string().min(1).max(MAX_ID),
  analysis_id: z.string().min(1).max(MAX_ID),
  generated_at: z.string().datetime(),
  phases_completed: z.array(z.string().min(1).max(MAX_SHORT_TEXT)),
  total_concepts_generated: z.number().int().positive(),
  concepts_passing_validation: z.number().int().nonnegative(),
  primary_recommendation_confidence: ConfidenceLevel,
});

// ============================================================================
// FLEXIBLE CONTENT SCHEMA
// For LLM-generated content that doesn't fit predefined sections
// ============================================================================

export const AdditionalSectionSchema = z.object({
  id: z.string().min(1).max(MAX_ID),
  title: z.string().min(1).max(MAX_TITLE),
  content: z.string().min(1).max(MAX_LONG_TEXT),
  icon: z.string().max(10).optional(), // Emoji or icon code
});

export const AdditionalContentSchema = z
  .object({
    sections: z.array(AdditionalSectionSchema),
  })
  .optional();

// ============================================================================
// COMPLETE REPORT SCHEMA
// ============================================================================

export const SparloReportSchema = z.object({
  header: z.object({
    report_id: z.string().min(1).max(MAX_ID),
    title: z.string().min(1).max(MAX_TITLE),
    generated_at: z.string().datetime(),
  }),
  brief: BriefSchema,
  executive_summary: ExecutiveSummarySchema,
  constraints: ConstraintsSchema,
  problem_analysis: ProblemAnalysisSchema,
  key_patterns: z.array(KeyPatternSchema),
  solution_concepts: SolutionConceptsSchema,
  validation_summary: ValidationSummarySchema,
  challenge_the_frame: z.array(ChallengeFrameSchema),
  risks_and_watchouts: z.array(RiskWatchoutSchema),
  next_steps: z.object({
    steps: z.array(NextStepSchema),
    decision_point: DecisionPointSchema.optional(),
  }),
  appendix: AppendixSchema,
  metadata: MetadataSchema,
  additional_content: AdditionalContentSchema,
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SparloReport = z.infer<typeof SparloReportSchema>;
export type Brief = z.infer<typeof BriefSchema>;
export type ExecutiveSummary = z.infer<typeof ExecutiveSummarySchema>;
export type Constraints = z.infer<typeof ConstraintsSchema>;
export type ProblemAnalysis = z.infer<typeof ProblemAnalysisSchema>;
export type KeyPattern = z.infer<typeof KeyPatternSchema>;
export type SolutionConcepts = z.infer<typeof SolutionConceptsSchema>;
export type LeadConcept = z.infer<typeof LeadConceptSchema>;
export type OtherConcept = z.infer<typeof OtherConceptSchema>;
export type InnovationConcept = z.infer<typeof InnovationConceptSchema>;
export type TestGate = z.infer<typeof TestGateSchema>;
export type ValidationSummary = z.infer<typeof ValidationSummarySchema>;
export type ChallengeFrame = z.infer<typeof ChallengeFrameSchema>;
export type RiskWatchout = z.infer<typeof RiskWatchoutSchema>;
export type NextStep = z.infer<typeof NextStepSchema>;
export type DecisionPoint = z.infer<typeof DecisionPointSchema>;
export type Appendix = z.infer<typeof AppendixSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type ConfidenceLevelType = z.infer<typeof ConfidenceLevel>;
export type ViabilityVerdictType = z.infer<typeof ViabilityVerdict>;
export type ConceptTrackType = z.infer<typeof ConceptTrack>;
export type LikelihoodColorType = z.infer<typeof LikelihoodColor>;
export type AdditionalSection = z.infer<typeof AdditionalSectionSchema>;
