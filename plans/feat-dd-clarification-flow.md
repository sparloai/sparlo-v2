# feat: Add Clarification Flow to Due Diligence Reports

## Overview

Add the same clarification flow architecture that exists in the hybrid report flow to the Due Diligence (DD) flow. This enables AN0-M to request clarification from users during DD report generation, improving report quality for investor-focused analysis.

**Critical Constraint**: The DD flow is working and must not be broken. Changes will be implemented in two careful phases with testing between each.

## Problem Statement

Currently, the hybrid flow has a clarification step where:
1. User submits question → AN0-M evaluates if clarification is needed
2. If yes: User sees waiting screen → clarification question appears → user answers → flow continues
3. If no: Waiting screen redirects to all reports page

The DD flow lacks this capability. AN0-M in DD mode cannot ask clarifying questions, which may result in lower quality due diligence reports when input is ambiguous or incomplete.

## Proposed Solution

**Two-phase approach** to minimize risk:

1. **Phase 1: Infrastructure** - Duplicate the clarification architecture to DD flow without enabling clarification prompts. Verify DD flow still works identically.

2. **Phase 2: Enable Clarification** - Add clarification prompt capability to AN0-M when running in DD mode. Test full clarification flow.

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DD CLARIFICATION FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User submits DD request                                        │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐                                            │
│  │ DD0-M: Extract  │                                            │
│  │ claims from     │                                            │
│  │ startup data    │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ AN0-M: Problem Framing                                  │    │
│  │                                                          │    │
│  │  needs_clarification = true?                            │    │
│  │       │              │                                   │    │
│  │      YES            NO                                   │    │
│  │       │              │                                   │    │
│  │       ▼              └──────────────────────────────────┼────┤
│  │  ┌─────────────┐                                        │    │
│  │  │ Store in DB │                                        │    │
│  │  │ status:     │                                        │    │
│  │  │ clarifying  │                                        │    │
│  │  └──────┬──────┘                                        │    │
│  │         │                                               │    │
│  │         ▼                                               │    │
│  │  ┌─────────────────┐                                    │    │
│  │  │ step.waitFor    │◄── report/dd-clarification-answered│    │
│  │  │ Event (24h)     │                                    │    │
│  │  └──────┬──────────┘                                    │    │
│  │         │                                               │    │
│  │         ▼                                               │    │
│  │  ┌─────────────┐                                        │    │
│  │  │ Re-run AN0-M│                                        │    │
│  │  │ with answer │                                        │    │
│  │  └──────┬──────┘                                        │    │
│  │         │                                               │    │
│  └─────────┼───────────────────────────────────────────────┘    │
│            │                                                     │
│            ▼                                                     │
│  ┌─────────────────┐                                            │
│  │ AN1.5-M →       │                                            │
│  │ AN1.7-M →       │                                            │
│  │ AN2-M →         │                                            │
│  │ AN3-M →         │                                            │
│  │ DD3-M →         │                                            │
│  │ DD3.5-M →       │                                            │
│  │ DD4-M →         │                                            │
│  │ DD5-M           │                                            │
│  └─────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

Based on the existing hybrid implementation, these decisions align with established patterns:

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Event name | `report/dd-clarification-answered` | Follows hybrid pattern: `report/hybrid-clarification-answered` |
| Timeout | 24 hours | Matches hybrid flow |
| DB field | `clarifications` JSON array (nullable) | Same schema as hybrid |
| Mode detection | `reportType: 'dd'` in report_data | Already exists in DD reports |
| current_step during clarification | Stays `an0-m` | Consistent with hybrid behavior |

### Implementation Phases

#### Phase 1: Infrastructure (No Breaking Changes)

**Goal**: Add all the plumbing without enabling clarification. DD flow should work identically after this phase.

**Changes**:

1. **Event Schema** (`/apps/web/lib/inngest/client.ts`)
   - Add `DDClarificationAnsweredEventSchema`
   - Add `'report/dd-clarification-answered'` to Events type

2. **Inngest Function** (`/apps/web/lib/inngest/functions/generate-dd-report 2.ts`)
   - Add clarification handling after AN0-M step (but AN0-M will always return `needs_clarification: false` for now)
   - Add `step.waitForEvent` call (will never trigger in Phase 1)
   - Add helper functions for storing/retrieving clarification state

3. **API Route** (`/apps/web/app/api/reports/[id]/clarify/route.ts`)
   - Add `mode === 'dd'` branch to send correct event name
   - Verify authorization works for DD reports

