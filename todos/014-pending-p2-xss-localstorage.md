---
status: pending
priority: p2
issue_id: "014"
tags: [security, xss, frontend, localstorage]
dependencies: []
---

# XSS Risk via localStorage Data Injection

User-controlled data stored in localStorage is rendered without proper sanitization.

## Problem Statement

The application stores conversation/report data in localStorage and renders it directly. If an attacker can inject malicious content (via shared links, imported data, or other vectors), XSS could occur.

**Severity:** P2 - Medium security risk, requires specific attack vector

## Findings

- **Location:** Conversation titles, report markdown content
- **Vector:** Data flows: API → localStorage → React render
- **Risk:** If malicious markdown/HTML is stored, it renders in user's browser

**Current flow:**
```
API Response → localStorage → JSON.parse → State → React render → DOM
```

**Potential attack vectors:**
1. Malicious API response (if backend compromised)
2. Shared/imported conversation data
3. localStorage manipulation (if other XSS exists)
4. Report markdown with embedded scripts

**What's protected:**
- React's JSX escaping prevents most XSS
- Markdown renderer may have sanitization

**What's NOT protected:**
- `dangerouslySetInnerHTML` if used
- Markdown-rendered HTML
- URLs in href attributes

## Proposed Solutions

### Option 1: Add DOMPurify Sanitization

**Approach:** Sanitize all user-controlled content before rendering

**Pros:**
- Industry standard library
- Configurable sanitization rules
- Works with markdown output

**Cons:**
- Additional dependency
- Performance cost (minimal)
- Must apply consistently

**Effort:** 2-3 hours

**Risk:** Low

**Implementation:**
```typescript
import DOMPurify from 'dompurify';

// For markdown content
const sanitizedMarkdown = DOMPurify.sanitize(reportData.report_markdown, {
  USE_PROFILES: { html: true },
  ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'code', 'pre', 'em', 'strong'],
  ALLOWED_ATTR: ['href', 'class'],
});

// For plain text
const sanitizedTitle = DOMPurify.sanitize(conversation.title, {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
});
```

---

### Option 2: Server-Side Sanitization

**Approach:** Sanitize all content on backend before storage/return

**Pros:**
- Defense in depth
- Single sanitization point
- Works for all clients

**Cons:**
- Backend changes required
- Doesn't protect against localStorage manipulation
- May be redundant if frontend also sanitizes

**Effort:** 3-4 hours

**Risk:** Low

---

### Option 3: Content Security Policy (CSP)

**Approach:** Add strict CSP headers to prevent inline script execution

**Pros:**
- Browser-level protection
- Catches missed sanitization
- Standard security header

**Cons:**
- May break legitimate functionality
- Requires careful configuration
- Not a complete solution alone

**Effort:** 2-3 hours

**Risk:** Medium (may break things)

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_components/complete-phase.tsx` - Renders report markdown
- `apps/web/app/home/(user)/_components/markdown-components.tsx` - Custom markdown renderer
- `apps/web/app/home/(user)/_lib/use-sparlo.ts` - localStorage read/write

**Current protections:**
- React's default escaping
- `react-markdown` may have built-in sanitization (verify)

**Areas to check:**
- Any `dangerouslySetInnerHTML` usage
- Link href attributes (javascript: protocol)
- Image src attributes

## Resources

- **DOMPurify:** https://github.com/cure53/DOMPurify
- **React XSS Prevention:** https://legacy.reactjs.org/docs/introducing-jsx.html#jsx-prevents-injection-attacks
- **OWASP XSS Prevention:** https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

## Acceptance Criteria

- [ ] All user-controlled content sanitized before render
- [ ] Markdown output sanitized with allowed tag list
- [ ] localStorage data validated/sanitized on read
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] href attributes validated (no javascript: protocol)
- [ ] CSP header added (optional enhancement)
- [ ] XSS test cases pass

## Work Log

### 2025-12-15 - Initial Discovery

**By:** Claude Code (Security Review Agent)

**Actions:**
- Traced data flow from API to render
- Identified localStorage as persistence layer
- Checked for dangerouslySetInnerHTML usage
- Reviewed markdown rendering approach

**Learnings:**
- React provides good baseline XSS protection
- Markdown rendering is main risk area
- Need to verify react-markdown's sanitization
- DOMPurify is standard solution

## Notes

- Priority is P2 because attack requires specific vectors
- Should verify what react-markdown already sanitizes
- Consider adding CSP as defense-in-depth regardless
- Related to Issue 009 (backend auth) - if backend is compromised, this becomes more important
