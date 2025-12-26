import 'server-only';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import {
  buildRetrievalQueries,
  formatRetrievalSummary,
  isVectorSearchAvailable,
  retrieveTargeted,
} from '../../corpus';
import {
  CLAUDE_PRICING,
  ClaudeRefusalError,
  MODELS,
  type TokenUsage,
  calculateCost,
  callClaude,
  parseJsonResponse,
} from '../../llm/client';
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
  type AN5Output,
  AN5OutputSchema,
  AN5_PROMPT,
} from '../../llm/prompts';
import {
  type ChainState,
  createInitialChainState,
} from '../../llm/schemas/chain-state';
import { inngest } from '../client';
import { handleReportFailure } from '../utils/report-failure-handler';

/**
 * Generate Report - Inngest Durable Function (v10)
 *
 * Orchestrates the full AN0-AN5 chain with:
 * - AN0: Problem Framing with first principles + TRIZ contradiction
 * - AN1: 4-namespace Corpus Retrieval (failures, bounds, transfers, triz)
 * - AN1.5: Teaching Example Selection
 * - AN1.7: Literature Augmentation
 * - AN2: Innovation Methodology Briefing
 * - AN3: Concept Generation (first principles, three tracks)
 * - AN4: Evaluation with Hard Validation Gates
 * - AN5: Executive Report Generation
 */
