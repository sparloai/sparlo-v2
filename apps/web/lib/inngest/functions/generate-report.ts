import 'server-only';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { MODELS, callClaude, parseJsonResponse } from '../../llm/client';
import {
  type AN0Output,
  AN0OutputSchema,
  AN0_PROMPT,
  type AN2Output,
  AN2OutputSchema,
  AN2_PROMPT,
  type AN3Output,
  AN3OutputSchema,
  AN3_PROMPT,
  type AN4Output,
  AN4OutputSchema,
  AN4_PROMPT,
} from '../../llm/prompts';
import {
  type ChainState,
  createInitialChainState,
} from '../../llm/schemas/chain-state';
import { inngest } from '../client';

// AN5 Report Writing Prompt - Generates the final markdown report
const AN5_REPORT_PROMPT = `You are an expert engineering consultant writing a technical report. Generate a comprehensive report following the structure and voice guidelines below.

## Report Structure

### Executive Summary
Lead with the insight. One sentence on the root cause, one sentence on the core insight, 1-2 sentences on the primary recommendation with confidence level, and a viability assessment (GREEN/YELLOW/RED).

### Constraints Understood
- Hard constraints from user input
- Assumptions made (flag if incorrect)

### Problem Analysis
- What's actually going wrong (physical/engineering terms)
- Why it's hard (apparent contradiction or tradeoff)
- First principles insight (the reframe that makes the solution obvious)
- Root causes (2-4 hypotheses with confidence levels)
- Success metrics (quantified where possible)

### Key Patterns
3-5 cross-domain patterns with:
- Pattern name
- Where it comes from (industries, applications)
- Why it matters here
- Precedent (patents, companies, literature)

### Solution Concepts
Present the concepts ranked by the evaluation step:
- Lead concepts (2-3) with full treatment: what, why, confidence, risks, validation gates
- Other concepts (2-3) with lighter treatment
- One "Spark" concept (frame-breaking, low confidence but interesting)

### Concept Comparison
Markdown table comparing concepts across key dimensions.

### Decision Architecture
Decision tree based on user's constraints, with primary path, fallback, and parallel exploration.

### Personal Recommendation
"If this were my project..." - chronological sequence with specific actions.

### Challenge the Frame
2-4 questions challenging whether the stated problem is the right problem.

### Risks & Watchouts
3-5 risks with likelihood, mitigation, and triggers.

### Next Steps
4-6 numbered items: Today, This Week, Week 2-3, Week 4, etc.

## Voice Guidelines
- Confident but calibrated
- Senior engineer, not salesperson
- Specific over vague
- Physics over authority
- Preserve optionality

Output the report in markdown format.`;

/**
 * Generate Report - Inngest Durable Function
 *
 * Orchestrates the full AN0-AN5 chain with:
 * - Durable execution (survives failures)
 * - Progress updates to Supabase
 * - Clarification handling via waitForEvent
 */
