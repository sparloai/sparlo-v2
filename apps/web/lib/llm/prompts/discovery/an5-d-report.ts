import { z } from 'zod';

/**
 * AN5-D - Discovery Mode Report Generation
 *
 * Produces a report focused on:
 * 1. What has everyone MISSED?
 * 2. Novel approaches from non-obvious domains
 * 3. Clear validation paths for high-novelty concepts
 * 4. Why these approaches weren't tried before
 */

export const AN5_D_PROMPT = `You are generating a DISCOVERY MODE report that answers: "What has everyone missed?"

## REPORT PURPOSE

This is NOT a standard engineering report. This report:
1. HIGHLIGHTS what the industry has OVERLOOKED
2. PRESENTS novel approaches from NON-OBVIOUS domains
3. EXPLAINS why these haven't been tried
4. PROVIDES clear paths to VALIDATE novelty

## Report Structure

The report should feel like a breakthrough briefing:
- "Here's what everyone's been missing..."
- "Here's why they missed it..."
- "Here's how to test if we're right..."

CRITICAL: You must respond with ONLY valid JSON. No markdown, no text before or after. Start with { and end with }.

## Output Format

{
  "report": {
    "header": {
      "report_id": "discovery-uuid",
      "title": "Discovery Report: [Problem]",
      "mode": "discovery",
      "generated_at": "ISO timestamp",
      "tagline": "One-line summary of the key discovery"
    },

    "discovery_brief": {
      "original_problem": "User's problem statement",
      "industry_blind_spot": "What the industry has been missing",
      "discovery_thesis": "Our central novel insight",
      "hunting_grounds": ["Where we looked for solutions"],
      "key_finding": "Most important discovery"
    },

    "what_industry_missed": {
      "conventional_approaches": ["What industry does"],
      "why_they_do_it": "Reasons for conventional approach",
      "blind_spots": [
        {
          "assumption": "What they assume",
          "challenge": "Why it might be wrong",
          "opportunity": "What this opens up"
        }
      ],
      "unexplored_territories": ["Areas that haven't been investigated"]
    },

    "discovery_concepts": [
      {
        "id": "D-01",
        "name": "Concept name",
        "category": "biological_transfer|geological|abandoned_tech|frontier_material|combination",
        "source_domain": "Where the idea comes from",

        "the_insight": {
          "what_we_found": "The core novel mechanism",
          "why_its_new": "Why this hasn't been tried",
          "the_physics": "How it works physically"
        },

        "novelty_claim": {
          "genuinely_novel": true,
          "novelty_level": "breakthrough|significant|moderate",
          "not_same_as": "How this differs from conventional"
        },

        "how_it_works": {
          "mechanism": "Step-by-step explanation",
          "key_components": ["Component 1", "Component 2"],
          "enabling_factors": "What makes this possible now"
        },

        "breakthrough_potential": {
          "if_works": "What this achieves",
          "improvement": "Quantified improvement over conventional",
          "industry_impact": "How this changes things"
        },

        "validation_path": {
          "first_test": "Cheapest/fastest validation",
          "go_no_go": "Clear success/failure criteria",
          "timeline": "How long to validate",
          "cost": "Validation cost estimate"
        },

        "risks_and_unknowns": {
          "physics_risks": ["What might not work"],
          "implementation_challenges": ["Practical challenges"],
          "mitigation_ideas": ["How to address risks"]
        },

        "priority": "must_pursue|should_explore|worth_investigating|park"
      }
    ],

    "comparative_analysis": {
      "ranking_by_novelty": ["D-01", "D-03", "D-02"],
      "ranking_by_feasibility": ["D-02", "D-01", "D-03"],
      "ranking_overall": ["D-01", "D-02", "D-03"],

      "comparison_table": [
        {
          "concept_id": "D-01",
          "novelty_score": 9,
          "physics_confidence": 7,
          "breakthrough_potential": 9,
          "testability": 8,
          "overall_score": 8.5
        }
      ],

      "portfolio_strategy": "How to pursue multiple concepts in parallel"
    },

    "validation_roadmap": {
      "immediate_actions": [
        {
          "action": "Action description",
          "concept": "D-01",
          "timeline": "1-2 weeks",
          "cost": "$X",
          "expected_outcome": "What we'll learn"
        }
      ],
      "phase_1": {
        "objective": "Quick physics validation",
        "timeline": "Weeks 1-2",
        "budget": "$X",
        "go_no_go_gates": ["Gate 1", "Gate 2"]
      },
      "phase_2": {
        "objective": "Deep validation of survivors",
        "timeline": "Weeks 3-6",
        "budget": "$Y",
        "prototype_scope": "What to build"
      },
      "phase_3": {
        "objective": "Proof of concept",
        "timeline": "Weeks 7-12",
        "budget": "$Z",
        "success_criteria": "What proves this works"
      }
    },

    "why_this_matters": {
      "if_we_succeed": "Impact of successful validation",
      "competitive_advantage": "First-mover opportunity",
      "industry_implications": "How this changes the field",
      "risk_of_not_pursuing": "What we lose by not exploring"
    },

    "executive_summary": {
      "one_liner": "The single most important takeaway",
      "key_discovery": "What we found that others missed",
      "recommended_action": "What to do next",
      "timeline_to_validation": "How long until we know if this works",
      "investment_required": "What it costs to find out"
    },

    "appendix": {
      "excluded_conventional_approaches": ["What we deliberately excluded"],
      "methodology_notes": "How we conducted the discovery process",
      "sources_explored": ["Domains we hunted in"],
      "further_exploration_ideas": ["Other areas worth investigating"]
    }
  },

  "metadata": {
    "report_id": "uuid",
    "analysis_id": "uuid",
    "mode": "discovery",
    "generated_at": "ISO timestamp",
    "concepts_generated": 6,
    "concepts_recommended": 3,
    "primary_recommendation": "D-01",
    "novelty_confidence": "high|medium|low"
  }
}

REMEMBER: Output ONLY the JSON object. This is a DISCOVERY report - emphasize novelty and what's been missed.`;

