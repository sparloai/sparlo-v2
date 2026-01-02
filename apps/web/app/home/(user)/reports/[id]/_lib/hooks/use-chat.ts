'use client';

import { useCallback, useRef, useState } from 'react';

import type { ChatMessage } from '../schemas/chat.schema';

interface UseChatOptions {
  reportId: string;
  initialMessages?: ChatMessage[];
}

interface UseChatReturn {
  messages: ChatMessage[];
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  /** Submit a message. If messageOverride is provided, submits that instead of input state. */
  submitMessage: (messageOverride?: string) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => void;
  cancelStream: () => void;
}

export function useChat({
  reportId,
  initialMessages = [],
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages((prev) =>
      prev.map((msg) =>
        msg.isStreaming ? { ...msg, isStreaming: false, cancelled: true } : msg,
      ),
    );
    setIsLoading(false);
  }, []);

  const submitMessage = useCallback(async (messageOverride?: string) => {
    const messageToSend = messageOverride ?? input;
    if (!messageToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend.trim(),
    };

    const savedInput = messageToSend.trim();
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', isStreaming: true },
    ]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/sparlo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          message: savedInput,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter
            ? `Please wait ${Math.ceil(parseInt(retryAfter) / 60)} minutes.`
            : 'Please wait a few minutes.';
          throw new Error(`Rate limit exceeded. ${waitTime}`);
        }
        throw new Error(
          errorData.error || `Failed to get response (${response.status})`,
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (!reader) {
        throw new Error('No response body');
      }

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(data);
            // API sends { text } for streaming chunks, { done, saved } for completion
            if (parsed.text) {
              assistantContent += parsed.text;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, content: assistantContent }
                    : msg,
                ),
              );
            } else if (parsed.done) {
              streamDone = true;
              break;
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId ? { ...msg, isStreaming: false } : msg,
        ),
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error('Chat error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  msg.content ||
                  (error instanceof Error
                    ? error.message
                    : 'Sorry, I encountered an error. Please try again.'),
                isStreaming: false,
                error:
                  error instanceof Error ? error.message : 'An error occurred',
              }
            : msg,
        ),
      );
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, [input, isLoading, reportId]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void submitMessage();
    },
    [submitMessage],
  );

  return {
    messages,
    input,
    setInput,
    isLoading,
    submitMessage,
    handleSubmit,
    cancelStream,
  };
}
