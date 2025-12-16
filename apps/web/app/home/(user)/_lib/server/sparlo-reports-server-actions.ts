'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { inngest } from '~/lib/inngest/client';

import type { ConversationStatus, Message, ReportResponse } from '../types';

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
  title: z.string().min(1),
});

// Schema for archiving a report
const ArchiveReportSchema = z.object({
  id: z.string().uuid(),
  archived: z.boolean(),
});

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
  async (data) => {
    const client = getSupabaseServerClient();

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
  async (data) => {
    const client = getSupabaseServerClient();

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
  async (data) => {
    const client = getSupabaseServerClient();

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
  async (data) => {
    const client = getSupabaseServerClient();

    const { data: report, error } = await client
      .from('sparlo_reports')
      .update({ archived: data.archived })
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to archive report: ${error.message}`);
    }

    revalidatePath('/home');
    return { success: true, report: report as unknown as SparloReport };
  },
  {
    schema: ArchiveReportSchema,
    auth: true,
  },
);

// Schema for starting a new report with Inngest
const StartReportSchema = z.object({
  designChallenge: z.string().min(50, 'Please provide at least 50 characters'),
});

/**
 * Start a new report generation using Inngest durable workflow
 */
export const startReportGeneration = enhanceAction(
  async (data, user) => {
    const client = getSupabaseServerClient();
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
  answer: z.string().min(1, 'Please provide an answer'),
});

/**
 * Answer a clarification question and resume the Inngest workflow
 */
export const answerClarification = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();

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
    const clarifications = (report.clarifications as Record<string, unknown>[]) ?? [];
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
