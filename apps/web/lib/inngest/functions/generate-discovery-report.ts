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
  },
  { event: 'report/generate-discovery' },
  async ({ event, step }) => {
    console.log('[Discovery Function] Starting with event:', {
      name: event.name,
      reportId: event.data.reportId,
      hasDesignChallenge: !!event.data.designChallenge,
    });

    const { reportId, designChallenge, conversationId, attachments } = event.data;

    // Convert attachments to ImageAttachment format for Claude vision
    const imageAttachments: ImageAttachment[] = (attachments || [])
      .filter((a: { media_type: string }) => a.media_type.startsWith('image/'))
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
      throw error;
    }

    async function runDiscoveryGeneration() {
      // Track token usage per step
      const usageByStep: Record<string, TokenUsage> = {};

      function trackUsage(stepName: string, usage: TokenUsage) {
        usageByStep[stepName] = usage;
      }

      function getTotalUsage(): TokenUsage & { costUsd: number } {
        const totals = Object.values(usageByStep).reduce(
          (acc, usage) => ({
            inputTokens: acc.inputTokens + usage.inputTokens,
            outputTokens: acc.outputTokens + usage.outputTokens,
            totalTokens: acc.totalTokens + usage.totalTokens,
          }),
          { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        );
        return {
          ...totals,
          costUsd: calculateCost(
            totals,
            MODELS.OPUS as keyof typeof CLAUDE_PRICING,
          ),
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
          const userMessageWithContext = imageAttachments.length > 0
            ? `${designChallenge}\n\n[Note: ${imageAttachments.length} image(s) attached for visual context]`
            : designChallenge;

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: AN0_D_PROMPT,
            userMessage: userMessageWithContext,
            maxTokens: DISCOVERY_CHAIN_CONFIG.maxTokensByPhase['an0-d'],
            temperature: DISCOVERY_CHAIN_CONFIG.temperatureByPhase['an0-d'],
            images: imageAttachments.length > 0 ? imageAttachments : undefined,
          });
          trackUsage('an0-d', usage);

          const parsed = parseJsonResponse<AN0DOutput>(content, 'AN0-D');
          const validated = AN0DOutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });

          return validated;
        },
      );

      // Handle clarification if needed
      if (an0dResult.need_question === true) {
        await step.run('store-discovery-clarification', async () => {
          await updateProgress({
            status: 'clarifying',
            clarifications: [
              {
                question: an0dResult.question,
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
          return { success: false, reportId, error: 'Clarification timed out' };
        }

        // Re-run AN0-D with clarification
        const clarifiedResult = await step.run(
          'an0-d-with-clarification',
          async () => {
            const clarifiedChallenge = `${designChallenge}\n\nClarification: ${clarificationEvent.data.answer}`;

            const { content, usage } = await callClaude({
              model: MODELS.OPUS,
              system: AN0_D_PROMPT,
              userMessage: clarifiedChallenge,
              maxTokens: DISCOVERY_CHAIN_CONFIG.maxTokensByPhase['an0-d'],
              temperature: DISCOVERY_CHAIN_CONFIG.temperatureByPhase['an0-d'],
            });
            trackUsage('an0-d-retry', usage);

            const parsed = parseJsonResponse<AN0DOutput>(content, 'AN0-D');
            return AN0DOutputSchema.parse(parsed);
          },
        );

        if (clarifiedResult.need_question === true) {
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

        // Use clarified result
        Object.assign(an0dResult, clarifiedResult);
      }

      // Type guard: we now have a full analysis
      if (an0dResult.need_question === true) {
        throw new Error('Unexpected state: still need question after handling');
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

${JSON.stringify(an0dResult, null, 2)}

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
          trackUsage('an1.5-d', usage);

          const parsed = parseJsonResponse<AN1_5_D_Output>(content, 'AN1.5-D');
          const validated = AN1_5_D_OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });

          return validated;
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

${JSON.stringify(an0dResult, null, 2)}

## Teaching Examples Selected

${JSON.stringify(an1_5dResult, null, 2)}

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
          trackUsage('an1.7-d', usage);

          const parsed = parseJsonResponse<AN1_7_D_Output>(content, 'AN1.7-D');
          const validated = AN1_7_D_OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });

          return validated;
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

${JSON.stringify(an0dResult, null, 2)}

## Teaching Examples

${JSON.stringify(an1_5dResult, null, 2)}

## Literature Gaps Found

${JSON.stringify(an1_7dResult, null, 2)}

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
          trackUsage('an2-d', usage);

          const parsed = parseJsonResponse<AN2_D_Output>(content, 'AN2-D');
          const validated = AN2_D_OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });

          return validated;
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

${JSON.stringify(an0dResult, null, 2)}

## Methodology Briefing

${JSON.stringify(an2dResult, null, 2)}

## Teaching Examples

${JSON.stringify(an1_5dResult, null, 2)}

## Literature Gaps

${JSON.stringify(an1_7dResult, null, 2)}

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
          trackUsage('an3-d', usage);

          const parsed = parseJsonResponse<AN3_D_Output>(content, 'AN3-D');
          const validated = AN3_D_OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });

          return validated;
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

