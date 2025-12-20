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
  type AN0_M_Output,
  AN0_M_OutputSchema,
  AN0_M_PROMPT,
  type AN1_5_M_Output,
  AN1_5_M_OutputSchema,
  AN1_5_M_PROMPT,
  type AN1_7_M_Output,
  AN1_7_M_OutputSchema,
  AN1_7_M_PROMPT,
  type AN2_M_Output,
  AN2_M_OutputSchema,
  AN2_M_PROMPT,
  type AN3_M_Output,
  AN3_M_OutputSchema,
  AN3_M_PROMPT,
  type AN4_M_Output,
  AN4_M_OutputSchema,
  AN4_M_PROMPT,
  type AN5_M_Output,
  AN5_M_OutputSchema,
  AN5_M_PROMPT,
  HYBRID_MAX_TOKENS,
  HYBRID_TEMPERATURES,
} from '../../llm/prompts/hybrid';
import { inngest } from '../client';

/**
 * Generate Hybrid Report - Inngest Durable Function
 *
 * Hybrid Mode Chain (Full-Spectrum Analysis):
 * - AN0-M: Problem framing with landscape mapping
 * - AN1-M: Corpus retrieval (all domains) [skipped if no corpus]
 * - AN1.5-M: Teaching example selection
 * - AN1.7-M: Literature search for precedent AND gaps
 * - AN2-M: Full-spectrum methodology briefing
 * - AN3-M: Concept generation across all 4 tracks
 * - AN4-M: Merit-based evaluation
 * - AN5-M: Executive report with decision architecture
 *
 * Philosophy: The best solution wins regardless of origin.
 *
 * Solution Tracks:
 * - simpler_path: Lower risk, faster to implement
 * - best_fit: Highest probability of meeting requirements
 * - paradigm_shift: Challenge fundamental assumptions
 * - frontier_transfer: Cross-domain innovation
 */
// Token budget limit for safety (prevents runaway costs)
const TOKEN_BUDGET_LIMIT = 200000; // 200K tokens max per report

