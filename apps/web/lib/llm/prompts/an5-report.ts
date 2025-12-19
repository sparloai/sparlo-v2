import { z } from 'zod';

/**
 * AN5 - Executive Report Generation (v11)
 *
 * Synthesizes all analysis into a comprehensive executive report.
 * The report should read like a document from a brilliant senior colleague.
 * Premium feel through precision, not decoration.
 *
 * v11 changes:
 * - Conversational tone with direct voice ("If this were my project...")
 * - New sections: constraints, key_patterns, what_id_actually_do, challenge_the_frame, risks_and_watchouts
 * - Richer concept structure with bottom_line, what_it_is, why_it_works, how_to_test
 * - Decision architecture with explicit decision tree
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

{
  "report": {
    "title": "Clear, specific title for this analysis",
    "subtitle": "One-line problem characterization",
    "generated_at": "ISO timestamp",

    "executive_summary": {
      "problem_essence": "2-3 sentences capturing the core challenge in plain language",
      "key_insight": "The most important thing we learned—the breakthrough realization",
      "primary_recommendation": "Build/Test/Use [X] (action verb, specific). One sentence.",
      "fallback_summary": "If [X] doesn't work: pivot to [Y]",
      "viability_verdict": "GREEN|YELLOW|RED",
      "viability_rationale": "Why this viability—be honest about what we know and don't know"
    },

    "constraints": {
      "from_user_input": [
        {"constraint": "What they specified", "interpretation": "How we understood it"}
      ],
      "assumptions_made": [
        {"assumption": "What we assumed", "flag_if_incorrect": "Why this matters if wrong"}
      ],
      "constraint_summary": "One paragraph summarizing the constraint landscape"
    },

    "problem_analysis": {
      "what_is_actually_going_wrong": "Direct explanation of the failure mode in plain language",
      "why_its_hard": "The physics/engineering reasons this isn't trivial",
      "from_scratch_revelation": "If you were designing this today with no history, what would you do differently?",
      "root_cause_hypotheses": [
        {"hypothesis": "Hypothesis 1", "explanation": "Why this might be the cause", "confidence": "HIGH|MEDIUM|LOW"}
      ],
      "success_metrics": [
        {"metric": "What to measure", "target": "What success looks like"}
      ]
    },

    "key_patterns": [
      {
        "pattern_name": "3-5 word name",
        "what_it_is": "One sentence explaining the pattern",
        "where_it_comes_from": "Domain or prior art source",
        "why_it_matters_here": "Why this pattern is relevant to THIS problem",
        "precedent": "Who else has used this successfully"
      }
    ],

    "solution_concepts": {
      "lead_concepts": [
        {
          "id": "C-01",
          "title": "Descriptive title",
          "track": "simpler_path|best_fit|spark",
          "bottom_line": "If you can do X, this is the answer. One bold sentence.",
          "what_it_is": "2-4 sentence detailed description of what to build/do",
          "why_it_works": "The physics/engineering principle that makes this work. Reference the patterns.",
          "confidence": "HIGH|MEDIUM|LOW",
          "confidence_rationale": "Why this confidence level—cite precedent or uncertainty",
          "what_would_change_this": "What information would make you reconsider this concept",
          "key_risks": [
            {"risk": "What could go wrong", "mitigation": "How to prevent/detect it"}
          ],
          "how_to_test": {
            "gate_0": {
              "name": "First test name",
              "what_it_tests": "The assumption being validated",
              "method": "How to run the test",
              "go_criteria": "Proceed if...",
              "no_go_criteria": "Stop if...",
              "effort": "Hours|Days|Weeks"
            },
            "gate_1": {
              "name": "Second test name",
              "what_it_tests": "...",
              "method": "...",
              "go_criteria": "...",
              "no_go_criteria": "...",
              "effort": "..."
            }
          }
        }
      ],
      "other_concepts": [
        {
          "id": "C-03",
          "title": "...",
          "track": "simpler_path|best_fit|spark",
          "bottom_line": "One sentence summary of when to use this",
          "what_it_is": "Brief description",
          "confidence": "HIGH|MEDIUM|LOW",
          "confidence_rationale": "Why",
          "critical_validation": "The one thing to test first. GO if... NO-GO if..."
        }
      ],
      "spark_concept": {
        "id": "C-06",
        "title": "...",
        "why_interesting": "What makes this worth considering despite uncertainty",
        "why_uncertain": "What we don't know",
        "confidence": "LOW",
        "when_to_pursue": "Under what conditions this becomes the lead concept",
        "critical_validation": "GO/NO-GO criteria"
      }
    },

    "concept_comparison": {
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
      "key_insight": "The main takeaway from comparing the concepts"
    },

    "validation_summary": {
      "failure_modes_checked": ["Mode 1 - how addressed", "Mode 2 - how addressed"],
      "parameter_bounds_validated": ["Bound 1 - status", "Bound 2 - status"],
      "literature_precedent": [
        {"approach": "...", "precedent_level": "HIGH|MEDIUM|LOW", "source": "Who does this"}
      ]
    },

    "decision_architecture": {
      "primary_decision": "The first question to answer",
      "decision_tree": [
        {
          "condition": "If [condition]...",
          "then": "Do [action]",
          "otherwise": "See next condition"
        }
      ],
      "primary_path": "What we recommend as the default path",
      "fallback_path": "What to do if primary fails",
      "parallel_bet": "What to run in parallel if budget allows"
    },

    "what_id_actually_do": {
      "intro": "If this were my project, here's what I'd do...",
      "week_by_week": [
        {
          "timeframe": "Today|Week 1|Week 2|etc",
          "actions": ["Action 1", "Action 2"],
          "decision_point": "What this tells us / what we decide after"
        }
      ],
      "investment_summary": "Total effort/cost estimate and what it buys you"
    },

    "challenge_the_frame": [
      {
        "question": "What if the real problem isn't X but Y?",
        "implication": "If true, the solution would be...",
        "how_to_test": "Quick way to validate this alternative frame"
      }
    ],

    "risks_and_watchouts": [
      {
        "risk_name": "Short name",
        "likelihood": "Likely|Possible|Unlikely",
        "description": "What the risk is",
        "mitigation": "How to prevent or detect",
        "trigger": "When to escalate / change course"
      }
    ],

    "next_steps": [
      {
        "step_number": 1,
        "action": "Specific action (verb + object)",
        "purpose": "Why this step",
        "when": "Today|This week|Next"
      }
    ],

    "appendix": {
      "all_concepts_summary": [
        {
          "id": "C-01",
          "title": "...",
          "track": "simpler_path|best_fit|spark",
          "gate_status": "PASS|CONDITIONAL|FAIL",
          "overall_score": 85,
          "one_liner": "..."
        }
      ],
      "constraints_respected": ["Constraint 1", "Constraint 2"],
      "assumptions_made": ["Assumption 1", "Assumption 2"],
      "methodology_notes": "Brief notes on the analysis methodology"
    }
  },

  "metadata": {
    "analysis_id": "conversation_id from input",
    "phases_completed": ["an0", "an1.5", "an1.7", "an2", "an3", "an4", "an5"],
    "total_concepts_generated": 8,
    "concepts_passing_validation": 5,
    "primary_recommendation_confidence": "HIGH|MEDIUM|LOW"
  }
}

## Writing Guidelines

**Executive Summary:**
- 30 seconds to understand problem, insight, recommendation
- Viability verdict MUST be honest: GREEN (multiple paths work), YELLOW (viable but risks), RED (fundamental blockers)
- If uncertain, say so

**Constraints Section:**
- Distinguish between what they said vs what we assumed
- Flag assumptions that could change everything

**Problem Analysis:**
- Write like you're explaining to a smart colleague who's new to the problem
- "What's actually going wrong" should be visceral—name the failure mode
- Root cause hypotheses should be numbered and confidence-rated

**Key Patterns:**
- These are the reusable insights that could apply beyond this problem
- Name them memorably ("Phase-State Switching", "Temporal Separation")

**Solution Concepts:**
- Lead with "Bottom line:" for each concept
- "What it is" should be detailed enough to sketch
- Every concept needs clear GO/NO-GO gates for testing

**Decision Architecture:**
- Give them a clear decision tree, not a menu of options
- "If X, do Y. Otherwise, do Z."

**What I'd Actually Do:**
- This is your personal recommendation as if it were your project
- Be specific: "Week 1: Run X test. Week 2: Based on results, decide Y or Z."

**Challenge the Frame:**
- Question your own assumptions
- What would make this analysis wrong?

**Risks & Watchouts:**
- Be honest about what could go wrong
- Include triggers for when to pivot

REMEMBER: This report goes to senior decision-makers. They want clarity, not hedge words. Be direct, be honest, be actionable.`;

/**
 * Zod schema for AN5 output validation (v11)
 */

