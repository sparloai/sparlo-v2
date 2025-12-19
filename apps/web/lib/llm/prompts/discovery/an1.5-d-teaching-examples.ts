import { z } from 'zod';

/**
 * AN1.5-D - Discovery Mode Teaching Example Selection
 *
 * Selects exemplars from NON-OBVIOUS domains to guide discovery.
 * Prioritizes examples from biology, geology, abandoned tech, frontier materials.
 */

export const AN1_5_D_PROMPT = `You are selecting TEACHING EXAMPLES for DISCOVERY MODE concept generation.

## CRITICAL MISSION

Your job is to select the MOST INSTRUCTIVE examples from NON-OBVIOUS domains.
These examples will teach the concept generator HOW TO THINK about the problem differently.

## Selection Criteria

Prioritize examples that:
1. Come from UNEXPECTED domains (biology, geology, abandoned tech, frontier materials)
2. Demonstrate PRINCIPLES that could transfer (not just similar applications)
3. Show how nature/other fields solved SIMILAR PHYSICS challenges
4. Reveal MECHANISMS that the target industry hasn't explored

## Input Context

You will receive:
- Problem framing from discovery analysis
- Corpus retrieval results (if available)
- Discovery territory hints

CRITICAL: You must respond with ONLY valid JSON. No markdown, no text before or after. Start with { and end with }.

## Output Format

{
  "exemplar_selection": {
    "biological_exemplars": [
      {
        "organism_or_system": "Name of biological system",
        "mechanism": "How it works",
        "physics_principle": "Underlying physics that transfers",
        "why_instructive": "What it teaches about the problem",
        "transfer_insight": "How this could apply to the target problem"
      }
    ],
    "geological_exemplars": [
      {
        "phenomenon": "Geological process or structure",
        "mechanism": "How it works",
        "physics_principle": "Underlying physics",
        "why_instructive": "What it teaches",
        "transfer_insight": "How this could apply"
      }
    ],
    "abandoned_tech_exemplars": [
      {
        "technology": "Name of abandoned technology",
        "original_era": "When it was used",
        "why_abandoned": "Original reasons for abandonment",
        "mechanism": "How it worked",
        "what_changed": "Why conditions might be different now",
        "revival_potential": "How it might be adapted for current problem"
      }
    ],
    "frontier_material_exemplars": [
      {
        "material": "Material name",
        "enabling_property": "Key property for this problem",
        "current_status": "Research/commercial status",
        "application_concept": "How it could be applied",
        "barriers_to_explore": "What needs to be solved"
      }
    ],
    "industrial_process_exemplars": [
      {
        "process": "Industrial process name",
        "industry": "Source industry",
        "mechanism": "How it handles similar physics",
        "scale_difference": "How scale differs from target problem",
        "transfer_concept": "What principle might transfer"
      }
    ]
  },

  "cross_pollination_insights": [
    {
      "from_domain": "Source domain",
      "principle": "Transferable principle",
      "application_sketch": "How it might apply to target problem",
      "novelty_level": "high|medium|low"
    }
  ],

  "innovation_guidance": {
    "promising_directions": ["Direction 1", "Direction 2"],
    "mechanisms_to_explore": ["Mechanism 1", "Mechanism 2"],
    "combinations_to_try": ["Combine X from biology with Y from abandoned tech"],
    "what_industry_missed": "Why these approaches weren't explored"
  },

  "failure_patterns_to_avoid": [
    {
      "pattern": "Common failure mode",
      "from_exemplar": "Which example teaches this",
      "how_to_avoid": "Design consideration"
    }
  ],

  "parameter_bounds_discovered": [
    {
      "parameter": "Physical parameter",
      "bound": "Known limit",
      "source": "Which exemplar revealed this",
      "implication": "What this means for solution space"
    }
  ]
}

REMEMBER: Output ONLY the JSON object. Focus on NON-OBVIOUS exemplars that teach new ways of thinking.`;

