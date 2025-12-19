import { z } from 'zod';

/**
 * AN5 - Executive Report Generation (v12)
 *
 * Synthesizes all analysis into a comprehensive executive report.
 * The report should read like a document from a brilliant senior colleague.
 * Premium feel through precision, not decoration.
 *
 * v12 changes:
 * - Output format now matches SparloReportSchema for direct rendering
 * - Brief is provided as input (from AN0 user input)
 * - Structured sections with explicit typing for UI components
 */

export const AN5_PROMPT = `You are writing an EXECUTIVE INNOVATION REPORT synthesizing a complete design challenge analysis.

CRITICAL: You must respond with ONLY valid JSON. No markdown, no text before or after. Start with { and end with }.

## Your Role

You have the complete output from the analysis chain:
- Problem framing with physics and first principles (AN0)
- Teaching examples and validation data (AN1.5)
- Literature validation (AN1.7)
- Innovation methodology briefing (AN2)
- Generated concepts across three tracks (AN3)
- Validation results and recommendations (AN4)

Your job is to synthesize this into a report that:
1. A senior engineering leader can read in 10 minutes
2. Contains actionable recommendations with a clear decision path
3. Provides depth for those who want to explore further
4. Reads like a document from a brilliant senior colleague WHO ACTUALLY CARES about the outcome
5. Is conversational and direct—not bureaucratic or hedge-filled

## Report Philosophy

**Premium through precision:**
- Typography does the work (no boxes, shadows, decoration)
- Every sentence earns its place
- The report IS the product—not "AI output"

**Engineer's respect:**
- Assume intelligence, provide depth
- Show your work (the physics, the reasoning)
- Honest about uncertainty and assumptions

**Conversational authority:**
- Write like you're the senior engineer briefing the project lead
- Use "we", "you", "this project"—not detached academic voice
- Be direct: "If this were my project, I'd..."
- Show confidence where justified, uncertainty where appropriate

## Output Format

IMPORTANT: The brief.original_problem will be provided as input - you do NOT generate it.

{
  "header": {
    "report_id": "UUID from input",
    "title": "Clear, specific title for this analysis (max 100 chars)",
    "generated_at": "ISO 8601 timestamp (e.g., 2025-01-15T14:32:00Z)"
  },

  "executive_summary": {
    "viability": "GREEN|YELLOW|RED",
    "viability_label": "Short label like 'Viable with risks' or 'Multiple paths available'",
    "the_problem": "2-3 sentences capturing the core challenge in plain language",
    "core_insight": {
      "headline": "4-8 word breakthrough realization",
      "explanation": "The most important thing we learned—expanded explanation"
    },
    "recommended_path": [
      {"step_number": 1, "content": "First step: action verb + specific task"},
      {"step_number": 2, "content": "Second step..."},
      {"step_number": 3, "content": "Third step..."}
    ]
  },

  "constraints": {
    "from_input": [
      {
        "constraint": "What they specified",
        "highlighted_terms": ["key", "terms"],
        "technical_values": ["specific values like '5mm', '100°C'"],
        "note": "How we interpreted this constraint"
      }
    ],
    "assumptions": [
      {
        "assumption": "What we assumed (flag if incorrect)",
        "technical_values": ["inferred values"]
      }
    ]
  },

  "problem_analysis": {
    "whats_wrong": {
      "prose": "Direct explanation of the failure mode in plain language",
      "technical_note": {
        "equation": "Optional: governing equation like 'σ = F/A'",
        "explanation": "What this equation tells us about the problem"
      }
    },
    "why_its_hard": {
      "prose": "The physics/engineering reasons this isn't trivial",
      "factors": ["Factor 1", "Factor 2", "Factor 3"],
      "additional_prose": "Optional additional context"
    },
    "first_principles_insight": {
      "headline": "From-scratch revelation in 4-8 words",
      "explanation": "If you were designing this today with no history, what would you do differently?"
    },
    "root_cause_hypotheses": [
      {
        "id": 1,
        "name": "Short name for hypothesis",
        "confidence": "HIGH|MEDIUM|LOW",
        "explanation": "Why this might be the cause"
      }
    ],
    "success_metrics": [
      {"metric": "What to measure", "target": "What success looks like"}
    ]
  },

  "key_patterns": [
    {
      "id": "P-01",
      "name": "3-5 word memorable pattern name",
      "description": "One sentence explaining the pattern",
      "source_industry": "Domain or prior art source",
      "why_it_matters": "Why this pattern is relevant to THIS problem",
      "patent_refs": ["Optional patent numbers or paper citations"]
    }
  ],

  "solution_concepts": {
    "lead_concepts": [
      {
        "id": "C-01",
        "title": "Descriptive title",
        "track": "simpler_path|best_fit|spark",
        "track_label": "Human-readable: 'Simpler Path' or 'Best Fit' or 'High-Risk/High-Reward'",
        "bottom_line": "If you can do X, this is the answer. One bold sentence.",
        "what_it_is": "2-4 sentence detailed description of what to build/do",
        "why_it_works": "The physics/engineering principle that makes this work",
        "patterns_referenced": ["P-01", "P-02"],
        "confidence": "HIGH|MEDIUM|LOW",
        "confidence_rationale": "Why this confidence level—cite precedent or uncertainty",
        "what_would_change_this": "What information would make you reconsider",
        "key_risks": [
          {"risk": "What could go wrong", "mitigation": "How to prevent/detect it"}
        ],
        "how_to_test": [
          {
            "gate_id": "G-01",
            "name": "First test name",
            "effort": "Hours|Days|Weeks|Months",
            "method": "How to run the test",
            "go_criteria": "Proceed if...",
            "no_go_criteria": "Stop if..."
          }
        ]
      }
    ],
    "other_concepts": [
      {
        "id": "C-03",
        "title": "...",
        "track": "simpler_path|best_fit|spark",
        "track_label": "...",
        "bottom_line": "One sentence summary of when to use this",
        "what_it_is": "Brief description",
        "confidence": "HIGH|MEDIUM|LOW",
        "confidence_rationale": "Why",
        "critical_validation": "The one thing to test first. GO if... NO-GO if..."
      }
    ],
    "innovation_concept": {
      "id": "C-06",
      "title": "...",
      "why_interesting": "What makes this worth considering despite uncertainty",
      "why_uncertain": "What we don't know",
      "confidence": "LOW",
      "when_to_pursue": "Under what conditions this becomes the lead concept",
      "critical_validation": "GO/NO-GO criteria"
    },
    "comparison_table": [
      {
        "id": "C-01",
        "title": "...",
        "key_metric_achievable": "...",
        "confidence": "HIGH|MEDIUM|LOW",
        "capital_required": "None|Low|Medium|High",
        "timeline": "Days|Weeks|Months",
        "key_risk": "One phrase"
      }
    ],
    "comparison_insight": "The main takeaway from comparing the concepts"
  },

  "validation_summary": {
    "failure_modes_checked": [
      {"mode": "Failure mode name", "how_addressed": "How the solution handles this"}
    ],
    "parameter_bounds_validated": [
      {"bound": "Parameter name", "value": "Validated value or range"}
    ],
    "literature_precedent": [
      {"approach": "...", "precedent_level": "HIGH|MEDIUM|LOW", "source": "Who does this"}
    ]
  },

  "challenge_the_frame": [
    {
      "question": "What if the real problem isn't X but Y?",
      "implication": "If true, the solution would be...",
      "action_or_test": {
        "label": "Test This",
        "content": "Quick way to validate this alternative frame"
      }
    }
  ],

  "risks_and_watchouts": [
    {
      "name": "Short risk name",
      "likelihood_label": "Likely|Possible|Unlikely",
      "likelihood_color": "amber|red|gray",
      "description": "What the risk is",
      "mitigation": "How to prevent or detect",
      "trigger": "When to escalate / change course"
    }
  ],

  "next_steps": {
    "steps": [
      {
        "step_number": 1,
        "timeframe": "Today|This week|Next week|Month 1",
        "action": "Specific action (verb + object, max 50 chars)",
        "details": "Why this step and what it accomplishes"
      }
    ],
    "decision_point": {
      "title": "Key Decision Point",
      "description": "The decision that determines the next phase",
      "cta_label": "Optional call-to-action button text"
    }
  },

  "appendix": {
    "all_concepts": [
      {
        "id": "C-01",
        "title": "...",
        "track": "simpler_path|best_fit|spark",
        "gate_status": "PASS|CONDITIONAL|FAIL",
        "overall_score": 85,
        "one_liner": "One sentence summary"
      }
    ],
    "constraints_respected": ["Constraint 1 that was honored", "Constraint 2"],
    "assumptions_made": ["Assumption 1 that underlies analysis", "Assumption 2"],
    "methodology_notes": "Brief notes on the TRIZ-informed analysis methodology"
  },

  "metadata": {
    "report_id": "Same as header.report_id",
    "analysis_id": "conversation_id from input",
    "generated_at": "Same ISO timestamp as header.generated_at",
    "phases_completed": ["an0", "an1.5", "an1.7", "an2", "an3", "an4", "an5"],
    "total_concepts_generated": 8,
    "concepts_passing_validation": 5,
    "primary_recommendation_confidence": "HIGH|MEDIUM|LOW"
  }
}

## Writing Guidelines

**Header:**
- Title should be clear, specific, under 100 characters
- generated_at must be valid ISO 8601 format

**Executive Summary:**
- 30 seconds to understand problem, insight, recommendation
- Viability verdict MUST be honest: GREEN (multiple paths work), YELLOW (viable but risks), RED (fundamental blockers)
- recommended_path should be 3-5 concrete steps, not vague advice

**Constraints Section:**
- from_input: what the user explicitly stated
- assumptions: what we inferred or assumed (flag these clearly)

**Problem Analysis:**
- whats_wrong should be visceral—name the failure mode
- why_its_hard.factors should be 3-5 specific physics/engineering challenges
- first_principles_insight should be the "aha" moment
- root_cause_hypotheses should be numbered with confidence levels

**Key Patterns:**
- 3-5 reusable insights that could apply beyond this problem
- Name them memorably ("Phase-State Switching", "Temporal Separation")
- Reference source industries/domains

**Solution Concepts:**
- Lead concepts: 1-2 primary recommendations with full testing gates
- Other concepts: 2-4 alternatives with critical validation criteria
- Innovation concept: 0-1 high-risk/high-reward "spark" ideas
- comparison_table: all concepts side-by-side for quick comparison

**Risks & Watchouts:**
- Be honest about what could go wrong
- likelihood_color: amber (possible), red (likely), gray (unlikely)
- Include specific triggers for when to pivot

**Next Steps:**
- 3-5 concrete, time-bound actions
- decision_point: the key go/no-go moment

REMEMBER: This report goes to senior decision-makers. They want clarity, not hedge words. Be direct, be honest, be actionable.`;

