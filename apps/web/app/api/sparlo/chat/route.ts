import { NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { callSparloApi } from '~/lib/server/sparlo-api-client';

interface ChatRequestBody {
  message: string;
  conversation_id?: string;
  mode?: string;
  chain_state?: Record<string, unknown>;
}

interface ChatResponse {
  conversation_id: string;
  message?: string;
  status?: string;
  chain_state?: Record<string, unknown>;
}

export const POST = enhanceRouteHandler(
  async function POST({ request }) {
    const client = getSupabaseServerClient();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as ChatRequestBody;
    const { message, conversation_id, mode, chain_state } = body;

    // Build endpoint with mode query parameter if specified
    let endpoint = '/api/chat';
    if (mode === 'corpus') {
      endpoint += '?mode=corpus';
    }

    try {
      const data = await callSparloApi<ChatResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          message,
          conversation_id,
          chain_state,
        }),
      });

      return NextResponse.json(data);
    } catch (error) {
      const status =
        error instanceof Error && 'status' in error
          ? (error as { status: number }).status
          : 500;
      const message =
        error instanceof Error ? error.message : 'Failed to process chat';
      return NextResponse.json({ error: message }, { status });
    }
  },
  {
    auth: true,
  },
);
