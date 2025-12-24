'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

const GenerateShareLinkSchema = z.object({
  reportId: z.string().uuid(),
});

const RevokeShareLinkSchema = z.object({
  reportId: z.string().uuid(),
});

const GetShareInfoSchema = z.object({
  reportId: z.string().uuid(),
});

export const generateShareLink = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();

    // Verify ownership via RLS (will fail if not owner)
    const { data: report, error: reportError } = await client
      .from('sparlo_reports')
      .select('id')
      .eq('id', data.reportId)
      .single();

    if (reportError || !report) {
      throw new Error('Report not found or access denied');
    }

    // Get current user for audit
    const {
      data: { user },
    } = await client.auth.getUser();

    // Atomic upsert: insert or return existing (prevents race condition)
    // expires_at is required (NOT NULL) per migration 20251223114425
    const thirtyDaysFromNow = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: share, error: shareError } = await client
      .from('report_shares')
      .upsert(
        {
          report_id: data.reportId,
          created_by: user?.id,
          expires_at: thirtyDaysFromNow,
        },
        {
          onConflict: 'report_id',
          ignoreDuplicates: false,
        },
      )
      .select('share_token')
      .single();

    if (shareError) {
      console.error('[Share Link] Database error:', {
        code: shareError.code,
        message: shareError.message,
        details: shareError.details,
        hint: shareError.hint,
      });

      // Map database errors to user-friendly messages
      if (shareError.code === '23503') {
        throw new Error('Report not found');
      } else if (shareError.code === '42501') {
        throw new Error('You do not have permission to share this report');
      } else if (shareError.code === '42703') {
        // Column does not exist - migration not applied
        throw new Error(
          'Database schema is out of date. Please contact support.',
        );
      } else if (shareError.code === '23505') {
        // Unique violation - should be handled by upsert but just in case
        throw new Error('A share link already exists for this report.');
      }
      throw new Error('Failed to create share link. Please try again.');
    }

    if (!share) {
      throw new Error('Share link was not created. Please try again.');
    }

    return {
      success: true as const,
      shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/share/${share.share_token}`,
    };
  },
  { schema: GenerateShareLinkSchema },
);

export const revokeShareLink = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();

    // RLS ensures only owners can delete
    // Note: After migration, this will use soft delete (revoked_at)
    const { error } = await client
      .from('report_shares')
      .delete()
      .eq('report_id', data.reportId);

    if (error) {
      throw new Error('Failed to revoke share link');
    }

    return { success: true as const };
  },
  { schema: RevokeShareLinkSchema },
);

export const getShareInfo = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();

    // Note: access_count, last_accessed_at, revoked_at available after migration
    const { data: share, error } = await client
      .from('report_shares')
      .select('share_token, created_at')
      .eq('report_id', data.reportId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error('Failed to fetch share info');
    }

    if (!share) {
      return { shared: false as const };
    }

    return {
      shared: true as const,
      shareToken: share.share_token,
      shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/share/${share.share_token}`,
      createdAt: share.created_at,
    };
  },
  { schema: GetShareInfoSchema },
);
