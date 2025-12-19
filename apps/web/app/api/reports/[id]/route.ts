import { NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * GET /api/reports/[id]
 *
 * Fetch a single report by ID.
 * Requires authentication - RLS ensures user can only access their own reports.
 */
export const GET = enhanceRouteHandler(
  async function ({ params }) {
    const client = getSupabaseServerClient();
    const reportId = params.id;

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 },
      );
    }

    const { data, error } = await client
      .from('sparlo_reports')
      .select(
        'id, title, status, current_step, phase_progress, report_data, clarifications, last_message, created_at',
      )
      .eq('id', reportId as string)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 },
        );
      }

      console.error('Failed to fetch report:', error);

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
  },
  {
    auth: true,
  },
);
