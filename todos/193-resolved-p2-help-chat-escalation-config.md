---
status: resolved
priority: p2
issue_id: 193
tags: [code-review, architecture, help-chat]
dependencies: []
---

# Centralize Escalation Marker Configuration

## Problem Statement

The escalation marker `__SYSTEM_ESCALATE_7a8b9c__` is duplicated across files with no centralized configuration. Magic strings and constants are scattered, making changes error-prone.

**Impact:** Maintenance burden, risk of mismatch between files, harder to test.

## Findings

**Duplicate Locations:**
1. `apps/web/app/api/help/chat/route.ts:14` - `const ESCALATION_MARKER = '__SYSTEM_ESCALATE_7a8b9c__'`
2. `apps/web/lib/rag/prompt-builder.ts:7` - Same marker in prompt instructions

**Other Scattered Constants:**
- `STREAM_TIMEOUT_MS = 30000` (route.ts:16)
- `MAX_RESPONSE_BYTES = 50000` (route.ts:17)
- `MARKER_LENGTH` derived at runtime (route.ts:134)

## Proposed Solutions

### Option A: Create Centralized Config (Recommended)

**Pros:** Single source of truth, environment-aware, type-safe
**Cons:** Additional file
**Effort:** Small (1 hour)
**Risk:** None

```typescript
// lib/help/config.ts
export const HELP_CENTER_CONFIG = {
  // Escalation
  ESCALATION_MARKER: '__SYSTEM_ESCALATE_7a8b9c__',

  // Streaming limits
  STREAM_TIMEOUT_MS: 30000,
  MAX_RESPONSE_BYTES: 50000,

  // Rate limits
  RATE_LIMITS: {
    CHAT_PER_HOUR: 20,
    TICKETS_PER_DAY: 5,
  },

  // RAG
  RAG_TOP_K: 5,
  RAG_FUZZY_THRESHOLD: 0.3,
} as const;

export type HelpCenterConfig = typeof HELP_CENTER_CONFIG;

// Derived constants
export const MARKER_LENGTH = HELP_CENTER_CONFIG.ESCALATION_MARKER.length;
```

**Usage:**
```typescript
import { HELP_CENTER_CONFIG, MARKER_LENGTH } from '~/lib/help/config';

// In route.ts
if (buffer.includes(HELP_CENTER_CONFIG.ESCALATION_MARKER)) { ... }

// In prompt-builder.ts
`Output: ${HELP_CENTER_CONFIG.ESCALATION_MARKER}`
```

## Recommended Action

<!-- To be filled during triage -->

## Technical Details

**Affected Files:**
- New: `apps/web/lib/help/config.ts`
- Update: `apps/web/app/api/help/chat/route.ts`
- Update: `apps/web/lib/rag/prompt-builder.ts`

## Acceptance Criteria

- [ ] Single config file for all Help Center constants
- [ ] No duplicate marker definitions
- [ ] Existing functionality unchanged
- [ ] TypeScript types exported for config

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from architecture review | Magic strings should be centralized |

## Resources

- Pattern: See `config/` directory for existing config patterns
