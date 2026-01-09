# Fix Markdown Rendering in DD Report Prose Sections

## Overview

DD reports contain `prose_report` sections (technical_deep_dive, commercialization_reality, investment_synthesis, problem_primer, solution_landscape) where the LLM outputs markdown syntax (`## headers`, `**bold**`, bullet lists), but the rendering components display raw markdown text instead of formatted content.

## Problem Statement

**Current Behavior:** Raw markdown syntax is visible to users:
```
## Technical Deep Dive: Parallel Carbon's Electrochemical Calcium Looping

### HOW THEIR TECHNOLOGY WORKS

**Step 1: Capture.** Air passes over...
```

**Expected Behavior:** Properly rendered markdown with styled headers, bold text, lists, etc.

**Root Cause:** The `BodyText` and `SplitParagraphs` components in `dd-report-display.tsx` treat prose content as plain text. They only parse `<sup>[N]</sup>` citations via `parseCited`, not markdown.

## Proposed Solution

Create a `ProseMarkdown` component that uses the existing `react-markdown` + `rehype-sanitize` setup (already used in chat) and apply it to prose report sections.

## Technical Approach

### Architecture

```
Current Flow:
prose_report.*.content → BodyText/SplitParagraphs → parseCitations() → Plain text

New Flow:
prose_report.*.content → ProseMarkdown → ReactMarkdown + rehype-sanitize → Styled markdown
```

### Key Design Decisions

