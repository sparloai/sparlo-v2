---
status: completed
priority: p2
issue_id: 126
tags: [code-review, architecture, chat-components]
dependencies: []
---

# Move CodeBlock to Shared Location

## Problem Statement

The `CodeBlock` component is placed in `/chat/` directory but has zero chat-specific logic. It's a generic syntax highlighter with copy functionality that should be reusable across the application.

**Why it matters**: Cannot reuse in other parts of application (report rendering, documentation, etc.).

## Findings

**Current location**: `/apps/web/app/home/(user)/reports/[id]/_components/chat/code-block.tsx`

**Should be**: `/apps/web/app/home/(user)/reports/_components/shared/code-block.tsx` or `packages/ui/`

**Evidence**: The component only uses:
- react-syntax-highlighter (generic)
- Clipboard API (generic)
- Tailwind styling (generic)

No chat-specific props, state, or logic.

## Proposed Solutions

### Option A: Move to reports shared (Recommended)
```bash
mv chat/code-block.tsx ../../../_components/shared/
# Update imports in chat/index.ts and chat-message.tsx
```

**Pros**: Follows existing codebase pattern (`/reports/_components/shared/` exists)
**Cons**: Minor refactor
**Effort**: 15 minutes
**Risk**: Low

### Option B: Move to packages/ui
```bash
mv code-block.tsx packages/ui/src/makerkit/
```

**Pros**: Maximum reusability across all apps
**Cons**: Larger refactor, package changes
**Effort**: 1 hour
**Risk**: Medium

## Recommended Action

Implement Option A - quick win, follows established pattern.

## Technical Details

**Affected files**:
- `/apps/web/app/home/(user)/reports/[id]/_components/chat/code-block.tsx` (move)
- `/apps/web/app/home/(user)/reports/[id]/_components/chat/index.ts` (update export)
- `/apps/web/app/home/(user)/reports/[id]/_components/chat/chat-message.tsx` (update import)

## Acceptance Criteria

- [ ] CodeBlock moved to shared location
- [ ] All imports updated
- [ ] Barrel export updated
- [ ] Typecheck and lint pass

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-29 | Created from code review | Architecture strategist identified |

## Resources

- Commit: 91f42b1
