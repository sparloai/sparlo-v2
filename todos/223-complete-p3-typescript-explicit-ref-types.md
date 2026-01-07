---
status: complete
priority: p3
issue_id: "223"
tags: [code-review, typescript]
dependencies: []
---

# Add Explicit Types to Circuit Breaker Refs

## Problem Statement

Circuit breaker refs use implicit typing while other refs in the file use explicit types. This inconsistency reduces clarity.

## Findings

- `packages/supabase/src/hooks/use-auth-change-listener.ts:296-297`:
  ```typescript
  const redirectCountRef = useRef(0);       // Implicit number
  const lastRedirectTimeRef = useRef(0);    // Implicit number
  ```
- Other refs in file (lines 287-293) use explicit types for clarity

## Proposed Solutions

### Option 1: Add Explicit Types

**Approach:**
```typescript
const redirectCountRef = useRef<number>(0);
const lastRedirectTimeRef = useRef<number>(0);
```

**Effort:** 2 minutes

**Risk:** None

## Acceptance Criteria

- [ ] Refs have explicit type annotations
- [ ] Typecheck passes

## Work Log

### 2026-01-05 - TypeScript Review

**By:** Claude Code (TypeScript Reviewer Agent)

**Actions:**
- Identified inconsistent ref typing
