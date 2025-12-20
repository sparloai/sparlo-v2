'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { inngest } from '~/lib/inngest/client';
import { USAGE_CONSTANTS } from '~/lib/usage/constants';

import type { ConversationStatus, Message, ReportResponse } from '../types';
import { checkUsageAllowed } from './usage.service';

// Schema for creating a report
const CreateReportSchema = z.object({
  conversationId: z.string(),
  title: z.string(),
  status: z.enum([
    'clarifying',
    'processing',
    'complete',
    'error',
    'confirm_rerun',
  ]),
  lastMessage: z.string().optional(),
  currentStep: z.string().optional(),
});

// Strict schema for chat history messages (P1 security fix)
const ChatHistoryMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string().max(10000), // Limit content size to prevent DoS
  timestamp: z.string(),
});

// Schema for updating a report
const UpdateReportSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  status: z
    .enum(['clarifying', 'processing', 'complete', 'error', 'confirm_rerun'])
    .optional(),
  reportData: z.record(z.unknown()).optional(),
  messages: z.array(z.record(z.unknown())).optional(),
  lastMessage: z.string().optional(),
  currentStep: z.string().optional(),
  chatHistory: z.array(ChatHistoryMessageSchema).max(100).optional(), // Strict validation with limits
});

// Schema for deleting a report
const DeleteReportSchema = z.object({
  id: z.string().uuid(),
});

// Schema for renaming a report
const RenameReportSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200, 'Title must be under 200 characters'),
});

// Schema for archiving a report
const ArchiveReportSchema = z.object({
  id: z.string().uuid(),
  archived: z.boolean(),
});

/**
 * Verify that the current user owns the specified report.
 * This provides defense-in-depth alongside RLS.
 * Inlined in each action to avoid TypeScript generic complexity.
 */
async function verifyReportOwnership(
  reportId: string,
  userId: string,
): Promise<{ id: string; account_id: string }> {
  const client = getSupabaseServerClient();
  const { data: report, error } = await client
    .from('sparlo_reports')
    .select('id, account_id')
    .eq('id', reportId)
    .eq('account_id', userId) // User's personal account ID matches their user ID
    .single();

  if (error || !report) {
    throw new Error(
      'Report not found or you do not have permission to modify it',
    );
  }

  return report;
}

// Chat message type for post-report Q&A
export interface ChatHistoryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string for DB storage
}

export interface SparloReport {
  id: string;
  account_id: string;
  conversation_id: string;
  title: string;
  status: ConversationStatus;
  report_data: ReportResponse | null;
  messages: Message[];
  chat_history: ChatHistoryMessage[];
  last_message: string | null;
  current_step: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export const createReport = enhanceAction(
  async (data, user) => {
    const client = getSupabaseServerClient();

    const { data: report, error } = await client
      .from('sparlo_reports')
      .insert({
        account_id: user.id,
        conversation_id: data.conversationId,
        title: data.title,
        status: data.status,
        last_message: data.lastMessage ?? null,
        current_step: data.currentStep ?? null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create report: ${error.message}`);
    }

    revalidatePath('/home');
    return { success: true, report: report as unknown as SparloReport };
  },
  {
    schema: CreateReportSchema,
    auth: true,
  },
);

export const updateReport = enhanceAction(
  async (data, user) => {
    const client = getSupabaseServerClient();

    // P0 Security: Verify ownership before update
    await verifyReportOwnership(data.id, user.id);

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.reportData !== undefined) updateData.report_data = data.reportData;
    if (data.messages !== undefined) updateData.messages = data.messages;
    if (data.lastMessage !== undefined)
      updateData.last_message = data.lastMessage;
    if (data.currentStep !== undefined)
      updateData.current_step = data.currentStep;
    if (data.chatHistory !== undefined)
      updateData.chat_history = data.chatHistory;

    const { data: report, error } = await client
      .from('sparlo_reports')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update report: ${error.message}`);
    }

    revalidatePath('/home');
    return { success: true, report: report as unknown as SparloReport };
  },
  {
    schema: UpdateReportSchema,
    auth: true,
  },
);

export const deleteReport = enhanceAction(
  async (data, user) => {
    const client = getSupabaseServerClient();

    // P0 Security: Verify ownership before delete
    await verifyReportOwnership(data.id, user.id);

    const { error } = await client
      .from('sparlo_reports')
      .delete()
      .eq('id', data.id);

    if (error) {
      throw new Error(`Failed to delete report: ${error.message}`);
    }

    revalidatePath('/home');
    return { success: true };
  },
  {
    schema: DeleteReportSchema,
    auth: true,
  },
);

export const renameReport = enhanceAction(
  async (data, user) => {
    const client = getSupabaseServerClient();

    // P0 Security: Verify ownership before rename
    await verifyReportOwnership(data.id, user.id);

    const { data: report, error } = await client
      .from('sparlo_reports')
      .update({ title: data.title })
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to rename report: ${error.message}`);
    }

    revalidatePath('/home');
    return { success: true, report: report as unknown as SparloReport };
  },
  {
    schema: RenameReportSchema,
    auth: true,
  },
);

export const archiveReport = enhanceAction(
  async (data, user) => {
    const client = getSupabaseServerClient();

    // P0 Security: Verify ownership before archive
    await verifyReportOwnership(data.id, user.id);

    const { data: report, error } = await client
      .from('sparlo_reports')
      .update({ archived: data.archived })
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to archive report: ${error.message}`);
    }

