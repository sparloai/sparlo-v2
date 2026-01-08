# Event Routing Bug Prevention Strategy

This directory contains comprehensive prevention strategies for the DD clarification event routing bug that occurred when DD mode was added.

## What Happened

When due diligence (DD) mode was added to the system, the `answerClarification` server action wasn't updated to route clarification answers to the correct Inngest event (`report/dd-clarification-answered`). This caused DD mode clarifications to fail.

## Why It Happened

Event routing logic was scattered across multiple files:
- `/apps/web/lib/inngest/client.ts` - Event definitions
- `/apps/web/app/app/_lib/server/sparlo-reports-server-actions.ts` - Routing logic
- `/apps/web/app/app/_lib/server/discovery-reports-server-actions.ts` - Discovery action
- `/apps/web/app/app/_lib/server/hybrid-reports-server-actions.ts` - Hybrid action
- `/apps/web/app/app/_lib/server/dd-reports-server-actions.ts` - DD action (but routing not updated!)

When adding a new mode, developers had to remember to update multiple locations. If they forgot one file, the feature silently failed.

## Files in This Directory

### Prevention Strategies Documentation

1. **SUMMARY.md** (START HERE)
   - Executive summary of the problem and solutions
   - 1-page overview of prevention strategies
   - Quick reference table showing what prevents each bug scenario

2. **event-routing-bug-prevention.md** (COMPREHENSIVE)
   - 4,000+ word detailed analysis
   - 4 main prevention strategies
   - Code examples for each strategy
   - Testing approach with test case suggestions
   - Type safety improvements
   - Automated CI/CD validation
   - Monitoring and alerting strategy

3. **IMPLEMENTATION_GUIDE.md** (HOW-TO)
   - Step-by-step implementation instructions
   - File-by-file changes needed
   - Validation commands to run
   - FAQ and troubleshooting

### Developer Resources

4. **../../../checklists/adding-new-report-mode.md**
   - 10-step checklist for adding new modes
   - Prevents human error through structured process
   - Includes validation commands
   - Covers testing requirements

## Implementation Artifacts Included

### Code Files (Ready to Use)

```
/apps/web/lib/reports/event-routing.ts
  ↳ Centralized event routing with clear error messages
  ↳ Key functions: getClarificationEventName(), getSupportedReportModes()

/apps/web/__tests__/lib/reports/event-routing.test.ts
  ↳ 40+ unit tests covering all scenarios
  ↳ Prevents regression of this bug
```

## Prevention Strategies at a Glance

### 1. Centralized Event Router
**What**: Single source of truth for `mode → event` mapping
**Where**: `/apps/web/lib/reports/event-routing.ts`
**Benefit**: No scattered hardcoded mappings, automatic error messages

### 2. Type Safety
**What**: TypeScript enforces all modes have routing entries
**How**: Use `Record<ReportMode, string>` pattern
**Benefit**: Compile-time error detection, prevents incomplete implementations

### 3. Comprehensive Testing
**What**: Unit + Integration + E2E tests validate routing
**Where**: Multiple `__tests__/` directories + E2E folder
**Benefit**: Catches bugs before production, forces completeness

### 4. Developer Checklist
**What**: Structured 10-step process for adding modes
**Where**: `/docs/checklists/adding-new-report-mode.md`
**Benefit**: Makes process obvious, reduces human error, enables junior developers

## Quick Start: Adding a New Report Mode

1. Read: `/docs/checklists/adding-new-report-mode.md`
2. Follow all 10 steps
3. Pay special attention to step 3: Update event-routing.ts (this is what was missed before!)
4. Run validation commands before submitting

## Validation Checklist

After implementing prevention strategies, verify:

- [ ] `/apps/web/lib/reports/event-routing.ts` exists and is centralized
- [ ] `getClarificationEventName()` function is used throughout (not hardcoded events)
- [ ] Unit tests exist and pass: `pnpm test event-routing.test.ts`
- [ ] Integration tests validate server actions
- [ ] E2E tests cover full clarification flow
- [ ] Developer checklist is documented and available
- [ ] Team has been trained on new process
- [ ] Pre-commit hooks validate event routing (optional)
- [ ] CI/CD validates all modes have routing (optional)

## Success Metrics

After full implementation, target:

- **0 event routing bugs** for 6+ months
- **0 incomplete mode implementations** (all caught by tests/CI)
- **100% of new modes follow checklist** (process is clear)
- **< 5 min incident response** (if bug occurs, monitoring catches it)

## Key Insights

### The Root Cause
Scattered responsibility: Event routing defined in one place, used in multiple places, with no enforcement that new modes update all locations.

### The Solution Pattern
Centralize the authority (event-routing.ts) + Enforce with types (TypeScript) + Validate with tests (40+ unit tests) + Guide with process (10-step checklist)

### Why It Works
- **Clarity**: Developers see the single source of truth
- **Enforcement**: Compiler + tests force completeness
- **Guidance**: Checklist makes the process explicit
- **Scalability**: Works same way for mode 1 or mode 20

## Documentation Structure

```
Prevention Strategy (this directory)
├── README.md (you are here)
├── SUMMARY.md (1-page executive overview)
├── event-routing-bug-prevention.md (comprehensive 4,000+ word strategy)
└── IMPLEMENTATION_GUIDE.md (step-by-step how-to)

Checklists
├── adding-new-report-mode.md (10-step developer checklist)

Code Examples
├── event-routing.ts (centralized router)
├── event-routing.test.ts (40+ unit tests)
└── (integration tests and E2E tests - templates in guides)
```

## For Different Audiences

**Engineering Manager**: Read SUMMARY.md (5 min) - Understand what prevented the bug and why it works

**Team Lead**: Read IMPLEMENTATION_GUIDE.md (10 min) - Understand how to implement and rollout strategy

**Developer Adding a Mode**: Read adding-new-report-mode.md checklist (2 min) - Follow the steps

**Quality Assurance**: Read event-routing-bug-prevention.md section 2 (5 min) - Understand test strategy

**New Team Member**: Start with SUMMARY.md, then follow checklist - Learn the pattern

## Related Files

- `/apps/web/lib/types.ts` - Define `ReportMode` type
- `/apps/web/lib/inngest/client.ts` - Event schemas
- `/apps/web/app/app/_lib/server/sparlo-reports-server-actions.ts` - Use `getClarificationEventName()`
- `/docs/REPORT_MODES.md` - Overall report modes architecture

## Questions?

- **"How do I add a new mode?"** → Read `/docs/checklists/adding-new-report-mode.md`
- **"Why do we need all these tests?"** → See SUMMARY.md table: "How Each Prevention Strategy Prevents the Bug"
- **"What's the one most important thing?"** → Centralized event router in event-routing.ts
- **"Can we skip step X from the checklist?"** → No, all 10 items exist because the bug happened when one was missed

## Success Story (After Implementation)

When the next mode is added:
1. Developer follows 10-step checklist ✓
2. Step 3: Updates event-routing.ts (explicit, hard to skip)
3. Step 8: Writes tests
4. Pre-commit hook runs tests: PASS ✓
5. CI/CD validates: PASS ✓
6. E2E tests: PASS ✓
7. Code reviewer checks checklist: All complete ✓
8. Deploy: Zero risk of routing bug

Compare to DD bug:
- Developer forgets step in 3 places
- Feature silently breaks
- Users report issue
- Incident response
- Post-mortem

**Prevention strategy difference: Proactive catching vs. reactive fire-fighting**

---

Last Updated: January 2026
Prevention Strategy Status: Ready for Implementation
Confidence Level: High (all prevention layers validate each other)
