import 'server-only';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import {
  ChatHistoryDBSchema,
  type ChatMessage,
  transformDBToClient,
} from '../schemas/chat.schema';

export async function loadChatHistory(
  reportId: string,
): Promise<ChatMessage[]> {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select('chat_history')
    .eq('id', reportId)
    .single();

  if (error) {
    console.error('[loadChatHistory] Database error:', error);
    return [];
  }

  // Validate the database data with Zod
  const validation = ChatHistoryDBSchema.safeParse(data?.chat_history);

  if (!validation.success) {
    console.error(
      '[loadChatHistory] Invalid chat history format:',
      validation.error,
    );
    return [];
  }

  return transformDBToClient(validation.data);
}
