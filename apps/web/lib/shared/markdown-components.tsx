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

/**
 * Sanitization schema for DD prose sections
 * Extends STRICT_SANITIZE_SCHEMA to allow <sup> for citations
 */
export const PROSE_SANITIZE_SCHEMA: RehypeSanitizeOptions = {
  tagNames: [
    ...(STRICT_SANITIZE_SCHEMA.tagNames ?? []),
    'sup',
    'sub',
  ],
  attributes: {
    ...STRICT_SANITIZE_SCHEMA.attributes,
  },
  protocols: {
    ...STRICT_SANITIZE_SCHEMA.protocols,
  },
  strip: STRICT_SANITIZE_SCHEMA.strip,
};

/**
 * Prose-specific markdown components for DD report sections
 * Styled to match brand system typography (18px base)
 */
export const PROSE_MARKDOWN_COMPONENTS = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p
      className="mb-4 text-[18px] leading-[1.7] text-zinc-700 last:mb-0"
      style={{ fontFamily: 'var(--font-heading), system-ui, sans-serif' }}
    >
      {children}
    </p>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mb-4 mt-8 text-[28px] font-semibold tracking-tight text-zinc-900">
      {children}
    </h2>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mb-4 mt-8 text-[24px] font-semibold tracking-tight text-zinc-900">
      {children}
    </h3>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="mb-3 mt-6 text-[20px] font-semibold tracking-tight text-zinc-800">
      {children}
    </h4>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <h5 className="mb-2 mt-4 text-[18px] font-semibold text-zinc-800">
      {children}
    </h5>
  ),
  h5: ({ children }: { children?: React.ReactNode }) => (
    <h6 className="mb-2 mt-4 text-[16px] font-semibold text-zinc-800">
      {children}
    </h6>
  ),
  h6: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2 mt-4 text-[14px] font-semibold text-zinc-700">
      {children}
    </p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-zinc-900">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-4 ml-6 list-disc space-y-2 text-[18px] text-zinc-700">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-2 text-[18px] text-zinc-700">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-[1.7]">{children}</li>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="my-4 border-l-4 border-zinc-300 pl-4 italic text-zinc-600">
      {children}
    </blockquote>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[16px] text-zinc-800">
      {children}
    </code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="my-4 overflow-x-auto rounded-lg bg-zinc-900 p-4 text-zinc-100">
      {children}
    </pre>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => {
    // Defense-in-depth protocol validation
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
        className="text-blue-600 underline decoration-blue-400 underline-offset-2 hover:decoration-blue-600"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  },
  sup: ({ children }: { children?: React.ReactNode }) => (
    <sup className="ml-0.5 text-[12px] text-zinc-500">{children}</sup>
  ),
  sub: ({ children }: { children?: React.ReactNode }) => (
    <sub className="text-[12px] text-zinc-500">{children}</sub>
  ),
  hr: () => <hr className="my-6 border-zinc-200" />,
} as const;