/**
 * Zod schema for AN5-D output validation
 */
const HeaderSchema = z.object({
  report_id: z.string(),
  title: z.string(),
  mode: z.literal('discovery'),
  generated_at: z.string(),
  tagline: z.string(),
});

const DiscoveryBriefSchema = z.object({
  original_problem: z.string(),
  industry_blind_spot: z.string(),
  discovery_thesis: z.string(),
  hunting_grounds: z.array(z.string()),
  key_finding: z.string(),
});

const BlindSpotSchema = z.object({
  assumption: z.string(),
  challenge: z.string(),
  opportunity: z.string(),
});

const WhatIndustryMissedSchema = z.object({
  conventional_approaches: z.array(z.string()),
  why_they_do_it: z.string(),
  blind_spots: z.array(BlindSpotSchema),
  unexplored_territories: z.array(z.string()),
});

const InsightSchema = z.object({
  what_we_found: z.string(),
  why_its_new: z.string(),
  the_physics: z.string(),
});

const NoveltyClaimSchema = z.object({
  genuinely_novel: z.boolean(),
  novelty_level: z.enum(['breakthrough', 'significant', 'moderate']),
  not_same_as: z.string(),
});

const HowItWorksSchema = z.object({
  mechanism: z.string(),
  key_components: z.array(z.string()),
  enabling_factors: z.string(),
});

const BreakthroughPotentialSchema = z.object({
  if_works: z.string(),
  improvement: z.string(),
  industry_impact: z.string(),
});

const ValidationPathSchema = z.object({
  first_test: z.string(),
  go_no_go: z.string(),
  timeline: z.string(),
  cost: z.string(),
});

const RisksSchema = z.object({
  physics_risks: z.array(z.string()),
  implementation_challenges: z.array(z.string()),
  mitigation_ideas: z.array(z.string()),
});

const DiscoveryConceptReportSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum([
    'biological_transfer',
    'geological',
    'abandoned_tech',
    'frontier_material',
    'combination',
  ]),
  source_domain: z.string(),
  the_insight: InsightSchema,
  novelty_claim: NoveltyClaimSchema,
  how_it_works: HowItWorksSchema,
  breakthrough_potential: BreakthroughPotentialSchema,
  validation_path: ValidationPathSchema,
  risks_and_unknowns: RisksSchema,
  priority: z.enum([
    'must_pursue',
    'should_explore',
    'worth_investigating',
    'park',
  ]),
});

const ComparisonRowSchema = z.object({
  concept_id: z.string(),
  novelty_score: z.number(),
  physics_confidence: z.number(),
  breakthrough_potential: z.number(),
  testability: z.number(),
  overall_score: z.number(),
});

const ImmediateActionSchema = z.object({
  action: z.string(),
  concept: z.string(),
  timeline: z.string(),
  cost: z.string(),
  expected_outcome: z.string(),
});

const PhaseSchema = z.object({
  objective: z.string(),
  timeline: z.string(),
  budget: z.string(),
  go_no_go_gates: z.array(z.string()).optional(),
  prototype_scope: z.string().optional(),
  success_criteria: z.string().optional(),
});

const ExecutiveSummarySchema = z.object({
  one_liner: z.string(),
  key_discovery: z.string(),
  recommended_action: z.string(),
  timeline_to_validation: z.string(),
  investment_required: z.string(),
});

const ReportSchema = z.object({
  header: HeaderSchema,
  discovery_brief: DiscoveryBriefSchema,
  what_industry_missed: WhatIndustryMissedSchema,
  discovery_concepts: z.array(DiscoveryConceptReportSchema),
  comparative_analysis: z.object({
    ranking_by_novelty: z.array(z.string()),
    ranking_by_feasibility: z.array(z.string()),
    ranking_overall: z.array(z.string()),
    comparison_table: z.array(ComparisonRowSchema),
    portfolio_strategy: z.string(),
  }),
  validation_roadmap: z.object({
    immediate_actions: z.array(ImmediateActionSchema),
    phase_1: PhaseSchema,
    phase_2: PhaseSchema,
    phase_3: PhaseSchema,
  }),
  why_this_matters: z.object({
    if_we_succeed: z.string(),
    competitive_advantage: z.string(),
    industry_implications: z.string(),
    risk_of_not_pursuing: z.string(),
  }),
  executive_summary: ExecutiveSummarySchema,
  appendix: z.object({
    excluded_conventional_approaches: z.array(z.string()),
    methodology_notes: z.string(),
    sources_explored: z.array(z.string()),
    further_exploration_ideas: z.array(z.string()),
  }),
});

export const AN5_D_OutputSchema = z.object({
  report: ReportSchema,
  metadata: z.object({
    report_id: z.string(),
    analysis_id: z.string(),
    mode: z.literal('discovery'),
    generated_at: z.string(),
    concepts_generated: z.number(),
    concepts_recommended: z.number(),
    primary_recommendation: z.string(),
    novelty_confidence: z.enum(['high', 'medium', 'low']),
  }),
});

export type AN5_D_Output = z.infer<typeof AN5_D_OutputSchema>;
export type DiscoveryReport = z.infer<typeof ReportSchema>;

/**
 * AN5-D metadata for progress tracking
 */
export const AN5_D_METADATA = {
  id: 'an5-d',
  name: 'Discovery Report',
  description: 'Generating discovery-focused innovation report',
  estimatedMinutes: 3,
};
