import ReactMarkdown from 'react-markdown';

import { cn } from '@kit/ui/utils';

import { CodeBlock } from './code-block';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  isStreaming?: boolean;
  cancelled?: boolean;
  error?: string;
}

export function ChatMessage({
  content,
  role,
  isStreaming,
  cancelled,
  error,
}: ChatMessageProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-purple-600 px-4 py-3 text-white">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div
        className={cn(
          'max-w-[95%] rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 text-gray-900 dark:bg-neutral-800 dark:text-neutral-100',
          cancelled && 'opacity-60',
          error && 'border border-red-500/30',
        )}
      >
        <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code: CodeBlock,
              // Tighter spacing for chat
              p: ({ children }) => (
                <p className="mb-2 text-sm leading-relaxed last:mb-0">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="mb-2 ml-4 list-disc space-y-1 text-sm last:mb-0">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-2 ml-4 list-decimal space-y-1 text-sm last:mb-0">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="text-sm">{children}</li>,
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              pre: ({ children }) => <>{children}</>,
              blockquote: ({ children }) => (
                <blockquote className="my-2 border-l-2 border-purple-400 pl-3 text-sm italic opacity-80">
                  {children}
                </blockquote>
              ),
              h1: ({ children }) => (
                <h1 className="mb-2 text-base font-semibold">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-2 text-sm font-semibold">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-1 text-sm font-medium">{children}</h3>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        {isStreaming && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-purple-500" />
        )}
        {cancelled && (
          <span className="mt-1 block text-xs text-gray-500 italic dark:text-neutral-400">
            Generation stopped
          </span>
        )}
      </div>
    </div>
  );
}
