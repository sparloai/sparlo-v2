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

const StartHybridReportSchema = z.object({
  designChallenge: z
    .string()
    .min(50, 'Please provide at least 50 characters')
    .max(10000, 'Design challenge must be under 10,000 characters'),
  attachments: z.array(AttachmentSchema).max(5).optional(),
});

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REPORTS_PER_WINDOW = 10; // Testing limit
const DAILY_LIMIT = 50; // Testing limit

// Image magic bytes for validation
const IMAGE_SIGNATURES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
};

/**
 * Validate base64 image content matches declared MIME type
 */
function validateBase64Image(
  data: string,
  mediaType: string,
): { valid: boolean; error?: string } {
  // Validate base64 format
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(data)) {
    return { valid: false, error: 'Invalid base64 format' };
  }

  // Check decoded size (base64 is ~33% larger than original)
  const estimatedSize = (data.length * 3) / 4;
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (estimatedSize > MAX_SIZE) {
    return { valid: false, error: 'Image exceeds 10MB limit' };
  }

  // Validate magic bytes for images (skip PDFs)
  if (mediaType.startsWith('image/')) {
    const signature = IMAGE_SIGNATURES[mediaType];
    if (signature) {
      try {
        const decoded = Buffer.from(data, 'base64');
        const matches = signature.every((byte, i) => decoded[i] === byte);
        if (!matches) {
          return {
            valid: false,
            error: 'File content does not match declared type',
          };
        }
      } catch {
        return { valid: false, error: 'Failed to decode base64 data' };
      }
    }
  }

  return { valid: true };
}

/**
 * Sanitize user input to prevent prompt injection
 */
function sanitizePromptInput(input: string): string {
  return (
    input
      // Remove control characters
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
      // Remove special tokens that might confuse the model
      .replace(/<\|endoftext\|>/gi, '')
      .replace(/<\|im_start\|>/gi, '')
      .replace(/<\|im_end\|>/gi, '')
      .trim()
  );
}

/**
 * POST /api/hybrid/reports
 *
 * Start a new hybrid report generation.
 * Agent-native endpoint for programmatic access to Hybrid Mode.
 *
 * Hybrid Mode (Full-Spectrum Analysis):
 * - SEARCHES the full solution spectrum (simple to paradigm-shifting)
 * - EVALUATES on MERIT, not novelty
 * - HUNTS in expanded territories (biology, geology, abandoned tech, etc.)
 * - DOCUMENTS prior art evidence
 * - INCLUDES honest self-critique
 */
export const POST = enhanceRouteHandler(
  async ({ body, user }) => {
    const client = getSupabaseServerClient();

    // Sanitize user input to prevent prompt injection
    const sanitizedChallenge = sanitizePromptInput(body.designChallenge);
    if (sanitizedChallenge.length < 50) {
      return NextResponse.json(
        { error: 'Design challenge too short after sanitization' },
        { status: 400 },
      );
    }

    // Validate attachments if present
    if (body.attachments && body.attachments.length > 0) {
      for (const attachment of body.attachments) {
        const validation = validateBase64Image(
          attachment.data,
          attachment.media_type,
        );
        if (!validation.valid) {
          return NextResponse.json(
            { error: `Invalid attachment: ${validation.error}` },
            { status: 400 },
          );
        }
      }
    }

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

    // Create the report record with hybrid mode flag
    const { data: report, error: dbError } = await client
      .from('sparlo_reports')
      .insert({
        account_id: user.id,
        conversation_id: conversationId,
        title: `[Hybrid] ${sanitizedChallenge.slice(0, 90)}`,
        status: 'processing',
        current_step: 'an0-m',
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: sanitizedChallenge,
            timestamp: new Date().toISOString(),
          },
        ],
        report_data: {
          mode: 'hybrid',
          started_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Hybrid API] Failed to create report:', dbError);
      return NextResponse.json(
        { error: 'Failed to create report. Please try again.' },
        { status: 500 },
      );
    }

    // Trigger Hybrid Inngest function
    try {
      console.log('[Hybrid API] Sending Inngest event for report:', report.id);

      await inngest.send({
        name: 'report/generate-hybrid',
        data: {
          reportId: report.id,
          accountId: user.id,
          userId: user.id,
          designChallenge: sanitizedChallenge,
          conversationId,
          attachments: body.attachments,
        },
      });
    } catch (inngestError) {
      console.error('[Hybrid API] Failed to trigger Inngest:', inngestError);
      await client
        .from('sparlo_reports')
        .update({
          status: 'error',
          last_message: 'Failed to start hybrid report generation',
        })
        .eq('id', report.id);
      return NextResponse.json(
        { error: 'Failed to start report generation. Please try again.' },
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
    schema: StartHybridReportSchema,
  },
);
