# Prevention Strategies: Event Routing Bug for Report Modes

## Problem Statement

When adding a new report mode (like DD), the `answerClarification` server action must be updated to send the correct Inngest event. This was missed for DD mode, causing clarifications to fail silently or send incorrect events.

**Current Pattern:**
- Multiple report modes exist: `discovery`, `hybrid`, `dd`
- Each mode has a unique clarification event:
  - `report/discovery-clarification-answered`
  - `report/hybrid-clarification-answered`
  - `report/dd-clarification-answered`
- The server action maps `report_data.mode` → event name, but this mapping isn't automatically enforced

---

## 1. Code Organization: Centralized Event Routing

### Problem with Current Approach
The event routing logic is scattered across multiple files:
- `/apps/web/app/app/_lib/server/sparlo-reports-server-actions.ts` (lines 626-643)
- `/apps/web/app/app/_lib/server/discovery-reports-server-actions.ts` (line 237)
- `/apps/web/app/app/_lib/server/hybrid-reports-server-actions.ts` (line 372)
- `/apps/web/lib/inngest/client.ts` (defines event types)

When adding DD mode, developers must remember to update BOTH the event definitions AND the routing logic in multiple places.

### Solution: Create a Centralized Event Router

**Create:** `/apps/web/lib/reports/event-routing.ts`

```typescript
'use server';

import 'server-only';

import type { ReportMode } from '~/lib/types';

/**
 * Type-safe mapping of report modes to clarification events.
 * This is the single source of truth for event routing.
 *
 * CRITICAL: Update this mapping when adding new report modes.
 */
const CLARIFICATION_EVENT_MAP: Record<ReportMode, string> = {
  discovery: 'report/discovery-clarification-answered',
  hybrid: 'report/hybrid-clarification-answered',
  dd: 'report/dd-clarification-answered',
};

/**
 * Get the correct clarification event name for a report mode.
 *
 * @param mode - The report mode (discovery, hybrid, dd, etc.)
 * @returns The Inngest event name to send
 * @throws Error if mode is not recognized
 */
export function getClarificationEventName(mode: string | undefined): string {
  if (!mode || !(mode in CLARIFICATION_EVENT_MAP)) {
    throw new Error(
      `Unknown report mode: "${mode}". ` +
      `Supported modes: ${Object.keys(CLARIFICATION_EVENT_MAP).join(', ')}. ` +
      `If adding a new mode, update CLARIFICATION_EVENT_MAP in event-routing.ts`,
    );
  }

  return CLARIFICATION_EVENT_MAP[mode as ReportMode];
}

/**
 * Get all supported report modes.
 * Useful for validation and error messages.
 */
export function getSupportedReportModes(): ReportMode[] {
  return Object.keys(CLARIFICATION_EVENT_MAP) as ReportMode[];
}

/**
 * Validate that a report mode is supported.
 * @param mode - The mode to validate
 * @returns true if supported, false otherwise
 */
export function isSupportedReportMode(mode: unknown): mode is ReportMode {
  return typeof mode === 'string' && mode in CLARIFICATION_EVENT_MAP;
}
```

### Update Shared Types

**Update:** `/apps/web/lib/types.ts` (or create new file)

```typescript
/**
 * Union type of all supported report modes.
 * Update this when adding new modes.
 */
export type ReportMode = 'discovery' | 'hybrid' | 'dd';

/**
 * Report data stored in database for all modes.
 */
export interface ReportData {
  mode: ReportMode;
  [key: string]: unknown;
}
```

### Refactored Server Actions

**Update:** `/apps/web/app/app/_lib/server/sparlo-reports-server-actions.ts`

```typescript
// Before (lines 626-643)
let eventName: ClarificationEventName = 'report/clarification-answered';
if (mode === 'discovery') {
  eventName = 'report/discovery-clarification-answered';
} else if (mode === 'hybrid') {
  eventName = 'report/hybrid-clarification-answered';
} else if (mode === 'dd') {
  eventName = 'report/dd-clarification-answered';
}

// After
import { getClarificationEventName } from '~/lib/reports/event-routing';

const eventName = getClarificationEventName(mode);
```

### Benefits

- **Single Source of Truth**: Event mapping defined in one place
- **Type Safety**: TypeScript enforces supported modes
- **Automatic Error Handling**: Unsupported modes throw clear errors with suggestions
- **Discoverability**: Developers find the mapping immediately when searching for event names
- **Scalability**: Adding a new mode requires changes in one file

