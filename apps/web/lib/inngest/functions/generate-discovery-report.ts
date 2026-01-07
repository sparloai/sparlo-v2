import 'server-only';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import {
  CLAUDE_PRICING,
  ClaudeRefusalError,
  type ImageAttachment,
  MODELS,
  type TokenUsage,
  calculateCost,
  callClaude,
  parseJsonResponse,
} from '../../llm/client';
import {
  type AN0DOutput,
  AN0DOutputSchema,
  AN0_D_PROMPT,
  type AN1_5_D_Output,
  AN1_5_D_OutputSchema,
  AN1_5_D_PROMPT,
  type AN1_7_D_Output,
  AN1_7_D_OutputSchema,
  AN1_7_D_PROMPT,
  type AN2_D_Output,
  AN2_D_OutputSchema,
  AN2_D_PROMPT,
  type AN3_D_Output,
  AN3_D_OutputSchema,
  AN3_D_PROMPT,
  type AN4_D_Output,
  AN4_D_OutputSchema,
  AN4_D_PROMPT,
  type AN5_D_Output,
  AN5_D_OutputSchema,
  AN5_D_PROMPT,
  DISCOVERY_CHAIN_CONFIG,
} from '../../llm/prompts/discovery';
import { inngest } from '../client';
import { trackReportCompleted } from '../utils/analytics';
import { handleReportFailure } from '../utils/report-failure-handler';

/**
 * Generate Discovery Report - Inngest Durable Function
 *
 * Discovery Mode Chain:
 * - AN0-D: Problem framing with industry exclusion
 * - AN1-D: Corpus retrieval (non-obvious domains) [skipped if no corpus]
 * - AN1.5-D: Teaching example selection (biology, geology, abandoned tech)
 * - AN1.7-D: Literature search for GAPS
 * - AN2-D: Discovery methodology briefing
 * - AN3-D: Novel concept generation
 * - AN4-D: Novelty-first evaluation
 * - AN5-D: Discovery report
 *
 * Key differences from standard chain:
 * - EXCLUDES what industry is already doing
 * - HUNTS in non-obvious domains
 * - VALIDATES physics feasibility while prioritizing novelty
 * - PRODUCES a report focused on "what has everyone missed?"
 */