/**
 * Zod schema for AN1.5-D output validation
 */
const BiologicalExemplarSchema = z.object({
  organism_or_system: z.string(),
  mechanism: z.string(),
  physics_principle: z.string().optional().default(''),
  why_instructive: z.string().optional().default(''),
  transfer_insight: z.string().optional().default(''),
});

const GeologicalExemplarSchema = z.object({
  phenomenon: z.string(),
  mechanism: z.string(),
  physics_principle: z.string().optional().default(''),
  why_instructive: z.string().optional().default(''),
  transfer_insight: z.string().optional().default(''),
});

const AbandonedTechExemplarSchema = z.object({
  technology: z.string(),
  original_era: z.string().optional().default(''),
  why_abandoned: z.string().optional().default(''),
  mechanism: z.string().optional().default(''),
  what_changed: z.string().optional().default(''),
  revival_potential: z.string().optional().default(''),
});

const FrontierMaterialExemplarSchema = z.object({
  material: z.string(),
  enabling_property: z.string().optional().default(''),
  current_status: z.string().optional().default(''),
  application_concept: z.string().optional().default(''),
  barriers_to_explore: z.string().optional().default(''),
});

const IndustrialProcessExemplarSchema = z.object({
  process: z.string(),
  industry: z.string().optional().default(''),
  mechanism: z.string().optional().default(''),
  scale_difference: z.string().optional().default(''),
  transfer_concept: z.string().optional().default(''),
});

const CrossPollinationInsightSchema = z.object({
  from_domain: z.string(),
  principle: z.string().optional().default(''),
  application_sketch: z.string().optional().default(''),
  novelty_level: z.enum(['high', 'medium', 'low']).optional().default('medium'),
});

const InnovationGuidanceSchema = z.object({
  promising_directions: z.array(z.string()).optional().default([]),
  mechanisms_to_explore: z.array(z.string()).optional().default([]),
  combinations_to_try: z.array(z.string()).optional().default([]),
  what_industry_missed: z.string().optional().default(''),
});

const FailurePatternSchema = z.object({
  pattern: z.string(),
  from_exemplar: z.string().optional().default(''),
  how_to_avoid: z.string().optional().default(''),
});

const ParameterBoundSchema = z.object({
  parameter: z.string(),
  bound: z.string().optional().default(''),
  source: z.string().optional().default(''),
  implication: z.string().optional().default(''),
});

export const AN1_5_D_OutputSchema = z.object({
  exemplar_selection: z.object({
    biological_exemplars: z.array(BiologicalExemplarSchema).optional().default([]),
    geological_exemplars: z.array(GeologicalExemplarSchema).optional().default([]),
    abandoned_tech_exemplars: z.array(AbandonedTechExemplarSchema).optional().default([]),
    frontier_material_exemplars: z.array(FrontierMaterialExemplarSchema).optional().default([]),
    industrial_process_exemplars: z.array(IndustrialProcessExemplarSchema).optional().default([]),
  }),
  cross_pollination_insights: z.array(CrossPollinationInsightSchema).optional().default([]),
  innovation_guidance: InnovationGuidanceSchema.optional().default({
    promising_directions: [],
    mechanisms_to_explore: [],
    combinations_to_try: [],
    what_industry_missed: '',
  }),
  failure_patterns_to_avoid: z.array(FailurePatternSchema).optional().default([]),
  parameter_bounds_discovered: z.array(ParameterBoundSchema).optional().default([]),
});

export type AN1_5_D_Output = z.infer<typeof AN1_5_D_OutputSchema>;

/**
 * AN1.5-D metadata for progress tracking
 */
export const AN1_5_D_METADATA = {
  id: 'an1.5-d',
  name: 'Discovery Teaching Selection',
  description: 'Selecting non-obvious exemplars for discovery guidance',
  estimatedMinutes: 2,
};
