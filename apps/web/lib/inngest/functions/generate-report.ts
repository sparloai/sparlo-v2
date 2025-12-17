import 'server-only';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import {
  buildRetrievalQueries,
  isVectorSearchAvailable,
  retrieveFromCorpus,
} from '../../corpus';
import { MODELS, callClaude, parseJsonResponse } from '../../llm/client';
import {
  type AN0Output,
  AN0OutputSchema,
  AN0_PROMPT,
  type AN1_5_Output,
  AN1_5_OutputSchema,
  AN1_5_PROMPT,
  type AN1_7_Output,
  AN1_7_OutputSchema,
  AN1_7_PROMPT,
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

// AN5 Report Writing Prompt
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
 * - AN0: Problem Framing (+ clarification if needed)
 * - AN1: Corpus Retrieval (Pinecone + Voyage AI)
 * - AN1.5: Re-ranking with paradigm diversity
 * - AN1.7: Literature Augmentation
 * - AN2: Innovation Briefing (Pattern Synthesis)
 * - AN3: Concept Generation
 * - AN4: Evaluation & Ranking
 * - AN5: Report Generation
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
    // AN1: Corpus Retrieval (Vector Search)
    // =========================================
    const an1Result = await step.run('an1-corpus-retrieval', async () => {
      await updateProgress({
        current_step: 'an1',
        phase_progress: 0,
      });

      // Build queries from AN0 output
      const queries = buildRetrievalQueries({
        originalAsk: state.originalAsk,
        corpusQueries: state.corpusQueries,
        crossDomainSeeds: state.crossDomainSeeds,
        contradiction: state.contradiction,
      });

      // Check if vector search is available
      if (!isVectorSearchAvailable()) {
        console.warn('Vector search not available - skipping AN1');
        await updateProgress({ phase_progress: 100 });
        return {
          mechanisms: [],
          seeds: [],
          patents: [],
          summary: 'Corpus retrieval skipped - API keys not configured',
        };
      }

      // Retrieve from corpus
      const results = await retrieveFromCorpus(queries, {
        mechanismsK: 30,
        seedsK: 40,
        patentsK: 20,
      });

      const summary = `Retrieved ${results.mechanisms.length} mechanisms, ${results.seeds.length} seeds, ${results.patents.length} patents`;
      console.log(`AN1 Complete: ${summary}`);

      await updateProgress({ phase_progress: 100 });

      return {
        mechanisms: results.mechanisms,
        seeds: results.seeds,
        patents: results.patents,
        summary,
      };
    });

    // Update state with AN1 results
    state = {
      ...state,
      retrievalMechanisms: an1Result.mechanisms,
      retrievalSeeds: an1Result.seeds,
      retrievalPatents: an1Result.patents,
      retrievalSummary: an1Result.summary,
      completedSteps: [...state.completedSteps, 'an1'],
    };

    // =========================================
    // AN1.5: Re-ranking with Paradigm Diversity
    // =========================================
    let an1_5Result: AN1_5_Output | null = null;

    if (
      an1Result.mechanisms.length > 0 ||
      an1Result.seeds.length > 0 ||
      an1Result.patents.length > 0
    ) {
      an1_5Result = await step.run('an1.5-reranking', async () => {
        await updateProgress({
          current_step: 'an1.5',
          phase_progress: 0,
        });

        const contextMessage = buildAN1_5Context(state);

        const response = await callClaude({
          model: MODELS.OPUS,
          system: AN1_5_PROMPT,
          userMessage: contextMessage,
          maxTokens: 8000,
        });

        const parsed = parseJsonResponse<AN1_5_Output>(response, 'AN1.5');
        const validated = AN1_5_OutputSchema.parse(parsed);

        await updateProgress({ phase_progress: 100 });

        return validated;
      });

      // Update state with AN1.5 results
      state = {
        ...state,
        rerankedMechanisms: an1_5Result.reranked_mechanisms,
        rerankedSeeds: an1_5Result.reranked_seeds,
        rerankedPatents: an1_5Result.reranked_patents,
        corpusGaps: an1_5Result.corpus_gaps,
        rerankingSummary: an1_5Result.reranking_summary,
        completedSteps: [...state.completedSteps, 'an1.5'],
      };
    } else {
      state.completedSteps = [...state.completedSteps, 'an1.5'];
    }

    // =========================================
    // AN1.7: Literature Augmentation
    // =========================================
    let an1_7Result: AN1_7_Output | null = null;

    // Run AN1.7 to assess coverage and augment with literature
    an1_7Result = await step.run('an1.7-literature', async () => {
      await updateProgress({
        current_step: 'an1.7',
        phase_progress: 0,
      });

      const contextMessage = buildAN1_7Context(state, an1_5Result);

      const response = await callClaude({
        model: MODELS.OPUS,
        system: AN1_7_PROMPT,
        userMessage: contextMessage,
        maxTokens: 8000,
      });

      const parsed = parseJsonResponse<AN1_7_Output>(response, 'AN1.7');
      const validated = AN1_7_OutputSchema.parse(parsed);

      await updateProgress({ phase_progress: 100 });

      return validated;
    });

    // Update state with AN1.7 results
    state = {
      ...state,
      validatedApproaches: an1_7Result.validated_approaches,
      literatureCoverage: an1_7Result.coverage_assessment.corpus_coverage,
      parameterReferences: an1_7Result.parameter_reference,
      augmentationSummary: an1_7Result.augmentation_summary,
      completedSteps: [...state.completedSteps, 'an1.7'],
    };

    // =========================================
    // AN2: Innovation Briefing (Pattern Synthesis)
    // =========================================
    const an2Result = await step.run('an2-innovation-briefing', async () => {
      await updateProgress({
        current_step: 'an2',
        phase_progress: 0,
      });

      const contextMessage = buildAN2Context(state, an1_5Result, an1_7Result);

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
        model: MODELS.OPUS,
        system: AN4_PROMPT,
        userMessage: contextMessage,
        maxTokens: 12000, // Needs more tokens to evaluate 8-12 concepts
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
        an1_7Result,
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
          // Include corpus data
          retrievalSummary: state.retrievalSummary,
          corpusGaps: state.corpusGaps,
          validatedApproaches: state.validatedApproaches,
          literatureCoverage: state.literatureCoverage,
        },
      });
    });

    return { success: true, reportId };
  },
);

