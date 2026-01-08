# Event Routing Bug Prevention: Implementation Guide

## Quick Start

This guide helps you implement the prevention strategies for the DD clarification event routing bug.

## What Was the Bug?

When DD mode was added, the `answerClarification` server action wasn't updated to route to the correct event (`report/dd-clarification-answered`). This caused clarifications to fail silently.

**Root Cause**: Event routing logic was scattered across multiple files with no centralized authority.

## Prevention Strategy Overview

Four key improvements:

1. **Centralized Event Router** - Single source of truth for mode → event mapping
2. **Type Safety** - TypeScript catches missing modes at compile time
3. **Testing** - Unit, integration, and E2E tests prevent regressions
4. **Developer Checklist** - Structured process prevents human error

---

## Files Created/Modified

### New Files (Must Create)

```
/apps/web/lib/reports/event-routing.ts          ← Centralized router
/apps/web/__tests__/lib/reports/event-routing.test.ts  ← Unit tests
/docs/solutions/prevention/event-routing-bug-prevention.md  ← Full strategy
/docs/checklists/adding-new-report-mode.md      ← Developer checklist
```

### Files to Update

```
/apps/web/lib/types.ts                          ← Add ReportMode type (if not exists)
/apps/web/app/app/_lib/server/sparlo-reports-server-actions.ts  ← Use getClarificationEventName()
```

---

## Step-by-Step Implementation

### Step 1: Create Centralized Event Router (5 min)

**File**: `/apps/web/lib/reports/event-routing.ts`

This file is already created at that path. It provides:
- `getClarificationEventName(mode)` - Get event for a mode
- `getSupportedReportModes()` - List all modes
- `isSupportedReportMode(mode)` - Type guard validation

**Key Feature**: The `CLARIFICATION_EVENT_MAP` is the single source of truth. Add a new mode here and TypeScript will guide you through the rest.

### Step 2: Update Server Actions to Use Router (10 min)

**File**: `/apps/web/app/app/_lib/server/sparlo-reports-server-actions.ts` (lines 626-643)

**Before:**
```typescript
let eventName: ClarificationEventName = 'report/clarification-answered';
if (mode === 'discovery') {
  eventName = 'report/discovery-clarification-answered';
} else if (mode === 'hybrid') {
  eventName = 'report/hybrid-clarification-answered';
} else if (mode === 'dd') {
  eventName = 'report/dd-clarification-answered';
}
```

**After:**
```typescript
import { getClarificationEventName } from '~/lib/reports/event-routing';

const eventName = getClarificationEventName(mode);
```

This is the critical fix. It ensures:
- No hardcoded event names
- Unknown modes throw clear errors
- All code uses same routing logic

### Step 3: Add Comprehensive Tests (15 min)

**Files to Create:**

1. `/apps/web/__tests__/lib/reports/event-routing.test.ts` (already created)
   - Unit tests for routing logic
   - 40+ test cases covering all edge cases
   - Run: `pnpm test event-routing.test.ts`

2. Create integration test: `/apps/web/__tests__/app/app/_lib/server/clarification-routing.integration.test.ts`
   ```typescript
   // Test that server action sends correct event
   // Test for each mode: discovery, hybrid, dd
   ```

3. Create E2E test: `/apps/e2e/tests/clarification-flow.spec.ts`
   ```typescript
   // Test full user flow: start → clarify → complete
   // Test for each mode
   ```

### Step 4: Create Developer Checklist (Already Done)

**File**: `/docs/checklists/adding-new-report-mode.md`

This checklist prevents the bug by ensuring developers:
1. Update event routing
2. Add tests
3. Update documentation
4. Validate before shipping

Print this and post it! Better: Make it a PR template.

### Step 5: Add CI/CD Validation (Optional but Recommended)

**File**: `.github/workflows/test.yml` or create new

Add job to verify:
- All modes in `ReportMode` type have routing entries
- No hardcoded event names in server actions
- Event routing tests pass

Example:
```yaml
- name: Validate Event Routing
  run: |
    # Extract modes from type definition
    MODES=$(grep "type ReportMode" apps/web/lib/types.ts)
    # Verify each mode is in event-routing.ts
    for mode in $MODES; do
      grep -q "$mode" apps/web/lib/reports/event-routing.ts || exit 1
    done
```

---

## How to Add a New Report Mode (Using These Tools)

Follow `/docs/checklists/adding-new-report-mode.md` (10 sections):

1. Add mode to `ReportMode` type
2. Add Inngest schemas
3. **Update `event-routing.ts`** (most critical)
4. Create server actions
5. Create Inngest handlers
6. Update database (if needed)
7. Create UI components
8. Write tests (unit + integration + E2E)
9. Update documentation
10. Validate before submitting

The checklist has validation commands to run:
```bash
pnpm typecheck                    # Catch type errors
pnpm test event-routing.test.ts   # Verify routing works
pnpm e2e --grep "foo mode"        # Test full flow
```

