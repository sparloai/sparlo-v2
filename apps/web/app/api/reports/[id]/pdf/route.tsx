import { NextResponse } from 'next/server';

import chromium from '@sparticuz/chromium';
import puppeteer, { type Browser } from 'puppeteer-core';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import type { HybridReportData } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

import { renderReportToHtml } from '../print/_lib/render-report-html';

const PDF_GENERATION_TIMEOUT_MS = 60000; // 60 seconds for Puppeteer

// Rate limit configuration for PDF export
const PDF_RATE_LIMITS = {
  HOURLY: 20,
  DAILY: 100,
};

// Concurrency limit to prevent memory exhaustion
const MAX_CONCURRENT_PDFS = 3;
let activeRequests = 0;

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

// Browser instance for connection pooling
let browserInstance: Browser | null = null;
let browserLastUsed = 0;
let browserLock = false;
const BROWSER_IDLE_TIMEOUT = 300000; // Close browser after 5 minutes of inactivity

/**
 * Optimized Chromium args for Railway container environment.
 * These reduce memory usage and improve stability in containerized environments.
 */
const OPTIMIZED_CHROMIUM_ARGS = [
  ...chromium.args,
  '--disable-dev-shm-usage', // Use /tmp instead of /dev/shm (Railway has limited shared memory)
  '--disable-accelerated-2d-canvas', // Disable GPU acceleration for canvas
  '--disable-gpu', // Disable GPU hardware acceleration
  '--no-first-run', // Skip first run wizards
  '--no-zygote', // Disable zygote process (reduces memory)
  '--single-process', // Run in single process mode (more stable in containers)
  '--disable-background-networking', // Disable background network requests
  '--disable-default-apps', // Disable default apps
  '--disable-extensions', // Disable extensions
  '--disable-sync', // Disable sync
  '--disable-translate', // Disable translation
  '--mute-audio', // Mute audio
  '--hide-scrollbars', // Hide scrollbars in screenshots
  '--font-render-hinting=none', // Disable font hinting for consistent rendering
];

/**
 * Get or create a browser instance for PDF generation.
 * Uses connection pooling to avoid cold start penalty on subsequent requests.
 *
 * Security note: --no-sandbox is required for Railway container environment.
 * XSS protection is enforced at the HTML rendering layer via whitelist sanitization.
 */
async function getBrowser(): Promise<Browser> {
  // Simple lock to prevent race condition during browser creation
  while (browserLock) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const now = Date.now();

  // Close idle browser
  if (browserInstance && now - browserLastUsed > BROWSER_IDLE_TIMEOUT) {
    browserLock = true;
    try {
      await browserInstance.close();
    } catch {
      // Ignore close errors
    }
    browserInstance = null;
    browserLock = false;
  }

  // Create new browser if needed
  if (!browserInstance) {
    browserLock = true;
    try {
      browserInstance = await puppeteer.launch({
        args: OPTIMIZED_CHROMIUM_ARGS,
        defaultViewport: { width: 794, height: 1123 }, // A4 at 96 DPI
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    } finally {
      browserLock = false;
    }
  }

  browserLastUsed = now;
  return browserInstance;
}

/**
 * Acquire a slot for PDF generation.
 * Returns false if the server is at capacity.
 */
function acquireSlot(): boolean {
  if (activeRequests >= MAX_CONCURRENT_PDFS) {
    return false;
  }
  activeRequests++;
  return true;
}

/**
 * Release a PDF generation slot.
 */
function releaseSlot(): void {
  activeRequests = Math.max(0, activeRequests - 1);
}

/**
 * Generate PDF from HTML using Puppeteer.
 * Optimized for Railway container environment with embedded base64 fonts.
 *
 * Font loading strategy:
 * - Keep JavaScript enabled (required for CSS font parsing)
 * - Use networkidle0 to wait for all resources including inline fonts
 * - Explicitly wait for document.fonts.ready API
 * - Block only external network requests, not inline resources
 */
async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Block external network requests only (not needed, all assets are base64 embedded)
    // This prevents potential tracking/analytics but allows inline resource parsing
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url();
      // Allow data: URIs (our base64 fonts) and about: URLs
      // Block any actual network requests to external hosts
      if (
        url.startsWith('data:') ||
        url.startsWith('about:') ||
        request.resourceType() === 'document'
      ) {
        request.continue();
      } else {
        request.abort();
      }
    });

    // Set content and wait for network to be idle
    // This ensures CSS is fully parsed including @font-face rules
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for fonts to be fully loaded (critical for Suisse Intl rendering)
    // The document.fonts.ready promise resolves when all @font-face fonts are loaded
    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      new Promise((resolve) => setTimeout(resolve, 5000)), // 5s max font wait
    ]);

    // Additional small delay to ensure font rendering is complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate PDF with A4 format
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '48px',
        bottom: '64px',
        left: '48px',
        right: '48px',
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 9px; width: 100%; text-align: center; color: #71717a; padding-top: 8px;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    // Clean up event listeners before closing to prevent memory leaks
    page.removeAllListeners('request');
    await page.close();
  }
}