/**
 * Zod schema for AN5 output validation (v12)
 * Matches SparloReportSchema for direct rendering
 */

const ConfidenceLevel = z.enum(['HIGH', 'MEDIUM', 'LOW']);
const ViabilityVerdict = z.enum(['GREEN', 'YELLOW', 'RED']);
const ConceptTrack = z.enum(['simpler_path', 'best_fit', 'spark']);
const GateStatus = z.enum(['PASS', 'CONDITIONAL', 'FAIL']);
const LikelihoodColor = z.enum(['amber', 'red', 'gray']);

// Helper to normalize enum values that may have parenthetical annotations
const normalizeEnumValue = (validValues: string[]) =>
  z.string().transform((val) => {
    const normalized = val.replace(/\s*\([^)]*\)\s*$/, '').trim();
    const match = validValues.find(
      (v) => v.toLowerCase() === normalized.toLowerCase(),
    );
    return match ?? normalized;
  });

const CapitalRequirement = normalizeEnumValue(['None', 'Low', 'Medium', 'High']).pipe(
  z.enum(['None', 'Low', 'Medium', 'High']),
);

// Header
const HeaderSchema = z.object({
  report_id: z.string().min(1),
  title: z.string().min(1).max(500),
  generated_at: z.string().datetime(),
});

