import { NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * GET /api/reports/[id]/progress
 *
 * Get the progress status of a report.
 * Agent-native endpoint for monitoring report generation progress.
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
      .select(
        'id, status, current_step, phase_progress, last_message, report_data',
      )
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

    // Determine mode and step mapping
    const reportData = report.report_data as { mode?: string } | null;
    const isDiscovery = reportData?.mode === 'discovery';

    // Step progress mapping (discovery mode has different steps)
    const discoverySteps: Record<string, number> = {
      'an0-d': 10,
      'an1.5-d': 25,
      'an1.7-d': 40,
      'an2-d': 55,
      'an3-d': 70,
      'an4-d': 85,
      'an5-d': 95,
      complete: 100,
    };

    const standardSteps: Record<string, number> = {
      an0: 10,
      an1: 20,
      'an1.5': 30,
      'an1.7': 40,
      an2: 55,
      an3: 70,
      an4: 85,
      an5: 95,
      complete: 100,
    };

    const stepProgress = isDiscovery ? discoverySteps : standardSteps;
    const baseProgress = stepProgress[report.current_step || ''] ?? 0;
    const phaseProgress = report.phase_progress ?? 0;
    const overallProgress = Math.min(
      baseProgress + (phaseProgress / 100) * 10,
      100,
    );

    return NextResponse.json({
      success: true,
      progress: {
        status: report.status,
        mode: isDiscovery ? 'discovery' : 'standard',
        currentStep: report.current_step,
        phaseProgress: report.phase_progress,
        overallProgress: Math.round(overallProgress),
        lastMessage: report.last_message,
        isComplete: report.status === 'complete',
        needsClarification: report.status === 'clarifying',
        hasError: report.status === 'error' || report.status === 'failed',
      },
    });
  },
  {
    auth: true,
  },
);
