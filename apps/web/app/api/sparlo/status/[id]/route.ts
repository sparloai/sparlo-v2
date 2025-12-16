import { NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { callSparloApi } from '~/lib/server/sparlo-api-client';

interface StatusResponse {
  status: string;
  message?: string;
  report_id?: string;
  chain_state?: Record<string, unknown>;
}

export const GET = enhanceRouteHandler(
  async function GET({ params }) {
    const client = getSupabaseServerClient();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
      const data = await callSparloApi<StatusResponse>(`/api/status/${id}`, {
        method: 'GET',
      });

      return NextResponse.json(data);
    } catch (error) {
      const status =
        error instanceof Error && 'status' in error
          ? (error as { status: number }).status
          : 500;
      const message =
        error instanceof Error ? error.message : 'Failed to get status';
      return NextResponse.json({ error: message }, { status });
    }
  },
  {
    auth: true,
  },
);
