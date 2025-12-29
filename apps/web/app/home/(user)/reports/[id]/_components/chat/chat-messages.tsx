'use client';

import { useEffect, useRef } from 'react';

import { MessageSquare } from 'lucide-react';

import { ChatError } from './chat-error';
import { ChatMessage } from './chat-message';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  isStreaming?: boolean;
  cancelled?: boolean;
  error?: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isStreaming: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function ChatMessages({
  messages,
  isStreaming,
  error,
  onRetry,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  // Track if user has scrolled up
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Consider "near bottom" if within 100px of the bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      userScrolledRef.current = !isNearBottom;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll on new messages (unless user scrolled up)
  useEffect(() => {
    if (!userScrolledRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isStreaming]);

  return (
    <div
      ref={containerRef}
      className="flex-1 space-y-4 overflow-y-auto p-5"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800">
            <MessageSquare className="h-7 w-7 text-gray-400 dark:text-neutral-500" />
          </div>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            Ask anything about this report
          </p>
          <p className="mt-2 max-w-[280px] text-sm text-gray-500 dark:text-neutral-400">
            Get clarification, explore alternatives, or dive deeper into
            specific concepts.
          </p>
        </div>
      ) : (
        messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            content={msg.content}
            role={msg.role}
            isStreaming={msg.isStreaming}
            cancelled={msg.cancelled}
            error={msg.error}
          />
        ))
      )}

      {error && <ChatError message={error} onRetry={onRetry} />}

      <div ref={bottomRef} />
    </div>
  );
}
