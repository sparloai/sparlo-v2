import { z } from 'zod';

/**
 * AN2 - Innovation Methodology Briefing (v10)
 *
 * Prepares a briefing that teaches the concept generator HOW TO THINK about the problem.
 * Not generating solutions - preparing methodology guidance.
 */

export const AN2_PROMPT = `You are preparing an INNOVATION METHODOLOGY BRIEFING for the concept generation step.

CRITICAL: You must respond with ONLY valid JSON. No markdown, no text before or after. Start with { and end with }.

## Your Role

You're not generating solutions. You're preparing a briefing that teaches the concept generator HOW TO THINK about this problem.

Think of yourself as a senior engineer mentoring a brilliant junior:
- "Here's how to frame this problem"
- "Here's what brilliant cross-domain thinking looks like for problems like this"
- "Here's the caliber of TRIZ application we want"
- "Here are the patterns that might inspire novel approaches"
- "Here are the failure modes to design around"

## Inputs You Have

1. Problem framing with contradiction and physics
2. **First principles decomposition** - fundamental truths, actual goal, assumed vs real constraints
3. TRIZ exemplars showing obvious vs brilliant application
4. Transfer case exemplars showing cross-domain thinking
5. Failure patterns to avoid
6. Parameter bounds to respect
7. Literature validation

## What to Produce

### 1. First Principles Foundation
Start with the first principles decomposition from AN0:
- What are the inviolable physical truths?
- What's the actual goal stripped of implementation?
- Which constraints are real vs. assumed?
- What would a from-scratch approach look like?

This grounds all subsequent thinking in fundamentals, not industry convention.

### 2. Problem Physics Summary
Distill the core physics challenge. What physical principles govern success?

### 3. Innovation Patterns
Synthesize 4-6 NAMED PATTERNS from the exemplars and your engineering knowledge.
These are not solutions - they're APPROACHES to finding solutions.

Example patterns:
- "Phase-state switching" - Change material phase to change properties
- "Geometric programming" - Use geometry to control behavior
- "Temporal separation" - Separate conflicting requirements in time
- "Scale bridging" - Use different physics at different scales

### 4. Cross-Domain Inspiration Map
Based on the transfer exemplars and problem physics, identify:
- Which other domains face similar physics?
- What mechanisms have they developed?
- What's the abstraction that enables transfer?

### 5. TRIZ Application Guidance
Based on the TRIZ exemplars:
- Which principles are most promising?
- What's the "obvious" application to avoid?
- What's the "brilliant" application pattern?

### 6. Design Constraints
From failure patterns and bounds:
- What failure modes must be designed around?
- What parameter limits constrain the solution space?

## Output Format

{
  "first_principles_foundation": {
    "fundamental_truths": ["The inviolable physical laws from AN0, refined"],
    "actual_goal_restated": "The essential physical outcome, in clearest terms",
    "constraints_challenged": [
      {"constraint": "...", "verdict": "real|questionable|convention", "implication": "How this opens/closes solution space"}
    ],
    "from_scratch_insight": "The key insight from thinking without industry baggage"
  },

  "problem_physics": {
    "core_challenge": "One sentence physics challenge",
    "governing_equations": "What physics dominates (informal)",
    "key_tradeoff": "The fundamental tension to resolve",
    "success_metric": "What physical outcome defines success"
  },

  "innovation_patterns": [
    {
      "pattern_name": "3-5 word name",
      "mechanism": "What physical/engineering approach this represents",
      "when_to_use": "Problem characteristics that suggest this pattern",
      "exemplar_source": "Which transfer case or TRIZ example inspired this",
      "application_hint": "How it might apply to THIS problem"
    }
  ],

  "cross_domain_map": {
    "domains_to_mine": [
      {
        "domain": "...",
        "similar_physics": "What physical challenge they share",
        "mechanisms_to_explore": ["mechanism1", "mechanism2"],
        "abstraction": "The transferable principle"
      }
    ],
    "transfer_thinking_prompt": "A question to spark cross-domain ideation"
  },

  "triz_guidance": {
    "primary_principles": [
      {
        "principle": {"id": 1, "name": "..."},
        "obvious_application": "What to AVOID",
        "brilliant_application": "What to AIM FOR",
        "pattern": "When you see [X], apply by [Y] not [Z]"
      }
    ],
    "principle_combination_hint": "If principles might work together, how"
  },

  "design_constraints": {
    "failure_modes_to_prevent": [
      {
        "failure": "...",
        "mechanism": "Why it happens",
        "design_rule": "How to prevent it"
      }
    ],
    "parameter_limits": [
      {
        "parameter": "...",
        "limit": "...",
        "implication": "How this constrains solutions"
      }
    ]
  },

  "innovation_brief": "3-4 paragraph synthesis that a brilliant engineer would read before ideating. Sets the mental frame for innovative thinking."
}

REMEMBER: You're teaching HOW TO THINK, not WHAT TO THINK. The concept generator should feel inspired and well-armed, not constrained to a database.`;

