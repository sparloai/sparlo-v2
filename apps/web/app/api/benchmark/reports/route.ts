import { NextResponse } from 'next/server';

import { z } from 'zod';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { inngest } from '~/lib/inngest/client';

/**
 * Benchmark API - Unauthenticated endpoint for testing Sparlo vs Claude
 *
 * WARNING: This endpoint bypasses authentication for benchmarking purposes.
 * Should be disabled or protected in production.
 */

const BENCHMARK_API_KEY = process.env.BENCHMARK_API_KEY;
const BENCHMARK_ACCOUNT_ID = process.env.BENCHMARK_ACCOUNT_ID;

const BenchmarkReportSchema = z.object({
  designChallenge: z
    .string()
    .min(50, 'Please provide at least 50 characters')
    .max(10000, 'Design challenge must be under 10,000 characters'),
});

/**
 * POST /api/benchmark/reports
 *
 * Create a benchmark report without authentication.
 * Requires BENCHMARK_API_KEY header for basic protection.
 */
export async function POST(request: Request) {
  // Basic API key protection
  const apiKey = request.headers.get('x-benchmark-api-key');

  if (!BENCHMARK_API_KEY) {
    return NextResponse.json(
      { error: 'Benchmark API not configured. Set BENCHMARK_API_KEY env var.' },
      { status: 503 },
    );
  }

  if (apiKey !== BENCHMARK_API_KEY) {
    return NextResponse.json(
      { error: 'Invalid or missing x-benchmark-api-key header' },
      { status: 401 },
    );
  }

  if (!BENCHMARK_ACCOUNT_ID) {
    return NextResponse.json(
      {
        error:
          'Benchmark account not configured. Set BENCHMARK_ACCOUNT_ID env var.',
      },
      { status: 503 },
    );
  }

  // Parse and validate body
  let body: z.infer<typeof BenchmarkReportSchema>;
  try {
    const rawBody = await request.json();
    body = BenchmarkReportSchema.parse(rawBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const client = getSupabaseServerAdminClient();
  const conversationId = crypto.randomUUID();

  // Create the report record
  const { data: report, error: dbError } = await client
    .from('sparlo_reports')
    .insert({
      account_id: BENCHMARK_ACCOUNT_ID,
      conversation_id: conversationId,
      title: `[Benchmark] ${body.designChallenge.slice(0, 80)}`,
      status: 'processing',
      current_step: 'an0-m',
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: body.designChallenge,
          timestamp: new Date().toISOString(),
        },
      ],
      report_data: {
        mode: 'hybrid',
        benchmark: true,
        started_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (dbError) {
    console.error('[Benchmark API] Failed to create report:', dbError);
    return NextResponse.json(
      { error: 'Failed to create report', details: dbError.message },
      { status: 500 },
    );
  }

  // Trigger Inngest function
  try {
    console.log('[Benchmark API] Sending Inngest event for report:', report.id);

    await inngest.send({
      name: 'report/generate-hybrid',
      data: {
        reportId: report.id,
        accountId: BENCHMARK_ACCOUNT_ID,
        userId: BENCHMARK_ACCOUNT_ID,
        designChallenge: body.designChallenge,
        conversationId,
      },
    });
  } catch (inngestError) {
    console.error('[Benchmark API] Failed to trigger Inngest:', inngestError);
    await client
      .from('sparlo_reports')
      .update({
        status: 'error',
        last_message: 'Failed to start report generation',
      })
      .eq('id', report.id);
    return NextResponse.json(
      { error: 'Failed to start report generation' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    reportId: report.id,
    conversationId,
  });
}

/**
 * GET /api/benchmark/reports
 *
 * List all benchmark reports.
 */
export async function GET(request: Request) {
  const apiKey = request.headers.get('x-benchmark-api-key');

  if (!BENCHMARK_API_KEY || apiKey !== BENCHMARK_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!BENCHMARK_ACCOUNT_ID) {
    return NextResponse.json(
      { error: 'Benchmark account not configured' },
      { status: 503 },
    );
  }

  const client = getSupabaseServerAdminClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select('id, title, status, current_step, phase_progress, created_at')
    .eq('account_id', BENCHMARK_ACCOUNT_ID)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: data });
}
