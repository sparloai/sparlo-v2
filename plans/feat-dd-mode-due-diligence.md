# feat: Due Diligence Mode for Technical Startup Evaluation

## Overview

**DD Mode** applies Sparlo's engineering intelligence engine to evaluate startup technical claims for investors. Instead of generating solutions for a user's problem, DD Mode:

1. **Extracts** the startup's stated problem and technical claims from pitch materials
2. **Runs** the full Sparlo analysis (AN0-AN5) on the extracted problem
3. **Validates** startup claims against first-principles physics and TRIZ
4. **Maps** their approach onto the generated solution space
5. **Assesses** defensibility, novelty, and technical moat
6. **Generates** an investor-facing Technical Due Diligence Report

### Value Proposition

For deep-tech investors, DD Mode answers:
- Is the physics sound?
- Does the mechanism work?
- What else exists / what did they miss?
- Are they solving the right problem?
- Is this defensible?

### Chain Architecture

```
DD0-M   → Extract claims + stated problem from startup materials
   ↓
AN0-M   → First principles problem framing (EXISTING)
   ↓
AN1.5-M → Teaching example selection (EXISTING)
   ↓
AN1.7-M → Literature search / prior art (EXISTING)
   ↓
AN2-M   → TRIZ methodology briefing (EXISTING)
   ↓
AN3-M   → Generate full solution space (EXISTING)
   ↓
DD3-M   → Validate startup claims against physics + TRIZ
   ↓
DD4-M   → Map approach onto solution space + moat assessment
   ↓
DD5-M   → Generate Due Diligence Report
```

---

## Problem Statement

### Current State

Sparlo has a working hybrid analysis chain (AN0-AN5) that:
- Takes a user-authored engineering problem statement
- Generates a comprehensive solution space (4 tracks: simpler_path, best_fit, paradigm_shift, frontier_transfer)
- Uses prompt caching for cost optimization
- Orchestrates via Inngest durable functions
- Stores results in `sparlo_reports` table

### Gap

Investors need to evaluate **existing startup solutions**, not generate new ones. They need:
- Claim extraction from pitch materials (not user-authored problem statements)
- Validation against physics and prior art
- Positioning within the solution landscape
- Moat and defensibility assessment

### Solution

Add DD Mode as a new analysis type that:
- Wraps the existing AN0-AN5 chain with DD-specific stages
- Accepts pitch deck/whitepaper uploads as input
- Produces an investor-focused Technical DD Report

---

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DD Mode Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Input                     Orchestration              Output     │
│  ─────                     ────────────              ──────      │
│                                                                  │
│  ┌──────────┐              ┌──────────────┐                      │
│  │ PDF/DOCX │──────────────│   DD0-M      │                      │
│  │ Uploads  │              │ (Extraction) │                      │
│  └──────────┘              └──────┬───────┘                      │
│                                   │                              │
│  ┌──────────┐                     │ problem_statement            │
│  │ VC Notes │─────────────────────┤ for_analysis                 │
│  │(optional)│                     │                              │
│  └──────────┘                     ▼                              │
│                            ┌──────────────┐                      │
│                            │   AN0-AN3    │                      │
│                            │  (Existing)  │                      │
│                            └──────┬───────┘                      │
│                                   │                              │
│                                   ▼                              │
│                            ┌──────────────┐    ┌─────────────┐   │
│                            │   DD3-M      │───▶│  DD Report  │   │
│                            │ (Validation) │    │  (DD5-M)    │   │
│                            └──────┬───────┘    └─────────────┘   │
│                                   │                              │
│                                   ▼                              │
│                            ┌──────────────┐                      │
│                            │   DD4-M      │                      │
│                            │ (Moat/Map)   │                      │
│                            └──────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Phases

#### Phase 1: Foundation (Prompts & Schemas)
- Create DD prompt files with Zod schemas
- Define output interfaces for DD0, DD3, DD4, DD5
- Establish context requirements between stages

#### Phase 2: Chain Orchestration
- Create Inngest function `generate-dd-report`
- Integrate DD stages with existing AN chain
- Implement progress tracking

#### Phase 3: API & Server Actions
- Create DD-specific server action
- Add report type differentiation
- Implement file handling for pitch materials

#### Phase 4: UI Implementation
- Create `/home/reports/DD/new` route
- Build DD-specific input form
- Adapt report display for DD format

---

## Implementation Phases

### Phase 1: Foundation (Prompts & Schemas)

**Files to create:**