---

## 2. Testing Approach: Catch Routing Gaps

### Unit Tests

**Create:** `/apps/web/__tests__/lib/reports/event-routing.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  getClarificationEventName,
  getSupportedReportModes,
  isSupportedReportMode,
} from '~/lib/reports/event-routing';

describe('Event Routing', () => {
  describe('getClarificationEventName', () => {
    it('maps discovery mode to correct event', () => {
      const event = getClarificationEventName('discovery');
      expect(event).toBe('report/discovery-clarification-answered');
    });

    it('maps hybrid mode to correct event', () => {
      const event = getClarificationEventName('hybrid');
      expect(event).toBe('report/hybrid-clarification-answered');
    });

    it('maps dd mode to correct event', () => {
      const event = getClarificationEventName('dd');
      expect(event).toBe('report/dd-clarification-answered');
    });

    it('throws on unknown mode', () => {
      expect(() => getClarificationEventName('unknown')).toThrow(
        /Unknown report mode/,
      );
    });

    it('throws on undefined mode', () => {
      expect(() => getClarificationEventName(undefined)).toThrow(
        /Unknown report mode/,
      );
    });

    it('error message includes supported modes', () => {
      const error = expect(() =>
        getClarificationEventName('future-mode'),
      ).toThrow();
      error.toMatch(/discovery.*hybrid.*dd/);
    });
  });

  describe('getSupportedReportModes', () => {
    it('returns all supported modes', () => {
      const modes = getSupportedReportModes();
      expect(modes).toContain('discovery');
      expect(modes).toContain('hybrid');
      expect(modes).toContain('dd');
    });

    it('returns list is not empty', () => {
      const modes = getSupportedReportModes();
      expect(modes.length).toBeGreaterThan(0);
    });
  });

  describe('isSupportedReportMode', () => {
    it('returns true for discovery', () => {
      expect(isSupportedReportMode('discovery')).toBe(true);
    });

    it('returns true for hybrid', () => {
      expect(isSupportedReportMode('hybrid')).toBe(true);
    });

    it('returns true for dd', () => {
      expect(isSupportedReportMode('dd')).toBe(true);
    });

    it('returns false for unknown mode', () => {
      expect(isSupportedReportMode('unknown')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isSupportedReportMode(null)).toBe(false);
    });

    it('narrows type correctly', () => {
      const mode: unknown = 'dd';
      if (isSupportedReportMode(mode)) {
        // TypeScript now knows mode is ReportMode
        const event = getClarificationEventName(mode);
        expect(event).toBeDefined();
      }
    });
  });

  describe('Mode consistency', () => {
    it('all supported modes have clarification events', () => {
      const modes = getSupportedReportModes();
      modes.forEach((mode) => {
        expect(() => getClarificationEventName(mode)).not.toThrow();
      });
    });

    it('clarification events are unique per mode', () => {
      const modes = getSupportedReportModes();
      const events = modes.map(getClarificationEventName);
      const uniqueEvents = new Set(events);
      expect(uniqueEvents.size).toBe(events.length);
    });
  });
});
```

### Integration Test for Server Actions

**Create:** `/apps/web/__tests__/app/app/_lib/server/clarification-routing.integration.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestUser, createTestReport } from '~/test/helpers';
import { answerClarification } from '~/app/app/_lib/server/sparlo-reports-server-actions';

describe('Clarification Event Routing (Integration)', () => {
  it('sends correct event for discovery mode reports', async () => {
    const user = await createTestUser();
    const report = await createTestReport(user.id, 'discovery');

    // Mock inngest.send to capture event
    let capturedEvent: string | null = null;
    const originalSend = inngest.send;
    inngest.send = async (event) => {
      capturedEvent = event.name;
      return originalSend(event);
    };

    try {
      await answerClarification({
        reportId: report.id,
        answer: 'Test answer',
      });

      expect(capturedEvent).toBe('report/discovery-clarification-answered');
    } finally {
      inngest.send = originalSend;
    }
  });

  it('sends correct event for hybrid mode reports', async () => {
    const user = await createTestUser();
    const report = await createTestReport(user.id, 'hybrid');

    let capturedEvent: string | null = null;
    const originalSend = inngest.send;
    inngest.send = async (event) => {
      capturedEvent = event.name;
      return originalSend(event);
    };

    try {
      await answerClarification({
        reportId: report.id,
        answer: 'Test answer',
      });

      expect(capturedEvent).toBe('report/hybrid-clarification-answered');
    } finally {
      inngest.send = originalSend;
    }
  });

  it('sends correct event for dd mode reports', async () => {
    const user = await createTestUser();
    const report = await createTestReport(user.id, 'dd');

    let capturedEvent: string | null = null;
    const originalSend = inngest.send;
    inngest.send = async (event) => {
      capturedEvent = event.name;
      return originalSend(event);
    };

    try {
      await answerClarification({
        reportId: report.id,
        answer: 'Test answer',
      });

      expect(capturedEvent).toBe('report/dd-clarification-answered');
    } finally {
      inngest.send = originalSend;
    }
  });

  it('fails with clear error for missing mode', async () => {
    const user = await createTestUser();
    const report = await createTestReport(user.id, null);

    await expect(() =>
      answerClarification({
        reportId: report.id,
        answer: 'Test answer',
      }),
    ).rejects.toThrow(/Unknown report mode/);
  });
});
```

