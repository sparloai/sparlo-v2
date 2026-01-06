import { z } from 'zod';

// Database schema (matches JSONB storage in sparlo_reports.chat_history)
export const ChatMessageDBSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const ChatHistoryDBSchema = z.array(ChatMessageDBSchema);

export type ChatMessageDB = z.infer<typeof ChatMessageDBSchema>;

// Client-side type (includes runtime state)
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  cancelled?: boolean;
  error?: string;
}

// Transform DB format to Client format
export function transformDBToClient(
  messages: ChatMessageDB[],
  baseTimestamp = Date.now(),
): ChatMessage[] {
  return messages.map((msg, index) => ({
    id: `history-${index}-${baseTimestamp}`,
    role: msg.role,
    content: msg.content,
    isStreaming: false,
  }));
}