export const generateReport = inngest.createFunction(
  {
    id: 'generate-report',
    retries: 2,
    onFailure: async ({ error, event, step }) => {
      const failureEvent = event as unknown as {
        event: { data: { reportId: string } };
      };
      const reportId = failureEvent.event.data.reportId;
      await handleReportFailure(reportId, error, step);
    },
  },
  { event: 'report/generate' },
  async ({ event, step }) => {
    // Track active execution for graceful shutdown
    const tracker = (
      globalThis as {
        __inngestActiveExecutions?: {
          increment: () => void;
          decrement: () => void;
        };
      }
    ).__inngestActiveExecutions;
    tracker?.increment();

    try {
      const {
        reportId,
        accountId,
        userId,
        designChallenge,
        conversationId,
        attachments,
      } = event.data;

      const supabase = getSupabaseServerAdminClient();

      // Convert attachments to ImageAttachment format for Claude vision
      type ImageAttachment = {
        media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        data: string;
      };
      const imageAttachments: ImageAttachment[] = (attachments || [])
        .filter((a: { media_type: string }) =>
          a.media_type.startsWith('image/'),
        )
        .map((a: { media_type: string; data: string }) => ({
          media_type: a.media_type as ImageAttachment['media_type'],
          data: a.data,
        }));

      // Handle ClaudeRefusalError at the top level
      try {
        return await runReportGeneration();
      } catch (error) {
        if (error instanceof ClaudeRefusalError) {
          // Update report with user-friendly error
          await supabase
            .from('sparlo_reports')
            .update({
              status: 'failed',
              error_message: error.message,
              updated_at: new Date().toISOString(),
            })
            .eq('id', reportId);

          return { success: false, reportId, error: error.message };
        }
        throw error; // Re-throw other errors for Inngest retry
      }

      async function runReportGeneration() {
        // Initialize chain state
        let state = createInitialChainState({
          reportId,
          accountId,
          userId,
          designChallenge,
          conversationId,
        });

        // Helper to calculate total usage from collected step usages
        function calculateTotalUsage(
          usages: (TokenUsage | null | undefined)[],
          stepNames: string[],
        ): TokenUsage & {
          costUsd: number;
          byStep: Record<string, TokenUsage>;
        } {
          const byStep: Record<string, TokenUsage> = {};
          usages.forEach((u, i) => {
            if (u && u.totalTokens > 0) {
              byStep[stepNames[i] || `step-${i}`] = u;
            }
          });

          const totals: TokenUsage = usages.reduce(
            (acc: TokenUsage, usage) => {
              if (!usage) return acc;
              return {
                inputTokens: acc.inputTokens + (usage.inputTokens || 0),
                outputTokens: acc.outputTokens + (usage.outputTokens || 0),
                totalTokens: acc.totalTokens + (usage.totalTokens || 0),
              };
            },
            { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          );
          return {
            ...totals,
            costUsd: calculateCost(
              totals,
              MODELS.OPUS as keyof typeof CLAUDE_PRICING,
            ),
            byStep,
          };
        }

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
        // AN0: Problem Framing (v10)
        // =========================================
        const an0Result = await step.run('an0-problem-framing', async () => {
          await updateProgress({
            current_step: 'an0',
            phase_progress: 0,
          });

          // Add context about attached images if present
          const userMessageWithContext =
            imageAttachments.length > 0
              ? `${designChallenge}\n\n[Note: ${imageAttachments.length} image(s) attached for visual context]`
              : designChallenge;

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: AN0_PROMPT,
            userMessage: userMessageWithContext,
            maxTokens: 8000,
            images: imageAttachments.length > 0 ? imageAttachments : undefined,
          });

          const parsed = parseJsonResponse<AN0Output>(content, 'AN0');
          const validated = AN0OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });

          return { result: validated, usage };
        });

        // Handle v10 AN0 output - check if clarification needed
        if (an0Result.result.need_question === true) {
          // Extract question with type narrowing
          const clarificationQuestion = an0Result.result.question;

          // Need clarification - store and wait
          state = {
            ...state,
            needsClarification: true,
            clarificationQuestion,
            completedSteps: ['an0'],
          };

          await step.run('store-clarification', async () => {
            await updateProgress({
              status: 'clarifying',
              clarifications: [
                {
                  question: clarificationQuestion,
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
                    question: clarificationQuestion,
                    answer: clarificationEvent.data.answer,
                    answeredAt: new Date().toISOString(),
                  },
                ],
              });
            });

            // Re-run AN0 with clarification answer
            const an0RetryResult = await step.run(
              'an0-with-clarification',
              async () => {
                const clarifiedChallenge = `${designChallenge}\n\nClarification: ${clarificationEvent.data.answer}`;

                const { content, usage } = await callClaude({
                  model: MODELS.OPUS,
                  system: AN0_PROMPT,
                  userMessage: clarifiedChallenge,
                  maxTokens: 8000,
                });

                const parsed = parseJsonResponse<AN0Output>(content, 'AN0');
                return { result: AN0OutputSchema.parse(parsed), usage };
              },
            );

            // Use the retry result if it's a full analysis
            if (an0RetryResult.result.need_question === false) {
              // Update state with v10 AN0 analysis outputs
              state = updateStateWithAN0Analysis(state, an0RetryResult.result);
              // Merge usage
              an0Result.usage = {
                inputTokens:
                  an0Result.usage.inputTokens +
                  an0RetryResult.usage.inputTokens,
                outputTokens:
                  an0Result.usage.outputTokens +
                  an0RetryResult.usage.outputTokens,
                totalTokens:
                  an0Result.usage.totalTokens +
                  an0RetryResult.usage.totalTokens,
              };
            }
          }
        } else {
          // Full analysis - update state with v10 AN0 outputs
          state = updateStateWithAN0Analysis(state, an0Result.result);
        }

        // =========================================
        // AN1: Corpus Retrieval (v10 - 4 namespaces)
        // =========================================
        const an1Result = await step.run('an1-corpus-retrieval', async () => {
          await updateProgress({
            current_step: 'an1',
            phase_progress: 0,
          });

          // Check if vector search is available
          if (!isVectorSearchAvailable()) {
            console.warn('Vector search not available - skipping AN1');
            await updateProgress({ phase_progress: 100 });
            return {
              failures: [],
              bounds: [],
              transfers: [],
              triz: [],
              summary: 'Corpus retrieval skipped - API keys not configured',
            };
          }

          // Build namespace-specific queries from AN0 v10 output
          const queries = buildRetrievalQueries({
            original_ask: state.an0_original_ask,
            corpus_queries: state.an0_corpus_queries,
            cross_domain_seeds: state.an0_cross_domain_seeds,
            contradiction: state.an0_contradiction,
          });

          // Retrieve from 4 namespaces with targeted queries
          const results = await retrieveTargeted(queries, {
            failuresK: 10,
            boundsK: 10,
            transfersK: 15,
            trizK: 15,
          });

          const summary = formatRetrievalSummary(results);
          console.log(`AN1 Complete: ${summary}`);

          await updateProgress({ phase_progress: 100 });

          return {
            ...results,
            summary,
          };
        });

        // Update state with AN1 results (v10 - 4 namespaces)
        state = {
          ...state,
          an1_failures: an1Result.failures,
          an1_bounds: an1Result.bounds,
          an1_transfers: an1Result.transfers,
          an1_triz: an1Result.triz,
          an1_retrieval_summary: an1Result.summary,
          completedSteps: [...state.completedSteps, 'an1'],
        };

        // =========================================
        // AN1.5: Teaching Example Selection (v10)
        // =========================================
        let an1_5Result: AN1_5_Output | null = null;

        const hasCorpusResults =
          an1Result.failures.length > 0 ||
          an1Result.bounds.length > 0 ||
          an1Result.transfers.length > 0 ||
          an1Result.triz.length > 0;

        // Track AN1.5 usage separately since it's conditional
        let an1_5Usage: TokenUsage | null = null;

        if (hasCorpusResults) {
          const an1_5StepResult = await step.run(
            'an1.5-teaching-selection',
            async () => {
              await updateProgress({
                current_step: 'an1.5',
                phase_progress: 0,
              });

              const contextMessage = buildAN1_5ContextV10(state);

              const { content, usage } = await callClaude({
                model: MODELS.OPUS,
                system: AN1_5_PROMPT,
                userMessage: contextMessage,
                maxTokens: 8000,
              });

              const parsed = parseJsonResponse<AN1_5_Output>(content, 'AN1.5');
              const validated = AN1_5_OutputSchema.parse(parsed);

              await updateProgress({ phase_progress: 100 });

              return { result: validated, usage };
            },
          );

          an1_5Result = an1_5StepResult.result;
          an1_5Usage = an1_5StepResult.usage;

          // Update state with AN1.5 results (v10)
          state = {
            ...state,
            an1_5_triz_exemplars: an1_5Result.teaching_examples.triz_exemplars,
            an1_5_transfer_exemplars:
              an1_5Result.teaching_examples.transfer_exemplars,
            an1_5_innovation_guidance:
              an1_5Result.teaching_examples.innovation_guidance,
            an1_5_failure_patterns:
              an1_5Result.validation_data.failure_patterns,
            an1_5_parameter_bounds:
              an1_5Result.validation_data.parameter_bounds,
            an1_5_corpus_gaps: an1_5Result.corpus_gaps,
            completedSteps: [...state.completedSteps, 'an1.5'],
          };
        } else {
          state.completedSteps = [...state.completedSteps, 'an1.5'];
        }

        // =========================================
        // AN1.7: Literature Augmentation (v10)
        // =========================================
        const an1_7Result = await step.run('an1.7-literature', async () => {
          await updateProgress({
            current_step: 'an1.7',
            phase_progress: 0,
          });

          const contextMessage = buildAN1_7ContextV10(state, an1_5Result);

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: AN1_7_PROMPT,
            userMessage: contextMessage,
            maxTokens: 8000,
          });

          const parsed = parseJsonResponse<AN1_7_Output>(content, 'AN1.7');
          const validated = AN1_7_OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });

          return { result: validated, usage };
        });

        // Update state with AN1.7 results (v10)
        state = {
          ...state,
          an1_7_searches_performed: an1_7Result.result.searches_performed,
          an1_7_commercial_precedent: an1_7Result.result.commercial_precedent,
          an1_7_process_parameters: an1_7Result.result.process_parameters,
          an1_7_competitive_landscape: an1_7Result.result.competitive_landscape,
          an1_7_literature_gaps: an1_7Result.result.literature_gaps,
          completedSteps: [...state.completedSteps, 'an1.7'],
        };

        // =========================================
        // AN2: Innovation Methodology Briefing (v10)
        // =========================================
        const an2Result = await step.run(
          'an2-innovation-briefing',
          async () => {
            await updateProgress({
              current_step: 'an2',
              phase_progress: 0,
            });

            const contextMessage = buildAN2ContextV10(
              state,
              an1_5Result,
              an1_7Result.result,
            );

            const { content, usage } = await callClaude({
              model: MODELS.OPUS,
              system: AN2_PROMPT,
              userMessage: contextMessage,
              maxTokens: 8000,
            });

            const parsed = parseJsonResponse<AN2Output>(content, 'AN2');
            const validated = AN2OutputSchema.parse(parsed);

            await updateProgress({ phase_progress: 100 });

            return { result: validated, usage };
          },
        );

        // Update state with AN2 results (v10)
        state = {
          ...state,
          an2_first_principles_foundation:
            an2Result.result.first_principles_foundation,
          an2_problem_physics: an2Result.result.problem_physics,
          an2_innovation_patterns: an2Result.result.innovation_patterns,
          an2_cross_domain_map: an2Result.result.cross_domain_map,
          an2_triz_guidance: an2Result.result.triz_guidance,
          an2_design_constraints: an2Result.result.design_constraints,
          an2_innovation_brief: an2Result.result.innovation_brief,
          completedSteps: [...state.completedSteps, 'an2'],
        };

        // =========================================
        // AN3: Concept Generation (v10)
        // =========================================
        const an3Result = await step.run('an3-concept-generation', async () => {
          await updateProgress({
            current_step: 'an3',
            phase_progress: 0,
          });

          const contextMessage = buildAN3ContextV10(state, an2Result.result);

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: AN3_PROMPT,
            userMessage: contextMessage,
            maxTokens: 24000,
          });

          const parsed = parseJsonResponse<AN3Output>(content, 'AN3');
          const validated = AN3OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });

          return { result: validated, usage };
        });

        // Update state with AN3 results (v10)
        state = {
          ...state,
          an3_concepts: an3Result.result.concepts,
          an3_track_distribution: an3Result.result.track_distribution,
          an3_innovation_notes: an3Result.result.innovation_notes,
          an3_concepts_considered_but_rejected:
            an3Result.result.concepts_considered_but_rejected,
          completedSteps: [...state.completedSteps, 'an3'],
        };

        // =========================================
        // AN4: Evaluation & Validation (v10)
        // =========================================
        const an4Result = await step.run('an4-evaluation', async () => {
          await updateProgress({
            current_step: 'an4',
            phase_progress: 0,
          });

          const contextMessage = buildAN4ContextV10(
            state,
            an3Result.result,
            an2Result.result,
          );

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: AN4_PROMPT,
            userMessage: contextMessage,
            maxTokens: 16000, // Large output for validation gates
          });

          const parsed = parseJsonResponse<AN4Output>(content, 'AN4');
          const validated = AN4OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });

          return { result: validated, usage };
        });

        // Update state with AN4 results (v10)
        state = {
          ...state,
          an4_validation_results: an4Result.result.validation_results,
          an4_gate_summary: an4Result.result.gate_summary,
          an4_rankings: an4Result.result.rankings,
          an4_recommendation: an4Result.result.recommendation,
          an4_validation_plan: an4Result.result.validation_plan,
          completedSteps: [...state.completedSteps, 'an4'],
        };

        // =========================================
        // AN5: Executive Report Generation (v10)
        // =========================================
        const an5Result = await step.run('an5-report-generation', async () => {
          await updateProgress({
            current_step: 'an5',
            phase_progress: 0,
          });

          const contextMessage = buildAN5ContextV10(
            state,
            an2Result.result,
            an3Result.result,
            an4Result.result,
            an1_7Result.result,
          );

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: AN5_PROMPT,
            userMessage: contextMessage,
            maxTokens: 24000, // Large output for executive report
          });

          const parsed = parseJsonResponse<AN5Output>(content, 'AN5');
          const validated = AN5OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });

          return { result: validated, usage };
        });

        // Update state with final report (v12: report data is flat, not nested under .report)
        state = {
          ...state,
          an5_report: an5Result.result,
          completedSteps: [...state.completedSteps, 'an5'],
          completedAt: new Date().toISOString(),
        };

        // =========================================
        // Complete Report
        // =========================================
        // Collect all usages from step results
        const allUsages = [
          an0Result.usage,
          an1_5Usage, // may be null if corpus had no results
          an1_7Result.usage,
          an2Result.usage,
          an3Result.usage,
          an4Result.usage,
          an5Result.usage,
        ];
        const stepNames = ['an0', 'an1.5', 'an1.7', 'an2', 'an3', 'an4', 'an5'];
        const totalUsage = calculateTotalUsage(allUsages, stepNames);

        await step.run('complete-report', async () => {
          // Persist token usage to database (P0-081 fix)
          const { error: usageError } = await supabase.rpc('increment_usage', {
            p_account_id: accountId,
            p_tokens: totalUsage.totalTokens,
            p_is_report: true,
            p_is_chat: false,
          });
          if (usageError) {
            console.error('[Usage] Failed to persist usage:', usageError);
          } else {
            console.log('[Usage] Persisted:', {
              accountId,
              tokens: totalUsage.totalTokens,
              costUsd: totalUsage.costUsd,
            });
          }

          // Get the user's original input for the brief section
          const originalProblem =
            state.an0_original_ask ?? state.userInput ?? designChallenge;

          // Convert AN5 JSON report to markdown for fallback display
          const markdown = generateReportMarkdown(an5Result.result);

          // Get the recommended concept title from the lead concepts (v12 structure)
          const recommendedTitle =
            an5Result.result.solution_concepts?.lead_concepts?.[0]?.title ??
            'See report for details';

          // Extract headline from header title for dashboard display
          const headline = an5Result.result.header?.title ?? null;

          // Build the complete SparloReport structure for rendering
          // The brief is added here from AN0 user input - AN5 doesn't generate it
          // Tags are derived from TRIZ principles names for categorization
          const tags =
            state.an0_triz_principles?.slice(0, 3).map((p) => p.name) ?? [];

          const sparloReport = {
            // Core AN5 output (matches SparloReportSchema)
            header: an5Result.result.header,
            brief: {
              original_problem: originalProblem,
              tags,
            },
            executive_summary: an5Result.result.executive_summary,
            constraints: an5Result.result.constraints,
            problem_analysis: an5Result.result.problem_analysis,
            key_patterns: an5Result.result.key_patterns,
            solution_concepts: an5Result.result.solution_concepts,
            validation_summary: an5Result.result.validation_summary,
            challenge_the_frame: an5Result.result.challenge_the_frame,
            risks_and_watchouts: an5Result.result.risks_and_watchouts,
            next_steps: an5Result.result.next_steps,
            appendix: an5Result.result.appendix,
            metadata: an5Result.result.metadata,
            // Optional additional content can be added here if needed
            additional_content: undefined,
          };

          await updateProgress({
            status: 'complete',
            current_step: 'complete',
            phase_progress: 100,
            headline,
            // Store the SparloReport directly in report_data for page.tsx validation
            report_data: {
              ...sparloReport,
              // Also include auxiliary data for backwards compatibility and debugging
              markdown,
              chainState: state,
              concepts: an3Result.result.concepts,
              validation_results: an4Result.result.validation_results,
              recommendation: an4Result.result.recommendation,
              innovation_patterns: an2Result.result.innovation_patterns,
              recommendedConcept: recommendedTitle,
              retrieval_summary: state.an1_retrieval_summary,
              corpus_gaps: state.an1_5_corpus_gaps,
              commercial_precedent: state.an1_7_commercial_precedent,
              tokenUsage: totalUsage,
            },
          });
        });

        // Return success with token usage summary (visible in Inngest dashboard)
        return {
          success: true,
          reportId,
          usage: {
            byStep: totalUsage.byStep,
            total: {
              inputTokens: totalUsage.inputTokens,
              outputTokens: totalUsage.outputTokens,
              totalTokens: totalUsage.totalTokens,
            },
            estimatedCostUsd: Math.round(totalUsage.costUsd * 100) / 100,
          },
        };
      } // End of runReportGeneration()
    } finally {
      // Always decrement on exit (success or error)
      tracker?.decrement();
    }
  },
);

