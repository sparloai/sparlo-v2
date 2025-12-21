import { NextResponse } from 'next/server';

import { z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { inngest } from '~/lib/inngest/client';

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

const StartDiscoveryReportSchema = z.object({
  designChallenge: z
    .string()
    .min(50, 'Please provide at least 50 characters')
    .max(10000, 'Design challenge must be under 10,000 characters'),
  attachments: z.array(AttachmentSchema).max(5).optional(),
});

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REPORTS_PER_WINDOW = 1;
const DAILY_LIMIT = 1000;

/**
 * POST /api/discovery/reports
 *
 * Start a new discovery report generation.
 * Agent-native endpoint for programmatic access to Discovery Mode.
 */
export const POST = enhanceRouteHandler(
  async ({ body, user }) => {
    const client = getSupabaseServerClient();

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
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait 5 minutes between reports.',
        },
        { status: 429 },
      );
    }

    if (dailyResult.count && dailyResult.count >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `Daily limit reached. You can create up to ${DAILY_LIMIT} reports per day.`,
        },
        { status: 429 },
      );
    }

    const conversationId = crypto.randomUUID();

    // Create the report record with discovery mode flag
    const { data: report, error: dbError } = await client
      .from('sparlo_reports')
      .insert({
        account_id: user.id,
        conversation_id: conversationId,
        title: `${body.designChallenge.slice(0, 90)}`,
        status: 'processing',
        current_step: 'an0-d',
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: body.designChallenge,
            timestamp: new Date().toISOString(),
          },
        ],
        report_data: {
          mode: 'discovery',
          started_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to create discovery report:', dbError);
      return NextResponse.json(
        { error: `Failed to create discovery report: ${dbError.message}` },
        { status: 500 },
      );
    }

    // Trigger Discovery Inngest function
    try {
      await inngest.send({
        name: 'report/generate-discovery',
        data: {
          reportId: report.id,
          accountId: user.id,
          userId: user.id,
          designChallenge: body.designChallenge,
          conversationId,
          // Pass attachments for Claude vision processing
          attachments: body.attachments || [],
        },
      });
    } catch (inngestError) {
      console.error('Failed to trigger Discovery Inngest:', inngestError);
      await client
        .from('sparlo_reports')
        .update({
          status: 'error',
          last_message: 'Failed to start discovery report generation',
        })
        .eq('id', report.id);
      return NextResponse.json(
        { error: 'Failed to start discovery report generation' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      conversationId,
    });
  },
  {
    auth: true,
    schema: StartDiscoveryReportSchema,
  },
);
