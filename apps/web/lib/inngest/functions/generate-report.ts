import 'server-only';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { inngest } from '../client';
import { callClaude, MODELS, parseJsonResponse } from '../../llm/client';
import {
  AN0_PROMPT,
  AN0OutputSchema,
  type AN0Output,
} from '../../llm/prompts/an0-problem-framing';
import {
  ChainStateSchema,
  createInitialChainState,
  type ChainState,
} from '../../llm/schemas/chain-state';

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
      // Update status and store clarification question
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
        }
      );

      if (clarificationEvent) {
        state.clarificationAnswer = clarificationEvent.data.answer;
        state.clarificationCount = (state.clarificationCount ?? 0) + 1;

        // Update status back to processing
        await step.run('resume-after-clarification', async () => {
          await updateProgress({
            status: 'processing',
            clarifications: [
              {
                question: an0Result.clarificationQuestion,
                answer: clarificationEvent.data.answer,
                askedAt: new Date().toISOString(),
                answeredAt: new Date().toISOString(),
              },
            ],
          });
        });
      } else {
        // Timeout - proceed without clarification
        await step.run('clarification-timeout', async () => {
          await updateProgress({
            status: 'processing',
          });
        });
      }
    }

    // =========================================
    // AN1.5 - AN5: Remaining Chain Steps
    // (Placeholder - will be implemented next)
    // =========================================

    // For now, mark as complete with placeholder
    await step.run('complete-report', async () => {
      await updateProgress({
        status: 'complete',
        current_step: 'complete',
        phase_progress: 100,
        report_data: {
          chainState: state,
          markdown: generatePlaceholderReport(state),
        },
      });
    });

    return { success: true, reportId };
  }
);

/**
 * Placeholder report generator (will be replaced by AN5)
 */
function generatePlaceholderReport(state: ChainState): string {
  return `# Analysis Report

## Problem Summary
${state.originalAsk ?? state.userInput}

## Sector
${state.userSector ?? 'Not identified'}

## Key Constraints
${state.hardConstraints?.map((c) => `- ${c}`).join('\n') ?? 'None identified'}

## KPIs
${state.primaryKpis?.map((k) => `- ${k}`).join('\n') ?? 'None identified'}

## Core Contradiction
${state.contradiction?.description ?? 'Not identified'}

## Cross-Domain Insights
${state.crossDomainSeeds?.map((s) => `- ${s}`).join('\n') ?? 'None identified'}

---

*Full report generation coming soon. This is a placeholder showing AN0 analysis results.*
`;
}