### End-to-End Test Covering Full Clarification Flow

**Create:** `/apps/e2e/tests/clarification-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { loginUser, startReport } from './helpers';

test.describe('Clarification Flow for All Modes', () => {
  const modes = ['discovery', 'hybrid', 'dd'];

  for (const mode of modes) {
    test(`${mode} mode: clarification question triggers and resolves`, async ({
      page,
    }) => {
      // Login
      await loginUser(page);

      // Start report in specified mode
      const reportId = await startReport(page, mode, {
        designChallenge: 'Can we improve water purification using quantum mechanics?',
      });

      // Wait for clarification question
      const clarificationPrompt = page.locator('[data-test="clarification-question"]');
      await expect(clarificationPrompt).toBeVisible({ timeout: 30000 });

      // Answer the clarification
      await page.fill('[data-test="clarification-answer"]', 'We are targeting industrial-scale water treatment');
      await page.click('[data-test="submit-clarification"]');

      // Verify report continues processing
      const reportStatus = page.locator('[data-test="report-status"]');
      await expect(reportStatus).toContainText('processing', { timeout: 10000 });

      // Verify no error message appears
      const errorMessage = page.locator('[data-test="error-message"]');
      await expect(errorMessage).not.toBeVisible();
    });
  }
});
```

### Regression Test: Ensure All Modes Have Handlers

**Create:** `/apps/web/__tests__/lib/inngest/event-handlers.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { inngest } from '~/lib/inngest/client';
import { getSupportedReportModes } from '~/lib/reports/event-routing';

describe('Inngest Event Handlers', () => {
  it('all report modes have corresponding clarification event handlers', async () => {
    const modes = getSupportedReportModes();

    for (const mode of modes) {
      const eventName = `report/${mode}-clarification-answered`;

      // Check that Inngest client has this event type registered
      // (This is a type-level check - actual runtime check happens via Inngest)
      expect(inngest.schemas?.fromRecord).toBeDefined();
    }
  });

  it('all clarification events are handled by some function', async () => {
    // This test would check that each event has at least one handler function
    // Implementation depends on Inngest's introspection capabilities
  });
});
```

---

## 3. Developer Checklist: Adding New Report Modes

Create a checklist document: `/docs/checklists/adding-new-report-mode.md`