    // Revalidate both active and archived pages
    revalidatePath('/home');
    revalidatePath('/home/archived');
    return { success: true, report: report as unknown as SparloReport };
  },
  {
    schema: ArchiveReportSchema,
    auth: true,
  },
);

// Attachment schema for vision support
const ReportAttachmentSchema = z.object({
  filename: z.string(),
  media_type: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  data: z.string(), // base64 encoded
});

// Schema for starting a new report with Inngest
const StartReportSchema = z.object({
  designChallenge: z
    .string()
    .min(50, 'Please provide at least 50 characters')
    .max(10000, 'Design challenge must be under 10,000 characters'),
  attachments: z.array(ReportAttachmentSchema).max(5).optional(),
});

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REPORTS_PER_WINDOW = 1;
const DAILY_LIMIT = 1000; // Increased for testing

/**
 * Start a new report generation using Inngest durable workflow
 */
export const startReportGeneration = enhanceAction(
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

    // Create the report record
    const { data: report, error: dbError } = await client
      .from('sparlo_reports')
      .insert({
        account_id: user.id,
        conversation_id: conversationId,
        title: data.designChallenge.slice(0, 100),
        status: 'processing',
        current_step: 'an0',
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: data.designChallenge,
            timestamp: new Date().toISOString(),
          },
        ],
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to create report:', dbError);
      throw new Error(`Failed to create report: ${dbError.message}`);
    }

    // Trigger Inngest function
    try {
      await inngest.send({
        name: 'report/generate',
        data: {
          reportId: report.id,
          accountId: user.id,
          userId: user.id,
          designChallenge: data.designChallenge,
          conversationId,
          attachments: data.attachments,
        },
      });
    } catch (inngestError) {
      console.error('Failed to trigger Inngest:', inngestError);
      // Update report status to error
      await client
        .from('sparlo_reports')
        .update({
          status: 'error',
          last_message: 'Failed to start report generation',
        })
        .eq('id', report.id);
      throw new Error('Failed to start report generation');
    }

    revalidatePath('/home');
    return { success: true, reportId: report.id, conversationId };
  },
  {
    schema: StartReportSchema,
    auth: true,
  },
);

// Schema for answering clarification
const AnswerClarificationSchema = z.object({
  reportId: z.string().uuid(),
  answer: z
    .string()
    .min(1, 'Please provide an answer')
    .max(5000, 'Answer must be under 5,000 characters'),
});

/**
 * Answer a clarification question and resume the Inngest workflow
 */
export const answerClarification = enhanceAction(
  async (data, user) => {
    const client = getSupabaseServerClient();

    // P0 Security: Verify ownership before answering
    await verifyReportOwnership(data.reportId, user.id);

    // Get the report to verify status
    const { data: report, error: fetchError } = await client
      .from('sparlo_reports')
      .select('id, status, clarifications')
      .eq('id', data.reportId)
      .single();

    if (fetchError || !report) {
      throw new Error('Report not found');
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

    // Resume Inngest workflow
    try {
      await inngest.send({
        name: 'report/clarification-answered',
        data: {
          reportId: data.reportId,
          answer: data.answer,
        },
      });
    } catch (inngestError) {
      console.error('Failed to resume workflow:', inngestError);
      throw new Error('Failed to continue report generation');
    }

    revalidatePath('/home');
    return { success: true };
  },
  {
    schema: AnswerClarificationSchema,
    auth: true,
  },
);