#### `apps/web/lib/llm/prompts/dd/prompts.ts`
```typescript
// DD0-M: Claim Extraction
export const DD0_M_PROMPT = `...`; // From user's dd-mode-prompts.ts
export const DD0_M_METADATA = {
  id: 'dd0-m',
  name: 'DD Claim Extraction',
  description: 'Extract problem statement and claims from startup materials',
  temperature: 0.5,
  model: 'claude-sonnet-4-20250514',
  estimatedMinutes: 3,
};

// DD3-M: Claim Validation
export const DD3_M_PROMPT = `...`;
export const DD3_M_METADATA = { /* ... */ };

// DD4-M: Solution Space Mapping
export const DD4_M_PROMPT = `...`;
export const DD4_M_METADATA = { /* ... */ };

// DD5-M: DD Report Generation
export const DD5_M_PROMPT = `...`;
export const DD5_M_METADATA = { /* ... */ };
```

#### `apps/web/lib/llm/prompts/dd/schemas.ts`
```typescript
import { z } from 'zod';

// DD0 Output Schema
export const DD0OutputSchema = z.object({
  startup_profile: z.object({
    company_name: z.string(),
    technology_domain: z.string(),
    stage: z.enum(['Pre-seed', 'Seed', 'Series A', 'Series B', 'Growth']),
    team_background: z.string().optional(),
  }),
  problem_extraction: z.object({
    business_framing: z.string(),
    engineering_framing: z.string(),
    constraints_stated: z.array(z.string()),
    constraints_implied: z.array(z.string()),
    success_metrics_stated: z.array(z.string()),
    success_metrics_implied: z.array(z.string()),
    problem_statement_for_analysis: z.string(), // KEY: feeds into AN0-M
  }),
  proposed_solution: z.object({
    approach_summary: z.string(),
    core_mechanism: z.string(),
    key_components: z.array(z.string()),
    claimed_advantages: z.array(z.string()),
  }),
  technical_claims: z.array(z.object({
    id: z.string(),
    claim_text: z.string(),
    claim_type: z.enum(['PERFORMANCE', 'NOVELTY', 'MECHANISM', 'FEASIBILITY', 'TIMELINE', 'COST', 'MOAT']),
    evidence_level: z.enum(['DEMONSTRATED', 'TESTED', 'CITED', 'CLAIMED', 'IMPLIED']),
    verifiability: z.enum(['PHYSICS_CHECK', 'LITERATURE_CHECK', 'DATA_REQUIRED', 'TEST_REQUIRED', 'UNVERIFIABLE']),
    validation_priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  })),
  red_flags: z.array(z.object({
    flag_type: z.string(),
    description: z.string(),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM']),
  })),
  search_seeds: z.object({
    prior_art_queries: z.array(z.string()),
    competitor_queries: z.array(z.string()),
    mechanism_queries: z.array(z.string()),
  }),
});

export type DD0Output = z.infer<typeof DD0OutputSchema>;

// DD3 Output Schema
export const DD3OutputSchema = z.object({
  validation_summary: z.object({
    overall_technical_assessment: z.string(),
    mechanism_validity: z.enum(['SOUND', 'PLAUSIBLE', 'QUESTIONABLE', 'FLAWED']),
    key_concern: z.string(),
    key_strength: z.string(),
  }),
  physics_validation: z.array(z.object({
    claim_id: z.string(),
    claim_text: z.string(),
    governing_physics: z.object({
      principle: z.string(),
      theoretical_limit: z.string(),
    }),
    verdict: z.enum(['VALIDATED', 'PLAUSIBLE', 'QUESTIONABLE', 'IMPLAUSIBLE', 'INVALID']),
    confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    reasoning: z.string(),
  })),
  mechanism_validation: z.object({
    claimed_mechanism: z.string(),
    actual_physics: z.string(),
    accuracy_assessment: z.enum(['ACCURATE', 'OVERSIMPLIFIED', 'PARTIALLY_WRONG', 'FUNDAMENTALLY_WRONG']),
    verdict: z.enum(['SOUND', 'PLAUSIBLE', 'QUESTIONABLE', 'FLAWED']),
  }),
  triz_analysis: z.object({
    contradiction_awareness: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    resolution_quality: z.enum(['ELEGANT', 'ADEQUATE', 'PARTIAL', 'POOR']),
    missed_contradictions: z.array(z.string()),
  }),
  feasibility_validation: z.object({
    scale_verdict: z.enum(['FEASIBLE', 'CHALLENGING', 'UNLIKELY']),
    cost_verdict: z.enum(['REALISTIC', 'OPTIMISTIC', 'UNREALISTIC']),
    timeline_verdict: z.enum(['REALISTIC', 'AGGRESSIVE', 'UNREALISTIC']),
  }),
  technical_credibility_score: z.object({
    score: z.number().min(1).max(10),
    rationale: z.string(),
  }),
});

export type DD3Output = z.infer<typeof DD3OutputSchema>;

// DD4 Output Schema
export const DD4OutputSchema = z.object({
  solution_space_position: z.object({
    primary_track: z.enum(['simpler_path', 'best_fit', 'paradigm_shift', 'frontier_transfer']),
    track_rationale: z.string(),
    fit_assessment: z.object({
      optimal_for_problem: z.boolean(),
      alignment: z.enum(['ALIGNED', 'PARTIALLY_ALIGNED', 'MISALIGNED']),
    }),
  }),
  missed_alternatives: z.array(z.object({
    concept_summary: z.string(),
    track: z.string(),
    why_potentially_better: z.string(),
    competitive_threat_level: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  })),
  novelty_assessment: z.object({
    novelty_verdict: z.enum(['GENUINELY_NOVEL', 'NOVEL_COMBINATION', 'NOVEL_APPLICATION', 'INCREMENTAL', 'NOT_NOVEL']),
    what_is_actually_novel: z.string(),
    what_is_not_novel: z.string(),
  }),
  moat_assessment: z.object({
    technical_moat: z.object({
      patentability: z.enum(['STRONG', 'MODERATE', 'WEAK', 'NONE']),
      replication_difficulty: z.enum(['VERY_HARD', 'HARD', 'MODERATE', 'EASY']),
      time_to_replicate: z.string(),
    }),
    overall_moat: z.object({
      strength: z.enum(['STRONG', 'MODERATE', 'WEAK', 'NONE']),
      durability_years: z.number(),
      primary_source: z.string(),
    }),
  }),
  competitive_risk_analysis: z.object({
    simpler_path_risk: z.object({
      simpler_alternatives_exist: z.boolean(),
      could_be_good_enough: z.boolean(),
    }),
    paradigm_shift_risk: z.object({
      disruptive_approaches_emerging: z.boolean(),
      threats: z.array(z.string()),
    }),
  }),
});

export type DD4Output = z.infer<typeof DD4OutputSchema>;

// DD5 Output Schema (DD Report)
export const DD5OutputSchema = z.object({
  header: z.object({
    report_type: z.literal('Technical Due Diligence Report'),
    company_name: z.string(),
    technology_domain: z.string(),
    date: z.string(),
  }),
  executive_summary: z.object({
    verdict: z.enum(['COMPELLING', 'PROMISING', 'MIXED', 'CONCERNING', 'PASS']),
    verdict_confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    one_paragraph_summary: z.string(),
    key_findings: z.array(z.object({
      finding: z.string(),
      type: z.enum(['STRENGTH', 'WEAKNESS', 'OPPORTUNITY', 'THREAT']),
      investment_impact: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    })),
    technical_credibility_score: z.object({
      score: z.number(),
      out_of: z.number(),
    }),
    recommendation: z.object({
      action: z.enum(['PROCEED', 'PROCEED_WITH_CAUTION', 'DEEP_DIVE_REQUIRED', 'PASS']),
      rationale: z.string(),
    }),
  }),
  technical_thesis_assessment: z.object({
    their_thesis: z.string(),
    thesis_validity: z.object({
      verdict: z.enum(['SOUND', 'PLAUSIBLE', 'QUESTIONABLE', 'FLAWED']),
      explanation: z.string(),
    }),
  }),
  problem_framing_analysis: z.object({
    their_framing: z.string(),
    first_principles_framing: z.string(),
    framing_assessment: z.object({
      quality: z.enum(['OPTIMAL', 'GOOD', 'SUBOPTIMAL', 'MISFRAMED']),
      explanation: z.string(),
    }),
  }),
  solution_space_positioning: z.object({
    solution_landscape_summary: z.string(),
    startup_position: z.object({
      track: z.string(),
      is_optimal_position: z.boolean(),
    }),
    alternatives_analysis: z.object({
      stronger_alternatives_exist: z.boolean(),
      alternatives: z.array(z.object({
        approach: z.string(),
        advantages: z.string(),
        competitive_threat: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      })),
    }),
  }),
  claim_validation_summary: z.object({
    claims_validated: z.number(),
    claims_questionable: z.number(),
    claims_invalid: z.number(),
    critical_claims: z.array(z.object({
      claim: z.string(),
      verdict: z.string(),
      basis: z.string(),
    })),
  }),
  novelty_assessment: z.object({
    novelty_verdict: z.string(),
    what_is_actually_novel: z.string(),
    prior_art_highlights: z.array(z.object({
      reference: z.string(),
      relevance: z.string(),
    })),
  }),
  moat_assessment: z.object({
    overall_moat: z.object({
      strength: z.string(),
      durability_years: z.number(),
      primary_source: z.string(),
    }),
    moat_vulnerabilities: z.array(z.object({
      vulnerability: z.string(),
      severity: z.string(),
    })),
  }),
  risk_analysis: z.object({
    technical_risks: z.array(z.object({
      risk: z.string(),
      probability: z.string(),
      impact: z.string(),
    })),
    key_risk_summary: z.string(),
  }),
  founder_questions: z.object({
    must_ask: z.array(z.object({
      question: z.string(),
      why_critical: z.string(),
      good_answer: z.string(),
      concerning_answer: z.string(),
    })),
  }),
  verdict_and_recommendation: z.object({
    technical_verdict: z.object({
      verdict: z.enum(['COMPELLING', 'PROMISING', 'MIXED', 'CONCERNING', 'PASS']),
      summary: z.string(),
    }),
    final_word: z.string(),
  }),
});

export type DD5Output = z.infer<typeof DD5OutputSchema>;
```

