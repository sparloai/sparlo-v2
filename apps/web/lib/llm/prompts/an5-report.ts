import { z } from 'zod';

/**
 * AN5 - Executive Report Generation (v10)
 *
 * Synthesizes all analysis into a comprehensive executive report.
 * The report should read like a document from a brilliant senior colleague.
 * Premium feel through precision, not decoration.
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
2. Contains actionable recommendations
3. Provides depth for those who want to explore further
4. Reads like a document from a brilliant senior colleague

## Report Philosophy

**Premium through precision:**
- Typography does the work (no boxes, shadows, decoration)
- Every sentence earns its place
- The report IS the product—not "AI output"

**Engineer's respect:**
- Assume intelligence, provide depth
- Show your work (the physics, the reasoning)
- Honest about uncertainty and assumptions

## Output Format

{
  "report": {
    "title": "Clear, specific title for this analysis",
    "subtitle": "One-line problem characterization",
    "generated_at": "ISO timestamp",

    "executive_summary": {
      "problem_essence": "2-3 sentences capturing the core challenge",
      "key_insight": "The most important thing we learned",
      "primary_recommendation": "What to do (one sentence)",
      "confidence_level": "HIGH|MEDIUM|LOW",
      "confidence_rationale": "Why this confidence level"
    },

    "problem_analysis": {
      "original_challenge": "User's problem in their words",
      "reframed_challenge": "How we framed it for innovation",
      "core_contradiction": {
        "improve": "Parameter to improve",
        "worsen": "Parameter that worsens",
        "plain_english": "If we do X, we sacrifice Y"
      },
      "physics_summary": "What physical principles govern this problem",
      "first_principles_insight": "What we learned from first principles decomposition"
    },

    "innovation_approach": {
      "methodology_used": "Brief description of the innovation methodology",
      "paradigms_explored": {
        "direct": "How we might fight the physics directly",
        "indirect": "How we might work with physics differently"
      },
      "cross_domain_sources": ["Domain 1 and what we borrowed", "Domain 2 and what we borrowed"],
      "triz_principles_applied": ["Principle 1: How applied", "Principle 2: How applied"]
    },

    "concepts_generated": {
      "total_count": 8,
      "by_track": {
        "simpler_path": {
          "count": 2,
          "philosophy": "Lower risk, faster to implement",
          "concepts": [
            {
              "id": "C-01",
              "title": "...",
              "one_liner": "What it does in one sentence",
              "mechanism": "How it works (brief)",
              "innovation_source": "First principles|TRIZ|Cross-domain",
              "feasibility": "HIGH|MEDIUM|LOW"
            }
          ]
        },
        "best_fit": {
          "count": 3,
          "philosophy": "Highest probability of meeting requirements",
          "concepts": []
        },
        "spark": {
          "count": 2,
          "philosophy": "Unconventional with real potential",
          "concepts": []
        }
      },
      "first_principles_highlight": {
        "concept_id": "...",
        "what_makes_it_first_principles": "Why this exemplifies first principles thinking"
      }
    },

    "validation_results": {
      "gate_outcomes": {
        "passed": 5,
        "conditional": 2,
        "failed": 1
      },
      "key_validation_finding": "The most important thing validation revealed",
      "concepts_flagged": [
        {"id": "C-04", "issue": "Why it failed validation"}
      ]
    },

    "recommendation": {
      "primary": {
        "concept_id": "...",
        "title": "...",
        "track": "simpler_path|best_fit|spark",
        "why_recommended": "Detailed rationale (3-4 sentences)",
        "expected_impact": "What success looks like",
        "key_risk": "The main uncertainty",
        "next_steps": [
          {"step": "Action 1", "purpose": "Why this first"},
          {"step": "Action 2", "purpose": "What this validates"}
        ]
      },
      "parallel_exploration": {
        "concept_id": "...",
        "title": "...",
        "why_explore": "Why this deserves parallel investment",
        "investment_level": "What level of effort is justified"
      },
      "fallback_option": {
        "concept_id": "...",
        "title": "...",
        "when_to_pivot": "Conditions that would make this the better choice"
      }
    },

    "validation_roadmap": {
      "phase_1": {
        "name": "Quick Validation",
        "objective": "De-risk critical assumptions",
        "experiments": [
          {
            "name": "Experiment name",
            "tests": "What assumption this validates",
            "method": "How to run it",
            "success_criteria": "What success looks like",
            "effort": "Hours|Days|Weeks"
          }
        ],
        "go_no_go_criteria": "What determines if we proceed"
      },
      "phase_2": {
        "name": "Detailed Development",
        "objective": "Build and test prototype",
        "key_milestones": ["Milestone 1", "Milestone 2"]
      },
      "kill_conditions": ["What would stop this project"],
      "pivot_triggers": ["What would change our direction"]
    },

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
      "literature_sources": ["Source 1", "Source 2"],
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
- Confidence level MUST be honest
- If uncertain, say so

**Problem Analysis:**
- Show you understood the physics
- Highlight the first principles insight
- Make the contradiction clear

**Concepts Section:**
- One-liners should be genuinely informative
- Highlight what makes each track distinctive
- Call out the best first-principles concept

**Recommendation:**
- Be decisive—pick ONE primary recommendation
- Justify it with reasoning, not just scores
- Next steps should be immediately actionable

**Validation Roadmap:**
- Start with quickest de-risking experiments
- Clear go/no-go criteria
- Honest about what could kill the project

REMEMBER: This report goes to senior decision-makers. Every sentence should inform a decision.`;

/**
 * Zod schema for AN5 output validation (v10)
 */