${JSON.stringify(an3dResult, null, 2)}

## Methodology Briefing

${JSON.stringify(an2dResult, null, 2)}

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
        trackUsage('an4-d', usage);

        const parsed = parseJsonResponse<AN4_D_Output>(content, 'AN4-D');
        const validated = AN4_D_OutputSchema.parse(parsed);

        await updateProgress({ phase_progress: 100 });

        return validated;
      });

      // =========================================
      // AN5-D: Discovery Report Generation
      // =========================================
      const an5dResult = await step.run('an5-d-report-generation', async () => {
        await updateProgress({
          current_step: 'an5-d',
          phase_progress: 0,
        });

        const contextMessage = `## Original Problem

${designChallenge}

## Problem Framing (Discovery Mode)

${JSON.stringify(an0dResult, null, 2)}

## Discovery Concepts

${JSON.stringify(an3dResult, null, 2)}

## Evaluation Results

${JSON.stringify(an4dResult, null, 2)}

## Literature Gaps

${JSON.stringify(an1_7dResult, null, 2)}

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
        trackUsage('an5-d', usage);

        const parsed = parseJsonResponse<AN5_D_Output>(content, 'AN5-D');
        const validated = AN5_D_OutputSchema.parse(parsed);

        await updateProgress({ phase_progress: 100 });

        return validated;
      });

      // =========================================
      // Complete Report
      // =========================================
      await step.run('complete-discovery-report', async () => {
        const totalUsage = getTotalUsage();

        // Persist token usage to database (P0-081 fix)
        const { error: usageError } = await supabase.rpc('increment_usage', {
          p_account_id: event.data.accountId,
          p_tokens: totalUsage.totalTokens,
          p_is_report: true,
          p_is_chat: false,
        });
        if (usageError) {
          console.error('[Usage] Failed to persist usage:', usageError);
        } else {
          console.log('[Usage] Persisted (Discovery):', { accountId: event.data.accountId, tokens: totalUsage.totalTokens });
        }

        await updateProgress({
          status: 'complete',
          current_step: 'complete',
          phase_progress: 100,
          headline:
            an5dResult.report.executive_summary?.one_liner ??
            'Discovery Analysis Complete',
          report_data: {
            mode: 'discovery',
            report: an5dResult.report,
            metadata: an5dResult.metadata,
            concepts: an3dResult.discovery_concepts,
            evaluation: an4dResult,
            literature_gaps: an1_7dResult,
            teaching_examples: an1_5dResult,
            problem_framing: an0dResult,
            tokenUsage: totalUsage,
          },
        });
      });

      return {
        success: true,
        reportId,
        conversationId,
        tokenUsage: getTotalUsage(),
      };
    }
  },
);
