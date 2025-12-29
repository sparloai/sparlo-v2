'use client';

import type { ComponentPropsWithoutRef } from 'react';
import { useCallback, useState } from 'react';

import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

// Custom theme matching Air Company aesthetic
const altitudeTheme: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': {
    color: '#c8d4e6',
    fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
    fontSize: '12px',
    lineHeight: '1.6',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    tabSize: 2,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#c8d4e6',
    fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
    fontSize: '12px',
    lineHeight: '1.6',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    tabSize: 2,
    hyphens: 'none',
    padding: '1.5rem 1rem 1rem',
    margin: 0,
    overflow: 'auto',
    background: 'rgba(13, 17, 23, 0.9)',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },
  comment: { color: '#5a6b8c', fontStyle: 'italic' },
  prolog: { color: '#5a6b8c' },
  doctype: { color: '#5a6b8c' },
  cdata: { color: '#5a6b8c' },
  punctuation: { color: '#8b9dc3' },
  property: { color: '#64b5f6' },
  tag: { color: '#64b5f6' },
  boolean: { color: '#d4af37' },
  number: { color: '#d4af37' },
  constant: { color: '#d4af37' },
  symbol: { color: '#d4af37' },
  selector: { color: '#81c784' },
  'attr-name': { color: '#81c784' },
  string: { color: '#81c784' },
  char: { color: '#81c784' },
  builtin: { color: '#81c784' },
  operator: { color: '#8b9dc3' },
  entity: { color: '#64b5f6', cursor: 'help' },
  url: { color: '#64b5f6' },
  variable: { color: '#f0f4f8' },
  atrule: { color: '#64b5f6' },
  'attr-value': { color: '#81c784' },
  keyword: { color: '#64b5f6' },
  function: { color: '#e8b84a' },
  'class-name': { color: '#e8b84a' },
  regex: { color: '#d4af37' },
  important: { color: '#d4af37', fontWeight: 'bold' },
  deleted: { color: '#ef5350' },
  inserted: { color: '#81c784' },
};

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
      // Fallback for older browsers
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

  // Inline code - themed for Air Company
  if (isInline) {
    return (
      <code
        className="rounded-md px-1.5 py-0.5 text-[12px]"
        style={{
          background: 'rgba(100, 181, 246, 0.1)',
          color: '#64b5f6',
          border: '1px solid rgba(100, 181, 246, 0.15)',
          fontFamily: 'var(--font-mono), monospace',
        }}
        {...props}
      >
        {children}
      </code>
    );
  }

  // Code block with syntax highlighting
  return (
    <div className="group relative my-4">
      {/* Language badge */}
      <div
        className="absolute top-2 left-3 z-10 rounded-md px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase"
        style={{
          background: 'rgba(100, 181, 246, 0.1)',
          color: '#64b5f6',
          border: '1px solid rgba(100, 181, 246, 0.15)',
        }}
      >
        {language}
      </div>

      {/* Copy button */}
      <motion.button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
        whileHover={{ background: 'rgba(255, 255, 255, 0.1)' }}
        whileTap={{ scale: 0.95 }}
        aria-label={copied ? 'Copied!' : 'Copy code'}
        type="button"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" style={{ color: '#81c784' }} />
        ) : (
          <Copy className="h-3.5 w-3.5" style={{ color: '#8b9dc3' }} />
        )}
      </motion.button>

      <SyntaxHighlighter
        language={language}
        style={altitudeTheme}
        customStyle={{
          margin: 0,
          borderRadius: '0.75rem',
          padding: '2.25rem 1rem 1rem',
          fontSize: '12px',
          background: 'rgba(13, 17, 23, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}
