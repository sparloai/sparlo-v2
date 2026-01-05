---
status: pending
priority: p3
issue_id: "216"
tags: [code-review, agent-native, api]
dependencies: []
---

# Add Agent-Native API for Analysis Mode Selection

## Problem Statement

The tabbed analysis mode selection feature has no programmatic API. Mode selection state is trapped in client-side React state and URL parameters. An AI agent cannot:
- Query which mode is currently selected
- Switch between modes programmatically
- Discover available analysis modes and their capabilities
- Submit analysis requests for a specific mode without UI

If a user said "switch to due diligence mode" or "what analysis modes are available?", the agent has no way to help.

## Findings

**Current State:**
- Mode state managed in `useAnalysisMode` hook (client-only)
- URL parameter `?mode=technical|dd` (requires browser)
- LocalStorage `sparlo-analysis-mode` (browser-only)
- No REST API endpoints for mode management
- Server actions exist but not wrapped in API routes

**Capability Map:**
| Action | Agent Access |
|--------|-------------|
| Switch modes | ❌ None |
| Query current mode | ❌ None |
| Discover available modes | ❌ None |
| Submit technical analysis | ⚠️ Server action only |
| Submit DD analysis | ⚠️ Server action only |

## Proposed Solutions

### Option 1: Add Mode Management API

**Approach:** Create REST endpoints for mode operations.

```typescript
// GET /api/reports/modes
// Returns: { modes: [...], current: 'technical' }

// POST /api/reports/modes
// Body: { mode: 'technical' | 'dd' }
// Sets user preference

// POST /api/reports/technical
// Wraps startReportGeneration server action

// POST /api/reports/dd
// Wraps startDDReportGeneration server action
```

**Pros:**
- Full agent parity
- RESTful, standard approach
- Works with external tools

**Cons:**
- New endpoints to maintain
- Need to persist mode preference server-side

**Effort:** 3-4 hours

**Risk:** Low

---

### Option 2: System Prompt Documentation Only

**Approach:** Document capabilities in agent system prompt without API changes.

```markdown
# Analysis Modes
Technical: For engineering problems
DD: For startup evaluation
Agent cannot switch modes - must instruct user
```

**Pros:**
- Zero code changes

**Cons:**
- Agent cannot act, only inform
- Poor user experience

**Effort:** 30 minutes

**Risk:** Low

---

### Option 3: MCP Tool Integration

**Approach:** Create MCP tool for mode management and submissions.

**Pros:**
- Native agent integration
- More powerful than REST

**Cons:**
- More complex implementation
- Requires MCP server setup

**Effort:** 4-6 hours

**Risk:** Medium

## Recommended Action

*To be filled during triage.*

## Technical Details

**Files to create:**
- `apps/web/app/api/reports/modes/route.ts`
- `apps/web/app/api/reports/technical/route.ts` (optional wrapper)
- `apps/web/app/api/reports/dd/route.ts` (optional wrapper)

**Related files:**
- `apps/web/app/home/(user)/reports/new/_lib/use-analysis-mode.ts` - current client implementation
- `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`
- `apps/web/app/home/(user)/_lib/server/dd-reports-server-actions.ts`
- `apps/web/app/api/reports/route.ts` - existing reports API

## Acceptance Criteria

- [ ] Agent can query available modes
- [ ] Agent can query current mode preference
- [ ] Agent can set mode preference
- [ ] Agent can submit analysis via API
- [ ] API documented in system prompt
- [ ] Tests pass

## Work Log

### 2026-01-04 - Code Review Finding

**By:** Claude Code (agent-native-reviewer agent)

**Actions:**
- Analyzed mode selection implementation
- Mapped current capabilities to agent access
- Identified gaps in programmatic access

**Learnings:**
- UI-first development without agent parity planning
- Server actions exist but need API wrappers
- Mode state has no server-side persistence

## Notes

- P3 priority - nice to have for agent users
- Could combine with existing `/api/reports` endpoint
- Consider user preferences table for mode persistence
