---
status: pending
priority: p3
issue_id: "155"
tags: [code-quality, dd-mode, schemas, simplification]
dependencies: []
---

# DD Mode v2: Schema Simplification Opportunity

## Problem Statement

DD Mode schemas span 1,713 lines with exhaustive Zod validation that provides limited actual safety. Since Claude either returns valid JSON or fails, the detailed validation adds maintenance burden without corresponding benefit. Potential to reduce by ~1,300 lines (76%).

## Findings

**Current approach (verbose):**
```typescript
// 35+ lines to validate one object
problem_extraction: z.object({
  business_framing: z.string(),
  engineering_framing: z.string(),
  constraints_stated: z.array(z.string()),
  constraints_implied: z.array(z.string()),
  success_metrics_stated: z.array(z.string()),
  success_metrics_implied: z.array(z.string()),
  problem_statement_for_analysis: z.string(),
}),
```

**Proposed (minimal):**
```typescript
// 3 lines for what we actually need
problem_extraction: z.object({
  problem_statement_for_analysis: z.string(), // Only field used downstream
}).passthrough(), // Allow other fields without validation
```

**Estimated savings:**
- Current: 1,713 lines
- Proposed: ~400 lines
- Reduction: ~1,300 lines (76%)

## Proposed Solutions

### Option A: Minimal Validation with Passthrough
- Only validate fields actually used downstream
- Use `.passthrough()` for other fields
- Pros: Major LOC reduction, same runtime safety
- Cons: Less documentation of structure
- Effort: High (6-8 hours)
- Risk: Medium

## Acceptance Criteria

- [ ] Schemas reduced to ~400 lines
- [ ] Only downstream-used fields validated
- [ ] Reports still generate correctly
- [ ] TypeScript types still work
- [ ] Tests pass

## Work Log

### 2026-01-03 - Issue Created

**By:** Claude Code

**Actions:**
- Identified during DD Mode v2 code simplicity review
- Analyzed schema usage patterns
- Calculated potential reduction
