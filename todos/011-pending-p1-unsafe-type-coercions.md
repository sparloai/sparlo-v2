---
status: pending
priority: p1
issue_id: "011"
tags: [typescript, type-safety, frontend]
dependencies: []
---

# Unsafe Type Coercions Using `as unknown as T`

Six instances of unsafe double-casting (`as unknown as T`) pattern that bypass TypeScript's type system.

## Problem Statement

The codebase contains multiple instances of the `as unknown as T` pattern, which completely bypasses TypeScript's type checking. This can hide runtime errors and makes the code brittle to refactoring.

**Severity:** P1 - Type safety violations that can cause runtime errors

## Findings

- **File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`

**Identified instances:**

1. **Line ~180**: Response data casting
```typescript
const data = await response.json() as unknown as ApiResponse;
```

2. **Line ~245**: Report data casting
```typescript
const report = json.data as unknown as ReportData;
```

3. **Line ~320**: Conversation casting
```typescript
const conv = result as unknown as Conversation;
```

4. **Line ~450**: Error response casting
```typescript
const errorData = await response.json() as unknown as ErrorResponse;
```

5. **Line ~580**: Status response casting
```typescript
const status = data as unknown as StatusResponse;
```

6. **Line ~720**: Clarification casting
```typescript
const clarification = parsed as unknown as ClarificationQuestion;
```

**Pattern analysis:**
- All instances are for API response data
- No runtime validation of the casted data
- If API changes shape, errors will be silent/cryptic

## Proposed Solutions

### Option 1: Add Zod Runtime Validation

**Approach:** Define Zod schemas for all API responses, validate before use

**Pros:**
- Runtime type safety
- Clear error messages when API changes
- Auto-generates TypeScript types
- Already used elsewhere in codebase

**Cons:**
- More code
- Small runtime overhead
- Schema must stay in sync with API

**Effort:** 3-4 hours

**Risk:** Low

**Implementation:**
```typescript
import { z } from 'zod';

const ReportDataSchema = z.object({
  report_markdown: z.string(),
  title: z.string(),
  // ... other fields
});

type ReportData = z.infer<typeof ReportDataSchema>;

// Usage:
const report = ReportDataSchema.parse(json.data); // Throws if invalid
```

---

### Option 2: Type Guard Functions

**Approach:** Create type guard functions that validate shape at runtime

**Pros:**
- No external dependencies
- TypeScript understands narrowing
- Can be gradual adoption

**Cons:**
- Manual validation code
- Must maintain separately from types
- Less comprehensive than Zod

**Effort:** 2-3 hours

**Risk:** Low

**Implementation:**
```typescript
function isReportData(data: unknown): data is ReportData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'report_markdown' in data &&
    typeof (data as ReportData).report_markdown === 'string'
  );
}

// Usage:
if (!isReportData(json.data)) {
  throw new Error('Invalid report data structure');
}
const report = json.data; // TypeScript knows it's ReportData
```

---

### Option 3: Shared API Types Package

**Approach:** Create shared types package between frontend and backend

**Pros:**
- Single source of truth
- Compile-time guarantee of alignment
- Enables code generation

**Cons:**
- Infrastructure change
- Requires backend to use TypeScript types
- More complex build

**Effort:** 6-8 hours

**Risk:** Medium

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/use-sparlo.ts` - 6 instances
- `apps/web/app/home/(user)/_lib/api.ts` - May have additional instances
- `apps/web/app/home/(user)/_lib/types.ts` - Type definitions

**Existing patterns:**
- Zod is already in the project dependencies
- Some API routes use Zod for request validation
- Backend uses Pydantic (Python equivalent)

## Resources

- **Zod Documentation:** https://zod.dev/
- **TypeScript Type Guards:** https://www.typescriptlang.org/docs/handbook/2/narrowing.html

## Acceptance Criteria

- [ ] All 6 `as unknown as T` instances replaced with safe alternatives
- [ ] Runtime validation throws clear errors on invalid data
- [ ] TypeScript types derived from validation schemas
- [ ] No new `as unknown as` patterns introduced
- [ ] Type errors caught in development, not production
- [ ] All tests pass with new validation

## Work Log

### 2025-12-15 - Initial Discovery

**By:** Claude Code (TypeScript Review Agent)

**Actions:**
- Searched for `as unknown as` pattern across codebase
- Identified 6 instances in use-sparlo.ts
- Analyzed what each casting is doing
- Evaluated Zod vs type guard approaches

**Learnings:**
- All instances are API response handling
- Pattern likely copied from initial implementation
- Zod already available - Option 1 is natural fit
- Backend uses Pydantic which could inform schema design

## Notes

- Consider generating TypeScript types from Pydantic models in future
- This issue is blocking proper error handling - we don't know if errors are from API changes vs bugs
- Related: Issue 011 mentions 3 overly broad `Record<string, unknown>` types
