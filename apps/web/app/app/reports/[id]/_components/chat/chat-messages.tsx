'use client';

import { useEffect, useRef } from 'react';

import { motion } from 'framer-motion';

import type { ChatMessage as ChatMessageType } from '../../_lib/schemas/chat.schema';
import { ChatError } from './chat-error';
import { ChatMessage } from './chat-message';

interface ChatMessagesProps {
  messages: ChatMessageType[];
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
      className="flex-1 space-y-4 overflow-y-auto px-5 py-6"
      role="log"
      aria-live="polite"
      aria-label="Conversation"
    >
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center px-4 text-center">
          <p
            className="text-[13px] text-zinc-400"
            style={{ fontFamily: 'var(--font-heading), system-ui, sans-serif' }}
          >
            Ask a question to explore this report further.
          </p>
        </div>
      ) : (
        messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChatMessage
              content={msg.content}
              role={msg.role}
              isStreaming={msg.isStreaming}
              cancelled={msg.cancelled}
              error={msg.error}
            />
          </motion.div>
        ))
      )}

      {error && <ChatError message={error} onRetry={onRetry} />}

      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
