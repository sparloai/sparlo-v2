---
status: ready
priority: p2
issue_id: "039"
tags: [patterns, error-handling, consistency]
dependencies: []
---

# Standardize Error Handling Pattern in Server Actions

Server actions have 3 different error handling patterns - should be consistent.

## Problem Statement

Different server actions handle errors differently:
1. `createReport`: throws Error directly
2. `updateReport`: returns `{ error: string }`
3. `answerClarification`: returns `{ error: parsed.error.flatten() }`

Consumers don't know what to expect. Inconsistent client-side error handling.

## Findings

- File: `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`
- Three distinct error return patterns
- No standardized error type/interface

## Proposed Solutions

### Option 1: Standardize on Result Type (Recommended)

**Approach:** All actions return `{ success: boolean, data?: T, error?: string }`.

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export const createReport = enhanceAction(
  async (data): Promise<ActionResult<{ reportId: string }>> => {
    try {
      // ... implementation
      return { success: true, data: { reportId: report.id } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
);
```

**Effort:** 2-3 hours

## Acceptance Criteria

- [ ] Standard ActionResult type created
- [ ] All server actions return ActionResult
- [ ] Client code updated to handle consistent format
- [ ] Error messages are user-friendly