#### `apps/web/lib/llm/prompts/dd/index.ts`
```typescript
export * from './prompts';
export * from './schemas';

export const DD_PHASES = [
  { id: 'dd0-m', name: 'Claim Extraction', estimatedMinutes: 3 },
  { id: 'an0-m', name: 'Problem Framing', estimatedMinutes: 4 },
  { id: 'an1.5-m', name: 'Teaching Selection', estimatedMinutes: 2 },
  { id: 'an1.7-m', name: 'Literature Search', estimatedMinutes: 5 },
  { id: 'an2-m', name: 'TRIZ Analysis', estimatedMinutes: 4 },
  { id: 'an3-m', name: 'Solution Space', estimatedMinutes: 8 },
  { id: 'dd3-m', name: 'Claim Validation', estimatedMinutes: 6 },
  { id: 'dd4-m', name: 'Moat Assessment', estimatedMinutes: 5 },
  { id: 'dd5-m', name: 'Report Generation', estimatedMinutes: 4 },
];

export const DD_CONTEXT_REQUIREMENTS = {
  'dd0-m': {
    requires: ['startup_materials', 'vc_notes'],
    produces: ['claim_extraction', 'problem_statement_for_analysis'],
  },
  'an0-m': {
    requires: ['problem_statement_for_analysis'],
    produces: ['problem_framing'],
  },
  'an1.5-m': {
    requires: ['problem_framing'],
    produces: ['teaching_examples'],
  },
  'an1.7-m': {
    requires: ['problem_framing', 'teaching_examples'],
    produces: ['literature_search'],
  },
  'an2-m': {
    requires: ['problem_framing'],
    produces: ['triz_analysis'],
  },
  'an3-m': {
    requires: ['problem_framing', 'teaching_examples', 'literature_search', 'triz_analysis'],
    produces: ['solution_space'],
  },
  'dd3-m': {
    requires: ['claim_extraction', 'problem_framing', 'teaching_examples', 'literature_search', 'triz_analysis'],
    produces: ['claim_validation'],
  },
  'dd4-m': {
    requires: ['claim_extraction', 'solution_space', 'claim_validation', 'literature_search'],
    produces: ['solution_mapping', 'moat_assessment'],
  },
  'dd5-m': {
    requires: ['claim_extraction', 'problem_framing', 'solution_space', 'claim_validation', 'solution_mapping'],
    produces: ['dd_report'],
  },
};
```

