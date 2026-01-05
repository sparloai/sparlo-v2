---
status: pending
priority: p3
issue_id: "188"
tags: [pdf, docraptor, simplification, code-quality]
dependencies: []
---

# P3: Remove Unnecessary Concurrency Control (YAGNI)

## Problem Statement

The module-level concurrency control (`activeRequests`, `acquireSlot()`, `releaseSlot()`) was designed for Puppeteer's browser memory management. With DocRaptor (external API), this is meaningless:
- Each container has its own `activeRequests` counter (not shared)
- DocRaptor handles its own capacity
- Rate limiting already limits abuse

## Findings

**File:** `apps/web/app/api/reports/[id]/pdf/route.tsx:18-20, 56-68, 139-144, 304-305`

```typescript
const MAX_CONCURRENT_PDFS = 5;
let activeRequests = 0;  // Module-level state - not shared across containers

function acquireSlot(): boolean { ... }  // ~25 lines of unnecessary code
function releaseSlot(): void { ... }
```

This code adds complexity without providing value for DocRaptor integration.

## Proposed Solutions

### Option 1: Remove Concurrency Control Entirely (Recommended)

Delete `MAX_CONCURRENT_PDFS`, `activeRequests`, `acquireSlot()`, `releaseSlot()`, and the concurrency check in the handler.

**Pros:**
- ~25 lines of code removed
- Simpler, more maintainable
- Removes statefulness from route handler

**Cons:**
- None (DocRaptor handles capacity)

**Effort:** Small (15 min)
**Risk:** Low

### Option 2: Replace with Database-Backed Semaphore

If concurrency control is truly needed, use Supabase-backed distributed semaphore.

**Pros:**
- Works across containers
- Actual concurrency limiting

**Cons:**
- More complexity
- Probably unnecessary

**Effort:** Large (2+ hours)
**Risk:** Medium

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected files:**
- `apps/web/app/api/reports/[id]/pdf/route.tsx`

**Lines to remove:**
- Lines 18-20 (constants)
- Lines 56-68 (functions)
- Lines 139-144 (slot check)
- Lines 304-305 (slot release in finally)

## Acceptance Criteria

- [ ] `MAX_CONCURRENT_PDFS` constant removed
- [ ] `activeRequests` variable removed
- [ ] `acquireSlot()` function removed
- [ ] `releaseSlot()` function removed
- [ ] Concurrency check removed from handler
- [ ] `releaseSlot()` call removed from finally block
- [ ] Tests pass without concurrency control

## Work Log

### 2026-01-04 - Initial Finding

**By:** Code Review Agent (code-simplicity-reviewer)

**Actions:**
- Identified YAGNI violation in concurrency control
- Analyzed that module-level state doesn't work in serverless
- Proposed removal for simplification

**Learnings:**
- Module-level state is problematic in serverless/container environments
- External APIs handle their own capacity
