'use client';

import { useEffect, useRef } from 'react';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

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
      className="chat-scrollbar flex-1 space-y-5 overflow-y-auto px-5 py-6"
      style={{ background: 'transparent' }}
      role="log"
      aria-live="polite"
      aria-label="Conversation"
    >
      {messages.length === 0 ? (
        <motion.div
          className="flex h-full flex-col items-center justify-center px-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Simple icon */}
          <motion.div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(100, 181, 246, 0.1) 0%, rgba(100, 181, 246, 0.05) 100%)',
              border: '1px solid rgba(100, 181, 246, 0.12)',
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          >
            <MessageCircle className="h-7 w-7" style={{ color: '#64b5f6' }} />
          </motion.div>

          <motion.h3
            className="mt-5 text-[15px] font-normal tracking-[-0.01em]"
            style={{
              color: '#f0f4f8',
              fontFamily: 'var(--font-heading), system-ui, sans-serif',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Ask anything about this report
          </motion.h3>

          <motion.p
            className="mt-2 max-w-[240px] text-[13px] leading-relaxed"
            style={{
              color: '#5a6b8c',
              fontFamily: 'var(--font-heading), system-ui, sans-serif',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Get clarification, explore alternatives, or dive deeper into the
            analysis.
          </motion.p>

          {/* Suggestion chips */}
          <motion.div
            className="mt-6 flex flex-wrap justify-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {['Summarize findings', 'What are the risks?', 'Next steps'].map(
              (suggestion, i) => (
                <span
                  key={i}
                  className="cursor-default rounded-full px-3 py-1.5 text-[11px] transition-all duration-200"
                  style={{
                    color: '#8b9dc3',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontFamily: 'var(--font-heading), system-ui, sans-serif',
                  }}
                >
                  {suggestion}
                </span>
              ),
            )}
          </motion.div>
        </motion.div>
      ) : (
        messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index === messages.length - 1 ? 0 : 0,
              ease: [0.16, 1, 0.3, 1],
            }}
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