const ConstraintItemSchema = z.object({
  constraint: z.string(),
  interpretation: z.string(),
});

const AssumptionItemSchema = z.object({
  assumption: z.string(),
  flag_if_incorrect: z.string(),
});

const ConstraintsSchema = z.object({
  from_user_input: z.array(ConstraintItemSchema),
  assumptions_made: z.array(AssumptionItemSchema),
  constraint_summary: z.string(),
});

const ExecutiveSummarySchema = z.object({
  problem_essence: z.string(),
  key_insight: z.string(),
  primary_recommendation: z.string(),
  fallback_summary: z.string(),
  viability_verdict: z.enum(['GREEN', 'YELLOW', 'RED']),
  viability_rationale: z.string(),
});

const RootCauseHypothesisSchema = z.object({
  hypothesis: z.string(),
  explanation: z.string(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

const SuccessMetricSchema = z.object({
  metric: z.string(),
  target: z.string(),
});

const ProblemAnalysisSchema = z.object({
  what_is_actually_going_wrong: z.string(),
  why_its_hard: z.string(),
  from_scratch_revelation: z.string(),
  root_cause_hypotheses: z.array(RootCauseHypothesisSchema),
  success_metrics: z.array(SuccessMetricSchema),
});

const KeyPatternSchema = z.object({
  pattern_name: z.string(),
  what_it_is: z.string(),
  where_it_comes_from: z.string(),
  why_it_matters_here: z.string(),
  precedent: z.string(),
});

const RiskItemSchema = z.object({
  risk: z.string(),
  mitigation: z.string(),
});

const TestGateSchema = z.object({
  name: z.string(),
  what_it_tests: z.string(),
  method: z.string(),
  go_criteria: z.string(),
  no_go_criteria: z.string(),
  effort: z.string(),
});

const HowToTestSchema = z.object({
  gate_0: TestGateSchema,
  gate_1: TestGateSchema.optional(),
});

const LeadConceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  track: z.enum(['simpler_path', 'best_fit', 'spark']),
  bottom_line: z.string(),
  what_it_is: z.string(),
  why_it_works: z.string(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  confidence_rationale: z.string(),
  what_would_change_this: z.string(),
  key_risks: z.array(RiskItemSchema),
  how_to_test: HowToTestSchema,
});

const OtherConceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  track: z.enum(['simpler_path', 'best_fit', 'spark']),
  bottom_line: z.string(),
  what_it_is: z.string(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  confidence_rationale: z.string(),
  critical_validation: z.string(),
});

const SparkConceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  why_interesting: z.string(),
  why_uncertain: z.string(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  when_to_pursue: z.string(),
  critical_validation: z.string(),
});

