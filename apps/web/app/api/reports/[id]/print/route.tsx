import 'server-only';

import { NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import type { HybridReportData } from '~/app/app/reports/_lib/types/hybrid-report-display.types';

import { renderReportToHtml } from './_lib/render-report-html';

interface ReportRow {
  id: string;
  title: string;
  report_data: {
    mode?: string;
    report?: HybridReportData;
  } | null;
  created_at: string;
  updated_at: string;
}

// UUID validation regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * GET /api/reports/[id]/print
 *
 * Returns the report as a complete HTML document optimized for printing/PDF generation.
 * This route is called by Puppeteer to generate the PDF.
 * Protected by authentication to prevent unauthorized access.
 */
export const GET = enhanceRouteHandler(
  async function ({ params }) {
    const { id } = params as { id: string };

    if (!id || !isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid report ID', code: 'INVALID_ID' },
        { status: 400 },
      );
    }

    const client = getSupabaseServerClient();

    // Fetch report data - RLS enforces access control
    const { data: report, error } = await client
      .from('sparlo_reports')
      .select('id, title, report_data, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !report) {
      return NextResponse.json(
        { error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    const typedReport = report as ReportRow;

    // Check if this is a hybrid report
    const reportData = typedReport.report_data?.report;
    if (!reportData) {
      return NextResponse.json(
        { error: 'Report data not available', code: 'NO_DATA' },
        { status: 404 },
      );
    }

    // Get brief from report data if available
    const brief = reportData.brief;

    // Render the report to HTML
    const html = renderReportToHtml({
      reportData,
      title: typedReport.title,
      brief,
      createdAt: typedReport.created_at,
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, max-age=60',
      },
    });
  },
  { auth: true },
);