**Tasks:**
- [ ] Copy DD prompts from `/Users/alijangbar/Downloads/dd-mode-prompts.ts` to `apps/web/lib/llm/prompts/dd/prompts.ts`
- [ ] Create Zod schemas in `apps/web/lib/llm/prompts/dd/schemas.ts`
- [ ] Create index file with phase metadata and context requirements
- [ ] Export from main prompts index `apps/web/lib/llm/prompts/index.ts`

---

### Phase 2: Chain Orchestration (Inngest Function)

**File to create:** `apps/web/lib/inngest/functions/generate-dd-report.ts`

```typescript
import 'server-only';

import { inngest } from '../client';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { callClaude, parseJsonResponse } from '~/lib/llm/client';
import { MODELS } from '~/lib/llm/models';

// Import existing AN prompts
import {
  AN0_HYBRID_PROMPT,
  AN1_5_HYBRID_PROMPT,
  AN1_7_HYBRID_PROMPT,
  AN2_HYBRID_PROMPT,
  AN3_HYBRID_PROMPT,
} from '~/lib/llm/prompts/hybrid/prompts';

// Import DD prompts
import {
  DD0_M_PROMPT,
  DD3_M_PROMPT,
  DD4_M_PROMPT,
  DD5_M_PROMPT,
  DD0OutputSchema,
  DD3OutputSchema,
  DD4OutputSchema,
  DD5OutputSchema,
} from '~/lib/llm/prompts/dd';

interface DDReportEvent {
  name: 'report/generate-dd';
  data: {
    reportId: string;
    accountId: string;
    startupMaterials: string;
    vcNotes?: string;
    attachments?: Array<{
      filename: string;
      media_type: string;
      data: string;
    }>;
  };
}

export const generateDDReport = inngest.createFunction(
  {
    id: 'generate-dd-report',
    retries: 2,
    cancelOn: [
      { event: 'report/cancel.requested', match: 'data.reportId' },
    ],
    onFailure: async ({ error, event }) => {
      const client = getSupabaseServerAdminClient();
      await client
        .from('sparlo_reports')
        .update({
          status: 'failed',
          error_message: error.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.data.reportId);
    },
  },
  { event: 'report/generate-dd' },
  async ({ event, step }) => {
    const { reportId, startupMaterials, vcNotes, attachments } = event.data;
    const client = getSupabaseServerAdminClient();

    // Helper to update progress
    const updateProgress = async (
      currentStep: string,
      phaseProgress: number,
      additionalData?: Record<string, unknown>
    ) => {
      await client
        .from('sparlo_reports')
        .update({
          current_step: currentStep,
          phase_progress: phaseProgress,
          ...additionalData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);
    };

    // ===================
    // STEP 1: DD0 - Claim Extraction
    // ===================
    const dd0Result = await step.run('dd0-claim-extraction', async () => {
      await updateProgress('dd0-m', 5);

      const userMessage = vcNotes
        ? `## Startup Materials\n\n${startupMaterials}\n\n## VC Notes\n\n${vcNotes}`
        : startupMaterials;

      const { content, usage } = await callClaude({
        model: MODELS.SONNET,
        system: DD0_M_PROMPT,
        userMessage,
        documents: attachments?.filter(a => a.media_type === 'application/pdf'),
        images: attachments?.filter(a => a.media_type.startsWith('image/')),
        maxTokens: 8000,
      });

      const parsed = parseJsonResponse<unknown>(content, 'DD0');
      const validated = DD0OutputSchema.parse(parsed);

      await updateProgress('dd0-m', 10, {
        messages: [{ role: 'dd0', content: JSON.stringify(validated) }],
      });

      return { dd0: validated, usage };
    });

    // ===================
    // STEP 2: AN0 - Problem Framing (Existing)
    // ===================
    const an0Result = await step.run('an0-problem-framing', async () => {
      await updateProgress('an0-m', 15);

      // Use the extracted problem statement from DD0
      const problemStatement = dd0Result.dd0.problem_extraction.problem_statement_for_analysis;

      const { content, usage } = await callClaude({
        model: MODELS.OPUS,
        system: AN0_HYBRID_PROMPT,
        userMessage: problemStatement,
        maxTokens: 12000,
      });

      const parsed = parseJsonResponse<unknown>(content, 'AN0');
      await updateProgress('an0-m', 25);

      return { an0: parsed, usage };
    });

    // ===================
    // STEP 3: AN1.5 - Teaching Selection (Existing)
    // ===================
    const an1_5Result = await step.run('an1.5-teaching-selection', async () => {
      await updateProgress('an1.5-m', 30);

      const { content, usage } = await callClaude({
        model: MODELS.SONNET,
        system: AN1_5_HYBRID_PROMPT,
        userMessage: JSON.stringify(an0Result.an0),
        maxTokens: 6000,
      });

      const parsed = parseJsonResponse<unknown>(content, 'AN1.5');
      await updateProgress('an1.5-m', 35);

      return { an1_5: parsed, usage };
    });

    // ===================
    // STEP 4: AN1.7 - Literature Search (Existing)
    // ===================
    const an1_7Result = await step.run('an1.7-literature-search', async () => {
      await updateProgress('an1.7-m', 40);

      // Include DD0 search seeds for more targeted prior art search
      const searchContext = {
        problem_framing: an0Result.an0,
        teaching_examples: an1_5Result.an1_5,
        search_seeds: dd0Result.dd0.search_seeds,
      };

      const { content, usage } = await callClaude({
        model: MODELS.SONNET,
        system: AN1_7_HYBRID_PROMPT,
        userMessage: JSON.stringify(searchContext),
        maxTokens: 8000,
      });

      const parsed = parseJsonResponse<unknown>(content, 'AN1.7');
      await updateProgress('an1.7-m', 50);

      return { an1_7: parsed, usage };
    });

    // ===================
    // STEP 5: AN2 - TRIZ Analysis (Existing)
    // ===================
    const an2Result = await step.run('an2-triz-analysis', async () => {
      await updateProgress('an2-m', 55);

      const { content, usage } = await callClaude({
        model: MODELS.OPUS,
        system: AN2_HYBRID_PROMPT,
        userMessage: JSON.stringify(an0Result.an0),
        maxTokens: 10000,
      });

      const parsed = parseJsonResponse<unknown>(content, 'AN2');
      await updateProgress('an2-m', 60);

      return { an2: parsed, usage };
    });

    // ===================
    // STEP 6: AN3 - Solution Space Generation (Existing)
    // ===================
    const an3Result = await step.run('an3-solution-space', async () => {
      await updateProgress('an3-m', 65);

      const solutionContext = {
        problem_framing: an0Result.an0,
        teaching_examples: an1_5Result.an1_5,
        literature: an1_7Result.an1_7,
        triz_analysis: an2Result.an2,
      };

      const { content, usage } = await callClaude({
        model: MODELS.OPUS,
        system: AN3_HYBRID_PROMPT,
        userMessage: JSON.stringify(solutionContext),
        maxTokens: 16000,
      });

      const parsed = parseJsonResponse<unknown>(content, 'AN3');
      await updateProgress('an3-m', 75);

      return { an3: parsed, usage };
    });

    // ===================
    // STEP 7: DD3 - Claim Validation
    // ===================
    const dd3Result = await step.run('dd3-claim-validation', async () => {
      await updateProgress('dd3-m', 80);

      const validationContext = {
        claim_extraction: dd0Result.dd0,
        problem_framing: an0Result.an0,
        teaching_examples: an1_5Result.an1_5,
        literature: an1_7Result.an1_7,
        triz_analysis: an2Result.an2,
      };

      const { content, usage } = await callClaude({
        model: MODELS.OPUS, // Use Opus for judgment-heavy validation
        system: DD3_M_PROMPT,
        userMessage: JSON.stringify(validationContext),
        maxTokens: 12000,
      });

      const parsed = parseJsonResponse<unknown>(content, 'DD3');
      const validated = DD3OutputSchema.parse(parsed);
      await updateProgress('dd3-m', 85);

      return { dd3: validated, usage };
    });

    // ===================
    // STEP 8: DD4 - Solution Space Mapping & Moat
    // ===================
    const dd4Result = await step.run('dd4-moat-assessment', async () => {
      await updateProgress('dd4-m', 90);

      const mappingContext = {
        claim_extraction: dd0Result.dd0,
        solution_space: an3Result.an3,
        claim_validation: dd3Result.dd3,
        literature: an1_7Result.an1_7,
      };

      const { content, usage } = await callClaude({
        model: MODELS.OPUS,
        system: DD4_M_PROMPT,
        userMessage: JSON.stringify(mappingContext),
        maxTokens: 10000,
      });

      const parsed = parseJsonResponse<unknown>(content, 'DD4');
      const validated = DD4OutputSchema.parse(parsed);
      await updateProgress('dd4-m', 95);

      return { dd4: validated, usage };
    });

    // ===================
    // STEP 9: DD5 - Report Generation
    // ===================
    const dd5Result = await step.run('dd5-report-generation', async () => {
      await updateProgress('dd5-m', 97);

      const reportContext = {
        claim_extraction: dd0Result.dd0,
        problem_framing: an0Result.an0,
        solution_space: an3Result.an3,
        claim_validation: dd3Result.dd3,
        solution_mapping: dd4Result.dd4,
      };

      const { content, usage } = await callClaude({
        model: MODELS.OPUS,
        system: DD5_M_PROMPT,
        userMessage: JSON.stringify(reportContext),
        maxTokens: 12000,
      });

      const parsed = parseJsonResponse<unknown>(content, 'DD5');
      const validated = DD5OutputSchema.parse(parsed);

      return { dd5: validated, usage };
    });

    // ===================
    // FINAL: Save Complete Report
    // ===================
    await step.run('save-report', async () => {
      const fullReport = {
        mode: 'dd',
        claim_extraction: dd0Result.dd0,
        problem_framing: an0Result.an0,
        teaching_examples: an1_5Result.an1_5,
        literature: an1_7Result.an1_7,
        triz_analysis: an2Result.an2,
        solution_space: an3Result.an3,
        claim_validation: dd3Result.dd3,
        solution_mapping: dd4Result.dd4,
        report: dd5Result.dd5,
      };

      // Extract headline from report
      const headline = dd5Result.dd5.executive_summary.one_paragraph_summary.slice(0, 200);

      await client
        .from('sparlo_reports')
        .update({
          status: 'complete',
          current_step: 'complete',
          phase_progress: 100,
          headline,
          report_data: fullReport,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      return { success: true };
    });

    return { reportId, status: 'complete' };
  }
);
```

**Tasks:**
- [ ] Create `apps/web/lib/inngest/functions/generate-dd-report.ts`
- [ ] Register function in `apps/web/lib/inngest/functions/index.ts`
- [ ] Test chain execution with sample startup materials

---

### Phase 3: API & Server Actions

**File to create:** `apps/web/app/home/(user)/_lib/server/dd-reports-server-actions.ts`

```typescript
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { inngest } from '~/lib/inngest/client';
import { requireUser } from '~/lib/server/require-user';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