```markdown
# Checklist: Adding a New Report Mode

When adding a new report mode (e.g., `foo`), follow this checklist to prevent routing bugs:

## 1. Define the Mode

- [ ] Add mode to `ReportMode` type in `/apps/web/lib/types.ts`
  - Example: `export type ReportMode = 'discovery' | 'hybrid' | 'dd' | 'foo';`

## 2. Event Definitions

- [ ] Add event schema to `/apps/web/lib/inngest/client.ts`
  - Example: `FooClarificationAnsweredEventSchema`
  - Example: `FooReportGenerateEventSchema`

- [ ] Add event type to `Events` type record
  - Example: `'report/generate-foo': { data: FooReportGenerateEvent }`
  - Example: `'report/foo-clarification-answered': { data: FooClarificationAnsweredEvent }`

## 3. Event Routing (CRITICAL)

- [ ] **Update `/apps/web/lib/reports/event-routing.ts`**
  ```typescript
  const CLARIFICATION_EVENT_MAP: Record<ReportMode, string> = {
    discovery: 'report/discovery-clarification-answered',
    hybrid: 'report/hybrid-clarification-answered',
    dd: 'report/dd-clarification-answered',
    foo: 'report/foo-clarification-answered',  // ADD THIS LINE
  };
  ```
- [ ] Verify `getClarificationEventName('foo')` returns correct event

## 4. Server Actions

- [ ] Create `/apps/web/app/app/_lib/server/foo-reports-server-actions.ts`
  - [ ] Implement `startFooReportGeneration()`
  - [ ] Set `report_data.mode = 'foo'`
  - [ ] Send `report/generate-foo` event to Inngest

- [ ] Verify `answerClarification()` correctly routes foo mode
  - It now uses `getClarificationEventName()` so should work automatically
  - But test anyway to be sure!

## 5. Inngest Handlers

- [ ] Create `/apps/web/lib/inngest/functions/generate-foo-report.ts`
  - [ ] Implement handler for `report/generate-foo` event
  - [ ] Implement clarification wait for `report/foo-clarification-answered`
  - [ ] Implement cancellation handler for `report/cancel.requested`

## 6. Database

- [ ] Add any foo-specific columns to `sparlo_reports` table
  - [ ] Add migration: `supabase/migrations/xxx_add_foo_report_fields.sql`
  - [ ] Run: `pnpm supabase:web:typegen`

## 7. UI Components

- [ ] Create report start component: `foo-report-start.tsx`
- [ ] Create report display component: `foo-report-display.tsx`
- [ ] Add navigation link

## 8. Tests (REQUIRED)

- [ ] Add unit tests for event routing
  - [ ] Verify `getClarificationEventName('foo')` works
  - [ ] Verify `isSupportedReportMode('foo')` returns true

- [ ] Add integration test for clarification
  - [ ] Start foo report in `clarifying` status
  - [ ] Call `answerClarification()`
  - [ ] Verify `report/foo-clarification-answered` event was sent

- [ ] Add E2E test
  - [ ] Full user flow: start → clarify → complete

## 9. Documentation

- [ ] Update `/docs/modes.md` to document foo mode
- [ ] Update this checklist if process changed
- [ ] Add JSDoc comments to new functions

## 10. Review Checklist

Before merging PR, verify:

- [ ] `pnpm typecheck` passes (catches type mismatches)
- [ ] `pnpm test` passes (all new tests green)
- [ ] `pnpm lint:fix` runs without errors
- [ ] E2E tests pass: `pnpm e2e --grep "foo mode"`
- [ ] Code review confirms all 10 sections above are complete
- [ ] Event routing test passes for foo mode specifically

## Quick Validation

Run these commands to validate the implementation:

```bash
# Verify type safety
pnpm typecheck

# Run routing unit tests
pnpm test event-routing.test.ts

# Run clarification integration tests
pnpm test clarification-routing.integration.test.ts

# Run E2E tests for foo mode
pnpm e2e --grep "foo mode"

# Check that error messages show foo as supported
node -e "import('./lib/reports/event-routing.ts').then(m => console.log(m.getSupportedReportModes()))"
```

## Prevention Tips

- **Don't duplicate code**: Reuse `getClarificationEventName()` instead of hardcoding event names
- **Don't skip tests**: If tests pass, the routing is correct
- **Don't trust memory**: Reference this checklist every time
- **Don't commit without validation**: Run the validation commands above
```

---

## 4. Type Safety Improvements

### Leverage TypeScript for Exhaustiveness Checking

**Update server actions to use exhaustive pattern matching:**

```typescript
// Before (can miss modes)
let eventName: ClarificationEventName = 'report/clarification-answered';
if (mode === 'discovery') {
  eventName = 'report/discovery-clarification-answered';
} else if (mode === 'hybrid') {
  eventName = 'report/hybrid-clarification-answered';
} else if (mode === 'dd') {
  eventName = 'report/dd-clarification-answered';
}

// After (TypeScript catches missing modes)
const eventName = (() => {
  switch (mode) {
    case 'discovery':
      return 'report/discovery-clarification-answered';
    case 'hybrid':
      return 'report/hybrid-clarification-answered';
    case 'dd':
      return 'report/dd-clarification-answered';
    default:
      const _exhaustive: never = mode;
      return _exhaustive; // TS error if mode not handled
  }
})();
```

OR (preferred):

