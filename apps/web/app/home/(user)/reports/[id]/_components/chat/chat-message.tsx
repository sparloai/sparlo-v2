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

// Monochrome markdown components
const MARKDOWN_COMPONENTS = {
  code: CodeBlock,
  p: ({ children }: { children?: React.ReactNode }) => (
    <p
      className="mb-3 text-[13px] leading-[1.7] text-zinc-700 last:mb-0"
      style={{ fontFamily: 'var(--font-heading), system-ui, sans-serif' }}
    >
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-3 ml-4 list-disc space-y-1.5 text-[13px] text-zinc-700 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol
      className="mb-3 ml-4 list-decimal space-y-1.5 text-[13px] text-zinc-700 last:mb-0"
      style={{ fontFamily: 'var(--font-heading), system-ui, sans-serif' }}
    >
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li
      className="text-[13px] text-zinc-700"
      style={{ fontFamily: 'var(--font-heading), system-ui, sans-serif' }}
    >
      {children}
    </li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-medium text-zinc-900">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="text-zinc-600">{children}</em>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote
      className="my-3 border-l-2 border-zinc-300 py-1 pl-4 text-[13px] text-zinc-600 italic"
      style={{ fontFamily: 'var(--font-heading), system-ui, sans-serif' }}
    >
      {children}
    </blockquote>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1
      className="mb-3 text-base font-medium text-zinc-900"
      style={{ fontFamily: 'var(--font-heading), system-ui, sans-serif' }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2
      className="mb-2 text-sm font-medium text-zinc-900"
      style={{ fontFamily: 'var(--font-heading), system-ui, sans-serif' }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3
      className="mb-2 text-[13px] font-medium text-zinc-800"
      style={{ fontFamily: 'var(--font-heading), system-ui, sans-serif' }}
    >
      {children}
    </h3>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a
      href={href}
      className="text-zinc-900 underline decoration-zinc-400 underline-offset-2 transition-colors hover:decoration-zinc-600"
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
      className="ml-0.5 inline-block h-[14px] w-[2px] rounded-full bg-zinc-400"
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
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-zinc-100 px-4 py-2.5">
          <p
            className="text-[13px] leading-relaxed whitespace-pre-wrap text-zinc-900"
            style={{ fontFamily: 'var(--font-heading), system-ui, sans-serif' }}
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
        className={cn('max-w-[95%] rounded-2xl rounded-bl-sm px-4 py-2.5', {
          'opacity-60': cancelled,
        })}
      >
        <div className="relative">
          <ReactMarkdown
            rehypePlugins={[rehypeSanitize]}
            components={MARKDOWN_COMPONENTS}
          >
            {content}
          </ReactMarkdown>

          {isStreaming && <StreamingCursor />}
        </div>

        {cancelled && (
          <p className="mt-2 text-[11px] text-zinc-400 italic">
            Response interrupted
          </p>
        )}

        {error && <p className="mt-2 text-[11px] text-red-500">{error}</p>}
      </div>
    </div>
  );
});