const AttachmentSchema = z.object({
  filename: z.string(),
  media_type: z.enum([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ]),
  data: z.string(), // base64
});

const StartDDReportSchema = z.object({
  startupMaterials: z.string().min(100, 'Please provide more detailed startup materials'),
  vcNotes: z.string().optional(),
  companyName: z.string().min(1, 'Company name is required'),
  attachments: z.array(AttachmentSchema).max(MAX_FILES).optional(),
});

export const startDDReportGeneration = enhanceAction(
  async (data, user) => {
    const client = getSupabaseServerClient();
    const accountId = user.id;

    // Validate attachments size
    if (data.attachments) {
      for (const attachment of data.attachments) {
        const sizeInBytes = Buffer.from(attachment.data, 'base64').length;
        if (sizeInBytes > MAX_FILE_SIZE) {
          throw new Error(`File ${attachment.filename} exceeds 10MB limit`);
        }
      }
    }

    // Create report record
    const { data: report, error } = await client
      .from('sparlo_reports')
      .insert({
        account_id: accountId,
        conversation_id: `dd-${Date.now()}`,
        title: `DD: ${data.companyName}`,
        status: 'processing',
        current_step: 'dd0-m',
        phase_progress: 0,
        report_data: {
          mode: 'dd',
          company_name: data.companyName,
          startup_materials: data.startupMaterials,
          vc_notes: data.vcNotes,
        },
        created_by: user.id,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error('Failed to create DD report');
    }

    // Trigger Inngest workflow
    await inngest.send({
      name: 'report/generate-dd',
      data: {
        reportId: report.id,
        accountId,
        startupMaterials: data.startupMaterials,
        vcNotes: data.vcNotes,
        attachments: data.attachments,
      },
    });

    redirect(`/home/reports/${report.id}`);
  },
  {
    auth: true,
    schema: StartDDReportSchema,
  }
);
```

**Tasks:**
- [ ] Create `apps/web/app/home/(user)/_lib/server/dd-reports-server-actions.ts`
- [ ] Add DD report type handling to existing report queries/loaders

---

### Phase 4: UI Implementation

**Files to create:**

#### `apps/web/app/home/(user)/reports/DD/new/page.tsx`
```typescript
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '~/lib/server/require-user';
import { DDAnalysisForm } from './_components/dd-analysis-form';

export const metadata = {
  title: 'New Due Diligence Analysis',
  description: 'Evaluate startup technical claims with AI-powered analysis',
};

async function DDNewPage() {
  const client = getSupabaseServerClient();
  const user = await requireUser(client);

  if (!user) {
    redirect('/auth/sign-in');
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Technical Due Diligence
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload startup pitch materials for AI-powered technical validation
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <DDAnalysisForm />
      </Suspense>
    </div>
  );
}

export default DDNewPage;
```

#### `apps/web/app/home/(user)/reports/DD/new/_components/dd-analysis-form.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, FileText, X } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Textarea } from '@kit/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';

