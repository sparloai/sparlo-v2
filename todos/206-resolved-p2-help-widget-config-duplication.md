---
status: pending
priority: p2
issue_id: 206
tags: [code-review, architecture, help-center]
dependencies: []
---

# Escalation Marker Defined in Two Places

## Problem Statement

The escalation marker constant is defined in two separate locations. If one is updated and not the other, escalation breaks silently.

## Findings

**Location 1**: `apps/web/lib/help/config.ts` (line 9)
```typescript
ESCALATION_MARKER: '__SYSTEM_ESCALATE_7a8b9c__'
```

**Location 2**: `apps/web/lib/rag/prompt-builder.ts` (line 7)
```typescript
const ESCALATION_MARKER = '__SYSTEM_ESCALATE_7a8b9c__';
```

## Proposed Solutions

### Solution A: Import from Config (Recommended)
**Pros**: Single source of truth, type-safe
**Cons**: None
**Effort**: Small (5 min)
**Risk**: None

```typescript
// prompt-builder.ts
import { HELP_CENTER_CONFIG } from '~/lib/help/config';
const { ESCALATION_MARKER } = HELP_CENTER_CONFIG;
```

## Technical Details

- **Affected Files**: `apps/web/lib/rag/prompt-builder.ts`
- **Components**: System prompt builder
- **Database Changes**: None

## Acceptance Criteria

- [ ] prompt-builder imports ESCALATION_MARKER from config
- [ ] Local constant removed from prompt-builder
- [ ] Escalation detection still works

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Architecture review finding |

## Resources

- Agent: architecture-strategist review
