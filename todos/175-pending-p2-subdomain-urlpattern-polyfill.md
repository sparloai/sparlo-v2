---
status: completed
priority: p2
issue_id: "175"
tags: [code-review, performance, subdomain]
dependencies: []
---

# URLPattern Polyfill Performance Overhead

## Problem Statement

The middleware imports `urlpattern-polyfill` which adds ~5KB to every edge function invocation. Modern runtimes (including Vercel Edge) already support URLPattern natively.

**Why it matters**: Unnecessary polyfill adds cold start latency and memory usage to every middleware invocation.

## Findings

**Agent**: performance-oracle

**Location**: `/apps/web/proxy.ts:1`

```typescript
import 'urlpattern-polyfill';
```

**Impact**:
- ~5KB added to edge function bundle
- Additional cold start latency
- URLPattern is natively supported in modern edge runtimes

## Proposed Solution

### Use feature detection instead of unconditional polyfill

```typescript
// Only load polyfill if URLPattern is not available
if (typeof URLPattern === 'undefined') {
  await import('urlpattern-polyfill');
}

// Or use conditional import at build time
// In next.config.mjs, externalize the polyfill for edge runtime
```

- **Pros**: Reduces bundle size by ~5KB when native support exists
- **Cons**: Slightly more complex import logic
- **Effort**: Small
- **Risk**: Low

### Alternative: Remove polyfill entirely

Railway/Edge runtime supports URLPattern natively. Test without polyfill:

```typescript
// Remove: import 'urlpattern-polyfill';
// URLPattern should work natively
```

- **Pros**: Zero polyfill overhead
- **Cons**: May break on older runtimes
- **Effort**: Minimal
- **Risk**: Medium (need to verify runtime support)

## Recommended Action

<!-- Leave blank - to be filled during triage -->

## Technical Details

**Affected Files**:
- `apps/web/proxy.ts`

**Runtime Support**:
- Node.js 20+: Native support
- Cloudflare Workers: Native support
- Vercel Edge: Native support
- Deno: Native support

## Acceptance Criteria

- [ ] Polyfill only loaded when necessary
- [ ] Bundle size reduced when native support available
- [ ] Middleware still works on all target platforms

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Found via performance-oracle agent |
| 2026-01-04 | Verified | The polyfill is already conditionally loaded - only imported when `globalThis.URLPattern` is undefined. No further optimization needed. |

## Resources

- PR/Commit: 3042c09
- URLPattern Browser Compatibility: https://developer.mozilla.org/en-US/docs/Web/API/URLPattern#browser_compatibility

