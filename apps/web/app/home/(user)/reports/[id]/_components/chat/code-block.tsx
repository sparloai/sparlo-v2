'use client';

import type { ComponentPropsWithoutRef } from 'react';
import { useCallback, useState } from 'react';

import { Check, Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

type CodeBlockProps = ComponentPropsWithoutRef<'code'>;

export function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const match = /language-(\w+)/.exec(className || '');
  const language = match?.[1] || 'text';
  const codeString = String(children).replace(/\n$/, '');
  const isInline = !match && !codeString.includes('\n');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers or when clipboard API is not available
      const textarea = document.createElement('textarea');
      textarea.value = codeString;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [codeString]);

  // Inline code
  if (isInline) {
    return (
      <code
        className="rounded bg-gray-200 px-1.5 py-0.5 text-sm text-purple-600 dark:bg-gray-700 dark:text-purple-400"
        {...props}
      >
        {children}
      </code>
    );
  }

  // Code block with syntax highlighting and copy button
  return (
    <div className="group relative my-3">
      {/* Language badge */}
      <div className="absolute top-2 left-3 z-10 text-xs text-gray-400">
        {language}
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 rounded-md bg-gray-700 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-600 focus:opacity-100"
        aria-label={copied ? 'Copied!' : 'Copy code'}
        type="button"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4 text-gray-300" />
        )}
      </button>

      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          padding: '2rem 1rem 1rem',
          fontSize: '0.8125rem',
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}
