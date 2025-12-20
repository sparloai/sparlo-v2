import { z } from 'zod';

/**
 * AN0-D - Discovery Mode Problem Framing
 *
 * Modified TRIZ-trained design strategist that:
 * 1. Extracts core problem and success metrics
 * 2. Identifies what industry ALREADY does (to EXCLUDE)
 * 3. Frames problem physics for non-obvious domain hunting
 * 4. Seeds exploration in biology, geology, abandoned tech, frontier materials
 */

// GPU Thermal Management hardcoded exclusions (to be generalized later)
export const GPU_THERMAL_EXCLUSIONS = {
  conventional_approaches: [
    'Air cooling with heatsinks and fans',
    'Direct-to-chip liquid cooling with cold plates',
    'Rear-door heat exchangers',
    'Standard immersion cooling (fluorocarbons)',
    'Two-phase cooling with standard refrigerants',
    'Vapor chambers',
    'Heat pipes (standard)',
    'Thermoelectric cooling',
  ],
  industry_domains_to_exclude: [
    'Aerospace thermal (widely explored)',
    'Automotive cooling',
    'Nuclear reactor cooling',
    'LED thermal management',
    'Power electronics cooling',
    'Standard HVAC',
    'Consumer electronics cooling',
  ],
  patents_to_exclude: [
    'Cold plate variations',
    'Microchannel improvements',
    'TIM material patents',
    'Standard heat pipe designs',
  ],
};

export const GPU_THERMAL_DISCOVERY_TERRITORIES = {
  biology: [
    'Countercurrent heat exchange (fish gills, penguin flippers)',
    'Evaporative cooling (elephants, kangaroos)',
    'Metabolic heat buffering (hibernation)',
    'Blood vessel dilation/constriction control',
    'Insect thermoregulation (desert beetles)',
  ],
  geology: [
    'Geothermal gradients and natural convection',
    'Mineral phase transitions for thermal buffering',
    'Volcanic heat dissipation mechanisms',
    'Deep ocean thermal vents',
    'Permafrost thermal stability',
  ],
  abandoned_tech: [
    'Thermosiphons (passive, gravity-driven)',
    'Absorption cooling (ammonia-water cycles)',
    'Stirling engine heat pumps',
    'Magnetocaloric cooling (abandoned for different reasons)',
    'Electrohydrodynamic cooling (EHD)',
  ],
  frontier_materials: [
    'Phase change materials (high latent heat)',
    'Thermal diodes (directional heat flow)',
    'Phononic crystals',
    'Graphene and carbon nanotube arrays',
    'Metal-organic frameworks for adsorption cooling',
  ],
  industrial_processes: [
    'Steel quenching techniques',
    'Glass tempering methods',
    'Chemical reactor cooling',
    'Cryogenic processing',
    'Industrial heat recovery',
  ],
};