export const generateHybridReport = inngest.createFunction(
  {
    id: 'hybrid-report-generator',
    retries: 2,
  },
  { event: 'report/generate-hybrid' },
  async ({ event, step }) => {
    console.log('[Hybrid Function] Starting with event:', {
      name: event.name,
      reportId: event.data.reportId,
      hasDesignChallenge: !!event.data.designChallenge,
    });

    const { reportId, designChallenge, conversationId, attachments } =
      event.data;

    const supabase = getSupabaseServerAdminClient();
    console.log('[Hybrid Function] Supabase client initialized');

    // Authorization check: Verify report belongs to this account
    const { data: report, error: authError } = await supabase
      .from('sparlo_reports')
      .select('id, account_id')
      .eq('id', reportId)
      .single();

    if (authError || !report) {
      console.error('[Hybrid Function] Report not found:', authError);
      return { success: false, reportId, error: 'Report not found' };
    }

    if (report.account_id !== event.data.accountId) {
      console.error('[Hybrid Function] Authorization failed:', {
        reportAccountId: report.account_id,
        eventAccountId: event.data.accountId,
      });
      return {
        success: false,
        reportId,
        error: 'Not authorized to access this report',
      };
    }

    // Convert attachments to ImageAttachment format for Claude vision
    const imageAttachments: ImageAttachment[] = (attachments || [])
      .filter((a: { media_type: string }) => a.media_type.startsWith('image/'))
      .map((a: { media_type: string; data: string }) => ({
        media_type: a.media_type as ImageAttachment['media_type'],
        data: a.data,
      }));

    // Handle ClaudeRefusalError at the top level
    try {
      return await runHybridGeneration();
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

    async function runHybridGeneration() {
      // Track cumulative tokens for budget monitoring
      let cumulativeTokens = 0;

      /**
       * Check token budget and throw if exceeded
       */
      function checkTokenBudget(usage: TokenUsage, stepName: string) {
        cumulativeTokens += usage.totalTokens;
        console.log(
          `[Hybrid] Token usage after ${stepName}: ${usage.totalTokens} (cumulative: ${cumulativeTokens}/${TOKEN_BUDGET_LIMIT})`,
        );

        if (cumulativeTokens > TOKEN_BUDGET_LIMIT) {
          throw new Error(
            `Token budget exceeded at ${stepName}: ${cumulativeTokens}/${TOKEN_BUDGET_LIMIT}. Report stopped to prevent excessive costs.`,
          );
        }
      }

      // Helper to calculate total usage from collected step usages
      function calculateTotalUsage(
        usages: TokenUsage[],
      ): TokenUsage & { costUsd: number; byStep: Record<string, TokenUsage> } {
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
      // AN0-M: Hybrid Problem Framing
      // =========================================
      const an0mResult = await step.run(
        'an0-m-hybrid-problem-framing',
        async () => {
          await updateProgress({
            current_step: 'an0-m',
            phase_progress: 0,
          });

          // Include images for vision processing if attachments were provided
          const userMessageWithContext =
            imageAttachments.length > 0
              ? `${designChallenge}\n\n[Note: ${imageAttachments.length} image(s) attached for visual context]`
              : designChallenge;

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: AN0_M_PROMPT,
            userMessage: userMessageWithContext,
            maxTokens: HYBRID_MAX_TOKENS,
            temperature: HYBRID_TEMPERATURES.default,
            images: imageAttachments.length > 0 ? imageAttachments : undefined,
          });

          const parsed = parseJsonResponse<AN0_M_Output>(content, 'AN0-M');
          const validated = AN0_M_OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });
          checkTokenBudget(usage, 'AN0-M');

          return { result: validated, usage };
        },
      );

      // Handle clarification if needed
      if (an0mResult.result.needs_clarification === true) {
        // Extract question with type narrowing
        const clarificationQuestion = an0mResult.result.clarification_question;

        await step.run('store-hybrid-clarification', async () => {
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
          'wait-for-hybrid-clarification',
          {
            event: 'report/hybrid-clarification-answered',
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

        // Re-run AN0-M with clarification
        const clarifiedResult = await step.run(
          'an0-m-with-clarification',
          async () => {
            const clarifiedChallenge = `${designChallenge}\n\nClarification: ${clarificationEvent.data.answer}`;

            const { content, usage } = await callClaude({
              model: MODELS.OPUS,
              system: AN0_M_PROMPT,
              userMessage: clarifiedChallenge,
              maxTokens: HYBRID_MAX_TOKENS,
              temperature: HYBRID_TEMPERATURES.default,
            });

            const parsed = parseJsonResponse<AN0_M_Output>(content, 'AN0-M');
            return { result: AN0_M_OutputSchema.parse(parsed), usage };
          },
        );

        if (clarifiedResult.result.needs_clarification === true) {
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

        // Use clarified result (merge usage into an0mResult)
        an0mResult.result = clarifiedResult.result;
        an0mResult.usage = {
          inputTokens:
            an0mResult.usage.inputTokens + clarifiedResult.usage.inputTokens,
          outputTokens:
            an0mResult.usage.outputTokens + clarifiedResult.usage.outputTokens,
          totalTokens:
            an0mResult.usage.totalTokens + clarifiedResult.usage.totalTokens,
        };
      }

      // Type guard: we now have a full analysis
      const an0mAnalysis = an0mResult.result as Extract<
        typeof an0mResult.result,
        { needs_clarification: false }
      >;
      if (!an0mAnalysis.problem_analysis) {
        throw new Error('Unexpected state: missing analysis after handling');
      }

      // =========================================
      // AN1.5-M: Hybrid Teaching Selection
      // =========================================
      const an1_5mResult = await step.run(
        'an1.5-m-teaching-selection',
        async () => {
          await updateProgress({
            current_step: 'an1.5-m',
            phase_progress: 0,
          });

          const contextMessage = `## Problem Framing (Hybrid Mode)

${JSON.stringify(an0mResult.result, null, 2)}

## Your Task

Select teaching examples from ALL domains:
- Conventional industry examples (for simpler_path and best_fit tracks)
- Cross-domain examples (for paradigm_shift and frontier_transfer tracks)
- Examples that teach different ways of thinking about the problem

Include at least:
- 2 conventional examples (proven industry approaches)
- 2 novel examples (from biology, geology, abandoned tech, etc.)
- 2 cross-domain connections`;

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: AN1_5_M_PROMPT,
            userMessage: contextMessage,
            maxTokens: HYBRID_MAX_TOKENS,
            temperature: HYBRID_TEMPERATURES.default,
          });

          const parsed = parseJsonResponse<AN1_5_M_Output>(content, 'AN1.5-M');
          const validated = AN1_5_M_OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });
          checkTokenBudget(usage, 'AN1.5-M');

          return { result: validated, usage };
        },
      );

      // =========================================
      // AN1.7-M: Hybrid Literature Search
      // =========================================
      const an1_7mResult = await step.run(
        'an1.7-m-literature-search',
        async () => {
          await updateProgress({
            current_step: 'an1.7-m',
            phase_progress: 0,
          });

          const contextMessage = `## Problem Framing (Hybrid Mode)

${JSON.stringify(an0mResult.result, null, 2)}

## Teaching Examples Selected

${JSON.stringify(an1_5mResult.result, null, 2)}

## Your Task

Search for BOTH precedent AND gaps:
- What has been done (to inform best_fit track)
- What has NOT been tried (to inform paradigm_shift track)
- Abandoned approaches worth revisiting (for all tracks)
- Key papers and patents

Every claim must have a source.`;

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: AN1_7_M_PROMPT,
            userMessage: contextMessage,
            maxTokens: HYBRID_MAX_TOKENS,
            temperature: HYBRID_TEMPERATURES.default,
          });

          const parsed = parseJsonResponse<AN1_7_M_Output>(content, 'AN1.7-M');
          const validated = AN1_7_M_OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });
          checkTokenBudget(usage, 'AN1.7-M');

          return { result: validated, usage };
        },
      );

      // =========================================
      // AN2-M: Hybrid Methodology Briefing
      // =========================================
      const an2mResult = await step.run(
        'an2-m-methodology-briefing',
        async () => {
          await updateProgress({
            current_step: 'an2-m',
            phase_progress: 0,
          });

          const contextMessage = `## Problem Framing (Hybrid Mode)

${JSON.stringify(an0mResult.result, null, 2)}

## Teaching Examples

${JSON.stringify(an1_5mResult.result, null, 2)}

## Literature Search Results

${JSON.stringify(an1_7mResult.result, null, 2)}

## Your Task

Prepare full-spectrum concept generation guidance:
1. Track-specific guidance for all 4 tracks
2. Physics constraints that cannot be violated
3. TRIZ parameters to consider
4. Questions to challenge assumptions`;

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: AN2_M_PROMPT,
            userMessage: contextMessage,
            maxTokens: HYBRID_MAX_TOKENS,
            temperature: HYBRID_TEMPERATURES.analytical,
          });

          const parsed = parseJsonResponse<AN2_M_Output>(content, 'AN2-M');
          const validated = AN2_M_OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });
          checkTokenBudget(usage, 'AN2-M');

          return { result: validated, usage };
        },
      );

      // =========================================
      // AN3-M: Hybrid Concept Generation
      // =========================================
      const an3mResult = await step.run(
        'an3-m-concept-generation',
        async () => {
          await updateProgress({
            current_step: 'an3-m',
            phase_progress: 0,
          });

          const contextMessage = `## Problem Framing (Hybrid Mode)

${JSON.stringify(an0mResult.result, null, 2)}

## Methodology Briefing

${JSON.stringify(an2mResult.result, null, 2)}

## Teaching Examples

${JSON.stringify(an1_5mResult.result, null, 2)}

## Literature Search Results

${JSON.stringify(an1_7mResult.result, null, 2)}

## Your Task

Generate AT LEAST 8 concepts across all 4 tracks:
1. SIMPLER PATH (minimum 2) - Lower risk, faster to implement
2. BEST FIT (minimum 2) - Highest probability of meeting requirements
3. PARADIGM SHIFT (minimum 2) - Challenge fundamental assumptions
4. FRONTIER TRANSFER (minimum 2) - Cross-domain innovation

Each concept needs:
- Clear mechanism
- Prior art (or why it's novel)
- Feasibility and impact scores
- Validation approach`;

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: AN3_M_PROMPT,
            userMessage: contextMessage,
            maxTokens: HYBRID_MAX_TOKENS,
            temperature: HYBRID_TEMPERATURES.creative,
          });

          const parsed = parseJsonResponse<AN3_M_Output>(content, 'AN3-M');
          const validated = AN3_M_OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });
          checkTokenBudget(usage, 'AN3-M');

          return { result: validated, usage };
        },
      );

      // =========================================
      // AN4-M: Hybrid Evaluation
      // =========================================
      const an4mResult = await step.run('an4-m-evaluation', async () => {
        await updateProgress({
          current_step: 'an4-m',
          phase_progress: 0,
        });

        const contextMessage = `## Hybrid Concepts

${JSON.stringify(an3mResult.result, null, 2)}

## Methodology Briefing

${JSON.stringify(an2mResult.result, null, 2)}

## Your Task

Evaluate ALL concepts on MERIT:
1. PHYSICS FEASIBILITY - Does it violate known physics?
2. ENGINEERING FEASIBILITY - Can it be built?
3. ECONOMIC VIABILITY - Does cost/benefit work?
4. OVERALL MERIT - Combining all factors

Rank by MERIT, not by track.
Simple solutions that work beat complex ones that might work.
Include honest self-critique of the analysis.`;

        const { content, usage } = await callClaude({
          model: MODELS.OPUS,
          system: AN4_M_PROMPT,
          userMessage: contextMessage,
          maxTokens: HYBRID_MAX_TOKENS,
          temperature: HYBRID_TEMPERATURES.analytical,
        });

        const parsed = parseJsonResponse<AN4_M_Output>(content, 'AN4-M');
        const validated = AN4_M_OutputSchema.parse(parsed);

        await updateProgress({ phase_progress: 100 });
        checkTokenBudget(usage, 'AN4-M');

        return { result: validated, usage };
      });

      // =========================================
      // AN5-M: Hybrid Report Generation
      // =========================================
      const an5mResult = await step.run('an5-m-report-generation', async () => {
        await updateProgress({
          current_step: 'an5-m',
          phase_progress: 0,
        });

        const contextMessage = `## Original Problem

${designChallenge}

## Problem Framing (Hybrid Mode)

${JSON.stringify(an0mResult.result, null, 2)}

## Hybrid Concepts

${JSON.stringify(an3mResult.result, null, 2)}

## Evaluation Results

${JSON.stringify(an4mResult.result, null, 2)}

## Literature Search Results

${JSON.stringify(an1_7mResult.result, null, 2)}

## Your Task

Generate an executive report with DECISION ARCHITECTURE:
1. PRIMARY - The highest merit solution to pursue first
2. FALLBACK - What to do if primary fails
3. PARALLEL EXPLORATION - Worth investigating alongside

Include honest self-critique of what we might be wrong about.
The BEST solution wins regardless of origin (simple vs complex, conventional vs novel).`;

        const { content, usage } = await callClaude({
          model: MODELS.OPUS,
          system: AN5_M_PROMPT,
          userMessage: contextMessage,
          maxTokens: HYBRID_MAX_TOKENS,
          temperature: HYBRID_TEMPERATURES.report,
        });

        const parsed = parseJsonResponse<AN5_M_Output>(content, 'AN5-M');
        const validated = AN5_M_OutputSchema.parse(parsed);

        await updateProgress({ phase_progress: 100 });
        checkTokenBudget(usage, 'AN5-M');

        return { result: validated, usage };
      });

      // =========================================
      // Complete Report
      // =========================================
      // Collect all usages from step results
      const allUsages = [
        an0mResult.usage,
        an1_5mResult.usage,
        an1_7mResult.usage,
        an2mResult.usage,
        an3mResult.usage,
        an4mResult.usage,
        an5mResult.usage,
      ];
      const totalUsage = calculateTotalUsage(allUsages);

      await step.run('complete-hybrid-report', async () => {
        // Persist token usage to database
        const { error: usageError } = await supabase.rpc('increment_usage', {
          p_account_id: event.data.accountId,
          p_tokens: totalUsage.totalTokens,
          p_is_report: true,
          p_is_chat: false,
        });
        if (usageError) {
          console.error('[Usage] Failed to persist usage:', usageError);
        } else {
          console.log('[Usage] Persisted (Hybrid):', {
            accountId: event.data.accountId,
            tokens: totalUsage.totalTokens,
            costUsd: totalUsage.costUsd,
          });
        }

        await updateProgress({
          status: 'complete',
          current_step: 'complete',
          phase_progress: 100,
          headline:
            an5mResult.result.executive_summary?.slice(0, 200) ??
            'Hybrid Analysis Complete',
          report_data: {
            mode: 'hybrid',
            report: an5mResult.result,
            concepts: an3mResult.result.concepts,
            evaluation: an4mResult.result,
            literature: an1_7mResult.result,
            teaching_examples: an1_5mResult.result,
            problem_framing: an0mResult.result,
            methodology: an2mResult.result,
            tokenUsage: totalUsage,
          },
        });
      });

      return {
        success: true,
        reportId,
        conversationId,
        tokenUsage: totalUsage,
      };
    }
  },
);
