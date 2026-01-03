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
  type DD3_5_M_Output,
  DD3_5_M_OutputSchema,
  DD3_5_M_PROMPT,
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
// Import security utilities
import {
  categorizeError,
  createErrorLogEntry,
} from '../../llm/security/error-handler';
import {
  sanitizeCompanyName,
  sanitizeUserInput,
  validateAttachments,
  validateDDInput,
} from '../../llm/security/input-validator';
import { inngest } from '../client';

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
 * - DD3.5-M: Commercialization reality check
 * - DD4-M: Solution space mapping and moat assessment
 * - DD5-M: Generate investor-facing DD report
 *
 * Philosophy: Map the full solution space first, then evaluate where
 * the startup sits within it. This reveals blind spots and validates claims.
 *
 * Security: Implements input validation, prompt injection protection,
 * rate limiting, atomic updates, and idempotent token tracking.
 */

// =============================================================================
// Constants
// =============================================================================

/** Token budget limit for safety */
const TOKEN_BUDGET_LIMIT = 250000; // 250K tokens max per DD report

/** Rate limit: max reports per hour per account */
const RATE_LIMIT_REPORTS_PER_HOUR = 5;

/** Rate limit window in minutes */
const RATE_LIMIT_WINDOW_MINUTES = 60;

// =============================================================================
// Types
// =============================================================================

interface DDReportEventData {
  reportId: string;
  startupMaterials: string;
  vcNotes?: string;
  companyName: string;
  attachments?: Array<{ media_type: string; data: string }>;
  accountId: string;
}

