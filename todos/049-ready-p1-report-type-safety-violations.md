---
status: ready
priority: p1
issue_id: "049"
tags: [typescript, type-safety, report-display]
dependencies: []
---

# Unsafe Type Assertions in Report Display

## Problem Statement

The report-display.tsx component uses unsafe `as` type assertions that bypass TypeScript's type safety. If `report.report_data` is `null`, the code lies to TypeScript and could cause runtime errors.

## Findings

**File:** `/apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx`
**Lines:** 114, 120

```typescript
// Current unsafe pattern:
const structuredReport = useMemo(() => {
  return extractStructuredReport(
    report.report_data as Record<string, unknown>,  // Line 114
  );
}, [report.report_data]);

const userInput = useMemo(() => {
  return extractUserInput(
    report.report_data as Record<string, unknown>,  // Line 120
    report.title,
  );
}, [report.report_data, report.title]);
```

- Using `as` type assertions bypasses TypeScript's type checking
- If `report.report_data` is `null` (which the type allows), this will cause runtime errors
- The extract functions should handle null internally rather than relying on type assertions

## Proposed Solutions

### Option 1: Add Null Checks Before Extraction

**Approach:** Add explicit null checks and update extract functions to accept nullable types.

```typescript
const structuredReport = useMemo(() => {
  if (!report.report_data) return null;
  return extractStructuredReport(report.report_data);
}, [report.report_data]);
```

**Pros:**
- Simple fix
- Preserves existing function signatures
- Type-safe

**Cons:**
- Requires null checks in multiple places

**Effort:** 1-2 hours

**Risk:** Low

---

### Option 2: Update Extract Functions to Handle Null

**Approach:** Update `extractStructuredReport` and `extractUserInput` to accept `ReportData | null` directly.

**Pros:**
- Single source of truth for null handling
- Cleaner call sites
- Better encapsulation

**Cons:**
- Requires updating function signatures and tests

**Effort:** 2-3 hours

**Risk:** Low

## Recommended Action

Implement Option 2 - update the extract functions to properly handle nullable inputs. This provides better type safety and encapsulation.

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx:114,120`
- `apps/web/app/home/(user)/reports/[id]/_lib/extract-report.ts`

**Related components:**
- StructuredReport component
- UserInput display

## Acceptance Criteria

- [ ] Remove all `as Record<string, unknown>` type assertions
- [ ] Update extract functions to accept nullable types
- [ ] Add proper null handling inside extract functions
- [ ] Typecheck passes with strict mode
- [ ] No runtime errors when report_data is null

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Multi-Agent Review)

**Actions:**
- Kieran TypeScript Review identified unsafe type assertions
- Flagged as critical type safety violation
- Documented lines and proposed solutions

**Learnings:**
- Type assertions should be avoided in favor of proper type guards
- Extract functions should be defensive about input types