// =========================================
// Context Building Functions
// =========================================

function buildAN1_5Context(state: ChainState): string {
  return `## Problem Context

**Challenge:** ${state.originalAsk ?? state.userInput}
**Sector:** ${state.userSector ?? 'Not specified'}

**Core Contradiction:**
${state.contradiction?.description ?? 'Not identified'}
- Improving: ${state.contradiction?.improvingParameter ?? 'N/A'}
- Worsening: ${state.contradiction?.worseningParameter ?? 'N/A'}

**Goal Direction:** User wants to ${state.contradiction?.improvingParameter ?? 'solve the problem'}

---

## RAW RETRIEVAL RESULTS

### MECHANISMS (${state.retrievalMechanisms?.length ?? 0} results)
${JSON.stringify(state.retrievalMechanisms?.slice(0, 30) ?? [], null, 2)}

### SEEDS (${state.retrievalSeeds?.length ?? 0} results)
${JSON.stringify(state.retrievalSeeds?.slice(0, 40) ?? [], null, 2)}

### PATENTS (${state.retrievalPatents?.length ?? 0} results)
${JSON.stringify(state.retrievalPatents?.slice(0, 20) ?? [], null, 2)}

Please re-rank these results for actual relevance to the user's contradiction, applying negative filtering and preserving paradigm diversity.`;
}

function buildAN1_7Context(
  state: ChainState,
  an1_5Result: AN1_5_Output | null,
): string {
  return `## Problem Analysis Summary

**Challenge:** ${state.originalAsk ?? state.userInput}
**Sector:** ${state.userSector ?? 'Not specified'}

**Core Contradiction:**
${state.contradiction?.description ?? 'Not identified'}

**Corpus Gaps Identified:** ${JSON.stringify(state.corpusGaps ?? [], null, 2)}

---

## TOP RERANKED MECHANISMS (from AN1.5)
${JSON.stringify(an1_5Result?.reranked_mechanisms?.slice(0, 10) ?? [], null, 2)}

## TOP RERANKED SEEDS
${JSON.stringify(an1_5Result?.reranked_seeds?.slice(0, 10) ?? [], null, 2)}

## TOP RERANKED PATENTS
${JSON.stringify(an1_5Result?.reranked_patents?.slice(0, 5) ?? [], null, 2)}

## RERANKING SUMMARY
${an1_5Result?.reranking_summary ?? 'No reranking performed'}

Please assess corpus coverage and augment with literature search to fill gaps.`;
}

function buildAN2Context(
  state: ChainState,
  an1_5Result: AN1_5_Output | null,
  an1_7Result: AN1_7_Output | null,
): string {
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

---

## CORPUS INSIGHTS (from AN1.5)

**Reranking Summary:** ${an1_5Result?.reranking_summary ?? 'No corpus results'}

**Top Mechanisms:**
${
  an1_5Result?.reranked_mechanisms
    ?.slice(0, 5)
    .map((m) => `- ${m.id}: ${m.relevance_reason}`)
    .join('\n') ?? 'None'
}

**Corpus Gaps:** ${state.corpusGaps?.join(', ') ?? 'None identified'}

---

## LITERATURE VALIDATION (from AN1.7)

**Coverage:** ${an1_7Result?.coverage_assessment?.corpus_coverage ?? 'Not assessed'}

**Validated Approaches:**
${
  an1_7Result?.validated_approaches
    ?.map(
      (a) =>
        `- ${a.approach_name} (${a.source_quality}): ${a.commercial_status}`,
    )
    .join('\n') ?? 'None'
}

**Augmentation Summary:** ${an1_7Result?.augmentation_summary ?? 'No augmentation'}

---

Please create an innovation briefing with 4-6 cross-domain patterns that could address this challenge, incorporating insights from both corpus retrieval and literature.`;
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

---

## Literature-Validated Parameters (use these in concept design)

${
  state.parameterReferences
    ?.map(
      (p) =>
        `- ${p.parameter}: ${p.value_range} (${p.confidence}, ${p.source})`,
    )
    .join('\n') ?? 'No parameters available'
}

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
  an1_7Result: AN1_7_Output | null,
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

### Literature Validation
${
  an1_7Result?.validated_approaches
    ?.map(
      (a) =>
        `**${a.approach_name}** (${a.source_quality})\n- Source: ${a.source}\n- Commercial: ${a.commercial_status}\n- Limitations: ${a.limitations}`,
    )
    .join('\n\n') ?? 'No literature validation'
}

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
