---
status: pending
priority: p3
issue_id: "019"
tags: [typescript, type-safety, frontend]
dependencies: ["011"]
---

# Replace Overly Broad Record<string, unknown> Types

Three instances of `Record<string, unknown>` should have more specific type definitions.

## Problem Statement

Using `Record<string, unknown>` loses type safety benefits:
- No autocomplete for valid keys
- No type checking for values
- Runtime errors instead of compile-time errors

**Severity:** P3 - Type safety improvement

## Findings

- **File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`

**Identified instances:**

1. **API response metadata:**
```typescript
// Current
const metadata: Record<string, unknown> = response.metadata;

// Should be
interface ResponseMetadata {
  timestamp: string;
  requestId: string;
  // ... specific fields
}
```

2. **Error details:**
```typescript
// Current
const errorDetails: Record<string, unknown> = error.details;

// Should be
interface ErrorDetails {
  code: string;
  message: string;
  field?: string;
}
```

3. **Configuration options:**
```typescript
// Current
const config: Record<string, unknown> = options;

// Should be
interface SparloConfig {
  timeout?: number;
  retries?: number;
  // ... specific options
}
```

## Proposed Solutions

### Option 1: Define Specific Interfaces

**Approach:** Create typed interfaces for each usage

**Pros:**
- Full type safety
- Clear documentation
- IDE support

**Cons:**
- Must maintain interfaces
- More code

**Effort:** 1-2 hours

**Risk:** Low

**Implementation:**
```typescript
// types.ts
interface ApiResponseMetadata {
  timestamp: string;
  requestId: string;
  processingTime?: number;
}

interface ApiErrorDetails {
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

interface SparloConfig {
  timeout?: number;
  retries?: number;
  pollingInterval?: number;
}
```

---

### Option 2: Use Zod Inferred Types

**Approach:** Define Zod schemas, infer TypeScript types

**Pros:**
- Runtime validation included
- Single source of truth
- Already have Zod (Issue 011)

**Cons:**
- Coupled to Zod
- Schema must be accurate

**Effort:** 2-3 hours (can combine with Issue 011)

**Risk:** Low

---

### Option 3: Generic with Constraints

**Approach:** Use generic with type constraints

**Pros:**
- Flexible
- Partial type safety
- Minimal changes

**Cons:**
- Less precise than specific types
- Still somewhat loose

**Effort:** 30 minutes

**Risk:** Low

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/use-sparlo.ts`
- `apps/web/app/home/(user)/_lib/types.ts`

**Dependencies:**
- Should be done with or after Issue 011 (unsafe type coercions)
- If using Zod approach, combine with Issue 011

## Resources

- **TypeScript Record Type:** https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type
- **Index Signatures vs Mapped Types:** https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html

## Acceptance Criteria

- [ ] All `Record<string, unknown>` replaced with specific types
- [ ] Types accurately reflect actual data shape
- [ ] IDE provides autocomplete for typed properties
- [ ] No new type errors introduced
- [ ] All tests pass

## Work Log

### 2025-12-15 - Initial Discovery

**By:** Claude Code (TypeScript Review Agent)

**Actions:**
- Searched for `Record<string, unknown>` pattern
- Identified 3 instances
- Analyzed actual data shapes at each location
- Proposed type definitions

**Learnings:**
- All instances are for API-related data
- Should be combined with Issue 011 for consistency
- Zod approach provides most benefit

## Notes

- Quick fix if done standalone
- Better to combine with Issue 011 (Zod validation)
- Lower priority since `Record<string, unknown>` is safer than `any`
- These are internal types, not user-facing