// Executive Summary
const RecommendedPathStepSchema = z.object({
  step_number: z.number().int().positive(),
  content: z.string().min(1),
});

const ExecutiveSummarySchema = z.object({
  viability: ViabilityVerdict,
  viability_label: z.string().min(1).optional(),
  the_problem: z.string().min(1),
  core_insight: z.object({
    headline: z.string().min(1),
    explanation: z.string().min(1),
  }),
  recommended_path: z.array(RecommendedPathStepSchema).min(1),
});

// Constraints
const ConstraintFromInputSchema = z.object({
  constraint: z.string().min(1),
  highlighted_terms: z.array(z.string()).optional(),
  technical_values: z.array(z.string()).optional(),
  note: z.string().optional(),
});

const AssumptionSchema = z.object({
  assumption: z.string().min(1),
  technical_values: z.array(z.string()).optional(),
});

const ConstraintsSchema = z.object({
  from_input: z.array(ConstraintFromInputSchema),
  assumptions: z.array(AssumptionSchema),
});

// Problem Analysis
const TechnicalNoteSchema = z.object({
  equation: z.string().optional(),
  explanation: z.string().min(1),
});

const RootCauseHypothesisSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  confidence: ConfidenceLevel,
  explanation: z.string().min(1),
});

const SuccessMetricSchema = z.object({
  metric: z.string().min(1),
  target: z.string().min(1),
});

