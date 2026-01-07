'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { inngest } from '~/lib/inngest/client';
import { USAGE_CONSTANTS } from '~/lib/usage/constants';

import { checkUsageAllowed, markFirstReportUsed } from './usage.service';

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

// Schema for starting a hybrid report with Inngest
const StartHybridReportSchema = z.object({
  designChallenge: z
    .string()
    .min(50, 'Please provide at least 50 characters')
    .max(10000, 'Design challenge must be under 10,000 characters'),
  attachments: z.array(AttachmentSchema).max(5).optional(),
});

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REPORTS_PER_WINDOW = 100; // Increased for testing
const DAILY_LIMIT = 500; // Increased for testing

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
 * Start a new hybrid report generation using Inngest durable workflow
 *
 * Hybrid Mode (Full-Spectrum Analysis):
 * - SEARCHES the full solution spectrum (simple to paradigm-shifting)
 * - EVALUATES on MERIT, not novelty
 * - HUNTS in expanded territories (biology, geology, abandoned tech, etc.)
 * - DOCUMENTS prior art evidence
 * - INCLUDES honest self-critique
 *
 * Philosophy: The best solution wins regardless of origin.
 */
export const startHybridReportGeneration = enhanceAction(
  async (data, user) => {
    const client = getSupabaseServerClient();

    // Sanitize user input to prevent prompt injection
    const sanitizedChallenge = sanitizePromptInput(data.designChallenge);
    if (sanitizedChallenge.length < 50) {
      throw new Error('Design challenge too short after sanitization');
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
    let isFirstReport = false;

    if (!superAdmin) {
      // Check usage limits FIRST (freemium: first report free, then subscription required)
      const usage = await checkUsageAllowed(
        user.id,
        USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT,
      );

      if (!usage.allowed) {
        if (usage.reason === 'subscription_required') {
          throw new Error(
            'Your free report has been used. Please subscribe to generate more reports.',
          );
        }
        if (usage.reason === 'limit_exceeded') {
          throw new Error(
            `Usage limit reached (${usage.percentage.toFixed(0)}% used). ` +
              `Upgrade your plan or wait until ${usage.periodEnd ? new Date(usage.periodEnd).toLocaleDateString() : 'next billing cycle'}.`,
          );
        }
      }

      if (usage.isWarning) {
        console.log(
          `[Usage Warning] User ${user.id} at ${usage.percentage.toFixed(0)}% usage`,
        );
      }

      // Track if this is the first report (for marking after success)
      isFirstReport = usage.isFirstReport;

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

    const conversationId = crypto.randomUUID();

    // Create the report record with hybrid mode flag
    const { data: report, error: dbError } = await client
      .from('sparlo_reports')
      .insert({
        account_id: user.id,
        conversation_id: conversationId,
        title: `${sanitizedChallenge.slice(0, 90)}`,
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
      console.error('Failed to create report:', dbError);
      throw new Error('Failed to create report. Please try again.');
    }

    // Trigger Hybrid Inngest function
    try {
      console.log('Sending Inngest event for report:', report.id);

      const sendResult = await inngest.send({
        name: 'report/generate-hybrid',
        data: {
          reportId: report.id,
          accountId: user.id,
          userId: user.id,
          designChallenge: sanitizedChallenge,
          conversationId,
          attachments: data.attachments,
        },
      });

      console.log('Inngest event sent successfully:', {
        reportId: report.id,
        eventIds: sendResult.ids,
      });

      // Mark first report as used (after successful creation)
      if (isFirstReport) {
        try {
          await markFirstReportUsed(user.id);
          console.log('Marked first report as used for user:', user.id);
        } catch (markError) {
          // Log but don't fail - report is already created
          console.error('Failed to mark first report used:', markError);
        }
      }
    } catch (inngestError) {
      console.error('Failed to trigger Inngest:', inngestError);
      await client
        .from('sparlo_reports')
        .update({
          status: 'error',
          last_message: 'Failed to start hybrid report generation',
        })
        .eq('id', report.id);
      throw new Error('Failed to start hybrid report generation');
    }

    revalidatePath('/home');
    return { success: true, reportId: report.id, conversationId };
  },
  {
    schema: StartHybridReportSchema,
    auth: true,
  },
);

// Schema for answering clarification in hybrid mode
const AnswerHybridClarificationSchema = z.object({
  reportId: z.string().uuid(),
  answer: z
    .string()
    .min(1, 'Please provide an answer')
    .max(5000, 'Answer must be under 5,000 characters'),
});

/**
 * Answer a clarification question in hybrid mode and resume the Inngest workflow
 */
export const answerHybridClarification = enhanceAction(
  async (data, user) => {
    const client = getSupabaseServerClient();

    // Verify ownership
    const { data: report, error: fetchError } = await client
      .from('sparlo_reports')
      .select('id, status, clarifications, account_id')
      .eq('id', data.reportId)
      .eq('account_id', user.id)
      .single();

    if (fetchError || !report) {
      throw new Error(
        'Report not found or you do not have permission to modify it',
      );
    }

    if (report.status !== 'clarifying') {
      throw new Error('Report is not awaiting clarification');
    }

    // Update clarifications with answer
    const clarifications =
      (report.clarifications as Record<string, unknown>[]) ?? [];
    if (clarifications.length > 0) {
      const lastClarification = clarifications[clarifications.length - 1];
      if (lastClarification) {
        lastClarification.answer = data.answer;
        lastClarification.answeredAt = new Date().toISOString();
      }
    }

    // Update report status
    const { error: updateError } = await client
      .from('sparlo_reports')
      .update({
        status: 'processing',
        clarifications: JSON.parse(JSON.stringify(clarifications)),
      })
      .eq('id', data.reportId);

    if (updateError) {
      console.error('Failed to update report:', updateError);
      throw new Error('Failed to update report. Please try again.');
    }

    // Resume Hybrid Inngest workflow
    try {
      await inngest.send({
        name: 'report/hybrid-clarification-answered',
        data: {
          reportId: data.reportId,
          answer: data.answer,
        },
      });
    } catch (inngestError) {
      console.error('Failed to resume hybrid workflow:', inngestError);
      throw new Error('Failed to continue hybrid report generation');
    }

    revalidatePath('/home');
    return { success: true };
  },
  {
    schema: AnswerHybridClarificationSchema,
    auth: true,
  },
);