const SolutionConceptsSchema = z.object({
  lead_concepts: z.array(LeadConceptSchema),
  other_concepts: z.array(OtherConceptSchema),
  spark_concept: SparkConceptSchema.optional(),
});

const ComparisonRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  key_metric_achievable: z.string(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  capital_required: z.enum(['None', 'Low', 'Medium', 'High']),
  timeline: z.string(),
  key_risk: z.string(),
});

const ConceptComparisonSchema = z.object({
  comparison_table: z.array(ComparisonRowSchema),
  key_insight: z.string(),
});

const LiteraturePrecedentSchema = z.object({
  approach: z.string(),
  precedent_level: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  source: z.string(),
});

const ValidationSummarySchema = z.object({
  failure_modes_checked: z.array(z.string()),
  parameter_bounds_validated: z.array(z.string()),
  literature_precedent: z.array(LiteraturePrecedentSchema),
});

const DecisionTreeItemSchema = z.object({
  condition: z.string(),
  then: z.string(),
  otherwise: z.string(),
});

const DecisionArchitectureSchema = z.object({
  primary_decision: z.string(),
  decision_tree: z.array(DecisionTreeItemSchema),
  primary_path: z.string(),
  fallback_path: z.string(),
  parallel_bet: z.string(),
});

const WeekActionSchema = z.object({
  timeframe: z.string(),
  actions: z.array(z.string()),
  decision_point: z.string(),
});