export const GET = enhanceRouteHandler(
  async function ({ params, user }) {
    const { id } = params as { id: string };

    // Validate report ID format
    if (!id || !isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid report ID', code: 'INVALID_ID' },
        { status: 400 },
      );
    }

    // Check concurrency limit
    if (!acquireSlot()) {
      return NextResponse.json(
        { error: 'Server busy, please try again', code: 'BUSY' },
        { status: 503, headers: { 'Retry-After': '5' } },
      );
    }

    try {
      const client = getSupabaseServerClient();

      // Check rate limit before generating PDF (fail-secure)
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

        if (rateLimitError) {
          // Fail-secure: deny request if rate limit check fails
          console.error(
            '[PDF Export] Rate limit check failed:',
            rateLimitError,
          );
          return NextResponse.json(
            { error: 'Service temporarily unavailable', code: 'SERVICE_ERROR' },
            { status: 503, headers: { 'Retry-After': '30' } },
          );
        }

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
      } catch (err) {
        // Fail-secure: deny request if rate limit check throws
        console.error('[PDF Export] Rate limit check error:', err);
        return NextResponse.json(
          { error: 'Service temporarily unavailable', code: 'SERVICE_ERROR' },
          { status: 503, headers: { 'Retry-After': '30' } },
        );
      }

      // Fetch report with all necessary fields
      const { data: report, error } = await client
        .from('sparlo_reports')
        .select('id, title, report_data, created_at, updated_at')
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

      const typedReport = report as ReportRow;

      // Check if this is a hybrid report with data
      const reportData = typedReport.report_data?.report;
      if (!reportData) {
        return NextResponse.json(
          {
            error: 'Report data not available for PDF generation',
            code: 'NO_DATA',
          },
          { status: 400 },
        );
      }

      // Get brief from report data if available
      const brief = reportData.brief;

      // Render report to HTML
      const html = renderReportToHtml({
        reportData,
        title: typedReport.title,
        brief,
        createdAt: typedReport.created_at,
      });

      // Generate PDF with timeout
      const pdfBuffer = await Promise.race([
        generatePdfFromHtml(html),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('PDF generation timeout')),
            PDF_GENERATION_TIMEOUT_MS,
          ),
        ),
      ]);

      // Sanitize filename
      const filename =
        typedReport.title
          .replace(/[^a-z0-9]/gi, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .toLowerCase()
          .substring(0, 50) || 'report';

      // Generate ETag for cache validation
      const updatedAt = typedReport.updated_at || typedReport.created_at;
      const eTag = `"${typedReport.id}-${new Date(updatedAt).getTime()}"`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
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
    } finally {
      // Always release the slot when done
      releaseSlot();
    }
  },
  { auth: true },
);