export const generateReport = inngest.createFunction(
  {
    id: 'generate-report',
    retries: 2,
  },
  { event: 'report/generate' },
  async ({ event, step }) => {
    const { reportId, accountId, userId, designChallenge, conversationId } =
      event.data;

    // Initialize chain state
    let state = createInitialChainState({
      reportId,
      accountId,
      userId,
      designChallenge,
      conversationId,
    });

    const supabase = getSupabaseServerAdminClient();

    /**
     * Helper: Update report progress in Supabase
     */
    async function updateProgress(updates: Record<string, unknown>) {
      const { error } = await supabase
        .from('sparlo_reports')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) {
        console.error('Failed to update progress:', error);
      }
    }

    // =========================================
    // AN0: Problem Framing
    // =========================================
    const an0Result = await step.run('an0-problem-framing', async () => {
      await updateProgress({
        current_step: 'an0',
        phase_progress: 0,
      });

      const response = await callClaude({
        model: MODELS.OPUS,
        system: AN0_PROMPT,
        userMessage: designChallenge,
        maxTokens: 4096,
      });

      const parsed = parseJsonResponse<AN0Output>(response, 'AN0');
      const validated = AN0OutputSchema.parse(parsed);

      await updateProgress({ phase_progress: 100 });

      return validated;
    });

    // Update state with AN0 results
    state = {
      ...state,
      originalAsk: an0Result.analysis.originalAsk,
      userSector: an0Result.analysis.userSector,
      primaryKpis: an0Result.analysis.primaryKpis,
      hardConstraints: an0Result.analysis.hardConstraints,
      physicsOfProblem: an0Result.analysis.physicsOfProblem,
      firstPrinciples: an0Result.analysis.firstPrinciples,
      contradiction: an0Result.analysis.contradiction,
      trizPrinciples: an0Result.analysis.trizPrinciples,
      crossDomainSeeds: an0Result.analysis.crossDomainSeeds,
      corpusQueries: an0Result.analysis.corpusQueries,
      needsClarification: an0Result.needsClarification,
      clarificationQuestion: an0Result.clarificationQuestion ?? undefined,
      completedSteps: ['an0'],
    };

    // =========================================
    // Handle Clarification (if needed)
    // =========================================
    if (an0Result.needsClarification && an0Result.clarificationQuestion) {
      await step.run('store-clarification', async () => {
        await updateProgress({
          status: 'clarifying',
          clarifications: [
            {
              question: an0Result.clarificationQuestion,
              askedAt: new Date().toISOString(),
            },
          ],
        });
      });

      // Wait for user to answer (up to 24 hours)
      const clarificationEvent = await step.waitForEvent(
        'wait-for-clarification',
        {
          event: 'report/clarification-answered',
          match: 'data.reportId',
          timeout: '24h',
        },
      );

      if (clarificationEvent) {
        state.clarificationAnswer = clarificationEvent.data.answer;
        state.clarificationCount = (state.clarificationCount ?? 0) + 1;

        await step.run('resume-after-clarification', async () => {
          await updateProgress({
            status: 'processing',
            clarifications: [
              {
                question: an0Result.clarificationQuestion,
                answer: clarificationEvent.data.answer,
                answeredAt: new Date().toISOString(),
              },
            ],
          });
        });
      }
    }

    // =========================================
    // AN2: Innovation Briefing (Pattern Synthesis)
    // =========================================
    const an2Result = await step.run('an2-innovation-briefing', async () => {
      await updateProgress({
        current_step: 'an2',
        phase_progress: 0,
      });

      const contextMessage = buildAN2Context(state);

      const response = await callClaude({
        model: MODELS.OPUS,
        system: AN2_PROMPT,
        userMessage: contextMessage,
        maxTokens: 4096,
      });

      const parsed = parseJsonResponse<AN2Output>(response, 'AN2');
      const validated = AN2OutputSchema.parse(parsed);

      await updateProgress({ phase_progress: 100 });

      return validated;
    });

    // Update state with AN2 results
    state = {
      ...state,
      patterns: an2Result.patterns.map((p) => ({
        name: p.name,
        description: p.description,
        precedent: p.precedent,
        applicability: p.applicability,
      })),
      briefingSummary: an2Result.briefingSummary,
      completedSteps: [...state.completedSteps, 'an2'],
    };

    // =========================================
    // AN3: Concept Generation
    // =========================================
    const an3Result = await step.run('an3-concept-generation', async () => {
      await updateProgress({
        current_step: 'an3',
        phase_progress: 0,
      });

      const contextMessage = buildAN3Context(state, an2Result);

      const response = await callClaude({
        model: MODELS.OPUS,
        system: AN3_PROMPT,
        userMessage: contextMessage,
        maxTokens: 8192,
      });

      const parsed = parseJsonResponse<AN3Output>(response, 'AN3');
      const validated = AN3OutputSchema.parse(parsed);

      await updateProgress({ phase_progress: 100 });

      return validated;
    });

    // Update state with AN3 results
    state = {
      ...state,
      concepts: an3Result.concepts.map((c) => ({
        id: c.id,
        name: c.name,
        track: c.track,
        description: c.description,
        mechanism: c.mechanism,
        confidence: c.confidence,
        keyRisks: c.keyRisks,
        validationGates: c.validationGates.map((g) => g.test),
      })),
      rawConceptCount: an3Result.concepts.length,
      completedSteps: [...state.completedSteps, 'an3'],
    };

    // =========================================
    // AN4: Evaluation & Ranking
    // =========================================
    const an4Result = await step.run('an4-evaluation', async () => {
      await updateProgress({
        current_step: 'an4',
        phase_progress: 0,
      });

      const contextMessage = buildAN4Context(state, an3Result);

      const response = await callClaude({
        model: MODELS.SONNET, // Use Sonnet for evaluation (faster)
        system: AN4_PROMPT,
        userMessage: contextMessage,
        maxTokens: 4096,
      });

      const parsed = parseJsonResponse<AN4Output>(response, 'AN4');
      const validated = AN4OutputSchema.parse(parsed);

      await updateProgress({ phase_progress: 100 });

      return validated;
    });

    // Update state with AN4 results
    state = {
      ...state,
      evaluatedConcepts: an4Result.evaluations.map((e) => {
        const concept = an3Result.concepts.find((c) => c.id === e.conceptId);
        return {
          id: e.conceptId,
          name: concept?.name ?? e.conceptId,
          track: concept?.track ?? 'best_fit',
          description: concept?.description ?? '',
          mechanism: concept?.mechanism ?? '',
          confidence: concept?.confidence ?? 'MEDIUM',
          keyRisks: e.weaknesses,
          validationGates: [],
          score: e.overallScore,
          ranking: e.ranking,
          evaluationNotes: e.evaluationNotes,
        };
      }),
      recommendedConcept: an4Result.recommendedConcept,
      completedSteps: [...state.completedSteps, 'an4'],
    };

    // =========================================
    // AN5: Report Generation
    // =========================================
    const reportMarkdown = await step.run('an5-report-generation', async () => {
      await updateProgress({
        current_step: 'an5',
        phase_progress: 0,
      });

      const contextMessage = buildAN5Context(
        state,
        an2Result,
        an3Result,
        an4Result,
      );

      const response = await callClaude({
        model: MODELS.OPUS,
        system: AN5_REPORT_PROMPT,
        userMessage: contextMessage,
        maxTokens: 16384,
      });

      await updateProgress({ phase_progress: 100 });

      return response;
    });

    // Update state with final report
    state = {
      ...state,
      reportMarkdown,
      completedSteps: [...state.completedSteps, 'an5'],
      completedAt: new Date().toISOString(),
    };

    // =========================================
    // Complete Report
    // =========================================
    await step.run('complete-report', async () => {
      await updateProgress({
        status: 'complete',
        current_step: 'complete',
        phase_progress: 100,
        report_data: {
          markdown: reportMarkdown,
          chainState: state,
          concepts: an3Result.concepts,
          evaluations: an4Result.evaluations,
          patterns: an2Result.patterns,
          recommendedConcept: an4Result.recommendedConcept,
          alternativePath: an4Result.alternativePath,
          sparkHighlight: an4Result.sparkHighlight,
        },
      });
    });

    return { success: true, reportId };
  },
);