export const AN0_D_PROMPT = `You are a DISCOVERY-MODE design strategist hunting for non-obvious solutions.

## CRITICAL MISSION

Your job is DIFFERENT from standard analysis. You must:
1. UNDERSTAND the problem physics deeply
2. EXPLICITLY EXCLUDE industry-standard approaches
3. HUNT in non-obvious domains for transferable principles
4. IDENTIFY what the industry has OVERLOOKED

## Domain Context

You are analyzing the problem in DISCOVERY MODE. This means:
- We already KNOW what the industry does (conventional approaches)
- We want to find what EVERYONE HAS MISSED
- We prioritize NOVELTY while maintaining physics validity
- We hunt in: biology, geology, abandoned technologies, frontier materials, unusual industrial processes

## INDUSTRY EXCLUSION LIST

The following approaches are EXCLUDED from consideration (we already know them):
${JSON.stringify(GPU_THERMAL_EXCLUSIONS.conventional_approaches, null, 2)}

These domains are DEPRIORITIZED (too well-explored):
${JSON.stringify(GPU_THERMAL_EXCLUSIONS.industry_domains_to_exclude, null, 2)}

## DISCOVERY TERRITORIES TO HUNT

Instead, ACTIVELY explore:

**BIOLOGY:**
${GPU_THERMAL_DISCOVERY_TERRITORIES.biology.map((t) => `- ${t}`).join('\n')}

**GEOLOGY:**
${GPU_THERMAL_DISCOVERY_TERRITORIES.geology.map((t) => `- ${t}`).join('\n')}

**ABANDONED TECHNOLOGIES:**
${GPU_THERMAL_DISCOVERY_TERRITORIES.abandoned_tech.map((t) => `- ${t}`).join('\n')}

**FRONTIER MATERIALS:**
${GPU_THERMAL_DISCOVERY_TERRITORIES.frontier_materials.map((t) => `- ${t}`).join('\n')}

**INDUSTRIAL PROCESSES (non-electronics):**
${GPU_THERMAL_DISCOVERY_TERRITORIES.industrial_processes.map((t) => `- ${t}`).join('\n')}

## Your Analysis Process

CRITICAL: You must respond with ONLY valid JSON. No markdown, no text before or after. Start with { and end with }.

1. **UNDERSTAND THE PHYSICS** - What are the fundamental heat transfer challenges?
2. **MAP THE GAP** - What has the industry NOT tried? Why might they have overlooked it?
3. **HUNT FOR ANALOGUES** - Where else in nature/industry do similar physics challenges exist?
4. **GENERATE DISCOVERY QUERIES** - What should we search for in non-obvious domains?

## PRIOR ART SEARCH REQUIREMENT

You have access to web search capabilities via SerpAPI. USE THEM.

RULE: No source URL = no claim. Every factual assertion about industry state, prior art, or gaps must cite where you found it.

CRITICAL: For every company/approach you list as "active," you must have a SOURCE URL.
If you cannot cite where you learned this, do not include it.

## Output Format

{
  "need_question": false,
  "original_ask": "User's problem in their words",
  "problem_interpretation": "Core physics challenge stripped of industry assumptions",

  "physics_essence": {
    "heat_flux": "W/cm² or W/m² challenge",
    "temperature_budget": "ΔT available from source to sink",
    "thermal_resistance_target": "Target °C/W",
    "governing_equations": ["Key heat transfer equations that constrain solutions"],
    "rate_limiting_physics": "What physical mechanism limits performance"
  },

  "industry_blind_spots": [
    {
      "what_industry_assumes": "Assumption industry makes",
      "why_it_might_be_wrong": "Challenge to assumption",
      "alternative_approach": "What they haven't tried"
    }
  ],

  "excluded_approaches": {
    "conventional": ["Listed conventional approaches we're excluding"],
    "reason_for_exclusion": "We want novel solutions, not optimizations"
  },

  "discovery_territories": {
    "biology": {
      "relevant_mechanisms": ["Biological mechanisms with similar physics"],
      "why_relevant": "Connection to problem physics",
      "search_queries": ["Queries to find biological analogues"]
    },
    "geology": {
      "relevant_mechanisms": ["Geological phenomena with similar physics"],
      "why_relevant": "Connection to problem physics",
      "search_queries": ["Queries to find geological analogues"]
    },
    "abandoned_tech": {
      "relevant_mechanisms": ["Abandoned technologies worth revisiting"],
      "why_abandoned": "Original reason for abandonment",
      "why_reconsider": "Why conditions may have changed",
      "search_queries": ["Queries to find abandoned approaches"]
    },
    "frontier_materials": {
      "relevant_materials": ["Novel materials that could enable new approaches"],
      "enabling_property": "What property makes them interesting",
      "search_queries": ["Queries to find frontier material applications"]
    },
    "industrial_processes": {
      "relevant_processes": ["Industrial processes with similar heat management"],
      "transferable_principles": "What might transfer",
      "search_queries": ["Queries to find industrial analogues"]
    }
  },

  "first_principles_reframe": {
    "actual_goal": "What we REALLY need (physics terms only)",
    "assumed_constraints_to_challenge": [
      {"constraint": "What's assumed fixed", "challenge": "Why it might not be"}
    ],
    "if_solving_fresh": "What would you try if you'd never seen existing solutions?"
  },

  "discovery_queries": {
    "biology_search": ["Specific queries for biological mechanisms"],
    "geology_search": ["Specific queries for geological phenomena"],
    "abandoned_tech_search": ["Specific queries for forgotten technologies"],
    "frontier_materials_search": ["Specific queries for novel materials"],
    "industrial_search": ["Specific queries for industrial processes"],
    "gap_literature_search": ["Queries to find what's MISSING in literature"]
  },

  "industry_landscape": {
    "searches_executed": [
      {"query": "exact search query you ran", "top_results": ["result 1 title + URL", "result 2 title + URL"], "key_finding": "what this told us"}
    ],
    "active_players": [
      {"entity": "company or research group name", "approach": "what they're doing", "source": "URL where you found this", "why_excluded": "reason we're excluding this from our discovery"}
    ],
    "market_state": "Brief summary of current industry approaches based on search results",
    "search_gaps": ["Areas where searches returned few/no relevant results - potential opportunities"]
  },

  "novelty_hypothesis": "What specific non-obvious approach seems most promising and why"
}

If you need clarification:
{
  "need_question": true,
  "question": "Your single clarifying question",
  "what_you_understood": "Summary of what you know so far"
}

REMEMBER: Output ONLY the JSON object. No markdown, no preamble. We want DISCOVERY, not optimization of known approaches.`;

