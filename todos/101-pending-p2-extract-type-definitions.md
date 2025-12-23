---
status: pending
priority: p2
issue_id: "101"
tags:
  - code-review
  - architecture
  - typescript
  - simplification
dependencies: []
---

# Extract Type Definitions from Hybrid Report Display

## Problem Statement

The hybrid report display component contains 300+ lines of inline TypeScript interface definitions that should be extracted to a separate file.

## Findings

- **File:** `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`
- **Lines:** 44-500+
- **Agent:** Code Simplicity Reviewer, Architecture Strategist

**Issues:**
- 50+ interfaces defined inline
- Deeply nested optional properties
- No type reuse possible
- Maintenance burden

## Proposed Solutions

### Option A: Extract to Types File (Recommended)
**Pros:** Clean separation, reusable types
**Cons:** None significant
**Effort:** 1-2 hours
**Risk:** Low

```typescript
// Create: apps/web/app/home/(user)/reports/[id]/_lib/types/hybrid-report.types.ts
export interface ExecutionTrack { ... }
export interface InnovationPortfolio { ... }
export interface ProblemAnalysis { ... }

// In hybrid-report-display.tsx:
import type { ExecutionTrack, InnovationPortfolio } from '../_lib/types/hybrid-report.types';
```

### Option B: Zod Schema-Driven Types
**Pros:** Runtime validation, single source of truth
**Cons:** More setup
**Effort:** 3-4 hours
**Risk:** Medium

## Technical Details

### Affected Files
- `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`
- New: `apps/web/app/home/(user)/reports/[id]/_lib/types/hybrid-report.types.ts`

### LOC Savings
~300 lines extracted from component file

## Acceptance Criteria

- [ ] All types extracted to separate file
- [ ] Types are properly exported and imported
- [ ] No duplicate type definitions
- [ ] TypeScript compilation passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-23 | Created from simplification review | - |

## Resources

- PR: Current uncommitted changes
- Related: Code Simplicity Reviewer, Architecture Strategist findings