// =========================================
// Helper: Update state with AN0 analysis
// =========================================
function updateStateWithAN0Analysis(
  state: ChainState,
  result: AN0Output,
): ChainState {
  if (result.need_question === true) {
    return state; // Can't update with analysis from a question response
  }

  return {
    ...state,
    an0_original_ask: result.original_ask,
    an0_problem_interpretation: result.problem_interpretation,
    an0_ambiguities_detected: result.ambiguities_detected,
    an0_user_sector: result.user_sector,
    an0_primary_kpis: result.primary_kpis,
    an0_hard_constraints: result.hard_constraints,
    an0_key_interfaces: result.key_interfaces,
    an0_physics_of_problem: result.physics_of_problem,
    an0_first_principles: result.first_principles,
    an0_contradiction: result.contradiction,
    an0_secondary_contradictions: result.secondary_contradictions,
    an0_triz_principles: result.triz_principles,
    an0_paradigms: result.paradigms,
    an0_cross_domain_seeds: result.cross_domain_seeds,
    an0_corpus_queries: result.corpus_queries,
    an0_web_search_queries: result.web_search_queries,
    an0_materials_mentioned: result.materials_mentioned,
    an0_mechanisms_mentioned: result.mechanisms_mentioned,
    an0_reframed_problem: result.reframed_problem,
    needsClarification: false,
    completedSteps: ['an0'],
  };
}

