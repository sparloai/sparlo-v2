'use client';

import type { Options as RehypeSanitizeOptions } from 'rehype-sanitize';

/**
 * Shared markdown components for consistent styling across chat interfaces
 * Used by help-chat and report-chat components
 */
export const MARKDOWN_COMPONENTS = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2 text-[13px] leading-relaxed text-zinc-700 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-2 ml-4 list-disc space-y-1 text-[13px] text-zinc-700 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-2 ml-4 list-decimal space-y-1 text-[13px] text-zinc-700 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-[13px] text-zinc-700">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-medium text-zinc-900">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="text-zinc-600">{children}</em>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[12px] text-zinc-700">
      {children}
    </code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="my-2 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-[12px]">
      {children}
    </pre>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="my-2 border-l-2 border-zinc-300 py-1 pl-3 text-[13px] text-zinc-600 italic">
      {children}
    </blockquote>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => {
    // P2 Fix: Defense-in-depth protocol validation (rehype-sanitize also checks)
    const isValidProtocol =
      !href ||
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:');

    if (!isValidProtocol) {
      return <span className="text-zinc-600">{children}</span>;
    }

    return (
      <a
        href={href}
        className="text-zinc-900 underline decoration-zinc-400 underline-offset-2 hover:decoration-zinc-600"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  },
} as const;

/**
 * Strict sanitization schema for rehype-sanitize
 * Only allows safe markdown elements, no scripts or dangerous attributes
 */
export const STRICT_SANITIZE_SCHEMA: RehypeSanitizeOptions = {
  tagNames: [
    'p',
    'br',
    'hr',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'strong',
    'em',
    'b',
    'i',
    'u',
    's',
    'del',
    'code',
    'pre',
    'blockquote',
    'a',
  ],
  attributes: {
    a: ['href', 'title'],
    // No other elements get attributes - prevent style/onclick/etc attacks
  },
  protocols: {
    href: ['http', 'https', 'mailto'],
  },
  strip: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
};
