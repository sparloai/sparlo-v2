'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { inngest } from '~/lib/inngest/client';
import { USAGE_CONSTANTS } from '~/lib/usage/constants';

import { checkUsageAllowed } from './usage.service';

// Schema for starting a discovery report with Inngest
const StartDiscoveryReportSchema = z.object({
  designChallenge: z
    .string()
    .min(50, 'Please provide at least 50 characters')
    .max(10000, 'Design challenge must be under 10,000 characters'),
});

// Rate limiting constants (same as standard reports)
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REPORTS_PER_WINDOW = 1000; // Disabled for testing (was 1)
const DAILY_LIMIT = 1000; // Increased for testing

/**
 * Start a new discovery report generation using Inngest durable workflow
 *
 * Discovery Mode:
 * - EXCLUDES what industry is already doing
 * - HUNTS in non-obvious domains (biology, geology, abandoned approaches, frontier materials)
 * - VALIDATES physics feasibility while prioritizing novelty
 * - PRODUCES a report focused on "what has everyone missed?"
 */
export const startDiscoveryReportGeneration = enhanceAction(
  async (data, user) => {
    const client = getSupabaseServerClient();

    // Check usage limits FIRST (before any other checks)
    const usage = await checkUsageAllowed(
      user.id,
      USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT,
    );

    if (!usage.allowed) {
      throw new Error(
        `Usage limit reached (${usage.percentage.toFixed(0)}% used). ` +
          `Upgrade your plan or wait until ${new Date(usage.periodEnd).toLocaleDateString()}.`,
      );
    }

    if (usage.isWarning) {
      console.log(
        `[Usage Warning] User ${user.id} at ${usage.percentage.toFixed(0)}% usage`,
      );
    }

    // P1 Security: Rate limiting - check recent reports
    const windowStart = new Date(
      Date.now() - RATE_LIMIT_WINDOW_MS,
    ).toISOString();
    const dayStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [recentResult, dailyResult] = await Promise.all([
      client
        .from('sparlo_reports')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', user.id)
        .gte('created_at', windowStart),
      client
        .from('sparlo_reports')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', user.id)
        .gte('created_at', dayStart),
    ]);

    if (recentResult.count && recentResult.count >= MAX_REPORTS_PER_WINDOW) {
      throw new Error(
        'Rate limit exceeded. Please wait 5 minutes between reports.',
      );
    }

    if (dailyResult.count && dailyResult.count >= DAILY_LIMIT) {
      throw new Error(
        `Daily limit reached. You can create up to ${DAILY_LIMIT} reports per day.`,
      );
    }

    const conversationId = crypto.randomUUID();

    // Create the report record with discovery mode flag
    const { data: report, error: dbError } = await client
      .from('sparlo_reports')
      .insert({
        account_id: user.id,
        conversation_id: conversationId,
        title: `[Discovery] ${data.designChallenge.slice(0, 90)}`,
        status: 'processing',
        current_step: 'an0-d',
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: data.designChallenge,
            timestamp: new Date().toISOString(),
          },
        ],
        // Store mode in report_data for tracking
        report_data: {
          mode: 'discovery',
          started_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to create discovery report:', dbError);
      throw new Error(`Failed to create discovery report: ${dbError.message}`);
    }

    // Trigger Discovery Inngest function
    try {
      console.log('[Discovery] Sending Inngest event for report:', report.id);

      const sendResult = await inngest.send({
        name: 'report/generate-discovery',
        data: {
          reportId: report.id,
          accountId: user.id,
          userId: user.id,
          designChallenge: data.designChallenge,
          conversationId,
        },
      });

      console.log('[Discovery] Inngest event sent successfully:', {
        reportId: report.id,
        eventIds: sendResult.ids,
      });
    } catch (inngestError) {
      console.error('[Discovery] Failed to trigger Inngest:', inngestError);
      // Update report status to error
      await client
        .from('sparlo_reports')
        .update({
          status: 'error',
          last_message: 'Failed to start discovery report generation',
        })
        .eq('id', report.id);
      throw new Error('Failed to start discovery report generation');
    }

    revalidatePath('/home');
    return { success: true, reportId: report.id, conversationId };
  },
  {
    schema: StartDiscoveryReportSchema,
    auth: true,
  },
);

// Schema for answering clarification in discovery mode
const AnswerDiscoveryClarificationSchema = z.object({
  reportId: z.string().uuid(),
  answer: z
    .string()
    .min(1, 'Please provide an answer')
    .max(5000, 'Answer must be under 5,000 characters'),
});

/**
 * Answer a clarification question in discovery mode and resume the Inngest workflow
 */
export const answerDiscoveryClarification = enhanceAction(
  async (data, user) => {
    const client = getSupabaseServerClient();

    // Verify ownership
    const { data: report, error: fetchError } = await client
      .from('sparlo_reports')
      .select('id, status, clarifications, account_id')
      .eq('id', data.reportId)
      .eq('account_id', user.id)
      .single();

    if (fetchError || !report) {
      throw new Error(
        'Report not found or you do not have permission to modify it',
      );
    }

    if (report.status !== 'clarifying') {
      throw new Error('Report is not awaiting clarification');
    }

    // Update clarifications with answer
    const clarifications =
      (report.clarifications as Record<string, unknown>[]) ?? [];
    if (clarifications.length > 0) {
      const lastClarification = clarifications[clarifications.length - 1];
      if (lastClarification) {
        lastClarification.answer = data.answer;
        lastClarification.answeredAt = new Date().toISOString();
      }
    }

    // Update report status
    const { error: updateError } = await client
      .from('sparlo_reports')
      .update({
        status: 'processing',
        clarifications: JSON.parse(JSON.stringify(clarifications)),
      })
      .eq('id', data.reportId);

    if (updateError) {
      throw new Error(`Failed to update report: ${updateError.message}`);
    }

    // Resume Discovery Inngest workflow
    try {
      await inngest.send({
        name: 'report/discovery-clarification-answered',
        data: {
          reportId: data.reportId,
          answer: data.answer,
        },
      });
    } catch (inngestError) {
      console.error('Failed to resume discovery workflow:', inngestError);
      throw new Error('Failed to continue discovery report generation');
    }

    revalidatePath('/home');
    return { success: true };
  },
  {
    schema: AnswerDiscoveryClarificationSchema,
    auth: true,
  },
);