// =============================================================================
// Inngest Function
// =============================================================================

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
        event: { data: DDReportEventData };
      };
      const reportId = failureEvent.event.data.reportId;

      // Use categorized error handling
      const categorizedError = categorizeError(error);
      const logEntry = createErrorLogEntry(reportId, error, {
        step: 'onFailure',
      });

      console.error('[DD Function] Report failed:', logEntry);

      // Update report with user-friendly error message
      await step.run('update-failed-status', async () => {
        const supabase = getSupabaseServerAdminClient();
        await supabase
          .from('sparlo_reports')
          .update({
            status: 'failed',
            error_message: categorizedError.userMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', reportId);
      });
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

    // Generate idempotency key from event ID for token tracking
    const idempotencyKey = `dd-report-${event.data.reportId}-${event.id || Date.now()}`;

    try {
      console.log('[DD Function] Starting with event:', {
        name: event.name,
        reportId: event.data.reportId,
        hasStartupMaterials: !!event.data.startupMaterials,
        companyName: event.data.companyName,
      });

      const { reportId, startupMaterials, vcNotes, attachments } =
        event.data as DDReportEventData;

      // Sanitize company name
      const companyName = sanitizeCompanyName(event.data.companyName);

      const supabase = getSupabaseServerAdminClient();
      console.log('[DD Function] Supabase client initialized');

      // =========================================
      // P1 FIX (141): Authorization - Use report's account_id as source of truth
      // =========================================
      const { data: report, error: authError } = await supabase
        .from('sparlo_reports')
        .select('id, account_id')
        .eq('id', reportId)
        .single();

      if (authError || !report) {
        console.error('[DD Function] Report not found:', authError);
        return { success: false, reportId, error: 'Report not found' };
      }

      // Use the report's account_id as the source of truth (not event data)
      const accountId = report.account_id;

      // Log if event accountId differs (potential attack attempt)
      if (event.data.accountId !== accountId) {
        console.warn(
          '[DD Function] Account ID mismatch (using report value):',
          {
            reportAccountId: accountId,
            eventAccountId: event.data.accountId,
          },
        );
      }

      // =========================================
      // P1 FIX (142): Rate Limiting Check
      // =========================================
      // Note: Uses type assertion because the RPC function is added by migration
      // that may not have been applied yet. Regenerate types after migration.
      const rateLimitResult = await step.run('check-rate-limit', async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rpc = supabase.rpc as any;
          const { data, error } = await rpc('check_rate_limit', {
            p_account_id: accountId,
            p_resource_type: 'dd_report',
            p_limit: RATE_LIMIT_REPORTS_PER_HOUR,
            p_window_minutes: RATE_LIMIT_WINDOW_MINUTES,
          });

          if (error) {
            console.warn('[DD Function] Rate limit check failed:', error);
            // Don't fail the report if rate limiting check fails
            return { allowed: true, reset_at: null };
          }

          return data as {
            allowed: boolean;
            current_count: number;
            limit: number;
            reset_at: string | null;
          };
        } catch {
          // Function may not exist yet - allow the request
          console.warn('[DD Function] Rate limit function not available');
          return { allowed: true, reset_at: null };
        }
      });

      if (!rateLimitResult.allowed && rateLimitResult.reset_at) {
        const resetAt = new Date(rateLimitResult.reset_at);
        const errorMessage = `Rate limit exceeded. You can generate ${RATE_LIMIT_REPORTS_PER_HOUR} reports per hour. Try again at ${resetAt.toLocaleTimeString()}.`;

        await supabase
          .from('sparlo_reports')
          .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', reportId);

        return { success: false, reportId, error: errorMessage };
      }

      // =========================================
      // P1 FIX (139, 140): Input Validation & Token Budget Check
      // =========================================
      const validationResult = validateDDInput({
        startupMaterials,
        vcNotes,
        companyName,
        attachments,
        tokenBudgetLimit: TOKEN_BUDGET_LIMIT,
      });

      if (!validationResult.valid) {
        const errorMessage = validationResult.errors.join(' ');
        console.error('[DD Function] Input validation failed:', {
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        });

        await supabase
          .from('sparlo_reports')
          .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', reportId);

        return { success: false, reportId, error: errorMessage };
      }

      // Log warnings if any
      if (validationResult.warnings.length > 0) {
        console.warn('[DD Function] Input validation warnings:', {
          warnings: validationResult.warnings,
          estimatedTokens: validationResult.estimatedTokens,
        });
      }

      // =========================================
      // P2 FIX (147): Attachment Validation
      // =========================================
      const attachmentValidation = validateAttachments(attachments);
      if (!attachmentValidation.valid) {
        const errorMessage = attachmentValidation.errors.join(' ');
        console.error('[DD Function] Attachment validation failed:', {
          errors: attachmentValidation.errors,
        });

        await supabase
          .from('sparlo_reports')
          .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', reportId);

        return { success: false, reportId, error: errorMessage };
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

      // P1 FIX (139): Sanitize user inputs
      const { sanitized: sanitizedMaterials, suspiciousPatterns } =
        sanitizeUserInput(startupMaterials);
      const { sanitized: sanitizedNotes } = sanitizeUserInput(vcNotes || '');

      if (suspiciousPatterns.length > 0) {
        console.warn('[DD Function] Filtered suspicious patterns:', {
          count: suspiciousPatterns.length,
          patterns: suspiciousPatterns.slice(0, 5), // Log first 5 only
        });
      }

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
        } {
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
          };
        }

        /**
         * Helper: Update report progress in Supabase
         * P1 FIX (143): Now throws on error instead of silent logging
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
            // Throw to allow Inngest retry to handle
            throw new Error(`Database update failed: ${error.message}`);
          }
        }

        /**
         * P2 FIX (150): Validate chain step output has required data
         */
        function validateStepOutput(
          stepName: string,
          output: Record<string, unknown>,
          requiredFields: string[],
        ): void {
          const missing: string[] = [];
          const empty: string[] = [];

          for (const field of requiredFields) {
            const value = getNestedValue(output, field);
            if (value === undefined) {
              missing.push(field);
            } else if (typeof value === 'string' && value.trim().length === 0) {
              empty.push(field);
            } else if (Array.isArray(value) && value.length === 0) {
              empty.push(field);
            }
          }

          if (missing.length > 0) {
            throw new Error(
              `${stepName} output missing required fields: ${missing.join(', ')}`,
            );
          }

          if (empty.length > 0) {
            console.warn(
              `[DD] ${stepName} has empty required fields: ${empty.join(', ')}`,
            );
          }
        }

        function getNestedValue(
          obj: Record<string, unknown>,
          path: string,
        ): unknown {
          return path
            .split('.')
            .reduce<unknown>(
              (current, key) =>
                current && typeof current === 'object'
                  ? (current as Record<string, unknown>)[key]
                  : undefined,
              obj,
            );
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

          // Build user message with sanitized inputs
          let userMessage = `## Startup Materials\n\n${sanitizedMaterials}`;
          if (sanitizedNotes) {
            userMessage += `\n\n## VC Notes\n\n${sanitizedNotes}`;
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

          // P2 FIX (150): Validate critical outputs
          validateStepOutput('DD0-M', validated as Record<string, unknown>, [
            'problem_extraction.problem_statement_for_analysis',
            'technical_claims',
          ]);

          await updateProgress({ phase_progress: 100 });
          checkTokenBudget(usage, 'DD0-M');

          return { result: validated, usage };
        });

        // Extract the problem statement for AN0-M
        const problemStatementForAnalysis =
          dd0Result.result.problem_extraction.problem_statement_for_analysis;

        // P2 FIX (150): Validate problem statement is not empty
        if (!problemStatementForAnalysis?.trim()) {
          throw new Error(
            'DD0-M failed to extract a valid problem statement from the startup materials. ' +
              'Please ensure the materials describe the problem being solved.',
          );
        }

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
        const _an0mAnalysis = an0mResult.result as Extract<
          AN0_M_Output,
          { needs_clarification: false }
        >;

        // =========================================
        // AN1.5-M: Teaching Selection (Existing)
        // P1 FIX (146): Remove pretty-printing from JSON.stringify
        // =========================================
        const an1_5mResult = await step.run(
          'an1.5-m-teaching-selection',
          async () => {
            await updateProgress({
              current_step: 'an1.5-m',
              phase_progress: 0,
            });

            const contextMessage = `## Problem Framing (DD Mode)

${JSON.stringify(an0mResult.result)}

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

${JSON.stringify(an0mResult.result)}

## Teaching Examples Selected

${JSON.stringify(an1_5mResult.result)}

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

${JSON.stringify(an0mResult.result)}

## Teaching Examples

${JSON.stringify(an1_5mResult.result)}

## Literature Search Results

${JSON.stringify(an1_7mResult.result)}

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

${JSON.stringify(an0mResult.result)}

## Methodology Briefing

${JSON.stringify(an2mResult.result)}

## Teaching Examples

${JSON.stringify(an1_5mResult.result)}

## Literature Search Results

${JSON.stringify(an1_7mResult.result)}

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

${JSON.stringify(dd0Result.result)}

## AN0-M Output (Problem Framing)

${JSON.stringify(an0mResult.result)}

## AN1.5-M Output (Teaching Examples)

${JSON.stringify(an1_5mResult.result)}

## AN1.7-M Output (Literature Search)

${JSON.stringify(an1_7mResult.result)}

## AN2-M Output (TRIZ Analysis)

${JSON.stringify(an2mResult.result)}

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
        // DD3.5-M: Commercialization Reality Check
        // =========================================
        const dd3_5Result = await step.run(
          'dd3.5-m-commercialization',
          async () => {
            await updateProgress({
              current_step: 'dd3.5-m',
              phase_progress: 0,
            });

            const contextMessage = `## DD0 Output (Claim Extraction & Commercial Assumptions)

${JSON.stringify(dd0Result.result)}

## DD3 Output (Technical Claim Validation)

${JSON.stringify(dd3Result.result)}

## Your Task

Analyze the commercial viability for ${companyName}:
1. Validate unit economics assumptions
2. Assess market reality and customer demand
3. Evaluate GTM challenges
4. Check timeline fit with VC expectations
5. Identify scale-up challenges
6. Analyze ecosystem dependencies
7. Evaluate policy exposure
8. Predict incumbent response`;

            const { content, usage } = await callClaude({
              model: MODELS.OPUS,
              system: DD3_5_M_PROMPT,
              userMessage: contextMessage,
              maxTokens: HYBRID_MAX_TOKENS,
              temperature: DD_TEMPERATURES.validation,
              cacheablePrefix: HYBRID_CACHED_PREFIX,
            });

            const parsed = parseJsonResponse<DD3_5_M_Output>(
              content,
              'DD3.5-M',
            );
            const validated = DD3_5_M_OutputSchema.parse(parsed);

            await updateProgress({ phase_progress: 100 });
            checkTokenBudget(usage, 'DD3.5-M');

            return { result: validated, usage };
          },
        );

        // =========================================
        // DD4-M: Solution Space Mapping & Moat
        // =========================================
        const dd4Result = await step.run('dd4-m-moat-assessment', async () => {
          await updateProgress({
            current_step: 'dd4-m',
            phase_progress: 0,
          });

          const contextMessage = `## DD0 Output (Extracted Claims & Proposed Solution)

${JSON.stringify(dd0Result.result)}

## AN3-M Output (Full Solution Space)

${JSON.stringify(an3mResult.result)}

## DD3 Output (Claim Validation)

${JSON.stringify(dd3Result.result)}

## DD3.5 Output (Commercialization Reality Check)

${JSON.stringify(dd3_5Result.result)}

## AN1.7-M Output (Prior Art)

${JSON.stringify(an1_7mResult.result)}

## Your Task

Map ${companyName}'s approach onto the solution space:
1. Which track does their approach fall into?
2. Is this the optimal position for their stated problem?
3. What alternatives did they miss or dismiss?
4. Assess novelty against prior art
5. Evaluate moat strength and durability
6. Identify competitive threats from other approaches
7. Formulate "The One Bet" - what they're really betting on
8. Conduct pre-mortem analysis
9. Analyze comparable companies
10. Build scenario analysis with expected value`;

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

            const contextMessage = `## DD0 Output (Claim Extraction & Commercial Assumptions)

${JSON.stringify(dd0Result.result)}

## AN0-M Output (Problem Framing)

${JSON.stringify(an0mResult.result)}

## AN3-M Output (Solution Space)

${JSON.stringify(an3mResult.result)}

## DD3 Output (Technical Claim Validation)

${JSON.stringify(dd3Result.result)}

## DD3.5 Output (Commercialization Reality Check)

${JSON.stringify(dd3_5Result.result)}

## DD4 Output (Solution Mapping, Moat & Strategic Analysis)

${JSON.stringify(dd4Result.result)}

## Your Task

Generate a comprehensive Technical Due Diligence Report for ${companyName}.

This V2 report provides:
1. One-page summary with verdict box
2. Problem primer teaching VCs how to think about the space
3. Solution landscape as the centerpiece (Sparlo's core value)
4. Technical thesis validation
5. Commercialization reality check
6. Pre-mortem, comparables, and scenario analysis
7. Actionable diligence roadmap
8. Calibrated confidence levels

Make the report 3-5x more valuable than traditional DD.`;

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
        // P1 FIX (143, 145): Use atomic completion with idempotency
        // =========================================
        const allUsages = [
          dd0Result.usage,
          an0mResult.usage,
          an1_5mResult.usage,
          an1_7mResult.usage,
          an2mResult.usage,
          an3mResult.usage,
          dd3Result.usage,
          dd3_5Result.usage,
          dd4Result.usage,
          dd5Result.usage,
        ];
        const totalUsage = calculateTotalUsage(allUsages);

        await step.run('complete-dd-report', async () => {
          // Generate title from report
          const generatedTitle = `DD: ${dd5Result.result.header.company_name} - ${dd5Result.result.executive_summary.verdict}`;

          // Build headline from executive summary
          const headline =
            dd5Result.result.executive_summary.one_paragraph_summary
              .slice(0, 200)
              .trim();

          // Build report data
          const reportData = {
            mode: 'dd',
            version: '2.0.0',
            report: dd5Result.result,
            claim_extraction: dd0Result.result,
            problem_framing: an0mResult.result,
            teaching_examples: an1_5mResult.result,
            literature: an1_7mResult.result,
            methodology: an2mResult.result,
            solution_space: an3mResult.result,
            claim_validation: dd3Result.result,
            commercialization_analysis: dd3_5Result.result,
            solution_mapping: dd4Result.result,
            tokenUsage: totalUsage,
          };

          // P1 FIX (143, 145): Use atomic completion function with idempotency
          // Note: Uses type assertion because the RPC function is added by migration
          // that may not have been applied yet. Regenerate types after migration.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rpc = supabase.rpc as any;
          const { data, error } = await rpc('complete_dd_report_atomic', {
            p_report_id: reportId,
            p_report_data: reportData,
            p_title: generatedTitle,
            p_headline: headline,
            p_account_id: accountId,
            p_total_tokens: totalUsage.totalTokens,
            p_idempotency_key: idempotencyKey,
          });

          if (error) {
            // Fallback to non-atomic update if function doesn't exist
            if (
              error.message?.includes('function') &&
              error.message?.includes('does not exist')
            ) {
              console.warn(
                '[DD Function] Atomic completion not available, using fallback',
              );

              // Non-atomic fallback
              const { error: updateError } = await supabase
                .from('sparlo_reports')
                .update({
                  status: 'complete',
                  current_step: 'complete',
                  phase_progress: 100,
                  title: generatedTitle,
                  headline,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  report_data: reportData as any,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', reportId)
                .eq('account_id', accountId);

              if (updateError) {
                throw new Error(
                  `Failed to update report: ${updateError.message}`,
                );
              }

              // Track token usage (non-idempotent fallback)
              await supabase.rpc('increment_usage', {
                p_account_id: accountId,
                p_tokens: totalUsage.totalTokens,
                p_is_report: true,
                p_is_chat: false,
              });
            } else {
              console.error('[DD Function] Atomic completion failed:', error);
              throw new Error(`Failed to complete report: ${error.message}`);
            }
          } else {
            const result = data as { success: boolean; error?: string };
            if (!result.success) {
              throw new Error(
                result.error || 'Unknown error completing report',
              );
            }
          }

          console.log('[DD Function] Report completed atomically:', {
            reportId,
            tokens: totalUsage.totalTokens,
            costUsd: totalUsage.costUsd,
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
