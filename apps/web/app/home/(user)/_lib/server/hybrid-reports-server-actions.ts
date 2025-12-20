'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { inngest } from '~/lib/inngest/client';
import { USAGE_CONSTANTS } from '~/lib/usage/constants';

import { checkUsageAllowed } from './usage.service';

// Attachment schema for vision support (images and PDFs)
const AttachmentSchema = z.object({
  filename: z.string(),
  media_type: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ]),
  data: z.string(), // base64 encoded
});

// Schema for starting a hybrid report with Inngest
const StartHybridReportSchema = z.object({
  designChallenge: z
    .string()
    .min(50, 'Please provide at least 50 characters')
    .max(10000, 'Design challenge must be under 10,000 characters'),
  attachments: z.array(AttachmentSchema).max(5).optional(),
});

// Rate limiting constants (same as Discovery)
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REPORTS_PER_WINDOW = 1000; // Adjust as needed
const DAILY_LIMIT = 1000;

/**
 * Start a new hybrid report generation using Inngest durable workflow
 *
 * Hybrid Mode (Full-Spectrum Analysis):
 * - SEARCHES the full solution spectrum (simple to paradigm-shifting)
 * - EVALUATES on MERIT, not novelty
 * - HUNTS in expanded territories (biology, geology, abandoned tech, etc.)
 * - DOCUMENTS prior art evidence
 * - INCLUDES honest self-critique
 *
 * Philosophy: The best solution wins regardless of origin.
 */
export const startHybridReportGeneration = enhanceAction(
  async (data, user) => {
    const client = getSupabaseServerClient();

    // Check usage limits FIRST
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

    // Rate limiting - check recent reports
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

    // Create the report record with hybrid mode flag
    const { data: report, error: dbError } = await client
      .from('sparlo_reports')
      .insert({
        account_id: user.id,
        conversation_id: conversationId,
        title: `[Hybrid] ${data.designChallenge.slice(0, 90)}`,
        status: 'processing',
        current_step: 'an0-m',
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: data.designChallenge,
            timestamp: new Date().toISOString(),
          },
        ],
        report_data: {
          mode: 'hybrid',
          started_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to create hybrid report:', dbError);
      throw new Error(`Failed to create hybrid report: ${dbError.message}`);
    }

    // Trigger Hybrid Inngest function
    try {
      console.log('[Hybrid] Sending Inngest event for report:', report.id);

      const sendResult = await inngest.send({
        name: 'report/generate-hybrid',
        data: {
          reportId: report.id,
          accountId: user.id,
          userId: user.id,
          designChallenge: data.designChallenge,
          conversationId,
          attachments: data.attachments,
        },
      });

      console.log('[Hybrid] Inngest event sent successfully:', {
        reportId: report.id,
        eventIds: sendResult.ids,
      });
    } catch (inngestError) {
      console.error('[Hybrid] Failed to trigger Inngest:', inngestError);
      await client
        .from('sparlo_reports')
        .update({
          status: 'error',
          last_message: 'Failed to start hybrid report generation',
        })
        .eq('id', report.id);
      throw new Error('Failed to start hybrid report generation');
    }

    revalidatePath('/home');
    return { success: true, reportId: report.id, conversationId };
  },
  {
    schema: StartHybridReportSchema,
    auth: true,
  },
);

// Schema for answering clarification in hybrid mode
const AnswerHybridClarificationSchema = z.object({
  reportId: z.string().uuid(),
  answer: z
    .string()
    .min(1, 'Please provide an answer')
    .max(5000, 'Answer must be under 5,000 characters'),
});

/**
 * Answer a clarification question in hybrid mode and resume the Inngest workflow
 */
export const answerHybridClarification = enhanceAction(
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

    // Resume Hybrid Inngest workflow
    try {
      await inngest.send({
        name: 'report/hybrid-clarification-answered',
        data: {
          reportId: data.reportId,
          answer: data.answer,
        },
      });
    } catch (inngestError) {
      console.error('Failed to resume hybrid workflow:', inngestError);
      throw new Error('Failed to continue hybrid report generation');
    }

    revalidatePath('/home');
    return { success: true };
  },
  {
    schema: AnswerHybridClarificationSchema,
    auth: true,
  },
);
