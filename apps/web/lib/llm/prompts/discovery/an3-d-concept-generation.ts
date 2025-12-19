import { z } from 'zod';

/**
 * AN3-D - Discovery Mode Novel Concept Generation
 *
 * Generates NOVEL concepts by:
 * 1. Drawing from non-obvious domains (biology, geology, abandoned tech, frontier materials)
 * 2. Combining insights in unexpected ways
 * 3. REJECTING optimizations of conventional approaches
 * 4. Prioritizing breakthrough potential over incremental improvement
 */

export const AN3_D_PROMPT = `You are a DISCOVERY-MODE concept generator hunting for NOVEL solutions.

## CRITICAL MISSION

You MUST generate concepts that are:
1. **GENUINELY NOVEL** - Not optimizations of conventional approaches
2. **PHYSICS-VALID** - Must not violate fundamental physics
3. **FROM NON-OBVIOUS SOURCES** - Biology, geology, abandoned tech, frontier materials
4. **BREAKTHROUGH-ORIENTED** - High risk but high reward

## WHAT TO AVOID

REJECT concepts that are:
- Incremental improvements to known approaches
- Standard industry solutions with minor variations
- Optimizations of conventional designs
- "Better versions" of existing technology

## WHAT TO GENERATE

GENERATE concepts that:
- Transfer mechanisms from unexpected domains
- Combine insights from multiple non-obvious sources
- Revive abandoned approaches with modern capabilities
- Use frontier materials to enable new architectures
- Challenge fundamental assumptions

## Concept Categories

Generate AT LEAST 6 concepts across these categories:

### Category 1: BIOLOGICAL TRANSFER (2+ concepts)
Transfer mechanisms from biology that haven't been applied:
- Countercurrent exchange systems
- Phase change in biological systems
- Self-organizing thermal structures
- Adaptive surface mechanisms

### Category 2: GEOLOGICAL/PHYSICAL PHENOMENA (1+ concept)
Apply geological or physical phenomena:
- Natural convection systems
- Mineral phase transitions
- Pressure-driven flow

### Category 3: ABANDONED TECHNOLOGY REVIVAL (1+ concept)
Revive technologies that were abandoned:
- Why was it abandoned?
- What has changed?
- How could it work now?

### Category 4: FRONTIER MATERIAL ENABLERS (1+ concept)
Use new materials to enable architectures that weren't possible before

### Category 5: WILD CARD / COMBINATION (1+ concept)
Combine 2+ non-obvious elements in an unexpected way

CRITICAL: You must respond with ONLY valid JSON. No markdown, no text before or after. Start with { and end with }.

## Output Format

{
  "generation_approach": {
    "primary_hunting_grounds": ["Where we looked for inspiration"],
    "combination_strategy": "How we combined non-obvious elements",
    "conventional_approaches_excluded": ["What we deliberately avoided"]
  },

  "discovery_concepts": [
    {
      "id": "D-01",
      "name": "Concept name",
      "category": "biological_transfer|geological_physical|abandoned_revival|frontier_material|combination",
      "source_domain": "Where the core idea comes from",

      "core_mechanism": {
        "principle": "The underlying physics/mechanism",
        "how_it_works": "Step-by-step explanation",
        "why_novel": "Why this hasn't been tried"
      },

      "novelty_claim": {
        "what_is_new": "What makes this genuinely novel",
        "not_same_as": "How this differs from conventional approaches",
        "novelty_level": "breakthrough|significant|moderate"
      },

      "physics_validation": {
        "governing_physics": "What physics principles apply",
        "feasibility_assessment": "Why this should work physically",
        "key_uncertainties": ["What we don't know yet"],
        "physics_risk_level": "low|medium|high"
      },

      "transfer_details": {
        "from_domain": "Source domain",
        "original_context": "How it works in source domain",
        "adaptation_required": "What needs to change for target domain",
        "combination_elements": ["Other elements this combines with"]
      },

      "implementation_sketch": {
        "key_components": ["Component 1", "Component 2"],
        "critical_interfaces": ["Interface 1", "Interface 2"],
        "enabling_technologies": ["What's needed to make this work"],
        "scale_considerations": "How this scales"
      },

      "breakthrough_potential": {
        "if_works": "What this achieves if successful",
        "improvement_over_conventional": "How much better than industry standard",
        "risk_reward_assessment": "High risk but high reward because..."
      },

      "testability": {
        "first_validation_test": "Cheapest/fastest way to test core hypothesis",
        "go_no_go_criteria": "What would prove/disprove feasibility",
        "prototype_complexity": "simple|moderate|complex"
      }
    }
  ],

  "concept_combinations": [
    {
      "concepts_combined": ["D-01", "D-03"],
      "combination_name": "Name for combined concept",
      "synergy": "Why these work better together",
      "additional_novelty": "What new emerges from combination"
    }
  ],

  "generation_summary": {
    "total_concepts": 6,
    "by_category": {
      "biological_transfer": 2,
      "geological_physical": 1,
      "abandoned_revival": 1,
      "frontier_material": 1,
      "combination": 1
    },
    "highest_novelty_concepts": ["D-01", "D-05"],
    "highest_feasibility_concepts": ["D-02", "D-04"],
    "recommended_exploration_order": ["D-01", "D-03", "D-05"]
  }
}

REMEMBER: Output ONLY the JSON object. NOVELTY is the priority. Reject conventional thinking.`;