const WhatIdActuallyDoSchema = z.object({
  intro: z.string(),
  week_by_week: z.array(WeekActionSchema),
  investment_summary: z.string(),
});

const ChallengeFrameSchema = z.object({
  question: z.string(),
  implication: z.string(),
  how_to_test: z.string(),
});

const RiskWatchoutSchema = z.object({
  risk_name: z.string(),
  likelihood: z.enum(['Likely', 'Possible', 'Unlikely']),
  description: z.string(),
  mitigation: z.string(),
  trigger: z.string(),
});

const NextStepSchema = z.object({
  step_number: z.number().int().positive(),
  action: z.string(),
  purpose: z.string(),
  when: z.string(),
});

const AppendixConceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  track: z.enum(['simpler_path', 'best_fit', 'spark']),
  gate_status: z.enum(['PASS', 'CONDITIONAL', 'FAIL']),
  overall_score: z.number().int().min(1).max(100),
  one_liner: z.string(),
});

const AppendixSchema = z.object({
  all_concepts_summary: z.array(AppendixConceptSchema),
  constraints_respected: z.array(z.string()),
  assumptions_made: z.array(z.string()),
  methodology_notes: z.string(),
});

const ReportSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  generated_at: z.string(),
  executive_summary: ExecutiveSummarySchema,
  constraints: ConstraintsSchema,
  problem_analysis: ProblemAnalysisSchema,
  key_patterns: z.array(KeyPatternSchema),
  solution_concepts: SolutionConceptsSchema,
  concept_comparison: ConceptComparisonSchema,
  validation_summary: ValidationSummarySchema,
  decision_architecture: DecisionArchitectureSchema,
  what_id_actually_do: WhatIdActuallyDoSchema,
  challenge_the_frame: z.array(ChallengeFrameSchema),
  risks_and_watchouts: z.array(RiskWatchoutSchema),
  next_steps: z.array(NextStepSchema),
  appendix: AppendixSchema,
});

const MetadataSchema = z.object({
  analysis_id: z.string(),
  phases_completed: z.array(z.string()),
  total_concepts_generated: z.number().int().positive(),
  concepts_passing_validation: z.number().int().nonnegative(),
  primary_recommendation_confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

export const AN5OutputSchema = z.object({
  report: ReportSchema,
  metadata: MetadataSchema,
});

export type AN5Output = z.infer<typeof AN5OutputSchema>;
export type Report = z.infer<typeof ReportSchema>;
export type LeadConcept = z.infer<typeof LeadConceptSchema>;
export type OtherConcept = z.infer<typeof OtherConceptSchema>;
export type SparkConcept = z.infer<typeof SparkConceptSchema>;
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
