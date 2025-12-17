---
status: ready
priority: p2
issue_id: "038"
tags: [code-simplicity, dry, constants]
dependencies: []
---

# Consolidate Duplicate PHASES Constant

PHASES constant is duplicated across 4 files - violates DRY principle.

## Problem Statement

The same PHASES array (AN0-AN5 phase definitions) is duplicated in:
1. `processing-screen.tsx`
2. `report-display.tsx`
3. `generate-report.ts`
4. `use-report-progress.ts`

Changes to phase definitions require updating 4 files. Easy to introduce inconsistencies.

## Findings

- 4 separate files with identical `PHASES` constant
- Each has phase name, description, and progress percentage
- Inconsistency risk: one file updated, others forgotten

## Proposed Solutions

### Option 1: Extract to Shared Constants File (Recommended)

**Approach:** Create single source of truth.

```typescript
// lib/constants/phases.ts
export const PHASES = [
  { id: 'AN0', name: 'Problem Framing', progress: 0 },
  { id: 'AN1.5', name: 'Teaching Selection', progress: 15 },
  // ...
] as const;
```

**Effort:** 30 minutes

## Acceptance Criteria

- [ ] Single PHASES constant in shared location
- [ ] All 4 files import from shared constant
- [ ] No duplicate phase definitions