// =========================================
// Context Building Functions
// =========================================

function buildAN2Context(state: ChainState): string {
  return `## Problem Analysis Summary

**Original Challenge:** ${state.originalAsk ?? state.userInput}

**Sector:** ${state.userSector ?? 'Not specified'}

**Primary KPIs:**
${state.primaryKpis?.map((k) => `- ${k}`).join('\n') ?? 'None specified'}

**Hard Constraints:**
${state.hardConstraints?.map((c) => `- ${c}`).join('\n') ?? 'None specified'}

**Core Contradiction:**
${state.contradiction?.description ?? 'Not identified'}
- Improving: ${state.contradiction?.improvingParameter ?? 'N/A'}
- Worsening: ${state.contradiction?.worseningParameter ?? 'N/A'}

**Cross-Domain Seeds to Explore:**
${state.crossDomainSeeds?.map((s) => `- ${s}`).join('\n') ?? 'None identified'}

**Physics of the Problem:**
${state.physicsOfProblem?.governingEquations?.map((e) => `- ${e}`).join('\n') ?? 'Not specified'}

${state.clarificationAnswer ? `**User Clarification:** ${state.clarificationAnswer}` : ''}

Please create an innovation briefing with 4-6 cross-domain patterns that could address this challenge.`;
}

function buildAN3Context(state: ChainState, an2Result: AN2Output): string {
  return `## Innovation Briefing

${an2Result.briefingSummary}

### Patterns Identified

${an2Result.patterns
  .map(
    (p) => `**${p.name}**
${p.description}
- Mechanism: ${p.mechanism}
- Precedent: ${p.precedent}
- Application: ${p.applicability}`,
  )
  .join('\n\n')}

### Synthesis Insight
${an2Result.synthesisInsight}

---

## Problem Context

**Challenge:** ${state.originalAsk ?? state.userInput}

**Primary KPIs:**
${state.primaryKpis?.map((k) => `- ${k}`).join('\n') ?? 'None'}

**Hard Constraints:**
${state.hardConstraints?.map((c) => `- ${c}`).join('\n') ?? 'None'}

**Core Contradiction:** ${state.contradiction?.description ?? 'Not specified'}

Please generate 8-12 solution concepts using these patterns.`;
}

