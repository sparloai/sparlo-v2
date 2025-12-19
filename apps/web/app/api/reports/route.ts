import { NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * GET /api/reports
 *
 * List all reports for the authenticated user.
 * Supports pagination via query params: ?limit=10&offset=0
 * RLS ensures user can only access their own reports.
 */
export const GET = enhanceRouteHandler(
  async function ({ user, request }) {
    const client = getSupabaseServerClient();
    const url = new URL(request.url);

    const limit = Math.min(
      parseInt(url.searchParams.get('limit') ?? '20'),
      100,
    );
    const offset = parseInt(url.searchParams.get('offset') ?? '0');
    const status = url.searchParams.get('status');

    let query = client
      .from('sparlo_reports')
      .select('id, title, status, current_step, phase_progress, created_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
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
