import { NextResponse } from 'next/server';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

/**
 * GET /api/benchmark/reports/[id]
 *
 * Fetch a benchmark report by ID.
 * Requires x-benchmark-api-key header.
 */

const BENCHMARK_API_KEY = process.env.BENCHMARK_API_KEY;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const apiKey = request.headers.get('x-benchmark-api-key');

  if (!BENCHMARK_API_KEY || apiKey !== BENCHMARK_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: reportId } = await params;

  if (!reportId) {
    return NextResponse.json(
      { error: 'Report ID is required' },
      { status: 400 },
    );
  }

  const client = getSupabaseServerAdminClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select(
      'id, title, status, current_step, phase_progress, report_data, clarifications, last_message, created_at',
    )
    .eq('id', reportId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    console.error('[Benchmark API] Failed to fetch report:', error);

    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    id: data.id,
    title: data.title,
    status: data.status,
    currentStep: data.current_step,
    phaseProgress: data.phase_progress,
    reportData: data.report_data,
    clarifications: data.clarifications,
    lastMessage: data.last_message,
    createdAt: data.created_at,
  });
}
