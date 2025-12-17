---
status: ready
priority: p1
issue_id: "031"
tags: [architecture, refactoring, inngest]
dependencies: []
---

# Refactor God Function in generate-report.ts

The generate-report Inngest function is 571 lines handling the entire AN0-AN5 chain - violates single responsibility.

## Problem Statement

`apps/web/lib/inngest/functions/generate-report.ts` is a monolithic function that:
- Handles all 6 LLM phases (AN0-AN5)
- Manages database state updates
- Handles clarification flow
- Contains context building logic
- Has 311+ lines of actual logic

This causes:
- Difficult to test individual phases
- Hard to debug failures
- Cannot parallelize development
- Cognitive overload when making changes

## Findings

- File: `apps/web/lib/inngest/functions/generate-report.ts`
- 571 total lines, 311+ lines of logic
- Each AN phase is a `step.run()` but all in one function
- Context building functions embedded (162 lines)
- State mutation with spread operators at 5+ points
- No error boundaries between phases

**Structure analysis:**
```
generate-report.ts (571 lines)
├── Event handler setup (20 lines)
├── AN0: Problem Framing (60 lines)
├── Clarification handling (40 lines)
├── AN1.5: Teaching Selection (50 lines)
├── AN1.7: Literature Augmentation (45 lines)
├── AN2: Innovation Briefing (55 lines)
├── AN3: Concept Generation (65 lines)
├── AN4: Evaluation (50 lines)
├── AN5: Report Generation (60 lines)
├── Context builders (162 lines)
└── State updates scattered throughout
```

## Proposed Solutions

### Option 1: Extract Each Phase to Separate File (Recommended)

**Approach:** Create a module per phase with its own step function.

```
lib/inngest/functions/
├── generate-report.ts          # Orchestrator only
├── phases/
│   ├── an0-problem-framing.ts
│   ├── an1-5-teaching.ts
│   ├── an1-7-literature.ts
│   ├── an2-briefing.ts
│   ├── an3-concepts.ts
│   ├── an4-evaluation.ts
│   └── an5-report.ts
└── helpers/
    ├── context-builders.ts
    └── state-updates.ts
```

**Pros:**
- Clear separation of concerns
- Each phase testable in isolation
- Parallel development possible
- Easier debugging

**Cons:**
- More files to manage
- Need to pass state between modules

**Effort:** 4-6 hours

**Risk:** Medium (behavior must remain identical)

---

### Option 2: Extract Context Builders Only

**Approach:** Move just the 162 lines of context builders to separate file.

**Pros:**
- Smaller change
- Immediate improvement
- Lower risk

**Cons:**
- Still have large main function
- Partial solution

**Effort:** 1-2 hours

**Risk:** Low

## Recommended Action

Implement Option 2 first (quick win), then Option 1:

1. **Immediate:** Extract context builders to `lib/inngest/helpers/context-builders.ts`
2. **Follow-up:** Extract each phase to separate module
3. **Keep orchestrator** in `generate-report.ts` that calls phase modules

## Technical Details

**Affected files:**
- `apps/web/lib/inngest/functions/generate-report.ts` (primary)
- Create: `apps/web/lib/inngest/helpers/context-builders.ts`
- Create: `apps/web/lib/inngest/phases/*.ts` (one per phase)

**Context builder functions to extract:**
- `buildAN1_5Context` (~30 lines)
- `buildAN1_7Context` (~25 lines)
- `buildAN2Context` (~25 lines)
- `buildAN3Context` (~35 lines)
- `buildAN4Context` (~25 lines)
- `buildAN5Context` (~22 lines)

## Acceptance Criteria

- [ ] Context builders extracted to separate file
- [ ] Each AN phase in its own module (follow-up)
- [ ] Main function is orchestrator only (<100 lines)
- [ ] All tests still pass
- [ ] Report generation works end-to-end

## Work Log

### 2025-12-16 - Architecture Review Discovery

**By:** Claude Code (Architecture Strategist Agent)

**Actions:**
- Identified god function anti-pattern (571 lines)
- Analyzed structure and identified extraction points
- Documented phased refactoring approach

**Learnings:**
- Inngest step.run() calls can be in separate modules
- Context builders are pure functions - easy to extract
- Orchestrator pattern keeps control flow clear
