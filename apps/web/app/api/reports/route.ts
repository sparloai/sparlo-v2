import { NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * GET /api/reports
 *
 * List all reports for the authenticated user.
 * Agent-native endpoint supporting mode filtering and pagination.
 *
 * Query params:
 * - mode: 'discovery' | 'standard' (optional)
 * - status: 'processing' | 'complete' | 'error' | 'clarifying' (optional)
 * - limit: number (default 20, max 100)
 * - offset: number (default 0)
 */
export const GET = enhanceRouteHandler(
  async function ({ request }) {
    const client = getSupabaseServerClient();
    const url = new URL(request.url);

    const limit = Math.min(
      parseInt(url.searchParams.get('limit') ?? '20'),
      100,
    );
    const offset = parseInt(url.searchParams.get('offset') ?? '0');
    const status = url.searchParams.get('status');
    const mode = url.searchParams.get('mode');

    let query = client
      .from('sparlo_reports')
      .select(
        'id, title, status, current_step, phase_progress, report_data, created_at',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    // Filter by mode if specified
    if (mode === 'discovery') {
      query = query.eq('report_data->>mode', 'discovery');
    } else if (mode === 'standard') {
      query = query.or(
        'report_data->>mode.is.null,report_data->>mode.neq.discovery',
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch reports:', error);

      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      reports: data.map((report) => ({
        id: report.id,
        title: report.title,
        status: report.status,
        currentStep: report.current_step,
        phaseProgress: report.phase_progress,
        mode:
          (report.report_data as { mode?: string } | null)?.mode ?? 'standard',
        createdAt: report.created_at,
      })),
      pagination: {
        total: count ?? 0,
        limit,
        offset,
        hasMore: (count ?? 0) > offset + limit,
      },
    });
  },
  {
    auth: true,
  },
);