4. **ProcessingScreen** (`/apps/web/app/app/_components/processing-screen.tsx`)
   - Verify existing clarification UI works for DD reports (it should - it's report-type agnostic)
   - Add any DD-specific messaging if needed

**Verification**:
- Run existing DD flow end-to-end → should complete without clarification
- Run hybrid flow → should still work with clarification
- Check all tests pass

#### Phase 2: Enable Clarification Prompts

**Goal**: Enable AN0-M to request clarification when running in DD mode.

**Changes**:

1. **AN0-M Prompt Modification** (`/apps/web/lib/llm/prompts/an0-problem-framing.ts`)
   - Add DD-specific clarification triggers
   - Focus on investor-relevant clarifications (e.g., "What's the target market size?", "What's the competitive landscape?")

2. **Mode Detection**
   - Pass `reportType` to AN0-M step
   - Use different clarification criteria for DD vs hybrid

**Verification**:
- Create DD report with ambiguous input → should trigger clarification
- Answer clarification → should continue to completion
- Test timeout scenario (don't answer for 24h+)
- Run hybrid flow → still works unchanged

## File Changes Summary

### Phase 1 Files

| File | Change Type | Description |
|------|-------------|-------------|
| `apps/web/lib/inngest/client.ts:130` | Edit | Add `DDClarificationAnsweredEventSchema` and event type |
| `apps/web/lib/inngest/functions/generate-dd-report 2.ts:280-350` | Edit | Add clarification handling after AN0-M |
| `apps/web/app/api/reports/[id]/clarify/route.ts:93-102` | Edit | Add `mode === 'dd'` branch |

### Phase 2 Files

| File | Change Type | Description |
|------|-------------|-------------|
| `apps/web/lib/llm/prompts/an0-problem-framing.ts` | Edit | Add DD-specific clarification criteria |
| `apps/web/lib/inngest/functions/generate-dd-report 2.ts` | Edit | Pass reportType to AN0-M |

## Acceptance Criteria

### Functional Requirements

- [ ] DD reports can trigger clarification when AN0-M determines it's needed
- [ ] Users see clarification question on ProcessingScreen
- [ ] Users can submit clarification answer via form
- [ ] After answer, DD report continues processing
- [ ] If no clarification needed, DD flow works exactly as before
- [ ] If timeout (24h), report marked appropriately
- [ ] Hybrid flow continues to work unchanged

### Non-Functional Requirements

- [ ] No breaking changes to existing DD reports
- [ ] Clarification answer submission < 2s latency
- [ ] ProcessingScreen correctly detects clarification state
- [ ] All existing DD tests pass
- [ ] All existing hybrid tests pass

### Quality Gates

- [ ] Phase 1 complete and tested before Phase 2 begins
- [ ] Manual QA of full DD flow with clarification
- [ ] Manual QA of hybrid flow (regression)
- [ ] Code review approval

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| DD flow still works | 100% | Existing tests pass |
| Hybrid flow still works | 100% | Existing tests pass |
| Clarification renders | 100% | Manual testing |
| Answer submission works | 100% | Manual testing |

## Risk Analysis & Mitigation

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing DD flow | Users can't generate DD reports | Phase 1 adds infrastructure only; verify DD works before Phase 2 |
| Breaking existing hybrid flow | Users can't generate hybrid reports | Test hybrid flow after every change; use separate event names |
| Inngest function timeout | Reports stuck forever | Use 24h timeout on waitForEvent; monitor for stuck reports |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Event name routing errors | Clarification answers not received | Use typed event schemas; test event routing explicitly |
| ProcessingScreen state bugs | Wrong UI shown | Add specific DD tests for all ProcessingScreen states |
| AN0-M prompt regression | Wrong clarification questions | Test AN0-M in both DD and hybrid modes |

## Testing Plan

### Phase 1 Tests

```
✓ DD report creation → completes without clarification (regression)
✓ Hybrid report with clarification → works unchanged (regression)
✓ DD clarification event schema validation
✓ API route handles DD mode correctly
```

### Phase 2 Tests

```
✓ DD report with ambiguous input → triggers clarification
✓ User answers clarification → report continues
✓ User doesn't answer (timeout) → appropriate status
✓ Multiple clarification rounds (if AN0-M asks again)
✓ DD report with clear input → no clarification (happy path)
```

### Manual QA Checklist

- [ ] Create DD report with clear input → completes normally
- [ ] Create DD report with vague input → clarification appears
- [ ] Answer clarification question → processing resumes
- [ ] Close tab during clarification → return later → can still answer
- [ ] Create hybrid report → still works with clarification
- [ ] Create hybrid report without clarification → redirects to /app

## MVP Implementation

### Phase 1: generate-dd-report 2.ts (Infrastructure)

```typescript
// After DD0-M completes, before continuing to AN1.5-M
// Location: apps/web/lib/inngest/functions/generate-dd-report 2.ts

// Step: Run AN0-M
let an0mResult = await step.run('an0-m-problem-framing', async () => {
  // ... existing AN0-M call
  return runAN0M({
    input: dd0mResult.extracted_claims,
    reportType: 'dd', // Add mode detection
  });
});

// NEW: Handle clarification (Phase 1 - infrastructure only)
// Type guard: check both flag AND that request exists
if (an0mResult.needs_clarification === true && an0mResult.clarification_request) {
  const clarificationRequest = an0mResult.clarification_request; // Safe after guard

  // Store clarification in database
  await step.run('store-dd-clarification', async () => {
    await updateProgress({
      status: 'clarifying',
      clarifications: [{
        question: clarificationRequest.question,
        context: clarificationRequest.context,
        options: clarificationRequest.options,
        allows_freetext: clarificationRequest.allows_freetext,
        freetext_prompt: clarificationRequest.freetext_prompt,
        askedAt: new Date().toISOString(),
      }],
    });
  });

  // Wait for user answer (up to 24 hours)
  const clarificationEvent = await step.waitForEvent(
    'wait-for-dd-clarification',
    {
      event: 'report/dd-clarification-answered',
      match: 'data.reportId',
      timeout: '24h',
    }
  );

  // Type-safe null check
  if (!clarificationEvent?.data) {
    // Timeout - mark as expired
    await step.run('handle-dd-clarification-timeout', async () => {
      await updateProgress({
        status: 'expired',
        errorMessage: `Due diligence report expired: No clarification response received within 24 hours for report ${reportId}. Please start a new report.`,
      });
    });
    return { status: 'timeout', reportId } as const;
  }

  // Re-run AN0-M with clarification answer
  an0mResult = await step.run('an0-m-with-clarification', async () => {
    return runAN0M({
      input: dd0mResult.extracted_claims,
      reportType: 'dd',
      clarificationAnswer: clarificationEvent.data.answer,
    });
  });
}

// Continue with AN1.5-M (existing code)
```

### Phase 1: inngest/client.ts (Event Schema)

```typescript
// Location: apps/web/lib/inngest/client.ts:28-31

// Add DD clarification event schema
export const DDClarificationAnsweredEventSchema = z.object({
  reportId: z.string().uuid(),
  answer: z.string().min(1),
});

// Location: apps/web/lib/inngest/client.ts:118-135
// Add to Events type
type Events = {
  // ... existing events

  // DD mode
  'report/generate-dd': { data: DDReportGenerateEvent };
  'report/dd-clarification-answered': { data: z.infer<typeof DDClarificationAnsweredEventSchema> }; // NEW

  // ... rest
};
```

### Phase 1: clarify/route.ts (API Endpoint)

```typescript
// Location: apps/web/app/api/reports/[id]/clarify/route.ts:93-102

// Update event name selection to include DD mode
let eventName = 'report/clarification-answered';  // default
if (mode === 'discovery') {
  eventName = 'report/discovery-clarification-answered';
} else if (mode === 'hybrid') {
  eventName = 'report/hybrid-clarification-answered';
} else if (mode === 'dd') {  // NEW
  eventName = 'report/dd-clarification-answered';
}
```

## References

### Internal References

- Hybrid clarification flow: `apps/web/lib/inngest/functions/generate-hybrid-report 2.ts:266-434`
- AN0-M prompt & schema: `apps/web/lib/llm/prompts/an0-problem-framing.ts:476-520`
- ProcessingScreen: `apps/web/app/app/_components/processing-screen.tsx:108-149`
- Event schemas: `apps/web/lib/inngest/client.ts:118-135`
- Clarify API route: `apps/web/app/api/reports/[id]/clarify/route.ts:93-102`
- DD entry point: `apps/web/app/app/reports/dd/new/page.tsx`
- DD server action: `apps/web/app/app/_lib/server/dd-reports-server-actions.ts:136`

### Best Practices Applied

- **Strangler Fig Pattern**: Phase 1 adds infrastructure alongside existing code; Phase 2 enables new behavior
- **Feature Flag Ready**: Can be disabled by skipping clarification check in AN0-M
- **Event-Driven Architecture**: Uses Inngest step.waitForEvent for user input
- **Parallel Testing**: Test both DD and hybrid flows after each change

### Related Work

- Original DD flow implementation
- Hybrid flow clarification (reference implementation)
- Discovery flow clarification (similar pattern)
