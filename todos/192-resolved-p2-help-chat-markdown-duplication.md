---
status: resolved
priority: p2
issue_id: 192
tags: [code-review, architecture, help-chat, dry]
dependencies: []
---

# MARKDOWN_COMPONENTS Duplication Across Chat Features

## Problem Statement

The `MARKDOWN_COMPONENTS` object is duplicated in two files with divergent implementations. This violates DRY principle, creates inconsistent UX, and requires bug fixes to be applied twice.

**Impact:** Maintenance burden, inconsistent styling, design system violations.

## Findings

**Duplicate Locations:**
1. `apps/web/app/home/[account]/help/_components/help-chat.tsx` (lines 21-71) - 51 lines
2. `apps/web/app/home/(user)/reports/[id]/_components/chat/chat-message.tsx` (lines 22-102) - 81 lines

**Differences:**

| Aspect | Help Chat | Report Chat |
|--------|-----------|-------------|
| Font | No font-family | Uses `var(--font-heading)` |
| Code blocks | Inline `<code>` only | Has `CodeBlock` with syntax highlighting |
| Headings | Missing h1/h2/h3 | Complete heading hierarchy |
| Component count | 10 | 13 |

**Evidence:** Architecture review identified DRY violation

## Proposed Solutions

### Option A: Extract to Shared Package (Recommended)

**Pros:** Single source of truth, design system compliant, reusable
**Cons:** Requires package coordination
**Effort:** Medium (2-3 hours)
**Risk:** Low

```typescript
// packages/ui/src/markdown/chat-markdown-components.tsx
import type { Components } from 'react-markdown';

export const createChatMarkdownComponents = (
  options?: { withCodeBlock?: boolean }
): Partial<Components> => ({
  p({ children }) {
    return (
      <p
        className="mb-2 text-[13px] leading-relaxed text-zinc-700 last:mb-0"
        style={{ fontFamily: 'var(--font-heading), system-ui, sans-serif' }}
      >
        {children}
      </p>
    );
  },
  // ... complete design-system-compliant implementation
});

// Both files use:
import { createChatMarkdownComponents } from '@kit/ui/markdown';
const MARKDOWN_COMPONENTS = createChatMarkdownComponents();
```

### Option B: Use Tailwind Prose Plugin

**Pros:** Eliminates component abstraction entirely, -51 LOC
**Cons:** Less control over individual elements
**Effort:** Small (1 hour)
**Risk:** Low

```typescript
<ReactMarkdown
  rehypePlugins={[rehypeSanitize]}
  className="prose prose-sm prose-zinc max-w-none [&>p]:mb-2 [&>p]:text-[13px]"
>
  {message.content}
</ReactMarkdown>
```

## Recommended Action

<!-- To be filled during triage -->

## Technical Details

**Affected Files:**
- `apps/web/app/home/[account]/help/_components/help-chat.tsx`
- `apps/web/app/home/(user)/reports/[id]/_components/chat/chat-message.tsx`
- New: `packages/ui/src/markdown/chat-markdown-components.tsx`

## Acceptance Criteria

- [ ] Single source of truth for markdown components
- [ ] Both chat features use shared implementation
- [ ] Design system font-family applied consistently
- [ ] Visual regression test passes
- [ ] Bundle size not increased

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from architecture review | Component duplication creates maintenance burden |

## Resources

- Design system: `docs/SPARLO-DESIGN-SYSTEM.md`
- Existing primitives: `reports/[id]/_components/brand-system/primitives.tsx`
