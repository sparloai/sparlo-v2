# Checklist: Adding a New Report Mode

When adding a new report mode (e.g., `foo`), follow this checklist to prevent routing bugs.

## 1. Define the Mode

- [ ] Add mode to `ReportMode` type in `/apps/web/lib/types.ts`
  ```typescript
  export type ReportMode = 'discovery' | 'hybrid' | 'dd' | 'foo';
  ```

## 2. Event Definitions

- [ ] Add event schema to `/apps/web/lib/inngest/client.ts`
  ```typescript
  export const FooReportGenerateEventSchema = z.object({
    reportId: z.string().uuid(),
    accountId: z.string().uuid(),
    userId: z.string().uuid(),
    // ... foo-specific fields
    conversationId: z.string(),
  });

  export const FooClarificationAnsweredEventSchema = z.object({
    reportId: z.string().uuid(),
    answer: z.string().min(1),
  });
  ```

- [ ] Add event type to `Events` type record in same file
  ```typescript
  type Events = {
    // ... existing events
    'report/generate-foo': { data: FooReportGenerateEvent };
    'report/foo-clarification-answered': { data: FooClarificationAnsweredEvent };
  };
  ```

## 3. Event Routing (CRITICAL - This is where the bug occurred)

- [ ] **Update `/apps/web/lib/reports/event-routing.ts`** - This is your most important step!
  ```typescript
  const CLARIFICATION_EVENT_MAP: Record<ReportMode, string> = {
    discovery: 'report/discovery-clarification-answered',
    hybrid: 'report/hybrid-clarification-answered',
    dd: 'report/dd-clarification-answered',
    foo: 'report/foo-clarification-answered',  // ADD THIS LINE - DO NOT SKIP
  };
  ```

- [ ] Verify `getClarificationEventName('foo')` returns `'report/foo-clarification-answered'`
  - Run: `node -e "import('./lib/reports/event-routing.ts').then(m => console.log(m.getClarificationEventName('foo')))"`

- [ ] Verify the function throws an error with helpful message if you use unknown mode
  - Run unit tests to confirm

## 4. Server Actions

- [ ] Create `/apps/web/app/app/_lib/server/foo-reports-server-actions.ts`
  - Copy structure from `hybrid-reports-server-actions.ts`
  - [ ] Implement `startFooReportGeneration()`
  - [ ] Set `report_data.mode = 'foo'` in database insert
  - [ ] Send `report/generate-foo` event to Inngest
  - [ ] Implement `answerFooClarification()` if needed (can reuse generic `answerClarification()`)

- [ ] **Verify** `answerClarification()` correctly routes foo mode
  - It should now work automatically since it uses `getClarificationEventName()`
  - But add a test to verify!

## 5. Inngest Handlers

- [ ] Create `/apps/web/lib/inngest/functions/generate-foo-report.ts`
  - [ ] Implement handler for `report/generate-foo` event
  - [ ] Implement `step.waitForEvent('report/foo-clarification-answered')` if needed
  - [ ] Implement cancellation handler for `report/cancel.requested`
  - Copy from `generate-hybrid-report.ts` or `generate-dd-report.ts` as template

## 6. Database Schema (if needed)

- [ ] Add any foo-specific columns to `sparlo_reports` table
  - [ ] Create migration: `supabase/migrations/TIMESTAMP_add_foo_report_fields.sql`
  - [ ] After applying migration, regenerate types: `pnpm supabase:web:typegen`

## 7. UI Components

- [ ] Create report start form: `/apps/web/app/app/reports/_components/foo-report-start.tsx`
- [ ] Create report display: `/apps/web/app/app/reports/[id]/_components/foo-report-display.tsx`
- [ ] Add navigation link in `/apps/web/config/personal-account-navigation.config.tsx` or team config

## 8. Tests (REQUIRED - This prevents the bug from happening again)

- [ ] Add unit tests for event routing
  - [ ] File: `/apps/web/__tests__/lib/reports/event-routing.test.ts`
  - [ ] Test: `getClarificationEventName('foo')` returns `'report/foo-clarification-answered'`
  - [ ] Test: `isSupportedReportMode('foo')` returns `true`
  - [ ] Test: All supported modes have unique events

