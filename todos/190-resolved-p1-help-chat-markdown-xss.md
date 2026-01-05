---
status: resolved
priority: p1
issue_id: 190
tags: [code-review, security, help-chat, xss]
dependencies: []
---

# Insufficient Markdown Sanitization - XSS Vulnerability

## Problem Statement

The Help Center chat uses `rehype-sanitize` with default configuration, which may not be restrictive enough for untrusted AI-generated content. Malicious links like `javascript:`, `data:`, or `vbscript:` could bypass sanitization.

**Impact:** Session hijacking, phishing attacks, keylogging, CSRF attacks.

## Findings

**Location:** `apps/web/app/home/[account]/help/_components/help-chat.tsx:362-367`

```typescript
<ReactMarkdown
  rehypePlugins={[rehypeSanitize]}  // Default schema - potentially permissive
  components={MARKDOWN_COMPONENTS}
>
  {message.content}
</ReactMarkdown>
```

**Attack Vectors:**

1. **JavaScript Protocol:**
   ```markdown
   Click here: [Malicious Link](javascript:alert(document.cookie))
   ```

2. **Data URI with HTML:**
   ```markdown
   [Click me](data:text/html,<script>alert('XSS')</script>)
   ```

3. **SVG with JavaScript:**
   ```markdown
   ![Image](data:image/svg+xml,<svg onload="alert('XSS')"></svg>)
   ```

**Evidence:** Security audit identified CVSS Score 8.2 (High)

## Proposed Solutions

### Option A: Strict Sanitization Schema (Recommended)

**Pros:** Maximum security, allows safe markdown
**Cons:** Slightly more code
**Effort:** Small (1 hour)
**Risk:** Low

```typescript
import { defaultSchema } from 'rehype-sanitize';

const strictSchema = {
  ...defaultSchema,
  protocols: {
    href: ['http', 'https', 'mailto'], // Only allow safe protocols
  },
  tagNames: [
    'p', 'strong', 'em', 'code', 'pre',
    'ul', 'ol', 'li', 'blockquote'
    // No <a>, <img>, <script>
  ],
};

<ReactMarkdown
  rehypePlugins={[[rehypeSanitize, strictSchema]]}
  components={MARKDOWN_COMPONENTS}
>
```

### Option B: Strip Links Entirely

**Pros:** Simplest, eliminates attack surface
**Cons:** No clickable links in chat
**Effort:** Tiny (15 minutes)
**Risk:** None

```typescript
const MARKDOWN_COMPONENTS = {
  a: ({ children }: { children?: React.ReactNode }) => (
    <span className="text-zinc-900">{children}</span>  // Strip link, keep text
  ),
};
```

### Option C: URL Validation in Custom Component

**Pros:** Allows links with validation
**Cons:** More complex validation logic
**Effort:** Medium (2 hours)
**Risk:** Medium (validation bypass possible)

## Recommended Action

<!-- To be filled during triage -->

## Technical Details

**Affected Files:**
- `apps/web/app/home/[account]/help/_components/help-chat.tsx` (lines 61-70, 362-367)

**Components:** ChatBubble component, MARKDOWN_COMPONENTS

## Acceptance Criteria

- [ ] `javascript:` URLs are blocked
- [ ] `data:` URLs are blocked
- [ ] `vbscript:` URLs are blocked
- [ ] Safe http/https links work (if allowed)
- [ ] XSS test cases pass
- [ ] No console errors from sanitization

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from security review | Default rehype-sanitize is too permissive for AI content |

## Resources

- Security audit: CVSS 8.2 (High)
- https://github.com/rehypejs/rehype-sanitize#use
- OWASP XSS Prevention Cheat Sheet