import { startDDReportGeneration } from '~/app/home/(user)/_lib/server/dd-reports-server-actions';

const formSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  startupMaterials: z.string().min(100, 'Please provide more detailed materials'),
  vcNotes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Attachment {
  id: string;
  file: File;
  base64: string;
  preview?: string;
}

export function DDAnalysisForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      startupMaterials: '',
      vcNotes: '',
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      if (attachments.length >= 5) {
        break;
      }

      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        continue;
      }

      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:...;base64, prefix
        };
        reader.readAsDataURL(file);
      });

      setAttachments((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          file,
          base64,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        },
      ]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      await startDDReportGeneration({
        ...data,
        attachments: attachments.map((a) => ({
          filename: a.file.name,
          media_type: a.file.type as any,
          data: a.base64,
        })),
      });
    } catch (error) {
      console.error('Failed to start DD analysis:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., TechStartup Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startupMaterials"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Startup Materials</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Paste pitch deck content, whitepaper text, or technical description..."
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Include technical claims, proposed mechanisms, and performance metrics
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Attachments (Optional)</label>
          <div className="border-dashed border-2 rounded-lg p-4">
            <input
              type="file"
              accept=".pdf,image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={attachments.length >= 5}
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center cursor-pointer"
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                Upload PDF or images (max 5 files, 10MB each)
              </span>
            </label>
          </div>

          {/* Attachment List */}
          {attachments.length > 0 && (
            <div className="space-y-2 mt-4">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{attachment.file.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="vcNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>VC Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add your own notes, concerns, or specific questions..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Internal notes that will inform the analysis focus
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting Analysis...
            </>
          ) : (
            'Start Due Diligence Analysis'
          )}
        </Button>
      </form>
    </Form>
  );
}
```

**Tasks:**
- [ ] Create `/home/reports/DD/new/page.tsx` route
- [ ] Create `_components/dd-analysis-form.tsx` form component
- [ ] Add DD mode to navigation/sidebar
- [ ] Adapt report display for DD report format (if needed)

---

## Acceptance Criteria

### Functional Requirements

- [ ] User can navigate to `/home/reports/DD/new`
- [ ] User can upload startup materials (text + attachments)
- [ ] User can optionally add VC notes
- [ ] System extracts claims via DD0 and runs full AN chain
- [ ] System validates claims via DD3
- [ ] System maps solution space via DD4
- [ ] System generates DD report via DD5
- [ ] User sees real-time progress during analysis
- [ ] Completed DD report displays with all sections
- [ ] DD reports appear in main reports list with DD indicator

### Non-Functional Requirements

- [ ] Chain completes within 15 minutes for typical inputs
- [ ] Progress updates every 5 seconds minimum
- [ ] Graceful error handling with user-friendly messages
- [ ] File uploads validate type and size before processing

### Quality Gates

- [ ] All Zod schemas validate against sample outputs
- [ ] TypeScript compiles without errors
- [ ] Inngest function handles retry and failure scenarios
- [ ] RLS policies allow DD reports for authenticated users

---

## Success Metrics

- DD report generation success rate > 95%
- Average completion time < 12 minutes
- User satisfaction with report quality (qualitative feedback)

---

## Dependencies & Prerequisites

### Technical Dependencies
- Existing hybrid chain implementation (AN0-AN5)
- Inngest workflow infrastructure
- Supabase real-time subscriptions
- Claude API with prompt caching

### Prerequisites
- [ ] Verify existing hybrid chain is stable
- [ ] Confirm Inngest concurrency limits
- [ ] Test Claude API rate limits with chain

---

## Risk Analysis & Mitigation

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| AN chain incompatibility with DD0 output | Chain breaks | Test DD0→AN0 integration early |
| Context size exceeds limits in DD3/DD4 | Truncated analysis | Implement context compression |
| Long execution time | Poor UX | Add detailed progress, set expectations |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Claim extraction quality varies | Inconsistent reports | Add confidence scoring, flag weak extractions |
| PDF parsing failures | Missing content | Fallback to text extraction, error messaging |

---

## Future Considerations

- **Comparison Mode**: Compare multiple startups side-by-side
- **Historical Tracking**: Track startup claims over time (round-to-round)
- **API Access**: Expose DD mode via API for integration
- **Custom Frameworks**: Allow VCs to customize validation criteria
- **Export Formats**: PDF export of DD reports

---

## References & Research

### Internal References
- Hybrid chain: `apps/web/lib/inngest/functions/generate-hybrid-report.ts`
- Prompts structure: `apps/web/lib/llm/prompts/hybrid/`
- Report display: `apps/web/app/home/(user)/reports/[id]/_components/`
- Server actions: `apps/web/app/home/(user)/_lib/server/hybrid-reports-server-actions.ts`

### External References
- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [Inngest Durable Functions](https://www.inngest.com/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

### User-Provided Resources
- DD prompts: `/Users/alijangbar/Downloads/dd-mode-prompts.ts` (comprehensive, ready to use)
