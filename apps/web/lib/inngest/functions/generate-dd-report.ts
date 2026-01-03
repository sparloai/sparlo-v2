import 'server-only';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import {
  CLAUDE_PRICING,
  ClaudeRefusalError,
  type ImageAttachment,
  MODELS,
  type PDFAttachment,
  type TokenUsage,
  calculateCost,
  callClaude,
  parseJsonResponse,
} from '../../llm/client';
// Import DD-specific prompts
import {
  type DD0_M_Output,
  DD0_M_OutputSchema,
  DD0_M_PROMPT,
  type DD3_M_Output,
  DD3_M_OutputSchema,
  DD3_M_PROMPT,
  type DD4_M_Output,
  DD4_M_OutputSchema,
  DD4_M_PROMPT,
  type DD5_M_Output,
  DD5_M_OutputSchema,
  DD5_M_PROMPT,
  DD_TEMPERATURES,
} from '../../llm/prompts/dd';
// Import existing Hybrid (AN) prompts for chain stages
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
  HYBRID_MAX_TOKENS,
  HYBRID_TEMPERATURES,
} from '../../llm/prompts/hybrid';
import { HYBRID_CACHED_PREFIX } from '../../llm/prompts/hybrid/cached-prefix';
import { inngest } from '../client';
import { handleReportFailure } from '../utils/report-failure-handler';

/**
 * Generate DD Report - Inngest Durable Function
 *
 * Due Diligence Mode Chain:
 * - DD0-M: Extract claims and problem statement from startup materials
 * - AN0-M: First-principles problem framing (reused from hybrid)
 * - AN1.5-M: Teaching example selection (reused from hybrid)
 * - AN1.7-M: Literature search (reused from hybrid)
 * - AN2-M: TRIZ methodology briefing (reused from hybrid)
 * - AN3-M: Full solution space generation (reused from hybrid)
 * - DD3-M: Claim validation against physics and TRIZ
 * - DD4-M: Solution space mapping and moat assessment
 * - DD5-M: Generate investor-facing DD report
 *
 * Philosophy: Map the full solution space first, then evaluate where
 * the startup sits within it. This reveals blind spots and validates claims.
 */

// Token budget limit for safety
const TOKEN_BUDGET_LIMIT = 250000; // 250K tokens max per DD report