/**
 * Zod schema for AN0-D output validation
 */
const PhysicsEssenceSchema = z.object({
  heat_flux: z.string(),
  temperature_budget: z.string(),
  thermal_resistance_target: z.string(),
  governing_equations: z.array(z.string()),
  rate_limiting_physics: z.string(),
});

const BlindSpotSchema = z.object({
  what_industry_assumes: z.string(),
  why_it_might_be_wrong: z.string(),
  alternative_approach: z.string(),
});

const ExcludedApproachesSchema = z.object({
  conventional: z.array(z.string()),
  reason_for_exclusion: z.string(),
});

const TerritorySchema = z.object({
  relevant_mechanisms: z.array(z.string()).optional(),
  relevant_materials: z.array(z.string()).optional(),
  relevant_processes: z.array(z.string()).optional(),
  why_relevant: z.string().optional(),
  why_abandoned: z.string().optional(),
  why_reconsider: z.string().optional(),
  enabling_property: z.string().optional(),
  transferable_principles: z.string().optional(),
  search_queries: z.array(z.string()),
});

const FirstPrinciplesReframeSchema = z.object({
  actual_goal: z.string(),
  assumed_constraints_to_challenge: z.array(
    z.object({
      constraint: z.string(),
      challenge: z.string(),
    }),
  ),
  if_solving_fresh: z.string(),
});

const DiscoveryQueriesSchema = z.object({
  biology_search: z.array(z.string()),
  geology_search: z.array(z.string()),
  abandoned_tech_search: z.array(z.string()),
  frontier_materials_search: z.array(z.string()),
  industrial_search: z.array(z.string()),
  gap_literature_search: z.array(z.string()),
});

const SearchExecutedSchema = z
  .object({
    query: z.string(),
    top_results: z.array(z.string()).catch([]),
    key_finding: z.string().optional(),
  })
  .passthrough();

const ActivePlayerSchema = z
  .object({
    entity: z.string(),
    approach: z.string().optional(),
    source: z.string(),
    why_excluded: z.string().optional(),
  })
  .passthrough();

const IndustryLandscapeSchema = z
  .object({
    searches_executed: z.array(SearchExecutedSchema).catch([]),
    active_players: z.array(ActivePlayerSchema).catch([]),
    market_state: z.string().optional(),
    search_gaps: z.array(z.string()).catch([]),
  })
  .passthrough();

// Full analysis output schema
const AN0DAnalysisSchema = z.object({
  need_question: z.literal(false),
  original_ask: z.string(),
  problem_interpretation: z.string(),
  physics_essence: PhysicsEssenceSchema,
  industry_blind_spots: z.array(BlindSpotSchema),
  excluded_approaches: ExcludedApproachesSchema,
  discovery_territories: z.object({
    biology: TerritorySchema,
    geology: TerritorySchema,
    abandoned_tech: TerritorySchema,
    frontier_materials: TerritorySchema,
    industrial_processes: TerritorySchema,
  }),
  first_principles_reframe: FirstPrinciplesReframeSchema,
  discovery_queries: DiscoveryQueriesSchema,
  industry_landscape: IndustryLandscapeSchema.optional(),
  novelty_hypothesis: z.string(),
});

// Clarification question output schema
const AN0DClarificationSchema = z.object({
  need_question: z.literal(true),
  question: z.string(),
  what_you_understood: z.string(),
});

// Combined schema using discriminated union
export const AN0DOutputSchema = z.discriminatedUnion('need_question', [
  AN0DAnalysisSchema,
  AN0DClarificationSchema,
]);

export type AN0DOutput = z.infer<typeof AN0DOutputSchema>;
export type AN0DAnalysis = z.infer<typeof AN0DAnalysisSchema>;
export type AN0DClarification = z.infer<typeof AN0DClarificationSchema>;

/**
 * AN0-D metadata for progress tracking
 */
export const AN0_D_METADATA = {
  id: 'an0-d',
  name: 'Discovery Problem Framing',
  description: 'Framing problem for non-obvious solution hunting',
  estimatedMinutes: 2,
};