const FirstPrinciplesInsightSchema = z.object({
  headline: z.string().min(1),
  explanation: z.string().min(1),
});

const ProblemAnalysisSchema = z.object({
  whats_wrong: z.object({
    prose: z.string().min(1),
    technical_note: TechnicalNoteSchema.optional(),
  }),
  why_its_hard: z.object({
    prose: z.string().min(1),
    factors: z.array(z.string().min(1)).min(1),
    additional_prose: z.string().optional(),
  }),
  first_principles_insight: FirstPrinciplesInsightSchema,
  root_cause_hypotheses: z.array(RootCauseHypothesisSchema),
  success_metrics: z.array(SuccessMetricSchema).min(1),
});

// Key Patterns
const KeyPatternSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  source_industry: z.string().min(1),
  why_it_matters: z.string().min(1),
  patent_refs: z.array(z.string()).optional(),
});

// Solution Concepts
const RiskItemSchema = z.object({
  risk: z.string().min(1),
  mitigation: z.string().min(1),
});

const TestGateSchema = z.object({
  gate_id: z.string().min(1),
  name: z.string().min(1),
  effort: z.string().min(1),
  method: z.string().min(1),
  go_criteria: z.string().min(1),
  no_go_criteria: z.string().min(1),
});

const LeadConceptSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  track: ConceptTrack,
  track_label: z.string().min(1),
  bottom_line: z.string().min(1),
  what_it_is: z.string().min(1),
  why_it_works: z.string().min(1),
  patterns_referenced: z.array(z.string()).optional(),
  confidence: ConfidenceLevel,
  confidence_rationale: z.string().min(1),
  what_would_change_this: z.string().min(1),
  key_risks: z.array(RiskItemSchema),
  how_to_test: z.array(TestGateSchema).min(1),
});

const OtherConceptSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  track: ConceptTrack,
  track_label: z.string().min(1),
  bottom_line: z.string().min(1),
  what_it_is: z.string().min(1),
  confidence: ConfidenceLevel,
  confidence_rationale: z.string().min(1),
  critical_validation: z.string().min(1),
});

const InnovationConceptSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  why_interesting: z.string().min(1),
  why_uncertain: z.string().min(1),
  confidence: ConfidenceLevel,
  when_to_pursue: z.string().min(1),
  critical_validation: z.string().min(1),
});

const ComparisonRowSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  key_metric_achievable: z.string().min(1),
  confidence: ConfidenceLevel,
  capital_required: CapitalRequirement,
  timeline: z.string().min(1),
  key_risk: z.string().min(1),
});