1. **Citation Handling:** The `<sup>[N]</sup>` citations in prose content will pass through `rehype-sanitize` (we'll allow `<sup>` in the schema). No need for separate `parseCited` processing.

2. **Component Scope:** Only update the `prose_report` sections in `dd-report-display.tsx`. Quick reference fields remain unchanged (follow-up if needed).

3. **Sanitization:** Extend `STRICT_SANITIZE_SCHEMA` to allow `<sup>` tags for citations while blocking dangerous elements.

4. **Typography:** Style markdown elements to match brand system (18px base text, scaled headers).

### Files to Modify

| File | Change |
|------|--------|
| `apps/web/app/app/reports/[id]/_components/brand-system/primitives.tsx` | Add `ProseMarkdown` component |
| `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx` | Replace `BodyText`/`SplitParagraphs` with `ProseMarkdown` for prose sections |
| `apps/web/lib/shared/markdown-components.tsx` | Add `PROSE_SANITIZE_SCHEMA` (extends STRICT to allow `<sup>`) |

## Implementation Plan

### Step 1: Create ProseMarkdown Component

**File:** `primitives.tsx`

```tsx
// New component to add
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { PROSE_SANITIZE_SCHEMA, PROSE_MARKDOWN_COMPONENTS } from '~/lib/shared/markdown-components';

interface ProseMarkdownProps {
  children: string;
  className?: string;
}

export const ProseMarkdown = memo(function ProseMarkdown({
  children,
  className
}: ProseMarkdownProps) {
  if (!children || !children.trim()) {
    return null;
  }

  return (
    <div className={cn('prose-content', className)}>
      <ReactMarkdown
        rehypePlugins={[[rehypeSanitize, PROSE_SANITIZE_SCHEMA]]}
        components={PROSE_MARKDOWN_COMPONENTS}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
});
```

### Step 2: Add Prose Sanitization Schema and Components

**File:** `markdown-components.tsx`

```tsx
// Extend STRICT_SANITIZE_SCHEMA for prose (allow <sup> for citations)
export const PROSE_SANITIZE_SCHEMA: RehypeSanitizeOptions = {
  ...STRICT_SANITIZE_SCHEMA,
  tagNames: [...(STRICT_SANITIZE_SCHEMA.tagNames || []), 'sup', 'sub'],
};

// Prose-specific markdown components with brand typography
export const PROSE_MARKDOWN_COMPONENTS = {
  p: ({ children }) => (
    <p className="mb-4 text-[18px] leading-[1.7] text-zinc-700 last:mb-0"
       style={{ fontFamily: 'var(--font-heading), system-ui, sans-serif' }}>
      {children}
    </p>
  ),
  h2: ({ children }) => (
    <h2 className="mt-8 mb-4 text-[24px] font-semibold text-zinc-900 tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 mb-3 text-[20px] font-semibold text-zinc-800 tracking-tight">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-4 mb-2 text-[18px] font-semibold text-zinc-800">
      {children}
    </h4>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-900">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="mb-4 ml-6 list-disc space-y-2 text-[18px] text-zinc-700">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-2 text-[18px] text-zinc-700">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-[1.7]">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-zinc-300 pl-4 my-4 italic text-zinc-600">
      {children}
    </blockquote>
  ),
  code: ({ inline, children }) => {
    if (inline) {
      return (
        <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-[16px] font-mono text-zinc-800">
          {children}
        </code>
      );
    }
    return (
      <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto my-4">
        <code className="text-[14px] font-mono">{children}</code>
      </pre>
    );
  },
  a: ({ href, children }) => {
    const isValidProtocol = !href ||
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:');

    if (!isValidProtocol) return <span>{children}</span>;

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {children}
      </a>
    );
  },
  sup: ({ children }) => (
    <sup className="text-[12px] text-zinc-500 ml-0.5">{children}</sup>
  ),
};
```

### Step 3: Update dd-report-display.tsx

Replace prose section rendering from:
```tsx
<BodyText parseCited>{prose.problem_primer.content}</BodyText>
```

To:
```tsx
<ProseMarkdown>{prose.problem_primer.content}</ProseMarkdown>
```

**Sections to update:**
- `prose.problem_primer.content` (~line 2135)
- `prose.technical_deep_dive.content` (~line 2150)
- `prose.solution_landscape.content` (~line 2165)
- `prose.commercialization_reality.content` (~line 2180)
- `prose.investment_synthesis.content` (~line 2195)

### Step 4: Remove SplitParagraphs for Prose

The `SplitParagraphs` component splits on `\n\n+` before rendering, which breaks multi-line markdown structures. `ProseMarkdown` should receive the full content string.

## Acceptance Criteria

### Functional Requirements
- [ ] Markdown headers (`##`, `###`) render as styled headings
- [ ] Bold (`**text**`) and italic (`*text*`) render with proper styling
- [ ] Bullet lists (`-`) and numbered lists (`1.`) render as styled lists
- [ ] Code blocks (triple backticks) render with syntax styling
- [ ] Inline code (single backticks) renders with background highlight
- [ ] Citations (`<sup>[1]</sup>`) continue to render correctly
- [ ] Links render as clickable with proper security attributes

### Non-Functional Requirements
- [ ] Existing reports with plain text continue to display correctly
- [ ] No XSS vulnerabilities (all HTML sanitized)
- [ ] Performance: no noticeable delay on long prose sections
- [ ] Typography matches brand system (18px base, proper spacing)

### Quality Gates
- [ ] Visual regression test on example DD report
- [ ] Test with `example-dd5-output.json` sample data
- [ ] Verify citation rendering in prose sections
- [ ] Check mobile responsive layout

## Success Metrics

- All 5 prose sections render markdown correctly
- No visual regressions in other report sections
- Lighthouse performance score unchanged

## Dependencies & Prerequisites

- `react-markdown` ^10.1.0 (already installed)
- `rehype-sanitize` ^6.0.0 (already installed)

## Risk Analysis

| Risk | Severity | Mitigation |
|------|----------|------------|
| Citation parsing breaks | Medium | Allow `<sup>` in sanitize schema; test with citation-heavy content |
| Existing plain text reports look different | Low | Plain text through ReactMarkdown renders identically |
| LLM malformed markdown | Low | ReactMarkdown handles gracefully; add error boundary |
| PDF export inconsistency | Medium | Document as known limitation; follow-up ticket |

## Known Limitations

1. **PDF Export:** The PDF export path (`render-report-html.ts`) may not use the same rendering. This should be addressed in a follow-up.

2. **Quick Reference Fields:** Fields like `key_strength`, `key_risk`, `executive_paragraph` are not updated. If markdown appears there, consider a follow-up.

## Testing Plan

1. **Manual Testing:**
   - Load existing DD report and verify prose sections render markdown
   - Verify citations still work
   - Check mobile layout

2. **Test Data:**
   - Use `apps/web/lib/llm/prompts/dd/example-dd5-output.json`
   - Create test report with edge cases (nested lists, code blocks, mixed content)

## References

### Internal References
- Existing markdown setup: `apps/web/lib/shared/markdown-components.tsx`
- Chat markdown usage: `apps/web/app/app/reports/[id]/_components/chat/chat-message.tsx`
- DD display component: `apps/web/app/app/reports/[id]/_components/brand-system/dd-report-display.tsx:2135`
- Primitives: `apps/web/app/app/reports/[id]/_components/brand-system/primitives.tsx`
- Example output: `apps/web/lib/llm/prompts/dd/example-dd5-output.json`

### External References
- [react-markdown documentation](https://github.com/remarkjs/react-markdown)
- [rehype-sanitize documentation](https://github.com/rehypejs/rehype-sanitize)
