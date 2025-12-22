import { NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * GET /api/reports/[id]/share
 * Get share info for a report (if shared)
 */
export const GET = enhanceRouteHandler(
  async function ({ params }) {
    const { id } = params as { id: string };

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID required', code: 'MISSING_ID' },
        { status: 400 },
      );
    }

    const client = getSupabaseServerClient();

    // RLS ensures only owners can view share info
    // Note: access_count, last_accessed_at, revoked_at available after migration
    const { data: share, error } = await client
      .from('report_shares')
      .select('share_token, created_at')
      .eq('report_id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Share API] Error fetching share:', error);
      return NextResponse.json(
        { error: 'Failed to fetch share info', code: 'FETCH_ERROR' },
        { status: 500 },
      );
    }

    if (!share) {
      return NextResponse.json({ shared: false });
    }

    return NextResponse.json({
      shared: true,
      shareToken: share.share_token,
      shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/share/${share.share_token}`,
      createdAt: share.created_at,
    });
  },
  { auth: true },
);

/**
 * POST /api/reports/[id]/share
 * Create a share link for a report (or return existing)
 */
export const POST = enhanceRouteHandler(
  async function ({ params }) {
    const { id } = params as { id: string };

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID required', code: 'MISSING_ID' },
        { status: 400 },
      );
    }

    const client = getSupabaseServerClient();

    // Verify ownership via RLS (will fail if not owner)
    const { data: report, error: reportError } = await client
      .from('sparlo_reports')
      .select('id')
      .eq('id', id)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    // Get current user for audit
    const {
      data: { user },
    } = await client.auth.getUser();

    // Atomic upsert: insert or return existing (prevents race condition)
    const { data: share, error: shareError } = await client
      .from('report_shares')
      .upsert(
        {
          report_id: id,
          created_by: user?.id,
        },
        {
          onConflict: 'report_id',
          ignoreDuplicates: false,
        },
      )
      .select('share_token, created_at')
      .single();

    if (shareError || !share) {
      console.error('[Share API] Error creating share:', shareError);
      return NextResponse.json(
        { error: 'Failed to create share link', code: 'CREATE_ERROR' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      shareToken: share.share_token,
      shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/share/${share.share_token}`,
      createdAt: share.created_at,
    });
  },
  { auth: true },
);

/**
 * DELETE /api/reports/[id]/share
 * Revoke a share link for a report (hard delete for now, soft delete after migration)
 */
export const DELETE = enhanceRouteHandler(
  async function ({ params }) {
    const { id } = params as { id: string };

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID required', code: 'MISSING_ID' },
        { status: 400 },
      );
    }

    const client = getSupabaseServerClient();

    // RLS ensures only owners can delete
    // Note: After migration, this will use soft delete (revoked_at)
    const { error } = await client
      .from('report_shares')
      .delete()
      .eq('report_id', id);

    if (error) {
      console.error('[Share API] Error revoking share:', error);
      return NextResponse.json(
        { error: 'Failed to revoke share link', code: 'REVOKE_ERROR' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  },
  { auth: true },
);