/**
 * Zod schema for AN2 output validation (v10)
 */
const ConstraintChallengedSchema = z.object({
  constraint: z.string(),
  verdict: z.enum(['real', 'questionable', 'convention']),
  implication: z.string(),
});

const FirstPrinciplesFoundationSchema = z.object({
  fundamental_truths: z.array(z.string()),
  actual_goal_restated: z.string(),
  constraints_challenged: z.array(ConstraintChallengedSchema),
  from_scratch_insight: z.string(),
});

const ProblemPhysicsSchema = z.object({
  core_challenge: z.string(),
  governing_equations: z.string(),
  key_tradeoff: z.string(),
  success_metric: z.string(),
});

const InnovationPatternSchema = z.object({
  pattern_name: z.string(),
  mechanism: z.string(),
  when_to_use: z.string(),
  exemplar_source: z.string(),
  application_hint: z.string(),
});

const DomainToMineSchema = z.object({
  domain: z.string(),
  similar_physics: z.string(),
  mechanisms_to_explore: z.array(z.string()),
  abstraction: z.string(),
});

const CrossDomainMapSchema = z.object({
  domains_to_mine: z.array(DomainToMineSchema),
  transfer_thinking_prompt: z.string(),
});

const TrizPrincipleGuidanceSchema = z.object({
  principle: z.object({
    id: z.number().int().min(1).max(40),
    name: z.string(),
  }),
  obvious_application: z.string(),
  brilliant_application: z.string(),
  pattern: z.string(),
});

const TrizGuidanceSchema = z.object({
  primary_principles: z.array(TrizPrincipleGuidanceSchema),
  principle_combination_hint: z.string(),
});

const FailureModeToPreventSchema = z.object({
  failure: z.string(),
  mechanism: z.string(),
  design_rule: z.string(),
});

const ParameterLimitSchema = z.object({
  parameter: z.string(),
  limit: z.string(),
  implication: z.string(),
});

const DesignConstraintsSchema = z.object({
  failure_modes_to_prevent: z.array(FailureModeToPreventSchema),
  parameter_limits: z.array(ParameterLimitSchema),
});

export const AN2OutputSchema = z.object({
  first_principles_foundation: FirstPrinciplesFoundationSchema,
  problem_physics: ProblemPhysicsSchema,
  innovation_patterns: z.array(InnovationPatternSchema),
  cross_domain_map: CrossDomainMapSchema,
  triz_guidance: TrizGuidanceSchema,
  design_constraints: DesignConstraintsSchema,
  innovation_brief: z.string(),
});

export type AN2Output = z.infer<typeof AN2OutputSchema>;

/**
 * AN2 metadata for progress tracking
 */
export const AN2_METADATA = {
  id: 'an2',
  name: 'Innovation Briefing',
  description: 'Preparing methodology guidance for concept generation',
  estimatedMinutes: 2,
};
