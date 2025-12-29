'use client';

import { memo } from 'react';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

import { cn } from '@kit/ui/utils';

import { CodeBlock } from '../shared';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  isStreaming?: boolean;
  cancelled?: boolean;
  error?: string;
}

// Markdown components with SuisseIntl typography
const MARKDOWN_COMPONENTS = {
  code: CodeBlock,
  p: ({ children }: { children?: React.ReactNode }) => (
    <p
      className="mb-3 text-[13px] leading-[1.7] last:mb-0"
      style={{
        color: '#c8d4e6',
        fontFamily: 'var(--font-heading), system-ui, sans-serif',
      }}
    >
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-3 ml-4 list-none space-y-2 text-[13px] last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol
      className="mb-3 ml-4 list-decimal space-y-2 text-[13px] last:mb-0"
      style={{
        color: '#c8d4e6',
        fontFamily: 'var(--font-heading), system-ui, sans-serif',
      }}
    >
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li
      className="relative pl-4 text-[13px]"
      style={{
        color: '#c8d4e6',
        fontFamily: 'var(--font-heading), system-ui, sans-serif',
      }}
    >
      <span
        className="absolute top-[0.55em] left-0 h-1 w-1 rounded-full"
        style={{ background: '#64b5f6' }}
      />
      {children}
    </li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong
      className="font-medium"
      style={{
        color: '#f0f4f8',
        fontFamily: 'var(--font-heading), system-ui, sans-serif',
      }}
    >
      {children}
    </strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em style={{ color: '#8b9dc3' }}>{children}</em>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote
      className="my-3 border-l-2 py-1 pl-4 text-[13px] italic"
      style={{
        borderColor: 'rgba(100, 181, 246, 0.4)',
        color: '#8b9dc3',
        fontFamily: 'var(--font-heading), system-ui, sans-serif',
      }}
    >
      {children}
    </blockquote>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1
      className="mb-3 text-base font-medium tracking-[-0.01em]"
      style={{
        color: '#f0f4f8',
        fontFamily: 'var(--font-heading), system-ui, sans-serif',
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2
      className="mb-2 text-sm font-medium tracking-[-0.01em]"
      style={{
        color: '#f0f4f8',
        fontFamily: 'var(--font-heading), system-ui, sans-serif',
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3
      className="mb-2 text-[13px] font-medium"
      style={{
        color: '#c8d4e6',
        fontFamily: 'var(--font-heading), system-ui, sans-serif',
      }}
    >
      {children}
    </h3>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a
      href={href}
      className="underline decoration-1 underline-offset-2 transition-colors hover:no-underline"
      style={{ color: '#64b5f6' }}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
} as const;

// Streaming cursor
function StreamingCursor() {
  return (
    <motion.span
      className="ml-0.5 inline-block h-[14px] w-[2px] rounded-full"
      style={{ background: '#64b5f6' }}
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export const ChatMessage = memo(function ChatMessage({
  content,
  role,
  isStreaming,
  cancelled,
  error,
}: ChatMessageProps) {
  // User message
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="relative max-w-[85%] rounded-2xl rounded-br-md px-4 py-3"
          style={{
            background:
              'linear-gradient(135deg, rgba(30, 58, 95, 0.9) 0%, rgba(21, 42, 69, 0.95) 100%)',
            border: '1px solid rgba(100, 181, 246, 0.2)',
            boxShadow:
              '0 4px 24px -4px rgba(100, 181, 246, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
          }}
        >
          <p
            className="text-[13px] leading-relaxed whitespace-pre-wrap"
            style={{
              color: '#e8f0f8',
              fontFamily: 'var(--font-heading), system-ui, sans-serif',
            }}
          >
            {content}
          </p>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start">
      <div
        className={cn(
          'relative max-w-[95%] rounded-2xl rounded-bl-md px-4 py-3',
        )}
        style={{
          background: cancelled
            ? 'rgba(21, 27, 38, 0.5)'
            : 'rgba(21, 27, 38, 0.8)',
          border: error
            ? '1px solid rgba(239, 68, 68, 0.3)'
            : '1px solid rgba(255, 255, 255, 0.04)',
          opacity: cancelled ? 0.7 : 1,
        }}
      >
        {/* Subtle top highlight */}
        <div
          className="pointer-events-none absolute inset-x-4 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.06) 50%, transparent 100%)',
          }}
        />

        {/* Content */}
        <div className="relative">
          <ReactMarkdown
            rehypePlugins={[rehypeSanitize]}
            components={MARKDOWN_COMPONENTS}
          >
            {content}
          </ReactMarkdown>

          {isStreaming && <StreamingCursor />}
        </div>

        {/* Cancelled indicator */}
        {cancelled && (
          <div
            className="mt-2 flex items-center gap-1.5 text-[11px]"
            style={{
              color: '#5a6b8c',
              fontFamily: 'var(--font-heading), system-ui, sans-serif',
            }}
          >
            <span
              className="h-1 w-1 rounded-full"
              style={{ background: '#5a6b8c' }}
            />
            <span className="italic">Response interrupted</span>
          </div>
        )}

        {/* Error indicator */}
        {error && (
          <div
            className="mt-2 flex items-center gap-1.5 text-[11px]"
            style={{
              color: '#ef4444',
              fontFamily: 'var(--font-heading), system-ui, sans-serif',
            }}
          >
            <span
              className="h-1 w-1 rounded-full"
              style={{ background: '#ef4444' }}
            />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
});
