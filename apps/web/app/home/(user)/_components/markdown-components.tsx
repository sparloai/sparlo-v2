'use client';

import type { Components } from 'react-markdown';

// ============================================================================
// URL Sanitization
// ============================================================================

/**
 * Sanitize URLs to prevent javascript: protocol XSS attacks.
 * Only allows http:, https:, mailto:, and tel: protocols.
 */
function sanitizeUrl(url: string | undefined): string {
  if (!url) return '#';

  // Trim and lowercase for checking
  const trimmed = url.trim().toLowerCase();

  // Allow only safe protocols
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('/')
  ) {
    return url;
  }

  // Block javascript:, data:, vbscript:, etc.
  console.warn(
    `[Security] Blocked potentially unsafe URL: ${url.slice(0, 50)}`,
  );
  return '#';
}

// ============================================================================
// Section ID Generation
// ============================================================================

// Helper function to generate consistent section IDs
function generateSectionId(text: string): string {
  return text
    .toLowerCase()
    .replace(/\*\*/g, '')
    .replace(/['']/g, '')
    .replace(/&/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/^[\d)]+\s*/, '');
}

export { generateSectionId, sanitizeUrl };

// Premium document styling with refined typography and spacing
export const markdownComponents: Components = {
  h2: ({ children, ...props }) => {
    const text = String(children);
    const id = generateSectionId(text);
    return (
      <h2
        id={id}
        className="mt-12 mb-5 scroll-mt-28 border-b border-[#E5E5E5] pb-3 text-[22px] font-semibold tracking-tight text-[#1A1A1A] first:mt-0 dark:border-neutral-800 dark:text-white"
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }) => {
    const text = String(children);
    const id = generateSectionId(text);
    return (
      <h3
        id={id}
        className="mt-8 mb-3 scroll-mt-28 text-lg font-semibold text-[#1A1A1A] dark:text-white"
        {...props}
      >
        {children}
      </h3>
    );
  },
  h4: ({ children, ...props }) => (
    <h4
      className="mt-6 mb-2 text-base font-semibold text-[#1A1A1A] dark:text-white"
      {...props}
    >
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p
      className="mb-4 leading-[1.7] text-[#4A4A4A] dark:text-neutral-300"
      {...props}
    >
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-4 ml-0 list-none space-y-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 ml-0 list-none space-y-2">{children}</ol>
  ),
  li: ({ children, ...props }) => (
    <li
      className="relative pl-5 leading-[1.7] text-[#4A4A4A] before:absolute before:top-[0.6em] before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#7C3AED] dark:text-neutral-300"
      {...props}
    >
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-[#1A1A1A] dark:text-white" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="text-[#4A4A4A] italic dark:text-neutral-300" {...props}>
      {children}
    </em>
  ),
  hr: () => <hr className="my-10 border-[#E5E5E5] dark:border-neutral-800" />,
  table: ({ children, ...props }) => (
    <div className="mb-6 overflow-x-auto rounded-lg border border-[#E5E5E5] dark:border-neutral-800">
      <table className="min-w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-[#FAFAFA] dark:bg-neutral-900" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border-b border-[#E5E5E5] px-4 py-3 text-left text-xs font-semibold tracking-wider text-[#6B6B6B] uppercase dark:border-neutral-800 dark:text-neutral-400"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="border-b border-[#E5E5E5] px-4 py-3 text-[#4A4A4A] dark:border-neutral-800 dark:text-neutral-300"
      {...props}
    >
      {children}
    </td>
  ),
  code: ({ children, className, ...props }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <pre className="mb-4 overflow-x-auto rounded-lg bg-[#1A1A1A] p-4 font-mono text-sm text-neutral-200">
          <code {...props}>{children}</code>
        </pre>
      );
    }
    return (
      <code
        className="rounded bg-[#F5F5F5] px-1.5 py-0.5 font-mono text-sm text-[#7C3AED] dark:bg-neutral-800 dark:text-purple-400"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre
      className="mb-4 overflow-x-auto rounded-lg bg-[#1A1A1A] p-4 font-mono text-sm whitespace-pre text-neutral-200"
      {...props}
    >
      {children}
    </pre>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-6 border-l-4 border-[#7C3AED] bg-[#FAFAFA] py-4 pr-4 pl-6 text-[#4A4A4A] dark:bg-neutral-900/50 dark:text-neutral-300"
      {...props}
    >
      {children}
    </blockquote>
  ),
  // Secure link component that sanitizes URLs to prevent XSS
  a: ({ children, href, ...props }) => (
    <a
      href={sanitizeUrl(href)}
      className="text-[#7C3AED] underline decoration-[#7C3AED]/30 underline-offset-2 transition-colors hover:text-[#6D28D9] hover:decoration-[#6D28D9]/50"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};