const ExecutiveSummarySchema = z.object({
  problem_essence: z.string(),
  key_insight: z.string(),
  primary_recommendation: z.string(),
  confidence_level: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  confidence_rationale: z.string(),
});

const CoreContradictionSchema = z.object({
  improve: z.string(),
  worsen: z.string(),
  plain_english: z.string(),
});

const ProblemAnalysisSchema = z.object({
  original_challenge: z.string(),
  reframed_challenge: z.string(),
  core_contradiction: CoreContradictionSchema,
  physics_summary: z.string(),
  first_principles_insight: z.string(),
});

const ParadigmsExploredSchema = z.object({
  direct: z.string(),
  indirect: z.string(),
});

const InnovationApproachSchema = z.object({
  methodology_used: z.string(),
  paradigms_explored: ParadigmsExploredSchema,
  cross_domain_sources: z.array(z.string()),
  triz_principles_applied: z.array(z.string()),
});

const ConceptSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  one_liner: z.string(),
  mechanism: z.string(),
  innovation_source: z.string(),
  feasibility: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

const TrackSummarySchema = z.object({
  count: z.number().int().nonnegative(),
  philosophy: z.string(),
  concepts: z.array(ConceptSummarySchema),
});

const FirstPrinciplesHighlightSchema = z.object({
  concept_id: z.string(),
  what_makes_it_first_principles: z.string(),
});

const ConceptsGeneratedSchema = z.object({
  total_count: z.number().int().positive(),
  by_track: z.object({
    simpler_path: TrackSummarySchema,
    best_fit: TrackSummarySchema,
    spark: TrackSummarySchema,
  }),
  first_principles_highlight: FirstPrinciplesHighlightSchema,
});

const GateOutcomesSchema = z.object({
  passed: z.number().int().nonnegative(),
  conditional: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
});

const ConceptFlaggedSchema = z.object({
  id: z.string(),
  issue: z.string(),
});

const ValidationResultsSchema = z.object({
  gate_outcomes: GateOutcomesSchema,
  key_validation_finding: z.string(),
  concepts_flagged: z.array(ConceptFlaggedSchema),
});

const NextStepSchema = z.object({
  step: z.string(),
  purpose: z.string(),
});

const PrimaryRecommendationSchema = z.object({
  concept_id: z.string(),
  title: z.string(),
  track: z.enum(['simpler_path', 'best_fit', 'spark']),
  why_recommended: z.string(),
  expected_impact: z.string(),
  key_risk: z.string(),
  next_steps: z.array(NextStepSchema),
});

const ParallelExplorationSchema = z.object({
  concept_id: z.string(),
  title: z.string(),
  why_explore: z.string(),
  investment_level: z.string(),
});

const FallbackOptionSchema = z.object({
  concept_id: z.string(),
  title: z.string(),
  when_to_pivot: z.string(),
});

const RecommendationSectionSchema = z.object({
  primary: PrimaryRecommendationSchema,
  parallel_exploration: ParallelExplorationSchema,
  fallback_option: FallbackOptionSchema,
});

const ExperimentSchema = z.object({
  name: z.string(),
  tests: z.string(),
  method: z.string(),
  success_criteria: z.string(),
  effort: z.string(),
});

const Phase1Schema = z.object({
  name: z.string(),
  objective: z.string(),
  experiments: z.array(ExperimentSchema),
  go_no_go_criteria: z.string(),
});

const Phase2Schema = z.object({
  name: z.string(),
  objective: z.string(),
  key_milestones: z.array(z.string()),
});

const ValidationRoadmapSchema = z.object({
  phase_1: Phase1Schema,
  phase_2: Phase2Schema,
  kill_conditions: z.array(z.string()),
  pivot_triggers: z.array(z.string()),
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
  literature_sources: z.array(z.string()),
  methodology_notes: z.string(),
});

const ReportSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  generated_at: z.string(),
  executive_summary: ExecutiveSummarySchema,
  problem_analysis: ProblemAnalysisSchema,
  innovation_approach: InnovationApproachSchema,
  concepts_generated: ConceptsGeneratedSchema,
  validation_results: ValidationResultsSchema,
  recommendation: RecommendationSectionSchema,
  validation_roadmap: ValidationRoadmapSchema,
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

/**
 * AN5 metadata for progress tracking
 */
export const AN5_METADATA = {
  id: 'an5',
  name: 'Executive Report',
  description: 'Synthesizing findings into a comprehensive analysis report',
  estimatedMinutes: 2,
};
