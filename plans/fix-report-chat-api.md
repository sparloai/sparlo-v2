# fix: Report Chat API - Replace Python Backend with Direct Anthropic SDK

## Problem

Chat fails with "Sorry, I encountered an error" because the API calls a non-existent Python backend:

```
[Sparlo API] Calling: http://localhost:8000/api/chat
[Sparlo API] SPARLO_BACKEND_HOST: undefined
[Sparlo API] Error: ECONNREFUSED
```

## Solution

Replace `callSparloApi()` with direct Anthropic SDK call in the route. One file, ~80 lines.

## Implementation

### Rewrite `/api/sparlo/chat/route.ts`

```typescript
'use server';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';

import { MODELS } from '~/lib/llm/client';

// Validation schema
const ChatRequestSchema = z.object({
  reportId: z.string().uuid(),
  message: z.string().min(1).max(4000),
});

// Message schema for type safety
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});
const ChatHistorySchema = z.array(ChatMessageSchema);

type ChatMessage = z.infer<typeof ChatMessageSchema>;

const SYSTEM_PROMPT = `You are an expert AI assistant helping users understand their Sparlo innovation report.
Reference specific findings by name when relevant. Be precise and constructive.
The user may return days, weeks, or months later - maintain full context from the chat history.`;

export const POST = enhanceRouteHandler(
  async function POST({ request }) {
    const body = await request.json();
    const { reportId, message } = ChatRequestSchema.parse(body);

    const client = getSupabaseServerClient();

    // Load report + history (RLS handles authorization)
    const { data: report, error } = await client
      .from('sparlo_reports')
      .select('id, status, report_data, chat_history')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      return Response.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    if (report.status !== 'complete') {
      return Response.json(
        { error: 'Report is still being generated. Please wait.' },
        { status: 400 }
      );
    }

    // Parse history with validation (graceful fallback to empty)
    const history = ChatHistorySchema.safeParse(report.chat_history);
    const chatHistory: ChatMessage[] = history.success ? history.data : [];

    // Use the markdown report as context (already contains synthesized AN0-AN5)
    const reportContext = report.report_data?.markdown || '';

    // Build messages for Anthropic
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const messages = [
      ...chatHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Stream response from Claude Opus 4.5
    const stream = await anthropic.messages.stream({
      model: MODELS.OPUS,
      max_tokens: 4096,
      system: `${SYSTEM_PROMPT}\n\n## Report Context\n\n${reportContext}`,
      messages,
    });

    const encoder = new TextEncoder();
    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          stream.on('text', (text) => {
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          });

          stream.on('error', (error) => {
            console.error('[Chat] Stream error:', error);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: 'AI service error' })}\n\n`)
            );
          });

          await stream.finalMessage();

          // Save updated chat history
          const updatedHistory = [
            ...chatHistory,
            { role: 'user' as const, content: message },
            { role: 'assistant' as const, content: fullResponse },
          ];

          const { error: saveError } = await client
            .from('sparlo_reports')
            .update({ chat_history: updatedHistory })
            .eq('id', reportId);

          if (saveError) {
            console.error('[Chat] Failed to save history:', saveError);
            // Don't fail the response if save fails - user got their answer
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('[Chat] Fatal error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  },
  { auth: true }
);
```

### Update Frontend `report-display.tsx`

Update the chat submission function to use streaming:

```typescript
const sendChatMessage = async () => {
  if (!chatInput.trim() || isSending) return;

  setIsSending(true);
  const userMessage = chatInput.trim();

  // Optimistically add user message
  setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
  setChatInput('');

  try {
    const response = await fetch('/api/sparlo/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId: report.id,
        message: userMessage,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let assistantContent = '';

    // Add placeholder for streaming response
    setChatHistory(prev => [...prev, { role: 'assistant', content: '' }]);

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantContent += parsed.text;
              setChatHistory(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantContent,
                };
                return updated;
              });
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    console.error('Chat error:', error);
    // Remove optimistic messages on error
    setChatHistory(prev => prev.slice(0, -2));
    toast.error(error instanceof Error ? error.message : 'Failed to send message');
  } finally {
    setIsSending(false);
  }
};
```

### Files to Change

| File | Action | Lines |
|------|--------|-------|
| `apps/web/app/api/sparlo/chat/route.ts` | Rewrite | ~80 |
| `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx` | Update chat function | ~50 |

### Files to Remove

- `apps/web/lib/server/sparlo-api-client.ts` - Delete (calls non-existent Python backend)

### Environment Variables to Remove

- `SPARLO_BACKEND_HOST` - Not needed
- `SPARLO_BACKEND_PORT` - Not needed
- `SPARLO_API_URL` - Not needed

## Key Design Decisions

### Why Use Anthropic SDK Directly (Not `callClaude`)

The existing `callClaude` helper expects a single `userMessage` string, not a conversation history. Rather than modifying shared infrastructure, we use the Anthropic SDK directly for multi-turn conversations.

### Why Use `report_data.markdown` as Context

The markdown report already contains synthesized insights from AN0-AN5. No need to rebuild context from chainState fields - the final report has everything the user needs to discuss.

### Why Streaming

Better UX for potentially long AI responses. The user sees text appear progressively instead of waiting for the full response.

### Why Store History as `[{role, content}]`

Simple, direct Anthropic format. No unnecessary metadata. Easy to validate with Zod. Can add timestamps later if design requires.

### Token Limit Handling

Claude Opus 4.5 has 200K context. Report markdown is ~10K tokens, 20 messages ~5K tokens, response ~4K tokens. We have ~180K headroom. If limits are ever hit (unlikely), add truncation then.

## Acceptance Criteria

- [ ] Chat works for completed reports
- [ ] Streaming responses display progressively
- [ ] Chat history persists across page refreshes
- [ ] Returning users see previous conversation
- [ ] Proper error messages for: not found, not complete, API errors
- [ ] RLS prevents access to others' reports

## Testing

1. Send message to completed report → response streams back
2. Refresh page → history persists
3. Return after days/weeks → can continue conversation
4. Try to chat with in-progress report → "still generating" error
5. Try to access someone else's report → 404 (RLS)

## References

- LLM Models: `apps/web/lib/llm/client.ts:24-27`
- Pattern Reference: `apps/web/lib/inngest/functions/generate-report.ts` (direct Anthropic usage)
- Chat History Column: `apps/web/supabase/migrations/20251215000000_add_chat_history.sql`