const SolutionConceptsSchema = z.object({
  lead_concepts: z.array(LeadConceptSchema).min(1),
  other_concepts: z.array(OtherConceptSchema),
  innovation_concept: InnovationConceptSchema.optional(),
  comparison_table: z.array(ComparisonRowSchema).min(1),
  comparison_insight: z.string().min(1),
});

// Validation Summary
const FailureModeCheckedSchema = z.object({
  mode: z.string().min(1),
  how_addressed: z.string().min(1),
});

const ParameterBoundSchema = z.object({
  bound: z.string().min(1),
  value: z.string().optional(),
});

const LiteraturePrecedentSchema = z.object({
  approach: z.string().min(1),
  precedent_level: ConfidenceLevel,
  source: z.string().optional(),
});

const ValidationSummarySchema = z.object({
  failure_modes_checked: z.array(FailureModeCheckedSchema),
  parameter_bounds_validated: z.array(ParameterBoundSchema),
  literature_precedent: z.array(LiteraturePrecedentSchema),
});

// Challenge the Frame
const ChallengeFrameSchema = z.object({
  question: z.string().min(1),
  implication: z.string().min(1),
  action_or_test: z.object({
    label: z.string().min(1),
    content: z.string().min(1),
  }),
});

// Risks and Watchouts
const RiskWatchoutSchema = z.object({
  name: z.string().min(1),
  likelihood_label: z.string().min(1),
  likelihood_color: LikelihoodColor.optional(),
  description: z.string().min(1),
  mitigation: z.string().min(1),
  trigger: z.string().min(1),
});

// Next Steps
const NextStepSchema = z.object({
  step_number: z.number().int().positive(),
  timeframe: z.string().min(1),
  action: z.string().min(1),
  details: z.string().min(1),
});

const DecisionPointSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  cta_label: z.string().optional(),
});

const NextStepsSchema = z.object({
  steps: z.array(NextStepSchema),
  decision_point: DecisionPointSchema.optional(),
});

// Appendix
const AppendixConceptSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  track: ConceptTrack,
  gate_status: GateStatus,
  overall_score: z.number().int().min(1).max(100),
  one_liner: z.string().min(1),
});

const AppendixSchema = z.object({
  all_concepts: z.array(AppendixConceptSchema),
  constraints_respected: z.array(z.string().min(1)),
  assumptions_made: z.array(z.string().min(1)),
  methodology_notes: z.string().optional(),
});

// Metadata
const MetadataSchema = z.object({
  report_id: z.string().min(1),
  analysis_id: z.string().min(1),
  generated_at: z.string().datetime(),
  phases_completed: z.array(z.string().min(1)),
  total_concepts_generated: z.number().int().positive(),
  concepts_passing_validation: z.number().int().nonnegative(),
  primary_recommendation_confidence: ConfidenceLevel,
});

/**
 * AN5 Output Schema (v12)
 *
 * Note: The 'brief' field is NOT generated by AN5 - it's added by generate-report.ts
 * from the original user input (AN0). This schema validates what AN5 produces.
 */
export const AN5OutputSchema = z.object({
  header: HeaderSchema,
  executive_summary: ExecutiveSummarySchema,
  constraints: ConstraintsSchema,
  problem_analysis: ProblemAnalysisSchema,
  key_patterns: z.array(KeyPatternSchema),
  solution_concepts: SolutionConceptsSchema,
  validation_summary: ValidationSummarySchema,
  challenge_the_frame: z.array(ChallengeFrameSchema),
  risks_and_watchouts: z.array(RiskWatchoutSchema),
  next_steps: NextStepsSchema,
  appendix: AppendixSchema,
  metadata: MetadataSchema,
});

export type AN5Output = z.infer<typeof AN5OutputSchema>;
export type LeadConcept = z.infer<typeof LeadConceptSchema>;
export type OtherConcept = z.infer<typeof OtherConceptSchema>;
export type InnovationConcept = z.infer<typeof InnovationConceptSchema>;
export type TestGate = z.infer<typeof TestGateSchema>;

/**
 * AN5 metadata for progress tracking
 */
export const AN5_METADATA = {
  id: 'an5',
  name: 'Executive Report',
  description: 'Synthesizing findings into a comprehensive analysis report',
  estimatedMinutes: 3,
};
