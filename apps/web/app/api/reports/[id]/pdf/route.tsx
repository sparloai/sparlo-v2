import { NextResponse } from 'next/server';

import { renderToBuffer } from '@react-pdf/renderer';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { ReportPDFDocument } from './_components/report-pdf-document';
import type { ReportForPDF } from './_lib/types';

const PDF_GENERATION_TIMEOUT_MS = 30000; // 30 seconds

// Rate limit configuration for PDF export
// PDF generation is resource-intensive, so limits are moderate
const PDF_RATE_LIMITS = {
  HOURLY: 20,
  DAILY: 100,
};

interface RateLimitResult {
  allowed: boolean;
  hourCount: number;
  dayCount: number;
  hourlyLimit: number;
  dailyLimit: number;
  hourReset: number;
  dayReset: number;
  retryAfter: number | null;
}

export const GET = enhanceRouteHandler(
  async function ({ params, user }) {
    const { id } = params as { id: string };

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID required', code: 'MISSING_ID' },
        { status: 400 },
      );
    }

    const client = getSupabaseServerClient();

    // Check rate limit before generating PDF
    try {
      const { data: rateLimitData, error: rateLimitError } = await client.rpc(
        'check_rate_limit' as 'count_completed_reports',
        {
          p_user_id: user.id,
          p_endpoint: 'pdf_export',
          p_hourly_limit: PDF_RATE_LIMITS.HOURLY,
          p_daily_limit: PDF_RATE_LIMITS.DAILY,
        } as unknown as { target_account_id: string },
      );

      if (!rateLimitError) {
        const result = rateLimitData as unknown as RateLimitResult;
        if (!result.allowed) {
          return NextResponse.json(
            { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
            {
              status: 429,
              headers: {
                'Retry-After': String(result.retryAfter ?? 60),
                'X-RateLimit-Limit-Hour': String(result.hourlyLimit),
                'X-RateLimit-Remaining-Hour': String(
                  Math.max(0, result.hourlyLimit - result.hourCount),
                ),
                'X-RateLimit-Reset-Hour': String(result.hourReset),
                'X-RateLimit-Limit-Day': String(result.dailyLimit),
                'X-RateLimit-Remaining-Day': String(
                  Math.max(0, result.dailyLimit - result.dayCount),
                ),
                'X-RateLimit-Reset-Day': String(result.dayReset),
              },
            },
          );
        }
      }
    } catch (err) {
      // Fail open - log and continue if rate limit check fails
      console.error('[PDF Export] Rate limit check error:', err);
    }

    // Fetch report with updated_at for cache validation
    const { data: report, error } = await client
      .from('sparlo_reports')
      .select('id, title, headline, report_data, created_at, updated_at')
      .eq('id', id)
      .single();

    // Simplified error handling - trust RLS
    if (error || !report) {
      console.error('[PDF Export] Database error:', error);
      return NextResponse.json(
        { error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    try {
      // Add timeout to prevent blocking indefinitely
      const pdfBuffer = await Promise.race([
        renderToBuffer(<ReportPDFDocument report={report as ReportForPDF} />),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('PDF generation timeout')),
            PDF_GENERATION_TIMEOUT_MS,
          ),
        ),
      ]);

      // Sanitize filename
      const filename =
        report.title
          .replace(/[^a-z0-9]/gi, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .toLowerCase()
          .substring(0, 50) || 'report';

      // Generate ETag for cache validation
      const updatedAt = report.updated_at || report.created_at;
      const eTag = `"${report.id}-${new Date(updatedAt).getTime()}"`;

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}-report.pdf"`,
          // Cache headers: private (auth required), 1 hour, revalidate after
          'Cache-Control':
            'private, max-age=3600, stale-while-revalidate=86400',
          ETag: eTag,
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch (err) {
      console.error('[PDF Export] Generation failed:', err);

      // Differentiate timeout from other errors
      if (err instanceof Error && err.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'PDF generation timed out', code: 'TIMEOUT' },
          { status: 504 },
        );
      }

      return NextResponse.json(
        { error: 'Failed to generate PDF', code: 'GENERATION_FAILED' },
        { status: 500 },
      );
    }
  },
  { auth: true },
);
