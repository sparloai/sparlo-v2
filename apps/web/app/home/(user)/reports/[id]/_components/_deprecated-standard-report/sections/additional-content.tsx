import type { AdditionalSection } from '../../../_lib/schema/sparlo-report.schema';
import { SectionHeader } from '../shared/section-header';

interface AdditionalContentProps {
  data?: {
    sections: AdditionalSection[];
  };
}

/**
 * Renders inline formatting: **bold**, *italic*, `code`
 * Returns React elements, not HTML strings (XSS-safe)
 */
function renderInlineFormatting(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic: *text* (but not **)
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
    // Code: `text`
    const codeMatch = remaining.match(/`([^`]+)`/);

    // Find the earliest match
    const matches = [
      boldMatch
        ? { match: boldMatch, type: 'bold' as const, index: boldMatch.index! }
        : null,
      italicMatch
        ? {
            match: italicMatch,
            type: 'italic' as const,
            index: italicMatch.index!,
          }
        : null,
      codeMatch
        ? { match: codeMatch, type: 'code' as const, index: codeMatch.index! }
        : null,
    ]
      .filter(Boolean)
      .sort((a, b) => a!.index - b!.index);

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const first = matches[0]!;

    // Add text before the match
    if (first.index > 0) {
      parts.push(remaining.slice(0, first.index));
    }

    // Add the formatted element
    const content = first.match[1];
    if (first.type === 'bold') {
      parts.push(
        <strong key={key++} className="font-semibold text-zinc-800">
          {content}
        </strong>,
      );
    } else if (first.type === 'italic') {
      parts.push(
        <em key={key++} className="italic">
          {content}
        </em>,
      );
    } else if (first.type === 'code') {
      parts.push(
        <code
          key={key++}
          className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm text-zinc-700"
        >
          {content}
        </code>,
      );
    }

    // Continue with remaining text
    remaining = remaining.slice(first.index + first.match[0].length);
  }

  return parts.length === 1 ? parts[0] : parts;
}

/**
 * Renders markdown-like content safely using React elements.
 * Supports: paragraphs, bold (**text**), italic (*text*), code (`text`), lists (- item)
 * No dangerouslySetInnerHTML - all content is escaped by React.
 */
function MarkdownContent({ content }: { content: string }) {
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, pIndex) => {
        const lines = paragraph.split('\n');
        const isList = lines.every(
          (line) => /^[-*]\s/.test(line.trim()) || line.trim() === '',
        );

        if (isList) {
          const listItems = lines
            .filter((line) => /^[-*]\s/.test(line.trim()))
            .map((line) => line.replace(/^[-*]\s/, '').trim());

          return (
            <ul key={pIndex} className="ml-4 space-y-2">
              {listItems.map((item, iIndex) => (
                <li key={iIndex} className="flex gap-2 text-sm text-zinc-600">
                  <span className="shrink-0 text-zinc-400">•</span>
                  <span>{renderInlineFormatting(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={pIndex} className="text-base leading-relaxed text-zinc-600">
            {renderInlineFormatting(paragraph)}
          </p>
        );
      })}
    </div>
  );
}

export function AdditionalContent({ data }: AdditionalContentProps) {
  if (!data || !data.sections || data.sections.length === 0) {
    return null;
  }

  return (
    <>
      {data.sections.map((section) => (
        <section
          key={section.id}
          id={`additional-${section.id}`}
          className="space-y-6"
        >
          <SectionHeader
            id={`additional-${section.id}-header`}
            title={
              section.icon ? `${section.icon} ${section.title}` : section.title
            }
          />
          <div className="rounded-xl border border-zinc-100 bg-gradient-to-br from-zinc-50/50 to-white p-6">
            <MarkdownContent content={section.content} />
          </div>
        </section>
      ))}
    </>
  );
}
