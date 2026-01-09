---
status: pending
priority: p2
issue_id: "226"
tags:
  - code-review
  - animation
  - dead-code
  - yagni
dependencies: []
---

# Unused Animation Components (Dead Code)

## Problem Statement

Several animation components were created as part of the premium animations system but are never imported or used anywhere in the application. This represents ~342 lines of dead code that adds maintenance burden without providing value.

**Why it matters**: Dead code increases cognitive load, bundle size, and maintenance burden. These components may become stale or diverge from actual patterns used in the codebase.

## Findings

### Evidence

**1. NavigationProvider (111 lines)**
File: `/apps/web/components/navigation-lock.tsx`
- Provides navigation queuing during transitions
- Never imported in any other file
- Only referenced in its own definition

**2. AnimatedTabs + TabButton (183 lines)**
File: `/apps/web/components/ui/animated-tabs.tsx`
- Reusable animated tabs component with layoutId
- Never imported in any other file
- Only referenced in its own definition

**3. useAdaptiveSpring (48 lines)**
File: `/apps/web/lib/hooks/use-adaptive-spring.ts`
- Device-adaptive spring configuration hook
- Never imported in any other file
- Only referenced in its own definition

### Agent Reports

- **Code Simplicity Reviewer**: "NavigationProvider is COMPLETELY UNUSED - 111 lines of dead code. Delete entire file."
- **Code Simplicity Reviewer**: "AnimatedTabs + TabButton are UNUSED - 183 lines of dead code. Delete entire file."
- **Code Simplicity Reviewer**: "useAdaptiveSpring is UNUSED - 48 lines of dead code. Delete entire file."
- **Architecture Strategist**: "NavigationProvider represents dead code that may confuse future developers."

## Proposed Solutions

### Solution 1: Delete Unused Files (Recommended)
**Description**: Remove all three files since they are not used.

**Pros**:
- Immediate reduction of 342 LOC
- Reduces maintenance burden
- Eliminates confusion
- Smaller bundle size

**Cons**:
- Loses prepared components if needed later
- Can be re-created from git history if needed

**Effort**: Small (15 minutes)
**Risk**: Low (can restore from git)

**Files to delete**:
- `apps/web/components/navigation-lock.tsx`
- `apps/web/components/ui/animated-tabs.tsx`
- `apps/web/lib/hooks/use-adaptive-spring.ts`

### Solution 2: Integrate Components Into Application
**Description**: Actually use these components where appropriate.

**Pros**:
- Leverages work already done
- Improves UX with better animations

**Cons**:
- Requires additional integration work
- May not be needed for current features

**Effort**: Large (4+ hours)
**Risk**: Medium

**Potential integration points**:
- `NavigationProvider`: Wrap app layout for transition queuing
- `AnimatedTabs`: Use in settings pages, report tabs
- `useAdaptiveSpring`: Use in animated components for mobile optimization

### Solution 3: Move to Archive/Examples Directory
**Description**: Keep the code but move to a non-imported location.

**Pros**:
- Preserves reference implementations
- Available for future use

**Cons**:
- Still adds to repository size
- May become stale

**Effort**: Small (15 minutes)
**Risk**: Low

## Recommended Action

<!-- Leave blank - to be filled during triage -->

## Technical Details

### Affected Files
- `apps/web/components/navigation-lock.tsx` (DELETE)
- `apps/web/components/ui/animated-tabs.tsx` (DELETE)
- `apps/web/lib/hooks/use-adaptive-spring.ts` (DELETE)

### Dependencies
None - these files are not imported anywhere

### Testing Required
- Verify build still passes after deletion
- Verify no runtime errors

## Acceptance Criteria

- [ ] Decision made: delete or integrate
- [ ] If delete: Files removed and build passes
- [ ] If integrate: Components used in appropriate locations
- [ ] No dead code warnings

## Work Log

| Date | Action | Outcome | Learnings |
|------|--------|---------|-----------|
| 2026-01-09 | Code review identified | Found 342 LOC unused | YAGNI - don't build until needed |

## Resources

- [YAGNI Principle](https://martinfowler.com/bliki/Yagni.html)