export const generateDiscoveryReport = inngest.createFunction(
  {
    id: 'discovery-report-generator',
    retries: 2,
    cancelOn: [
      {
        event: 'report/cancel.requested',
        match: 'data.reportId',
      },
    ],
    onFailure: async ({ error, event, step }) => {
      const failureEvent = event as unknown as {
        event: { data: { reportId: string } };
      };
      const reportId = failureEvent.event.data.reportId;
      await handleReportFailure(reportId, error, step);
    },
  },
  { event: 'report/generate-discovery' },
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
      console.log('[Discovery Function] Starting with event:', {
        name: event.name,
        reportId: event.data.reportId,
        hasDesignChallenge: !!event.data.designChallenge,
      });

      const { reportId, designChallenge, conversationId, attachments } =
        event.data;

      // Convert attachments to ImageAttachment format for Claude vision
      const imageAttachments: ImageAttachment[] = (attachments || [])
        .filter((a: { media_type: string }) =>
          a.media_type.startsWith('image/'),
        )
        .map((a: { media_type: string; data: string }) => ({
          media_type: a.media_type as ImageAttachment['media_type'],
          data: a.data,
        }));

      const supabase = getSupabaseServerAdminClient();
      console.log('[Discovery Function] Supabase client initialized');

      // Handle ClaudeRefusalError at the top level
      try {
        return await runDiscoveryGeneration();
      } catch (error) {
        if (error instanceof ClaudeRefusalError) {
          // P1 FIX: Use fresh client to avoid stale reference
          const freshSupabase = getSupabaseServerAdminClient();
          await freshSupabase
            .from('sparlo_reports')
            .update({
              status: 'failed',
              error_message: error.message,
              updated_at: new Date().toISOString(),
            })
            .eq('id', reportId);

          return { success: false, reportId, error: error.message };
        }
        throw error;
      }

      async function runDiscoveryGeneration() {
        // Helper to calculate total usage from collected step usages
        function calculateTotalUsage(usages: TokenUsage[]): TokenUsage & {
          costUsd: number;
          byStep: Record<string, TokenUsage>;
        } {
          const byStep: Record<string, TokenUsage> = {};
          usages.forEach((u, i) => {
            if (u && u.totalTokens > 0) {
              byStep[`step-${i}`] = u;
            }
          });

          const totals = usages.reduce(
            (acc, usage) => {
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
         * P1 FIX: Use fresh client to avoid stale reference in step.run callbacks
         */
        async function updateProgress(updates: Record<string, unknown>) {
          const freshSupabase = getSupabaseServerAdminClient();
          const { error } = await freshSupabase
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
        // AN0-D: Discovery Problem Framing
        // =========================================
        const an0dResult = await step.run(
          'an0-d-discovery-problem-framing',
          async () => {
            await updateProgress({
              current_step: 'an0-d',
              phase_progress: 0,
            });

            // Include images for vision processing if attachments were provided
            const userMessageWithContext =
              imageAttachments.length > 0
                ? `${designChallenge}\n\n[Note: ${imageAttachments.length} image(s) attached for visual context]`
                : designChallenge;

            const { content, usage } = await callClaude({
              model: MODELS.OPUS,
              system: AN0_D_PROMPT,
              userMessage: userMessageWithContext,
              maxTokens: DISCOVERY_CHAIN_CONFIG.maxTokensByPhase['an0-d'],
              temperature: DISCOVERY_CHAIN_CONFIG.temperatureByPhase['an0-d'],
              images:
                imageAttachments.length > 0 ? imageAttachments : undefined,
            });

            const parsed = parseJsonResponse<AN0DOutput>(content, 'AN0-D');
            const validated = AN0DOutputSchema.parse(parsed);

            await updateProgress({ phase_progress: 100 });

            return { result: validated, usage };
          },
        );

        // Handle clarification if needed
        if (an0dResult.result.need_question === true) {
          // Extract question with type narrowing
          const clarificationQuestion = an0dResult.result.question;

          await step.run('store-discovery-clarification', async () => {
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
            'wait-for-discovery-clarification',
            {
              event: 'report/discovery-clarification-answered',
              match: 'data.reportId',
              timeout: '24h',
            },
          );

          if (!clarificationEvent) {
            await updateProgress({
              status: 'error',
              error_message: 'Clarification timed out after 24 hours',
            });
            return {
              success: false,
              reportId,
              error: 'Clarification timed out',
            };
          }

          // Re-run AN0-D with clarification (include original attachments)
          const clarifiedResult = await step.run(
            'an0-d-with-clarification',
            async () => {
              // Build message with clarification + original attachments
              let clarifiedMessage = `${designChallenge}\n\nClarification: ${clarificationEvent.data.answer}`;
              if (imageAttachments.length > 0) {
                clarifiedMessage += `\n\n[Note: ${imageAttachments.length} image(s) attached for visual context]`;
              }

              const { content, usage } = await callClaude({
                model: MODELS.OPUS,
                system: AN0_D_PROMPT,
                userMessage: clarifiedMessage,
                maxTokens: DISCOVERY_CHAIN_CONFIG.maxTokensByPhase['an0-d'],
                temperature: DISCOVERY_CHAIN_CONFIG.temperatureByPhase['an0-d'],
                images:
                  imageAttachments.length > 0 ? imageAttachments : undefined,
              });

              const parsed = parseJsonResponse<AN0DOutput>(content, 'AN0-D');
              return { result: AN0DOutputSchema.parse(parsed), usage };
            },
          );

          if (clarifiedResult.result.need_question === true) {
            await updateProgress({
              status: 'error',
              error_message: 'Unable to proceed after clarification',
            });
            return {
              success: false,
              reportId,
              error: 'Unable to proceed after clarification',
            };
          }

          // Use clarified result (merge usage into an0dResult)
          an0dResult.result = clarifiedResult.result;
          an0dResult.usage = {
            inputTokens:
              an0dResult.usage.inputTokens + clarifiedResult.usage.inputTokens,
            outputTokens:
              an0dResult.usage.outputTokens +
              clarifiedResult.usage.outputTokens,
            totalTokens:
              an0dResult.usage.totalTokens + clarifiedResult.usage.totalTokens,
          };
        }

        // Type guard: we now have a full analysis
        // Using 'as const' assertion since we've handled clarification above
        const an0dAnalysis = an0dResult.result as Extract<
          typeof an0dResult.result,
          { need_question: false }
        >;
        if (!an0dAnalysis.original_ask) {
          throw new Error('Unexpected state: missing analysis after handling');
        }

        // =========================================
        // AN1.5-D: Discovery Teaching Selection
        // =========================================
        const an1_5dResult = await step.run(
          'an1.5-d-teaching-selection',
          async () => {
            await updateProgress({
              current_step: 'an1.5-d',
              phase_progress: 0,
            });

            const contextMessage = `## Problem Framing (Discovery Mode)

${JSON.stringify(an0dResult.result, null, 2)}

## Your Task

Select the most instructive teaching examples from NON-OBVIOUS domains:
- Biology (mechanisms that transfer)
- Geology (physical phenomena)
- Abandoned Technologies (worth revisiting)
- Frontier Materials (new enablers)
- Industrial Processes (from other industries)

Focus on examples that teach NEW WAYS OF THINKING about this problem.`;

            const { content, usage } = await callClaude({
              model: MODELS.OPUS,
              system: AN1_5_D_PROMPT,
              userMessage: contextMessage,
              maxTokens: DISCOVERY_CHAIN_CONFIG.maxTokensByPhase['an1.5-d'],
              temperature: DISCOVERY_CHAIN_CONFIG.temperatureByPhase['an1.5-d'],
            });

            const parsed = parseJsonResponse<AN1_5_D_Output>(
              content,
              'AN1.5-D',
            );
            const validated = AN1_5_D_OutputSchema.parse(parsed);

            await updateProgress({ phase_progress: 100 });

            return { result: validated, usage };
          },
        );

        // =========================================
        // AN1.7-D: Discovery Literature Gaps
        // =========================================
        const an1_7dResult = await step.run(
          'an1.7-d-literature-gaps',
          async () => {
            await updateProgress({
              current_step: 'an1.7-d',
              phase_progress: 0,
            });

            const contextMessage = `## Problem Framing (Discovery Mode)

${JSON.stringify(an0dResult.result, null, 2)}

## Teaching Examples Selected

${JSON.stringify(an1_5dResult.result, null, 2)}

## Your Task

Search for what's MISSING in the literature:
- Abandoned approaches worth revisiting
- Research gaps where nobody looked
- Patents that were never commercialized
- Academic ideas that didn't make it to industry
- Cross-domain solutions not yet applied`;

            const { content, usage } = await callClaude({
              model: MODELS.OPUS,
              system: AN1_7_D_PROMPT,
              userMessage: contextMessage,
              maxTokens: DISCOVERY_CHAIN_CONFIG.maxTokensByPhase['an1.7-d'],
              temperature: DISCOVERY_CHAIN_CONFIG.temperatureByPhase['an1.7-d'],
            });

            const parsed = parseJsonResponse<AN1_7_D_Output>(
              content,
              'AN1.7-D',
            );
            const validated = AN1_7_D_OutputSchema.parse(parsed);

            await updateProgress({ phase_progress: 100 });

            return { result: validated, usage };
          },
        );

        // =========================================
        // AN2-D: Discovery Methodology Briefing
        // =========================================
        const an2dResult = await step.run(
          'an2-d-methodology-briefing',
          async () => {
            await updateProgress({
              current_step: 'an2-d',
              phase_progress: 0,
            });

            const contextMessage = `## Problem Framing (Discovery Mode)

${JSON.stringify(an0dResult.result, null, 2)}

## Teaching Examples

${JSON.stringify(an1_5dResult.result, null, 2)}

## Literature Gaps Found

${JSON.stringify(an1_7dResult.result, null, 2)}

## Your Task

Prepare the concept generator with:
1. Physics foundation (what MUST be true)
2. Non-obvious thinking patterns
3. Cross-domain transfer strategies
4. Novelty-first evaluation criteria`;

            const { content, usage } = await callClaude({
              model: MODELS.OPUS,
              system: AN2_D_PROMPT,
              userMessage: contextMessage,
              maxTokens: DISCOVERY_CHAIN_CONFIG.maxTokensByPhase['an2-d'],
              temperature: DISCOVERY_CHAIN_CONFIG.temperatureByPhase['an2-d'],
            });

            const parsed = parseJsonResponse<AN2_D_Output>(content, 'AN2-D');
            const validated = AN2_D_OutputSchema.parse(parsed);

            await updateProgress({ phase_progress: 100 });

            return { result: validated, usage };
          },
        );

        // =========================================
        // AN3-D: Discovery Concept Generation
        // =========================================
        const an3dResult = await step.run(
          'an3-d-concept-generation',
          async () => {
            await updateProgress({
              current_step: 'an3-d',
              phase_progress: 0,
            });

            const contextMessage = `## Problem Framing (Discovery Mode)

${JSON.stringify(an0dResult.result, null, 2)}

## Methodology Briefing

${JSON.stringify(an2dResult.result, null, 2)}

## Teaching Examples

${JSON.stringify(an1_5dResult.result, null, 2)}

## Literature Gaps

${JSON.stringify(an1_7dResult.result, null, 2)}

## Your Task

Generate AT LEAST 6 NOVEL concepts from:
1. Biological Transfer (2+ concepts)
2. Geological/Physical Phenomena (1+ concept)
3. Abandoned Technology Revival (1+ concept)
4. Frontier Material Enablers (1+ concept)
5. Wild Card / Combination (1+ concept)

REJECT conventional approaches. Prioritize NOVELTY and BREAKTHROUGH POTENTIAL.`;

            const { content, usage } = await callClaude({
              model: MODELS.OPUS,
              system: AN3_D_PROMPT,
              userMessage: contextMessage,
              maxTokens: DISCOVERY_CHAIN_CONFIG.maxTokensByPhase['an3-d'],
              temperature: DISCOVERY_CHAIN_CONFIG.temperatureByPhase['an3-d'],
            });

            const parsed = parseJsonResponse<AN3_D_Output>(content, 'AN3-D');
            const validated = AN3_D_OutputSchema.parse(parsed);

            await updateProgress({ phase_progress: 100 });

            return { result: validated, usage };
          },
        );

        // =========================================
        // AN4-D: Discovery Evaluation
        // =========================================
        const an4dResult = await step.run('an4-d-evaluation', async () => {
          await updateProgress({
            current_step: 'an4-d',
            phase_progress: 0,
          });

          const contextMessage = `## Discovery Concepts

${JSON.stringify(an3dResult.result, null, 2)}

## Methodology Briefing

${JSON.stringify(an2dResult.result, null, 2)}

## Your Task

Evaluate with NOVELTY as primary criterion:
1. NOVELTY CHECK - Is this genuinely new, or conventional in disguise?
2. PHYSICS CHECK - Does it violate fundamental physics? (only kill if yes)
3. BREAKTHROUGH POTENTIAL - If it works, is it transformative?
4. TESTABILITY - Can we validate the core hypothesis affordably?

Accept higher risk for higher novelty.`;

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: AN4_D_PROMPT,
            userMessage: contextMessage,
            maxTokens: DISCOVERY_CHAIN_CONFIG.maxTokensByPhase['an4-d'],
            temperature: DISCOVERY_CHAIN_CONFIG.temperatureByPhase['an4-d'],
          });

          const parsed = parseJsonResponse<AN4_D_Output>(content, 'AN4-D');
          const validated = AN4_D_OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });

          return { result: validated, usage };
        });

        // =========================================
        // AN5-D: Discovery Report Generation
        // =========================================
        const an5dResult = await step.run(
          'an5-d-report-generation',
          async () => {
            await updateProgress({
              current_step: 'an5-d',
              phase_progress: 0,
            });

            const contextMessage = `## Original Problem

${designChallenge}

## Problem Framing (Discovery Mode)

${JSON.stringify(an0dResult.result, null, 2)}

## Discovery Concepts

${JSON.stringify(an3dResult.result, null, 2)}

## Evaluation Results

${JSON.stringify(an4dResult.result, null, 2)}

## Literature Gaps

${JSON.stringify(an1_7dResult.result, null, 2)}

## Your Task

Generate a DISCOVERY REPORT that answers: "What has everyone missed?"

Focus on:
1. What the industry has OVERLOOKED
2. Novel approaches from NON-OBVIOUS domains
3. Why these haven't been tried
4. Clear paths to VALIDATE novelty`;

            const { content, usage } = await callClaude({
              model: MODELS.OPUS,
              system: AN5_D_PROMPT,
              userMessage: contextMessage,
              maxTokens: DISCOVERY_CHAIN_CONFIG.maxTokensByPhase['an5-d'],
              temperature: DISCOVERY_CHAIN_CONFIG.temperatureByPhase['an5-d'],
            });

            const parsed = parseJsonResponse<AN5_D_Output>(content, 'AN5-D');
            const validated = AN5_D_OutputSchema.parse(parsed);

            await updateProgress({ phase_progress: 100 });

            return { result: validated, usage };
          },
        );

        // =========================================
        // Complete Report
        // =========================================
        // Collect all usages from step results
        const allUsages = [
          an0dResult.usage,
          an1_5dResult.usage,
          an1_7dResult.usage,
          an2dResult.usage,
          an3dResult.usage,
          an4dResult.usage,
          an5dResult.usage,
        ];
        const totalUsage = calculateTotalUsage(allUsages);

        await step.run('complete-discovery-report', async () => {
          // Persist token usage to database (P0-081 fix)
          // P1 FIX: Use fresh client to avoid stale reference issues in nested async callbacks
          try {
            const freshSupabase = getSupabaseServerAdminClient();
            const { error: usageError } = await freshSupabase.rpc(
              'increment_usage',
              {
                p_account_id: event.data.accountId,
                p_tokens: totalUsage.totalTokens,
                p_is_report: true,
                p_is_chat: false,
              },
            );
            if (usageError) {
              console.error('[Usage] Failed to persist usage:', usageError);
            } else {
              console.log('[Usage] Persisted (Discovery):', {
                accountId: event.data.accountId,
                tokens: totalUsage.totalTokens,
                costUsd: totalUsage.costUsd,
              });
            }
          } catch (usageError) {
            console.warn('[Usage] Failed to track token usage:', usageError);
          }

          await updateProgress({
            status: 'complete',
            current_step: 'complete',
            phase_progress: 100,
            headline:
              an5dResult.result.report.executive_summary?.one_liner ??
              'Discovery Analysis Complete',
            report_data: {
              mode: 'discovery',
              report: an5dResult.result.report,
              metadata: an5dResult.result.metadata,
              concepts: an3dResult.result.discovery_concepts,
              evaluation: an4dResult.result,
              literature_gaps: an1_7dResult.result,
              teaching_examples: an1_5dResult.result,
              problem_framing: an0dResult.result,
              tokenUsage: totalUsage,
            },
          });

          // Track report completion for analytics (fire-and-forget)
          trackReportCompleted({
            reportId,
            reportType: 'discovery',
            accountId: event.data.accountId,
            generationTimeMs: event.ts ? Date.now() - event.ts : 0,
            tokenCount: totalUsage.totalTokens,
            costUsd: totalUsage.costUsd,
          });
        });

        return {
          success: true,
          reportId,
          conversationId,
          tokenUsage: totalUsage,
        };
      }
    } finally {
      // Always decrement on exit (success or error)
      tracker?.decrement();
    }
  },
);
