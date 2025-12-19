import { z } from 'zod';

/**
 * AN2-D - Discovery Mode Methodology Briefing
 *
 * Prepares the concept generator with:
 * - Physics foundation (what MUST be true)
 * - Non-obvious thinking patterns
 * - Cross-domain transfer strategies
 * - Novelty-first evaluation criteria
 */

export const AN2_D_PROMPT = `You are preparing a DISCOVERY-MODE methodology briefing.

## CRITICAL MISSION

You are preparing the concept generator to think DIFFERENTLY. This briefing teaches:
1. How to COMBINE insights from non-obvious domains
2. How to CHALLENGE industry assumptions
3. How to PRIORITIZE novelty while maintaining physics validity
4. How to AVOID falling back into conventional thinking

## Input Context

You will receive:
- Discovery problem framing (with physics essence and blind spots)
- Teaching exemplars from non-obvious domains
- Literature gaps and abandoned approaches

CRITICAL: You must respond with ONLY valid JSON. No markdown, no text before or after. Start with { and end with }.

## Output Format

{
  "physics_foundation": {
    "inviolable_laws": ["Physical law that MUST be respected"],
    "design_space_boundaries": ["Hard limits on what's physically possible"],
    "performance_equations": ["Key equations that govern success"],
    "scaling_relationships": ["How performance scales with parameters"]
  },

  "innovation_patterns_to_apply": [
    {
      "pattern_name": "Name of thinking pattern",
      "description": "How to apply it",
      "exemplar_source": "Which teaching example demonstrates this",
      "application_guidance": "Specific guidance for this problem"
    }
  ],

  "cross_domain_transfer_map": {
    "from_biology": {
      "transferable_principles": ["Principle 1", "Principle 2"],
      "adaptation_needed": "How to adapt for engineering context",
      "combination_opportunities": ["What it could combine with"]
    },
    "from_geology": {
      "transferable_principles": ["Principle 1", "Principle 2"],
      "adaptation_needed": "How to adapt",
      "combination_opportunities": ["Combinations"]
    },
    "from_abandoned_tech": {
      "revival_candidates": ["Tech 1", "Tech 2"],
      "modernization_approach": "How to update for current capabilities",
      "combination_opportunities": ["Combinations"]
    },
    "from_frontier_materials": {
      "enabling_materials": ["Material 1", "Material 2"],
      "novel_architectures": "New designs these enable",
      "combination_opportunities": ["Combinations"]
    }
  },

  "assumption_challenges": [
    {
      "industry_assumption": "What industry assumes",
      "challenge": "Why this might not be true/necessary",
      "alternative_frame": "Different way to think about it",
      "exploration_direction": "What concepts this opens up"
    }
  ],

  "novelty_first_criteria": {
    "evaluation_order": [
      "1. Is this actually NOVEL (not an optimization of known approach)?",
      "2. Does it violate physics? (reject if yes)",
      "3. Is the mechanism genuinely different?",
      "4. Could this be a breakthrough if it works?"
    ],
    "novelty_markers": ["What makes something genuinely novel"],
    "disguised_conventional": ["Red flags that something is conventional in disguise"],
    "acceptable_risk_level": "How much physics uncertainty is acceptable for high novelty"
  },

  "concept_generation_guidance": {
    "must_explore": ["Direction 1 that MUST be explored", "Direction 2"],
    "combination_prompts": [
      "What if we combined [biology X] with [abandoned tech Y]?",
      "What if we used [frontier material Z] to enable [geological process W]?"
    ],
    "inversion_prompts": [
      "What if instead of [conventional approach], we [opposite]?",
      "What if the [assumed constraint] didn't exist?"
    ],
    "scale_shift_prompts": [
      "What if we worked at [different scale]?",
      "What if we parallelized [serial process]?"
    ]
  },

  "validation_approach": {
    "physics_check_order": ["First check", "Second check", "Third check"],
    "acceptable_uncertainty": "What level of physics uncertainty is OK for discovery",
    "failure_modes_to_anticipate": ["Failure mode 1", "Failure mode 2"],
    "kill_criteria": ["What would immediately disqualify a concept"]
  },

  "briefing_summary": {
    "key_insight": "The single most important insight for concept generation",
    "primary_hunting_ground": "Where the best novel concepts likely lie",
    "combination_hypothesis": "Best combination of non-obvious elements",
    "expected_breakthrough_type": "What kind of breakthrough we're hunting for"
  }
}

REMEMBER: Output ONLY the JSON object. This briefing shapes how concepts are generated.`;

/**
 * Zod schema for AN2-D output validation
 */
const PhysicsFoundationSchema = z.object({
  inviolable_laws: z.array(z.string()),
  design_space_boundaries: z.array(z.string()),
  performance_equations: z.array(z.string()),
  scaling_relationships: z.array(z.string()),
});

const InnovationPatternSchema = z.object({
  pattern_name: z.string(),
  description: z.string(),
  exemplar_source: z.string(),
  application_guidance: z.string(),
});

const DomainTransferSchema = z.object({
  transferable_principles: z.array(z.string()).optional(),
  revival_candidates: z.array(z.string()).optional(),
  enabling_materials: z.array(z.string()).optional(),
  adaptation_needed: z.string().optional(),
  modernization_approach: z.string().optional(),
  novel_architectures: z.string().optional(),
  combination_opportunities: z.array(z.string()),
});

const AssumptionChallengeSchema = z.object({
  industry_assumption: z.string(),
  challenge: z.string(),
  alternative_frame: z.string(),
  exploration_direction: z.string(),
});

const NoveltyFirstCriteriaSchema = z.object({
  evaluation_order: z.array(z.string()),
  novelty_markers: z.array(z.string()),
  disguised_conventional: z.array(z.string()),
  acceptable_risk_level: z.string(),
});

const ConceptGenerationGuidanceSchema = z.object({
  must_explore: z.array(z.string()),
  combination_prompts: z.array(z.string()),
  inversion_prompts: z.array(z.string()),
  scale_shift_prompts: z.array(z.string()),
});

const ValidationApproachSchema = z.object({
  physics_check_order: z.array(z.string()),
  acceptable_uncertainty: z.string(),
  failure_modes_to_anticipate: z.array(z.string()),
  kill_criteria: z.array(z.string()),
});

const BriefingSummarySchema = z.object({
  key_insight: z.string(),
  primary_hunting_ground: z.string(),
  combination_hypothesis: z.string(),
  expected_breakthrough_type: z.string(),
});

export const AN2_D_OutputSchema = z.object({
  physics_foundation: PhysicsFoundationSchema,
  innovation_patterns_to_apply: z.array(InnovationPatternSchema),
  cross_domain_transfer_map: z.object({
    from_biology: DomainTransferSchema,
    from_geology: DomainTransferSchema,
    from_abandoned_tech: DomainTransferSchema,
    from_frontier_materials: DomainTransferSchema,
  }),
  assumption_challenges: z.array(AssumptionChallengeSchema),
  novelty_first_criteria: NoveltyFirstCriteriaSchema,
  concept_generation_guidance: ConceptGenerationGuidanceSchema,
  validation_approach: ValidationApproachSchema,
  briefing_summary: BriefingSummarySchema,
});

export type AN2_D_Output = z.infer<typeof AN2_D_OutputSchema>;

/**
 * AN2-D metadata for progress tracking
 */
export const AN2_D_METADATA = {
  id: 'an2-d',
  name: 'Discovery Methodology Briefing',
  description: 'Preparing novelty-first concept generation guidance',
  estimatedMinutes: 2,
};
