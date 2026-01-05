---
status: pending
priority: p2
issue_id: 204
tags: [code-review, security, help-center]
dependencies: []
---

# Markdown Sanitizer Missing Explicit Protocol Blocklist

## Problem Statement

The STRICT_SANITIZE_SCHEMA for markdown rendering allows `http`, `https`, and `mailto` protocols, but doesn't explicitly block `javascript:` and `data:` URLs. While the whitelist approach should prevent these, defense-in-depth requires explicit blocking.

## Findings

**Location**: `apps/web/lib/shared/markdown-components.tsx` (lines 95-97)

**Current Code**:
```typescript
protocols: {
  href: ['http', 'https', 'mailto'],
},
```

**Potential Exploit Vectors**:
```markdown
[Click me](javascript:alert('XSS'))
[Click](data:text/html,<script>alert('XSS')</script>)
```

While rehype-sanitize's whitelist should block these, explicit blocking adds defense-in-depth.

## Proposed Solutions

### Solution A: Add Explicit Blocking (Recommended)
**Pros**: Defense in depth, documents intent
**Cons**: Slightly more code
**Effort**: Small (5 min)
**Risk**: None

```typescript
export const STRICT_SANITIZE_SCHEMA: RehypeSanitizeOptions = {
  tagNames: [...],
  attributes: {
    a: ['href', 'title'],
  },
  protocols: {
    href: ['http', 'https', 'mailto'],
  },
  // Add explicit blocking
  clobberPrefix: 'user-content-',
  strip: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
};
```

Additionally, add client-side URL validation:
```typescript
a: ({ children, href }: { children?: React.ReactNode; href?: string }) => {
  // Validate URL protocol
  const isValidUrl = href && /^(https?:|mailto:)/.test(href);
  return isValidUrl ? (
    <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
  ) : (
    <span>{children}</span>
  );
},
```

## Technical Details

- **Affected Files**: `apps/web/lib/shared/markdown-components.tsx`
- **Components**: STRICT_SANITIZE_SCHEMA, MARKDOWN_COMPONENTS
- **Database Changes**: None

## Acceptance Criteria

- [ ] clobberPrefix added to schema
- [ ] Link component validates URL protocol
- [ ] javascript: and data: URLs rendered as plain text
- [ ] Valid http/https/mailto links still work

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Security review finding |

## Resources

- Agent: security-sentinel review