/**
 * Zod schema for AN3-D output validation
 */
const CoreMechanismSchema = z.object({
  principle: z.string(),
  how_it_works: z.string(),
  why_novel: z.string(),
});

const NoveltyClaimSchema = z.object({
  what_is_new: z.string(),
  not_same_as: z.string(),
  novelty_level: z.enum(['breakthrough', 'significant', 'moderate']),
});

const PhysicsValidationSchema = z.object({
  governing_physics: z.string(),
  feasibility_assessment: z.string(),
  key_uncertainties: z.array(z.string()),
  physics_risk_level: z.enum(['low', 'medium', 'high']),
});

const TransferDetailsSchema = z.object({
  from_domain: z.string(),
  original_context: z.string(),
  adaptation_required: z.string(),
  combination_elements: z.array(z.string()),
});

const ImplementationSketchSchema = z.object({
  key_components: z.array(z.string()),
  critical_interfaces: z.array(z.string()),
  enabling_technologies: z.array(z.string()),
  scale_considerations: z.string(),
});

const BreakthroughPotentialSchema = z.object({
  if_works: z.string(),
  improvement_over_conventional: z.string(),
  risk_reward_assessment: z.string(),
});

const TestabilitySchema = z.object({
  first_validation_test: z.string(),
  go_no_go_criteria: z.string(),
  prototype_complexity: z.enum(['simple', 'moderate', 'complex']),
});

const DiscoveryConceptSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum([
    'biological_transfer',
    'geological_physical',
    'abandoned_revival',
    'frontier_material',
    'combination',
  ]),
  source_domain: z.string(),
  core_mechanism: CoreMechanismSchema,
  novelty_claim: NoveltyClaimSchema,
  physics_validation: PhysicsValidationSchema,
  transfer_details: TransferDetailsSchema,
  implementation_sketch: ImplementationSketchSchema,
  breakthrough_potential: BreakthroughPotentialSchema,
  testability: TestabilitySchema,
});

const ConceptCombinationSchema = z.object({
  concepts_combined: z.array(z.string()),
  combination_name: z.string(),
  synergy: z.string(),
  additional_novelty: z.string(),
});

const GenerationSummarySchema = z.object({
  total_concepts: z.number(),
  by_category: z.object({
    biological_transfer: z.number(),
    geological_physical: z.number(),
    abandoned_revival: z.number(),
    frontier_material: z.number(),
    combination: z.number(),
  }),
  highest_novelty_concepts: z.array(z.string()),
  highest_feasibility_concepts: z.array(z.string()),
  recommended_exploration_order: z.array(z.string()),
});

export const AN3_D_OutputSchema = z.object({
  generation_approach: z.object({
    primary_hunting_grounds: z.array(z.string()),
    combination_strategy: z.string(),
    conventional_approaches_excluded: z.array(z.string()),
  }),
  discovery_concepts: z.array(DiscoveryConceptSchema),
  concept_combinations: z.array(ConceptCombinationSchema),
  generation_summary: GenerationSummarySchema,
});

export type AN3_D_Output = z.infer<typeof AN3_D_OutputSchema>;
export type DiscoveryConcept = z.infer<typeof DiscoveryConceptSchema>;

/**
 * AN3-D metadata for progress tracking
 */
export const AN3_D_METADATA = {
  id: 'an3-d',
  name: 'Discovery Concept Generation',
  description: 'Generating novel concepts from non-obvious domains',
  estimatedMinutes: 4,
};
