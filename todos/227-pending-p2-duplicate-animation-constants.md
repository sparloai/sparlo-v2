---
status: pending
priority: p2
issue_id: "227"
tags:
  - code-review
  - animation
  - duplication
  - architecture
dependencies: []
---

# Duplicate Animation Constants Files

## Problem Statement

Two separate files define animation constants with overlapping but inconsistent values. This creates confusion about which source to use and results in visually inconsistent animations across the application.

**Why it matters**: Components importing from different files will have different animation timings, creating a inconsistent user experience. Developers don't know which file is authoritative.

## Findings

### Evidence

**File 1**: `/apps/web/app/app/_lib/animation.ts` (159 lines)
- Comprehensive, newer implementation
- Uses milliseconds
- Has `EASE`, `SPRING`, `STAGGER` with detailed configs

**File 2**: `/apps/web/app/app/_lib/animation-constants.ts` (37 lines)
- Older, simpler implementation
- Uses seconds
- Has `EASING`, `STAGGER` with basic configs

### Conflicting Values

| Constant | animation.ts | animation-constants.ts |
|----------|-------------|----------------------|
| `DURATION.fast` | 150 (ms) | 0.15 (s) |
| `DURATION.normal` | 200 (ms) | 0.3 (s) |
| `EASING.easeOut` | `[0.25, 1, 0.5, 1]` | `[0, 0, 0.2, 1]` |
| `STAGGER.normal` | 0.04 | 0.08 |

### Files Using Each

**animation.ts** (newer):
- `apps/web/app/app/template.tsx`
- `apps/web/components/ui/animated-tabs.tsx`
- `apps/web/lib/hooks/use-adaptive-spring.ts`

**animation-constants.ts** (older):
- `apps/web/app/app/_components/animated-reports-list.tsx`
- `apps/web/app/app/_components/page-transition.tsx`

### Agent Reports

- **Pattern Recognition**: "CRITICAL: Duplicate Animation Constants - Two files define animation constants with overlapping but inconsistent values"
- **Architecture Strategist**: "CRITICAL: Duplicate animation constants - Components import from different files creating inconsistent behavior"

## Proposed Solutions

### Solution 1: Consolidate to animation.ts (Recommended)
**Description**: Delete `animation-constants.ts` and update all imports to use `animation.ts`.

**Pros**:
- Single source of truth
- More comprehensive API
- Better type safety

**Cons**:
- Requires updating imports in several files
- May need to adjust values for consistency

**Effort**: Medium (1 hour)
**Risk**: Low

**Steps**:
1. Update `animated-reports-list.tsx` imports
2. Update `page-transition.tsx` imports
3. Map old constant names to new ones (e.g., `EASING` → `EASE`)
4. Delete `animation-constants.ts`
5. Run tests to verify animations work

### Solution 2: Merge Files
**Description**: Combine unique parts of both files into one.

**Pros**:
- Preserves all existing values
- No breaking changes

**Cons**:
- May keep redundant values
- Still need to update imports

**Effort**: Medium (1 hour)
**Risk**: Low

### Solution 3: Deprecate and Migrate Gradually
**Description**: Mark old file as deprecated, migrate over time.

**Pros**:
- Lower risk of breaking changes
- Can be done incrementally

**Cons**:
- Duplication persists longer
- May be forgotten

**Effort**: Small initially, ongoing
**Risk**: Medium (may stall)

## Recommended Action

<!-- Leave blank - to be filled during triage -->

## Technical Details

### Affected Files
- `apps/web/app/app/_lib/animation.ts` (KEEP)
- `apps/web/app/app/_lib/animation-constants.ts` (DELETE)
- `apps/web/app/app/_components/animated-reports-list.tsx` (UPDATE IMPORTS)
- `apps/web/app/app/_components/page-transition.tsx` (UPDATE IMPORTS)

### Import Mapping
```typescript
// Old → New
EASING.easeOut → EASE.out
DURATION.fast → DURATION.fast
STAGGER.normal → STAGGER.normal
```

### Testing Required
- Verify all animations still work after consolidation
- Visual regression testing on animated components

## Acceptance Criteria

- [ ] Single animation constants file exists
- [ ] All components import from the same file
- [ ] No duplicate constant definitions
- [ ] Animations visually consistent across app

## Work Log

| Date | Action | Outcome | Learnings |
|------|--------|---------|-----------|
| 2026-01-09 | Code review identified | Found duplicate files | Need single source of truth |

## Resources

- See existing todo: `055-ready-p2-animation-constants-duplication.md`