function buildAN4Context(state: ChainState, an3Result: AN3Output): string {
  return `## Concepts to Evaluate

${an3Result.concepts
  .map(
    (c) => `### ${c.name} (${c.track.replace('_', ' ')})
ID: ${c.id}
${c.description}
- Mechanism: ${c.mechanism}
- Confidence: ${c.confidence}
- Key Risks: ${c.keyRisks.join(', ')}`,
  )
  .join('\n\n')}

---

## Evaluation Criteria

**Primary KPIs:**
${state.primaryKpis?.map((k) => `- ${k}`).join('\n') ?? 'None specified'}

**Hard Constraints:**
${state.hardConstraints?.map((c) => `- ${c}`).join('\n') ?? 'None specified'}

Please evaluate and rank all ${an3Result.concepts.length} concepts.`;
}

function buildAN5Context(
  state: ChainState,
  an2Result: AN2Output,
  an3Result: AN3Output,
  an4Result: AN4Output,
): string {
  // Sort concepts by ranking
  const rankedConcepts = an3Result.concepts
    .map((c) => {
      const evaluation = an4Result.evaluations.find(
        (e) => e.conceptId === c.id,
      );
      return { ...c, evaluation };
    })
    .sort(
      (a, b) => (a.evaluation?.ranking ?? 99) - (b.evaluation?.ranking ?? 99),
    );

  return `## Full Analysis Data

### Problem Summary
**Challenge:** ${state.originalAsk ?? state.userInput}
**Sector:** ${state.userSector ?? 'Not specified'}

### Constraints
**Primary KPIs:**
${state.primaryKpis?.map((k) => `- ${k}`).join('\n') ?? 'None'}

**Hard Constraints:**
${state.hardConstraints?.map((c) => `- ${c}`).join('\n') ?? 'None'}

### Core Contradiction
${state.contradiction?.description ?? 'Not identified'}

### Physics of the Problem
${state.physicsOfProblem?.governingEquations?.map((e) => `- ${e}`).join('\n') ?? 'Not specified'}

### First Principles Insight
${state.firstPrinciples?.tradeoffs?.join('\n') ?? 'Not specified'}

---

### Key Patterns
${an2Result.patterns
  .map((p) => `**${p.name}**: ${p.description}\nPrecedent: ${p.precedent}`)
  .join('\n\n')}

---

### Solution Concepts (Ranked)

${rankedConcepts
  .map(
    (c, i) => `**#${i + 1}: ${c.name}** — Track: ${c.track.replace('_', ' ')}
${c.description}
- Mechanism: ${c.mechanism}
- Confidence: ${c.confidence}
- Score: ${c.evaluation?.overallScore ?? 'N/A'}/100
- Risks: ${c.keyRisks.join(', ')}
- Validation: ${c.validationGates.map((g) => g.test).join('; ')}`,
  )
  .join('\n\n')}

---

### Recommendations
**Primary:** ${an4Result.recommendedConcept} — ${an4Result.recommendationRationale}
**Alternative:** ${an4Result.alternativePath} — ${an4Result.alternativeRationale}
**Spark to Explore:** ${an4Result.sparkHighlight} — ${an4Result.sparkRationale}

---

Please write the full report following the exact structure in your instructions.`;
}