If any test fails, you missed a step. The tests guide you to the fix.

---

## Key Files Explained

### `event-routing.ts` - The Core

This is your protection against the bug. It:

1. **Defines the mapping**: `Record<ReportMode, string>`
   - One place to add new modes
   - TypeScript enforces all modes are covered

2. **Provides utility functions**:
   ```typescript
   getClarificationEventName('dd')  // → 'report/dd-clarification-answered'
   getSupportedReportModes()        // → ['discovery', 'hybrid', 'dd']
   isSupportedReportMode('dd')      // → true (with type narrowing)
   ```

3. **Gives helpful errors**:
   ```
   Unknown report mode: "foo".
   Supported modes: discovery, hybrid, dd.
   If adding a new mode, update CLARIFICATION_EVENT_MAP in event-routing.ts
   ```

### `event-routing.test.ts` - The Safety Net

40+ tests covering:
- ✅ Correct mapping for each mode
- ✅ Error handling for unknown modes
- ✅ Type narrowing for type guards
- ✅ Consistency checks
- ✅ Edge cases

Run after any change: `pnpm test event-routing.test.ts`

### `adding-new-report-mode.md` - The Guide

10-section checklist prevents human error:
- Ensures no step is skipped
- Provides exact file paths
- Gives validation commands
- References examples

Use this for every new mode.

---

## Benefits Summary

| Benefit | How It Works | Impact |
|---------|-------------|--------|
| **Prevents Mode Routing Bugs** | Centralized routing = no missed updates | 0 bugs when adding modes |
| **Type Safety** | TypeScript validates all modes covered | Compile-time error detection |
| **Clear Error Messages** | Helpful errors guide developers | Faster debugging, less guessing |
| **Automated Validation** | Tests + CI/CD catch incomplete implementations | No incomplete deploys |
| **Onboarding** | Checklist + examples make it obvious what to do | Less experienced devs can add modes safely |
| **Scalability** | Adding mode N is as easy as mode 1 | Easy to scale to 10+ modes |

---

## Testing Validation

After implementing, verify:

```bash
# Unit tests (should be 40+ tests)
pnpm test event-routing.test.ts --reporter=verbose

# Integration tests
pnpm test clarification-routing.integration.test.ts

# E2E tests
pnpm e2e --grep "clarification"

# Type check
pnpm typecheck

# Lint
pnpm lint

# Success: All green!
```

---

## Common Questions

**Q: What if I add a new mode and forget to update event-routing.ts?**

A:
1. Tests will fail: `getClarificationEventName('new-mode')` throws
2. Server action will throw: "Unknown report mode: new-mode"
3. Clear error message tells you exactly what to fix

**Q: Can I hardcode event names in my server action?**

A: You could, but don't. Use `getClarificationEventName()` instead.
- Benefit: If event name changes, only one place to update
- Benefit: Consistent with rest of codebase
- Benefit: Tests validate it works

**Q: What if I'm adding a mode that's so special it doesn't use the normal clarification event?**

A:
1. Add it to `event-routing.ts` anyway (with a comment)
2. Update server action to check for special case
3. Note this in PR description
4. Discuss with team if pattern should change

**Q: How do I run just the event routing tests?**

A: `pnpm test event-routing.test.ts`

**Q: Can I skip the checklist?**

A: No. It's there because the bug happened when someone skipped it.

---

## Maintenance & Monitoring

### Monthly

- Review `/apps/web/lib/reports/event-routing.ts` to ensure it's current
- Check Inngest dashboard: verify expected events are being sent
- Scan logs for mode-related errors

### When Adding Features

- Follow the checklist
- Don't skip tests
- Request code review from someone familiar with this code

### When Refactoring

- Don't change event names without updating routing
- Don't remove modes without deprecation period
- Don't add conditional routing based on account/user

---

## Next Steps

1. **Create the files**: Copy the files from this guide into your project
2. **Update server actions**: Use `getClarificationEventName()` instead of hardcoding
3. **Run tests**: `pnpm test event-routing.test.ts` - should pass
4. **Review**: Have someone check your changes
5. **Deploy**: Monitor Inngest dashboard for correct events

---

## Support

If you have questions about:
- **Event routing**: See `/docs/REPORT_MODES.md`
- **Adding a mode**: See `/docs/checklists/adding-new-report-mode.md`
- **How it works**: See `/docs/solutions/prevention/event-routing-bug-prevention.md`

---

## Success Metrics

After implementation, you should have:

- ✅ 0 event routing bugs in production
- ✅ 40+ unit tests for routing logic
- ✅ 100% test coverage for event-routing.ts
- ✅ Clear error messages when modes are missing
- ✅ Automatic validation in CI/CD
- ✅ Documented checklist for adding modes

Monitor for 6+ months to confirm the prevention strategies work.
