import { NextResponse } from 'next/server';

import { z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { inngest } from '~/lib/inngest/client';

const AnswerClarificationSchema = z.object({
  answer: z
    .string()
    .min(1, 'Please provide an answer')
    .max(5000, 'Answer must be under 5,000 characters'),
});

/**
 * POST /api/reports/[id]/clarify
 *
 * Answer a clarification question for a report.
 * Agent-native endpoint for completing the clarification workflow.
 */
export const POST = enhanceRouteHandler(
  async ({ body, params }) => {
    const client = getSupabaseServerClient();
    const reportId = params.id as string;

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 },
      );
    }

    // Verify ownership and status
    const { data: report, error: fetchError } = await client
      .from('sparlo_reports')
      .select('id, status, clarifications, report_data')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        {
          error: 'Report not found or you do not have permission to modify it',
        },
        { status: 404 },
      );
    }

    if (report.status !== 'clarifying') {
      return NextResponse.json(
        { error: 'Report is not awaiting clarification' },
        { status: 400 },
      );
    }

    // Update clarifications with answer
    const clarifications =
      (report.clarifications as Record<string, unknown>[]) ?? [];
    if (clarifications.length > 0) {
      const lastClarification = clarifications[clarifications.length - 1];
      if (lastClarification) {
        lastClarification.answer = body.answer;
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
      .eq('id', reportId as string);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update report: ${updateError.message}` },
        { status: 500 },
      );
    }

    // Determine which event to send based on report mode
    const reportData = report.report_data as { mode?: string } | null;
    const mode = reportData?.mode;

    let eventName:
      | 'report/clarification-answered'
      | 'report/discovery-clarification-answered'
      | 'report/hybrid-clarification-answered' =
      'report/clarification-answered';
    if (mode === 'discovery') {
      eventName = 'report/discovery-clarification-answered';
    } else if (mode === 'hybrid') {
      eventName = 'report/hybrid-clarification-answered';
    }

    // Resume Inngest workflow
    try {
      await inngest.send({
        name: eventName,
        data: {
          reportId,
          answer: body.answer,
        },
      });
    } catch (inngestError) {
      console.error('Failed to resume workflow:', inngestError);
      return NextResponse.json(
        { error: 'Failed to continue report generation' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  },
  {
    auth: true,
    schema: AnswerClarificationSchema,
  },
);

/**
 * GET /api/reports/[id]/clarify
 *
 * Get the current clarification question for a report.
 */
export const GET = enhanceRouteHandler(
  async ({ params }) => {
    const client = getSupabaseServerClient();
    const reportId = params.id as string;

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 },
      );
    }

    const { data: report, error } = await client
      .from('sparlo_reports')
      .select('id, status, clarifications')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      return NextResponse.json(
        {
          error: 'Report not found or you do not have permission to access it',
        },
        { status: 404 },
      );
    }

    const clarifications =
      (report.clarifications as Array<{
        question?: string;
        answer?: string;
      }>) ?? [];
    const pendingClarification = clarifications.find((c) => !c.answer);

    return NextResponse.json({
      success: true,
      needsClarification: report.status === 'clarifying',
      question: pendingClarification?.question ?? null,
      clarificationHistory: clarifications,
    });
  },
  {
    auth: true,
  },
);
