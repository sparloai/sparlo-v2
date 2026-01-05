---
status: pending
priority: p1
issue_id: "158"
tags: [code-review, architecture, nextjs, rsc, analytics]
dependencies: []
---

# 'use client' Directive in Shared Analytics Package

## Problem Statement

The `'use client'` directive at the top of `posthog-client-service.ts` creates a client boundary that contaminates the entire analytics package, preventing proper server/client separation in Next.js 16.

**Why it matters:**
- Any RSC importing `@kit/analytics` becomes a client component
- Bundle bloat - PostHog included even when only server tracking needed
- Breaks the dual-entry point architecture (index.ts vs server.ts)
- Tree-shaking fails for unused client code

## Findings

### Architecture Strategist Agent
- `'use client'` at package level forces all imports to be client-side
- Server-side code cannot safely import from `@kit/analytics`
- Separation between `index.ts` and `server.ts` is compromised

**Evidence:**
```typescript
// packages/analytics/src/posthog-client-service.ts:1
'use client';  // ← Forces client boundary

// packages/analytics/src/index.ts:3
import { PostHogClientService } from './posthog-client-service';  // ← Pulls in client directive
```

## Proposed Solutions

### Option A: Separate client/server entry points (Recommended)
**Pros:** Clean separation, proper tree-shaking, Next.js best practice
**Cons:** Requires restructuring exports
**Effort:** Medium (3-4 hours)
**Risk:** Low

```
packages/analytics/src/
├── index.ts              # Re-exports only (no 'use client')
├── client.ts             # 'use client' - browser analytics
├── server.ts             # 'server-only' - node analytics
├── providers/
│   ├── posthog/
│   │   ├── client.ts     # 'use client'
│   │   └── server.ts     # 'server-only'
```

### Option B: Keep 'use client' but document limitation
**Pros:** No code changes
**Cons:** Permanent architectural limitation
**Effort:** None
**Risk:** High (tech debt)

## Recommended Action

Option A - Restructure package with proper client/server separation.

## Technical Details

**Affected Files:**
- `packages/analytics/src/posthog-client-service.ts` (move to `providers/posthog/client.ts`)
- `packages/analytics/src/index.ts` (remove PostHog import)
- `packages/analytics/src/client.ts` (new file)
- `packages/analytics/package.json` (update exports)

**New package.json exports:**
```json
{
  "exports": {
    ".": "./src/index.ts",
    "./client": "./src/client.ts",
    "./server": "./src/server.ts"
  }
}
```

## Acceptance Criteria

- [ ] `@kit/analytics` can be imported in RSC without error
- [ ] `@kit/analytics/client` provides browser analytics
- [ ] `@kit/analytics/server` provides server-side analytics
- [ ] No 'use client' directive in main entry point
- [ ] TypeScript types work correctly for all entry points

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | RSC compatibility issue identified |

## Resources

- Next.js client components: https://nextjs.org/docs/app/building-your-application/rendering/client-components
- Package exports: https://nodejs.org/api/packages.html#package-entry-points