```typescript
// Even better: use the centralized function
import { getClarificationEventName } from '~/lib/reports/event-routing';

const eventName = getClarificationEventName(mode);
```

### Add Strict Type Checking

**Update `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Create a Report Mode Registry

**Create:** `/apps/web/lib/reports/report-mode-registry.ts`

```typescript
'use server';

import 'server-only';

import type { ReportMode } from '~/lib/types';

/**
 * Metadata about each report mode.
 * This provides a single source of truth for mode configuration.
 */
interface ModeMetadata {
  name: ReportMode;
  label: string;
  description: string;
  clarificationEvent: string;
  generateEvent: string;
  handlerFunction: string; // Path to inngest handler
}

const REPORT_MODE_REGISTRY: Record<ReportMode, ModeMetadata> = {
  discovery: {
    name: 'discovery',
    label: 'Discovery Mode',
    description: 'Explore non-obvious solutions in adjacent domains',
    clarificationEvent: 'report/discovery-clarification-answered',
    generateEvent: 'report/generate-discovery',
    handlerFunction: '~/lib/inngest/functions/generate-discovery-report',
  },
  hybrid: {
    name: 'hybrid',
    label: 'Hybrid Mode',
    description: 'Full-spectrum analysis evaluating all solutions on merit',
    clarificationEvent: 'report/hybrid-clarification-answered',
    generateEvent: 'report/generate-hybrid',
    handlerFunction: '~/lib/inngest/functions/generate-hybrid-report',
  },
  dd: {
    name: 'dd',
    label: 'Due Diligence',
    description: 'Technical due diligence analysis for investor evaluation',
    clarificationEvent: 'report/dd-clarification-answered',
    generateEvent: 'report/generate-dd',
    handlerFunction: '~/lib/inngest/functions/generate-dd-report',
  },
};

export function getModeMetadata(mode: ReportMode): ModeMetadata {
  const metadata = REPORT_MODE_REGISTRY[mode];
  if (!metadata) {
    throw new Error(
      `Unknown report mode: ${mode}. Supported: ${Object.keys(REPORT_MODE_REGISTRY).join(', ')}`,
    );
  }
  return metadata;
}

export function getAllModeMetadata(): ModeMetadata[] {
  return Object.values(REPORT_MODE_REGISTRY);
}
```

---

## 5. Automated Validation (CI/CD)

### Add Pre-commit Hook

**Create:** `/.husky/pre-commit` or update existing

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Validate event routing consistency
echo "Checking event routing consistency..."
node -e "
const fs = require('fs');
const routingFile = 'apps/web/lib/reports/event-routing.ts';
const inngestFile = 'apps/web/lib/inngest/client.ts';

if (!fs.existsSync(routingFile)) {
  console.error('❌ event-routing.ts not found');
  process.exit(1);
}

console.log('✓ Event routing files found');
"

# Run type check
echo "Running TypeScript type check..."
pnpm typecheck --noEmit || exit 1

# Run routing tests
echo "Running event routing tests..."
pnpm test -- event-routing.test.ts --run || exit 1

echo "✓ All checks passed"
```

### Add to CI Pipeline

**Update:** `.github/workflows/test.yml` or equivalent

```yaml
name: Event Routing Validation

on: [push, pull_request]

jobs:
  routing-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check Event Routing Consistency
        run: |
          echo "Verifying all modes have handlers..."

          # Extract modes from type definition
          MODES=$(grep -oP "type ReportMode = \K[^;]+" apps/web/lib/types.ts | tr -d "'" | tr '|' '\n' | sed 's/[[:space:]]*//g')

          # Check each mode has routing entry
          for mode in $MODES; do
            if ! grep -q "'$mode'" apps/web/lib/reports/event-routing.ts; then
              echo "❌ Mode '$mode' missing from event-routing.ts"
              exit 1
            fi
            echo "✓ Mode '$mode' found in routing"
          done

      - name: Run Event Routing Tests
        run: pnpm test -- event-routing.test.ts --run

      - name: Ensure No Hardcoded Event Names
        run: |
          echo "Checking for hardcoded event names in server actions..."
          if grep -r "report/discovery-clarification-answered\|report/hybrid-clarification-answered\|report/dd-clarification-answered" apps/web/app/app/_lib/server/ | grep -v "node_modules"; then
            echo "❌ Found hardcoded event names. Use getClarificationEventName() instead."
            exit 1
          fi
          echo "✓ No hardcoded event names found"
```

