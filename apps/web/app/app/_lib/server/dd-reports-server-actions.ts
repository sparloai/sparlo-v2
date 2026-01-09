'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { inngest } from '~/lib/inngest/client';
import { USAGE_CONSTANTS } from '~/lib/usage/constants';

import { checkUsageAllowed } from './usage.service';

// Attachment schema for vision support (images and PDFs)
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

// Schema for starting a DD report with Inngest
const StartDDReportSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  startupMaterials: z
    .string()
    .min(100, 'Please provide at least 100 characters of startup materials')
    .max(50000, 'Startup materials must be under 50,000 characters'),
  vcNotes: z
    .string()
    .max(10000, 'VC notes must be under 10,000 characters')
    .optional(),
  attachments: z.array(AttachmentSchema).max(5).optional(),
});

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REPORTS_PER_WINDOW = 50; // DD reports are more expensive
const DAILY_LIMIT = 100;

// Super admin bypass for testing (comma-separated user IDs)
const SUPER_ADMIN_USER_IDS = (process.env.SUPER_ADMIN_USER_IDS ?? '')
  .split(',')
  .filter(Boolean);

function isSuperAdmin(userId: string): boolean {
  const isAdmin = SUPER_ADMIN_USER_IDS.includes(userId);
  console.log(
    `[Super Admin Check] userId=${userId}, adminIds=${JSON.stringify(SUPER_ADMIN_USER_IDS)}, isAdmin=${isAdmin}`,
  );
  return isAdmin;
}

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
    return { valid: false, error: 'File exceeds 10MB limit' };
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
 * Start a new DD (Due Diligence) report generation using Inngest durable workflow
 *
 * DD Mode evaluates startup technical claims using first-principles analysis:
 * - Extracts claims from pitch materials
 * - Maps the full solution space for the stated problem
 * - Validates claims against physics and prior art
 * - Assesses moat strength and defensibility
 * - Generates an investor-facing DD report
 */
export const startDDReportGeneration = enhanceAction(
  async (data, user) => {
    const client = getSupabaseServerClient();

    // Sanitize user inputs
    const sanitizedMaterials = sanitizePromptInput(data.startupMaterials);
    const sanitizedVcNotes = data.vcNotes
      ? sanitizePromptInput(data.vcNotes)
      : undefined;
    const sanitizedCompanyName = sanitizePromptInput(data.companyName);

    if (sanitizedMaterials.length < 100) {
      throw new Error('Startup materials too short after sanitization');
    }

    // Validate attachments if present
    if (data.attachments && data.attachments.length > 0) {
      for (const attachment of data.attachments) {
        const validation = validateBase64Image(
          attachment.data,
          attachment.media_type,
        );
        if (!validation.valid) {
          throw new Error(`Invalid attachment: ${validation.error}`);
        }
      }
    }

    // Super admin bypass - skip all usage and rate limits
    const superAdmin = isSuperAdmin(user.id);

    if (!superAdmin) {
      // DD reports use more tokens, so we estimate higher usage
      const estimatedTokens = USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT * 1.5;

      // Check usage limits - pure token-based gating
      const usage = await checkUsageAllowed(user.id, estimatedTokens);

      if (!usage.allowed) {
        throw new Error(
          `You're out of credits. Upgrade your plan to continue.`,
        );
      }

      if (usage.isWarning) {
        console.log(
          `[Usage Warning] User ${user.id} at ${usage.percentage.toFixed(0)}% usage`,
        );
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
        throw new Error(
          'Rate limit exceeded. Please wait 5 minutes between reports.',
        );
      }

      if (dailyResult.count && dailyResult.count >= DAILY_LIMIT) {
        throw new Error(
          `Daily limit reached. You can create up to ${DAILY_LIMIT} reports per day.`,
        );
      }
    } else {
      console.log(
        `[Super Admin] Bypassing usage/rate limits for user ${user.id}`,
      );
    }

    const conversationId = `dd-${crypto.randomUUID()}`;

    // Create the report record with DD mode flag
    const { data: report, error: dbError } = await client
      .from('sparlo_reports')
      .insert({
        account_id: user.id,
        conversation_id: conversationId,
        title: `DD: ${sanitizedCompanyName}`,
        status: 'processing',
        current_step: 'dd0-m',
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: `Due Diligence Analysis for ${sanitizedCompanyName}`,
            timestamp: new Date().toISOString(),
          },
        ],
        report_data: {
          mode: 'dd',
          company_name: sanitizedCompanyName,
          started_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to create DD report:', dbError);
      throw new Error('Failed to create DD report. Please try again.');
    }

    // Trigger DD Inngest function
    try {
      console.log('Sending Inngest event for DD report:', report.id);

      const sendResult = await inngest.send({
        name: 'report/generate-dd',
        data: {
          reportId: report.id,
          accountId: user.id,
          userId: user.id,
          companyName: sanitizedCompanyName,
          startupMaterials: sanitizedMaterials,
          vcNotes: sanitizedVcNotes,
          conversationId,
          attachments: data.attachments,
        },
      });

      console.log('Inngest DD event sent successfully:', {
        reportId: report.id,
        eventIds: sendResult.ids,
      });
    } catch (inngestError) {
      console.error('Failed to trigger DD Inngest:', inngestError);
      await client
        .from('sparlo_reports')
        .update({
          status: 'error',
          last_message: 'Failed to start DD report generation',
        })
        .eq('id', report.id);
      throw new Error('Failed to start DD report generation');
    }

    revalidatePath('/app');
    return { success: true, reportId: report.id, conversationId };
  },
  {
    schema: StartDDReportSchema,
    auth: true,
  },
);
