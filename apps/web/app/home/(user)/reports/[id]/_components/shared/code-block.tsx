'use client';

import type { ComponentPropsWithoutRef } from 'react';
import { useCallback, useState } from 'react';

import { Check, Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

// Light monochrome theme
const lightTheme: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': {
    color: '#3f3f46',
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
    color: '#3f3f46',
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
    padding: '1rem',
    margin: 0,
    overflow: 'auto',
    background: '#fafafa',
    borderRadius: '0.5rem',
    border: '1px solid #e4e4e7',
  },
  comment: { color: '#a1a1aa', fontStyle: 'italic' },
  prolog: { color: '#a1a1aa' },
  doctype: { color: '#a1a1aa' },
  cdata: { color: '#a1a1aa' },
  punctuation: { color: '#71717a' },
  property: { color: '#18181b' },
  tag: { color: '#18181b' },
  boolean: { color: '#52525b' },
  number: { color: '#52525b' },
  constant: { color: '#52525b' },
  symbol: { color: '#52525b' },
  selector: { color: '#3f3f46' },
  'attr-name': { color: '#52525b' },
  string: { color: '#52525b' },
  char: { color: '#52525b' },
  builtin: { color: '#3f3f46' },
  operator: { color: '#71717a' },
  entity: { color: '#18181b' },
  url: { color: '#18181b' },
  variable: { color: '#18181b' },
  atrule: { color: '#18181b' },
  'attr-value': { color: '#52525b' },
  keyword: { color: '#18181b', fontWeight: '500' },
  function: { color: '#18181b' },
  'class-name': { color: '#18181b' },
  regex: { color: '#52525b' },
  important: { color: '#18181b', fontWeight: 'bold' },
  deleted: { color: '#dc2626' },
  inserted: { color: '#16a34a' },
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
        className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[12px] text-zinc-700"
        {...props}
      >
        {children}
      </code>
    );
  }

  // Code block
  return (
    <div className="group relative my-3">
      <div className="absolute top-2 left-3 z-10 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
        {language}
      </div>

      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-200 hover:text-zinc-600 group-hover:opacity-100 focus:opacity-100"
        aria-label={copied ? 'Copied!' : 'Copy code'}
        type="button"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>

      <SyntaxHighlighter
        language={language}
        style={lightTheme}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          padding: '2rem 1rem 1rem',
          fontSize: '12px',
          background: '#fafafa',
          border: '1px solid #e4e4e7',
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}
