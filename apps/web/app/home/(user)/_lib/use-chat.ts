'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { updateReport } from './server/sparlo-reports-server-actions';

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface UseChatOptions {
  reportId: string | null;
  reportMarkdown: string | null;
  conversationTitle: string;
  initialMessages?: ChatMessage[];
  onCacheUpdate?: (
    reportId: string,
    chatHistory: Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>,
  ) => void;
}

interface UseChatReturn {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  input: string;
  setInput: (input: string) => void;
  messages: ChatMessage[];
  isLoading: boolean;
  endRef: React.RefObject<HTMLDivElement | null>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Custom hook for managing chat functionality in the report view.
 * Handles streaming responses, message history, persistence, and input state.
 */
export function useChat({
  reportId,
  reportMarkdown,
  conversationTitle,
  initialMessages = [],
  onCacheUpdate,
}: UseChatOptions): UseChatReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Constants for size limits (P2 security fix)
  const MAX_MESSAGES = 100;
  const MAX_CONTENT_LENGTH = 10000;
  const DEBOUNCE_MS = 1000;

  // Reset messages when report changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [reportId]); // Only depend on reportId to prevent unnecessary resets

  // Persist messages with debounce (P1 race condition fix + P2 debounce fix)
  useEffect(() => {
    // Early exit: check streaming BEFORE expensive operations
    if (messages.some((m) => m.isStreaming)) return;
    if (!reportId || messages.length === 0) return;

    // Capture reportId in closure to prevent race condition on report switch
    const capturedReportId = reportId;

    const timer = setTimeout(() => {
      // Apply size limits before saving (P2 size limits fix)
      const trimmedMessages = messages.slice(-MAX_MESSAGES);
      const serialized = trimmedMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content.slice(0, MAX_CONTENT_LENGTH),
        timestamp:
          m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
      }));

      updateReport({
        id: capturedReportId, // Use captured value, not potentially stale ref
        chatHistory: serialized,
      })
        .then(() => {
          // Update local cache to prevent stale data on report switch (P2 fix)
          onCacheUpdate?.(capturedReportId, serialized);
        })
        .catch((err) =>
          console.error('[useChat] Failed to save chat history:', err),
        );
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [reportId, messages, onCacheUpdate]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: input.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      const assistantId = (Date.now() + 1).toString();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Only include full report context if this is the first message in a new session
        // (no previous messages from initial load or from current session)
        const isFirstMessage = messages.length === 0;
        const messageContent = isFirstMessage
          ? `You are an expert assistant helping a user understand and act on a Sparlo technical analysis report.

REPORT TITLE: ${conversationTitle || 'Technical Analysis Report'}

FULL REPORT CONTENT:
${reportMarkdown || 'No report content available'}

---

Based on the above report, please answer the following question from the user. Be specific and reference relevant sections of the report when applicable. If the question asks about recommendations, timelines, risks, or next steps, cite the specific information from the report.

USER QUESTION: ${input.trim()}`
          : input.trim();

        // Build headers with optional API key for authentication
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        const apiKey = process.env.NEXT_PUBLIC_SPARLO_INTERNAL_API_KEY;
        if (apiKey) {
          headers['X-API-Key'] = apiKey;
        }

        const response = await fetch('/api/sparlo/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            messages: [
              ...messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              { role: 'user', content: messageContent },
            ],
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullContent += parsed.content;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantId
                          ? { ...msg, content: fullContent, isStreaming: true }
                          : msg,
                      ),
                    );
                  }
                } catch {
                  // Skip non-JSON lines
                }
              }
            }
          }
        }

        // Mark streaming complete
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, isStreaming: false } : msg,
          ),
        );
      } catch {
        // On error, show error message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: 'Sorry, I encountered an error. Please try again.',
                  isStreaming: false,
                }
              : msg,
          ),
        );
      }

      setIsLoading(false);
    },
    [input, isLoading, messages, reportMarkdown, conversationTitle],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  return {
    isOpen,
    setIsOpen,
    input,
    setInput,
    messages,
    isLoading,
    endRef,
    handleSubmit,
    handleKeyDown,
  };
}