// =========================================
// Context Building Functions (v10)
// =========================================

function buildAN1_5ContextV10(state: ChainState): string {
  // Helper to truncate and simplify corpus items for context
  const simplifyCorpusItems = (
    items:
      | Array<{
          id: string;
          title: string;
          text_preview: string;
          relevance_score: number;
        }>
      | null
      | undefined,
    maxItems: number,
    maxPreviewLength: number = 500,
  ) => {
    if (!items) return [];
    return items.slice(0, maxItems).map((item) => ({
      id: item.id,
      title: item.title,
      text_preview:
        item.text_preview?.slice(0, maxPreviewLength) +
        (item.text_preview?.length > maxPreviewLength ? '...' : ''),
      score: Math.round(item.relevance_score * 100) / 100,
    }));
  };

  return `## Problem Context (from AN0)

**Challenge:** ${state.an0_original_ask ?? state.userInput}
**Reframed:** ${state.an0_reframed_problem ?? 'Not specified'}
**Sector:** ${state.an0_user_sector ?? 'Not specified'}

**Core Contradiction:**
${state.an0_contradiction?.plain_english ?? 'Not identified'}
- Improving: ${state.an0_contradiction?.improve_parameter?.name ?? 'N/A'} (TRIZ #${state.an0_contradiction?.improve_parameter?.id ?? 'N/A'})
- Worsening: ${state.an0_contradiction?.worsen_parameter?.name ?? 'N/A'} (TRIZ #${state.an0_contradiction?.worsen_parameter?.id ?? 'N/A'})

**TRIZ Principles Suggested:**
${state.an0_triz_principles?.map((p) => `- #${p.id} ${p.name}: ${p.why_relevant}`).join('\n') ?? 'None'}

**First Principles:**
- Goal: ${state.an0_first_principles?.actual_goal ?? 'Not specified'}
- Fundamental truths: ${state.an0_first_principles?.fundamental_truths?.join('; ') ?? 'None'}

---

## RAW RETRIEVAL RESULTS (4 namespaces)

### FAILURES (${state.an1_failures?.length ?? 0} results)
${JSON.stringify(simplifyCorpusItems(state.an1_failures, 10), null, 2)}

### BOUNDS (${state.an1_bounds?.length ?? 0} results)
${JSON.stringify(simplifyCorpusItems(state.an1_bounds, 10), null, 2)}

### TRANSFERS (${state.an1_transfers?.length ?? 0} results)
${JSON.stringify(simplifyCorpusItems(state.an1_transfers, 15), null, 2)}

### TRIZ EXAMPLES (${state.an1_triz?.length ?? 0} results)
${JSON.stringify(simplifyCorpusItems(state.an1_triz, 15), null, 2)}

---

Please select TEACHING EXAMPLES (triz_exemplars, transfer_exemplars) and VALIDATION DATA (failure_patterns, parameter_bounds) from these results.`;
}

function buildAN1_7ContextV10(
  state: ChainState,
  an1_5Result: AN1_5_Output | null,
): string {
  return `## Problem Context

**Challenge:** ${state.an0_original_ask ?? state.userInput}
**Sector:** ${state.an0_user_sector ?? 'Not specified'}
**Reframed Problem:** ${state.an0_reframed_problem ?? 'Not specified'}

**Core Contradiction:** ${state.an0_contradiction?.plain_english ?? 'Not identified'}

---

## Corpus Gaps Identified
${JSON.stringify(an1_5Result?.corpus_gaps ?? state.an1_5_corpus_gaps ?? [], null, 2)}

## Materials/Mechanisms to Research
- Materials: ${state.an0_materials_mentioned?.join(', ') ?? 'None mentioned'}
- Mechanisms: ${state.an0_mechanisms_mentioned?.join(', ') ?? 'None mentioned'}

## Web Search Queries Suggested by AN0
${state.an0_web_search_queries?.map((q) => `- ${q}`).join('\n') ?? 'None'}

---

Please search literature to find commercial precedent, process parameters, and competitive intelligence.`;
}

function buildAN2ContextV10(
  state: ChainState,
  an1_5Result: AN1_5_Output | null,
  an1_7Result: AN1_7_Output,
): string {
  return `## Problem Framing (from AN0)

**Original Challenge:** ${state.an0_original_ask ?? state.userInput}
**Reframed Problem:** ${state.an0_reframed_problem ?? 'Not specified'}
**Sector:** ${state.an0_user_sector ?? 'Not specified'}

### First Principles Decomposition
- **Fundamental Truths:** ${state.an0_first_principles?.fundamental_truths?.join('; ') ?? 'Not specified'}
- **Actual Goal:** ${state.an0_first_principles?.actual_goal ?? 'Not specified'}
- **From-Scratch Approaches:** ${state.an0_first_principles?.from_scratch_approaches?.join('; ') ?? 'Not specified'}
- **Assumed Constraints:** ${JSON.stringify(state.an0_first_principles?.assumed_constraints ?? [], null, 2)}

### Physics of Problem
- Governing Principles: ${state.an0_physics_of_problem?.governing_principles?.join('; ') ?? 'Not specified'}
- Key Tradeoffs: ${state.an0_physics_of_problem?.key_tradeoffs?.join('; ') ?? 'Not specified'}
- Rate Limiting Factors: ${state.an0_physics_of_problem?.rate_limiting_factors?.join('; ') ?? 'Not specified'}

### Core Contradiction
${state.an0_contradiction?.plain_english ?? 'Not identified'}
- Improve: ${state.an0_contradiction?.improve_parameter?.name ?? 'N/A'}
- Worsen: ${state.an0_contradiction?.worsen_parameter?.name ?? 'N/A'}

### TRIZ Principles Suggested
${state.an0_triz_principles?.map((p) => `- #${p.id} ${p.name}: ${p.why_relevant}`).join('\n') ?? 'None'}

### Paradigms to Explore
- **Direct:** ${state.an0_paradigms?.direct?.approach ?? 'Not specified'}
- **Indirect:** ${state.an0_paradigms?.indirect?.approach ?? 'Not specified'}

### Cross-Domain Seeds
${state.an0_cross_domain_seeds?.map((s) => `- ${s.domain}: ${s.similar_challenge} (${s.why_relevant})`).join('\n') ?? 'None'}

---

## Teaching Examples (from AN1.5)

### TRIZ Exemplars
${JSON.stringify(an1_5Result?.teaching_examples?.triz_exemplars ?? state.an1_5_triz_exemplars ?? [], null, 2)}

### Transfer Exemplars
${JSON.stringify(an1_5Result?.teaching_examples?.transfer_exemplars ?? state.an1_5_transfer_exemplars ?? [], null, 2)}

### Innovation Guidance
${an1_5Result?.teaching_examples?.innovation_guidance ?? state.an1_5_innovation_guidance ?? 'Not provided'}

---

## Validation Data (from AN1.5)

### Failure Patterns
${JSON.stringify(an1_5Result?.validation_data?.failure_patterns ?? state.an1_5_failure_patterns ?? [], null, 2)}

### Parameter Bounds
${JSON.stringify(an1_5Result?.validation_data?.parameter_bounds ?? state.an1_5_parameter_bounds ?? [], null, 2)}

---

## Literature Validation (from AN1.7)

### Commercial Precedent
${JSON.stringify(an1_7Result.commercial_precedent, null, 2)}

### Process Parameters
${JSON.stringify(an1_7Result.process_parameters, null, 2)}

### Competitive Landscape
${an1_7Result.competitive_landscape}

---

Please create an INNOVATION METHODOLOGY BRIEFING that teaches HOW TO THINK about this problem.`;
}

function buildAN3ContextV10(state: ChainState, an2Result: AN2Output): string {
  return `## Innovation Methodology Briefing (from AN2)

### First Principles Foundation
- **Fundamental Truths:** ${an2Result.first_principles_foundation.fundamental_truths.join('; ')}
- **Actual Goal:** ${an2Result.first_principles_foundation.actual_goal_restated}
- **From-Scratch Insight:** ${an2Result.first_principles_foundation.from_scratch_insight}
- **Constraints Challenged:** ${JSON.stringify(an2Result.first_principles_foundation.constraints_challenged, null, 2)}

### Problem Physics
- **Core Challenge:** ${an2Result.problem_physics.core_challenge}
- **Governing Equations:** ${an2Result.problem_physics.governing_equations}
- **Key Tradeoff:** ${an2Result.problem_physics.key_tradeoff}
- **Success Metric:** ${an2Result.problem_physics.success_metric}

### Innovation Patterns
${an2Result.innovation_patterns
  .map(
    (p) => `**${p.pattern_name}**
- Mechanism: ${p.mechanism}
- When to use: ${p.when_to_use}
- Source: ${p.exemplar_source}
- Application hint: ${p.application_hint}`,
  )
  .join('\n\n')}

### Cross-Domain Inspiration Map
${an2Result.cross_domain_map.domains_to_mine
  .map(
    (d) => `**${d.domain}**
- Similar physics: ${d.similar_physics}
- Mechanisms: ${d.mechanisms_to_explore.join(', ')}
- Abstraction: ${d.abstraction}`,
  )
  .join('\n\n')}

**Transfer Thinking Prompt:** ${an2Result.cross_domain_map.transfer_thinking_prompt}

### TRIZ Application Guidance
${an2Result.triz_guidance.primary_principles
  .map(
    (p) => `**#${p.principle.id} ${p.principle.name}**
- Obvious (AVOID): ${p.obvious_application}
- Brilliant (AIM FOR): ${p.brilliant_application}
- Pattern: ${p.pattern}`,
  )
  .join('\n\n')}

**Combination Hint:** ${an2Result.triz_guidance.principle_combination_hint}

### Design Constraints

**Failure Modes to Prevent:**
${an2Result.design_constraints.failure_modes_to_prevent.map((f) => `- ${f.failure}: ${f.design_rule}`).join('\n')}

**Parameter Limits:**
${an2Result.design_constraints.parameter_limits.map((p) => `- ${p.parameter}: ${p.limit} (${p.implication})`).join('\n')}

---

## Innovation Brief
${an2Result.innovation_brief}

---

## Original Challenge
${state.an0_original_ask ?? state.userInput}

## KPIs and Constraints
**Primary KPIs:**
${state.an0_primary_kpis?.map((k) => `- ${k.name}: ${k.target ?? 'improve'} ${k.unit ?? ''}`).join('\n') ?? 'None specified'}

**Hard Constraints:**
${state.an0_hard_constraints?.map((c) => `- ${c.name}: ${c.reason} (flexibility: ${c.flexibility})`).join('\n') ?? 'None specified'}

---

Please generate 5-8 NOVEL SOLUTION CONCEPTS using the methodology above. Remember:
- At least one concept from FIRST PRINCIPLES
- Include all three tracks: Simpler Path, Best Fit, Spark
- Be SKETCHABLE, MECHANISTICALLY GROUNDED, TESTABLE
- Question assumed constraints`;
}

function buildAN4ContextV10(
  state: ChainState,
  an3Result: AN3Output,
  an2Result: AN2Output,
): string {
  return `## Concepts to Validate and Evaluate

${an3Result.concepts
  .map(
    (c) => `### ${c.concept_id}: ${c.title} (${c.track.replace('_', ' ')})

**Mechanism:** ${c.mechanism_description}

**Working Principle:** ${c.mechanistic_depth.working_principle}
**Rate Limiting Step:** ${c.mechanistic_depth.rate_limiting_step}
**Key Parameters:** ${c.mechanistic_depth.key_parameters.join('; ')}
**Potential Failures:** ${c.mechanistic_depth.failure_modes.join('; ')}

**Innovation Source:**
- Pattern: ${c.innovation_source.pattern_used}
- First Principles: ${c.innovation_source.first_principles_reasoning ?? 'N/A'}
- Cross-Domain: ${c.innovation_source.cross_domain_inspiration ?? 'N/A'}
- Novelty: ${c.innovation_source.novelty_claim}

**Self-Assessed Feasibility:** ${c.feasibility_check.overall_feasibility}
- Manufacturing: ${c.feasibility_check.manufacturing}
- Materials: ${c.feasibility_check.materials}

**Tradeoffs:** ${c.tradeoffs.join('; ')}

**Expected Impact:** ${c.expected_impact.primary_kpi_improvement} (${c.expected_impact.confidence})
`,
  )
  .join('\n---\n')}

---

## Design Constraints (from AN2)

### Failure Modes to Prevent
${an2Result.design_constraints.failure_modes_to_prevent.map((f) => `- **${f.failure}**: ${f.mechanism} → Design rule: ${f.design_rule}`).join('\n')}

### Parameter Limits
${an2Result.design_constraints.parameter_limits.map((p) => `- **${p.parameter}**: ${p.limit} (${p.implication})`).join('\n')}

---

## Problem Physics (from AN2)
- Core Challenge: ${an2Result.problem_physics.core_challenge}
- Key Tradeoff: ${an2Result.problem_physics.key_tradeoff}
- Success Metric: ${an2Result.problem_physics.success_metric}

---

## User's KPIs and Constraints (from AN0)

**Primary KPIs:**
${state.an0_primary_kpis?.map((k) => `- ${k.name}: ${k.target ?? 'improve'} ${k.unit ?? ''}`).join('\n') ?? 'None specified'}

**Hard Constraints:**
${state.an0_hard_constraints?.map((c) => `- ${c.name}: ${c.reason}`).join('\n') ?? 'None specified'}

---

Please validate each concept against the HARD GATES (bounds, failure modes, physics) and evaluate those that pass.`;
}

function buildAN5ContextV10(
  state: ChainState,
  an2Result: AN2Output,
  an3Result: AN3Output,
  an4Result: AN4Output,
  an1_7Result: AN1_7_Output,
): string {
  // Generate ISO timestamp for the report
  const generatedAt = new Date().toISOString();

  return `## Report Metadata

**IMPORTANT:** Include these exact values in your output:
- report_id: "${state.reportId}"
- analysis_id: "${state.conversationId ?? state.reportId}"
- generated_at: "${generatedAt}"

---

## Complete Analysis Data for Report Synthesis

### Problem Framing (AN0)

**Original Challenge:** ${state.an0_original_ask ?? state.userInput}
**Reframed:** ${state.an0_reframed_problem ?? 'Not specified'}
**Sector:** ${state.an0_user_sector ?? 'Not specified'}

**Core Contradiction:**
${state.an0_contradiction?.plain_english ?? 'Not identified'}
- Improve: ${state.an0_contradiction?.improve_parameter?.name ?? 'N/A'}
- Worsen: ${state.an0_contradiction?.worsen_parameter?.name ?? 'N/A'}

**Physics Summary:**
${state.an0_physics_of_problem?.governing_principles?.join('; ') ?? 'Not specified'}

**First Principles Insight:**
- Actual Goal: ${state.an0_first_principles?.actual_goal ?? 'Not specified'}
- From-Scratch: ${state.an0_first_principles?.from_scratch_approaches?.join('; ') ?? 'Not specified'}

**KPIs:**
${state.an0_primary_kpis?.map((k) => `- ${k.name}: ${k.target ?? 'improve'} ${k.unit ?? ''}`).join('\n') ?? 'None'}

**Constraints:**
${state.an0_hard_constraints?.map((c) => `- ${c.name}: ${c.reason}`).join('\n') ?? 'None'}

---

### Innovation Briefing Summary (AN2)

${an2Result.innovation_brief}

**Key Patterns:**
${an2Result.innovation_patterns.map((p) => `- ${p.pattern_name}: ${p.mechanism}`).join('\n')}

**TRIZ Guidance:**
${an2Result.triz_guidance.primary_principles.map((p) => `- #${p.principle.id} ${p.principle.name}`).join('\n')}

---

### Literature Validation (AN1.7)

**Commercial Precedent:**
${an1_7Result.commercial_precedent.map((p) => `- ${p.approach}: ${p.who_uses_it.join(', ')} (${p.confidence})`).join('\n') || 'None found'}

**Competitive Landscape:**
${an1_7Result.competitive_landscape}

---

### Concepts Generated (AN3)

**Track Distribution:**
- Simpler Path: ${an3Result.track_distribution.simpler_path.join(', ')}
- Best Fit: ${an3Result.track_distribution.best_fit.join(', ')}
- Spark: ${an3Result.track_distribution.spark.join(', ')}

**Innovation Notes:**
- Most Promising: ${an3Result.innovation_notes.most_promising}
- Highest Novelty: ${an3Result.innovation_notes.highest_novelty}
- Best Risk/Reward: ${an3Result.innovation_notes.best_risk_reward}
- First Principles Winner: ${an3Result.innovation_notes.first_principles_winner}

**All Concepts:**
${an3Result.concepts
  .map(
    (c) => `**${c.concept_id}: ${c.title}** (${c.track})
${c.mechanism_description}
- Innovation: ${c.innovation_source.novelty_claim}
- Expected Impact: ${c.expected_impact.primary_kpi_improvement}
- Feasibility: ${c.feasibility_check.overall_feasibility}`,
  )
  .join('\n\n')}

---

### Validation Results (AN4)

**Gate Summary:**
- Passed: ${an4Result.gate_summary.passed.join(', ')}
- Conditional: ${an4Result.gate_summary.conditional.join(', ')}
- Failed: ${an4Result.gate_summary.failed.join(', ')}

**Failure Reasons:**
${an4Result.gate_summary.failure_reasons.map((f) => `- ${f.concept_id}: ${f.reason}`).join('\n') || 'None'}

**Overall Rankings:**
${an4Result.rankings.overall.map((r) => `${r.rank}. ${r.concept_id} (${r.score}/100): ${r.one_liner}`).join('\n')}

---

### Recommendation (AN4)

**Primary:**
- ${an4Result.recommendation.primary.concept_id}: ${an4Result.recommendation.primary.title}
- Why: ${an4Result.recommendation.primary.why_this_one}
- Next Steps: ${an4Result.recommendation.primary.next_steps.join('; ')}
- Key Risk: ${an4Result.recommendation.primary.key_risk}
- De-risk: ${an4Result.recommendation.primary.de_risk_plan}

**Parallel Spark:**
- ${an4Result.recommendation.parallel_spark.concept_id}: ${an4Result.recommendation.parallel_spark.title}
- Why: ${an4Result.recommendation.parallel_spark.why_explore}

**Fallback:**
- ${an4Result.recommendation.fallback.concept_id}: ${an4Result.recommendation.fallback.title}
- When: ${an4Result.recommendation.fallback.when_to_use}

---

### Validation Plan (AN4)

**Critical Experiments:**
${an4Result.validation_plan.critical_experiments.map((e) => `- ${e.name}: ${e.tests_assumption} (${e.estimated_effort})`).join('\n')}

**Kill Conditions:**
${an4Result.validation_plan.kill_conditions.join('\n')}

**Pivot Triggers:**
${an4Result.validation_plan.pivot_triggers.join('\n')}

---

Please synthesize this into an EXECUTIVE INNOVATION REPORT following the specified structure.`;
}

// =========================================
// Helper: Convert AN5 JSON Report to Markdown (v12)
// =========================================
function generateReportMarkdown(report: AN5Output): string {
  const sections: string[] = [];

  // Title
  sections.push(`# ${report.header.title}`);
  sections.push('');

  // Executive Summary
  sections.push('## Executive Summary');
  sections.push('');
  sections.push(
    `**Viability: ${report.executive_summary.viability}**${report.executive_summary.viability_label ? ` — ${report.executive_summary.viability_label}` : ''}`,
  );
  sections.push('');
  sections.push(report.executive_summary.the_problem);
  sections.push('');
  sections.push(
    `**Core Insight:** ${report.executive_summary.core_insight.headline}`,
  );
  sections.push('');
  sections.push(report.executive_summary.core_insight.explanation);
  sections.push('');
  sections.push('**Recommended Path:**');
  sections.push('');
  report.executive_summary.recommended_path.forEach((step) => {
    sections.push(`${step.step_number}. ${step.content}`);
  });
  sections.push('');
  sections.push('---');
  sections.push('');

  // Your Constraints
  sections.push('## Your Constraints');
  sections.push('');
  sections.push('**From your input:**');
  sections.push('');
  report.constraints.from_input.forEach((c) => {
    const note = c.note ? ` — *${c.note}*` : '';
    sections.push(`- ${c.constraint}${note}`);
  });
  sections.push('');
  sections.push('**Assumptions made (flag if incorrect):**');
  sections.push('');
  report.constraints.assumptions.forEach((a) => {
    sections.push(`- ${a.assumption}`);
  });
  sections.push('');
  sections.push('---');
  sections.push('');

  // Problem Analysis
  sections.push('## Problem Analysis');
  sections.push('');
  sections.push("**What's going wrong:**");
  sections.push('');
  sections.push(report.problem_analysis.whats_wrong.prose);
  if (report.problem_analysis.whats_wrong.technical_note) {
    sections.push('');
    if (report.problem_analysis.whats_wrong.technical_note.equation) {
      sections.push(
        `> \`${report.problem_analysis.whats_wrong.technical_note.equation}\``,
      );
    }
    sections.push(
      `> ${report.problem_analysis.whats_wrong.technical_note.explanation}`,
    );
  }
  sections.push('');
  sections.push("**Why it's hard:**");
  sections.push('');
  sections.push(report.problem_analysis.why_its_hard.prose);
  sections.push('');
  report.problem_analysis.why_its_hard.factors.forEach((f) => {
    sections.push(`- ${f}`);
  });
  if (report.problem_analysis.why_its_hard.additional_prose) {
    sections.push('');
    sections.push(report.problem_analysis.why_its_hard.additional_prose);
  }
  sections.push('');
  sections.push('**First Principles Insight:**');
  sections.push('');
  sections.push(
    `**${report.problem_analysis.first_principles_insight.headline}**`,
  );
  sections.push('');
  sections.push(report.problem_analysis.first_principles_insight.explanation);
  sections.push('');
  sections.push('**Root Causes:**');
  sections.push('');
  report.problem_analysis.root_cause_hypotheses.forEach((h) => {
    sections.push(
      `> **${h.id}. ${h.name}** (${h.confidence}) — ${h.explanation}`,
    );
    sections.push('');
  });
  sections.push('**Success Metrics:**');
  sections.push('');
  report.problem_analysis.success_metrics.forEach((m) => {
    sections.push(`- ${m.metric}: ${m.target}`);
  });
  sections.push('');
  sections.push('---');
  sections.push('');

  // Key Patterns
  sections.push('## Key Patterns');
  sections.push('');
  report.key_patterns.forEach((p) => {
    sections.push(`**${p.name}** *(${p.source_industry})*`);
    sections.push('');
    sections.push(p.description);
    sections.push('');
    sections.push(`*Why it matters:* ${p.why_it_matters}`);
    sections.push('');
  });
  sections.push('---');
  sections.push('');

  // Solution Concepts
  sections.push('## Solution Concepts');
  sections.push('');

  // Lead Concepts
  sections.push('### Lead Concepts');
  sections.push('');
  report.solution_concepts.lead_concepts.forEach((c) => {
    sections.push(`**${c.title}** — *${c.track_label}*`);
    sections.push('');
    sections.push(`**Bottom line:** ${c.bottom_line}`);
    sections.push('');
    sections.push(`**What it is:** ${c.what_it_is}`);
    sections.push('');
    sections.push(`**Why it works:** ${c.why_it_works}`);
    sections.push('');
    sections.push(
      `**Confidence: ${c.confidence}** — ${c.confidence_rationale}`,
    );
    sections.push('');
    sections.push(`**What would change this:** ${c.what_would_change_this}`);
    sections.push('');
    sections.push('**Key risks:**');
    sections.push('');
    c.key_risks.forEach((r) => {
      sections.push(`- *${r.risk}* — **Mitigation:** ${r.mitigation}`);
    });
    sections.push('');
    sections.push('**How to test:**');
    sections.push('');
    c.how_to_test.forEach((gate) => {
      sections.push(`> **${gate.gate_id}: ${gate.name}** — ${gate.effort}`);
      sections.push(`> ${gate.method}`);
      sections.push(`> GO: ${gate.go_criteria}`);
      sections.push(`> NO-GO: ${gate.no_go_criteria}`);
      sections.push('');
    });
    sections.push('---');
    sections.push('');
  });

  // Other Concepts
  if (report.solution_concepts.other_concepts.length > 0) {
    sections.push('### Other Concepts');
    sections.push('');
    report.solution_concepts.other_concepts.forEach((c) => {
      sections.push(`**${c.title}** — *${c.track_label}*`);
      sections.push('');
      sections.push(`**Bottom line:** ${c.bottom_line}`);
      sections.push('');
      sections.push(c.what_it_is);
      sections.push('');
      sections.push(
        `**Confidence: ${c.confidence}** — ${c.confidence_rationale}`,
      );
      sections.push('');
      sections.push(`**Critical validation:** ${c.critical_validation}`);
      sections.push('');
      sections.push('---');
      sections.push('');
    });
  }

  // Innovation Concept
  if (report.solution_concepts.innovation_concept) {
    const s = report.solution_concepts.innovation_concept;
    sections.push('### Innovation Concept');
    sections.push('');
    sections.push(`**${s.title}**`);
    sections.push('');
    sections.push(`**Why it's interesting:** ${s.why_interesting}`);
    sections.push('');
    sections.push(`**Why it's uncertain:** ${s.why_uncertain}`);
    sections.push('');
    sections.push(`**Confidence: ${s.confidence}.**`);
    sections.push('');
    sections.push(`**When to pursue:** ${s.when_to_pursue}`);
    sections.push('');
    sections.push(`**Critical validation:** ${s.critical_validation}`);
    sections.push('');
    sections.push('---');
    sections.push('');
  }

  // Concept Comparison
  sections.push('## Concept Comparison');
  sections.push('');
  sections.push(
    '| Concept | Key Metric | Confidence | Capital | Timeline | Key Risk |',
  );
  sections.push(
    '|---------|------------|------------|---------|----------|----------|',
  );
  report.solution_concepts.comparison_table.forEach((row) => {
    sections.push(
      `| ${row.title} | ${row.key_metric_achievable} | ${row.confidence} | ${row.capital_required} | ${row.timeline} | ${row.key_risk} |`,
    );
  });
  sections.push('');
  sections.push(
    `**Key insight:** ${report.solution_concepts.comparison_insight}`,
  );
  sections.push('');
  sections.push('---');
  sections.push('');

  // Validation Summary
  sections.push('## Validation Summary');
  sections.push('');
  sections.push('**Failure Modes Checked:**');
  sections.push('');
  report.validation_summary.failure_modes_checked.forEach((m) => {
    sections.push(`- ${m.mode} — ${m.how_addressed}`);
  });
  sections.push('');
  sections.push('**Parameter Bounds Validated:**');
  sections.push('');
  report.validation_summary.parameter_bounds_validated.forEach((b) => {
    sections.push(`- ${b.bound}${b.value ? `: ${b.value}` : ''}`);
  });
  sections.push('');
  sections.push('**Literature Precedent:**');
  sections.push('');
  report.validation_summary.literature_precedent.forEach((p) => {
    sections.push(
      `- ${p.approach}: ${p.precedent_level}${p.source ? ` (${p.source})` : ''}`,
    );
  });
  sections.push('');
  sections.push('---');
  sections.push('');

  // Challenge the Frame
  sections.push('## Challenge the Frame');
  sections.push('');
  sections.push(
    'Before committing to any path, pressure-test these assumptions:',
  );
  sections.push('');
  report.challenge_the_frame.forEach((c) => {
    sections.push(`**${c.question}**`);
    sections.push(c.implication);
    sections.push(`*${c.action_or_test.label}:* ${c.action_or_test.content}`);
    sections.push('');
  });
  sections.push('---');
  sections.push('');

  // Risks & Watchouts
  sections.push('## Risks & Watchouts');
  sections.push('');
  report.risks_and_watchouts.forEach((r) => {
    sections.push(`**${r.name} — ${r.likelihood_label}**`);
    sections.push(r.description);
    sections.push(`*Mitigation:* ${r.mitigation}`);
    sections.push(`*Trigger:* ${r.trigger}`);
    sections.push('');
  });
  sections.push('---');
  sections.push('');

  // Next Steps
  sections.push('## Next Steps');
  sections.push('');
  report.next_steps.steps.forEach((s) => {
    sections.push(
      `${s.step_number}. **${s.action}** — ${s.details} *(${s.timeframe})*`,
    );
  });
  sections.push('');
  sections.push('---');
  sections.push('');

  // Appendix
  sections.push('## Appendix');
  sections.push('');
  sections.push('### All Concepts Summary');
  sections.push('');
  sections.push('| ID | Title | Track | Status | Score |');
  sections.push('|----|-------|-------|--------|-------|');
  report.appendix.all_concepts.forEach((c) => {
    sections.push(
      `| ${c.id} | ${c.title} | ${c.track} | ${c.gate_status} | ${c.overall_score} |`,
    );
  });
  sections.push('');
  if (report.appendix.constraints_respected.length > 0) {
    sections.push('### Constraints Respected');
    report.appendix.constraints_respected.forEach((c) => {
      sections.push(`- ${c}`);
    });
    sections.push('');
  }
  if (report.appendix.assumptions_made.length > 0) {
    sections.push('### Assumptions Made');
    report.appendix.assumptions_made.forEach((a) => {
      sections.push(`- ${a}`);
    });
    sections.push('');
  }
  sections.push(`**Methodology Notes:** ${report.appendix.methodology_notes}`);

  return sections.join('\n');
}