export const generateDDReport = inngest.createFunction(
  {
    id: 'sparlo-dd-report-generator',
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
  { event: 'report/generate-dd' },
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
      console.log('[DD Function] Starting with event:', {
        name: event.name,
        reportId: event.data.reportId,
        hasStartupMaterials: !!event.data.startupMaterials,
        companyName: event.data.companyName,
      });

      const {
        reportId,
        startupMaterials,
        vcNotes,
        companyName,
        attachments,
        accountId,
      } = event.data;

      const supabase = getSupabaseServerAdminClient();
      console.log('[DD Function] Supabase client initialized');

      // Authorization check: Verify report belongs to this account
      const { data: report, error: authError } = await supabase
        .from('sparlo_reports')
        .select('id, account_id')
        .eq('id', reportId)
        .single();

      if (authError || !report) {
        console.error('[DD Function] Report not found:', authError);
        return { success: false, reportId, error: 'Report not found' };
      }

      if (report.account_id !== accountId) {
        console.error('[DD Function] Authorization failed:', {
          reportAccountId: report.account_id,
          eventAccountId: accountId,
        });
        return {
          success: false,
          reportId,
          error: 'Not authorized to access this report',
        };
      }

      // Convert attachments to appropriate formats for Claude
      const imageAttachments: ImageAttachment[] = (attachments || [])
        .filter((a: { media_type: string }) =>
          a.media_type.startsWith('image/'),
        )
        .map((a: { media_type: string; data: string }) => ({
          media_type: a.media_type as ImageAttachment['media_type'],
          data: a.data,
        }));

      // PDF attachments for native Claude document processing
      const pdfAttachments: PDFAttachment[] = (attachments || [])
        .filter(
          (a: { media_type: string }) => a.media_type === 'application/pdf',
        )
        .map((a: { data: string }) => ({
          media_type: 'application/pdf' as const,
          data: a.data,
        }));

      // Handle ClaudeRefusalError at the top level
      try {
        return await runDDGeneration();
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

      async function runDDGeneration() {
        // Track cumulative tokens for budget monitoring
        let cumulativeTokens = 0;

        /**
         * Check token budget and throw if exceeded
         */
        function checkTokenBudget(usage: TokenUsage, stepName: string) {
          cumulativeTokens += usage.totalTokens;
          console.log(
            `[DD] Token usage after ${stepName}: ${usage.totalTokens} (cumulative: ${cumulativeTokens}/${TOKEN_BUDGET_LIMIT})`,
          );

          if (cumulativeTokens > TOKEN_BUDGET_LIMIT) {
            throw new Error(
              `Token budget exceeded at ${stepName}: ${cumulativeTokens}/${TOKEN_BUDGET_LIMIT}. Report stopped to prevent excessive costs.`,
            );
          }
        }

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
        // DD0-M: Claim Extraction from Startup Materials
        // =========================================
        const dd0Result = await step.run('dd0-m-claim-extraction', async () => {
          await updateProgress({
            current_step: 'dd0-m',
            phase_progress: 0,
          });

          // Build context with all attachments
          const attachmentNotes: string[] = [];
          if (imageAttachments.length > 0) {
            attachmentNotes.push(`${imageAttachments.length} image(s)`);
          }
          if (pdfAttachments.length > 0) {
            attachmentNotes.push(`${pdfAttachments.length} PDF document(s)`);
          }

          // Build user message with startup materials and optional VC notes
          let userMessage = `## Startup Materials\n\n${startupMaterials}`;
          if (vcNotes) {
            userMessage += `\n\n## VC Notes\n\n${vcNotes}`;
          }
          if (attachmentNotes.length > 0) {
            userMessage += `\n\n[Note: ${attachmentNotes.join(' and ')} attached for context]`;
          }

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: DD0_M_PROMPT,
            userMessage,
            maxTokens: HYBRID_MAX_TOKENS,
            temperature: DD_TEMPERATURES.extraction,
            images: imageAttachments.length > 0 ? imageAttachments : undefined,
            documents: pdfAttachments.length > 0 ? pdfAttachments : undefined,
            cacheablePrefix: HYBRID_CACHED_PREFIX,
          });

          const parsed = parseJsonResponse<DD0_M_Output>(content, 'DD0-M');
          const validated = DD0_M_OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });
          checkTokenBudget(usage, 'DD0-M');

          return { result: validated, usage };
        });

        // Extract the problem statement for AN0-M
        const problemStatementForAnalysis =
          dd0Result.result.problem_extraction.problem_statement_for_analysis;

        // =========================================
        // AN0-M: Problem Framing (Existing)
        // =========================================
        const an0mResult = await step.run('an0-m-problem-framing', async () => {
          await updateProgress({
            current_step: 'an0-m',
            phase_progress: 0,
          });

          // Use the extracted problem statement from DD0
          const contextMessage = `${problemStatementForAnalysis}

## DD Context

This is a Due Diligence analysis for a startup called "${companyName}".
The problem statement above was extracted from their pitch materials.
Please frame this problem from first principles, independent of their proposed solution.`;

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: AN0_M_PROMPT,
            userMessage: contextMessage,
            maxTokens: HYBRID_MAX_TOKENS,
            temperature: HYBRID_TEMPERATURES.default,
            cacheablePrefix: HYBRID_CACHED_PREFIX,
          });

          const parsed = parseJsonResponse<AN0_M_Output>(content, 'AN0-M');
          const validated = AN0_M_OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });
          checkTokenBudget(usage, 'AN0-M');

          return { result: validated, usage };
        });

        // Type assertion for problem analysis (skip clarification in DD mode)
        // Note: We use an0mResult.result directly since DD mode never needs clarification
        const _an0mAnalysis = an0mResult.result as Extract<
          AN0_M_Output,
          { needs_clarification: false }
        >;

        // =========================================
        // AN1.5-M: Teaching Selection (Existing)
        // =========================================
        const an1_5mResult = await step.run(
          'an1.5-m-teaching-selection',
          async () => {
            await updateProgress({
              current_step: 'an1.5-m',
              phase_progress: 0,
            });

            const contextMessage = `## Problem Framing (DD Mode)

${JSON.stringify(an0mResult.result, null, 2)}

## DD Context

This analysis is part of a Due Diligence review for "${companyName}".
Select teaching examples that will help us:
1. Understand the full solution landscape
2. Identify prior art and precedent
3. Reveal alternative approaches the startup may have missed`;

            const { content, usage } = await callClaude({
              model: MODELS.OPUS,
              system: AN1_5_M_PROMPT,
              userMessage: contextMessage,
              maxTokens: HYBRID_MAX_TOKENS,
              temperature: HYBRID_TEMPERATURES.default,
              cacheablePrefix: HYBRID_CACHED_PREFIX,
            });

            const parsed = parseJsonResponse<AN1_5_M_Output>(
              content,
              'AN1.5-M',
            );
            const validated = AN1_5_M_OutputSchema.parse(parsed);

            await updateProgress({ phase_progress: 100 });
            checkTokenBudget(usage, 'AN1.5-M');

            return { result: validated, usage };
          },
        );

        // =========================================
        // AN1.7-M: Literature Search (Existing)
        // =========================================
        const an1_7mResult = await step.run(
          'an1.7-m-literature-search',
          async () => {
            await updateProgress({
              current_step: 'an1.7-m',
              phase_progress: 0,
            });

            // Include DD0 search seeds for targeted prior art search
            const contextMessage = `## Problem Framing (DD Mode)

${JSON.stringify(an0mResult.result, null, 2)}

## Teaching Examples Selected

${JSON.stringify(an1_5mResult.result, null, 2)}

## DD-Specific Search Seeds

These queries are derived from the startup's claims to find prior art:

Prior Art Queries: ${JSON.stringify(dd0Result.result.search_seeds.prior_art_queries)}

Competitor Queries: ${JSON.stringify(dd0Result.result.search_seeds.competitor_queries)}

Mechanism Queries: ${JSON.stringify(dd0Result.result.search_seeds.mechanism_queries)}

Failure Mode Queries: ${JSON.stringify(dd0Result.result.search_seeds.failure_mode_queries)}

## DD Context

This is Due Diligence for "${companyName}". Pay special attention to:
1. Prior art that could invalidate novelty claims
2. Similar approaches that failed (and why)
3. Competitive landscape they may have missed
4. Patents that could block their approach`;

            const { content, usage } = await callClaude({
              model: MODELS.OPUS,
              system: AN1_7_M_PROMPT,
              userMessage: contextMessage,
              maxTokens: HYBRID_MAX_TOKENS,
              temperature: HYBRID_TEMPERATURES.default,
              cacheablePrefix: HYBRID_CACHED_PREFIX,
            });

            const parsed = parseJsonResponse<AN1_7_M_Output>(
              content,
              'AN1.7-M',
            );
            const validated = AN1_7_M_OutputSchema.parse(parsed);

            await updateProgress({ phase_progress: 100 });
            checkTokenBudget(usage, 'AN1.7-M');

            return { result: validated, usage };
          },
        );

        // =========================================
        // AN2-M: Methodology Briefing (Existing)
        // =========================================
        const an2mResult = await step.run(
          'an2-m-methodology-briefing',
          async () => {
            await updateProgress({
              current_step: 'an2-m',
              phase_progress: 0,
            });

            const contextMessage = `## Problem Framing (DD Mode)

${JSON.stringify(an0mResult.result, null, 2)}

## Teaching Examples

${JSON.stringify(an1_5mResult.result, null, 2)}

## Literature Search Results

${JSON.stringify(an1_7mResult.result, null, 2)}

## DD Context

This is Due Diligence for "${companyName}". The methodology briefing should:
1. Identify TRIZ contradictions inherent in this problem
2. Map inventive principles that could apply
3. Flag physics constraints that cannot be violated
4. Note what the startup's approach must resolve`;

            const { content, usage } = await callClaude({
              model: MODELS.OPUS,
              system: AN2_M_PROMPT,
              userMessage: contextMessage,
              maxTokens: HYBRID_MAX_TOKENS,
              temperature: HYBRID_TEMPERATURES.analytical,
              cacheablePrefix: HYBRID_CACHED_PREFIX,
            });

            const parsed = parseJsonResponse<AN2_M_Output>(content, 'AN2-M');
            const validated = AN2_M_OutputSchema.parse(parsed);

            await updateProgress({ phase_progress: 100 });
            checkTokenBudget(usage, 'AN2-M');

            return { result: validated, usage };
          },
        );

        // =========================================
        // AN3-M: Solution Space Generation (Existing)
        // =========================================
        const an3mResult = await step.run('an3-m-solution-space', async () => {
          await updateProgress({
            current_step: 'an3-m',
            phase_progress: 0,
          });

          const contextMessage = `## Problem Framing (DD Mode)

${JSON.stringify(an0mResult.result, null, 2)}

## Methodology Briefing

${JSON.stringify(an2mResult.result, null, 2)}

## Teaching Examples

${JSON.stringify(an1_5mResult.result, null, 2)}

## Literature Search Results

${JSON.stringify(an1_7mResult.result, null, 2)}

## DD Context

This is Due Diligence for "${companyName}". Generate the FULL solution space:
1. SIMPLER PATH - Approaches that might be "good enough" with less complexity
2. BEST FIT - Optimal approaches for this specific problem
3. PARADIGM SHIFT - Approaches that challenge industry assumptions
4. FRONTIER TRANSFER - Cross-domain innovations

We will later map the startup's approach onto this landscape to assess:
- Whether they chose the best approach
- What alternatives they may have missed
- What competitive threats exist`;

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: AN3_M_PROMPT,
            userMessage: contextMessage,
            maxTokens: HYBRID_MAX_TOKENS,
            temperature: HYBRID_TEMPERATURES.creative,
            cacheablePrefix: HYBRID_CACHED_PREFIX,
          });

          const parsed = parseJsonResponse<AN3_M_Output>(content, 'AN3-M');
          const validated = AN3_M_OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });
          checkTokenBudget(usage, 'AN3-M');

          return { result: validated, usage };
        });

        // =========================================
        // DD3-M: Claim Validation
        // =========================================
        const dd3Result = await step.run('dd3-m-claim-validation', async () => {
          await updateProgress({
            current_step: 'dd3-m',
            phase_progress: 0,
          });

          const contextMessage = `## DD0 Output (Extracted Claims)

${JSON.stringify(dd0Result.result, null, 2)}

## AN0-M Output (Problem Framing)

${JSON.stringify(an0mResult.result, null, 2)}

## AN1.5-M Output (Teaching Examples)

${JSON.stringify(an1_5mResult.result, null, 2)}

## AN1.7-M Output (Literature Search)

${JSON.stringify(an1_7mResult.result, null, 2)}

## AN2-M Output (TRIZ Analysis)

${JSON.stringify(an2mResult.result, null, 2)}

## Your Task

Validate each of ${companyName}'s claims against:
1. Physics principles and theoretical limits
2. TRIZ contradictions and resolutions
3. Prior art and demonstrated precedent
4. Feasibility at claimed scale and cost`;

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: DD3_M_PROMPT,
            userMessage: contextMessage,
            maxTokens: HYBRID_MAX_TOKENS,
            temperature: DD_TEMPERATURES.validation,
            cacheablePrefix: HYBRID_CACHED_PREFIX,
          });

          const parsed = parseJsonResponse<DD3_M_Output>(content, 'DD3-M');
          const validated = DD3_M_OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });
          checkTokenBudget(usage, 'DD3-M');

          return { result: validated, usage };
        });

        // =========================================
        // DD4-M: Solution Space Mapping & Moat
        // =========================================
        const dd4Result = await step.run('dd4-m-moat-assessment', async () => {
          await updateProgress({
            current_step: 'dd4-m',
            phase_progress: 0,
          });

          const contextMessage = `## DD0 Output (Extracted Claims & Proposed Solution)

${JSON.stringify(dd0Result.result, null, 2)}

## AN3-M Output (Full Solution Space)

${JSON.stringify(an3mResult.result, null, 2)}

## DD3 Output (Claim Validation)

${JSON.stringify(dd3Result.result, null, 2)}

## AN1.7-M Output (Prior Art)

${JSON.stringify(an1_7mResult.result, null, 2)}

## Your Task

Map ${companyName}'s approach onto the solution space:
1. Which track does their approach fall into?
2. Is this the optimal position for their stated problem?
3. What alternatives did they miss or dismiss?
4. Assess novelty against prior art
5. Evaluate moat strength and durability
6. Identify competitive threats from other approaches`;

          const { content, usage } = await callClaude({
            model: MODELS.OPUS,
            system: DD4_M_PROMPT,
            userMessage: contextMessage,
            maxTokens: HYBRID_MAX_TOKENS,
            temperature: DD_TEMPERATURES.mapping,
            cacheablePrefix: HYBRID_CACHED_PREFIX,
          });

          const parsed = parseJsonResponse<DD4_M_Output>(content, 'DD4-M');
          const validated = DD4_M_OutputSchema.parse(parsed);

          await updateProgress({ phase_progress: 100 });
          checkTokenBudget(usage, 'DD4-M');

          return { result: validated, usage };
        });

        // =========================================
        // DD5-M: DD Report Generation
        // =========================================
        const dd5Result = await step.run(
          'dd5-m-report-generation',
          async () => {
            await updateProgress({
              current_step: 'dd5-m',
              phase_progress: 0,
            });

            const contextMessage = `## DD0 Output (Claim Extraction)

${JSON.stringify(dd0Result.result, null, 2)}

## AN0-M Output (Problem Framing)

${JSON.stringify(an0mResult.result, null, 2)}

## AN3-M Output (Solution Space)

${JSON.stringify(an3mResult.result, null, 2)}

## DD3 Output (Claim Validation)

${JSON.stringify(dd3Result.result, null, 2)}

## DD4 Output (Solution Mapping & Moat)

${JSON.stringify(dd4Result.result, null, 2)}

## Your Task

Generate a Technical Due Diligence Report for ${companyName}.

This report should help an investor decide:
1. Is the technical thesis sound?
2. Is the approach optimal for the problem?
3. Is this defensible?
4. What are the key risks?
5. What should they ask the founders?`;

            const { content, usage } = await callClaude({
              model: MODELS.OPUS,
              system: DD5_M_PROMPT,
              userMessage: contextMessage,
              maxTokens: HYBRID_MAX_TOKENS,
              temperature: DD_TEMPERATURES.report,
              cacheablePrefix: HYBRID_CACHED_PREFIX,
            });

            const parsed = parseJsonResponse<DD5_M_Output>(content, 'DD5-M');
            const validated = DD5_M_OutputSchema.parse(parsed);

            await updateProgress({ phase_progress: 100 });
            checkTokenBudget(usage, 'DD5-M');

            return { result: validated, usage };
          },
        );

        // =========================================
        // Complete Report
        // =========================================
        const allUsages = [
          dd0Result.usage,
          an0mResult.usage,
          an1_5mResult.usage,
          an1_7mResult.usage,
          an2mResult.usage,
          an3mResult.usage,
          dd3Result.usage,
          dd4Result.usage,
          dd5Result.usage,
        ];
        const totalUsage = calculateTotalUsage(allUsages);

        await step.run('complete-dd-report', async () => {
          // Persist token usage to database
          const { error: usageError } = await supabase.rpc('increment_usage', {
            p_account_id: accountId,
            p_tokens: totalUsage.totalTokens,
            p_is_report: true,
            p_is_chat: false,
          });
          if (usageError) {
            console.error('[Usage] Failed to persist usage:', usageError);
          } else {
            console.log('[Usage] Persisted (DD):', {
              accountId,
              tokens: totalUsage.totalTokens,
              costUsd: totalUsage.costUsd,
            });
          }

          // Generate title from report
          const generatedTitle = `DD: ${dd5Result.result.header.company_name} - ${dd5Result.result.executive_summary.verdict}`;

          // Build headline from executive summary
          const headline =
            dd5Result.result.executive_summary.one_paragraph_summary
              .slice(0, 200)
              .trim();

          await updateProgress({
            status: 'complete',
            current_step: 'complete',
            phase_progress: 100,
            title: generatedTitle,
            headline,
            report_data: {
              mode: 'dd',
              report: dd5Result.result,
              claim_extraction: dd0Result.result,
              problem_framing: an0mResult.result,
              teaching_examples: an1_5mResult.result,
              literature: an1_7mResult.result,
              methodology: an2mResult.result,
              solution_space: an3mResult.result,
              claim_validation: dd3Result.result,
              solution_mapping: dd4Result.result,
              tokenUsage: totalUsage,
            },
          });
        });

        return {
          success: true,
          reportId,
          tokenUsage: totalUsage,
        };
      }
    } finally {
      // Always decrement on exit (success or error)
      tracker?.decrement();
    }
  },
);
