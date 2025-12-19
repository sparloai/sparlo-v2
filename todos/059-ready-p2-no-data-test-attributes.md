---
status: ready
priority: p2
issue_id: "059"
tags: [agent-native, testing, e2e, accessibility]
dependencies: []
---

# Missing data-test Attributes for Automation

## Problem Statement

New animated components lack `data-test` attributes for E2E testing and agent automation. Per CLAUDE.md: "Add `data-test` for E2E tests where appropriate."

**Testing Impact:** Playwright tests must use fragile CSS selectors or text matching.

## Findings

- **Files missing data-test:**
  - `apps/web/app/home/(user)/_components/animated-reports-list.tsx`
  - `apps/web/app/home/(user)/_components/processing-screen.tsx`
  - `apps/web/app/home/(user)/reports/new/page.tsx`

**Key interactive elements without data-test:**
```typescript
// animated-reports-list.tsx - Report cards
<motion.div className="cursor-pointer" onClick={handleClick}>
  // No data-test="report-card-{id}"

// processing-screen.tsx - Action buttons
<Button onClick={handleViewReport}>
  // No data-test="view-report-button"

// new/page.tsx - Form elements
<Textarea value={challengeText} onChange={...}>
  // No data-test="challenge-input"
```

**Reviewers identifying this:**
- Agent-Native Review: P1 - No data-test attributes for automation
- CLAUDE.md: Explicit requirement for data-test attributes

## Proposed Solutions

### Option 1: Add Strategic data-test Attributes

**Approach:** Add data-test to key interactive elements only.

**Priority elements:**
1. Form inputs and buttons
2. Clickable cards/items
3. Status indicators
4. Navigation actions

```tsx
// animated-reports-list.tsx
<motion.div
  data-test={`report-card-${report.id}`}
  onClick={handleClick}
>

// processing-screen.tsx
<Button data-test="view-report-button" onClick={handleViewReport}>
<Button data-test="retry-button" onClick={handleRetry}>

// new/page.tsx
<Textarea data-test="challenge-input" value={challengeText}>
<Button data-test="submit-challenge" onClick={handleSubmit}>
```

**Pros:**
- Stable selectors for tests
- Agent-automatable
- Minimal overhead

**Cons:**
- Need to maintain attribute list

**Effort:** 1 hour

**Risk:** Very Low

---

### Option 2: Comprehensive data-test Coverage

**Approach:** Add data-test to all semantic elements.

**Pros:**
- Maximum testability
- Agents can inspect any element

**Cons:**
- More attributes to maintain
- Some may never be tested

**Effort:** 2 hours

**Risk:** Very Low

## Recommended Action

Implement Option 1 (strategic attributes):

1. Identify interactive elements in each file
2. Add data-test with descriptive names
3. Use consistent naming pattern: `{component}-{action/element}`
4. Document in component for future maintainers

## Technical Details

**Naming convention:**
```
data-test="component-element" or "component-action"

Examples:
- report-card-{id}
- report-card-title
- report-card-status
- processing-view-report
- processing-retry
- challenge-input
- challenge-submit
```

**Files to update:**
- `apps/web/app/home/(user)/_components/animated-reports-list.tsx`
  - Report card container: `report-card-{id}`
  - Status badge: `report-status-{status}`
  - Empty state: `reports-empty-state`

- `apps/web/app/home/(user)/_components/processing-screen.tsx`
  - View report button: `processing-view-report`
  - Retry button: `processing-retry`
  - Clarification input: `clarification-input`
  - Submit clarification: `clarification-submit`

- `apps/web/app/home/(user)/reports/new/page.tsx`
  - Challenge textarea: `challenge-input`
  - Submit button: `challenge-submit`
  - Refusal warning: `refusal-warning`

## Acceptance Criteria

- [ ] data-test on all form inputs
- [ ] data-test on all action buttons
- [ ] data-test on clickable cards with IDs
- [ ] data-test on status indicators
- [ ] Consistent naming convention
- [ ] E2E tests can use new selectors

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Parallel Review Agents)

**Actions:**
- Identified by Agent-Native reviewer
- Cross-referenced CLAUDE.md requirements
- Listed key elements needing attributes

**Learnings:**
- data-test enables stable test selectors
- Agents need programmatic access to UI elements
- Strategic coverage better than exhaustive
