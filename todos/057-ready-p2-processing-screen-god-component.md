---
status: ready
priority: p2
issue_id: "057"
tags: [react, architecture, maintainability, testing]
dependencies: []
---

# Processing Screen God Component

## Problem Statement

`ProcessingScreen` at 493 lines handles 4 distinct UI states, timer logic, message rotation, form submission, navigation, and error handling. This violates Single Responsibility Principle and makes the component difficult to test and maintain.

**Maintainability Impact:** Hard to test individual states; cognitive load when editing.

## Findings

- **File:** `apps/web/app/home/(user)/_components/processing-screen.tsx`
- **Lines:** 493
- **UI States:** 4 (processing, complete, error, clarifying)
- **Responsibilities:** 7+ distinct concerns

**Mixed responsibilities:**
1. State management (progress tracking)
2. Timer calculation (elapsed time)
3. Message rotation (status messages)
4. Navigation handling (onComplete callback)
5. Form submission (clarification)
6. Error handling
7. Animation orchestration

**Component complexity:**
```typescript
// One component handles all states
{status === 'processing' && <ProcessingView />}
{status === 'complete' && <CompleteView />}
{status === 'error' && <ErrorView />}
{status === 'clarifying' && <ClarificationView />}
```

**Reviewers identifying this:**
- Pattern Recognition: P2 - God Component Smell
- Architecture Review: Noted multiple responsibilities

## Proposed Solutions

### Option 1: Extract State-Specific Components

**Approach:** Create separate components for each UI state.

```
processing-screen/
├── index.tsx                    # Main orchestrator
├── processing-view.tsx          # Processing state UI
├── complete-view.tsx            # Complete state UI
├── error-view.tsx               # Error state UI
├── clarification-view.tsx       # Clarification form
└── use-processing-timer.ts      # Timer logic hook
```

**Pros:**
- Each component under 150 lines
- Easy to test individual states
- Clear separation of concerns

**Cons:**
- More files to manage
- Prop drilling between components

**Effort:** 3-4 hours

**Risk:** Low

---

### Option 2: Component Composition with Render Props

**Approach:** Use render prop pattern for state rendering.

```typescript
<ProcessingScreen
  progress={progress}
  renderProcessing={() => <ProcessingView />}
  renderComplete={() => <CompleteView />}
  renderError={(error) => <ErrorView error={error} />}
/>
```

**Pros:**
- Flexible customization
- Clear state boundaries

**Cons:**
- More complex API
- Over-engineered for internal component

**Effort:** 2-3 hours

**Risk:** Low

## Recommended Action

Implement Option 1 (extract components) as it follows React composition patterns:

1. Create `processing-screen/` directory
2. Extract `ProcessingView` (lines 190-280)
3. Extract `CompleteView` (lines 280-350)
4. Extract `ErrorView` (lines 350-420)
5. Extract `ClarificationView` (lines 420-490)
6. Keep main orchestrator under 100 lines

## Technical Details

**Current structure:**
- Single 493-line file
- Inline component definitions

**Target structure:**
```
apps/web/app/home/(user)/_components/processing-screen/
├── index.tsx                    # ~80 lines - orchestrator
├── processing-view.tsx          # ~100 lines - spinner, messages
├── complete-view.tsx            # ~80 lines - success UI
├── error-view.tsx               # ~80 lines - error handling
├── clarification-view.tsx       # ~100 lines - form
├── use-processing-timer.ts      # ~40 lines - timer hook
└── status-messages.ts           # ~30 lines - message constants
```

**Shared state via props:**
- `progress` object passed down
- Callbacks for actions (onComplete, onRetry, etc.)
- Timer state from custom hook

## Acceptance Criteria

- [ ] Main component under 100 lines
- [ ] Each sub-component under 150 lines
- [ ] All 4 UI states work correctly
- [ ] Timer functionality unchanged
- [ ] Message rotation works
- [ ] Clarification form works
- [ ] Navigation works
- [ ] TypeScript compiles without errors

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Parallel Review Agents)

**Actions:**
- Identified by Pattern Recognition reviewer
- Counted lines and responsibilities
- Outlined extraction strategy

**Learnings:**
- 500+ line components indicate extraction needed
- Each UI state can be a separate component
- Hooks extract logic, components extract UI
