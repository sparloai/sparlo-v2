---
status: ready
priority: p2
issue_id: "056"
tags: [simplicity, typescript, yagni]
dependencies: []
---

# Over-Engineered Badge Variant System

## Problem Statement

The `badge.tsx` file has extensive validation whitelists (85% of file) that provide minimal value since badge variants come from controlled sources (typed JSON), not user input. This adds complexity without benefit.

**Simplicity Impact:** Unnecessary validation code; obscures actual badge logic.

## Findings

- **File:** `apps/web/app/home/(user)/reports/[id]/_components/report/badge.tsx`
- **Total lines:** 112
- **Core badge logic:** ~15 lines
- **Validation/mapping:** ~85 lines

**Over-engineered validation:**
```typescript
// Lines 54-111 - validation that's rarely useful
const VALID_TRACKS = ['best_fit', 'simpler_path', 'spark'] as const;
const VALID_CONFIDENCE = ['HIGH', 'MEDIUM', 'LOW'] as const;
const VALID_VERDICT = ['GREEN', 'YELLOW', 'RED'] as const;
const VALID_LIKELIHOOD = ['Likely', 'Possible', 'Unlikely'] as const;

export function getTrackVariant(track: string): BadgeVariant {
  if (!VALID_TRACKS.includes(track as Track)) {
    return 'track-simpler'; // Silent fallback - hides data bugs!
  }
  const map: Record<Track, BadgeVariant> = { /* ... */ };
  return map[track as Track];
}
```

**Problems:**
1. Silent fallbacks hide data issues (should throw in dev)
2. Data comes from Zod-validated JSON, already type-safe
3. 85% of file is boilerplate validation
4. Each variant needs 4 functions to use

**Reviewers identifying this:**
- Code Simplicity Review: P1 - Over-engineered badge variant system
- Pattern Recognition: P3 - Inconsistent suffix usage

## Proposed Solutions

### Option 1: Remove Validation, Trust Types

**Approach:** Since data is Zod-validated, trust TypeScript types.

```typescript
// Simplified badge.tsx
type BadgeVariant = /* ... existing ... */;

const variantStyles: Record<BadgeVariant, string> = { /* ... */ };

export function Badge({ variant, children, className }: BadgeProps) {
  return <span className={cn(variantStyles[variant], className)}>{children}</span>;
}

// Simple mapping (no runtime validation)
export const trackVariants = {
  best_fit: 'track-best-fit',
  simpler_path: 'track-simpler',
  spark: 'track-spark',
} as const;

// Usage: trackVariants[concept.track]
```

**Pros:**
- 80% less code
- Clearer intent
- TypeScript catches mismatches at compile time

**Cons:**
- No runtime validation (acceptable if Zod validates upstream)

**Effort:** 30 minutes

**Risk:** Very Low

---

### Option 2: Development-Only Validation

**Approach:** Add validation only in development builds.

```typescript
export function getTrackVariant(track: string): BadgeVariant {
  if (process.env.NODE_ENV === 'development') {
    if (!VALID_TRACKS.includes(track as Track)) {
      console.error(`Invalid track: ${track}`);
    }
  }
  return trackVariants[track as keyof typeof trackVariants] ?? 'track-simpler';
}
```

**Pros:**
- Catches bugs in dev
- Tree-shaken in production
- Keeps fallback behavior

**Cons:**
- Still some complexity
- Console errors not ideal

**Effort:** 45 minutes

**Risk:** Low

## Recommended Action

Implement Option 1 (trust types):

1. Remove validation whitelists
2. Keep simple mapping objects
3. Let TypeScript enforce correctness
4. Trust Zod validation at data ingestion

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/reports/[id]/_components/report/badge.tsx`

**Code to remove (lines 54-111):**
- `VALID_TRACKS`, `VALID_CONFIDENCE`, `VALID_VERDICT`, `VALID_LIKELIHOOD` constants
- `Track`, `Confidence`, `Verdict`, `Likelihood` type aliases
- `getTrackVariant`, `getConfidenceVariant`, `getVerdictVariant`, `getLikelihoodVariant` functions

**Code to keep:**
- `BadgeVariant` type
- `variantStyles` mapping
- `Badge` component

**Replacement approach:**
```typescript
// Simple const objects for mapping
export const TRACK_TO_VARIANT = {
  best_fit: 'track-best-fit',
  simpler_path: 'track-simpler',
  spark: 'track-spark',
} as const;

// Usage in components
<Badge variant={TRACK_TO_VARIANT[concept.track]}>
```

## Acceptance Criteria

- [ ] Validation functions removed
- [ ] Simple mapping objects remain
- [ ] Badge component unchanged
- [ ] Consuming components updated
- [ ] TypeScript compiles without errors
- [ ] File under 50 lines

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Parallel Review Agents)

**Actions:**
- Identified by Code Simplicity reviewer as P1
- Analyzed lines of code ratio (15% useful, 85% validation)
- Traced data source to Zod-validated JSON

**Learnings:**
- Double validation (Zod + runtime) adds no value
- Silent fallbacks hide bugs
- Trust the type system when data is validated upstream