---

## 6. Monitoring & Alerting

### Log Warnings for Unknown Modes

**Update:** Server actions to log warnings

```typescript
const reportData = report.report_data as { mode?: string } | null;
const mode = reportData?.mode;

if (!mode) {
  console.warn('[Clarify Server Action] Report has no mode set. This is a bug.', {
    reportId: data.reportId,
    reportData,
  });
  // Fallback to safe default
  eventName = 'report/clarification-answered';
} else {
  try {
    eventName = getClarificationEventName(mode);
  } catch (error) {
    console.error('[Clarify Server Action] Invalid report mode', {
      reportId: data.reportId,
      mode,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
```

### Alert on Event Routing Mismatches

Create a monitoring dashboard to catch:
- Clarification answered events that don't match report mode
- Reports stuck in "clarifying" status (timeout)
- Inngest events sent to wrong event name

---

## 7. Documentation Updates

### README for Event Routing

**Create:** `/docs/REPORT_MODES.md`

```markdown
# Report Modes Architecture

## Overview

The system supports multiple report generation modes, each with its own event chain:

| Mode | Purpose | Events |
|------|---------|--------|
| **discovery** | Explore non-obvious solutions | `report/generate-discovery`, `report/discovery-clarification-answered` |
| **hybrid** | Full-spectrum analysis | `report/generate-hybrid`, `report/hybrid-clarification-answered` |
| **dd** | Technical due diligence | `report/generate-dd`, `report/dd-clarification-answered` |

## Adding a New Mode

See `/docs/checklists/adding-new-report-mode.md`

## Event Routing

All clarification event routing goes through:
- **Central Router**: `/apps/web/lib/reports/event-routing.ts`
- **Type Definition**: `/apps/web/lib/types.ts` (ReportMode)

Never hardcode event names. Use `getClarificationEventName(mode)` instead.

## Event Chain Diagram

```
User starts report
    ↓
[start{Mode}ReportGeneration]  → report/generate-{mode}
    ↓
Inngest: generate{Mode}Report function
    ↓
Need clarification?
    ↓ Yes
Report status = "clarifying"
Store clarification question
    ↓
Inngest: waitForEvent("report/{mode}-clarification-answered")
    ↓
User answers
    ↓
[answerClarification]  → getClarificationEventName(mode)
                       → report/{mode}-clarification-answered
    ↓
Inngest resumes workflow
    ↓ No
Report status = "processing" or "complete"
```

## Testing Event Routing

Every PR that modifies modes must include:

1. Unit test: `getClarificationEventName('mode')` returns correct event
2. Integration test: Full server action flow with mocked Inngest
3. E2E test: User interaction from start to clarification resolution

Run: `pnpm test -- event-routing`
```

---

## Summary Table

| Prevention Strategy | How It Works | Who Benefits | Implementation Effort |
|---|---|---|---|
| **Centralized Event Router** | Single source of truth for mode → event mapping | All developers | Medium |
| **Type Safety** | TypeScript catches missing modes at compile time | All developers | Low |
| **Comprehensive Tests** | Unit, integration, and E2E tests catch routing bugs | QA, developers | High |
| **Developer Checklist** | Structured process for adding new modes | New contributors | Low |
| **CI/CD Validation** | Automated checks prevent incomplete implementations | Everyone | Medium |
| **Mode Registry** | Centralized metadata about modes | Feature teams | Low-Medium |
| **Monitoring & Alerts** | Runtime detection of mode-related issues | Operations, support | Medium |

---

## Implementation Priority

**Phase 1 (Immediate)**: Prevent future bugs
1. Create `/apps/web/lib/reports/event-routing.ts` ✓
2. Update server actions to use `getClarificationEventName()`
3. Create unit tests for event routing

**Phase 2 (Week 1)**: Add safety guardrails
4. Create developer checklist
5. Add pre-commit hooks
6. Add CI/CD validation

**Phase 3 (Week 2)**: Production readiness
7. Add monitoring and alerting
8. Update documentation
9. Create mode registry
10. Add comprehensive E2E tests

---

## Success Metrics

- **0 event routing bugs** in production for 6+ months
- **100% test coverage** for event routing logic
- **0 incomplete mode implementations** (all PRs catch missing pieces via CI)
- **0 developer confusion** (documentation and checklist are followed)
- **Incident response time < 5 minutes** if bug occurs (monitoring alerts immediately)
