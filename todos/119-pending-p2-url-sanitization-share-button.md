---
status: completed
priority: p2
issue_id: "119"
tags: [code-review, security, data-leakage]
dependencies: []
---

# URL Information Leakage via Share Button

## Problem Statement

The Share button uses `window.location.href` without sanitization, which may leak sensitive information like session tokens, debug parameters, or internal staging URLs.

**Why it matters:**
- Session tokens or auth tokens in URL could be shared externally
- Internal development/staging URLs exposed
- Analytics/tracking parameters leak to third parties
- Hash fragments containing sensitive application state shared

## Findings

**Location:** `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx` (Lines 408-410)

**Current Code:**
```tsx
navigator.share({
  title: title || normalizedData.title || 'Report',
  url: window.location.href,  // ⚠️ No sanitization
});
```

**Potential leak scenarios:**
```
# Scenario 1: URL parameters with tracking tokens
https://app.example.com/reports/123?utm_source=internal&session_id=abc123

# Scenario 2: Hash fragments with sensitive state
https://app.example.com/reports/123#access_token=bearer_xyz

# Scenario 3: Internal staging/dev URLs
https://staging-pr-456.vercel.app/reports/123?preview_token=secret
```

**Comparison:** The existing `share-modal.tsx` uses server-generated share links, which is safer.

## Proposed Solutions

### Solution 1: Sanitize URL (Recommended)
```tsx
const getCleanUrl = () => {
  const url = new URL(window.location.href);
  return `${url.origin}${url.pathname}`;
};

// Usage
url: getCleanUrl(),
```
- **Pros:** Simple, removes query params and hash
- **Cons:** Loses legitimate URL state
- **Effort:** Small (10 min)
- **Risk:** Low

### Solution 2: Use server-generated share links
```tsx
const { shareUrl } = await generateShareLink({ reportId });
navigator.share({ title, url: shareUrl });
```
- **Pros:** Most secure, canonical URLs, trackable
- **Cons:** Requires server round-trip
- **Effort:** Medium (30 min)
- **Risk:** Low

## Recommended Action

Implement Solution 1 for quick win, consider Solution 2 for production-grade implementation.

## Technical Details

**Affected Files:**
- `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx`

## Acceptance Criteria

- [ ] Shared URLs don't contain query parameters
- [ ] Shared URLs don't contain hash fragments
- [ ] Canonical report URLs are shared

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-29 | Created from code review | Security-sentinel agent identified potential data leakage |
| 2025-12-29 | Implemented Solution 1 | Added getCleanShareUrl() function to strip query params and hash |

## Resources

- PR: ca43470
- Related: `apps/web/app/home/(user)/reports/[id]/_components/share-modal.tsx` (uses server-generated URLs)