- [ ] Add integration test for clarification flow
  - [ ] File: `/apps/web/__tests__/app/app/_lib/server/clarification-routing.integration.test.ts`
  - [ ] Test: Start foo report in "clarifying" status
  - [ ] Test: Call `answerClarification()`
  - [ ] Test: Verify `report/foo-clarification-answered` event was sent to Inngest

- [ ] Add E2E test
  - [ ] File: `/apps/e2e/tests/clarification-flow.spec.ts`
  - [ ] Test: Full user flow: start foo report → receive clarification → answer → complete

## 9. Documentation

- [ ] Update `/docs/REPORT_MODES.md` to document foo mode
- [ ] Add JSDoc comments to new functions
- [ ] Update this checklist if the process changed

## 10. Final Review Checklist

Before merging PR, verify **all** of the following:

### Code Quality
- [ ] `pnpm typecheck` passes (no TypeScript errors)
- [ ] `pnpm lint:fix` runs without errors
- [ ] No hardcoded event names (use `getClarificationEventName()`)

### Tests
- [ ] `pnpm test` passes (all tests green)
- [ ] Unit tests for event routing pass
- [ ] Integration tests for clarification pass
- [ ] E2E tests for foo mode pass: `pnpm e2e --grep "foo mode"`

### Safety Checks
- [ ] Mode added to `ReportMode` type
- [ ] Mode added to `CLARIFICATION_EVENT_MAP` in event-routing.ts
- [ ] Mode added to Inngest event schemas
- [ ] Mode added to Events type record
- [ ] Server action uses `getClarificationEventName()` (not hardcoded)
- [ ] Inngest handler listens to correct event

### Documentation
- [ ] README/documentation updated
- [ ] JSDoc comments on all public functions
- [ ] This checklist verified complete

---

## Quick Validation Commands

Run these commands to validate your implementation before submitting:

```bash
# Verify type safety
pnpm typecheck

# Run event routing tests specifically
pnpm test event-routing.test.ts

# Run clarification tests
pnpm test clarification-routing.integration.test.ts

# Run E2E tests for foo mode
pnpm e2e --grep "foo mode"

# Check getSupportedReportModes() includes foo
node -e "import('./lib/reports/event-routing.ts').then(m => console.log('Supported modes:', m.getSupportedReportModes()))"

# Verify getClarificationEventName works for foo
node -e "import('./lib/reports/event-routing.ts').then(m => console.log('Foo event:', m.getClarificationEventName('foo')))"
```

---

## Prevention Tips

These are the mistakes that caused the original bug:

- ✅ **DO**: Use `getClarificationEventName(mode)` instead of hardcoding
- ✅ **DO**: Update `event-routing.ts` immediately when adding mode
- ✅ **DO**: Write tests for your new mode
- ✅ **DO**: Run the validation commands above

- ❌ **DON'T**: Add a new server action without checking event routing
- ❌ **DON'T**: Skip the event-routing.ts update (it's easy to forget!)
- ❌ **DON'T**: Trust that "similar code will work" - test it
- ❌ **DON'T**: Commit without running validation commands

---

## Getting Help

If you get stuck:

1. **Event routing question**: See `/docs/REPORT_MODES.md`
2. **Example implementation**: Copy from `hybrid` mode (most generic)
3. **DD mode complexities**: See `dd` mode if your mode needs special handling
4. **Still confused**: Ask in code review - better to ask than ship a bug!

---

## After You Submit

After the PR is merged:

- [ ] CI/CD passes (pre-commit hooks and GitHub Actions)
- [ ] Monitor Inngest dashboard for events: `report/foo-clarification-answered`
- [ ] Check logs for any mode-related errors for first 24 hours
- [ ] Get approval from code reviewer who understands event routing

---

## Success Criteria

Your implementation is complete when:

1. ✅ All tests pass
2. ✅ No TypeScript errors (`pnpm typecheck`)
3. ✅ E2E test demonstrates full clarification flow
4. ✅ Code reviewer approves (specifically confirms checklist items 1-10)
5. ✅ New mode appears in `getSupportedReportModes()` output
6. ✅ Inngest dashboard shows events being sent correctly

**Most Important**: Item #3 (Event Routing) has been updated. If you skip this, your feature WILL break.
