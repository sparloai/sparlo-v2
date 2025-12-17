import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

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
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.status !== 'complete') {
      return Response.json(
        { error: 'Report is still being generated. Please wait.' },
        { status: 400 },
      );
    }

    // Parse history with validation (graceful fallback to empty)
    const history = ChatHistorySchema.safeParse(report.chat_history);
    const chatHistory: ChatMessage[] = history.success ? history.data : [];

    // Use the markdown report as context (already contains synthesized AN0-AN5)
    const reportData = report.report_data as { markdown?: string } | null;
    const reportContext = reportData?.markdown || '';

    // Build messages for Anthropic
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
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
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            );
          });

          stream.on('error', (err) => {
            console.error('[Chat] Stream error:', err);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: 'AI service error' })}\n\n`,
              ),
            );
          });

          await stream.finalMessage();

          // Save updated chat history
          const updatedHistory: ChatMessage[] = [
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
        } catch (err) {
          console.error('[Chat] Fatal error:', err);
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  },
  { auth: true },
);
